'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'CEO & Founder',
    company: 'TechFlow AI',
    image: '👩‍💼',
    quote: 'Evaldam gave us data-backed confidence. We showed investors the full 6-method analysis and they were impressed by our preparation.',
    rating: 5,
  },
  {
    name: 'Amit Patel',
    role: 'Founder',
    company: 'FinServe India',
    image: '👨‍💼',
    quote: 'As a first-time founder, I had no idea how to value my startup. Evaldam gave me a framework and professional report to show investors.',
    rating: 5,
  },
  {
    name: 'Rahul Kumar',
    role: 'CEO',
    company: 'CloudOps Pro',
    image: '👨‍💼',
    quote: 'The comparable company analysis was crucial. It showed we were undervalued and justified our valuation ask perfectly.',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'Co-Founder',
    company: 'DataViz Studio',
    image: '👩‍💼',
    quote: 'Raised 3x more than we expected. The sensitivity analysis helped us understand what metrics matter most to VCs.',
    rating: 5,
  },
  {
    name: 'Vikram Singh',
    role: 'CEO',
    company: 'EdTech Solutions',
    image: '👨‍💼',
    quote: 'Professional, fast, and affordable. Better than hiring a consultant for $5000+. Locked in our early-bird pricing too!',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
    setAutoPlay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setAutoPlay(false);
  };

  const testimonial = testimonials[current];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-bold text-primary uppercase tracking-wide mb-6">
            Founder Feedback Examples
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Common Founder Reactions to Evaldam
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Use these examples as placeholders until approved customer testimonials are available.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 shadow-sm">
            {/* Stars */}
            <div className="flex items-center gap-1 mb-6">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
              "{testimonial.quote}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="text-4xl">{testimonial.image}</div>
              <div>
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">
                  {testimonial.role} at <span className="font-semibold">{testimonial.company}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6 text-primary" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrent(i);
                    setAutoPlay(false);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? 'bg-primary w-8' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6 text-primary" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="text-center">
              <p className="text-2xl font-black text-primary">5</p>
              <p className="text-sm text-gray-600">Example Personas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-primary">6</p>
              <p className="text-sm text-gray-600">Valuation Methods</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-primary">60s</p>
              <p className="text-sm text-gray-600">First Estimate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
