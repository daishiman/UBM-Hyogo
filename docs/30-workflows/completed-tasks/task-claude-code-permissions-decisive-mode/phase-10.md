# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-28 |
| 上流 | Phase 9 |
| 下流 | Phase 11 (手動テスト) |
| 状態 | pending |

## 目的

acceptance criteria（AC-1〜AC-8）の達成と blocker の有無を判定する。MINOR 指摘は未タスク化候補として `outputs/phase-12/unassigned-task-detection.md` に格下げ登録する。

## レビュー観点

| 観点 | 内容 |
| --- | --- |
| AC 達成 | AC-1〜AC-8 の trace |
| blocker | Phase 11 を阻害する設計欠落 |
| MINOR 指摘 | 未タスク化候補（機能影響なくても格下げ登録） |
| partial fix | E-1 / E-2 / E-3 のいずれかが「設計のみ完結し実装が別タスク」である旨が明示されているか |

## 判定区分

- **CRITICAL**: Phase 11 着手不可。Phase 2 にループバック
- **MAJOR**: 修正後に Phase 11 着手可
- **MINOR**: 未タスク化して進行可

## 既知の判定軸

| 項目 | 想定判定 |
| --- | --- |
| 案 A vs 案 B 採用根拠 | MAJOR（記録不足なら） |
| 他プロジェクト波及範囲 | MAJOR（impact-analysis.md 不備なら） |
| whitelist の `Edit(*)` / `Write(*)` のスコープ限定 | MINOR（具体パス制限が記述されない場合） |
| 階層優先順位の Anthropic 公式 docs 引用 | MINOR（docs URL 未記載なら） |

## 関連タスク差分確認

| 候補タスク | 重複可能性 | 統合先候補 |
| --- | --- | --- |
| 既存 `~/.claude/settings.json` 整備系 | 要確認 | - |
| `cc` alias 改良系 | なし | - |

## 主成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/final-review-result.md`

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 全 AC PASS、設計成果物内 blocker 0 件、実装着手 blocker は Phase 12 未タスクへ格下げ登録済み
- Phase 11 着手 Go 判定が記録されている

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する。
- Phase 2: `outputs/phase-2/` を参照する。
- Phase 5: `outputs/phase-5/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。
