import DocsCard from "./DocsCard";

export default function FeaturesSection({ features }) {
  return (
    <DocsCard title="Features">
      {/* AI Tools */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-blue-400 mb-3">
          AI Tools ({features.ai_tools.count})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.ai_tools.tools.map((tool) => (
            <div key={tool.name} className="p-3 rounded-lg bg-white/5 border border-white/10">
              <h4 className="text-white font-medium mb-1">{tool.name}</h4>
              <p className="text-xs text-slate-400 mb-2">{tool.description}</p>
              <p className="text-xs text-slate-500">Model: {tool.ai_model}</p>
              {tool.special_features && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tool.special_features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-slate-400">
          <p>
            <strong>Export Formats:</strong> {features.ai_tools.export_formats.join(", ")}
          </p>
          <p>
            <strong>File Upload:</strong> {features.ai_tools.file_upload_support ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>Audio Transcription:</strong>{" "}
            {features.ai_tools.audio_transcription ? "✅ Yes" : "❌ No"}
          </p>
        </div>
      </div>

      {/* Other Features */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-green-400 mb-2">Community Features</h3>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            <li>{features.community.challenges}</li>
            <li>{features.community.answers}</li>
            <li>{features.community.gamification}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium text-purple-400 mb-2">User Management</h3>
          <p className="text-sm text-slate-300">
            {features.user_management.profile_fields} profile fields |{" "}
            {features.user_management.mandatory_fields.length} mandatory |{" "}
            API Key Management: {features.user_management.api_key_management ? "✅" : "❌"} |{" "}
            Usage Tracking: {features.user_management.usage_tracking}
          </p>
        </div>
      </div>
    </DocsCard>
  );
}
