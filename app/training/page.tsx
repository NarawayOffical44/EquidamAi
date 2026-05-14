"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList, Download, Gauge, ListChecks, PenLine, Play, ShieldCheck, Shuffle, Timer, Trophy, UserRound } from "lucide-react";
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

type TrainingMode = "choose" | "create" | "answer";

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
    card: "border-[#9d91f4] bg-[#aaa0ff]",
    badge: "bg-white/70 text-[#171428]",
    accent: "text-[#312a77]",
    soft: "bg-[#f1efff]",
  },
  {
    card: "border-[#a5bf55] bg-[#b3cf5c]",
    badge: "bg-white/70 text-[#17200b]",
    accent: "text-[#4d6518]",
    soft: "bg-[#f4fadf]",
  },
  {
    card: "border-[#f06d48] bg-[#ff764f]",
    badge: "bg-white/75 text-[#2a1209]",
    accent: "text-[#8a2b13]",
    soft: "bg-[#fff1eb]",
  },
  {
    card: "border-[#73a8ef] bg-[#82b5ff]",
    badge: "bg-white/70 text-[#07162b]",
    accent: "text-[#174d91]",
    soft: "bg-[#edf5ff]",
  },
  {
    card: "border-[#55c0b1] bg-[#70d6c8]",
    badge: "bg-white/70 text-[#09201d]",
    accent: "text-[#176a60]",
    soft: "bg-[#ecfffc]",
  },
];

