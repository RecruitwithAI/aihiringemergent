import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Loader2, FileCode, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logger from "@/lib/logger";

import OverviewSection from "@/components/architecture/OverviewSection";
import TechStackSection from "@/components/architecture/TechStackSection";
import ArchitectureLayersSection from "@/components/architecture/ArchitectureLayersSection";
import DatabaseSchemaSection from "@/components/architecture/DatabaseSchemaSection";
import ApiEndpointsSection from "@/components/architecture/ApiEndpointsSection";
import RbacSection from "@/components/architecture/RbacSection";
import FeaturesSection from "@/components/architecture/FeaturesSection";
import SecuritySection from "@/components/architecture/SecuritySection";
import { DeploymentSection, CredentialsSection } from "@/components/architecture/DeploymentAndCredentials";

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
    (async () => {
      try {
        const response = await axios.get(`${API}/users/admin/architecture-docs`, {
          withCredentials: true,
        });
        setDocs(response.data);
      } catch (err) {
        logger.error("Failed to fetch docs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!docs) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914]">
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

        <OverviewSection overview={docs.overview} />
        <TechStackSection techStack={docs.tech_stack} />
        <ArchitectureLayersSection layers={docs.architecture.layers} />
        <DatabaseSchemaSection collections={docs.database_schema.collections} />
        <ApiEndpointsSection apiEndpoints={docs.api_endpoints} />
        <RbacSection roles={docs.rbac_system.roles} />
        <FeaturesSection features={docs.features} />
        <SecuritySection security={docs.security} />
        <DeploymentSection deployment={docs.deployment} />
        <CredentialsSection credentials={docs.credentials} />
      </div>
    </div>
  );
}
