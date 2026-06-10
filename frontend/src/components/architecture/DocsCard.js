import { Card } from "@/components/ui/card";

/** Shared shell for documentation section cards. */
export default function DocsCard({ icon: Icon, iconColor, title, children, className }) {
  return (
    <Card className={className || "p-6 mb-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10"}>
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
        {title}
      </h2>
      {children}
    </Card>
  );
}
