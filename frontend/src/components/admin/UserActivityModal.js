import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserActivityModal({ open, onOpenChange, selectedUser, userActivity }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Activity: {selectedUser?.name}</DialogTitle>
          <DialogDescription>{selectedUser?.email}</DialogDescription>
        </DialogHeader>

        {userActivity && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">
                  {userActivity.total_points}
                </div>
                <div className="text-xs text-slate-400">Total Points</div>
              </Card>
              <Card className="p-4 bg-purple-500/5 border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400">
                  {userActivity.challenges_created}
                </div>
                <div className="text-xs text-slate-400">Challenges</div>
              </Card>
              <Card className="p-4 bg-green-500/5 border-green-500/20">
                <div className="text-2xl font-bold text-green-400">
                  {userActivity.answers_created}
                </div>
                <div className="text-xs text-slate-400">Answers</div>
              </Card>
              <Card className="p-4 bg-amber-500/5 border-amber-500/20">
                <div className="text-2xl font-bold text-amber-400">
                  {userActivity.ai_history?.length || 0}
                </div>
                <div className="text-xs text-slate-400">AI Generations</div>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Recent AI Activity</h3>
              <div className="space-y-2">
                {userActivity.ai_history?.slice(0, 5).map((item, idx) => (
                  <div
                    key={`${item.tool_type}-${item.created_at || idx}`}
                    className="p-3 rounded-lg bg-[#0f1020] border border-white/5 text-sm"
                  >
                    <div className="text-blue-400 font-medium">{item.tool_type}</div>
                    <div className="text-slate-400 text-xs mt-1 line-clamp-2">
                      {item.prompt}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
