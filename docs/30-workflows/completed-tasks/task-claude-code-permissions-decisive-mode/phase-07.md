# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 |
| 下流 | Phase 8 (リファクタリング) |
| 状態 | pending |

## 目的

settings ファイル変更タスクのため line / branch カバレッジは N/A。代わりに **要件カバレッジ**（要件 → 設計 → テスト の完全網羅）をマトリクスで可視化する。

## 要件カバレッジマトリクス

| 要件 ID | 概要 | 設計 (Phase 2) | テスト (Phase 4) | 補助 (Phase 6) |
| --- | --- | --- | --- | --- |
| F-1 | settings 3 層統一 | settings-diff.md | TC-01, TC-02 | TC-F-01 |
| F-2 | cc alias 強化 | alias-diff.md | TC-01, TC-03 | TC-F-02 |
| F-3 | whitelist 整備 | whitelist-design.md | TC-04, TC-05 | TC-R-01 |
| F-4 | 階層優先順位の文書化 | impact-analysis.md（参照） | - | - |

## AC カバレッジ

| AC | 概要 | 紐付け |
| --- | --- | --- |
| AC-1 | settings 完全形 diff | Phase 2 settings-diff.md |
| AC-2 | alias 書き換え diff | Phase 2 alias-diff.md |
| AC-3 | whitelist 設計 | Phase 2 whitelist-design.md |
| AC-4 | 階層優先順位ドキュメント方針 | Phase 12 で claude-code-config.md に追記 |
| AC-5 | 手動シナリオ | Phase 4 / Phase 11 |
| AC-6 | 影響範囲レビュー | Phase 3 impact-analysis.md |
| AC-7 | NON_VISUAL 証跡 | Phase 11 manual-smoke-log.md |
| AC-8 | Phase 12 6 成果物 | Phase 12 |

## カバレッジ目標

- 要件 F-1〜F-4 の 4 件に対し、設計 + テストで 100% trace 可能
- 未カバー要件 0 件

## 主成果物

- `outputs/phase-7/main.md`（カバレッジマトリクス）

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 全要件 / 全 AC にトレースが付いている
- 未カバー 0 件、または未カバー理由が明示されている

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 5: `outputs/phase-5/` を参照する。
- Phase 6: `outputs/phase-6/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

