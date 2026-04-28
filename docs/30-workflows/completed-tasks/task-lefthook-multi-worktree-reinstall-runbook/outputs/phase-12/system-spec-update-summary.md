# Phase 12: system-spec-update-summary（仕様書同期サマリー）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase | 12 / 13 |
| 作成日 | 2026-04-28 |
| 種別 | docs-only / 差分追記サマリー（本タスクでは本体ファイルを編集せず、実装 Wave への指示として specify する） |

## 1. 更新対象ドキュメント

| 区分 | パス | 対応 Wave |
| --- | --- | --- |
| 正本仕様 | `doc/00-getting-started-manual/lefthook-operations.md` | 実装 Wave で本サマリーに従い差分追記 |
| 連携 | `CLAUDE.md`「Git hook の方針」セクション | 整合確認のみ。本タスクでは編集しない（既存記述と矛盾なし） |

## 2. lefthook-operations.md への差分追記指示（specify）

### Step 2-1: セクション「初回セットアップ / 既存 worktree への適用」の末尾を拡張

- 1 段落で「30+ worktree への一括再 install runbook が文書化された」旨を述べる。
- 詳細は本タスクの `outputs/phase-12/implementation-guide.md` Part 2 を参照する旨をリンク追加。
- **並列禁止の理由を 1 文** で明記:
  > 並列実行は禁止する。pnpm の content-addressable store が同時書き込みで破壊されるため、
  > runbook では `while read` ループによる **逐次実行のみ** を採用する。
- ISO8601 ログ書式の参照リンクを追加:
  > 実行ログは `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/outputs/phase-11/manual-smoke-log.md`
  > に UTC ISO8601 (`YYYY-MM-DDThh:mmZ`) 形式で append する。

### Step 2-2: トラブルシュート表に行追加

| 症状 | 対処（lefthook-operations.md 追記行） |
| --- | --- |
| ある worktree だけ pre-commit が走らない | その worktree で `mise exec -- pnpm install --prefer-offline` を再実行。改善しなければ runbook の一括再 install を回す |
| `lefthook version` が exit 1 | `mise exec -- pnpm rebuild lefthook` を 1 度試行。再失敗なら `mise exec -- pnpm install --force` |
| `.git/hooks/post-merge` が残っている | 1 行目に `LEFTHOOK` sentinel を確認。無ければ **手動削除**（自動削除はしない） |

### Step 2-3: ログ書式参照リンクを「運用記録」セクションに追加

- 参照リンク: `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/outputs/phase-11/manual-smoke-log.md`
- ISO8601 注記文面（テンプレからの転載）:
  > 「実行日時」カラムは UTC の ISO8601（`YYYY-MM-DDThh:mmZ`）で記録する。
  > `date -u +%Y-%m-%dT%H:%MZ` の出力をそのまま貼ること。

### Step 2-4: 整合性チェック結果

| チェック対象 | 結果 |
| --- | --- |
| CLAUDE.md「Git hook の方針: lefthook.yml が hook の正本」 | 矛盾なし。本 runbook は同方針を強化する |
| post-merge 廃止方針（baseline タスク）との整合 | 矛盾なし。runbook は post-merge を復活させない |
| `scripts/new-worktree.sh` 関連記述との責務境界 | 衝突なし。new-worktree.sh は新規作成時の自動経路、本 runbook は既存 worktree 群への遡及経路（対象集合が排他） |

## 3. 追加リンク先一覧（追記時に参照される URL）

| 用途 | パス |
| --- | --- |
| 実装ガイド Part 2 | `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/outputs/phase-12/implementation-guide.md` |
| ログ書式テンプレート | `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/outputs/phase-11/manual-smoke-log.md` |
| 設計 (Mermaid + ADR) | `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/outputs/phase-02/runbook-design.md` |
| 異常系 | `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/outputs/phase-06/failure-cases.md` |

## 4. Phase 11 証跡参照

- `outputs/phase-11/link-checklist.md`: 検査総数 17 / OK 17 / MISSING 0 → **PASS**
- `outputs/phase-11/manual-smoke-log.md`: 書式テンプレート + 見本 2 行 + ISO8601 注記を含む

## 5. 整合性確認結果（最終）

| 観点 | 結果 |
| --- | --- |
| CLAUDE.md との矛盾 | なし |
| post-merge 廃止方針との矛盾 | なし |
| `scripts/new-worktree.sh` との責務境界 | 排他（重複なし） |
| 既存トラブルシュート表との整合 | 行追加のみ。既存行は破壊しない |
| Phase 11 link-checklist | PASS |

## 6. 本タスクで本体ファイルを編集しない理由

本タスクは `taskType: docs-only / runbook-spec` であり、`lefthook-operations.md` の
本体編集は **実装 Wave** に委ねる方針である（Phase 1 で確定）。
本サマリーは実装 Wave の担当者が一意に差分を作れるよう **specify** する責務を持つ。
