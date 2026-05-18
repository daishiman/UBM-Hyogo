export type Phase11EvidenceClaim = {
  classification: string;
  evidencePath: string;
  status: "present" | "pending" | "n/a" | string;
};

const PHASE11_INVENTORY_HEADING = "phase 11 evidence file inventory";

function normalizeHeading(heading: string): string {
  return heading
    .replace(/`/g, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanCell(cell: string): string {
  return cell
    .trim()
    .replace(/^`|`$/g, "")
    .trim();
}

function splitTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;

  return trimmed
    .slice(1, -1)
    .split("|")
    .map(cleanCell);
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parsePhase11EvidenceClaims(markdown: string): Phase11EvidenceClaim[] {
  const lines = markdown.split("\n");
  const headingIndex = lines.findIndex((line) => {
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
    return match ? normalizeHeading(match[1]) === PHASE11_INVENTORY_HEADING : false;
  });

  if (headingIndex === -1) return [];

  const claims: Phase11EvidenceClaim[] = [];
  let header: string[] | null = null;

  for (const line of lines.slice(headingIndex + 1)) {
    if (/^#{1,6}\s+/.test(line)) break;

    const cells = splitTableRow(line);
    if (!cells) {
      if (header && line.trim() !== "") break;
      continue;
    }
    if (isSeparatorRow(cells)) continue;

    if (!header) {
      header = cells.map((cell) => normalizeHeading(cell));
      continue;
    }

    const pathIndex = header.findIndex((cell) => cell === "path" || cell === "evidence path");
    const statusIndex = header.findIndex((cell) => cell === "status");
    const classificationIndex = header.findIndex(
      (cell) => cell === "classification" || cell === "evidence" || cell === "file",
    );

    if (pathIndex === -1 || statusIndex === -1) continue;

    claims.push({
      classification: cells[classificationIndex] ?? "",
      evidencePath: cells[pathIndex] ?? "",
      status: (cells[statusIndex] ?? "").trim(),
    });
  }

  return claims;
}
