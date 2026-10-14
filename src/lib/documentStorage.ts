import { getSupabase } from "@/lib/supabase/client";
import type { ProjectDocument } from "@/types";

const bucket = "project-documents";
function localFiles() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("paddock-documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Browser document storage is unavailable."));
  });
}
async function localFile(id: string, file?: File) {
  const db = await localFiles();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const transaction = db.transaction("files", file ? "readwrite" : "readonly");
      const store = transaction.objectStore("files");
      const request = file ? store.put(file, id) : store.get(id);
      let result: Blob | undefined;
      request.onsuccess = () => { result = file ?? request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(new Error("Could not save or read the document in this browser."));
    });
  } finally { db.close(); }
}
export async function saveOriginalDocument(file: File, id: string): Promise<Partial<ProjectDocument>> {
  if (file.size > 3000000 || !/\.(pdf|docx|txt|md)$/i.test(file.name))
    throw new Error("Choose a PDF, DOCX, TXT, or Markdown file up to 3 MB.");
  const client = getSupabase();
  const metadata = { originalName: file.name, type: file.name.split(".").at(-1)!.toUpperCase(), size: `${(file.size / 1024).toFixed(1)} KB` };
  if (!client) {
    await localFile(id, file);
    return { ...metadata, localFileId: id };
  }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sign in before saving a document.");
  const path = `${data.user.id}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const uploaded = await client.storage.from(bucket).upload(path, file, { upsert: false });
  if (uploaded.error) throw new Error(`Could not save the original file. Check that the document-storage setup SQL has been run in Supabase. ${uploaded.error.message}`);
  return { ...metadata, storagePath: path };
}
export async function downloadOriginalDocument(document: ProjectDocument) {
  const filename = document.originalName ?? document.name;
  let url: string;
  let local = false;
  if (document.storagePath) {
    const client = getSupabase();
    if (!client) throw new Error("Sign in to the cloud workspace to download this file.");
    const { data, error } = await client.storage.from(bucket).createSignedUrl(document.storagePath, 60, { download: filename });
    if (error) throw new Error("Could not download the original file. Sign in and try again.");
    url = data.signedUrl;
  } else if (document.localFileId) {
    const file = await localFile(document.localFileId);
    if (!file) throw new Error("This file was saved in another browser, or browser storage was cleared.");
    url = URL.createObjectURL(file);
    local = true;
  } else throw new Error("No original file is saved for this document.");
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (local) setTimeout(() => URL.revokeObjectURL(url), 60000);
}
