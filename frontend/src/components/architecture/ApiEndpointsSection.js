import DocsCard from "./DocsCard";

const METHOD_STYLES = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-amber-500/20 text-amber-400",
};

export default function ApiEndpointsSection({ apiEndpoints }) {
  return (
    <DocsCard title="API Endpoints">
      <div className="space-y-4">
        {Object.entries(apiEndpoints).map(([category, data]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-blue-400 mb-3 capitalize">
              {category.replace(/_/g, " ")} ({data.prefix})
            </h3>
            <div className="space-y-2">
              {data.endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                >
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      METHOD_STYLES[endpoint.method] || "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-200 font-mono">{endpoint.path}</p>
                    <p className="text-slate-400 text-xs mt-1">{endpoint.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">{endpoint.auth}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DocsCard>
  );
}
