import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Testimonial } from '../lib/types';

//reusable data
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

// Animation
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
  const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);
  const [, setTestimonialsError] = useState<string | null>(null);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('id, content, role, created_at, profiles:user_id (full_name, role)')
          .eq('approved', true)
          .limit(3);

        if (error) throw error;
        setFeaturedTestimonials((data || []).map(t => ({...t, profiles: t.profiles[0]})) as unknown as Testimonial[]);
        setTestimonialsError(null);
        setTestimonialsLoading(false);
      } catch (err) {
        setTestimonialsError('Failed to load testimonials');
        setFeaturedTestimonials([]);
        setTestimonialsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-primary via-[#1E293B] to-[#111827] text-white relative">
         <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/30 rounded-full mix-blend-overlay filter blur-[120px] animate-float" />
          <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-secondary/20 rounded-full mix-blend-overlay filter blur-[140px] animate-float-delayed" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-yellow-400/15 rounded-full mix-blend-overlay filter blur-[100px] animate-pulse" />
          
          {/* Add these new elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-white/5 to-transparent animate-opacity-pulse" />
          
          <motion.div 
            className="absolute w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 rounded-full blur-[100px]"
            animate={{
              x: [-100, 100, -100],
              y: [0, 200, 0],
              rotate: [0, 360, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" />
        </div>

        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-20 px-8 py-24 relative z-10">
          <motion.div {...fadeInLeft} className="flex-1 text-left">
            <motion.span
              className="inline-block text-yellow-400 text-xl font-semibold mb-6 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Welcome to the Future of Work
            </motion.span>
            
            <motion.h1
              className="text-7xl md:text-9xl font-black font-montserrat mb-10 tracking-tight leading-[1] drop-shadow-2xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-200 animate-gradient-x">Perfect Match</span>
            </motion.h1>

            <motion.p
              className="text-2xl md:text-3xl max-w-2xl opacity-90 mb-12 leading-relaxed font-light"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              Connect with top employers and talented professionals on GUGU's AI-powered platform. Your next opportunity awaits.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link
                to="/signup"
                className="group bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-primary px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
                aria-label="Sign Up"
              >
                Get Started
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="bg-white/10 backdrop-blur-xl text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center transform hover:scale-105"
                aria-label="Log In"
              >
                Log In
              </Link>
            </motion.div>

            <motion.div
              className="mt-16 flex items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner"></div>
                ))}
              </div>
              <p className="text-white/90 text-lg">Join <span className="text-yellow-400 font-semibold">10,000+</span> professionals</p>
            </motion.div>
          </motion.div>

          <motion.div {...fadeInRight} className="flex-1 flex justify-center md:justify-end">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-secondary/30 rounded-[2rem] transform rotate-6 animate-gradient-rotate blur-xl" />
              <div className="absolute inset-0 backdrop-blur-2xl bg-white/10 rounded-[2rem] border border-white/20 shadow-2xl" />
              <div className="relative p-10">
                {/* Hero image placeholder with gradient overlay */}
                <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                  {/* Add your hero image or interactive element here */}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-b from-accent to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl font-bold text-center mb-24 text-text-dark bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Modern Workforce Solutions
          </h2>
          
          <div className="grid md:grid-cols-3 gap-16">
            {FEATURES.map((feature) => (
              <motion.div 
                key={feature.title}
                className="bg-white/80 p-12 rounded-[2rem] shadow-2xl hover:shadow-3xl transition-all duration-500 border border-white/40 backdrop-blur-xl hover:transform hover:-translate-y-2"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-6xl mb-8">{feature.icon}</div>
                <h3 className="text-4xl font-bold mb-8 text-text-dark">{feature.title}</h3>
                <ul className="space-y-6 text-gray-700">
                  {feature.items.map((item) => (
                    <li 
                      key={item}
                      className="flex items-center text-xl font-medium"
                    >
                      <span className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-secondary rounded-full mr-4" />
                      {item}
                    </li>
                  ))}
                </ul>
                {feature.link && !user && (
                  <Link
                    to={feature.link}
                    className="mt-10 inline-flex items-center text-primary font-bold text-xl hover:text-secondary transition-colors duration-300"
                  >
                    {feature.label}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-gradient-to-br from-white to-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl font-bold text-center mb-24 text-text-dark bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            What Our Users Say
          </h2>
          
          {testimonialsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : featuredTestimonials && featuredTestimonials.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-16">
              {featuredTestimonials.map((testimonial) => (
                <motion.div 
                  key={testimonial.id} 
                  className="bg-white/80 p-12 rounded-[2rem] shadow-2xl hover:shadow-3xl transition-all duration-500 border border-white/40 backdrop-blur-xl hover:transform hover:-translate-y-2"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold mr-4">
                      {testimonial.profiles?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-text-dark">{testimonial.profiles?.full_name}</h3>
                      <p className="text-gray-600 capitalize">{testimonial.profiles?.role}</p>
                    </div>
                  </div>
                  <p className="text-xl text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="flex">
                      {/* Star ratings could go here */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">No testimonials available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-6xl font-bold text-center mb-24 text-text-dark">
            Trending Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {TRENDING_CATEGORIES.map((category) => (
              <motion.div
                key={category.name}
                className="group bg-white/90 backdrop-blur-xl p-10 rounded-[2rem] text-center transition-all duration-500 hover:shadow-2xl border border-white/40"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-7xl mb-8 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                <h3 className="text-3xl font-bold mb-4 text-text-dark">{category.name}</h3>
                <p className="text-2xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{category.count} Openings</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-gradient-to-br from-text-dark to-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            {STATS.map((stat) => (
              <motion.div 
                key={stat.label} 
                className="p-8 bg-white/5 backdrop-blur-xl rounded-[2rem] text-center border border-white/10"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">{stat.number}</div>
                <div className="text-2xl font-medium text-white/90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}