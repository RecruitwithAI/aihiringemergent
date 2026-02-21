import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Zap, Users, Brain, Trophy, ArrowRight, MessageSquare } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/login`, loginForm, { withCredentials: true });
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, registerForm, { withCredentials: true });
      toast.success("Account created!");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, title: "AI-Powered Tools", desc: "Build JDs, search strategies, candidate dossiers and more with GPT-5.2" },
    { icon: MessageSquare, title: "Community Challenges", desc: "Pose recruiting challenges, get expert answers, and earn points" },
    { icon: Trophy, title: "Gamified Growth", desc: "Earn XP, unlock badges, and climb the leaderboard" },
    { icon: Zap, title: "Hybrid Intelligence", desc: "The perfect blend of AI tools and human judgement" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="landing-page">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-xl font-semibold font-[Lexend] text-stone-900" data-testid="brand-logo">Bestpl.ai</span>
        </div>
        <Button
          data-testid="get-started-btn"
          onClick={() => setShowAuth(true)}
          className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white"
        >
          Get Started <ArrowRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div className="animate-float-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" strokeWidth={1.5} /> Hybrid Intelligence Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-stone-900 font-[Lexend] leading-tight">
              The Community for{" "}
              <span className="text-primary">Recruiting Leaders</span>
            </h1>
            <p className="text-base md:text-lg text-stone-600 mt-6 leading-relaxed max-w-lg">
              AI-powered tools meets collective expertise. Build JDs, research candidates,
              create dossiers, and learn from the best minds in executive search.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <Button
                data-testid="hero-join-btn"
                onClick={() => setShowAuth(true)}
                className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-white text-base"
              >
                Join the Community
              </Button>
              <Button
                variant="outline"
                data-testid="hero-learn-btn"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full px-8 h-12 border-stone-300 text-stone-700 hover:bg-stone-100 text-base"
              >
                Learn More
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-stone-500">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" strokeWidth={1.5} /> 500+ Leaders</span>
              <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" strokeWidth={1.5} /> 5 AI Tools</span>
              <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4" strokeWidth={1.5} /> Earn XP</span>
            </div>
          </div>

          {/* Right — auth panel or preview cards */}
          {showAuth ? (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 animate-float-in" data-testid="auth-panel">
              <Tabs defaultValue="login">
                <TabsList className="grid grid-cols-2 mb-6 bg-stone-100 rounded-full p-1">
                  <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="login-tab">Sign In</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="register-tab">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-stone-700 text-sm font-medium">Email</Label>
                      <Input data-testid="login-email" type="email" placeholder="you@company.com" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className="mt-1.5" required />
                    </div>
                    <div>
                      <Label className="text-stone-700 text-sm font-medium">Password</Label>
                      <Input data-testid="login-password" type="password" placeholder="Enter password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="mt-1.5" required />
                    </div>
                    <Button data-testid="login-submit-btn" type="submit" disabled={loading} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-11">
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                  <Divider />
                  <Button data-testid="google-login-btn" variant="outline" onClick={handleGoogleLogin} className="w-full rounded-full h-11 border-stone-300 hover:bg-stone-50 text-stone-700 font-medium">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5 mr-2" />
                    Continue with Google
                  </Button>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label className="text-stone-700 text-sm font-medium">Full Name</Label>
                      <Input data-testid="register-name" placeholder="Your name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} className="mt-1.5" required />
                    </div>
                    <div>
                      <Label className="text-stone-700 text-sm font-medium">Email</Label>
                      <Input data-testid="register-email" type="email" placeholder="you@company.com" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} className="mt-1.5" required />
                    </div>
                    <div>
                      <Label className="text-stone-700 text-sm font-medium">Password</Label>
                      <Input data-testid="register-password" type="password" placeholder="Min 6 characters" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} className="mt-1.5" required />
                    </div>
                    <Button data-testid="register-submit-btn" type="submit" disabled={loading} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-11">
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                  <Divider />
                  <Button data-testid="google-register-btn" variant="outline" onClick={handleGoogleLogin} className="w-full rounded-full h-11 border-stone-300 hover:bg-stone-50 text-stone-700 font-medium">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5 mr-2" />
                    Continue with Google
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-4 animate-float-in stagger-2">
              <PreviewCard icon={Trophy} iconBg="bg-emerald-50 text-emerald-600" label="Community Challenge" desc="How to assess cultural fit in remote leadership hires?" tag="+5 XP" tagColor="bg-primary/10 text-primary" />
              <PreviewCard icon={Brain} iconBg="bg-violet-50 text-violet-600" label="AI JD Builder" desc="Generate professional job descriptions in seconds" tag="GPT-5.2" tagColor="bg-violet-100 text-violet-700" />
              <PreviewCard icon={Users} iconBg="bg-amber-50 text-amber-600" label="Leaderboard" desc="Top recruiting leaders ranked by contribution" tag="Live" tagColor="bg-amber-100 text-amber-700" />
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 font-[Lexend] text-center mb-4">Why Bestpl.ai?</h2>
        <p className="text-base text-stone-500 text-center mb-12 max-w-2xl mx-auto">Everything recruiting leaders need to hire smarter, faster, and together.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className={`bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-hover group animate-float-in stagger-${i + 1}`} data-testid={`feature-card-${i}`}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                <f.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 font-[Lexend] mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center">
        <p className="text-sm text-stone-400">Bestpl.ai — The Hybrid Intelligence Community for Recruiting Leaders</p>
      </footer>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
      <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-stone-400">or continue with</span></div>
    </div>
  );
}

function PreviewCard({ icon: Icon, iconBg, label, desc, tag, tagColor }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex items-center gap-4 card-hover">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="text-xs text-stone-500 truncate">{desc}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${tagColor}`}>{tag}</span>
    </div>
  );
}
