# Phase 1: 要件定義・成功条件

## 1.1 背景

Issue #331 (CI/CD runtime warning cleanup) で `web-cd.yml` の Cloudflare Pages deploy step を撤去し、`@opennextjs/cloudflare` 経由の Workers deploy に統一した。この改修により GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` (value: `ubm-hyogo-web`) は workflow からの参照を失い、dormant 状態となった。

元の fold 先 Issue #419 (Pages dormant cleanup) は既に CLOSED のため、削除責任が宙に浮いていた。Issue #638 で本タスクが採番されたが、Issue 自体も CLOSED 状態。ただし **variable 本体は GitHub 側に未削除のまま残存**しているため、実作業は依然として必要。

## 1.2 ユーザー要件

| ID | 要件 |
| --- | --- |
| REQ-1 | `CLOUDFLARE_PAGES_PROJECT` を GitHub repository variable から削除する |
| REQ-2 | 削除前後の状態を evidence として `outputs/phase-11/` に保存する |
| REQ-3 | `.github/` 配下の grep gate (`rg CLOUDFLARE_PAGES_PROJECT .github/`) が hit 0 であることを削除直前に再確認する |
| REQ-4 | 旧 unassigned-task spec を新仕様で supersede マーク（重複 spec の解消） |
| REQ-5 | Issue #638 は CLOSED のまま、reopen / state 変更しない（PR 本文は `Refs #638`） |
| REQ-6 | `gh api -X DELETE` / rollback `POST` / commit / push / PR は user approval marker 保存後にだけ実行する |

## 1.3 成功条件 (Success Criteria)

| ID | 条件 | 検証手段 |
| --- | --- | --- |
| SC-1 | user approval marker 保存後、`gh api repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT` が HTTP 404 を返す | Phase 7 Step 4 |
| SC-2 | user approval marker 保存後、`gh api repos/daishiman/UBM-Hyogo/actions/variables` の JSON に `CLOUDFLARE_PAGES_PROJECT` が含まれない | Phase 7 Step 4 |
| SC-3 | 削除前後の evidence が `outputs/phase-11/{before,after}.json` に保存されている | Phase 11 |
| SC-4 | `.github/` grep gate hit 0 を `outputs/phase-11/grep-gate.txt` に保存 | Phase 11 |
| SC-5 | 旧 unassigned-task ファイル冒頭に `superseded by issue-638` marker が追記されている | Phase 9 |
| SC-6 | `pnpm typecheck` / `pnpm lint` はコード差分がある場合のみ blocking。docs-only/external state 準備段階では sanity evidence として扱う | Phase 7 Step 5 |

## 1.4 非機能要件

- **冪等性**: 削除コマンドは一度のみ実行で完了（gh API DELETE は 204 No Content / 既に削除済の場合 404 を返す）
- **rollback 性**: 削除後に再作成が必要になった場合、value=`ubm-hyogo-web` を `gh api -X POST` で復元可能（Phase 5 参照）
- **監査性**: 削除前後の JSON evidence をリポジトリに commit して将来の audit に備える

## 1.5 リスク

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| `.github/` 以外で参照されている | CI 以外の何かが壊れる | Phase 2 で full-repo grep を実施し、参照箇所を全特定 |
| environment scope 同名変数の誤削除 | staging / production 環境影響 | Phase 4 で repo scope 限定の API endpoint のみを使用 |
| Issue #638 が CLOSED で誤認 | 「対応済」と勘違いされる | PR 本文に「Issue は CLOSED だが variable 未削除のため作業必要」を明記 |
