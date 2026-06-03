"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList, Download, Gauge, ListChecks, Play, Trophy, UserRound } from "lucide-react";
import { trainingScenarios, type TrainingScenario } from "./scenarios";
import { QuestMap } from "./components/QuestMap";
import { FounderMessage } from "./components/FounderMessage";
import { QuestionForge } from "./components/QuestionForge";
import { GlobalLeaderboard } from "./components/GlobalLeaderboard";
import { CertificateCeremony } from "./components/CertificateCeremony";
import { QuestBriefing } from "./components/QuestBriefing";
import { motion, AnimatePresence } from "framer-motion";


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
      <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950 pb-20">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-8 sm:px-6">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-950 uppercase tracking-widest">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>
            <button type="button" onClick={() => setTrainingMode("choose")} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Back to game
            </button>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Internal Console</p>
              <h1 className="text-2xl font-bold text-gray-950">Data Exports</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Secure access to the Question Quest training data store.
              </p>
            </div>

            {!adminUnlocked ? (
              <form onSubmit={submitAdminAccess} className="space-y-5 p-6">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Admin access key</span>
                  <input
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none transition-all"
                    value={adminAccessCode}
                    onChange={(event) => setAdminAccessCode(event.target.value)}
                    placeholder="Enter security code"
                  />
                </label>
                {adminExportError && <p className="text-xs font-bold text-red-500">{adminExportError}</p>}
                <button type="submit" className="w-full bg-gray-950 text-white rounded-xl py-3 font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-950/10">
                  Unlock Console
                </button>
              </form>
            ) : (
              <div className="p-6">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-tight">System Status</p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-600">
                    Connected to Google Drive / Local JSONL. Ready for synchronization.
                  </p>
                </div>
                {adminExportError && <p className="mt-4 text-xs font-bold text-red-500">{adminExportError}</p>}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={Boolean(adminExporting)}
                    onClick={() => void downloadAdminExport("csv")}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-950 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {adminExporting === "csv" ? "Exporting..." : "Excel CSV"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(adminExporting)}
                    onClick={() => void downloadAdminExport("json")}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {adminExporting === "json" ? "Exporting..." : "Raw JSON"}
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
        <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-950 uppercase tracking-widest mb-6">
                <ArrowLeft className="h-4 w-4" />
                Evaldam AI
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">Expert Portal</h1>
              <p className="text-sm text-gray-500 mt-2">Authenticated access required</p>
            </div>

            <section className="rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden p-8">
              <form onSubmit={submitExpertAccess} className="space-y-6">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Full Name</span>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={expertAccessName} onChange={(event) => setExpertAccessName(event.target.value)} placeholder="Expert analyst name" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Invited Email</span>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" type="email" value={expertAccessEmail} onChange={(event) => setExpertAccessEmail(event.target.value)} placeholder="name@domain.com" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Access Code</span>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={expertAccessCode} onChange={(event) => setExpertAccessCode(event.target.value)} placeholder="EVALDAM-XXXX" />
                </label>

                {expertAccessError && <p className="text-xs font-bold text-red-500">{expertAccessError}</p>}

                <div className="pt-2 flex flex-col gap-3">
                  <button type="submit" className="w-full bg-gray-950 text-white rounded-xl py-4 font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-950/10">
                    Enter Workspace
                  </button>
                  <button type="button" onClick={startCreateMode} className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-950 transition-colors">
                    Back to student Quest
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950 pb-20">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-950 uppercase tracking-widest">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>
            <button type="button" onClick={startCreateMode} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Student Mode
            </button>
          </div>

          <section className="mb-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white shadow-lg shadow-gray-950/10">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-950">Expert Workspace</h1>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Analyzing framed questions</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Rank</p>
                    <p className="text-sm font-bold text-gray-950">Expert Analyst</p>
                 </div>
                 <div className="h-8 w-px bg-gray-100" />
                 <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-xl font-bold text-gray-950 tracking-tight">{expertScore}</span>
                 </div>
              </div>
            </div>
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                   <h2 className="text-2xl font-bold text-gray-950 mb-3">Welcome, {expertProfile.name}</h2>
                   <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                      Select a scenario from the grid below to view pending questions. Each approved answer contributes 100 points to your global expert ranking.
                   </p>
                </div>
                <div className="w-full md:w-64">
                   <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workspace Progress</span>
                      <span className="text-xs font-bold text-gray-950">{expertProgress}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${expertProgress}%` }}
                        className="h-full bg-gray-950 rounded-full"
                      />
                   </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={submitExpertAnswer} className="space-y-12">
            <section>
              <div className="mb-6 flex items-end justify-between">
                 <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Select Context</h2>
                 <p className="text-xs font-bold text-gray-950">{trainingScenarios.length} Scenarios available</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trainingScenarios.map((scenario) => {
                  const selected = expertScenarioId === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => chooseExpertScenario(scenario.id)}
                      className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 ${
                        selected
                          ? "border-gray-950 bg-gray-950 text-white shadow-xl shadow-gray-950/20 ring-4 ring-gray-950/5"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-4 ${
                        selected ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {scenario.category}
                      </span>
                      <h3 className="text-base font-bold mb-2 line-clamp-1">{scenario.title}</h3>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${selected ? "text-gray-400" : "text-gray-500"}`}>
                        {scenario.content}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {expertScenarioId && (
            <AnimatePresence mode="wait">
              <motion.section
                key={expertScenarioId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid gap-8 lg:grid-cols-[1fr_1.2fr]"
              >
                {/* Expert Scenario Details */}
                <div className="space-y-6">
                  {expertLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white">
                      <div className="h-8 w-8 border-4 border-gray-200 border-t-gray-950 rounded-full animate-spin mb-4" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Case...</p>
                    </div>
                  ) : expertScenario && (
                    <FounderMessage scenario={expertScenario} />
                  )}

                  {!expertLoading && expertQuestion && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50"
                    >
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Pending Question</p>
                      <h4 className="text-lg font-bold text-gray-950 leading-relaxed mb-4">"{expertQuestion.question}"</h4>
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 rounded-md bg-white border border-gray-100 text-[9px] font-bold text-gray-500 uppercase">Type: {expertQuestion.questionType}</span>
                         <span className="text-[9px] font-bold text-gray-400">ID: {expertQuestion.questionId.slice(0, 8)}</span>
                      </div>
                    </motion.div>
                  )}

                  {!expertLoading && !expertQuestion && (
                    <div className="p-8 rounded-3xl border border-emerald-100 bg-emerald-50 text-center">
                       <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-4" />
                       <h4 className="text-lg font-bold text-emerald-950">Queue Empty</h4>
                       <p className="text-sm text-emerald-600 mt-2">All questions for this scenario have been answered. Great work!</p>
                    </div>
                  )}
                </div>

                {/* Expert Answer Form */}
                {expertQuestion && (
                  <div className="rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-4 flex items-center justify-between">
                       <h3 className="text-sm font-bold text-gray-950 uppercase tracking-tight">Structured Analysis Pad</h3>
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">+100 PTS Potential</span>
                    </div>
                    <div className="p-8 space-y-6">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Logical Thought Process</span>
                        <textarea className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none min-h-[120px] resize-none" value={expertAnswer.thoughtProcess} onChange={(e) => setExpertAnswer((current) => ({ ...current, thoughtProcess: e.target.value }))} placeholder="Explain your analytical framework..." />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Indian Context Specificity</span>
                        <textarea className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none min-h-[120px] resize-none" value={expertAnswer.reasonIndianContext} onChange={(e) => setExpertAnswer((current) => ({ ...current, reasonIndianContext: e.target.value }))} placeholder="Regulatory, behavioral, or market nuances..." />
                      </label>

                      <label className="block">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-950 uppercase tracking-tight">Final Expert Answer</span>
                          <span className={`text-[10px] font-bold ${expertAnswer.answer && (answerWordCount < 150 || answerWordCount > 300) ? "text-red-500" : "text-gray-400"}`}>
                            {answerWordCount} / 300 Words
                          </span>
                        </div>
                        <textarea className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none min-h-[180px] resize-none" value={expertAnswer.answer} onChange={(e) => setExpertAnswer((current) => ({ ...current, answer: e.target.value }))} placeholder="Provide the comprehensive answer here..." />
                      </label>

                      {expertError && <p className="text-xs font-bold text-red-500">{expertError}</p>}

                      <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button type="submit" disabled={!canSubmitExpertAnswer || expertSubmitting} className="flex-1 bg-gray-950 text-white rounded-2xl py-4 font-bold hover:bg-gray-800 transition-all disabled:opacity-50 shadow-xl shadow-gray-950/10">
                          {expertSubmitting ? "Syncing..." : "Submit Answer"}
                        </button>
                        <button type="button" disabled={!canSubmitExpertAnswer || expertSubmitting} onClick={() => void saveExpertAnswer(false)} className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">
                          Submit & Exit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            </AnimatePresence>
            )}
          </form>
        </div>
      </main>
    );
  }

  if (trainingMode === "choose") {
    return (
      <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950 pb-20">
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-950 uppercase tracking-[0.2em]">
              <ArrowLeft className="h-4 w-4" />
              Evaldam AI
            </Link>
            <div className="flex items-center gap-3">
              <button type="button" onClick={startAnswerMode} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 transition-all">
                <UserRound className="h-3.5 w-3.5" />
                Expert Access
              </button>
              <button type="button" onClick={startAdminMode} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 transition-all">
                <Download className="h-3.5 w-3.5" />
                Console
              </button>
            </div>
          </div>

          <QuestBriefing onStart={startCreateMode} />
          <div className="max-w-4xl mx-auto mt-20">
            <GlobalLeaderboard entries={leaderboardPreview} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-[Inter,ui-sans-serif,system-ui,sans-serif] text-gray-950 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-12 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-950 uppercase tracking-[0.2em]">
            <ArrowLeft className="h-4 w-4" />
            Evaldam AI
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">Active Session</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <QuestMap
          currentRound={completedScenarioCount}
          totalRounds={REQUIRED_STUDENT_SCENARIOS}
          isUnlocked={completedScenarioCount >= REQUIRED_STUDENT_SCENARIOS}
        />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-2xl mx-auto"
            >
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-bold text-gray-950 mb-2">Participant Registry</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Provide your details to personalize your certificate and track your ranking in the quest.
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Full Name</span>
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={participant.name} onChange={(e) => updateParticipant("name", e.target.value)} placeholder="Jane Doe" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Email</span>
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" type="email" value={participant.email} onChange={(e) => updateParticipant("email", e.target.value)} placeholder="jane@example.com" />
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Your Role</span>
                      <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={participant.role} onChange={(e) => updateParticipant("role", e.target.value)}>
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
                      <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Exposure Level</span>
                      <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={participant.experience} onChange={(e) => updateParticipant("experience", e.target.value)}>
                        <option value="">Select one</option>
                        <option>Beginner</option>
                        <option>Classroom exposure</option>
                        <option>Internship / Work</option>
                        <option>Founder / Operator</option>
                        <option>Advisor / Investor</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">Institution</span>
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={participant.institution} onChange={(e) => updateParticipant("institution", e.target.value)} placeholder="University or Org" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-gray-950 uppercase tracking-tight">City</span>
                      <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-950/5 outline-none" value={participant.city} onChange={(e) => updateParticipant("city", e.target.value)} placeholder="e.g. Mumbai" />
                    </label>
                  </div>

                  <label className="mt-4 group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input className="peer h-5 w-5 opacity-0 absolute cursor-pointer" type="checkbox" checked={participant.consent} onChange={(e) => updateParticipant("consent", e.target.checked)} />
                      <div className={`h-5 w-5 rounded-md border-2 transition-all ${participant.consent ? "bg-gray-950 border-gray-950" : "bg-white border-gray-200"}`}>
                        {participant.consent && <CheckCircle className="h-4 w-4 text-white m-auto" />}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 leading-tight">
                      I understand that my responses will be used for AI training purposes and I am ready to begin the Quest.
                    </span>
                  </label>
                </div>

                <div className="mt-10">
                  <button type="button" disabled={!canContinue} onClick={() => setStep(2)} className="w-full group flex items-center justify-center gap-2 px-8 py-5 bg-gray-950 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-30 shadow-xl shadow-gray-950/20 active:scale-95">
                    Continue to Round 1
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl mx-auto"
            >
              <form onSubmit={submitSurvey} className="space-y-8">
                <div className="flex items-center justify-between mb-2">
                   <div>
                      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">{studentRoundLabel}</h2>
                      <p className="text-2xl font-bold text-gray-950">Analyze Case File</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Progress</p>
                      <p className="text-lg font-bold text-emerald-500 tracking-tight">{studentTrackProgress}%</p>
                   </div>
                </div>

                {selectedScenarios.map((scenario) => (
                  <div key={scenario.id} className="space-y-8">
                    <FounderMessage scenario={scenario} />
                    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                       <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-tight">Question Forge</h3>
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase">Expertise Boost +25</span>
                       </div>
                       <p className="text-sm text-gray-500 mb-8 max-w-lg">
                          Frame 3 specific questions that would help {scenario.title.split(" ")[0]} navigate this challenge effectively.
                       </p>

                       <QuestionForge
                         scenarioId={scenario.id}
                         answers={answers[scenario.id] || { what: "", how: "", why: "" }}
                         onUpdateAnswer={(field, val) => updateAnswer(scenario.id, field, val)}
                         isValid={(field, val) => isQuestionLengthValid(fullQuestion(field, val))}
                         wordCount={(field, val) => countWords(fullQuestion(field, val))}
                       />

                       {submitError && <p className="mt-6 text-sm font-bold text-red-500">{submitError}</p>}

                       <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                          <button type="button" onClick={() => setStep(1)} className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
                             Back to Details
                          </button>
                          <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                             <button type="button" disabled={!canSubmit || submitting} onClick={() => void saveSurveyRound(true)} className="flex-1 px-8 py-4 bg-white border-2 border-gray-950 text-gray-950 rounded-2xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-30">
                                {submitting ? "Processing..." : "Next Scenario"}
                             </button>
                             <button type="submit" disabled={!canSubmitCertificateNow || submitting} className="flex-1 px-8 py-4 bg-gray-950 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-30 shadow-xl shadow-gray-950/20 active:scale-95">
                                {submitting ? "Syncing..." : "Submit Quest"}
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </form>
            </motion.section>
          )}

          {step === 3 && certificateData && (
            <motion.section
              key="step-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto"
            >
              <CertificateCeremony
                participantName={certificateData.name}
                certificateId={certificateData.certificateId}
                issuedAt={certificateData.issuedAt}
                onDownload={downloadCertificate}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
