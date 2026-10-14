export interface BillingSuggestion {
  description: string;
  amount: string;
  sendDate: string;
  dueDate: string;
}
export interface DocumentSuggestions {
  clientName: string;
  contactName: string;
  email: string;
  projectName: string;
  budget: string;
  startDate: string;
  dueDate: string;
  billing: BillingSuggestion[];
}
function labeled(text: string, labels: string) {
  return (
    text
      .match(new RegExp(`^(?:${labels})(?:[ \\t]*[:—-][ \\t]*|[ \\t]+|[ \\t]*\\r?\\n\\s*)([^\\r\\n]+)$`, "im"))?.[1]
      ?.trim() ?? ""
  );
}
function date(value: string) {
  const iso = value.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
  if (iso) {
    const parsed = new Date(`${iso}T12:00:00Z`);
    if (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === iso
    )
      return iso;
  }
  const named = value.match(
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
  )?.[0];
  if (named) {
    const parsed = new Date(named + " 12:00:00 UTC");
    const day = Number(named.match(/\s+(\d{1,2})/)?.[1]);
    if (Number.isFinite(parsed.getTime()) && parsed.getUTCDate() === day)
      return parsed.toISOString().slice(0, 10);
  }
  return "";
}
function money(value: string) {
  const found = value.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/)?.[1];
  return found ? found.replace(/,/g, "") : "";
}
export function extractSuggestions(text: string): DocumentSuggestions {
  const projectName = labeled(text, "project name|project title") ||
    labeled(text, "project(?![ \\t]+(?:investment|fee|scope|schedule|start|exclusions|content|responsibilities)\\b)");
  const clientValue = labeled(text, "client|company|prepared for");
  const businessAs = clientValue.match(/^(.*?),?\s+doing business as\s+(.+)$/i);
  const billTo = text.match(/^BILL TO\s*\n([^\n]+)\n([^\n]+)\n([^\n]+@[^\n]+)/im);
  const clientName = businessAs?.[2] || clientValue || billTo?.[2]?.trim() || "";
  const contactName = labeled(text, "client contact|contact name") || businessAs?.[1]?.trim() || billTo?.[1]?.trim() || "";
  const budget = money(labeled(text, "total|contract amount|project budget|project fee|fixed project investment|project investment|total project cost")) ||
    money(text.match(/(?:project investment|project fee)\s*:?\s*(\$[\d,]+(?:\.\d{1,2})?)/i)?.[1] ?? "");
  const billing: BillingSuggestion[] = [];
  for (const line of text.split(/\r?\n/)) {
    const description = line.match(
      /^\s*((?:initial\s+)?deposit|(?:final|second|third|milestone)\s+payment|monthly\s+(?:retainer|maintenance))\s*[:—-]/i,
    )?.[1];
    const amount = money(line);
    if (description && amount)
      billing.push({ description, amount, sendDate: date(line), dueDate: "" });
  }
  if (!billing.length) {
    const schedule = text.match(/^(\d+% AT SIGNING)\s+(\d+% AT MILESTONE)\s+(\d+% BEFORE COMPLETION)\s+(\$[\d,]+(?:\.\d{1,2})?)\s+(\$[\d,]+(?:\.\d{1,2})?)\s+(\$[\d,]+(?:\.\d{1,2})?)/im);
    if (schedule) {
      for (let i = 1; i <= 3; i++) billing.push({ description: schedule[i], amount: money(schedule[i + 3]), sendDate: "", dueDate: "" });
    } else {
      const fullPayment = text.match(/^Payment in full\s+Upon signing and before work begins\s+(\$[\d,]+(?:\.\d{1,2})?)/im);
      if (fullPayment) billing.push({ description: "Payment in full upon signing", amount: money(fullPayment[1]), sendDate: "", dueDate: "" });
    }
  }
  const invoiceAmount = money(
    labeled(text, "invoice total|invoice amount|amount due|balance due"),
  );
  if (invoiceAmount && billing.length === 0)
    billing.push({
      description:
        labeled(text, "invoice description") || projectName || "Imported invoice",
      amount: invoiceAmount,
      sendDate: date(labeled(text, "invoice date|issue date")),
      dueDate: date(labeled(text, "payment due|due date")),
    });
  return {
    clientName,
    contactName,
    email:
      (labeled(text, "client email|contact email|email") || billTo?.[3] || "").match(
        /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
      )?.[0] ?? "",
    projectName,
    budget: budget || invoiceAmount,
    startDate: date(labeled(text, "start date|project start")),
    dueDate: date(
      labeled(text, "completion date|project due date|launch date|deadline"),
    ),
    billing,
  };
}
