import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  UploadCloud,
  Network,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Database,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrganizationDataSyncPanel } from "@/components/ontology/OrganizationDataSyncPanel";
import {
  fetchTenants,
  fetchOrganization,
  defaultTenants,
  type TenantItem,
  type OrganizationDetail,
} from "@/services/ontology";

export function TenantDataSyncPage() {
  const navigate = useNavigate();

  // Active Tenant ID
  const [tenantId, setTenantId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pph_current_tenant_id") || "ORGANIZATION-001";
    }
    return "ORGANIZATION-001";
  });

  const handleTenantChange = (newTenant: string) => {
    setTenantId(newTenant);
    if (typeof window !== "undefined") {
      localStorage.setItem("pph_current_tenant_id", newTenant);
    }
  };

  // Queries
  const tenantsQuery = useQuery({
    queryKey: ["ontology", "tenants"],
    queryFn: fetchTenants,
  });

  const organizationQuery = useQuery({
    queryKey: ["ontology", "organization", tenantId],
    queryFn: () => fetchOrganization(tenantId),
  });

  const tenants: TenantItem[] = tenantsQuery.data || [];

  const orgDetail: OrganizationDetail | null = organizationQuery.data || null;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
      {/* Page Header */}
      <section className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <UploadCloud className="size-4" /> Tenant Data Ingestion & Sync Pipeline
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Tenant Data Sync
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Upload single or multi-table organization workforce files. The backend preserves raw datasets in Supabase, resolves confirmed ontology mappings, and upserts live knowledge-graph nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              tenantsQuery.refetch();
              organizationQuery.refetch();
            }}
          >
            <RefreshCw className="mr-1.5 size-3.5" /> Refresh State
          </Button>

          <Button asChild size="sm">
            <Link to="/ontologies">
              <Network className="mr-1.5 size-3.5" /> Open Ontology Studio
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Data Sync Panel */}
      <OrganizationDataSyncPanel
        currentTenantId={tenantId}
        onTenantChange={handleTenantChange}
        tenants={tenants}
        organizationDetail={orgDetail}
        onRefreshOrganization={() => {
          tenantsQuery.refetch();
          organizationQuery.refetch();
        }}
        onOpenLiveGraph={() => navigate({ to: "/ontologies" })}
      />
    </main>
  );
}
