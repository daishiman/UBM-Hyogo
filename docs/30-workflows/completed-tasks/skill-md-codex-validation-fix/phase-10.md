# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 名称 | 最終レビュー |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

AC-1〜AC-8 の達成判定と blocker 確認を行う。

## AC 判定

| AC | 内容 | 判定 | 証跡 |
| --- | --- | --- | --- |
| AC-1 | 起動時警告 0 件（Codex / Claude Code 双方） | （Phase 11 で確認） | main.md / manual-smoke-log.md |
| AC-2 | 是正対象 3 件が R-01〜R-07 PASS | （Phase 9 Q-09） | qa-result.md |
| AC-3 | フィクスチャ移行後の skill-creator テスト全 Green | （Phase 9 Q-03） | qa-result.md |
| AC-4 | description ≥ 1025 字 generate で書き込み前 throw | （Phase 6 TC-CDX-EC-02） | extended-tests.md |
| AC-5 | summary / triggerLine の YAML safe escape | （Phase 6 EC-06/07/10） | extended-tests.md |
| AC-6 | Anchors > 5 / Trigger > 15 で自動退避 | （Phase 4 TC-CDX-C04/C05） | test-cases.md |
| AC-7 | 実在 mirror parity 0 diff | （Phase 9 Q-04/Q-05/Q-06） | qa-result.md |
| AC-8 | 単一 PR 内に 3 Lane が共存 | （Phase 13 で確認） | PR diff |

## レビュー観点（4 条件）

| 観点 | 結果 |
| --- | --- |
| 価値性 | 警告 0 + 再発防止のため即時の生産性向上 |
| 実現性 | 1 PR で達成 |
| 整合性 | mirror / canonical / フィクスチャ全て整合 |
| 運用性 | throw メッセージで対処自明 |

## 指摘候補（あれば未タスク化）

レビュー時点で残課題が見つかれば `unassigned-task-detection.md` に記録する。MINOR 判定でも「機能に影響なし」を理由に省略しない。

| ID | 種別 | 状態 |
| --- | --- | --- |
| (none) | - | - |

## 受入条件（Phase 10 完了条件）

- [ ] AC-1〜AC-8 すべて PASS or 確認方法が Phase 11/13 に委譲済み
- [ ] MINOR 指摘がある場合、未タスク化方針を記録

## 成果物

- `outputs/phase-10/final-review-result.md`

## 実行タスク

- AC-1〜AC-8 の達成見込みと未確認項目を判定する。
- Phase 11/12/13 に残す確認事項を明示する。
- blocker と rollback 方針を整理する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 design | `outputs/phase-2/design.md` | AC の設計根拠 |
| Phase 5 diff | `outputs/phase-5/diff-summary.md` | 実装差分 |
| Phase 12 unassigned | `outputs/phase-12/unassigned-task-detection.md` | 未タスク確認 |
| Phase 9 | `phase-9.md` | QA 結果 |
| review gate | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` | 最終判定 |

## 統合テスト連携

Phase 10 は Phase 11 手動 evidence と Phase 12 close-out の直前判定とし、未確認 AC は明示して次 Phase に渡す。

## 完了条件

- [ ] AC ごとの証跡が Phase 番号付きで整理されている
- [ ] 未確認 AC の移譲先が Phase 11/13 に限定されている
- [ ] blocker が残る場合は Phase 13 blocked と整合している

## タスク100%実行確認【必須】

- [ ] Phase 10 の成果物と artifacts.json の登録が一致している
