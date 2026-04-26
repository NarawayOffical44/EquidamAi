import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <nav className="px-6 py-4 flex justify-between items-center border-b">
        <div className="text-2xl font-bold text-primary">Evaldam</div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/pricing')} className="btn btn-ghost">Pricing</button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Get Started</button>
        </div>
      </nav>

      <section className="py-hero px-container">
        <div className="container-max text-center">
          <h1 className="text-5xl font-bold mb-6">AI-Powered Startup Valuation</h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Get accurate, multi-method valuations in minutes. Professional results for founders and VCs.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-lg btn-primary">
            Start Valuation
          </button>
        </div>
      </section>

      <section className="py-section px-container bg-neutral-50">
        <div className="container-max">
          <h2 className="text-3xl font-bold text-center mb-12">6 Professional Methods</h2>
          <div className="grid-3">
            {['Scorecard', 'Berkus', 'VC Method', 'DCF LTG', 'Exit Multiples', 'Evaldam Score'].map((method) => (
              <div key={method} className="card">
                <h3 className="font-bold mb-2">{method}</h3>
                <p className="text-sm text-neutral-600">Professional valuation methodology</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-section px-container text-center text-neutral-600 border-t">
        <p>&copy; 2026 Evaldam AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
