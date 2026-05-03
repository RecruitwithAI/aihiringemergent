import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Loader2, FileCode, Database, Shield, Cloud, Zap, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ArchitectureDocs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "superadmin") {
      navigate("/dashboard");
      return;
    }
    fetchDocs();
  }, [user, navigate]);

  const fetchDocs = async () => {
    try {
      const response = await axios.get(`${API}/users/admin/architecture-docs`, {
        withCredentials: true,
      });
      setDocs(response.data);
    } catch (err) {
      console.error("Failed to fetch docs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!docs) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <FileCode className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">{docs.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>Version: {docs.version}</span>
            <span>•</span>
            <span>Last Updated: {new Date(docs.last_updated).toLocaleDateString()}</span>
            <span>•</span>
            <span>Accessed by: {docs.accessed_by}</span>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-sm text-purple-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <strong>CONFIDENTIAL:</strong> This documentation is only accessible to SuperAdmin users and contains sensitive system information.
            </p>
          </div>
        </div>

        {/* Overview */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Application:</p>
              <p className="text-slate-200">{docs.overview.application}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Architecture Type:</p>
              <p className="text-slate-200">{docs.overview.architecture_type}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Pattern:</p>
              <p className="text-slate-200">{docs.overview.pattern}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Environment:</p>
              <p className="text-slate-200">{docs.overview.environment}</p>
            </div>
          </div>
        </Card>

        {/* Tech Stack */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Technology Stack</h2>
          <div className="space-y-4">
            {/* Frontend */}
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-2">Frontend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries(docs.tech_stack.frontend).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-slate-400 capitalize">{key.replace(/_/g, " ")}:</p>
                    <p className="text-slate-200">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Backend */}
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-2">Backend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries(docs.tech_stack.backend).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-slate-400 capitalize">{key.replace(/_/g, " ")}:</p>
                    <p className="text-slate-200">{value.toString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Database */}
            <div>
              <h3 className="text-lg font-medium text-purple-400 mb-2">Database</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries(docs.tech_stack.database).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-slate-400 capitalize">{key.replace(/_/g, " ")}:</p>
                    <p className="text-slate-200">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Architecture */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            System Architecture
          </h2>
          <div className="space-y-4">
            {docs.architecture.layers.map((layer, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">{layer.name}</h3>
                  <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                    {layer.technology}
                  </span>
                </div>
                {layer.port && (
                  <p className="text-sm text-slate-400 mb-2">Port: {layer.port}</p>
                )}
                <p className="text-sm text-slate-400 mb-2">
                  Hot Reload: {layer.hot_reload ? "✅ Enabled" : "❌ Disabled"}
                </p>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Responsibilities:</p>
                  <ul className="list-disc list-inside text-sm text-slate-300">
                    {layer.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Database Schema */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Database Schema
          </h2>
          <div className="space-y-4">
            {Object.entries(docs.database_schema.collections).map(([name, details]) => (
              <div key={name} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">{name}</h3>
                  {details.total_documents && (
                    <span className="text-xs text-slate-400">{details.total_documents}</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">{details.description}</p>
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-300 mb-2">Key Fields:</p>
                  <div className="space-y-1">
                    {details.key_fields.map((field, i) => (
                      <p key={i} className="text-xs text-slate-400 font-mono">
                        {field}
                      </p>
                    ))}
                  </div>
                </div>
                {details.indexes && (
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-1">Indexes:</p>
                    <p className="text-xs text-slate-400">{details.indexes.join(", ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* API Endpoints */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">API Endpoints</h2>
          <div className="space-y-4">
            {Object.entries(docs.api_endpoints).map(([category, data]) => (
              <div key={category}>
                <h3 className="text-lg font-medium text-blue-400 mb-3 capitalize">
                  {category.replace(/_/g, " ")} ({data.prefix})
                </h3>
                <div className="space-y-2">
                  {data.endpoints.map((endpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-mono ${
                          endpoint.method === "GET"
                            ? "bg-green-500/20 text-green-400"
                            : endpoint.method === "POST"
                            ? "bg-blue-500/20 text-blue-400"
                            : endpoint.method === "PUT"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
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
        </Card>

        {/* RBAC System */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Role-Based Access Control (RBAC)
          </h2>
          <div className="space-y-4">
            {Object.entries(docs.rbac_system.roles).map(([role, details]) => (
              <div key={role} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white capitalize">{role}</h3>
                  <span className="text-xs text-slate-400">{details.count} user(s)</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{details.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-2">Permissions:</p>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {details.permissions.map((perm, i) => (
                        <li key={i}>{perm}</li>
                      ))}
                    </ul>
                  </div>
                  {details.restrictions && (
                    <div>
                      <p className="text-sm font-medium text-red-400 mb-2">Restrictions:</p>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {details.restrictions.map((rest, i) => (
                          <li key={i}>{rest}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
          
          {/* AI Tools */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-blue-400 mb-3">
              AI Tools ({docs.features.ai_tools.count})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.features.ai_tools.tools.map((tool, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-white font-medium mb-1">{tool.name}</h4>
                  <p className="text-xs text-slate-400 mb-2">{tool.description}</p>
                  <p className="text-xs text-slate-500">Model: {tool.ai_model}</p>
                  {tool.special_features && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tool.special_features.map((feature, i) => (
                        <span
                          key={i}
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
                <strong>Export Formats:</strong> {docs.features.ai_tools.export_formats.join(", ")}
              </p>
              <p>
                <strong>File Upload:</strong> {docs.features.ai_tools.file_upload_support ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Audio Transcription:</strong>{" "}
                {docs.features.ai_tools.audio_transcription ? "✅ Yes" : "❌ No"}
              </p>
            </div>
          </div>

          {/* Other Features */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-2">Community Features</h3>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li>{docs.features.community.challenges}</li>
                <li>{docs.features.community.answers}</li>
                <li>{docs.features.community.gamification}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-purple-400 mb-2">User Management</h3>
              <p className="text-sm text-slate-300">
                {docs.features.user_management.profile_fields} profile fields |{" "}
                {docs.features.user_management.mandatory_fields.length} mandatory |{" "}
                API Key Management: {docs.features.user_management.api_key_management ? "✅" : "❌"} |{" "}
                Usage Tracking: {docs.features.user_management.usage_tracking}
              </p>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-400" />
            Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-md font-medium text-blue-400 mb-2">Authentication</h3>
              <ul className="space-y-1 text-slate-300">
                <li>Method: {docs.security.authentication.method}</li>
                <li>Password: {docs.security.authentication.password_hashing}</li>
                <li>Session Duration: {docs.security.authentication.session_duration}</li>
                <li>OAuth: {docs.security.authentication.oauth_provider}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-md font-medium text-green-400 mb-2">Authorization</h3>
              <ul className="space-y-1 text-slate-300">
                <li>Method: {docs.security.authorization.method}</li>
                <li>Middleware: {docs.security.authorization.middleware}</li>
                <li>Frontend: {docs.security.authorization.frontend_guards}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-md font-medium text-purple-400 mb-2">Data Protection</h3>
              <ul className="space-y-1 text-slate-300">
                {Object.entries(docs.security.data_protection).map(([key, value]) => (
                  <li key={key}>
                    {key.replace(/_/g, " ")}: {value}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-md font-medium text-amber-400 mb-2">Privacy</h3>
              <ul className="space-y-1 text-slate-300">
                {Object.entries(docs.security.privacy).map(([key, value]) => (
                  <li key={key}>
                    {key.replace(/_/g, " ")}: {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Deployment */}
        <Card className="p-6 mb-6 bg-card border border-border">
          <h2 className="text-xl font-semibold text-white mb-4">Deployment</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-400">Platform:</p>
              <p className="text-slate-200">{docs.deployment.platform}</p>
            </div>
            <div>
              <h3 className="text-md font-medium text-blue-400 mb-2">Containers</h3>
              {Object.entries(docs.deployment.containers).map(([name, config]) => (
                <div key={name} className="mb-2">
                  <p className="text-slate-300 font-medium capitalize">{name}:</p>
                  <p className="text-slate-400 text-xs">
                    {JSON.stringify(config, null, 2)}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-md font-medium text-green-400 mb-2">Ingress Rules</h3>
              {Object.entries(docs.deployment.ingress_rules).map(([route, target]) => (
                <p key={route} className="text-slate-300">
                  <span className="font-mono text-blue-400">{route}</span> → {target}
                </p>
              ))}
            </div>
          </div>
        </Card>

        {/* Credentials */}
        <Card className="p-6 bg-red-500/10 border border-red-500/30">
          <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Credentials (CONFIDENTIAL)
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="text-md font-medium text-white mb-2">SuperAdmin</h3>
              <p className="text-slate-300">
                Email: <span className="font-mono">{docs.credentials.superadmin.email}</span>
              </p>
              <p className="text-slate-300">Role: {docs.credentials.superadmin.role}</p>
            </div>
            <div>
              <h3 className="text-md font-medium text-white mb-2">Test Users</h3>
              <p className="text-slate-300">
                Admin: <span className="font-mono">{docs.credentials.test_users.admin.email}</span> (
                {docs.credentials.test_users.admin.role})
              </p>
              <p className="text-slate-300">
                Regular Users: {docs.credentials.test_users.regular_user.count} users with role "
                {docs.credentials.test_users.regular_user.role}"
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
