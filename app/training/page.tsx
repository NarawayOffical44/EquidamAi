"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList, Download, Gauge, ListChecks, PenLine, Play, Trophy, UserRound } from "lucide-react";
import { trainingScenarios, type TrainingScenario } from "./scenarios";

type Participant = {
  name: string;
  email: string;
  role: string;
  institution: string;
  city: string;
  experience: string;
  consent: boolean;
};

type CertificateData = Participant & {
  issuedAt: string;
  certificateId: string;
};

type ExpertQuestion = {
  questionId: string;
  questionType: string;
  question: string;
};

type ExpertStats = {
  pending: number;
  answered: number;
  total: number;
};

type ExpertProfile = {
  name: string;
  email: string;
};

type ExpertAnswer = {
  thoughtProcess: string;
  reasonIndianContext: string;
  answer: string;
};

type TrainingMode = "choose" | "create" | "answer" | "admin";
const REQUIRED_STUDENT_SCENARIOS = 4;
const EXPERT_ACCESS_CODE = "EVALDAM-EXPERT";

const leaderboardPreview = [
  { rank: "01", name: "Top framers", metric: "4+ rounds", note: "Best scenario questions" },
  { rank: "02", name: "Expert answers", metric: "100 pts each", note: "Invite-only answer sprint" },
  { rank: "03", name: "Your score", metric: "Join after Round 1", note: "Saved as you play" },
];

const initialParticipant: Participant = {
  name: "",
  email: "",
  role: "",
  institution: "",
  city: "",
  experience: "",
  consent: false,
};

const initialExpertProfile: ExpertProfile = {
  name: "",
  email: "",
};

const initialExpertAnswer: ExpertAnswer = {
  thoughtProcess: "",
  reasonIndianContext: "",
  answer: "",
};

const scenarioDeckTones = [
  {
    card: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-700",
    accent: "text-gray-600",
    soft: "bg-gray-50",
  },
  {
    card: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-700",
    accent: "text-gray-600",
    soft: "bg-gray-50",
  },
  {
    card: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-700",
    accent: "text-gray-600",
    soft: "bg-gray-50",
  },
  {
    card: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-700",
    accent: "text-gray-600",
    soft: "bg-gray-50",
  },
  {
    card: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-700",
    accent: "text-gray-600",
    soft: "bg-gray-50",
  },
];

