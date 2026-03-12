import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/create-mandate", label: "New Search", icon: PlusCircle },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background" data-testid="app-layout">
      <aside className="w-64 border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-heading font-bold">Bestpl.ai</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}