function getInitialTrainingRoute() {
  if (typeof window === "undefined") {
    return { mode: "choose" as TrainingMode, scenarioId: "", email: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("expert") === "1" || params.get("mode") === "answer"
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
  const [expertScenarioId, setExpertScenarioId] = useState(initialTrainingRoute.scenarioId);
  const [expertScenario, setExpertScenario] = useState<TrainingScenario | null>(null);
  const [expertQuestion, setExpertQuestion] = useState<ExpertQuestion | null>(null);
  const [expertStats, setExpertStats] = useState<ExpertStats>({ pending: 0, answered: 0, total: 0 });
  const [expertProfile, setExpertProfile] = useState<ExpertProfile>({
    ...initialExpertProfile,
    email: initialTrainingRoute.email,
  });
  const [expertAnswer, setExpertAnswer] = useState(initialExpertAnswer);
  const [expertLoading, setExpertLoading] = useState(false);
  const [expertSubmitting, setExpertSubmitting] = useState(false);
  const [expertError, setExpertError] = useState("");
  const [expertCompleted, setExpertCompleted] = useState(0);

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
    const tones = {
      what: "border-cyan-200 bg-cyan-50 text-cyan-700",
      how: "border-indigo-200 bg-indigo-50 text-indigo-700",
      why: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };

    return (
      <label className="block">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-gray-900">{label}</span>
          {questionHint(field, value)}
        </div>
        <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <span className={`flex w-16 shrink-0 items-center justify-center border-r text-sm font-black ${tones[field]}`}>
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

  const reshuffle = () => {
    setSelectedScenarios(shuffledScenarios());
    setAnswers({});
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
    if (trainingMode === "answer" && expertScenarioId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadExpertQuestion(expertScenarioId);
    }
  }, [trainingMode, expertScenarioId]);

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

  const submitExpertAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
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
      await loadExpertQuestion(expertScenario.id);
    } catch {
      setExpertError("Could not submit this answer. Please try again.");
    } finally {
      setExpertSubmitting(false);
    }
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
  };

  const startAnswerMode = () => {
    setTrainingMode("answer");
    setExpertError("");
  };

  const submitSurvey = async (event: React.FormEvent) => {
    event.preventDefault();
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

      setCertificateData({
        ...participant,
        issuedAt: payload.submittedAt,
        certificateId: `EAI-TRAINING-${Date.now().toString(36).toUpperCase()}`,
      });
      setStep(3);
    } catch {
      setSubmitError("We could not submit your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            for participating in the Evaldam AI model training survey and contributing thoughtful startup finance questions to support India's innovation and national development.
          </div>
        </foreignObject>
        <text x="700" y="760" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#6b7280">Issued on ${issuedDate} - Certificate ID: ${certificateData.certificateId}</text>
        <line x1="145" y1="830" x2="430" y2="830" stroke="#d1d5db" stroke-width="3"/>
        <text x="145" y="870" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#6b7280">Evaldam AI Research Team</text>
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

  if (trainingMode === "answer") {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eefcfb_100%)]">
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

          <section className="mb-7 overflow-hidden rounded-lg border border-gray-900/10 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-gray-950 px-5 py-3 text-white">
              <div className="flex items-center gap-2 text-sm font-black">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-950">
                  <ListChecks className="h-4 w-4" />
                </span>
                Evaldam Answer Sprint
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/80">
                Expert mode
              </span>
            </div>
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 md:p-8">
                <span className="mb-4 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase text-indigo-700">
                  Structured QA Game
                </span>
                <h1 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-4xl">
                  Pick a deck. Clear one round.
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Choose a scenario deck, answer one mapped question, save it, then move to the next round. Every answer stays tied to its scenario and question ID.
                </p>
              </div>
              <div className="grid gap-3 border-t border-gray-200 bg-gray-50 p-5 md:border-l md:border-t-0 md:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#9d91f4] bg-[#aaa0ff] p-4 text-gray-950">
                    <Trophy className="h-5 w-5" />
                    <p className="mt-5 text-2xl font-black">{expertScore}</p>
                    <p className="text-xs font-black uppercase">Score</p>
                  </div>
                  <div className="rounded-lg border border-[#a5bf55] bg-[#b3cf5c] p-4 text-gray-950">
                    <Gauge className="h-5 w-5" />
                    <p className="mt-5 text-2xl font-black">{expertProgress}%</p>
                    <p className="text-xs font-black uppercase">Progress</p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-gray-500">
                    <span>Round progress</span>
                    <span>{expertStats.answered}/{expertStats.total || 0}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-gray-950 transition-all" style={{ width: expertProgressWidth }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={submitExpertAnswer} className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-gray-950 p-2 text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">Expert Profile</h2>
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

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Choose Scenario Deck</h2>
                  <p className="mt-1 text-sm text-gray-600">Pick one question set and keep answering rounds from the same context.</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-950 px-4 py-3 text-sm font-black text-white">
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
                      className={`min-h-40 rounded-lg border p-5 text-left text-gray-950 transition hover:-translate-y-0.5 hover:shadow-sm ${
                        selected ? `${tone.card} ring-4 ring-gray-950/10` : `${tone.card}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${tone.badge}`}>
                          {scenario.category}
                        </span>
                        <Play className="h-5 w-5" />
                      </div>
                      <p className="mt-8 text-xl font-black leading-tight">{scenario.title}</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-gray-950/70">{scenario.content}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {expertScenarioId && (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              {expertLoading && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm font-semibold text-gray-600 shadow-sm">
                  Loading next round...
                </div>
              )}

              {!expertLoading && expertScenario && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between bg-gray-950 px-5 py-3 text-white">
                    <span className="text-xs font-black uppercase tracking-wide">Question Deck</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{expertScenario.category}</span>
                  </div>
                  <div className="p-5">
                  <h2 className="text-2xl font-black leading-tight text-gray-900">{expertScenario.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-700">{expertScenario.content}</p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                      <p className="text-xs font-black uppercase text-cyan-700">Pending</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">{expertStats.pending}</p>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                      <p className="text-xs font-black uppercase text-indigo-700">Answered</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">{expertStats.answered}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-black uppercase text-emerald-700">Progress</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">{expertProgress}%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-gray-950 transition-all" style={{ width: expertProgressWidth }} />
                  </div>

                  {expertQuestion && (
                    <div className={`mt-6 rounded-lg border border-gray-200 p-5 ${scenarioTone(expertScenario.id).soft}`}>
                      <p className={`text-xs font-black uppercase tracking-wide ${scenarioTone(expertScenario.id).accent}`}>
                        Round {expertCompleted + 1} - {expertQuestion.questionType} question
                      </p>
                      <p className="mt-3 text-xl font-black leading-8 text-gray-900">{expertQuestion.question}</p>
                      <p className="mt-3 text-xs font-semibold text-gray-500">Question ID: {expertQuestion.questionId}</p>
                    </div>
                  )}

                  {!expertQuestion && (
                    <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5 text-green-900">
                      <p className="font-bold">No pending questions for this scenario right now.</p>
                      <p className="mt-1 text-sm">You answered {expertCompleted} question{expertCompleted === 1 ? "" : "s"} in this session.</p>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {expertQuestion && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between bg-gray-950 px-5 py-3 text-white">
                    <span className="text-xs font-black uppercase tracking-wide">Answer Pad</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">+100 pts</span>
                  </div>
                  <div className="p-5">
                    <div className="mb-6">
                      <h2 className="text-2xl font-black text-gray-900">Structured Answer</h2>
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
                    <button type="submit" disabled={!canSubmitExpertAnswer || expertSubmitting} className="btn min-w-40 bg-gray-950 text-white hover:bg-gray-800 disabled:opacity-50">
                      {expertSubmitting ? "Saving..." : "Save Round & Next"}
                    </button>
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
      <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eefcfb_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Evaldam AI
          </Link>

          <section className="overflow-hidden rounded-lg border border-gray-900/10 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-gray-950 px-5 py-3 text-white">
              <div className="flex items-center gap-2 text-sm font-black">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-950">
                  <ListChecks className="h-4 w-4" />
                </span>
                Evaldam Training Arena
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/80">
                2 ways to contribute
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-6 md:p-8">
                <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                  Model Training
                </span>
                <h1 className="max-w-2xl text-3xl font-black leading-tight text-gray-900 md:text-5xl">
                  Create questions or answer them.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                  Help Evaldam AI build high-quality Indian startup finance data. You can either frame What, How, and Why questions from a scenario, or answer pending questions as a focused sprint.
                </p>
              </div>

              <div className="grid gap-4 bg-gray-50 p-5 md:p-6">
                <button type="button" onClick={startCreateMode} className="group rounded-lg border border-[#73a8ef] bg-[#82b5ff] p-5 text-left text-gray-950 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase">Part 1</span>
                    <PenLine className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </div>
                  <h2 className="mt-8 text-2xl font-black">Create Questions</h2>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-gray-950/75">
                    Read one scenario and submit one What, one How, and one Why question.
                  </p>
                </button>

                <button type="button" onClick={startAnswerMode} className="group rounded-lg border border-[#a5bf55] bg-[#b3cf5c] p-5 text-left text-gray-950 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase">Part 2</span>
                    <Trophy className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </div>
                  <h2 className="mt-8 text-2xl font-black">Answer Sprint</h2>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-gray-950/75">
                    Choose a scenario deck and answer as many mapped questions as you can.
                  </p>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eefcfb_100%)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Evaldam AI
          </Link>
          <button type="button" onClick={startAnswerMode} className="btn btn-secondary btn-sm">
            Answer Questions
          </button>
        </div>

        <section className="mb-7 overflow-hidden rounded-lg border border-gray-900/10 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-gray-950 px-5 py-3 text-white">
            <div className="flex items-center gap-2 text-sm font-black">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-950">
                <ClipboardList className="h-4 w-4" />
              </span>
              Evaldam Training Survey
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/80">
              {trainingProgress}%
            </span>
          </div>
          <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 md:p-8">
              <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                Training Research
              </span>
              <h1 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-4xl">
                Read one scenario. Write three good questions.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                A short guided survey for collecting real What, How, and Why questions tied to Indian startup finance scenarios.
              </p>
              <div className="mt-6 h-2 max-w-xl overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-gray-950 transition-all" style={{ width: `${trainingProgress}%` }} />
              </div>
            </div>
            <div className="grid gap-3 border-t border-gray-200 bg-gray-50 p-5 md:border-l md:border-t-0 md:p-6">
              <div className="rounded-lg border border-[#9d91f4] bg-[#aaa0ff] p-4 text-gray-950">
                <Timer className="h-5 w-5" />
                <p className="mt-4 text-lg font-black">5 minutes</p>
                <p className="text-sm font-semibold text-gray-950/70">One scenario, three questions.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#a5bf55] bg-[#b3cf5c] p-4 text-gray-950">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="mt-4 text-sm font-black">Privacy aware</p>
                </div>
                <div className="rounded-lg border border-[#73a8ef] bg-[#82b5ff] p-4 text-gray-950">
                  <Download className="h-5 w-5" />
                  <p className="mt-4 text-sm font-black">Certificate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-7 grid grid-cols-3 gap-3">
          {["Details", "Questions", "Certificate"].map((label, index) => {
            const active = step === index + 1;
            const done = step > index + 1;
            return (
              <div key={label} className={`rounded-lg border bg-white px-4 py-3 shadow-sm ${active ? "border-primary ring-4 ring-primary/10" : done ? "border-emerald-200" : "border-gray-200"}`}>
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-primary" : "bg-gray-300"}`} />}
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-8 rounded-lg border border-primary/15 bg-primary/5 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-primary">Objective</p>
              <p className="mt-2 text-sm leading-7 text-gray-700">
                Help Evaldam AI understand what startup finance and valuation questions people naturally ask after reading a real decision scenario. This takes about 5 minutes.
              </p>
            </div>

            <h2 className="mb-5 text-xl font-black text-gray-900">Your Details</h2>
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
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-500">Consent & Privacy</h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                Your responses will be used for Evaldam AI research and training data preparation. Results are reviewed in aggregate and will not publicly identify you.
              </p>
              <label className="mt-4 flex items-start gap-3">
                <input className="mt-1 h-4 w-4 accent-primary" type="checkbox" checked={participant.consent} onChange={(e) => updateParticipant("consent", e.target.checked)} />
                <span className="text-sm leading-6 text-gray-700">
                  I consent to share my responses for research and training data preparation.
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
            {selectedScenarios.map((scenario) => {
              const tone = scenarioTone(scenario.id);
              return (
              <section key={scenario.id} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className={`rounded-lg border p-6 text-gray-950 shadow-sm ${tone.card}`}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${tone.badge}`}>
                      Scenario - {scenario.category}
                    </span>
                    <button type="button" onClick={reshuffle} className="btn btn-sm gap-2 bg-white/80 text-gray-950 shadow-sm hover:bg-white">
                      <Shuffle className="h-4 w-4" />
                      Shuffle
                    </button>
                  </div>
                  <h2 className="text-3xl font-black leading-tight">{scenario.title}</h2>
                  <p className="mt-4 text-sm font-semibold leading-7 text-gray-950/75">{scenario.content}</p>
                  <div className="mt-6 rounded-lg border border-white/50 bg-white/55 p-4">
                    <p className="text-sm font-black text-gray-950">Keep questions inside this context.</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-gray-950/70">Ask what a founder, student, or advisor would naturally want to know after reading this scenario.</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between bg-gray-950 px-5 py-3 text-white">
                    <span className="text-xs font-black uppercase tracking-wide">Question Builder</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">3 prompts</span>
                  </div>
                  <div className="p-6">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <PenLine className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Create 3 Questions</h2>
                      <p className="mt-1 text-sm text-gray-600">One What, one How, and one Why. 8-26 words each.</p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    {questionInput(scenario.id, "what", "is the best valuation method for my startup?")}
                    {questionInput(scenario.id, "how", "should I calculate valuation using the Berkus method?")}
                    {questionInput(scenario.id, "why", "is the DCF method not suitable at this stage?")}
                  </div>

                  {submitError && <p className="mt-5 text-sm font-semibold text-red-600">{submitError}</p>}

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                      Back
                    </button>
                    <button type="submit" disabled={!canSubmit || submitting} className="btn btn-primary min-w-44 disabled:opacity-50">
                      {submitting ? "Submitting..." : "Submit Responses"}
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
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center shadow-sm">
              <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-600" />
              <h2 className="text-2xl font-black text-gray-900">Thank you for participating.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-700">
                Your response has been submitted to Evaldam AI.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-8">
              <div className="certificate-print rounded-lg border-4 border-double border-primary/40 bg-[linear-gradient(135deg,#ffffff_0%,#f7ffff_48%,#ffffff_100%)] p-6 text-center md:p-10">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Evaldam AI</p>
                <h2 className="mt-4 text-3xl font-black text-gray-900 md:text-5xl">Certificate of Participation</h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600">
                  This certificate is proudly presented to
                </p>
                <p className="mx-auto mt-4 max-w-3xl border-b border-gray-300 pb-3 text-3xl font-black text-gray-900 md:text-4xl">
                  {certificateData.name}
                </p>
                <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-700">
                  for participating in the Evaldam AI model training survey and contributing thoughtful startup finance questions to support India&apos;s innovation and national development.
                </p>
                <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Issued on {new Date(certificateData.issuedAt).toLocaleDateString("en-IN")} - Certificate ID: {certificateData.certificateId}
                </p>
                <div className="mt-10 flex items-end justify-between gap-6 text-left">
                  <div>
                    <div className="h-px w-36 bg-gray-300" />
                    <p className="mt-2 text-xs font-bold uppercase text-gray-500">Evaldam AI Research Team</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">evaldam</p>
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
