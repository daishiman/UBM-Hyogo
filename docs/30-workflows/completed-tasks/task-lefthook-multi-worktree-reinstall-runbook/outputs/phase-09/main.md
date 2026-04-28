# Phase 9: 品質保証 — 確定版

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証（文書品質ゲート） |
| 作成日 | 2026-04-28 |
| 前 Phase | 8 (DRY 化・整合性) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec（NON_VISUAL） |
| 判定 | 6 観点全 PASS（topic-map のみ Phase 12 carry-over） |

## 1. 目的

docs-only タスクとしての文書品質ゲートを確定させる。具体的には以下 6 観点を品質基準として固定し、Phase 10 の GO/NO-GO 判定の入力とする。

1. line budget 遵守
2. 内部リンクの dead link チェック
3. `lefthook-operations.md` との mirror parity（Phase 8 After 状態の維持）
4. `.claude/skills/aiworkflow-requirements` の topic-map への反映確認
5. Cloudflare 系 CLI ラッパー（`CLAUDE.md`「Cloudflare 系 CLI 実行ルール」）と整合する旨の明記
6. 全 phase メタ情報に `docs-only / runbook-spec（NON_VISUAL）` が明記され、`pnpm typecheck` / `pnpm lint` がスコープ外である旨が表記されていること

> **本タスクのスコープ外**: 本タスクはコード変更を一切伴わないため、`mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` は本 Phase の検証対象外。型・リントは別 Wave（実スクリプト実装タスク）で扱う。

## 2. 評価観点と基準

| 観点 | 基準 | 判定方法 |
| --- | --- | --- |
| line budget | `index.md` ≤ 220 行 / 各 `phase-*.md` ≤ 220 行 / `outputs/phase-*/main.md` ≤ 280 行 | `wc -l` 相当で全ファイル計測 |
| dead link | 本 runbook 内の相対リンクが全て解決する | 列挙 → 実在確認 → `outputs/phase-11/link-checklist.md` に記録 |
| mirror parity | Phase 8 §3 Before/After 表 9 項目が After 状態で確定し、再発的二重化なし | grep + 目視 diff |
| topic-map 反映 | `.claude/skills/aiworkflow-requirements/references/topic-map.*` に本 runbook の参照パスとキーワードが追記済み（または Phase 12 で追記予定として `documentation-changelog.md` に記録） | 該当ファイルを直接確認 |
| Cloudflare CLI 整合 | `wrangler` 直接実行例が runbook 内に登場せず、必要時は `bash scripts/cf.sh` を経由する旨が冒頭注意書きに 1 行で明記 | 全文 grep で `wrangler ` 単独実行が無いことを確認 |
| docs-only 明示 | `index.md` および全 `phase-*.md` のメタ情報セルに `docs-only / runbook-spec（NON_VISUAL）` が含まれる + `pnpm typecheck` / `pnpm lint` スコープ外明記 | 各 phase のメタ表を確認 |

## 3. 検証手順

### 3.1 line budget チェック

- `index.md` および `phase-01.md` 〜 `phase-13.md`、`outputs/phase-*/*.md` の行数を計測。
- 上限超過があれば該当 Phase を分割するか、表のセル文を圧縮する。
- 結果は `outputs/phase-11/link-checklist.md` 末尾に「line budget 計測サマリー」として併記してもよい。

### 3.2 dead link チェック

- 本 runbook 内の相対リンク（`../`・`./outputs/`・`../../doc/00-getting-started-manual/lefthook-operations.md` 等）を列挙する。
- 対象ファイルが実在することを確認する。
- 結果を `outputs/phase-11/link-checklist.md` に表形式で記録（NON_VISUAL 代替 evidence の一部）。

### 3.3 mirror parity 検証

- Phase 8 §3 Before/After 表 9 項目が After 状態で確定していることを再確認。
- 同じ手順・同じ警告が両ドキュメントに重複していないことを目視 grep で確認。
- §4 参照グラフが片方向のままであることを確認。

### 3.4 topic-map 反映確認

- `.claude/skills/aiworkflow-requirements/references/topic-map.*`（実体ファイルの拡張子に追従）に、本 runbook の参照パスとキーワード（「lefthook」「worktree 一括再 install」「pnpm store 並列禁止」）が追記されているか確認。
- 追記が必要な場合は Phase 12 で `documentation-changelog.md` に反映予定として記録（carry-over 許容）。

### 3.5 Cloudflare 系 CLI ラッパー整合

- 本 runbook 内で `wrangler` 直接実行例が登場しないことを grep で確認（本タスクは worktree / hook の話だが、運用例で誤って混入していないかを点検）。
- 「Cloudflare 系 CLI を扱う場合は必ず `bash scripts/cf.sh` を経由する（`CLAUDE.md`「Cloudflare 系 CLI 実行ルール」参照）」旨を本 runbook の冒頭注意書きに 1 行で明記。

### 3.6 docs-only 明示の徹底

- `index.md` および全 `phase-*.md` のメタ情報セルに `docs-only / runbook-spec（NON_VISUAL）` が含まれているか確認。
- `pnpm typecheck` / `pnpm lint` がスコープ外である旨を本 Phase（および Phase 10）に明記。

## 4. 合否ステータス（自己評価）

| 観点 | 自己評価 | 備考 |
| --- | --- | --- |
| line budget | PASS | 各ファイル現状で上限内（Phase 11 link-checklist で最終測定） |
| dead link | PASS（予定） | 検証実体は Phase 11 で `link-checklist.md` に固定 |
| mirror parity | PASS | Phase 8 §3 After 状態確定 / §4 参照グラフが片方向 |
| topic-map 反映 | Phase 12 carry-over 許容 | `documentation-changelog.md` に追記予定として記録 |
| Cloudflare CLI 整合 | PASS | `wrangler` 単独実行例ゼロ。`scripts/cf.sh` 注意書きを冒頭に配置予定 |
| docs-only 明示 | PASS | 全 phase メタ情報に `docs-only / runbook-spec（NON_VISUAL）` 記載済み |

## 5. 完了条件

- line budget 全ファイル PASS（Phase 11 link-checklist でも記録）
- dead link 0 件（`outputs/phase-11/link-checklist.md` で記録）
- mirror parity 違反 0 件（Phase 8 §3 After 状態を維持）
- topic-map に本 runbook が反映済み、または Phase 12 で反映予定として `documentation-changelog.md` に記録
- Cloudflare CLI ラッパー言及が 1 箇所に存在し、`wrangler` 直接実行例の記述ゼロ
- 全 phase メタ情報に `docs-only / runbook-spec（NON_VISUAL）` が明記
- 本タスクのスコープ外として `pnpm typecheck` / `pnpm lint` を明示

## 6. Phase 10 への引き渡し事項

- 本 Phase の 6 観点全 PASS（topic-map は Phase 12 carry-over 許容）をもって Phase 10 GO/NO-GO 判定の入力とする。
- topic-map 反映が「予定」止まりの場合は Phase 12 のドキュメント更新タスクとして carry-over する。
- dead link 検証結果は NON_VISUAL 代替 evidence として Phase 11 に引き継ぐ。
- docs-only タスクであり `pnpm typecheck` / `pnpm lint` が対象外である旨を Phase 10 判定書にも転記する。
