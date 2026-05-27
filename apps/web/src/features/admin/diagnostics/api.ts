import {
  FormsPipelineSnapshotSchema,
  MemberDiagnosisSchema,
  type FormsPipelineSnapshot,
  type MemberDiagnosis,
} from "./types";

const fetchJson = async (path: string): Promise<unknown> => {
  const res = await fetch(`/api/admin${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
};

export async function fetchFormsPipelineSnapshot(): Promise<FormsPipelineSnapshot> {
  return FormsPipelineSnapshotSchema.parse(
    await fetchJson("/diagnostics/forms-pipeline"),
  );
}

export async function fetchMemberDiagnosis(
  memberId: string,
): Promise<MemberDiagnosis> {
  return MemberDiagnosisSchema.parse(
    await fetchJson(`/diagnostics/member/${encodeURIComponent(memberId)}`),
  );
}

