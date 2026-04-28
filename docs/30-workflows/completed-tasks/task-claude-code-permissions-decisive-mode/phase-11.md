# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## NON_VISUAL 宣言

- **タスク種別**: 設定ファイル / シェル alias の変更タスク
- **非視覚的理由**: UI 変更なし。証跡は CLI 出力テキストおよびモード表示文字列で取得可能
- **代替証跡**: `outputs/phase-11/manual-smoke-log.md`（CLI 観測結果のチェックリスト）

> **本タスクは `workflow: spec_created`** のため、Phase 11 は **シナリオ設計のみ**。実機実行は実装担当タスクで行う。

## 証跡の主ソース

| 項目 | 値 |
| --- | --- |
| 主ソース | `manual-smoke-log.md`（チェックリスト形式） |
| スクリーンショットを作らない理由 | UI 表示変更がなく、claude プロセスの mode 表示テキストおよび permission prompt の有無で判定可能 |
| 実施情報 | TC-01〜TC-05 + TC-F-01〜TC-F-02 + TC-R-01 |

## テストシナリオ実行計画

Phase 4 / Phase 6 で設計した TC を以下の順序で実行:

| 順序 | TC | 概要 | 期待 |
| --- | --- | --- | --- |
| 1 | TC-01 | cc 起動直後のモード表示 | bypassPermissions |
| 2 | TC-02 | reload / session 切替後のモード維持 | bypassPermissions |
| 3 | TC-03 | 別プロジェクトでの cc 起動 | 設計通り |
| 4 | TC-04 | whitelist 効果（skip-permissions 外して pnpm 実行） | prompt 無し |
| 5 | TC-05 | deny 効果（force push dummy） | block |
| 6 | TC-F-01 | 不正な defaultMode 値 | error / fallback |
| 7 | TC-F-02 | alias typo | unknown flag |
| 8 | TC-R-01 | alias 行 grep 確認 | 1 行のみ存在 |

## 結果記録フォーマット

各 TC について:

```markdown
### TC-XX: <名称>
- 実施日時: YYYY-MM-DD HH:MM
- 実行コマンド: `<command>`
- 期待結果: <expected>
- 実観測結果: <actual>
- 判定: PASS | FAIL | BLOCKED
- 備考: <env blocker / 補足>
```

source-level PASS と環境ブロッカー（[WEEKGRD-01]）は別カテゴリで記録する。

## 既知の制限

- 本タスクは spec_created。実観測は別タスクで埋まる
- `manual-smoke-log.md` のテンプレートは Phase 12 着手前に Phase 11 で確定する

## 主成果物

- `outputs/phase-11/main.md`（実行計画）
- `outputs/phase-11/manual-smoke-log.md`（チェックリストテンプレート / 結果記録）
- `outputs/phase-11/link-checklist.md`（参照リンクチェック）

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 8 件の TC がチェックリストテンプレートで揃う
- 実装タスク側で結果が埋められる前提のテンプレートが完成している

## Skill準拠補遺

## 目的

本 Phase の目的は、上記本文で定義した責務を skill 準拠の成果物へ固定することである。

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する。
- Phase 2: `outputs/phase-2/` を参照する。
- Phase 5: `outputs/phase-5/` を参照する。
- Phase 6: `outputs/phase-6/` を参照する。
- Phase 7: `outputs/phase-7/` を参照する。
- Phase 8: `outputs/phase-8/` を参照する。
- Phase 9: `outputs/phase-9/` を参照する。
- Phase 10: `outputs/phase-10/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

