'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getLeadAttribution } from '@/lib/leads/client-attribution';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

interface EnterpriseForm {
  companyName: string;
  name: string;
  email: string;
  useCase: string;
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [enterpriseForm, setEnterpriseForm] = useState<EnterpriseForm>({ companyName: '', name: '', email: '', useCase: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');
  const [enterpriseError, setEnterpriseError] = useState('');

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEnterpriseChange = (e: any) => {
    setEnterpriseForm({ ...enterpriseForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setContactError('');
    setSubmitted(false);
    try {
      const response = await fetch('/api/leads/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name,
          email: form.email,
          companyName: form.name,
          useCase: 'General contact form',
          message: form.message,
          type: 'contact_form',
          attribution: getLeadAttribution(),
        }),
      });
      if (!response.ok) {
        let message = 'Could not send your message. Please try again.';
        try {
          const data = await response.json();
          message = data.error || data.message || message;
        } catch {
          // Keep generic message when response is not JSON.
        }
        throw new Error(message);
      }
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseSubmit = async (e: any) => {
    e.preventDefault();
    if (!enterpriseForm.companyName || !enterpriseForm.name || !enterpriseForm.email || !enterpriseForm.useCase) {
      setEnterpriseError('Please fill all fields.');
      return;
    }

    setLoading(true);
    setEnterpriseError('');
    setEnterpriseSubmitted(false);

    try {
      const response = await fetch('/api/leads/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: enterpriseForm.name,
          email: enterpriseForm.email,
          companyName: enterpriseForm.companyName,
          useCase: enterpriseForm.useCase,
          type: 'enterprise',
          attribution: getLeadAttribution(),
        }),
      });

      if (!response.ok) {
        let message = 'Could not save your enterprise inquiry. Please try again.';
        try {
          const data = await response.json();
          message = data.error || data.message || message;
        } catch {
          // Keep generic message when response is not JSON.
        }
        throw new Error(message);
      }

      const message = `Hi, I'm interested in the Enterprise plan for Evaldam AI.

Company: ${enterpriseForm.companyName}
Name: ${enterpriseForm.name}
Email: ${enterpriseForm.email}

Use Case: ${enterpriseForm.useCase}

Please reach out to discuss enterprise features and pricing.`;

      const whatsappNumber = '916398924106';
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      setEnterpriseForm({ companyName: '', name: '', email: '', useCase: '' });
      setEnterpriseSubmitted(true);
      setTimeout(() => setEnterpriseSubmitted(false), 5000);
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      setEnterpriseError(error instanceof Error ? error.message : 'Could not save your enterprise inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <div className="relative min-h-[500px] bg-gray-100">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop" alt="Evaldam AI startup valuation support team discussion" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20 flex flex-col justify-center h-full min-h-[500px]">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              LET'S GET IN TOUCH!
            </h1>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-xl">
              If you have any questions on our services, you think we should collaborate, for media inquiries or if you'd simply like to know more about us - we're always happy to connect
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="relative -mt-24 z-30 max-w-2xl mx-auto px-6 mb-20">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-14 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Full name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400" />
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400" />
            <textarea name="message" value={form.message} onChange={handleChange} required rows={8} placeholder="Message" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none" />
            <div className="flex justify-center pt-4">
              <button type="submit" disabled={loading} className="btn btn-primary w-full px-6 py-3 font-bold uppercase tracking-wider disabled:opacity-50 sm:w-auto sm:px-8">
                {loading ? 'SENDING...' : 'SEND'}
              </button>
            </div>
            {contactError && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center font-medium">{contactError}</div>}
            {submitted && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-medium">Thank you! We'll be in touch soon.</div>}
          </form>
        </div>
      </div>

      {/* ENTERPRISE INQUIRY SECTION */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              Interested in Enterprise?
            </h2>
            <p className="text-gray-600">Tell us about your needs and we'll connect with you on WhatsApp to discuss custom solutions.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-14 border border-gray-200">
            <form onSubmit={handleEnterpriseSubmit} className="space-y-6">
              <input
                type="text"
                name="companyName"
                value={enterpriseForm.companyName}
                onChange={handleEnterpriseChange}
                required
                placeholder="Company Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              />
              <input
                type="text"
                name="name"
                value={enterpriseForm.name}
                onChange={handleEnterpriseChange}
                required
                placeholder="Your Full Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              />
              <input
                type="email"
                name="email"
                value={enterpriseForm.email}
                onChange={handleEnterpriseChange}
                required
                placeholder="Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              />
              <textarea
                name="useCase"
                value={enterpriseForm.useCase}
                onChange={handleEnterpriseChange}
                required
                rows={6}
                placeholder="Tell us about your use case: What are you looking to do with Evaldam Enterprise?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
              />
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  className="btn btn-primary w-full px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 sm:w-auto sm:px-8 sm:text-base"
                  disabled={loading}
                >
                  <MessageCircle className="w-5 h-5" />
                  {loading ? 'CONNECTING...' : 'CONTACT ON WHATSAPP'}
                </button>
              </div>
              {enterpriseError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center font-medium">
                  {enterpriseError}
                </div>
              )}
              {enterpriseSubmitted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-medium">
                  Opening WhatsApp with your details...
                </div>
              )}
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            We'll respond to your WhatsApp message to discuss pricing, features, and implementation.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold text-gray-500">Connect with us</span>
          <a href="https://www.linkedin.com/company/evaldamai/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#0A66C2] hover:text-[#0A66C2]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a href="https://x.com/EquidamAi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X (Twitter)
          </a>
          <a href="https://www.youtube.com/@EvaldamAi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-600 hover:text-red-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YouTube
          </a>
          <a href="https://instagram.com/evaldamai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-pink-500 hover:text-pink-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            Instagram
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}


