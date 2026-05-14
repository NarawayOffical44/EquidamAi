import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trainingScenarios } from "@/app/training/scenarios";
import {
  getGoogleDriveAccessToken,
  getTrainingDriveJsonlFileId,
  readDriveJsonlRecords,
  TrainingDriveConfigError,
  writeDriveJsonlRecords,
  type JsonlRecord,
} from "@/lib/training/google-drive-jsonl";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

const ExpertAnswerSchema = z.object({
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

type TrainingQuestionAnswerRecord = JsonlRecord & {
  recordType: "training_question_answer";
  questionId: string;
  answerId: string;
  submissionId: string;
  participantId: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioCategory: string;
  scenarioContent: string;
  questionType: string;
  question: string;
  status: string;
  messages?: Array<{ role: string; content: string }>;
};

function isTrainingQuestionAnswerRecord(record: JsonlRecord): record is TrainingQuestionAnswerRecord {
  return (
    record.recordType === "training_question_answer" &&
    typeof record.questionId === "string" &&
    typeof record.answerId === "string" &&
    typeof record.submissionId === "string" &&
    typeof record.participantId === "string" &&
    typeof record.scenarioId === "string" &&
    typeof record.scenarioTitle === "string" &&
    typeof record.scenarioCategory === "string" &&
    typeof record.scenarioContent === "string" &&
    typeof record.questionType === "string" &&
    typeof record.question === "string" &&
    typeof record.status === "string"
  );
}

function buildScenarioFromQuestion(question: TrainingQuestionAnswerRecord) {
  const frontendScenario = trainingScenarios.find((item) => item.id === question.scenarioId);

  return frontendScenario || {
    id: question.scenarioId,
    title: question.scenarioTitle,
    category: question.scenarioCategory,
    content: question.scenarioContent,
  };
}

function buildExpertMessages(
  questionRecord: TrainingQuestionAnswerRecord,
  payload: z.infer<typeof ExpertAnswerSchema>
) {
  return [
    {
      role: "system",
      content: "You are Evaldam AI, an expert in Indian startup finance and valuation.",
    },
    {
      role: "user",
      content: `Context: ${questionRecord.scenarioTitle}\n\n${questionRecord.scenarioContent}\n\n${questionRecord.question}`,
    },
    {
      role: "assistant",
      content: [
        `Thought Process: ${payload.thoughtProcess}`,
        `Reason (Indian context): ${payload.reasonIndianContext}`,
        `Answer: ${payload.answer}`,
      ].join("\n\n"),
    },
  ];
}

function withExpertAnswer(
  questionRecord: TrainingQuestionAnswerRecord,
  payload: z.infer<typeof ExpertAnswerSchema>,
  answerId: string,
  answeredAt: string
): JsonlRecord {
  return {
    ...questionRecord,
    answerId,
    status: "expert_answered",
    expert: {
      name: payload.expertName,
      email: payload.expertEmail.toLowerCase(),
    },
    thoughtProcess: payload.thoughtProcess,
    reasonIndianContext: payload.reasonIndianContext,
    answer: payload.answer,
    answeredAt,
    messages: buildExpertMessages(questionRecord, payload),
  };
}

export async function GET(request: NextRequest) {
  try {
    const scenarioId = request.nextUrl.searchParams.get("scenarioId");

    if (!scenarioId) {
      return NextResponse.json({ error: "Missing expert assignment" }, { status: 400 });
    }

    const fileId = getTrainingDriveJsonlFileId();
    const accessToken = await getGoogleDriveAccessToken();
    const records = await readDriveJsonlRecords(accessToken, fileId);
    const scenarioRecords = records
      .filter(isTrainingQuestionAnswerRecord)
      .filter((record) => record.scenarioId === scenarioId);
    const pendingQuestions = scenarioRecords
      .filter((record) => record.status === "pending_expert_answer" && !record.answerId);

    const selected = pendingQuestions[Math.floor(Math.random() * pendingQuestions.length)];
    const fallbackScenario = trainingScenarios.find((item) => item.id === scenarioId);

    if (!selected) {
      return NextResponse.json({
        question: null,
        scenario: fallbackScenario || null,
        stats: {
          pending: 0,
          answered: scenarioRecords.filter((record) => record.status === "expert_answered" && record.answerId).length,
          total: scenarioRecords.length,
        },
      });
    }

    return NextResponse.json({
      scenario: buildScenarioFromQuestion(selected),
      question: {
        questionId: selected.questionId,
        questionType: selected.questionType,
        question: selected.question,
      },
      stats: {
        pending: pendingQuestions.length,
        answered: scenarioRecords.filter((record) => record.status === "expert_answered" && record.answerId).length,
        total: scenarioRecords.length,
      },
    });
  } catch (error) {
    logger.error("Expert question fetch failed", error);

    if (error instanceof TrainingDriveConfigError) {
      return NextResponse.json({ error: "Training JSONL storage is not configured yet" }, { status: 503 });
    }

    return NextResponse.json({ error: "Could not load expert question" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = ExpertAnswerSchema.parse(await request.json());
    const fileId = getTrainingDriveJsonlFileId();
    const accessToken = await getGoogleDriveAccessToken();
    const records = await readDriveJsonlRecords(accessToken, fileId);
    const questionRecord = records
      .filter(isTrainingQuestionAnswerRecord)
      .find((record) => record.questionId === payload.questionId && record.scenarioId === payload.scenarioId);

    if (!questionRecord) {
      return NextResponse.json({ error: "Question was not found" }, { status: 404 });
    }

    if (questionRecord.status === "expert_answered" || questionRecord.answerId) {
      return NextResponse.json({ error: "Question already answered" }, { status: 409 });
    }

    const answerId = `ans_${payload.questionId}_${randomUUID()}`;
    const answeredAt = new Date().toISOString();
    const updatedRecords = records.map((record) => {
      if (
        isTrainingQuestionAnswerRecord(record) &&
        record.questionId === payload.questionId &&
        record.scenarioId === payload.scenarioId
      ) {
        return withExpertAnswer(record, payload, answerId, answeredAt);
      }

      return record;
    });

    await writeDriveJsonlRecords(accessToken, fileId, updatedRecords);

    return NextResponse.json({ success: true, answerId });
  } catch (error) {
    logger.error("Expert answer submit failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid expert answer data", details: error.issues }, { status: 400 });
    }

    if (error instanceof TrainingDriveConfigError) {
      return NextResponse.json({ error: "Training JSONL storage is not configured yet" }, { status: 503 });
    }

    return NextResponse.json({ error: "Could not submit expert answer" }, { status: 500 });
  }
}
