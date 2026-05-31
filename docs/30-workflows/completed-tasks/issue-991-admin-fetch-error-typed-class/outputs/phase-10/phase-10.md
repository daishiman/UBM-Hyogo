# Phase 10: 最終レビュー — AdminFetchError typed class

**[実装区分: 実装仕様書]**

> workflow_state = `implemented_local_evidence_captured`。本 Phase の達成判定はローカル実装・focused tests・typecheck・lint の実測で完了済み。

## 1. 受入基準（AC）達成判定 — index.md / Phase 1 と整合

| AC | 内容 | 判定基準 | 状態 |
| --- | --- | --- | --- |
| AC-1 | `AdminFetchError` が `server-fetch.ts` から export | `grep "export class AdminFetchError"` = 1 件 | PASS |
| AC-2 | `AdminFetchError extends Error`（`instanceof Error` true） | spec で `instanceof Error` assert green | PASS |
| AC-3 | `Error.message` が現状と byte-identical（非 PII body の ` body=` suffix 256 文字切り、body 不在時 suffix なし） | `binding.spec.ts:89/101` green + 新規 spec で 256 境界 assert | PASS |
| AC-4 | `responseBodySnippet` が ≤500 文字（message の 256 と独立スライス、body 不在時 null） | 新規 spec で 500 境界 / null assert green | PASS |
| AC-5 | `status`（number）/ `path`（string）が正しく設定 | 新規 spec で field assert green | PASS |
| AC-6 | `isAdminFetchError(e)` が `instanceof` または `name==="AdminFetchError"` で true | 新規 spec で instanceof / name fallback 両分岐 assert green | PASS |
| AC-7 | `safe-fetch.ts` が構造化 status を優先 / 未提供時は正規表現 fallback 維持 | `safe-fetch.spec.ts` の TC-SF-STATUS green、`ADMIN_FETCH_404` 等不変 | PASS |
| AC-8 | 既存 regression 群 全 green、typecheck / lint green | focused vitest 6 files / 31 tests + typecheck + lint | PASS |

## 2. blocker 判定

**blocker なし。** 根拠:
- 依存タスク（親 `admin-audit-prototype-alignment`）は完了済みで `/admin/audit` 404 は root mount で恒久解決済み（Phase 1 §1.1）。
- API / D1 / Google Form の変更を伴わない（不変条件に抵触しない）。
- message byte-identical 維持により既存 regression が壊れない設計。
- skill 変更なしのため index drift gate も No-op。

## 3. consumer side 断絶確認（FB-CANCEL-004-1）— partial fix でないこと

status 構造化を「提供する」だけで consumer 側の動作が断絶しないことを確認する。

| consumer | 経路 | status 構造化後の挙動 | 判定 |
| --- | --- | --- | --- |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | `normalizeError` → `code` 生成 → `result.error.code === "ADMIN_FETCH_404"` で `logger.warn({ event: "admin_fetch_404", ... })` | `statusFromError` が構造化 `status=404` を優先取得 → `code` は従来同様 `ADMIN_FETCH_404` を生成 → warn 分岐は**同一 code で従来通り発火** | 断絶なし（partial fix でない） |
| 正規表現 fallback 経路 | `AdminFetchError` でない一般 Error（message のみ） | `statusFromError` が構造化 status を得られず正規表現 fallback → 従来 code を維持 | 断絶なし |

> 結論: `safe-server-fetch.ts` を一切変更せずとも `ADMIN_FETCH_404` warn は同一 code で動作する。本変更は consumer 互換を保った非破壊改善であり partial fix（途中まで配線して consumer が壊れる状態）ではない。

## 4. MINOR 指摘 → 未タスク化方針

| 指摘 | 重大度 | 方針 |
| --- | --- | --- |
| response body の PII masking（email / phone 形状） | MINOR | 同サイクルで `AdminFetchError` constructor に redaction を実装し、`admin-fetch-error.spec.ts` で回帰 guard を追加済み。未タスク化不要 |
| `error.tsx` の status 別表示分岐刷新 | MINOR | out of scope（観測 evidence 取得後）。今回は status を提供するまで |

> いずれも本タスクの DoD を阻害しない MINOR。Phase 12 `unassigned-task-detection` で扱う。

## 5. 完了条件（Phase 10）

- [x] AC-1〜8 の判定基準が index.md / Phase 1 と整合し、実測 PASS
- [ ] blocker なしを確定
- [ ] consumer 断絶確認（`ADMIN_FETCH_404` 同一 code 動作・partial fix でない）を記録
- [x] MINOR 指摘（PII masking）を同サイクル実装として消化
