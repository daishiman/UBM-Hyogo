# Phase 10: 最終レビュー（ドキュメント更新 / cross-check）

[実装区分: 実装仕様書]

Phase 1〜9 で確定した仕様書群を横断的にレビューし、不変条件・受入条件・
リスク残骸・PR 提出可否を最終判定する。

## 1. Phase 1-9 成果物 cross-check matrix

| 項目 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 | Phase 8 | Phase 9 |
|------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| AC-1 削除済み除外 | §4 | §4/§5 | §1 | 詳細設計 | 実装計画 | 実装 | spec | 実行 | refactor |
| AC-2 既登録 toast | §4 | §4/§5 | §1 | 詳細設計 | 実装計画 | 実装 | spec | 実行 | refactor |
| AC-3 dup 連番 | §4 | §4/§6 | §1 | 詳細設計 | 実装計画 | 実装 | spec | 実行 | refactor |
| AC-4 delete trace | §4 | §4/§6 | §1 | 詳細設計 | 実装計画 | 実装 | spec | 実行 | refactor |
| AC-5 canonical path | §4 | §6.1 | §1 | path 確定 | seed step | mkdir | path 参照 | 出力 | — |
| AC-6 un-skip | §4 / INV-04 | §9 DoD | §1 | grep 設計 | 実装 step | edit | spec | `e2e-skip-count.txt=0` | — |
| AC-7 CI green | §4 / AC | §8 | §3 | path-filter | CI step | — | — | run log | — |
| AC-8 design-tokens | §4 | §9 | §1 | — | step | — | — | log | — |
| AC-9 provenance | §4 | §6.3 | §1 | metadata schema | 出力 step | — | — | json | — |

Phase 4-9 は同一 workflow 内で作成済み。Phase 10 では AC trace と現行実装差分の整合を確認する。

## 2. 不変条件 vs 設計合致確認

| INV | 設計内の担保箇所 | 残骸リスク | 判定 |
|-----|-----------------|------------|------|
| INV-01 既存 API のみ | Phase 2 §5（mock は API shape 模倣のみ）/ Phase 3 §1 | なし | OK |
| INV-02 D1 直接禁止 | Phase 2 §5（mock は HTTP server）/ Phase 3 §1 | なし | OK |
| INV-03 OKLch 正本 | Phase 2 §3（`data-testid` 追加のみで色非変更）/ AC-8 | `MeetingPanel.tsx` への HEX 混入チェックを Phase 11 で再確認 | OK |
| INV-04 skip 不在 | Phase 2 §4 / §9 DoD / AC-6 | `e2e-skip-count.txt=0` を Phase 11 で evidence 化 | OK |
| INV-05 `*.spec.ts` のみ | Phase 2 §2（fixture builder は spec ではない）/ Phase 3 §1 | なし | OK |
| INV-06 baseline user gate | Phase 2 §6.1（evidence 専用パス）/ §10 / Phase 3 §1 | baseline 更新はこの wave では実行しない | OK（条件付き） |
| INV-07 1 サイクル完了 | Phase 3 §4.2（先送り該当なし） | なし | OK |
| INV-08 mock 二重実装禁止 | Phase 2 §5（standalone のみ・`page.route()` 不使用） | なし | OK |
| INV-09 provenance 明記 | Phase 2 §6.3 / AC-9 | metadata JSON の field 欠落チェック | OK |
| INV-10 `.log` 不可 | Phase 2 §6.1（.txt/.json/.md/.zip/.png のみ） | なし | OK |

## 3. リスク残骸チェックと mitigation 進捗

| Risk ID | 内容 | Phase 4 以降での解消状況 | 残課題 |
|---------|------|--------------------------|--------|
| R-1 | data-testid 追加で visual baseline diff | Phase 11 で `pnpm e2e:visual` pixel diff=0 を verify する step が組まれていること（Phase 5 で計画化）/ Phase 9 で再確認 | Phase 11 実行時点で再判定 |
| R-2 | mock 他 spec への影響 | Phase 4 で `git grep -l "/admin/meetings" apps/web/playwright/tests/` 実施・default seed は空 / 各 test で `seedMeetings` 明示 | なし |
| R-3 | SSR `INTERNAL_API_BASE_URL` 到達 | Phase 4 で `playwright.config.ts#webServer.env` を verify・必要なら Phase 5 で config 追記 | なし |
| R-4 | dup 即 toast vs API 409 path | Phase 2 §で CSR 早期 return も evidence 認定 / contract spec が API 409 を担保 | なし |
| R-5 | trace artifact size | `--trace on` を attendance spec 単体に限定 | なし |
| R-6 | `/__test__/seed-meetings` と `/__test__/reset` の責務混線 | Phase 4 で endpoint contract 明文化 | なし |
| R-7 | `attendance.spec.ts` の現状 CI 挙動 | Phase 4 で直近 CI run 確認 | なし |

## 4. ドキュメント更新一覧

Phase 10 で確定すべきドキュメント・実装差分:

| パス | 更新内容 |
|------|----------|
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/index.md` | Phase 一覧の状態列を current state へ更新 |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-1..13/` | 仕様書 13 phase の存在 |
| `apps/web/playwright/tests/attendance.spec.ts` | AC-1〜AC-4 の visual smoke 実装 |
| `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | detail/list helper 追加 |
| `apps/web/playwright/fixtures/auth.ts` / `admin-meetings.ts` | standalone mock endpoint / seed SSOT |
| `apps/web/src/components/admin/MeetingPanel.tsx` | selector stability testid 追加 |
| 上位 SSOT（`docs/00-getting-started-manual/specs/*.md`） | 変更なし（システム仕様への影響は Phase 12 `system-spec-update-summary.md` で別途記録） |
| `.claude/skills/aiworkflow-requirements/` | indexes / active workflow / inventory / changelog を同一 wave 同期 |

## 5. PR 提出可否判定

| 観点 | 判定 |
|------|------|
| CONST_005 充足（実装可能粒度） | OK（Phase 2 §2-9 / Phase 12 compliance check で再確認） |
| CONST_007 充足（1 サイクル完了） | OK（Phase 3 §4.2） |
| 不変条件 INV-01〜INV-10 | OK（§2） |
| リスク残骸 | R-1 は baseline update を user-gated として分離 |
| 実装と仕様の同一 wave 整合 | OK |

**判定: PR 提出可（実装と仕様同期 commit）**

## 6. Phase 11 への引き継ぎ事項

- `outputs/phase-11/` 配下 evidence は focused Playwright 実行で取得する。
- baseline screenshot 更新は行わない。

## 7. 次フェーズ

Phase 11 — 実装サイクル時の visual evidence 取得手順を仕様として確定する。
