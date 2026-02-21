import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Zap, Users, Brain, Trophy, ArrowRight, MessageSquare,
  Sparkles, Target, Award, GraduationCap, TrendingUp, ChevronRight
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  if (user) { navigate("/dashboard", { replace: true }); return null; }

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post(`${API}/auth/login`, loginForm, { withCredentials: true });
      toast.success("Welcome back!"); window.location.href = "/dashboard";
    } catch (err) { toast.error(err.response?.data?.detail || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, registerForm, { withCredentials: true });
      toast.success("Account created!"); window.location.href = "/dashboard";
    } catch (err) { toast.error(err.response?.data?.detail || "Registration failed"); }
    finally { setLoading(false); }
  };

  const features = [
    {
      icon: Brain, title: "AI-Powered Tools", iconColor: "text-blue-400", bg: "bg-blue-500/10",
      desc: "Build JDs, search strategies, candidate dossiers and more — powered by GPT-5.2"
    },
    {
      icon: MessageSquare, title: "Community Challenges", iconColor: "text-cyan-400", bg: "bg-cyan-500/10",
      desc: "Pose real recruiting challenges, get expert answers, earn XP for every contribution"
    },
    {
      icon: Trophy, title: "Gamified Growth", iconColor: "text-amber-400", bg: "bg-amber-500/10",
      desc: "Earn XP with every action. Unlock Bronze → Silver → Gold → Diamond badges"
    },
    {
      icon: Zap, title: "Hybrid Intelligence", iconColor: "text-violet-400", bg: "bg-violet-500/10",
      desc: "The optimal blend of AI precision and human judgement for executive search"
    },
  ];

  const previewCards = [
    { icon: MessageSquare, iconColor: "text-cyan-400", bg: "bg-cyan-500/10", label: "Community Challenge", desc: "How to assess cultural fit in remote leadership hires?", tag: "+5 XP", tagStyle: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
    { icon: Brain, iconColor: "text-blue-400", bg: "bg-blue-500/10", label: "AI JD Builder", desc: "Generate professional job descriptions in seconds", tag: "GPT-5.2", tagStyle: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
    { icon: Target, iconColor: "text-amber-400", bg: "bg-amber-500/10", label: "Search Strategy", desc: "Boolean strings, channel mapping, competitor targeting", tag: "AI", tagStyle: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
    { icon: Award, iconColor: "text-violet-400", bg: "bg-violet-500/10", label: "Leaderboard", desc: "Top recruiting leaders ranked by community contribution", tag: "Live", tagStyle: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
  ];

  return (
    <div className="min-h-screen bg-[#090914] relative overflow-hidden" data-testid="landing-page">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* ── NAVBAR ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-xl font-semibold font-[Lexend] text-white" data-testid="brand-logo">Bestpl.ai</span>
        </div>
        <button
          data-testid="get-started-btn"
          onClick={() => setShowAuth(true)}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200"
        >
          Get Started <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="animate-float-in">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm font-medium mb-7">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} /> Hybrid Intelligence Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white font-[Lexend] leading-[1.1]">
              The Community for{" "}
              <span className="text-blue-400">Recruiting Leaders</span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 mt-6 leading-relaxed max-w-lg">
              AI-powered tools meet collective expertise. Build JDs, research candidates,
              create dossiers, and learn from the best minds in executive search.
            </p>

            <div className="flex items-center gap-3 mt-8 flex-wrap">
              <button
                data-testid="hero-join-btn"
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-7 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium text-base transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                Join the Community <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                data-testid="hero-learn-btn"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 px-7 h-12 rounded-full border border-white/[0.12] text-slate-300 hover:bg-white/[0.05] hover:border-white/[0.20] font-medium text-base transition-all duration-200"
              >
                Learn More
              </button>
            </div>

            <div className="flex items-center gap-6 mt-10 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" strokeWidth={1.5} /> 500+ Leaders</span>
              <span className="flex items-center gap-1.5 text-blue-400/60"><Brain className="w-4 h-4" strokeWidth={1.5} /> 5 AI Tools</span>
              <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4" strokeWidth={1.5} /> Earn XP</span>
            </div>
          </div>

          {/* Right: Auth or Preview Cards */}
          {showAuth ? (
            <div
              className="bg-white/[0.05] border border-white/[0.09] backdrop-blur-md rounded-2xl p-8 animate-float-in shadow-2xl shadow-black/40"
              data-testid="auth-panel"
            >
              <Tabs defaultValue="login">
                <TabsList className="grid grid-cols-2 mb-6 bg-white/[0.06] rounded-full p-1">
                  <TabsTrigger
                    value="login"
                    className="rounded-full text-slate-400 data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200"
                    data-testid="login-tab"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="rounded-full text-slate-400 data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200"
                    data-testid="register-tab"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-slate-400 text-sm font-medium">Email</Label>
                      <Input
                        data-testid="login-email"
                        type="email"
                        placeholder="you@company.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="mt-1.5 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm font-medium">Password</Label>
                      <Input
                        data-testid="login-password"
                        type="password"
                        placeholder="Enter password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="mt-1.5 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                        required
                      />
                    </div>
                    <button
                      data-testid="login-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </button>
                  </form>
                  <DarkDivider />
                  <button
                    data-testid="google-login-btn"
                    onClick={handleGoogleLogin}
                    className="w-full h-11 rounded-full bg-white/[0.05] border border-white/[0.10] text-slate-300 hover:bg-white/[0.10] font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="G" className="w-4 h-4" />
                    Continue with Google
                  </button>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label className="text-slate-400 text-sm font-medium">Full Name</Label>
                      <Input
                        data-testid="register-name"
                        placeholder="Your name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="mt-1.5 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm font-medium">Email</Label>
                      <Input
                        data-testid="register-email"
                        type="email"
                        placeholder="you@company.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="mt-1.5 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm font-medium">Password</Label>
                      <Input
                        data-testid="register-password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="mt-1.5 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                        required
                      />
                    </div>
                    <button
                      data-testid="register-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                  </form>
                  <DarkDivider />
                  <button
                    data-testid="google-register-btn"
                    onClick={handleGoogleLogin}
                    className="w-full h-11 rounded-full bg-white/[0.05] border border-white/[0.10] text-slate-300 hover:bg-white/[0.10] font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="G" className="w-4 h-4" />
                    Continue with Google
                  </button>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-3 animate-float-in stagger-2">
              {previewCards.map((card, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 flex items-center gap-4 hover:border-blue-500/20 hover:bg-white/[0.06] transition-all duration-300"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-200">{card.label}</p>
                    <p className="text-xs text-slate-500 truncate">{card.desc}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${card.tagStyle}`}>
                    {card.tag}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setShowAuth(true)}
                className="w-full mt-1 py-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] text-blue-400 text-sm font-medium hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2"
                data-testid="panel-join-btn"
              >
                Join Bestpl.ai — It's Free <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-[Lexend] mb-3">
            Why <span className="text-blue-400">Bestpl.ai</span>?
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">Everything recruiting leaders need to hire smarter, faster, and together.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 group hover:border-blue-500/20 hover:bg-white/[0.06] transition-all duration-300 animate-float-in"
              style={{ animationDelay: `${i * 0.08}s` }}
              data-testid={`feature-card-${i}`}
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-white font-[Lexend] mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-12 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-white font-[Lexend] mb-1">Ready to level up your hiring?</h3>
            <p className="text-slate-500 text-sm">Join hundreds of recruiting leaders using Hybrid Intelligence to stay ahead.</p>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-2 px-8 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium whitespace-nowrap transition-all duration-200 shadow-lg shadow-blue-500/25"
            data-testid="cta-join-btn"
          >
            Get Started Free <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-slate-500 text-sm font-medium">Bestpl.ai</span>
        </div>
        <p className="text-xs text-slate-700">The Hybrid Intelligence Community for Recruiting Leaders</p>
      </footer>
    </div>
  );
}

function DarkDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.08]" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-transparent px-3 text-slate-600 bg-[#0d0d1e]">or continue with</span>
      </div>
    </div>
  );
}
