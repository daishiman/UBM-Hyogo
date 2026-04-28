# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 |
| 下流 | Phase 9 (品質保証) |
| 状態 | pending |

## 目的

設計成果物（Phase 2 の 3 ファイル）の重複や記述ドリフトを削減する。コード変更は無し。

## リファクタリング対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| settings-diff.md と alias-diff.md の重複説明 | 階層優先順位の説明が両方に存在 | impact-analysis.md（Phase 3）へ集約、両ファイルから参照 | 単一情報源原則 |
| whitelist-design.md と settings-diff.md の `permissions` 記述 | 両方に allow/deny を列挙 | whitelist-design.md を正本にし、settings-diff は参照リンクのみ | DRY |
| ランブック手順（Phase 5）と Phase 12 implementation-guide | Step 1〜6 が両方に登場 | implementation-guide は Part 1（中学生レベル）+ Part 2（参照リンク）に分け、ランブック詳細は Phase 5 のみ | 読者層分離 |

## navigation drift 確認

- `index.md` Phase 表 → `phase-NN.md` → `outputs/phase-N/*.md` の 3 段リンクが全て生きていること
- `artifacts.json` の `outputs` 配列と実ファイル名が一致

## 主成果物

- `outputs/phase-8/main.md`（リファクタリング記録）

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 重複削減後の navigation map が記録されている
- リンク切れ 0 件

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する。
- Phase 2: `outputs/phase-2/` を参照する。
- Phase 5: `outputs/phase-5/` を参照する。
- Phase 6: `outputs/phase-6/` を参照する。
- Phase 7: `outputs/phase-7/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

