"use client";

import { useEffect, useState } from "react";
import { Edit2, Save, X, Info } from "lucide-react";

interface AssumptionsData {
  // Valuation parameters
  stage: string;
  industry: string;

  // Market data
  wacc: number;
  riskFreeRate: number;
  countryRiskPremium: number;
  currencyRiskPremium: number;

  // Growth assumptions
  ltgRate: number;
  monthlyGrowthRate: number;

  // Exit multiples
  exitMultiple: number;
  exitTimelineYears: number;

  // Other
  taxRate: number;
  marginAssumption: number;
}

interface MethodologicalAssumptionsProps {
  startup: any;
  assumptions?: Partial<AssumptionsData>;
  onUpdate?: (assumptions: Partial<AssumptionsData>) => void;
}

const DEFAULT_ASSUMPTIONS: Record<string, AssumptionsData> = {
  'default': {
    stage: 'seed',
    industry: 'saas',
    wacc: 0.11,
    riskFreeRate: 0.065, // RBI repo rate for India
    countryRiskPremium: 0.035,
    currencyRiskPremium: 0.02,
    ltgRate: 0.025,
    monthlyGrowthRate: 10,
    exitMultiple: 5.7,
    exitTimelineYears: 7,
    taxRate: 0,
    marginAssumption: 0.4,
  },
};

