import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { callLLM } from "@/lib/claude/providers";
import {
  authenticateApiKey,
  checkApiRateLimit,
  hasEnoughApiCredits,
  recordApiUsage,
  refundApiCredits,
  reserveApiCredits,
} from "@/lib/developer-api/server";
import { calculateApiCostMicroUsd, estimateTokenCount, formatApiUsd } from "@/lib/developer-api/pricing";

export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const ChatSchema = z.object({
  model: z.string().trim().max(80).optional().default("evaldam-model"),
  messages: z.array(MessageSchema).min(1).max(16),
  system: z.string().trim().max(4000).optional().default(""),
  max_tokens: z.coerce.number().int().min(1).max(2000).optional().default(800),
  temperature: z.coerce.number().min(0).max(1).optional().default(0.3),
});

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const adminClient = createAdminClient();
  const auth = await authenticateApiKey(adminClient, request.headers.get("authorization"));

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error, request_id: requestId }, { status: auth.status });
  }

  const rateLimit = await checkApiRateLimit(adminClient, auth.key.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        request_id: requestId,
        limit: rateLimit.limit,
      },
      { status: 429 }
    );
  }

  let payload: z.infer<typeof ChatSchema>;
  try {
    payload = ChatSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body", request_id: requestId }, { status: 400 });
  }

  const estimatedInputTokens = estimateTokenCount([
    payload.system,
    ...payload.messages.map((message) => message.content),
  ].join("\n"));
  const estimatedMaxTokens = estimatedInputTokens + payload.max_tokens;
  const creditCheck = await hasEnoughApiCredits(adminClient, auth.key.user_id, payload.model, estimatedMaxTokens);
  if (!creditCheck.pricingConfigured) {
    return NextResponse.json(
      {
        error: "API pricing is not configured",
        request_id: requestId,
      },
      { status: 503 }
    );
  }
  if (!creditCheck.allowed) {
    return NextResponse.json(
      {
        error: "Insufficient API credits",
        request_id: requestId,
        balance: formatApiUsd(creditCheck.balance),
        required: formatApiUsd(creditCheck.required),
      },
      { status: 402 }
    );
  }

  const reservation = await reserveApiCredits(adminClient, auth.key.user_id, creditCheck.required);
  if (!reservation.ok) {
    return NextResponse.json(
      {
        error: "Insufficient API credits",
        request_id: requestId,
      },
      { status: 402 }
    );
  }

  let answer: string;
  try {
    answer = await callLLM(payload.messages, {
      system: payload.system,
      maxTokens: payload.max_tokens,
      temperature: payload.temperature,
      useCase: "report",
    });
  } catch (error) {
    await refundApiCredits(
      adminClient,
      auth.key.user_id,
      creditCheck.required,
      "API credit reservation refunded after failed request"
    );

    await recordApiUsage({
      adminClient,
      userId: auth.key.user_id,
      apiKeyId: auth.key.id,
      model: creditCheck.pricing.model,
      requestId,
      costMicroUsd: 0,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Model request failed",
    }).catch((usageError) => {
      console.error("Failed to record failed Evaldam API usage:", usageError);
    });

    return NextResponse.json(
      { error: "Model request failed", request_id: requestId },
      { status: 500 }
    );
  }

  const outputTokens = estimateTokenCount(answer);
  const calculatedCostMicroUsd = calculateApiCostMicroUsd(estimatedInputTokens + outputTokens) || creditCheck.required;
  const costMicroUsd = Math.min(calculatedCostMicroUsd, creditCheck.required);
  const unusedReservationMicroUsd = creditCheck.required - costMicroUsd;

  await refundApiCredits(
    adminClient,
    auth.key.user_id,
    unusedReservationMicroUsd
  );

  await recordApiUsage({
    adminClient,
    userId: auth.key.user_id,
    apiKeyId: auth.key.id,
    model: creditCheck.pricing.model,
    requestId,
    costMicroUsd,
    status: "success",
    inputTokens: estimatedInputTokens,
    outputTokens,
  }).catch((error) => {
    console.error("Failed to record Evaldam API usage:", error);
  });

  return NextResponse.json({
    id: requestId,
    model: creditCheck.pricing.model,
    content: answer,
    usage: {
      cost: formatApiUsd(costMicroUsd),
      tokens: {
        input: estimatedInputTokens,
        output: outputTokens,
      },
      balance_before: formatApiUsd(creditCheck.balance),
      balance_after: formatApiUsd(Math.max(0, reservation.balance + unusedReservationMicroUsd)),
    },
  });
}
