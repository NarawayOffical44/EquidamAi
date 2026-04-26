import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    { name: 'Pro', price: '$99', profiles: 3, featured: false },
    { name: 'Plus', price: '$199', profiles: 15, featured: true },
    { name: 'Enterprise', price: 'Custom', profiles: 'Unlimited', featured: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="px-6 py-4 flex justify-between items-center border-b">
        <div className="text-2xl font-bold text-primary">Evaldam</div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="btn btn-ghost">Home</button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Get Started</button>
        </div>
      </nav>

      <div className="py-section px-container">
        <div className="container-lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-neutral-600">Choose the plan that fits your needs</p>
          </div>

          <div className="grid-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card ${plan.featured ? 'card-featured' : ''}`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-primary mb-4">{plan.price}</div>
                <p className="text-neutral-600 mb-6">
                  {plan.profiles} active startup{typeof plan.profiles === 'number' ? (plan.profiles !== 1 ? 's' : '') : ''}
                </p>
                <button className="btn btn-primary w-full">
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="max-w-2xl mx-auto">
              <div className="card mb-4">
                <h3 className="font-bold text-left mb-2">Can I upgrade or downgrade?</h3>
                <p className="text-neutral-600 text-left text-sm">Yes, you can change your plan anytime. Changes take effect at your next billing cycle.</p>
              </div>
              <div className="card">
                <h3 className="font-bold text-left mb-2">Is there a free trial?</h3>
                <p className="text-neutral-600 text-left text-sm">Contact us for a free trial and demo of our valuation platform.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
