import { NextRequest, NextResponse } from "next/server";
import { createPrivateKey, sign } from "crypto";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

class TrainingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingConfigError";
  }
}

const questionSchema = z.string().refine((value) => {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return words >= 8 && words <= 26;
}, "Question must be between 8 and 26 words");

const QuestionSetSchema = z.object({
  what: questionSchema,
  how: questionSchema,
  why: questionSchema,
});

const TrainingSubmissionSchema = z.object({
  participant: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: z.string().min(1),
    institution: z.string().min(2),
    city: z.string().optional(),
    experience: z.string().min(1),
    consent: z.literal(true),
  }),
  responses: z.array(
    z.object({
      scenarioId: z.string().min(1),
      title: z.string().min(1),
      category: z.string().min(1),
      content: z.string().min(1),
      questions: QuestionSetSchema,
    })
  ).min(1).max(3),
  submittedAt: z.string().datetime(),
});

type TrainingSubmission = z.infer<typeof TrainingSubmissionSchema>;

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
    throw new TrainingConfigError("Google Sheets service account env vars are missing");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsignedJwt), createPrivateKey(privateKey));
  const assertion = `${unsignedJwt}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token request failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Google token response did not include access_token");
  }

  return tokenData.access_token;
}

function buildSheetRow(submission: TrainingSubmission, request: NextRequest) {
  const { participant, responses, submittedAt } = submission;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const row: string[] = [
    submittedAt,
    participant.name,
    participant.email.toLowerCase(),
    participant.role,
    participant.institution,
    participant.city || "",
    participant.experience,
    participant.consent ? "Yes" : "No",
    ipAddress,
    userAgent,
  ];

  for (let index = 0; index < 3; index += 1) {
    const response = responses[index];
    row.push(
      response?.scenarioId || "",
      response?.category || "",
      response?.title || "",
      response?.content || "",
      response?.questions.what || "",
      response?.questions.how || "",
      response?.questions.why || ""
    );
  }

  row.push(buildConversationJson(submission));

  return row;
}

function buildConversationJson(submission: TrainingSubmission) {
  return JSON.stringify({
    messages: [
      {
        role: "system",
        content: "You are Evaldam AI, an expert in Indian startup finance and valuation.",
      },
      ...submission.responses.flatMap((response) => {
        const context = `Context: ${response.title}\n\n${response.content}`;
        return [
          {
            role: "user",
            content: `${context}\n\n${response.questions.what}`,
          },
          {
            role: "assistant",
            content: "",
          },
          {
            role: "user",
            content: response.questions.how,
          },
          {
            role: "assistant",
            content: "",
          },
          {
            role: "user",
            content: response.questions.why,
          },
          {
            role: "assistant",
            content: "",
          },
        ];
      }),
    ],
  });
}

function buildSingleQuestionConversationJson(
  response: TrainingSubmission["responses"][number],
  question: string
) {
  return JSON.stringify({
    messages: [
      {
        role: "system",
        content: "You are Evaldam AI, an expert in Indian startup finance and valuation.",
      },
      {
        role: "user",
        content: `Context: ${response.title}\n\n${response.content}\n\n${question}`,
      },
      {
        role: "assistant",
        content: "",
      },
    ],
  });
}

function buildQuestionBankRows(submission: TrainingSubmission) {
  const { participant, responses, submittedAt } = submission;

  return responses.flatMap((response) =>
    ([
      ["what", response.questions.what],
      ["how", response.questions.how],
      ["why", response.questions.why],
    ] as const).map(([questionType, question]) => {
      const questionId = `${response.scenarioId}-${questionType}-${submittedAt.replace(/[^0-9]/g, "")}`;

      return [
        questionId,
        response.scenarioId,
        response.title,
        response.category,
        questionType,
        question,
        participant.role,
        participant.institution,
        participant.city || "",
        participant.experience,
        participant.email.toLowerCase(),
        submittedAt,
        "pending_expert_answer",
        "",
        "",
        "",
        "",
        buildSingleQuestionConversationJson(response, question),
      ];
    })
  );
}

async function appendValues(accessToken: string, spreadsheetId: string, range: string, values: string[][]) {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets append failed: ${response.status} ${errorText}`);
  }
}

async function appendToTrainingSheet(submission: TrainingSubmission, request: NextRequest) {
  const spreadsheetId = process.env.TRAINING_GOOGLE_SHEET_ID;
  const responseRange = process.env.TRAINING_GOOGLE_SHEET_RANGE || "Training Responses!A:AF";
  const questionBankRange = process.env.TRAINING_QUESTION_BANK_SHEET_RANGE || "Training Questions!A:R";

  if (!spreadsheetId) {
    throw new TrainingConfigError("TRAINING_GOOGLE_SHEET_ID env var is missing");
  }

  const accessToken = await getGoogleAccessToken();
  await appendValues(accessToken, spreadsheetId, responseRange, [buildSheetRow(submission, request)]);
  await appendValues(accessToken, spreadsheetId, questionBankRange, buildQuestionBankRows(submission));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const submission = TrainingSubmissionSchema.parse(body);

    await appendToTrainingSheet(submission, request);

    logger.info("Training survey submitted", {
      email: submission.participant.email,
      role: submission.participant.role,
      responses: submission.responses.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Training survey submission failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid training survey data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof TrainingConfigError) {
      return NextResponse.json(
        { error: "Training survey storage is not configured yet" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not submit training survey" },
      { status: 500 }
    );
  }
}
