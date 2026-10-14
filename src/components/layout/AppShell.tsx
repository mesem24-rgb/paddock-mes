"use client";

import { useState, type ReactNode } from "react";
import WorkspaceGate from "@/components/layout/WorkspaceGate";
import StorageStatus from "@/components/layout/StorageStatus";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ProjectProvider } from "@/context/ProjectContext";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { ClientProvider } from "@/context/ClientContext";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <WorkspaceGate>
      <ClientProvider>
        <ProjectProvider>
          <InvoiceProvider>
            <div className="min-h-screen bg-[#f5f5f0]">
              <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />

              <div className="lg:pl-72">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                  <StorageStatus />
                  {children}
                </main>
              </div>
            </div>
          </InvoiceProvider>
        </ProjectProvider>
      </ClientProvider>
    </WorkspaceGate>
  );
}
