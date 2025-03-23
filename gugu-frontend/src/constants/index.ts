export const FEATURES = [
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

export const TRENDING_CATEGORIES = [
  { name: 'Tech Support', count: '1.2k+', icon: '💻' },
  { name: 'Healthcare', count: '800+', icon: '🏥' },
  { name: 'Logistics', count: '650+', icon: '🚚' },
  { name: 'Education', count: '950+', icon: '🎓' },
];

export const STATS = [
  { number: '50K+', label: 'Active Members' },
  { number: '95%', label: 'Success Rate' },
  { number: '1M+', label: 'Monthly Matches' },
  { number: '4.9', label: 'Average Rating' },
];

export const fadeInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};