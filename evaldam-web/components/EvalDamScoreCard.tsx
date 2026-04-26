'use client';

interface EvalDamScoreCardProps {
  valuation: {
    methods?: Array<{
      methodName: string;
      midEstimate: number;
      proprietary?: {
        internalPercentile?: number;
        industryGrowthPremium?: number;
        teamExitHistory?: boolean;
        moatStrength?: number;
        marketTimingScore?: number;
      };
      reasoning?: string;
    }>;
  };
}

export function EvalDamScoreCard({ valuation }: EvalDamScoreCardProps) {
  const evalDamMethod = valuation.methods?.find(m => m.methodName === 'evaldam-score');

  if (!evalDamMethod) return null;

  const props = evalDamMethod.proprietary || {};
  const percentile = props.internalPercentile || 50;
  const moat = props.moatStrength || 50;
  const timing = props.marketTimingScore || 50;
  const industryGrowth = (props.industryGrowthPremium || 0);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-cyan/10 border border-primary/30 rounded-lg p-6 my-6">
      <h3 className="text-lg font-bold text-primary mb-4">EVALDAM PROPRIETARY SCORE</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Percentile */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">Database Percentile</p>
          <p className="text-2xl font-bold text-cyan">{percentile}<span className="text-sm">th</span></p>
          <p className="text-xs text-neutral-500">vs. similar-stage companies</p>
        </div>

        {/* Moat Strength */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">Moat Strength</p>
          <p className="text-2xl font-bold text-cyan">{moat}<span className="text-sm">/100</span></p>
          <p className="text-xs text-neutral-500">Competitive advantage rating</p>
        </div>

        {/* Market Timing */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">Market Timing</p>
          <p className="text-2xl font-bold text-cyan">{timing}<span className="text-sm">/100</span></p>
          <p className="text-xs text-neutral-500">Industry growth tailwinds</p>
        </div>

        {/* Industry Premium */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">Growth Premium</p>
          <p className="text-2xl font-bold text-cyan">{(industryGrowth > 0 ? '+' : '')}{industryGrowth.toFixed(1)}<span className="text-sm">%</span></p>
          <p className="text-xs text-neutral-500">Industry growth adjustment</p>
        </div>
      </div>

      {/* Team Exits Badge */}
      {props.teamExitHistory && (
        <div className="bg-green-900/20 border border-green-700/30 rounded px-3 py-2 mb-4">
          <p className="text-sm text-green-300">✓ Founded team has previous exits</p>
        </div>
      )}

      {/* Method Breakdown */}
      {evalDamMethod.reasoning && (
        <details className="mt-4">
          <summary className="text-sm font-medium text-neutral-300 cursor-pointer hover:text-primary transition">
            View detailed breakdown
          </summary>
          <div className="mt-3 text-xs text-neutral-400 whitespace-pre-wrap bg-neutral-900/50 p-3 rounded border border-neutral-700 max-h-40 overflow-y-auto">
            {evalDamMethod.reasoning.substring(0, 500)}...
          </div>
        </details>
      )}

      <p className="text-xs text-neutral-500 mt-4 text-center">
        Proprietary Evaldam Score combines internal DB comparison, industry growth, team track record, and market timing
      </p>
    </div>
  );
}
