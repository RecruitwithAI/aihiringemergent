import DocsCard from "./DocsCard";

function StackGroup({ title, color, entries }) {
  return (
    <div>
      <h3 className={`text-lg font-medium ${color} mb-2`}>{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {Object.entries(entries).map(([key, value]) => (
          <div key={key}>
            <p className="text-slate-400 capitalize">{key.replace(/_/g, " ")}:</p>
            <p className="text-slate-200">{value.toString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TechStackSection({ techStack }) {
  return (
    <DocsCard title="Technology Stack">
      <div className="space-y-4">
        <StackGroup title="Frontend" color="text-blue-400" entries={techStack.frontend} />
        <StackGroup title="Backend" color="text-green-400" entries={techStack.backend} />
        <StackGroup title="Database" color="text-purple-400" entries={techStack.database} />
      </div>
    </DocsCard>
  );
}
