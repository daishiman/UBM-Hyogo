// GET /public/form-preview use-case (04a)
// 不変条件 #1 (schema 固定禁止), #14 (schema 集約) — schema_questions を runtime で動的構築。

import type { DbCtx } from "../../repository/_shared/db";

import { listFieldsByVersion } from "../../repository/schemaQuestions";
import { getLatestVersion } from "../../repository/schemaVersions";
import { ApiError } from "@ubm-hyogo/shared/errors";
import { logWarn } from "@ubm-hyogo/shared/logging";
import {
  toFormPreviewView,
  type FormPreviewResponse,
} from "../../view-models/public/form-preview-view";

const FALLBACK_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";
const FALLBACK_FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg";

export interface GetFormPreviewEnv {
  GOOGLE_FORM_ID?: string | undefined;
  FORM_ID?: string | undefined;
  GOOGLE_FORM_RESPONDER_URL?: string | undefined;
}

export interface GetFormPreviewDeps {
  ctx: DbCtx;
  env: GetFormPreviewEnv;
}

const parseChoiceLabels = (raw: string): unknown[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getFormPreviewUseCase = async (
  deps: GetFormPreviewDeps,
): Promise<FormPreviewResponse> => {
  const { ctx, env } = deps;
  const formId = env.GOOGLE_FORM_ID ?? env.FORM_ID ?? FALLBACK_FORM_ID;
  const responderUrl = env.GOOGLE_FORM_RESPONDER_URL ?? FALLBACK_RESPONDER_URL;

  const manifest = await getLatestVersion(ctx, formId);
  if (!manifest) {
    // 503 早期検知用 structured log。staging tail で `code:"UBM-5500"` を grep できるようにする。
    logWarn({
      code: "UBM-5500",
      message: "schema_versions row missing — returning 503",
      context: {
        where: "getFormPreviewUseCase",
        formId,
        usedFallback:
          env.GOOGLE_FORM_ID === undefined && env.FORM_ID === undefined,
      },
    });
    throw new ApiError({
      code: "UBM-5500",
      detail:
        "公開可能な schema_versions が未投入です。schema sync 完了後に再実行してください。",
    });
  }

  const fieldRows = await listFieldsByVersion(ctx, formId, manifest.revisionId);
  const fields = fieldRows.map((r) => ({
    formId,
    revisionId: r.revisionId,
    schemaHash: manifest.schemaHash,
    stableKey: String(r.stableKey),
    questionId: r.questionId,
    itemId: r.itemId,
    sectionKey: r.sectionKey,
    sectionTitle: r.sectionTitle,
    label: r.label,
    kind: r.kind,
    position: r.position,
    required: r.required,
    visibility: r.visibility,
    searchable: r.searchable,
    source: "forms" as const,
    status: r.status,
    choiceLabels: parseChoiceLabels(r.choiceLabelsJson) as Array<{
      rawLabel: string;
      normalizedValue: string;
      position: number;
      active: boolean;
    }>,
  }));

  return toFormPreviewView({
    manifest: {
      formId: manifest.formId,
      title: manifest.formId, // schema_versions に title 列が無いので formId を fallback
      revisionId: manifest.revisionId,
      schemaHash: manifest.schemaHash,
      syncedAt: manifest.syncedAt,
      sourceUrl: manifest.sourceUrl,
      fieldCount: manifest.fieldCount,
      unknownFieldCount: manifest.unknownFieldCount,
      state: manifest.state,
    },
    fields,
    responderUrl,
  });
};
