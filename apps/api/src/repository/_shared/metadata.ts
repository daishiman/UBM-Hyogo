// MetadataResolver: canonical schema metadata 解決層
// builder.ts の section 重複・label 流用・heuristic kind 判定 fallback を root から排除する単一の入口。
// 03a の StableKey alias queue 完成までは static-manifest.json を baseline source として参照する。
// 不変条件 #1 / #2 / #3 / #5 を resolver 経由で観測可能にする。

import type { FieldKind } from "@ubm-hyogo/shared";
import staticManifest from "./generated/static-manifest.json";

export type SectionKey = string;
export const UNKNOWN_SECTION_KEY: SectionKey = "__unknown__";
export const UNKNOWN_SECTION_TITLE = "未分類";

export type ResolveError =
  | { kind: "unknownStableKey"; stableKey: string }
  | { kind: "aliasFailed"; stableKey: string; reason: string }
  | { kind: "manifestStale"; source: string };

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export interface ResolveContext {
  readonly locale?: string;
}

export interface AliasQueueAdapter {
  // 03a 完成後、未知 stable_key を alias queue に dryRun 登録する。
  // 失敗時は { ok: false, reason } を返し、resolver は aliasFailed として伝搬する。
  dryRunAlias(stableKey: string): Promise<{ ok: true; resolvedKey: string } | { ok: false; reason: string }>;
}

export interface MetadataResolver {
  resolveSectionKey(stableKey: string, context?: ResolveContext): Result<SectionKey, ResolveError>;
  resolveFieldKind(stableKey: string, context?: ResolveContext): Result<FieldKind, ResolveError>;
  resolveLabel(stableKey: string, context?: ResolveContext): Result<string, ResolveError>;
  // section ordering 取得（builder が未分類 section も含めて順序付けに使う）
  listSections(): ReadonlyArray<{ key: SectionKey; title: string; position: number }>;
}

interface ManifestField {
  sectionKey: string;
  kind: FieldKind;
  label: string;
}

interface ManifestShape {
  sections: ReadonlyArray<{ key: string; title: string; position: number }>;
  fields: Record<string, ManifestField>;
}

const MANIFEST: ManifestShape = staticManifest as unknown as ManifestShape;

export class GeneratedManifestResolver implements MetadataResolver {
  private readonly manifest: ManifestShape;
  private readonly aliasAdapter?: AliasQueueAdapter;

  constructor(opts?: { manifest?: ManifestShape; aliasAdapter?: AliasQueueAdapter }) {
    this.manifest = opts?.manifest ?? MANIFEST;
    if (opts?.aliasAdapter !== undefined) {
      this.aliasAdapter = opts.aliasAdapter;
    }
  }

  resolveSectionKey(stableKey: string): Result<SectionKey, ResolveError> {
    const f = this.manifest.fields[stableKey];
    if (!f) return err({ kind: "unknownStableKey", stableKey });
    return ok(f.sectionKey);
  }

  resolveFieldKind(stableKey: string): Result<FieldKind, ResolveError> {
    const f = this.manifest.fields[stableKey];
    if (!f) return err({ kind: "unknownStableKey", stableKey });
    return ok(f.kind);
  }

  resolveLabel(stableKey: string): Result<string, ResolveError> {
    const f = this.manifest.fields[stableKey];
    if (!f) return err({ kind: "unknownStableKey", stableKey });
    return ok(f.label);
  }

  listSections(): ReadonlyArray<{ key: SectionKey; title: string; position: number }> {
    return this.manifest.sections;
  }

  // alias adapter は将来 03a 接続時に使う（現状 baseline では未使用フックのみ保持）
  // 露出のために getter を提供
  getAliasAdapter(): AliasQueueAdapter | undefined {
    return this.aliasAdapter;
  }
}

export const defaultMetadataResolver: MetadataResolver = new GeneratedManifestResolver();
