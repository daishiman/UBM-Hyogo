# Phase 3 — 設計レビュー / タスク分解

## 1. タスク分解（単一サイクル完了原則 CONST_007 遵守）

| task id | 概要 | spec | LOC 目安 | 並列性 |
| --- | --- | --- | --- | --- |
| task-01 | `env.ts` に `getPublicEnvSafe` 追加 + unit test | `tasks/task-01-env-safe-getter.md` | ~40 | 先行（task-02 の前提） |
| task-02 | `site-metadata.ts` の `getSiteUrl` / `buildBaseMetadata` を fallback 対応に置換 + spec 更新 | `tasks/task-02-site-metadata-safe-fallback.md` | ~70 | task-01 完了後 |
| task-03 | playwright smoke `/` → `/terms` prefetch console error 0 件検証 | `tasks/task-03-terms-prefetch-smoke.md` | ~60 | task-02 完了後 |

3 タスクとも本サイクル内で完了する。先送り対象なし（CONST_007 OK）。

## 2. 並列性レビュー

`env.ts` は task-01 単独編集、`site-metadata.ts` は task-02 単独編集、smoke は task-03 単独。共有編集ファイルなし → 依存順 (task-01 → task-02 → task-03) は守るが、各タスク内部は単一責務で完結。

## 3. 不変条件再チェック

- env CONST: `getPublicEnv` を throw 仕様で残し、新規 `getPublicEnvSafe` のみ safe → 守る。
- D1 直アクセス禁止: 触れない。
- HEX 禁止 / `*.spec.{ts,tsx}` ルール / lefthook gate: 守る。

## 4. リスク

- root layout の metadata semantics（robots index/follow）が env 不在時に noindex に倒れる。production binding が機能している限り影響なし。万一の人為的事故時の SEO safety net としても許容。
- `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` の既存 mock パターン（`vi.spyOn(envMod, "getPublicEnv")`）に `getPublicEnvSafe` を追加 mock する必要がある。
