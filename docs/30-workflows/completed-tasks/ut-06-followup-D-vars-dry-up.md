# UT-06 Follow-up D: `[vars] SHEET_ID` / `FORM_ID` の DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-D |
| タスク名 | apps/api wrangler.toml の vars 重複定義整理 |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 作成日 | 2026-04-27 |
| 種別 | refactor |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-D |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

`apps/api/wrangler.toml` の `[env.production.vars]` と `[env.staging.vars]` で同値定義されている `SHEET_ID` / `FORM_ID` を共通化し、保守コストを削減する。

## スコープ

### 含む

- 同値の `[vars]` をトップレベルに集約
- 環境別オーバーライドが必要な値のみ `[env.<env>.vars]` に残す
- 集約後の挙動が現状と完全一致することを `wrangler deploy --dry-run` で確認

### 含まない

- 値そのものの変更（formId / sheetId は CLAUDE.md 固定値を維持）
- 機密項目の扱い変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06-FU-B（env.production セクション整理） | 同 wrangler.toml の整理と並走 |
| 関連 | CLAUDE.md フォーム固定値 | 値の正本 |

## 苦戦箇所・知見

**1. wrangler `[vars]` の env 継承仕様**
`[env.<env>]` セクションを持つと、トップレベル `[vars]` がそのまま継承されないケースがある。`wrangler deploy --env production --dry-run` で manifest を before/after で diff し等価性を確認する必要がある。

**2. CLAUDE.md 固定値との整合**
`formId`, `responderUrl`, `sectionCount`, `questionCount` は CLAUDE.md で正本管理されているため、wrangler.toml の値が drift していないかを併せて検証する。

**3. 環境別オーバーライド境界**
`SHEET_ID` を将来 staging / production で別 ID にする可能性があるなら、トップレベル集約は逆効果。仕様変更見込みを事前に確認する。

## 受入条件

- [ ] 同値の `[vars]` がトップレベル `[vars]` に集約されている
- [ ] env 別差分のみ `[env.<env>.vars]` に残っている
- [ ] `wrangler deploy --env production --dry-run` の manifest が before/after で等価
- [ ] CLAUDE.md フォーム固定値と wrangler.toml が一致

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-D |
| 必須 | apps/api/wrangler.toml | 編集対象 |
| 必須 | CLAUDE.md | フォーム固定値 |
