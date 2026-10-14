export async function extractDocument(name: string, data: Uint8Array) {
  const extension = name.toLowerCase().split(".").at(-1);
  if (extension === "txt" || extension === "md")
    return new TextDecoder().decode(data);
  if (extension === "docx") {
    const { extractRawText } = await import("mammoth");
    return (await extractRawText({ buffer: Buffer.from(data) })).value;
  }
  if (extension === "pdf") {
    const { getData } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    PDFParse.setWorker(getData());
    const parser = new PDFParse({ data });
    try {
      const info = await parser.getInfo();
      if (info.total > 30)
        throw new Error("Use a document with 30 pages or fewer.");
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  throw new Error("Use a PDF, DOCX, TXT, or Markdown file.");
}
