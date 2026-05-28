---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 10
phase_name: 最終レビュー
created_at: 2026-05-27
---

# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## 1. 着手前提（必須）

| # | 前提 | 確認方法 |
|---|------|----------|
| 1 | Task A（admin shell topbar/sidebar）完了 + staging 反映 | 親 workflow の `artifacts.json` で Task A の status を確認 |
| 2 | Task B（dashboard recovery / byZone）完了 + staging 反映 | 同上 |
| 3 | Task C（page-header token 整合）完了 + staging 反映 | 同上 |
| 4 | Task D（attendance primitive 整合）完了 + staging 反映 | 同上 |
| 5 | admin 12 routes が staging で 200 を返す | `bash scripts/cf.sh tail --env staging` + 実 GET |

Task A-D 未完なら Task E は着手しない。

## 2. 設計レビュー結果再掲

- 重複 spec は統合方針で解消（旧 `admin-dashboard.spec.ts` を削除し、`admin-shell/dashboard.spec.ts` に統合）
- viewport は project 注入で spec 側 viewport-agnostic
- env-gated 2 route は seed ID が両方そろうまで skip（44 PNG 運用は禁止）

## 3. リスクチェック

| リスク | 対策 |
|--------|------|
| staging auth storageState contract 変更 | Phase 5 着手時に `visual-staging-authenticated` setup project を再確認し、admin storageState path を合わせる |
| staging API 応答ゆらぎで maxDiff 超え | `route.fulfill` で固定するか、env-gate で skip |
| bot push 後の required check 未発火 | 空コミット再トリガー（user-gated） |
| 不要 PR runner 浪費 | matrix fail-fast: false で 1 viewport 落ちても他は完走、artifact upload で原因特定 |

## 4. spec 完了条件

- Phase 1-13 すべて作成済み
- AC-1〜AC-6 が Phase 1 に明記され、各 AC が Phase 4/5/9 で検証可能
- DoD は Phase 13 にチェックリスト化
- 「先送りタスク」が存在しない（CONST_007 準拠）

## 5. CONST_007 への準拠

- 本仕様は 1 サイクル内で完結する（Task A-D 完了 → Task E 実装 → baseline 取得 → required check 候補列挙）。
- 「実 PUT による required check 化」は user-gated（CI 構成の追加そのものは本サイクル内）。
- バックログ送りタスクは無し。