export function MethodologicalAssumptions({
  startup,
  assumptions,
  onUpdate,
}: MethodologicalAssumptionsProps) {
  const storageKey = `evaldam:assumptions:${startup?.id || "draft"}`;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AssumptionsData>>(() => {
    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem(storageKey);
      if (cached) {
        try {
          return JSON.parse(cached) as Partial<AssumptionsData>;
        } catch {
          window.sessionStorage.removeItem(storageKey);
        }
      }
    }
    return assumptions || DEFAULT_ASSUMPTIONS['default'];
  });

  useEffect(() => {
    setFormData((current) => ({
      ...(assumptions || DEFAULT_ASSUMPTIONS['default']),
      ...current,
    }));
  }, [assumptions]);

  const handleChange = (key: keyof AssumptionsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: typeof DEFAULT_ASSUMPTIONS['default'][key] === 'number'
        ? parseFloat(value)
        : value,
    }));
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, JSON.stringify(formData));
    }
    if (onUpdate) {
      onUpdate(formData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(assumptions || DEFAULT_ASSUMPTIONS['default']);
    setIsEditing(false);
  };

  const data = isEditing ? formData : (assumptions || DEFAULT_ASSUMPTIONS['default']);

  return (
    <div className="space-y-5">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Methodological Assumptions
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Default assumptions provide best accuracy. Customize only if you have better market data.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Variables
          </button>
        )}
      </div>

      {/* Recommendation banner */}
      {!isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Recommendation</p>
            <p className="text-xs text-blue-800 mt-1">
              Use default assumptions for consistent, comparable valuations. Only adjust if you have verified market data from recent transactions or official sources.
            </p>
          </div>
        </div>
      )}

      {/* Main assumptions grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company Context */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Company Context</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs text-gray-600">Stage</label>
              {isEditing ? (
                <select
                  value={formData.stage}
                  onChange={e => handleChange('stage', e.target.value)}
                  className="input text-sm"
                >
                  <option>pre-revenue</option>
                  <option>seed</option>
                  <option>series-a</option>
                  <option>series-b+</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{data.stage}</p>
              )}
            </div>
            <div>
              <label className="form-label text-xs text-gray-600">Industry</label>
              {isEditing ? (
                <select
                  value={formData.industry}
                  onChange={e => handleChange('industry', e.target.value)}
                  className="input text-sm"
                >
                  <option>saas</option>
                  <option>ai</option>
                  <option>fintech</option>
                  <option>deeptech</option>
                  <option>other</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{data.industry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Discount Rate (WACC) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Discount Rate (WACC)</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs text-gray-600">
                WACC — Weighted Average Cost of Capital (%)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.001"
                  value={formData.wacc}
                  onChange={e => handleChange('wacc', e.target.value)}
                  className="input text-sm"
                  placeholder="0.11"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.wacc ?? 0.11) * 100).toFixed(2)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">RBI repo 6.5% + risk premium 4.5%</p>
            </div>
            <div>
              <label className="form-label text-xs text-gray-600">Risk-Free Rate (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.001"
                  value={formData.riskFreeRate}
                  onChange={e => handleChange('riskFreeRate', e.target.value)}
                  className="input text-sm"
                  placeholder="0.065"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.riskFreeRate ?? 0.065) * 100).toFixed(2)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Current RBI repo rate</p>
            </div>
          </div>
        </div>

        {/* Risk Premiums */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Risk Premiums</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs text-gray-600">Country Risk Premium (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.001"
                  value={formData.countryRiskPremium}
                  onChange={e => handleChange('countryRiskPremium', e.target.value)}
                  className="input text-sm"
                  placeholder="0.035"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.countryRiskPremium ?? 0.035) * 100).toFixed(2)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">India-specific risk adjustment</p>
            </div>
            <div>
              <label className="form-label text-xs text-gray-600">Currency Risk Premium (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.001"
                  value={formData.currencyRiskPremium}
                  onChange={e => handleChange('currencyRiskPremium', e.target.value)}
                  className="input text-sm"
                  placeholder="0.02"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.currencyRiskPremium ?? 0.02) * 100).toFixed(2)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">USD cost exposure adjustment</p>
            </div>
          </div>
        </div>

        {/* Growth Assumptions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Growth Assumptions</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs text-gray-600">Long-Term Growth Rate (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.001"
                  value={formData.ltgRate}
                  onChange={e => handleChange('ltgRate', e.target.value)}
                  className="input text-sm"
                  placeholder="0.025"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.ltgRate ?? 0.025) * 100).toFixed(2)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Perpetual growth rate (≤ GDP)</p>
            </div>
            <div>
              <label className="form-label text-xs text-gray-600">Expected Monthly Growth (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  value={formData.monthlyGrowthRate}
                  onChange={e => handleChange('monthlyGrowthRate', e.target.value)}
                  className="input text-sm"
                  placeholder="10"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{(data.monthlyGrowthRate ?? 10).toFixed(1)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">From profile or conservative estimate</p>
            </div>
          </div>
        </div>

        {/* Exit Assumptions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Exit Assumptions</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs text-gray-600">Exit Multiple (ARR or Revenue)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  value={formData.exitMultiple}
                  onChange={e => handleChange('exitMultiple', e.target.value)}
                  className="input text-sm"
                  placeholder="5.7"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{(data.exitMultiple ?? 5.7).toFixed(1)}x</p>
              )}
              <p className="text-xs text-gray-500 mt-1">SaaS median 5.7x (India adjusted)</p>
            </div>
            <div>
              <label className="form-label text-xs text-gray-600">Exit Timeline (Years)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="1"
                  value={formData.exitTimelineYears}
                  onChange={e => handleChange('exitTimelineYears', e.target.value)}
                  className="input text-sm"
                  placeholder="7"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{data.exitTimelineYears ?? 7} years</p>
              )}
              <p className="text-xs text-gray-500 mt-1">India: 7–10 years typical</p>
            </div>
          </div>
        </div>

        {/* Tax & Margin */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Financial Assumptions</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label text-xs text-gray-600">Tax Rate (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.001"
                  value={formData.taxRate}
                  onChange={e => handleChange('taxRate', e.target.value)}
                  className="input text-sm"
                  placeholder="0"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.taxRate ?? 0) * 100).toFixed(2)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">0% if pre-profit, 30% if profitable</p>
            </div>
            <div>
              <label className="form-label text-xs text-gray-600">Gross Margin Assumption (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={formData.marginAssumption}
                  onChange={e => handleChange('marginAssumption', e.target.value)}
                  className="input text-sm"
                  placeholder="0.4"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 py-2">{((data.marginAssumption ?? 0.4) * 100).toFixed(0)}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">SaaS typical: 40–60%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Save buttons */}
      {isEditing && (
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Save className="w-4 h-4" />
            Save Assumptions
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}

      {/* Info footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6">
        <p className="text-xs text-gray-600">
          <strong>How this works:</strong> These assumptions are used across the core valuation methods and supporting score. Changing them will regenerate valuations if you run a new report. We recommend using industry-standard defaults unless you have verified market data showing different rates.
        </p>
      </div>
    </div>
  );
}
