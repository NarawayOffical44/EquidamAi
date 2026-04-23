'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    team_size: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Message Sent!</h1>
          <p className="text-neutral-600 mb-6">We'll get back to you within 1 business day to discuss your Enterprise plan.</p>
          <a href="/" className="btn btn-primary">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <a href="/pricing" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Pricing
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Contact Enterprise Sales</h1>
          <p className="text-neutral-600">Tell us about your needs. We'll set up a custom plan for your fund or organisation.</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@yourfund.com"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company / Fund *</label>
                <input
                  type="text"
                  name="company"
                  required
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Ventures"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Team Size</label>
                <select
                  name="team_size"
                  value={form.team_size}
                  onChange={handleChange}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select...</option>
                  <option value="1-5">1–5 people</option>
                  <option value="6-20">6–20 people</option>
                  <option value="21-50">21–50 people</option>
                  <option value="50+">50+ people</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">How can we help? *</label>
              <textarea
                name="message"
                required
                value={form.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us about your use case — number of valuations per month, white-label needs, API access, etc."
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-neutral-500">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="font-medium text-neutral-900">Unlimited profiles</p>
            <p>For large funds</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="font-medium text-neutral-900">White-label</p>
            <p>Your branding</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="font-medium text-neutral-900">API access</p>
            <p>Full integration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
