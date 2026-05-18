# Phase 3: 設計レビュー

## レビュー結果: **PASS（Phase 4 進行可）**

## 観点別評価

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | issue #767 の visible regression を解消し、prototype L136-149 と DOM 同型化。一般会員獲得導線が HomePage に復帰 |
| 実現性 | PASS | 単一 component 新規作成 + 1 file mount + 1 定数追加 + CSS 数十行。1 サイクル内で完了可 |
| 整合性 | PASS | 既存 `RegisterCallout` のパターン（`data-component` selector + `cta-button` class）を踏襲。新規 token 追加なし |
| 運用性 | PASS | OKLch token のみ使用、`verify-design-tokens` CI gate と整合。`describe.skip` / TODO / hardcode なし |

## クラス名衝突検査（FB-04）

| 検査対象 | 結果 |
|---------|------|
| `CallToActionCTA` という export 名が `apps/web/src/components/` 配下に既存しないか | 既存なし（grep 確認） |
| `[data-component="call-to-action-cta"]` selector が legacy-public.css に既存しないか | 既存なし |
| `FORM_RESPONDER_URL` という定数名が既存しないか | 既存なし（`grep -rn "FORM_RESPONDER" apps/web/src` ゼロ件） |

## MINOR 指摘 → 未タスク化候補

なし。

## 残リスク

| リスク | 対策 |
|--------|------|
| `--ubm-color-text` / `--ubm-color-panel` が `tokens.css` に未定義の場合 | Phase 5 着手時に `apps/web/src/styles/tokens.css` を grep し、未定義であれば既存の近い token（`--text` / `--panel`）を採用するか、`tokens.css` への追加可否を判断する。新規 token を追加する場合は parallel-03 の token spec への横展開を `unassigned-task-detection.md` に記録する |
| `RegisterCallout` の `.cta-button` style が dark variant 上で読みづらい | Phase 11 の visual review で確認。必要なら `.cta-button--accent` modifier を追加 |

## Phase 4 への送り出し

進行可。Phase 4 で RED テストを書き、Phase 5 で実装、Phase 11 で VISUAL capture。

## 成果物

`outputs/phase-3/design-review.md`
