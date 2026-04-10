import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Users, Target, TrendingUp, Zap } from "lucide-react";

export default function AITools() {
  const tools = [
    {
      id: "community-challenge",
      title: "Community Challenge",
      description: "How to assess cultural fit in remote leadership hires?",
      icon: Users,
      badge: "+5 XP",
      badgeVariant: "secondary",
      link: "/community-challenge",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500"
    },
    {
      id: "ai-jd-builder",
      title: "AI JD Builder",
      description: "Generate professional job descriptions in seconds",
      icon: FileText,
      badge: "GPT-5.2",
      badgeVariant: "default",
      link: "/ai-jd-builder",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500"
    },
    {
      id: "search-strategy",
      title: "Search Strategy",
      description: "Boolean strings, channel mapping, competitor targeting",
      icon: Search,
      badge: "AI",
      badgeVariant: "secondary",
      link: "/search-strategy",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500"
    },
    {
      id: "candidate-research",
      title: "Candidate Research",
      description: "Deep-dive candidate profiles, dossiers, and competitive intelligence",
      icon: FileText,
      badge: "AI",
      badgeVariant: "secondary",
      link: "/candidate-research",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-500"
    },
    {
      id: "talent-scout",
      title: "Talent Scout",
      description: "AI-powered candidate sourcing and research from target companies",
      icon: Target,
      badge: "NEW",
      badgeVariant: "default",
      link: "/talent-scout",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500"
    },
    {
      id: "leaderboard",
      title: "Leaderboard",
      description: "Top recruiting leaders ranked by community contribution",
      icon: TrendingUp,
      badge: "Live",
      badgeVariant: "secondary",
      link: "/leaderboard",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-8" data-testid="ai-tools-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            AI-Powered Tools
          </h1>
          <p className="text-lg text-slate-400">
            Build JDs, search strategies, candidate dossiers and more — powered by GPT-5.2
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} to={tool.link}>
                <Card 
                  className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer group"
                  data-testid={`tool-card-${tool.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${tool.iconBg}`}>
                      <Icon className={`h-6 w-6 ${tool.iconColor}`} />
                    </div>
                    <Badge 
                      variant={tool.badgeVariant}
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                    >
                      {tool.badge}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-slate-400">{tool.description}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}