# Phase 11 — 手動テスト

## Status

completed

## サマリ

本タスクは `taskType: implementation` / `visualEvidence: NON_VISUAL` のため、画面遷移を伴う手動テストは実施しない。代わりに、lefthook 設定・hook shell・明示 rebuild 経路を CLI で検証する。screenshot は不要で、証跡はコマンド出力と `manual-smoke-log.md` に集約する。

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/manual-smoke-log.md` | 手動 smoke の手順 + 期待出力 + ログ記録テンプレ |
| `outputs/phase-11/link-checklist.md` | 内部 / 外部リンク整合チェックリスト |

## 証跡メタ（FB-4 対応）

| 項目 | 値 | 理由 |
| --- | --- | --- |
| 自動テスト名 / 件数 | CLI gate 5 件 | UI / app runtime ではなく DevEx hook 実装のため、`lefthook validate`、`bash -n`、hook 経路 grep、phase validator、spec verifier を実行する。 |
| screenshot | 作成しない | hook の挙動はターミナル CLI 出力 / `.git/hooks/*` のファイル状態に閉じており、UI 描画を伴わない。screenshot を撮っても hook 動作の証拠にならない。代替として CLI 出力テキストと `git status` / `ls .git/hooks/` のテキストログを採取する。 |
| visualEvidence | NON_VISUAL | `artifacts.json :: metadata.visualEvidence` と一致。Phase 1 main.md で確定済み。 |
| 代替証跡 | 手動 smoke ログ（テキスト）+ link-checklist | `manual-smoke-log.md` の各ステップで stdout / `git status` / hook ヘッダ grep の結果を貼り付ける運用 |

## 手動 smoke の対象範囲（本タスク実装）

1. `pnpm install` 後に `.git/hooks/{pre-commit, post-merge}` が lefthook ヘッダ付きで生成される
2. `lefthook run pre-commit --files <staged>` が旧 `.git/hooks/pre-commit` と同一の判定を返す
3. `git merge origin/main --no-edit` 実行後に `git status` が clean のまま（indexes diff が出ない）
4. `pnpm indexes:rebuild` を明示実行したときのみ `indexes/*.json` が再生成される
5. 既存 worktree への一括再 install スクリプトが prunable を skip しつつ全件成功する

## 受入確認

- [x] manual-smoke-log にコマンド・期待出力・記録欄を含む
- [x] link-checklist に内部 / 外部リンクの確認手順を含む
- [x] screenshot を作成しない理由を明記
- [x] 自動テスト 0 件の理由を明記
- [x] NON_VISUAL タスクの代替証跡が定義されている
