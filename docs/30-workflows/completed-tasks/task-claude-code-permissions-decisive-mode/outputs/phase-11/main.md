# Phase 11 Main: 手動テスト実行計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| taskType | docs-only |
| workflow | spec_created |
| visualEvidence | NON_VISUAL |
| screenshot | 不要（`screenshots/` 自体作成しない） |
| 主証跡 | `outputs/phase-11/manual-smoke-log.md` |
| 補助証跡 | `outputs/phase-11/link-checklist.md` |

## NON_VISUAL 宣言

- 本タスクは Claude Code の設定ファイル（`settings.json`, `settings.local.json`）と shell alias の変更案を記述する設計タスクであり、UI 画面や視覚要素の変更を一切伴わない。
- そのため Phase 11 の証跡形態は「CLI 観測テキスト」と「設定ファイルの差分」のみを採用する。
- スクリーンショットは生成しない。`screenshots/.gitkeep` も置かない。

## 範囲

Phase 4 / Phase 6 で設計した 8 件の TC を実機で順次実行するためのチェックリストを `manual-smoke-log.md` に固定する。
本タスクは `spec_created` のため、Phase 11 ではテンプレートを完成させ、実機実行は別実装タスクで行う。

## 実施前提

- 実機実行担当者は別タスクの作業者
- 実行環境: macOS / zsh / Claude Code CLI（最新版）
- 検証対象: `~/.claude/settings.json`, `~/.claude/settings.local.json`, `<project>/.claude/settings.json`, `~/.zshrc` の `cc` alias
- 採用案: A（全層 `defaultMode: "bypassPermissions"`）+ `cc` エイリアスへの `--dangerously-skip-permissions` 併用

## 実行順序サマリ

| 順 | TC | 概要 | 期待 |
| --- | --- | --- | --- |
| 1 | TC-01 | cc 起動直後の mode 表示 | bypassPermissions |
| 2 | TC-02 | reload / session 切替後の mode 維持 | bypassPermissions |
| 3 | TC-03 | 別プロジェクトでの cc 起動 | 設計通り |
| 4 | TC-04 | whitelist 効果（pnpm 実行 / 確認 prompt 無し） | prompt 無 |
| 5 | TC-05 | deny 効果（force push dummy） | block |
| 6 | TC-F-01 | 不正な defaultMode 値 | エラー / fallback |
| 7 | TC-F-02 | alias typo（`--dangerouslyy-...`） | unknown flag |
| 8 | TC-R-01 | alias 行 grep 確認 | 1 行のみ存在 |

## 完了条件

- [x] 8 件の TC がチェックリスト形式で揃う
- [x] 結果記録フォーマットが固定済み
- [x] link-checklist.md で 3 段リンク健全性が確認できる
- [ ] 実機実行は別タスクで PASS / FAIL / BLOCKED 判定が埋まる

## 参照

- Phase 4: `outputs/phase-4/test-scenarios.md`
- Phase 6: `outputs/phase-6/main.md`
- Phase 10: `outputs/phase-10/final-review-result.md`
