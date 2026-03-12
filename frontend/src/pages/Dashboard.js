import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Search, Trophy, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "500+ Leaders", icon: Users },
    { label: "5 AI Tools", icon: FileText },
    { label: "Earn XP", icon: Trophy },
  ];

  const highlights = [
    {
      icon: Users,
      title: "Community Challenge",
      description: "How to assess cultural fit in remote leadership hires?",
      badge: "+5 XP",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500"
    },
    {
      icon: FileText,
      title: "AI JD Builder",
      description: "Generate professional job descriptions in seconds",
      badge: "GPT-5.2",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      icon: Search,
      title: "Search Strategy",
      description: "Boolean strings, channel mapping, competitor targeting",
      badge: "AI",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500"
    },
    {
      icon: TrendingUp,
      title: "Leaderboard",
      description: "Top recruiting leaders ranked by community contribution",
      badge: "Live",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-500"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">B</div>
            <span className="text-xl font-heading font-bold">Bestpl.ai</span>
          </div>
          <Link to="/ai-tools">
            <Button className="bg-blue-600 hover:bg-blue-700">Start Here →</Button>
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-12">
            <div className="flex-1">
              <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20">
                ✨ Hybrid Intelligence Platform
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight">
                The Community for<br/>
                <span className="text-blue-500">Recruiting Leaders</span>
              </h1>
              
              <p className="text-lg text-slate-400 mb-8 max-w-xl">
                AI-powered tools meet collective expertise. Build JDs, research candidates, create dossiers, and learn from the best minds in executive search.
              </p>
              
              <div className="flex gap-4 mb-8">
                <Link to="/ai-tools">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Start Here →</Button>
                </Link>
                <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800">Learn More</Button>
              </div>

              <div className="flex gap-8">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-slate-400">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-96 space-y-4">
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Card key={idx} className="p-4 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg ${item.iconBg}`}>
                        <Icon className={`h-4 w-4 ${item.iconColor}`} />
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                        {item.badge}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </Card>
                );
              })}
              
              <Link to="/ai-tools">
                <Button variant="link" className="w-full text-blue-400 hover:text-blue-300">
                  Join Bestpl.ai — It's Free →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/30 border-t border-slate-800 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-heading font-bold text-center mb-4">
            Why <span className="text-blue-500">Bestpl.ai</span>?
          </h2>
          <p className="text-center text-slate-400 mb-12">
            Everything recruiting leaders need to hire smarter, faster, and together.
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: FileText,
                title: "AI-Powered Tools",
                description: "Build JDs, search strategies, candidate dossiers and more — powered by GPT-5.2"
              },
              {
                icon: Users,
                title: "Community Challenges",
                description: "Pose real recruiting challenges, get expert answers, earn XP for every contribution"
              },
              {
                icon: Trophy,
                title: "Gamified Growth",
                description: "Earn XP with every action. Unlock Bronze → Silver → Gold → Diamond badges"
              },
              {
                icon: TrendingUp,
                title: "Hybrid Intelligence",
                description: "The optimal blend of AI precision and human judgement for executive search"
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-6 bg-slate-900/50 border-slate-800">
                  <div className="p-3 rounded-lg bg-blue-500/10 w-fit mb-4">
                    <Icon className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Ready to level up your hiring?
          </h2>
          <p className="text-slate-400 mb-8">
            Join hundreds of recruiting leaders using Hybrid Intelligence to stay ahead.
          </p>
          <Link to="/ai-tools">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Start Here →</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
