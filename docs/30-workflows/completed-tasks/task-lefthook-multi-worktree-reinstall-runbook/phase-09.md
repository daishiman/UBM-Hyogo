# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 前 Phase | 8 (DRY 化・整合性) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec（NON_VISUAL） |

## 目的

docs-only タスクとしての文書品質ゲートを通過させる。具体的には (a) line budget 遵守、(b) 内部リンクの dead link チェック、(c) `lefthook-operations.md` との mirror parity、(d) `.claude/skills/aiworkflow-requirements` の topic-map への反映確認、(e) Cloudflare 系 CLI ラッパー（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）と整合する旨の明記、を品質基準として固定する。

> **本タスクのスコープ外**: 本タスクはコード変更を一切伴わないため、`mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` は本 Phase の検証対象外。型・リントは別 Wave（実スクリプト実装タスク）で扱う。

## 評価観点

| 観点 | 基準 |
| --- | --- |
| line budget | `index.md` ≤ 220 行、各 `phase-*.md` ≤ 220 行、`outputs/phase-*/main.md` ≤ 280 行 |
| dead link | runbook 内の相対リンクが全て解決する（`lefthook-operations.md` / CLAUDE.md / `scripts/new-worktree.sh` / 派生元 completed-tasks 配下） |
| mirror parity | `lefthook-operations.md` と本 runbook の対応セクションが Phase 8 で確定した After 状態と完全一致 |
| topic-map 反映 | `.claude/skills/aiworkflow-requirements/references/topic-map.*` に「lefthook 一括再 install runbook」のキーワードと参照パスが追記されている |
| Cloudflare CLI 整合 | runbook 内の例示で wrangler 直接実行を含めず、必要時は `bash scripts/cf.sh` を案内する旨を 1 箇所に明記 |
| docs-only 明示 | 各 phase 冒頭メタ情報に `タスク分類 = docs-only / runbook-spec（NON_VISUAL）` が記載されている |

## 検証手順

### 1. line budget チェック

- `wc -l` 相当で `index.md` および `phase-01.md` 〜 `phase-13.md` の行数を計測し、上限超過がないことを確認する。
- 上限超過があれば該当 Phase を分割するか、表のセル文を圧縮する。

### 2. dead link チェック

- 本 runbook 内の相対リンク（`../`・`./outputs/` など）を列挙し、対象ファイルが実在することを確認する。
- 結果を `outputs/phase-11/link-checklist.md` に表形式で記録する（NON_VISUAL 代替 evidence の一部）。

### 3. mirror parity 検証

- Phase 8 の Before/After 表 9 項目が After 状態で確定していることを再確認する。
- 同じ手順・同じ警告が両ドキュメントに重複していないことを目視 grep で確認する。

### 4. topic-map 反映確認

- `.claude/skills/aiworkflow-requirements/references/topic-map.*`（実体ファイルの拡張子に追従）に、本 runbook の参照パスとキーワード（「lefthook」「worktree 一括再 install」「pnpm store 並列禁止」）が追記されているか確認する。
- 追記が必要な場合は Phase 12 で `documentation-changelog.md` に反映予定として記録する。

### 5. Cloudflare 系 CLI ラッパー整合

- runbook 内で wrangler 直接実行例が登場しないことを確認する（本タスクは worktree / hook の話で Cloudflare に直接触れないが、運用例で誤って混入していないかを点検）。
- 「Cloudflare 系 CLI を扱う場合は必ず `bash scripts/cf.sh` を経由する（CLAUDE.md「Cloudflare 系 CLI 実行ルール」参照）」旨を runbook の冒頭注意書きに 1 行で明記する。

### 6. docs-only 明示の徹底

- `index.md` および全 `phase-*.md` のメタ情報セルに `docs-only / runbook-spec（NON_VISUAL）` が含まれているか確認する。
- `pnpm typecheck` / `pnpm lint` がスコープ外である旨を本 Phase（および Phase 10）に明記する。

## 完了条件

- line budget 全ファイル PASS
- dead link 0 件（`outputs/phase-11/link-checklist.md` で記録）
- mirror parity 違反 0 件
- topic-map に本 runbook が反映済み（または Phase 12 で反映予定として記録）
- Cloudflare CLI ラッパー言及が 1 箇所に存在し、wrangler 直接例の記述ゼロ
- 全 phase メタ情報に `docs-only / runbook-spec（NON_VISUAL）` が明記
- 本タスクのスコープ外として `pnpm typecheck` / `pnpm lint` を明示している

## Phase 10 への引き渡し

- 本 Phase の 6 観点全 PASS をもって Phase 10 GO/NO-GO 判定の入力とする
- topic-map 反映が「予定」止まりの場合は Phase 12 のドキュメント更新タスクとして carry-over する
- dead link 検証結果は NON_VISUAL 代替 evidence として Phase 11 に引き継ぐ
