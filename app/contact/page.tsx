'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

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

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEnterpriseChange = (e: any) => {
    setEnterpriseForm({ ...enterpriseForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Message:', form);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseSubmit = async (e: any) => {
    e.preventDefault();
    if (!enterpriseForm.companyName || !enterpriseForm.name || !enterpriseForm.email || !enterpriseForm.useCase) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      // Save to database first
      const response = await fetch('/api/leads/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: enterpriseForm.name,
          email: enterpriseForm.email,
          companyName: enterpriseForm.companyName,
          useCase: enterpriseForm.useCase,
          type: 'enterprise',
        }),
      });

      if (!response.ok) {
        console.error('Failed to save inquiry');
      }
    } catch (error) {
      console.error('Error saving inquiry:', error);
    }

    // Create WhatsApp message with details
    const message = `Hi, I'm interested in the Enterprise plan for Evaldam AI.

Company: ${enterpriseForm.companyName}
Name: ${enterpriseForm.name}
Email: ${enterpriseForm.email}

Use Case: ${enterpriseForm.useCase}

Please reach out to discuss enterprise features and pricing.`;

    const whatsappNumber = '916398924106'; // WhatsApp number for India
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Reset form
    setEnterpriseForm({ companyName: '', name: '', email: '', useCase: '' });
    setEnterpriseSubmitted(true);
    setLoading(false);
    setTimeout(() => setEnterpriseSubmitted(false), 5000);

    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <div className="relative min-h-[500px] bg-gray-100">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop" alt="Team" className="w-full h-full object-cover" />
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
              <button type="submit" disabled={loading} className="btn btn-primary px-8 py-3 font-bold uppercase tracking-wider disabled:opacity-50">
                {loading ? 'SENDING...' : 'SEND'}
              </button>
            </div>
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
                  className="btn btn-primary px-8 py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  <MessageCircle className="w-5 h-5" />
                  {loading ? 'CONNECTING...' : 'CONTACT ON WHATSAPP'}
                </button>
              </div>
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

      <Footer />
    </div>
  );
}


