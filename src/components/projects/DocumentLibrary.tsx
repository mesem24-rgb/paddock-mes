"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/types";
import DocumentDownload from "@/components/projects/DocumentDownload";

export default function DocumentLibrary({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [format, setFormat] = useState("");
  const documents = projects.flatMap(project =>
    (project.documents ?? []).map(document => ({ project, document })),
  );
  const search = query.trim().toLowerCase();
  const visible = documents.filter(({ project, document }) => {
    const hasOriginal = Boolean(document.storagePath || document.localFileId);
    return (!projectId || project.id === projectId)
      && (!format || (format === "original" ? hasOriginal : !hasOriginal))
      && (!search || [document.name, document.originalName, document.type, project.name, project.clientName]
        .some(value => value?.toLowerCase().includes(search)));
  }).sort((a, b) => b.document.updatedAt.localeCompare(a.document.updatedAt));

  return (
    <section className="my-6 rounded-2xl border bg-white p-5" aria-labelledby="document-library-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="document-library-title" className="text-xl font-semibold">Saved documents</h2>
        <a href="#document-import" className="rounded-lg bg-[#171918] px-4 py-2 text-sm text-white">Import a document</a>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Search documents
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="File, project, or client name" className="mt-1 block w-full rounded-lg border p-3" />
        </label>
        <label className="text-sm">Filter by project
          <select value={projectId} onChange={event => setProjectId(event.target.value)} className="mt-1 block w-full rounded-lg border p-3">
            <option value="">All projects</option>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label className="text-sm">File availability
          <select value={format} onChange={event => setFormat(event.target.value)} className="mt-1 block w-full rounded-lg border p-3">
            <option value="">All documents</option>
            <option value="original">Original file saved</option>
            <option value="text">No original file</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm text-[#71756e]" role="status">Showing {visible.length} of {documents.length} documents</p>
      {!visible.length ? <p className="mt-4 rounded-xl bg-[#f5f5f0] p-4 text-sm">
        {documents.length ? "No documents match these filters." : "Your saved documents will appear here after you attach them to a project."}
      </p> : <ul className="mt-4 space-y-3">
        {visible.map(({ project, document }) => <li key={`${project.id}/${document.id}`} className="rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-medium">{document.name}</h3>
              <p className="mt-1 text-sm text-[#71756e]">{project.clientName} · {project.name}</p>
              <p className="mt-1 text-xs text-[#71756e]">{document.type} · {document.size} · Saved {document.updatedAt.slice(0, 10)}</p>
              <DocumentDownload document={document} />
              {!document.storagePath && !document.localFileId && <p className="mt-2 text-xs text-[#71756e]">Original file was not saved</p>}
            </div>
            <Link href={`/projects/${project.id}`} className="text-sm underline">Open project</Link>
          </div>
          {document.sourceText && <details className="mt-3 text-sm">
            <summary className="cursor-pointer">Read saved text</summary>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f5f5f0] p-3 text-xs">{document.sourceText}</pre>
          </details>}
        </li>)}
      </ul>}
    </section>
  );
}
