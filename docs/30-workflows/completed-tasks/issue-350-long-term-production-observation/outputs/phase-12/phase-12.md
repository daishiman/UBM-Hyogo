# Phase 12 — 反映タスク（実装ガイド / 履歴 / 未タスク / skillFB / コンプライアンス）

**[実装区分: 実装仕様書]** / **NON_VISUAL** / **spec_created（本 cycle 内では runtime 完了させない）**

## 必須 7 成果物 / 6 タスク

1. [phase-12.md](./phase-12.md) — Phase 12 本体
2. [implementation-guide.md](./implementation-guide.md) — 中学生レベル + 技術者レベル
3. [system-spec-update-summary.md](./system-spec-update-summary.md) — Step 1-A/B/C 反映
4. [documentation-changelog.md](./documentation-changelog.md) — ドキュメント更新履歴
5. [unassigned-task-detection.md](./unassigned-task-detection.md) — 未タスク検出（0 件でも出力必須）
6. [skill-feedback-report.md](./skill-feedback-report.md) — skill フィードバック（改善点なしでも 3 観点固定）
7. [phase12-task-spec-compliance-check.md](./phase12-task-spec-compliance-check.md) — 仕様書コンプライアンスチェック

## 状態管理ルール

- workflow root の `状態` は `spec_created` のまま据え置き（runtime evidence はまだ）
- 各 Phase の `phases[].status` のみ Phase 完了に応じて `completed`
- runtime evidence pending のため `PASS` 単独表記禁止

## DoD

- [ ] strict 7 ファイル全て実体存在
- [ ] implementation-guide が Part1（中学生レベル）と Part2（技術者）で分離されている
- [ ] system-spec-update-summary に SSOT 反映先 path が列挙されている
- [ ] unassigned-task-detection は 0 件または検出件数を明示し、各項目に苦戦箇所 / リスクと対策 / 検証方法 / スコープを含む
- [ ] skill-feedback-report は「テンプレ改善 / ワークフロー改善 / ドキュメント改善」の 3 章固定
- [ ] phase12-task-spec-compliance-check は CONST_005 必須項目が全 phase で揃っているかチェック表を含む
