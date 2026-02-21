import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { LayoutDashboard, Brain, MessageSquare, GraduationCap, Trophy, User, LogOut, Zap, Menu, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ai-tools", label: "AI Tools", icon: Brain },
  { to: "/challenges", label: "Challenges", icon: MessageSquare },
  { to: "/training", label: "Training", icon: GraduationCap },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

function UserAvatar({ user, size = "sm" }) {
  const dims = size === "lg" ? "w-16 h-16 text-xl" : size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  if (user?.picture) {
    return <img src={user.picture} alt={user.name} className={`${dims} rounded-full object-cover`} />;
  }
  const initial = (user?.name || "?")[0].toUpperCase();
  const colors = ["bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
  const colorIndex = (user?.name || "").length % colors.length;
  return (
    <div className={`${dims} rounded-full avatar-initials ${colors[colorIndex]}`}>
      {initial}
    </div>
  );
}

export { UserAvatar };

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-nav" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0" data-testid="nav-logo">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-semibold font-[Lexend] text-white">Bestpl.ai</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== "/dashboard" && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                data-testid={`nav-link-${link.label.toLowerCase().replace(" ", "-")}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? "bg-blue-500/10 text-blue-400" 
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <link.icon className="w-4 h-4" strokeWidth={1.5} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-white/[0.06]" 
              data-testid="nav-user-menu"
            >
              <UserAvatar user={user} size="sm" />
              <span className="text-sm font-medium hidden sm:inline text-slate-300">{user?.name?.split(" ")[0]}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#12121a] border-white/[0.08]">
            <DropdownMenuItem 
              onClick={() => navigate("/profile")} 
              data-testid="nav-profile-link"
              className="text-slate-300 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06]"
            >
              <User className="w-4 h-4 mr-2" strokeWidth={1.5} /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              data-testid="nav-logout-btn"
              className="text-slate-300 hover:text-white focus:text-white hover:bg-white/[0.06] focus:bg-white/[0.06]"
            >
              <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#12121a] border-b border-white/[0.08] shadow-2xl z-40" data-testid="mobile-menu">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to || (link.to !== "/dashboard" && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(" ", "-")}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <link.icon className="w-5 h-5" strokeWidth={1.5} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
