import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

// Constants for reusable data
const FEATURES = [
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
];

const TRENDING_CATEGORIES = [
  { name: 'Tech Support', count: '1.2k+', icon: '💻' },
  { name: 'Healthcare', count: '800+', icon: '🏥' },
  { name: 'Logistics', count: '650+', icon: '🚚' },
  { name: 'Education', count: '950+', icon: '🎓' },
];

const STATS = [
  { number: '50K+', label: 'Active Members' },
  { number: '95%', label: 'Success Rate' },
  { number: '1M+', label: 'Monthly Matches' },
  { number: '4.9', label: 'Average Rating' },
];

// Animation configurations
const fadeInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};

const fadeInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="h-screen bg-gradient-to-br from-primary via-[#1E293B] to-[#111827] text-white flex items-center justify-center px-6 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full mix-blend-soft-light filter blur-3xl animate-float" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full mix-blend-soft-light filter blur-3xl animate-float-delayed" />
        </div>

        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-12 px-8">
          <motion.div {...fadeInLeft} className="flex-1 text-left">
            <motion.h1
              className="text-5xl md:text-7xl font-extrabold font-montserrat mb-6 tracking-tight leading-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Welcome to <span className="text-yellow-400">GUGU</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-2xl max-w-2xl opacity-80 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              Connecting skilled workers with trusted employers effortlessly.
            </motion.p>

            <motion.div
              className="flex flex-col md:flex-row gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link
                to="/login"
                className="bg-white/20 backdrop-blur-md text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-opacity-30 transition-all duration-300 border border-white/20"
                aria-label="Log In"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-yellow-400 text-primary px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-yellow-300 transition-all duration-300"
                aria-label="Sign Up"
              >
                Sign Up
              </Link>
            </motion.div>
          </motion.div>

          <motion.div {...fadeInRight} className="flex-1 flex justify-center md:justify-end">
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl transform rotate-6 animate-gradient-rotate" />
              
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-center mb-20 text-text-dark">
            Modern Workforce Solutions
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 backdrop-blur-lg"
              >
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-3xl font-bold mb-6 text-text-dark">{feature.title}</h3>
                <ul className="space-y-5 text-gray-700">
                  {feature.items.map((item) => (
                    <li 
                      key={item}
                      className="flex items-center text-xl font-medium"
                    >
                      <span className="w-2 h-2 bg-secondary rounded-full mr-4" />
                      {item}
                    </li>
                  ))}
                </ul>
                {feature.link && !user && (
                  <Link
                    to={feature.link}
                    className="mt-8 inline-block text-primary font-bold text-lg hover:underline"
                  >
                    {feature.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Opportunities */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-20 text-text-dark">
            Trending Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {TRENDING_CATEGORIES.map((category) => (
              <div
                key={category.name}
                className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl text-center transition-all duration-300 hover:scale-[1.03] shadow-lg hover:shadow-xl"
              >
                <div className="text-6xl mb-6">{category.icon}</div>
                <h3 className="text-3xl font-bold mb-3 text-text-dark">{category.name}</h3>
                <p className="text-2xl font-semibold text-secondary">{category.count} Openings</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-text-dark text-text-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label} className="p-6">
                <div className="text-6xl font-bold mb-4 text-secondary">{stat.number}</div>
                <div className="text-xl font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}