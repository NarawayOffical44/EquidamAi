import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { appendFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { z } from "zod";
import {
  appendDriveJsonlRecords,
  getGoogleDriveAccessToken,
  getTrainingDriveJsonlFileId,
  TrainingDriveConfigError,
  type JsonlRecord,
} from "@/lib/training/google-drive-jsonl";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

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

type TrainingStorageResult = {
  storage: "google_drive_jsonl" | "local_jsonl";
  submissionId: string;
  participantId: string;
  questionCount: number;
};

type TrainingMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function buildQuestionAnswerMessages(
  response: TrainingSubmission["responses"][number],
  question: string,
  answer = ""
): TrainingMessage[] {
  return [
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
      content: answer,
    },
  ];
}

function buildQuestionRecords(
  submission: TrainingSubmission,
  submissionId: string,
  participantId: string
): JsonlRecord[] {
  const { participant, responses, submittedAt } = submission;

  return responses.flatMap((response) =>
    ([
      ["what", response.questions.what],
      ["how", response.questions.how],
      ["why", response.questions.why],
    ] as const).map(([questionType, question]) => {
      const questionId = `q_${response.scenarioId}_${questionType}_${randomUUID()}`;

      return {
        recordType: "training_question_answer",
        version: 1,
        questionId,
        answerId: "",
        submissionId,
        participantId,
        scenarioId: response.scenarioId,
        scenarioTitle: response.title,
        scenarioCategory: response.category,
        scenarioContent: response.content,
        question,
        questionType,
        participant: {
          name: participant.name,
          email: participant.email.toLowerCase(),
          role: participant.role,
          institution: participant.institution,
          city: participant.city || "",
          experience: participant.experience,
        },
        questionSubmittedAt: submittedAt,
        status: "pending_expert_answer",
        expert: {
          name: "",
          email: "",
        },
        thoughtProcess: "",
        reasonIndianContext: "",
        answer: "",
        answeredAt: "",
        messages: buildQuestionAnswerMessages(response, question),
      };
    })
  );
}

function hasGoogleDriveServiceAccountConfig() {
  const clientEmail =
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey =
    process.env.GOOGLE_DRIVE_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  return Boolean(clientEmail && privateKey);
}

function allowLocalTrainingStorage() {
  return process.env.TRAINING_LOCAL_JSONL_FALLBACK === "true" || process.env.NODE_ENV !== "production";
}

function getLocalTrainingJsonlPath() {
  return process.env.TRAINING_LOCAL_JSONL_PATH || join(process.cwd(), "data", "training-question-game.local.jsonl");
}

async function appendLocalJsonlRecords(records: JsonlRecord[]) {
  const localPath = getLocalTrainingJsonlPath();
  await mkdir(dirname(localPath), { recursive: true });
  await appendFile(localPath, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");

  return localPath;
}

async function appendToTrainingJsonl(submission: TrainingSubmission): Promise<TrainingStorageResult> {
  const submissionId = `sub_${randomUUID()}`;
  const participantId = `part_${randomUUID()}`;
  const records = buildQuestionRecords(submission, submissionId, participantId);

  if (!hasGoogleDriveServiceAccountConfig()) {
    if (!allowLocalTrainingStorage()) {
      throw new TrainingDriveConfigError("Google Drive service account env vars are missing");
    }

    const localPath = await appendLocalJsonlRecords(records);
    logger.warn("Training survey saved to local JSONL fallback", {
      localPath,
      submissionId,
      participantId,
      questionCount: records.length,
    });

    return {
      storage: "local_jsonl",
      submissionId,
      participantId,
      questionCount: records.length,
    };
  }

  const fileId = getTrainingDriveJsonlFileId();
  const accessToken = await getGoogleDriveAccessToken();
  await appendDriveJsonlRecords(accessToken, fileId, records);

  return {
    storage: "google_drive_jsonl",
    submissionId,
    participantId,
    questionCount: records.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const submission = TrainingSubmissionSchema.parse(body);

    const storageResult = await appendToTrainingJsonl(submission);

    logger.info("Training survey submitted", {
      email: submission.participant.email,
      role: submission.participant.role,
      responses: submission.responses.length,
      storage: storageResult.storage,
      questionCount: storageResult.questionCount,
    });

    return NextResponse.json({
      success: true,
      storage: storageResult.storage,
      questionCount: storageResult.questionCount,
    });
  } catch (error) {
    logger.error("Training survey submission failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid training survey data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof TrainingDriveConfigError) {
      return NextResponse.json(
        { error: error.message || "Training JSONL storage is not configured yet" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not submit training survey" },
      { status: 500 }
    );
  }
}
