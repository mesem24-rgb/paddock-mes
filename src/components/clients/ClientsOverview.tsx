"use client";

import {
  Building2,
  CircleDollarSign,
  Plus,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import ProjectStat from "@/components/projects/ProjectStat";
import StatusBadge from "@/components/shared/StatusBadge";
import { useClients } from "@/context/ClientContext";
import { useProjects } from "@/context/ProjectContext";
import type {
  BusinessClient,
  ClientStatus,
} from "@/types";

type StatusFilter = "All" | ClientStatus;

const statusFilters: StatusFilter[] = [
  "All",
  "Lead",
  "Active",
  "Inactive",
  "Archived",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ClientsOverview() {
  const { clients, isLoaded } = useClients();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const clientProjectData = useMemo(() => {
    return clients.map((client) => {
      const clientProjects = projects.filter(
        (project) =>
          project.clientName.toLowerCase() ===
          client.companyName.toLowerCase(),
      );

      return {
        client,
        projectCount: clientProjects.length,
        totalValue: clientProjects.reduce(
          (sum, project) => sum + project.budget,
          0,
        ),
        outstandingValue: clientProjects.reduce(
          (sum, project) =>
            sum +
            Math.max(
              project.budget - project.amountPaid,
              0,
            ),
          0,
        ),
      };
    });
  }, [clients, projects]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return clientProjectData.filter(({ client }) => {
      const matchesStatus =
        statusFilter === "All" ||
        client.status === statusFilter;

      const matchesSearch =
        !normalizedQuery ||
        client.companyName
          .toLowerCase()
          .includes(normalizedQuery) ||
        client.contactName
          .toLowerCase()
          .includes(normalizedQuery) ||
        client.email
          .toLowerCase()
          .includes(normalizedQuery) ||
        client.industry
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        client.location
          ?.toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    });
  }, [
    clientProjectData,
    searchQuery,
    statusFilter,
  ]);

  const metrics = useMemo(() => {
    const activeClients = clients.filter(
      (client) => client.status === "Active",
    ).length;

    const leads = clients.filter(
      (client) => client.status === "Lead",
    ).length;

    const totalValue = clientProjectData.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );

    return {
      totalClients: clients.length,
      activeClients,
      leads,
      totalValue,
    };
  }, [clients, clientProjectData]);

  if (!isLoaded) {
    return <ClientsLoadingState />;
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#858981]">
            Relationships
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20231f] sm:text-4xl">
            Clients
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#74786f]">
            Manage client relationships, linked projects,
            contacts, notes, and account value.
          </p>
        </div>

        <Link
          href="/clients/new"
          className="flex w-fit items-center gap-2 rounded-xl bg-[#171918] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2a2d2a]"
        >
          <Plus size={17} />
          New client
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProjectStat
          label="Total clients"
          value={String(metrics.totalClients)}
          icon={Users}
          supportingText="All client records"
        />

        <ProjectStat
          label="Active clients"
          value={String(metrics.activeClients)}
          icon={UserCheck}
          supportingText="Currently engaged"
        />

        <ProjectStat
          label="Open leads"
          value={String(metrics.leads)}
          icon={Building2}
          supportingText="Potential relationships"
        />

        <ProjectStat
          label="Client project value"
          value={formatCurrency(metrics.totalValue)}
          icon={CircleDollarSign}
          supportingText="Across linked projects"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-[#dedfd9] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#ecece6] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#92968e]"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search clients, contacts, industries..."
              className="h-11 w-full rounded-xl border border-[#dedfd9] bg-[#fafaf7] pl-10 pr-4 text-sm text-[#292c28] outline-none transition placeholder:text-[#a0a39c] focus:border-[#777b72] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  statusFilter === status
                    ? "bg-[#20231f] text-white"
                    : "bg-[#f1f2ec] text-[#656961] hover:bg-[#e8e9e2]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredClients.length ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredClients.map((item) => (
              <ClientCard
                key={item.client.id}
                client={item.client}
                projectCount={item.projectCount}
                totalValue={item.totalValue}
                outstandingValue={
                  item.outstandingValue
                }
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Building2
              size={38}
              className="mx-auto text-[#a0a39c]"
            />

            <h2 className="mt-4 font-semibold text-[#30332e]">
              No matching clients
            </h2>

            <p className="mt-2 text-sm text-[#81857d]">
              Try changing the search or status filter.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

interface ClientCardProps {
  client: BusinessClient;
  projectCount: number;
  totalValue: number;
  outstandingValue: number;
}

function ClientCard({
  client,
  projectCount,
  totalValue,
  outstandingValue,
}: ClientCardProps) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="group rounded-2xl border border-[#e0e1db] bg-[#fcfcf9] p-5 transition hover:-translate-y-0.5 hover:border-[#c9cbc3] hover:shadow-[0_14px_35px_rgba(31,34,30,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eceee7] text-[#555951]">
          <Building2 size={20} />
        </div>

        <StatusBadge value={client.status} />
      </div>

      <h2 className="mt-5 text-lg font-semibold text-[#282b27] transition group-hover:text-black">
        {client.companyName}
      </h2>

      <p className="mt-1 text-sm text-[#74786f]">
        {client.contactName}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ClientValue
          label="Projects"
          value={String(projectCount)}
        />

        <ClientValue
          label="Total value"
          value={formatCurrency(totalValue)}
        />

        <ClientValue
          label="Outstanding"
          value={formatCurrency(outstandingValue)}
        />

        <ClientValue
          label="Source"
          value={client.source}
        />
      </div>

      <div className="mt-5 border-t border-[#e8e9e3] pt-4">
        <p className="truncate text-xs text-[#858981]">
          {client.industry || "Industry not specified"}
          {client.location
            ? ` · ${client.location}`
            : ""}
        </p>
      </div>
    </Link>
  );
}

function ClientValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#959991]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-[#3a3d38]">
        {value}
      </p>
    </div>
  );
}

function ClientsLoadingState() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-white" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl bg-white"
          />
        ))}
      </div>

      <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}