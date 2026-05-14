import { createPrivateKey, randomUUID, sign } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trainingScenarios } from "@/app/training/scenarios";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

const RANGE = process.env.TRAINING_QUESTION_BANK_SHEET_RANGE || "'Training Questions'!A:W";

const ExpertAnswerSchema = z.object({
  rowNumber: z.number().int().positive(),
  questionId: z.string().min(1),
  scenarioId: z.string().min(1),
  question: z.string().min(1),
  expertName: z.string().min(2),
  expertEmail: z.string().email(),
  thoughtProcess: z.string().min(20),
  reasonIndianContext: z.string().min(20),
  answer: z.string().refine((value) => {
    const words = value.trim().split(/\s+/).filter(Boolean).length;
    return words >= 150 && words <= 300;
  }, "Answer must be between 150 and 300 words"),
});

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getGoogleAccessToken() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets service account env vars are missing");
  }

  const now = Math.floor(Date.now() / 1000);
  const unsignedJwt = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }))}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsignedJwt), createPrivateKey(privateKey));

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedJwt}.${base64Url(signature)}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token request failed: ${response.status}`);
  }

  const tokenData = await response.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Google token response did not include access_token");
  }

  return tokenData.access_token;
}

async function getSheetValues(accessToken: string, spreadsheetId: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(RANGE)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets read failed: ${response.status}`);
  }

  const data = await response.json() as { values?: string[][] };
  return data.values || [];
}

function getSheetNameFromRange(range: string) {
  const bangIndex = range.indexOf("!");
  return bangIndex >= 0 ? range.slice(0, bangIndex) : "'Training Questions'";
}

function buildExpertTrainingJson(payload: z.infer<typeof ExpertAnswerSchema>) {
  const scenario = trainingScenarios.find((item) => item.id === payload.scenarioId);
  const context = scenario
    ? `Context: ${scenario.title}\n\n${scenario.content}`
    : `Context scenario ID: ${payload.scenarioId}`;

  return JSON.stringify({
    messages: [
      {
        role: "system",
        content: "You are Evaldam AI, an expert in Indian startup finance and valuation.",
      },
      {
        role: "user",
        content: `${context}\n\n${payload.question}`,
      },
      {
        role: "assistant",
        content: [
          `Thought Process: ${payload.thoughtProcess}`,
          `Reason / Indian context: ${payload.reasonIndianContext}`,
          `Answer: ${payload.answer}`,
        ].join("\n\n"),
      },
    ],
  });
}

export async function GET(request: NextRequest) {
  try {
    const spreadsheetId = process.env.TRAINING_GOOGLE_SHEET_ID;
    const scenarioId = request.nextUrl.searchParams.get("scenarioId");

    if (!spreadsheetId || !scenarioId) {
      return NextResponse.json({ error: "Missing expert assignment" }, { status: 400 });
    }

    const accessToken = await getGoogleAccessToken();
    const values = await getSheetValues(accessToken, spreadsheetId);
    const pendingRows = values
      .map((row, index) => ({ row, rowNumber: index + 1 }))
      .filter(({ row }) => row[3] === scenarioId && row[14] === "pending_expert_answer");

    const selected = pendingRows[Math.floor(Math.random() * pendingRows.length)];
    const scenario = trainingScenarios.find((item) => item.id === scenarioId);

    if (!selected || !scenario) {
      return NextResponse.json({ question: null, scenario: scenario || null });
    }

    return NextResponse.json({
      scenario,
      question: {
        rowNumber: selected.rowNumber,
        questionId: selected.row[0],
        questionType: selected.row[6],
        question: selected.row[7],
      },
    });
  } catch (error) {
    logger.error("Expert question fetch failed", error);
    return NextResponse.json({ error: "Could not load expert question" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const spreadsheetId = process.env.TRAINING_GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Training survey storage is not configured yet" }, { status: 503 });
    }

    const payload = ExpertAnswerSchema.parse(await request.json());
    const accessToken = await getGoogleAccessToken();
    const trainingJson = buildExpertTrainingJson(payload);
    const answerId = `ans_${payload.questionId}_${randomUUID()}`;
    const answeredAt = new Date().toISOString();
    const updateRange = `${getSheetNameFromRange(RANGE)}!O${payload.rowNumber}:W${payload.rowNumber}`;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[
            "expert_answered",
            answerId,
            payload.expertName,
            payload.expertEmail.toLowerCase(),
            payload.thoughtProcess,
            payload.reasonIndianContext,
            payload.answer,
            answeredAt,
            trainingJson,
          ]],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Sheets update failed: ${response.status}`);
    }

    return NextResponse.json({ success: true, answerId });
  } catch (error) {
    logger.error("Expert answer submit failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid expert answer data", details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not submit expert answer" }, { status: 500 });
  }
}
