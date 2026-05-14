"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Download, Shuffle } from "lucide-react";
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
  rowNumber: number;
  questionId: string;
  questionType: string;
  question: string;
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

function getInitialExpertAssignment() {
  if (typeof window === "undefined") {
    return { enabled: false, scenarioId: "", email: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    enabled: params.get("expert") === "1" && Boolean(params.get("scenarioId")),
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

export default function TrainingPage() {
  const initialExpertAssignment = useMemo(() => getInitialExpertAssignment(), []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [participant, setParticipant] = useState(initialParticipant);
  const [selectedScenarios, setSelectedScenarios] = useState<TrainingScenario[]>(() => shuffledScenarios());
  const [answers, setAnswers] = useState<Record<string, { what: string; how: string; why: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [expertMode] = useState(initialExpertAssignment.enabled);
  const [expertScenarioId] = useState(initialExpertAssignment.scenarioId);
  const [expertScenario, setExpertScenario] = useState<TrainingScenario | null>(null);
  const [expertQuestion, setExpertQuestion] = useState<ExpertQuestion | null>(null);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile>({
    ...initialExpertProfile,
    email: initialExpertAssignment.email,
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
        {words}/26 words · minimum 8 words
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

    return (
      <label className="block">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-gray-900">{label}</span>
          {questionHint(field, value)}
        </div>
        <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          <span className="flex w-16 shrink-0 items-center justify-center border-r border-gray-200 bg-gray-50 text-sm font-black text-primary">
            {label}
          </span>
          <input
            className="min-w-0 flex-1 border-0 bg-white px-4 py-3 text-[16px] font-medium text-gray-900 outline-none placeholder:text-gray-400 sm:text-sm"
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
      };
      setExpertScenario(data.scenario);
      setExpertQuestion(data.question);
    } catch {
      setExpertError("Could not load the assigned expert question. Please try again.");
    } finally {
      setExpertLoading(false);
    }
  };

  useEffect(() => {
    if (expertMode && expertScenarioId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadExpertQuestion(expertScenarioId);
    }
  }, [expertMode, expertScenarioId]);

  const answerWordCount = countWords(expertAnswer.answer);
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
          rowNumber: expertQuestion.rowNumber,
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
        <text x="700" y="760" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#6b7280">Issued on ${issuedDate} · Certificate ID: ${certificateData.certificateId}</text>
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

  if (expertMode) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#ffffff_100%)]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Evaldam AI
          </Link>

          <section className="mb-7">
            <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
              Expert Answer Round
            </span>
            <h1 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-4xl">
              Answer one question at a time.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Each question is mapped to the same assigned scenario. Use the structured format so your answer can become high-quality training data.
            </p>
          </section>

          <form onSubmit={submitExpertAnswer} className="space-y-6 pb-24">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-5 text-xl font-black text-gray-900">Expert Details</h2>
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

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              {expertLoading && <p className="text-sm font-semibold text-gray-600">Loading assigned question...</p>}

              {!expertLoading && expertScenario && (
                <div className="mb-6 border-b border-gray-100 pb-6">
                  <span className="mb-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase text-gray-600">
                    Scenario · {expertScenario.category}
                  </span>
                  <h2 className="text-xl font-black text-gray-900">{expertScenario.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-700">{expertScenario.content}</p>
                </div>
              )}

              {!expertLoading && !expertQuestion && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-900">
                  <p className="font-bold">No pending questions for this scenario right now.</p>
                  <p className="mt-1 text-sm">You answered {expertCompleted} question{expertCompleted === 1 ? "" : "s"} in this session.</p>
                </div>
              )}

              {expertQuestion && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-primary">{expertQuestion.questionType} question</p>
                    <p className="mt-2 text-base font-bold leading-7 text-gray-900">{expertQuestion.question}</p>
                  </div>

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
                </div>
              )}
            </section>

            {expertError && <p className="text-sm font-semibold text-red-600">{expertError}</p>}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-500">
                  Saved this session: {expertCompleted}
                </p>
                <button type="submit" disabled={!canSubmitExpertAnswer || expertSubmitting} className="btn btn-primary disabled:opacity-50">
                  {expertSubmitting ? "Submitting..." : "Submit & Next"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#ffffff_100%)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Evaldam AI
        </Link>

        <section className="mb-7">
          <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
            Training Research
          </span>
          <h1 className="max-w-3xl text-3xl font-black leading-tight text-gray-900 md:text-4xl">
            Read one scenario. Write three good questions.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
            Thank you for helping us. Read the short scenario carefully, then create one What, one How, and one Why question related only to that scenario.
          </p>
        </section>

        <div className="mb-7 grid grid-cols-3 gap-3">
          {["Details", "Questions", "Certificate"].map((label, index) => {
            const active = step === index + 1;
            const done = step > index + 1;
            return (
              <div key={label} className={`rounded-lg border px-4 py-3 ${active ? "border-primary bg-primary/5" : done ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-primary" : "bg-gray-300"}`} />}
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
          <form onSubmit={submitSurvey} className="space-y-5 pb-24">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Create 3 Questions</h2>
                <p className="mt-1 text-sm text-gray-600">Base all three questions on this scenario. 8-26 words each.</p>
              </div>
              <button type="button" onClick={reshuffle} className="btn btn-secondary btn-sm gap-2">
                <Shuffle className="h-4 w-4" />
                Shuffle
              </button>
            </div>

            {selectedScenarios.map((scenario) => (
              <section key={scenario.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 border-b border-gray-100 pb-5">
                  <span className="mb-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase text-gray-600">
                    Scenario · {scenario.category}
                  </span>
                  <h3 className="text-xl font-black text-gray-900">{scenario.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-700">{scenario.content}</p>
                </div>

                <div className="grid gap-5">
                  {questionInput(scenario.id, "what", "is the best valuation method for my startup?")}
                  {questionInput(scenario.id, "how", "should I calculate valuation using the Berkus method?")}
                  {questionInput(scenario.id, "why", "is the DCF method not suitable at this stage?")}
                </div>
              </section>
            ))}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                Back
              </button>
              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                {submitError && <p className="text-sm font-semibold text-red-600">{submitError}</p>}
                <button type="submit" disabled={!canSubmit || submitting} className="btn btn-primary disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Responses"}
                </button>
              </div>
              </div>
            </div>
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
                  Issued on {new Date(certificateData.issuedAt).toLocaleDateString("en-IN")} · Certificate ID: {certificateData.certificateId}
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
