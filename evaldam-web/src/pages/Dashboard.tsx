import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleValuate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupProfile: {
            companyName: 'Test Startup',
            stage: 'series-a',
            arr: 500000,
            growth: 150,
            team: 10,
            market: 'SaaS',
          },
          userId: 'test-user-1',
        }),
      });
      const data = await response.json();
      console.log('Valuation:', data);
      alert(`Valuation: $${data.data.valuation.blended.weightedAverage.toLocaleString()}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch valuation. Make sure backend is running on localhost:5000');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="px-6 py-4 flex justify-between items-center border-b">
        <div className="text-2xl font-bold text-primary">Evaldam</div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="btn btn-ghost">Home</button>
          <button onClick={() => navigate('/pricing')} className="btn btn-ghost">Pricing</button>
        </div>
      </nav>

      <div className="py-section px-container">
        <div className="container-md">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Create Valuation</h2>
            <p className="text-neutral-600 mb-6">Submit your startup details for a professional valuation.</p>
            <button
              onClick={handleValuate}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Processing...' : 'Test Valuation'}
            </button>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Recent Valuations</h2>
            <p className="text-neutral-600">No valuations yet. Create one to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
