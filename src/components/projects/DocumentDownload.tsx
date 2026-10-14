"use client";
import { useState } from "react";
import type { ProjectDocument } from "@/types";
import { downloadOriginalDocument } from "@/lib/documentStorage";
export default function DocumentDownload({ document }: { document: ProjectDocument }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!document.storagePath && !document.localFileId) return null;
  return <div className="mt-2 text-sm">
    <button disabled={busy} className="underline disabled:opacity-50" onClick={async () => {
      setBusy(true); setError("");
      try { await downloadOriginalDocument(document); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not download this file."); }
      finally { setBusy(false); }
    }}>{busy ? "Preparing download…" : "Download original"}</button>
    {document.localFileId && <p className="text-xs text-[#71756e]">Saved in this browser only</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
