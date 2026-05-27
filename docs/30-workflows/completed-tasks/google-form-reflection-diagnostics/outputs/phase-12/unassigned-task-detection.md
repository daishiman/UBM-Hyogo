# Phase 12 strict — unassigned-task-detection

## 検出ポリシー

本 Spec-A は **観察 → 診断基盤** に意図的に閉じる (CONST_007 例外、Phase 1 §5 / Phase 8 §2)。診断結果を踏まえた **修復** は本 Spec-A の DoD に含めず、以下 4 候補を Spec-B 群として user 判断で起票する。

## Spec-B 候補 (4 件)

### Spec-B-1: H1 修復 — ingest 未稼働解消

| 項目 | 内容 |
| --- | --- |
| 起票トリガ | `forms-pipeline-snapshot.json` の `hypothesisFlags.H1_ingestNeverRanOrAllErrors === true`、または `secretsReadiness.googleServiceAccountEmail === false` / `googlePrivateKey === false` / `googleFormId === false` |
| 想定 surface | `apps/api/src/jobs/sync-forms-responses.ts` / cron 設定 (wrangler) / `scripts/cf.sh secret put` / `sheets-auth-classifier.ts` |
| 想定 PR 規模 | 中 (secrets 投入 + cron 設定が中心。コード変更は最小限) |
| 優先度候補 | high (パイプライン根本断絶のため) |

### Spec-B-2: H2 修復 — 本人マッチング再構築

| 項目 | 内容 |
| --- | --- |
| 起票トリガ | `identityHealth.identitiesWithoutMember > 0`、または `/admin/diagnostics/member/:id` で `H2_identityMissing === true` が複数本人で再現 |
| 想定 surface | `apps/api/src/routes/me/*` / `member_identities` backfill migration / Auth.js callback で identity link を強化 |
| 想定 PR 規模 | 中-大 (backfill migration を伴う場合あり) |
| 優先度候補 | high (profile 経路の死命線) |

### Spec-B-3: H3 修復 — 公開フィルタ UX 改修

| 項目 | 内容 |
| --- | --- |
| 起票トリガ | `publicVisibility.allHiddenByPublishState === true`、または `publicConsentTrue / totalMembers` 比率が極端に低い |
| 想定 surface | `apps/web/app/(public)/members/*` / profile での publicConsent CTA / admin 一括 republish flow |
| 想定 PR 規模 | 中 (UX 改修中心) |
| 優先度候補 | medium |

### Spec-B-4: H4 修復 — schema alias backfill

| 項目 | 内容 |
| --- | --- |
| 起票トリガ | `aliasPendingCount > 0`、または `/admin/diagnostics/member/:id` で `missingFieldKeys` 非空が大量に再現 |
| 想定 surface | `schema_diff_queue` resolve / `schema_aliases` backfill / `apps/api/src/jobs/sync-forms-responses.ts` の mapper |
| 想定 PR 規模 | 中 (mapping 拡張 + backfill migration) |
| 優先度候補 | high (表示欠落の直接原因になりやすい) |

## CONST_007 例外運用

本 Spec-A の PR review / staging 投入後、user は staging 取得 evidence を確認し、`hypothesisFlags` が立った仮説に応じて Spec-B-1〜Spec-B-4 の対応分を新規 Issue / ワークフローとして起票する。1 仮説 = 1 Spec-B が原則 (CONST_005 単一責務)。
