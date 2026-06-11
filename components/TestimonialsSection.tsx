'use client';

import { BarChart3, FileText, ShieldCheck } from 'lucide-react';

const useCases = [
  {
    title: 'Prepare the valuation range before a raise',
    description:
      'Turn company inputs into a low, mid, and high pre-money range before investor conversations begin.',
    Icon: BarChart3,
  },
  {
    title: 'Show the assumptions behind the number',
    description:
      'Connect methods, comparables, scenarios, and evidence so the report is easier to explain and review.',
    Icon: ShieldCheck,
  },
  {
    title: 'Track your valuation as the company grows',
    description:
      'Keep every version in one place and watch your number move round over round — momentum you can show investors, not a one-time snapshot.',
    Icon: FileText,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 border border-primary/20 bg-white rounded-full text-sm font-bold text-primary uppercase tracking-wide mb-6">
            Founder Workflows
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Walk into investor conversations ready to defend every number
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Evaldam turns a rough guess into a valuation story — methods, assumptions, and evidence an investor can actually trust.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {useCases.map(({ title, description, Icon }) => (
            <div key={title} className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black leading-snug text-gray-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-gray-300 pt-8 text-center">
          <div>
            <p className="text-2xl font-black text-primary">6</p>
            <p className="text-sm text-gray-600">Valuation methods</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary">∞</p>
            <p className="text-sm text-gray-600">Revisions &amp; versions</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary">1</p>
            <p className="text-sm text-gray-600">Platform, every round</p>
          </div>
        </div>
      </div>
    </section>
  );
}
