import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/types';

export default function Home() {
  const { user, role } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center py-32 overflow-hidden">
  {/* Animated gradient background */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5 transform skew-y-6 -rotate-6 origin-top-left animate-gradient-flow"></div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--secondary)/5,_transparent_60%)] animate-pulse-slow"></div>
  </div>

  {/* Floating blobs */}
  <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--primary)]/10 rounded-full mix-blend-soft-light filter blur-3xl animate-float"></div>
  <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--secondary)]/10 rounded-full mix-blend-soft-light filter blur-3xl animate-float-delayed"></div>

  <div className="relative max-w-4xl mx-auto px-4 space-y-8">
    <h1 className="text-6xl md:text-8xl font-extrabold text-[var(--text-dark)] mb-6 leading-tight">
      <span className="relative inline-block">
        <span className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent animate-text-shine">
          Connect
        </span>
        <span aria-hidden="true" className="text-transparent">Connect</span>
      </span>
      <br className="hidden md:block" />
      <span className="mt-4 inline-block">with Exceptional Talent</span>
    </h1>

    <p className="text-xl md:text-2xl text-gray-700 mx-auto max-w-2xl font-medium relative z-10">
      Transform your workforce with intelligent matching powered by machine learning
      <span className="absolute -right-4 top-0 w-3 h-3 bg-[var(--secondary)] rounded-full animate-ping-slow"></span>
    </p>

    {!user ? (
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12 relative z-10">
        <Link
          to="/signup"
          className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-12 py-6 rounded-2xl text-lg font-bold hover:scale-105 transition-transform shadow-2xl hover:shadow-[0_20px_50px_var(--primary)/30%]"
        >
          <span className="relative z-10">Get Started</span>
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
        </Link>
        <Link
          to="/login"
          className="relative overflow-hidden border-2 border-[var(--primary)] text-[var(--primary)] px-12 py-6 rounded-2xl text-lg font-bold hover:bg-[var(--primary)]/5 transition-all group"
        >
          <span className="relative z-10">Sign In</span>
          <div className="absolute inset-0 bg-[var(--primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </Link>
      </div>
    ) : (
      <div className="mt-12 space-y-6 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Welcome Back{role === UserRole.Employer ? ' Employer' : ' Worker'}!
        </h2>
        <Link
          to={role === UserRole.Employer ? '/employer-dashboard' : '/worker-dashboard'}
          className="inline-block bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-12 py-6 rounded-2xl text-lg font-bold hover:scale-105 transition-transform shadow-2xl"
        >
          Go to Dashboard
        </Link>
      </div>
    )}

    {/* Scroll indicator */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
      <div className="w-8 h-14 rounded-3xl border-2 border-[var(--primary)] relative">
        <div className="w-1 h-3 bg-[var(--primary)] rounded-full absolute top-2 left-1/2 -translate-x-1/2 animate-scroll-indicator"></div>
      </div>
    </div>
  </div>
</section>

      {/* Features Section */}
      <section className="py-24 bg-[var(--accent)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-center mb-20 text-[var(--text-dark)]">
            Modern Workforce Solutions
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Smart Hiring",
                icon: "🚀",
                items: ["AI-powered matching", "Instant notifications", "Video profiles", "Skill verification"],
                link: "/signup?role=employer",
                label: "Start Hiring"
              },
              {
                title: "Career Growth",
                icon: "💼",
                items: ["Personalized job alerts", "Portfolio builder", "Skill assessments", "Career tracking"],
                link: "/signup?role=worker",
                label: "Find Work"
              },
              {
                title: "Secure Platform",
                icon: "🔒",
                items: ["End-to-end encryption", "Escrow payments", "Rating system", "24/7 support"]
              }
            ].map((feature) => (
              <div 
                key={feature.title}
                className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 backdrop-blur-lg"
              >
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-3xl font-bold mb-6 text-[var(--text-dark)]">{feature.title}</h3>
                <ul className="space-y-5 text-gray-700">
                  {feature.items.map((item) => (
                    <li 
                      key={item}
                      className="flex items-center text-xl font-medium"
                    >
                      <span className="w-2 h-2 bg-[var(--secondary)] rounded-full mr-4"></span>
                      {item}
                    </li>
                  ))}
                </ul>
                {feature.link && !user && (
                  <Link
                    to={feature.link}
                    className="mt-8 inline-block text-[var(--primary)] font-bold text-lg hover:underline"
                  >
                    {feature.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-20 text-[var(--text-dark)]">
            Trending Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { name: 'Tech Support', count: '1.2k+', icon: '💻' },
              { name: 'Healthcare', count: '800+', icon: '🏥' },
              { name: 'Logistics', count: '650+', icon: '🚚' },
              { name: 'Education', count: '950+', icon: '🎓' },
            ].map((category) => (
              <div
                key={category.name}
                className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl text-center transition-all duration-300 hover:scale-[1.03] shadow-lg hover:shadow-xl"
              >
                <div className="text-6xl mb-6">{category.icon}</div>
                <h3 className="text-3xl font-bold mb-3 text-[var(--text-dark)]">{category.name}</h3>
                <p className="text-2xl font-semibold text-[var(--secondary)]">{category.count} Openings</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[var(--text-dark)] text-[var(--text-light)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Active Members' },
              { number: '95%', label: 'Success Rate' },
              { number: '1M+', label: 'Monthly Matches' },
              { number: '4.9', label: 'Average Rating' },
            ].map((stat) => (
              <div key={stat.label} className="p-6">
                <div className="text-6xl font-bold mb-4 text-[var(--secondary)]">{stat.number}</div>
                <div className="text-xl font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}