import { GraduationCap, ExternalLink, PlayCircle, BookOpen, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRAINING_MODULES = [
  { id: 1, title: "Hybrid Intelligence Fundamentals", desc: "Learn the core principles of combining AI tools with human judgement in executive search.", icon: BookOpen, duration: "45 min", lessons: 6 },
  { id: 2, title: "AI-Powered JD Writing Masterclass", desc: "Craft compelling job descriptions that attract top leadership talent using AI assistance.", icon: PlayCircle, duration: "30 min", lessons: 4 },
  { id: 3, title: "Advanced Boolean Search Strategies", desc: "Master boolean search strings for LinkedIn, databases, and beyond.", icon: BarChart3, duration: "60 min", lessons: 8 },
  { id: 4, title: "Candidate Dossier Best Practices", desc: "Build client-ready candidate presentations that close deals faster.", icon: Users, duration: "40 min", lessons: 5 },
  { id: 5, title: "Client Research & Business Development", desc: "How to research potential clients and craft winning pitch strategies.", icon: BarChart3, duration: "35 min", lessons: 5 },
  { id: 6, title: "Building Your Recruiting Brand", desc: "Establish thought leadership and attract both candidates and clients.", icon: GraduationCap, duration: "50 min", lessons: 7 },
];

export default function Training() {
  const handleGoToTraining = (moduleId) => {
    // Placeholder TagMango URL
    window.open("https://tagmango.com/bestplai", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="training-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-float-in">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 font-[Lexend]">Training</h1>
          <p className="text-base text-stone-500 mt-1">Access curated learning modules on TagMango to sharpen your recruiting skills</p>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 mb-8 flex items-center gap-4 animate-float-in stagger-1">
          <GraduationCap className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-stone-900">Training recordings are hosted on TagMango</p>
            <p className="text-xs text-stone-500 mt-0.5">Click any module below to access the full training on our learning platform.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_MODULES.map((m, i) => (
            <div
              key={m.id}
              className={`bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-hover group animate-float-in stagger-${Math.min(i + 1, 5)}`}
              data-testid={`training-module-${m.id}`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                <m.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-stone-900 font-[Lexend] mb-1">{m.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed mb-4">{m.desc}</p>
              <div className="flex items-center gap-3 text-xs text-stone-400 mb-4">
                <span>{m.duration}</span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <span>{m.lessons} lessons</span>
              </div>
              <Button
                variant="outline"
                onClick={() => handleGoToTraining(m.id)}
                className="w-full rounded-full border-stone-200 text-stone-700 hover:bg-stone-50 text-sm"
                data-testid={`training-go-btn-${m.id}`}
              >
                Go to Training <ExternalLink className="w-3.5 h-3.5 ml-1.5" strokeWidth={1.5} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
