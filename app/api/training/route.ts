import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

async function appendToTrainingJsonl(submission: TrainingSubmission) {
  const fileId = getTrainingDriveJsonlFileId();
  const accessToken = await getGoogleDriveAccessToken();
  const submissionId = `sub_${randomUUID()}`;
  const participantId = `part_${randomUUID()}`;

  await appendDriveJsonlRecords(accessToken, fileId, [
    ...buildQuestionRecords(submission, submissionId, participantId),
  ]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const submission = TrainingSubmissionSchema.parse(body);

    await appendToTrainingJsonl(submission);

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

    if (error instanceof TrainingDriveConfigError) {
      return NextResponse.json(
        { error: "Training JSONL storage is not configured yet" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not submit training survey" },
      { status: 500 }
    );
  }
}