function getInitialTrainingRoute() {
  if (typeof window === "undefined") {
    return { mode: "choose" as TrainingMode, scenarioId: "", email: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("admin") === "1" || params.get("mode") === "admin"
    ? "admin"
    : params.get("expert") === "1" || params.get("mode") === "answer"
    ? "answer"
    : params.get("mode") === "create"
      ? "create"
      : "choose";

  return {
    mode: mode as TrainingMode,
    scenarioId: params.get("scenarioId") || "",
    email: params.get("email") || "",
  };
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isQuestionLengthValid(value: string) {
  const words = countWords(value);
  return words >= 8 && words <= 26;
}

function cleanQuestionInput(field: "what" | "how" | "why", value: string) {
  return value.replace(new RegExp(`^${field}\\b\\s*`, "i"), "");
}

function fullQuestion(field: "what" | "how" | "why", value: string) {
  const cleaned = cleanQuestionInput(field, value).trim();
  return cleaned ? `${field[0].toUpperCase()}${field.slice(1)} ${cleaned}` : "";
}

function shuffledScenarios() {
  return [...trainingScenarios].sort(() => Math.random() - 0.5).slice(0, 1);
}

function scenarioTone(scenarioId: string) {
  const scenarioIndex = Math.max(0, trainingScenarios.findIndex((scenario) => scenario.id === scenarioId));
  return scenarioDeckTones[scenarioIndex % scenarioDeckTones.length];
}

export default function TrainingPage() {
  const initialTrainingRoute = useMemo(() => getInitialTrainingRoute(), []);
  const [trainingMode, setTrainingMode] = useState<TrainingMode>(initialTrainingRoute.mode);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [participant, setParticipant] = useState(initialParticipant);
  const [selectedScenarios, setSelectedScenarios] = useState<TrainingScenario[]>(() => shuffledScenarios());
  const [answers, setAnswers] = useState<Record<string, { what: string; how: string; why: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [completedScenarioCount, setCompletedScenarioCount] = useState(0);
  const [lastSubmittedAt, setLastSubmittedAt] = useState("");
  const [expertScenarioId, setExpertScenarioId] = useState(initialTrainingRoute.scenarioId);
  const [expertScenario, setExpertScenario] = useState<TrainingScenario | null>(null);
  const [expertQuestion, setExpertQuestion] = useState<ExpertQuestion | null>(null);
  const [expertStats, setExpertStats] = useState<ExpertStats>({ pending: 0, answered: 0, total: 0 });
  const [expertProfile, setExpertProfile] = useState<ExpertProfile>({
    ...initialExpertProfile,
    email: initialTrainingRoute.email,
  });
  const [expertAccessName, setExpertAccessName] = useState("");
  const [expertAccessEmail, setExpertAccessEmail] = useState(initialTrainingRoute.email);
  const [expertAccessCode, setExpertAccessCode] = useState("");
  const [expertAuthorized, setExpertAuthorized] = useState(false);
  const [expertAccessError, setExpertAccessError] = useState("");
  const [expertAnswer, setExpertAnswer] = useState(initialExpertAnswer);
  const [expertLoading, setExpertLoading] = useState(false);
  const [expertSubmitting, setExpertSubmitting] = useState(false);
  const [expertError, setExpertError] = useState("");
  const [expertCompleted, setExpertCompleted] = useState(0);
  const [adminAccessCode, setAdminAccessCode] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminExporting, setAdminExporting] = useState<"json" | "csv" | "">("");
  const [adminExportError, setAdminExportError] = useState("");

  const canContinue = Boolean(
    participant.name.trim() &&
      participant.email.trim() &&
      participant.role &&
      participant.institution.trim() &&
      participant.experience &&
      participant.consent
  );

  const canSubmit = useMemo(
    () =>
      selectedScenarios.every((scenario) => {
        const answer = answers[scenario.id];
        return (
          answer?.what?.trim() &&
          answer?.how?.trim() &&
          answer?.why?.trim() &&
          isQuestionLengthValid(fullQuestion("what", answer.what)) &&
          isQuestionLengthValid(fullQuestion("how", answer.how)) &&
          isQuestionLengthValid(fullQuestion("why", answer.why))
        );
      }),
    [answers, selectedScenarios]
  );
  const canFinishCurrentRound = completedScenarioCount + selectedScenarios.length >= REQUIRED_STUDENT_SCENARIOS;
  const studentRoundLabel = completedScenarioCount < REQUIRED_STUDENT_SCENARIOS
    ? `Round ${completedScenarioCount + 1} of ${REQUIRED_STUDENT_SCENARIOS}`
    : `Bonus Round ${completedScenarioCount - REQUIRED_STUDENT_SCENARIOS + 1}`;
  const roundsUntilCertificate = Math.max(REQUIRED_STUDENT_SCENARIOS - completedScenarioCount, 0);
  const studentTrackProgress = Math.round((Math.min(completedScenarioCount, REQUIRED_STUDENT_SCENARIOS) / REQUIRED_STUDENT_SCENARIOS) * 100);
  const studentTrackProgressWidth = `${studentTrackProgress}%`;
  const currentQuestionCount = selectedScenarios.reduce((total, scenario) => {
    const answer = answers[scenario.id];
    if (!answer) return total;
    return total + (["what", "how", "why"] as const).filter((field) => isQuestionLengthValid(fullQuestion(field, answer[field]))).length;
  }, 0);
  const canSubmitCertificateNow = completedScenarioCount >= REQUIRED_STUDENT_SCENARIOS || (canSubmit && canFinishCurrentRound);

  const updateParticipant = (field: keyof Participant, value: string | boolean) => {
    setParticipant((current) => ({ ...current, [field]: value }));
  };

  const updateAnswer = (scenarioId: string, field: "what" | "how" | "why", value: string) => {
    setAnswers((current) => ({
      ...current,
      [scenarioId]: {
        what: current[scenarioId]?.what || "",
        how: current[scenarioId]?.how || "",
        why: current[scenarioId]?.why || "",
        [field]: cleanQuestionInput(field, value),
      },
    }));
  };

  const questionHint = (field: "what" | "how" | "why", value: string) => {
    const words = countWords(fullQuestion(field, value));
    const valid = words >= 8 && words <= 26;
    return (
      <p className={`text-right text-xs font-semibold ${value && !valid ? "text-red-600" : "text-gray-500"}`}>
        {words}/26 words - minimum 8
      </p>
    );
  };

  const questionInput = (
    scenarioId: string,
    field: "what" | "how" | "why",
    placeholder: string
  ) => {
    const label = `${field[0].toUpperCase()}${field.slice(1)}`;
    const value = answers[scenarioId]?.[field] || "";
    const order = { what: "1", how: "2", why: "3" }[field];
    const ready = isQuestionLengthValid(fullQuestion(field, value));
    const tones = {
      what: "border-gray-200 bg-gray-50 text-gray-700",
      how: "border-gray-200 bg-gray-50 text-gray-700",
      why: "border-gray-200 bg-gray-50 text-gray-700",
    };

    return (
      <label className="block">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${ready ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
              {ready ? <CheckCircle className="h-3.5 w-3.5" /> : order}
            </span>
            {label} question
          </span>
          {questionHint(field, value)}
        </div>
        <div className="flex overflow-hidden rounded-md border border-gray-200 bg-white transition focus-within:border-gray-400">
          <span className={`flex w-16 shrink-0 items-center justify-center border-r text-sm font-semibold ${tones[field]}`}>
            {label}
          </span>
          <input
            className="min-w-0 flex-1 border-0 bg-white px-4 py-3.5 text-[16px] font-medium text-gray-900 outline-none placeholder:text-gray-400 sm:text-sm"
            value={value}
            onChange={(e) => updateAnswer(scenarioId, field, e.target.value)}
            placeholder={placeholder}
          />
        </div>
      </label>
    );
  };

  const loadNextScenario = () => {
    const currentScenarioId = selectedScenarios[0]?.id;
    const nextScenarios = [...trainingScenarios]
      .filter((scenario) => scenario.id !== currentScenarioId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 1);
    setSelectedScenarios(nextScenarios.length ? nextScenarios : shuffledScenarios());
    setAnswers({});
    setSubmitError("");
  };

  const loadExpertQuestion = async (scenarioId: string) => {
    setExpertLoading(true);
    setExpertError("");

    try {
      const response = await fetch(`/api/training/expert?scenarioId=${encodeURIComponent(scenarioId)}`);
      if (!response.ok) {
        throw new Error("Could not load expert question");
      }

      const data = await response.json() as {
        scenario: TrainingScenario | null;
        question: ExpertQuestion | null;
        stats?: ExpertStats;
      };
      setExpertScenario(data.scenario);
      setExpertQuestion(data.question);
      setExpertStats(data.stats || { pending: 0, answered: 0, total: 0 });
    } catch {
      setExpertError("Could not load the assigned expert question. Please try again.");
    } finally {
      setExpertLoading(false);
    }
  };

  useEffect(() => {
    if (trainingMode === "answer" && expertAuthorized && expertScenarioId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadExpertQuestion(expertScenarioId);
    }
  }, [trainingMode, expertAuthorized, expertScenarioId]);

  const answerWordCount = countWords(expertAnswer.answer);
  const expertScore = expertCompleted * 100;
  const expertProgress = expertStats.total
    ? Math.round((expertStats.answered / expertStats.total) * 100)
    : 0;
  const expertProgressWidth = `${Math.min(100, Math.max(0, expertProgress))}%`;
  const trainingProgress = step === 1 ? 33 : step === 2 ? 66 : 100;
  const canSubmitExpertAnswer = Boolean(
    expertQuestion &&
      expertScenario &&
      expertProfile.name.trim() &&
      expertProfile.email.trim() &&
      expertAnswer.thoughtProcess.trim() &&
      expertAnswer.reasonIndianContext.trim() &&
      answerWordCount >= 150 &&
      answerWordCount <= 300
  );

  const saveExpertAnswer = async (continuePlaying: boolean) => {
    if (!canSubmitExpertAnswer || !expertQuestion || !expertScenario) return;

    setExpertSubmitting(true);
    setExpertError("");

    try {
      const response = await fetch("/api/training/expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: expertQuestion.questionId,
          scenarioId: expertScenario.id,
          question: expertQuestion.question,
          expertName: expertProfile.name,
          expertEmail: expertProfile.email,
          ...expertAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      setExpertCompleted((current) => current + 1);
      setExpertAnswer(initialExpertAnswer);
      if (continuePlaying) {
        await loadExpertQuestion(expertScenario.id);
      } else {
        setTrainingMode("choose");
      }
    } catch {
      setExpertError("Could not submit this answer. Please try again.");
    } finally {
      setExpertSubmitting(false);
    }
  };

  const submitExpertAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveExpertAnswer(true);
  };

  const chooseExpertScenario = (scenarioId: string) => {
    setExpertScenarioId(scenarioId);
    setExpertScenario(null);
    setExpertQuestion(null);
    setExpertStats({ pending: 0, answered: 0, total: 0 });
    setExpertCompleted(0);
    setExpertError("");
    setExpertAnswer(initialExpertAnswer);
    void loadExpertQuestion(scenarioId);
  };

  const startCreateMode = () => {
    setTrainingMode("create");
    setStep(1);
    setCompletedScenarioCount(0);
    setLastSubmittedAt("");
    setCertificateData(null);
  };

  const startAnswerMode = () => {
    setTrainingMode("answer");
    setExpertError("");
  };

  const startAdminMode = () => {
    setTrainingMode("admin");
    setAdminExportError("");
  };

  const submitAdminAccess = (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminAccessCode.trim()) {
      setAdminExportError("Enter the admin export code.");
      return;
    }
    setAdminUnlocked(true);
    setAdminExportError("");
  };

  const downloadAdminExport = async (format: "json" | "csv") => {
    if (!adminAccessCode.trim()) {
      setAdminExportError("Enter the admin export code.");
      setAdminUnlocked(false);
      return;
    }

    setAdminExporting(format);
    setAdminExportError("");

    try {
      const response = await fetch(`/api/training/export?format=${format}`, {
        headers: {
          "x-training-admin-code": adminAccessCode.trim(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const fileNameMatch = disposition.match(/filename="([^"]+)"/);
      const fileName = fileNameMatch?.[1] || `evaldam-question-game.${format === "csv" ? "csv" : "json"}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setAdminExportError(error instanceof Error ? error.message : "Could not download export.");
    } finally {
      setAdminExporting("");
    }
  };

  const submitExpertAccess = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = expertAccessCode.trim();

    if (!expertAccessName.trim() || !expertAccessEmail.trim()) {
      setExpertAccessError("Enter your name and invited email.");
      return;
    }

    if (normalizedCode !== EXPERT_ACCESS_CODE) {
      setExpertAccessError("Invalid expert access code.");
      return;
    }

    setExpertProfile({
      name: expertAccessName.trim(),
      email: expertAccessEmail.trim(),
    });
    setExpertAuthorized(true);
    setExpertAccessError("");
  };

  const finishCertificate = () => {
    if (completedScenarioCount < REQUIRED_STUDENT_SCENARIOS || !lastSubmittedAt) return;

    setCertificateData({
      ...participant,
      issuedAt: lastSubmittedAt,
      certificateId: `EAI-TRAINING-${Date.now().toString(36).toUpperCase()}`,
    });
    setStep(3);
  };

  const submitCertificate = async () => {
    if (canSubmit) {
      if (!canFinishCurrentRound) return;
      await saveSurveyRound(false);
      return;
    }

    finishCertificate();
  };

  const saveSurveyRound = async (continuePlaying: boolean) => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError("");

    const payload = {
      participant,
      responses: selectedScenarios.map((scenario) => ({
        scenarioId: scenario.id,
        title: scenario.title,
        category: scenario.category,
        content: scenario.content,
        questions: {
          what: fullQuestion("what", answers[scenario.id].what),
          how: fullQuestion("how", answers[scenario.id].how),
          why: fullQuestion("why", answers[scenario.id].why),
        },
      })),
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Submission failed");
      }

      setCompletedScenarioCount((current) => current + selectedScenarios.length);
      setLastSubmittedAt(payload.submittedAt);
      if (continuePlaying) {
        loadNextScenario();
      } else {
        setCertificateData({
          ...participant,
          issuedAt: payload.submittedAt,
          certificateId: `EAI-TRAINING-${Date.now().toString(36).toUpperCase()}`,
        });
        setStep(3);
      }
    } catch {
      setSubmitError("We could not submit your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSurvey = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitCertificate();
  };

  const downloadCertificate = () => {
    if (!certificateData) return;

    const issuedDate = new Date(certificateData.issuedAt).toLocaleDateString("en-IN");
    const safeName = certificateData.name.replace(/[<>&"]/g, "");
    const certificateSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="990" viewBox="0 0 1400 990">
        <rect width="1400" height="990" fill="#f7ffff"/>
        <rect x="52" y="52" width="1296" height="886" fill="#ffffff" stroke="#00b2b2" stroke-width="8"/>
        <rect x="78" y="78" width="1244" height="834" fill="none" stroke="#99e5e5" stroke-width="3"/>
        <text x="700" y="170" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="#00b2b2" letter-spacing="6">EVALDAM AI</text>
        <text x="700" y="275" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="900" fill="#111827">Certificate of Participation</text>
        <text x="700" y="370" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="#4b5563">This certificate is proudly presented to</text>
        <text x="700" y="485" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="68" font-weight="900" fill="#111827">${safeName}</text>
        <line x1="310" y1="525" x2="1090" y2="525" stroke="#d1d5db" stroke-width="3"/>
        <foreignObject x="230" y="575" width="940" height="130">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; font-size: 30px; line-height: 1.55; color: #374151; text-align: center;">
            for completing the Evaldam Question Quest and creating thoughtful startup finance questions across real-world scenarios.
          </div>
        </foreignObject>
        <text x="700" y="760" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#6b7280">Issued on ${issuedDate} - Certificate ID: ${certificateData.certificateId}</text>
        <line x1="145" y1="830" x2="430" y2="830" stroke="#d1d5db" stroke-width="3"/>
        <text x="145" y="870" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#6b7280">Evaldam AI Game Team</text>
        <text x="1255" y="850" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900" fill="#00b2b2">evaldam</text>
        <text x="1255" y="882" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#6b7280">equidamai.com/training</text>
      </svg>
    `;

    const blob = new Blob([certificateSvg.trim()], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Evaldam-AI-Training-Certificate-${safeName.replace(/[^a-z0-9]+/gi, "-") || "Participant"}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (trainingMode === "admin") {
    return (
      <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-8 sm:px-6">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>
            <button type="button" onClick={() => setTrainingMode("choose")} className="btn btn-secondary btn-sm">
              Back to game
            </button>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin only</p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-950">Question Quest exports</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Download the saved rounds from the Google Drive JSONL store as JSON or an Excel-ready CSV.
              </p>
            </div>

            {!adminUnlocked ? (
              <form onSubmit={submitAdminAccess} className="space-y-5 p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-900">Admin export code</span>
                  <input
                    className="input"
                    value={adminAccessCode}
                    onChange={(event) => setAdminAccessCode(event.target.value)}
                    placeholder="Enter export code"
                  />
                </label>
                {adminExportError && <p className="text-sm font-semibold text-red-600">{adminExportError}</p>}
                <button type="submit" className="btn btn-primary w-full">
                  Unlock downloads
                </button>
              </form>
            ) : (
              <div className="p-5">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-950">Storage source</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Records are read from the configured Google Drive JSONL file, the same file used by question and expert rounds.
                  </p>
                </div>
                {adminExportError && <p className="mt-4 text-sm font-semibold text-red-600">{adminExportError}</p>}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={Boolean(adminExporting)}
                    onClick={() => void downloadAdminExport("csv")}
                    className="btn btn-primary gap-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {adminExporting === "csv" ? "Preparing..." : "Download Excel CSV"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(adminExporting)}
                    onClick={() => void downloadAdminExport("json")}
                    className="btn btn-secondary gap-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {adminExporting === "json" ? "Preparing..." : "Download JSON"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (trainingMode === "answer") {
    if (!expertAuthorized) {
      return (
        <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950">
          <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-8 sm:px-6">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>

            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Experts only</p>
                <h1 className="mt-2 text-2xl font-semibold text-gray-950">Answer workspace login</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use the invited email and access code shared by Evaldam.
                </p>
              </div>

              <form onSubmit={submitExpertAccess} className="space-y-5 p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-900">Name</span>
                  <input className="input" value={expertAccessName} onChange={(event) => setExpertAccessName(event.target.value)} placeholder="Your name" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-900">Invited email</span>
                  <input className="input" type="email" value={expertAccessEmail} onChange={(event) => setExpertAccessEmail(event.target.value)} placeholder="you@example.com" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-900">Access code</span>
                  <input className="input" value={expertAccessCode} onChange={(event) => setExpertAccessCode(event.target.value)} placeholder="Expert access code" />
                </label>

                {expertAccessError && <p className="text-sm font-semibold text-red-600">{expertAccessError}</p>}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={startCreateMode} className="btn btn-secondary w-full sm:w-auto">
                    Student form
                  </button>
                  <button type="submit" className="btn btn-primary w-full sm:w-auto">
                    Continue
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>
            <button type="button" onClick={startCreateMode} className="btn btn-secondary btn-sm">
              Create Questions
            </button>
          </div>

          <section className="mb-7 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 text-gray-900">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-white">
                  <ListChecks className="h-4 w-4" />
                </span>
                Evaldam Answer Sprint
              </div>
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-bold text-gray-500">
                Expert mode
              </span>
            </div>
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 md:p-8">
                <span className="mb-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                  Expert mode
                </span>
                <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-gray-950 md:text-3xl">
                  Expert answer workspace
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                  Pick a scenario, answer one question, then continue with the next question from the same context.
                </p>
              </div>
              <div className="grid gap-3 border-t border-gray-200 bg-gray-50 p-5 md:border-l md:border-t-0 md:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-950">
                    <Trophy className="h-5 w-5" />
                    <p className="mt-5 text-2xl font-semibold">{expertScore}</p>
                    <p className="text-xs font-semibold uppercase">Score</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-950">
                    <Gauge className="h-5 w-5" />
                    <p className="mt-5 text-2xl font-semibold">{expertProgress}%</p>
                    <p className="text-xs font-semibold uppercase">Progress</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-gray-500">
                    <span>Round progress</span>
                    <span>{expertStats.answered}/{expertStats.total || 0}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-gray-900 transition-all" style={{ width: expertProgressWidth }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={submitExpertAnswer} className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-md bg-gray-900 p-2 text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-950">Expert profile</h2>
                  <p className="text-sm text-gray-500">Used only to map which expert answered each question.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-900">Full name</span>
                  <input className="input" value={expertProfile.name} onChange={(e) => setExpertProfile((current) => ({ ...current, name: e.target.value }))} placeholder="Your name" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-gray-900">Email</span>
                  <input className="input" type="email" value={expertProfile.email} onChange={(e) => setExpertProfile((current) => ({ ...current, email: e.target.value }))} placeholder="you@example.com" />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-950">Choose scenario</h2>
                  <p className="mt-1 text-sm text-gray-600">Pick one question set and keep answering rounds from the same context.</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
                  <Trophy className="h-4 w-4" />
                  {expertScore} points
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {trainingScenarios.map((scenario) => {
                  const selected = expertScenarioId === scenario.id;
                  const tone = scenarioTone(scenario.id);
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => chooseExpertScenario(scenario.id)}
                      className={`min-h-40 rounded-lg border p-5 text-left text-gray-950 transition hover:border-gray-300 ${
                        selected ? `${tone.card} ring-4 ring-gray-950/10` : `${tone.card}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${tone.badge}`}>
                          {scenario.category}
                        </span>
                        <Play className="h-5 w-5" />
                      </div>
                      <p className="mt-8 text-lg font-semibold leading-tight">{scenario.title}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{scenario.content}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {expertScenarioId && (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              {expertLoading && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-600">
                  Loading next round...
                </div>
              )}

              {!expertLoading && expertScenario && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-5 py-3 text-gray-900">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Question deck</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{expertScenario.category}</span>
                  </div>
                  <div className="p-5">
                  <h2 className="text-xl font-semibold leading-tight text-gray-950">{expertScenario.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-700">{expertScenario.content}</p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase text-gray-500">Pending</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-950">{expertStats.pending}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase text-gray-500">Answered</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-950">{expertStats.answered}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase text-gray-500">Progress</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-950">{expertProgress}%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-gray-900 transition-all" style={{ width: expertProgressWidth }} />
                  </div>

                  {expertQuestion && (
                    <div className={`mt-6 rounded-lg border border-gray-200 p-5 ${scenarioTone(expertScenario.id).soft}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${scenarioTone(expertScenario.id).accent}`}>
                        Round {expertCompleted + 1} - {expertQuestion.questionType} question
                      </p>
                      <p className="mt-3 text-lg font-semibold leading-8 text-gray-950">{expertQuestion.question}</p>
                      <p className="mt-3 text-xs font-semibold text-gray-500">Question ID: {expertQuestion.questionId}</p>
                    </div>
                  )}

                  {!expertQuestion && (
                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5 text-gray-800">
                      <p className="font-bold">No pending questions for this scenario right now.</p>
                      <p className="mt-1 text-sm">You answered {expertCompleted} question{expertCompleted === 1 ? "" : "s"} in this session.</p>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {expertQuestion && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-5 py-3 text-gray-900">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Answer pad</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">+100 pts</span>
                  </div>
                  <div className="p-5">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-950">Structured answer</h2>
                      <p className="mt-1 text-sm text-gray-600">Complete all three fields. The detailed answer must be 150-300 words.</p>
                    </div>
                  <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-900">Thought Process</span>
                    <textarea className="textarea min-h-28" value={expertAnswer.thoughtProcess} onChange={(e) => setExpertAnswer((current) => ({ ...current, thoughtProcess: e.target.value }))} placeholder="How did you analyze the situation? What factors did you consider?" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-900">Reason (Why this is correct in Indian context)</span>
                    <textarea className="textarea min-h-28" value={expertAnswer.reasonIndianContext} onChange={(e) => setExpertAnswer((current) => ({ ...current, reasonIndianContext: e.target.value }))} placeholder="Mention Indian market realities, investor behavior, grants, regulation, or examples." />
                  </label>

                  <label className="block">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-gray-900">Answer</span>
                      <span className={`text-xs font-semibold ${expertAnswer.answer && (answerWordCount < 150 || answerWordCount > 300) ? "text-red-600" : "text-gray-500"}`}>
                        {answerWordCount}/300 words - minimum 150
                      </span>
                    </div>
                    <textarea className="textarea min-h-44" value={expertAnswer.answer} onChange={(e) => setExpertAnswer((current) => ({ ...current, answer: e.target.value }))} placeholder="Write the detailed expert answer here." />
                  </label>

                  {expertError && <p className="text-sm font-semibold text-red-600">{expertError}</p>}

                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-500">
                      Session score: {expertScore}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" disabled={!canSubmitExpertAnswer || expertSubmitting} onClick={() => void saveExpertAnswer(false)} className="btn btn-secondary min-w-32 disabled:opacity-50">
                        {expertSubmitting ? "Saving..." : "Submit"}
                      </button>
                      <button type="submit" disabled={!canSubmitExpertAnswer || expertSubmitting} className="btn min-w-32 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">
                        {expertSubmitting ? "Saving..." : "Next"}
                      </button>
                    </div>
                  </div>
                  </div>
                  </div>
                </div>
              )}
            </section>
            )}
          </form>
        </div>
      </main>
    );
  }

  if (trainingMode === "choose") {
    return (
      <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>
            <div className="flex items-center gap-2">
              <button type="button" onClick={startAnswerMode} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950">
                <UserRound className="h-4 w-4" />
                Expert
              </button>
              <button type="button" onClick={startAdminMode} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950">
                <Download className="h-4 w-4" />
                Admin
              </button>
            </div>
          </div>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="grid lg:grid-cols-[1fr_24rem]">
              <div className="p-6 md:p-10">
                <span className="mb-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                  Certificate assessment
                </span>
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-gray-950 md:text-5xl">
                  Play 4 scenarios. Frame better questions. Earn your certificate.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                  Read one startup finance scenario, write 3 strong questions, then press Next. Submit unlocks after Round 4.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button type="button" onClick={startCreateMode} className="btn btn-primary btn-lg w-full gap-2 sm:w-auto">
                    <Play className="h-5 w-5" />
                    Start Round 1
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <p className="text-sm font-medium text-gray-500">No invite needed for the certificate track.</p>
                </div>

                <div className="mt-9 grid gap-3 sm:grid-cols-3">
                  {[
                    ["1", "Read", "A real startup finance scenario appears."],
                    ["2", "Write 3", "One What, one How, and one Why question."],
                    ["3", "Advance", "Next saves the round. Submit after 4 rounds."],
                  ].map(([stepNo, title, copy]) => (
                    <div key={stepNo} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-900">{stepNo}</div>
                      <p className="mt-4 font-semibold text-gray-950">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-950 p-6 text-white lg:border-l lg:border-t-0 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Your run</p>
                <h2 className="mt-2 text-2xl font-semibold">Certificate unlock path</h2>
                <div className="mt-7 grid grid-cols-4 gap-2">
                  {Array.from({ length: REQUIRED_STUDENT_SCENARIOS }, (_, index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-950">
                        {index + 1}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-gray-300">Round</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Evaldam AI</p>
                  <h3 className="mt-4 text-2xl font-semibold">Certificate of Participation</h3>
                  <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-gray-300">
                    Issued when 4 scenario rounds are completed.
                  </p>
                  <div className="mt-5 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                    Locked until Round 4
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Leaderboard</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">See where your run stands</h2>
              </div>
              <Trophy className="h-5 w-5 text-gray-500" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {leaderboardPreview.map((row) => (
                <div key={row.rank} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-400">{row.rank}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">{row.metric}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-gray-950">{row.name}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{row.note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Evaldam AI
          </Link>
          <button type="button" onClick={startAnswerMode} className="btn btn-secondary btn-sm">
            Answer Questions
          </button>
        </div>

        <section className={`mb-7 overflow-hidden rounded-lg border border-gray-200 bg-white ${step === 2 ? "hidden" : ""}`}>
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 text-gray-900">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-white">
                <ClipboardList className="h-4 w-4" />
              </span>
              Evaldam Question Quest
            </div>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-bold text-gray-500">
              {trainingProgress}%
            </span>
          </div>
          <div className="p-6 md:p-8">
              <span className="mb-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                Certificate game
              </span>
              <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-gray-950 md:text-3xl">
                Read a scenario. Write useful questions.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                Clear one scenario at a time. Round 4 unlocks your certificate.
              </p>
              <div className="mt-6 h-2 max-w-xl overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-gray-900 transition-all" style={{ width: `${trainingProgress}%` }} />
              </div>
          </div>
        </section>

        <div className={`mb-7 grid grid-cols-3 gap-3 ${step === 2 ? "hidden" : ""}`}>
          {["Details", "Questions", "Certificate"].map((label, index) => {
            const active = step === index + 1;
            const done = step > index + 1;
            return (
              <div key={label} className={`rounded-lg border bg-white px-4 py-3 ${active ? "border-gray-900" : done ? "border-gray-300" : "border-gray-200"}`}>
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle className="h-4 w-4 text-gray-700" /> : <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-gray-900" : "bg-gray-300"}`} />}
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <section className="rounded-lg border border-gray-200 bg-white p-6 md:p-8">
            <div className="mb-8 border-l-2 border-gray-300 pl-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">How to win</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Complete 4 scenario rounds. Each round needs one What, one How, and one Why question.
              </p>
            </div>

            <h2 className="mb-5 text-xl font-semibold text-gray-950">Your details</h2>
            <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-900">Full name</span>
                <input className="input" value={participant.name} onChange={(e) => updateParticipant("name", e.target.value)} placeholder="Your name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-900">Email</span>
                <input className="input" type="email" value={participant.email} onChange={(e) => updateParticipant("email", e.target.value)} placeholder="you@example.com" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-900">Role</span>
                <select className="select" value={participant.role} onChange={(e) => updateParticipant("role", e.target.value)}>
                  <option value="">Select one</option>
                  <option>Student</option>
                  <option>Founder</option>
                  <option>Finance professional</option>
                  <option>Startup advisor</option>
                  <option>Expert</option>
                  <option>Professor</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-900">College, company, or institution</span>
                <input className="input" value={participant.institution} onChange={(e) => updateParticipant("institution", e.target.value)} placeholder="Institution name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-900">City</span>
                <input className="input" value={participant.city} onChange={(e) => updateParticipant("city", e.target.value)} placeholder="City" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-900">Startup / finance exposure</span>
                <select className="select" value={participant.experience} onChange={(e) => updateParticipant("experience", e.target.value)}>
                  <option value="">Select one</option>
                  <option>Beginner</option>
                  <option>Some classroom or project exposure</option>
                  <option>Internship or work exposure</option>
                  <option>Founder or operator experience</option>
                  <option>Advisor or investor experience</option>
                </select>
              </label>
            </div>

            <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Ready check</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your round is submitted when you press Next or Submit. Complete entries count toward the certificate.
              </p>
              <label className="mt-4 flex items-start gap-3">
                <input className="mt-1 h-4 w-4 accent-primary" type="checkbox" checked={participant.consent} onChange={(e) => updateParticipant("consent", e.target.checked)} />
                <span className="text-sm leading-6 text-gray-700">
                  I am ready to play the certificate game.
                </span>
              </label>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="button" disabled={!canContinue} onClick={() => setStep(2)} className="btn btn-primary min-w-44 gap-2 disabled:opacity-50">
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <form onSubmit={submitSurvey} className="space-y-5">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{studentRoundLabel}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-950">Clear this scenario</h1>
                </div>
                <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                  {currentQuestionCount}/3 questions ready
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-gray-900 transition-all" style={{ width: studentTrackProgressWidth }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <span>{roundsUntilCertificate ? `${roundsUntilCertificate} round${roundsUntilCertificate === 1 ? "" : "s"} left to unlock certificate` : "Certificate unlocked"}</span>
                <span className="font-semibold text-gray-900">{studentTrackProgress}%</span>
              </div>
            </section>
            {selectedScenarios.map((scenario) => {
              return (
              <section key={scenario.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scenario</p>
                    <h2 className="mt-1 text-xl font-semibold leading-tight text-gray-950 md:text-2xl">{scenario.title}</h2>
                  </div>
                  <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    Cleared {completedScenarioCount}/{REQUIRED_STUDENT_SCENARIOS}
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <p className="text-sm leading-7 text-gray-700">{scenario.content}</p>

                  <div className="mt-7 grid gap-5">
                    {questionInput(scenario.id, "what", "is the best valuation method for my startup?")}
                    {questionInput(scenario.id, "how", "should I calculate valuation using the Berkus method?")}
                    {questionInput(scenario.id, "why", "is the DCF method not suitable at this stage?")}
                  </div>

                  {submitError && <p className="mt-5 text-sm font-semibold text-red-600">{submitError}</p>}

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => setStep(1)} className="btn btn-secondary w-full sm:w-auto">
                        Back
                      </button>
                    </div>
                    <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                      <button type="button" disabled={!canSubmit || submitting} onClick={() => void saveSurveyRound(true)} className="btn btn-secondary w-full min-w-40 disabled:opacity-50 sm:w-auto">
                        {submitting ? "Saving..." : "Next"}
                      </button>
                      <button type="submit" disabled={!canSubmitCertificateNow || submitting} className="btn btn-primary w-full min-w-40 disabled:opacity-50 sm:w-auto">
                        {submitting ? "Saving..." : "Submit Certificate"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              );
            })}
          </form>
        )}

        {step === 3 && certificateData && (
          <section className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <CheckCircle className="mx-auto mb-4 h-10 w-10 text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-950">Thank you for participating.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-700">
                Your response has been submitted to Evaldam AI.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 md:p-8">
              <div className="certificate-print rounded-lg border border-gray-300 bg-white p-6 text-center md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Evaldam AI</p>
                <h2 className="mt-4 text-3xl font-semibold text-gray-950 md:text-4xl">Certificate of Participation</h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600">
                  This certificate is proudly presented to
                </p>
                <p className="mx-auto mt-4 max-w-3xl border-b border-gray-300 pb-3 text-3xl font-semibold text-gray-950 md:text-4xl">
                  {certificateData.name}
                </p>
                <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-700">
                  for completing the Evaldam Question Quest and creating thoughtful startup finance questions across real-world scenarios.
                </p>
                <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Issued on {new Date(certificateData.issuedAt).toLocaleDateString("en-IN")} - Certificate ID: {certificateData.certificateId}
                </p>
                <div className="mt-10 flex items-end justify-between gap-6 text-left">
                  <div>
                    <div className="h-px w-36 bg-gray-300" />
                    <p className="mt-2 text-xs font-bold uppercase text-gray-500">Evaldam AI Game Team</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-950">evaldam</p>
                    <p className="text-xs font-semibold text-gray-500">equidamai.com/training</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-center">
                <button type="button" onClick={downloadCertificate} className="btn btn-primary gap-2">
                  <Download className="h-4 w-4" />
                  Download Certificate
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
