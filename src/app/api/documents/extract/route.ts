import { createClient } from "@supabase/supabase-js";
import { extractDocument } from "@/lib/extractDocument";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    if (!token)
      return Response.json(
        { error: "Sign in before importing a document." },
        { status: 401 },
      );
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user)
      return Response.json(
        { error: "Sign in again before importing a document." },
        { status: 401 },
      );
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 3500000)
    return Response.json(
      { error: "Use a file smaller than 3 MB." },
      { status: 413 },
    );
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return Response.json({ error: "Choose a document." }, { status: 400 });
    if (file.size > 3000000)
      return Response.json(
        { error: "Use a file smaller than 3 MB." },
        { status: 413 },
      );
    const text = await extractDocument(
      file.name,
      new Uint8Array(await file.arrayBuffer()),
    );
    if (text.length > 100000)
      return Response.json(
        { error: "Document text is too long. Import a shorter section." },
        { status: 400 },
      );
    if (!text.trim())
      return Response.json(
        {
          error:
            "No readable text found. Scanned documents need OCR; paste their text instead.",
        },
        { status: 400 },
      );
    return Response.json(
      { text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Could not read this document. Use an unlocked PDF or DOCX, or paste its text. PDFs must have 30 pages or fewer.",
      },
      { status: 400 },
    );
  }
}
