# Phase 12 — ドキュメント更新履歴

タスク: skill-ledger-a3-progressive-disclosure
Phase: 12 / 13
作成日: 2026-04-28

> SKILL.md / references の追加・移動・削除を全リスト化する。各分割対象 skill ごとに 1 行ずつ「移動 / 新規」を追記し、per-skill PR 計画と 1:1 対応させる。

---

## 1. タスク仕様書（A-3 本体）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md` | A-3 タスク index（メタ情報 / Phase 一覧 / AC / 苦戦箇所） |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/artifacts.json` | 機械可読サマリー（root） |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-{01..13}.md` | Phase 1〜13 仕様書 13 本 |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-{01..11}/*.md` | Phase 1〜11 成果物（要件定義 / 分割設計 / 設計レビュー / テスト戦略 / ランブック / 異常系 / AC マトリクス / DRY 化 / QA / GO 判定 / 手動 smoke 証跡） |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/implementation-guide.md` | 本 Phase の 2 部構成実装ガイド |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/system-spec-update-summary.md` | Step 1-A〜1-G + Step 2 判定 |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/documentation-changelog.md` | 本ファイル |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` | 未タスク検出レポート |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| 2026-04-28 | 新規 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/phase12-task-spec-compliance-check.md` | 本 Phase compliance check |
| 2026-04-28 | 更新 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/artifacts.json` | Phase 1〜12 を `spec_created → completed`、Phase 13 維持 |
| 2026-04-28 | 更新 | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/artifacts.json` | 同上（二重 ledger 同期） |

---

## 2. skill 構造変更（PR-1 / 本 PR の対象）

### 2-1. task-specification-creator（PR-1 / 完了）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-28 | 移動 | `.claude/skills/task-specification-creator/SKILL.md` | 517 行 → **115 行**（entry 10 要素のみ残置） |
| 2026-04-28 | 新規 | `.claude/skills/task-specification-creator/references/<topic-1..7>.md` | Phase テンプレ / アセット規約 / 品質ゲート / オーケストレーション / 運用ランブック等を切り出し（**新規 7 件**） |
| 2026-04-28 | 同期 | `.agents/skills/task-specification-creator/` | canonical → mirror 同期（`diff -r` = 0） |

> **行数実績**: 517 → 115（Δ -402、200 行未満達成）。Phase 11 evidence: `outputs/phase-11/evidence/line-count.log`。

### 2-2. 残対象 4 skill（PR-2〜PR-5 / 次 wave 計画）

| 日付 | 変更種別 | 対象ファイル | 行数 before | 行数目標 | 計画 PR |
| --- | --- | --- | ---: | ---: | --- |
| 次 PR | 移動 | `.claude/skills/automation-30/SKILL.md` | 432 | < 200 | PR-2 |
| 次 PR | 新規 | `.claude/skills/automation-30/references/<topic>.md` | — | — | PR-2（重複セクション整理込み） |
| 次 PR | 移動 | `.claude/skills/skill-creator/SKILL.md` | 402 | < 200 | PR-3 |
| 次 PR | 新規 | `.claude/skills/skill-creator/references/<topic>.md` | — | — | PR-3（Collaborative / Orchestrate / Runtime 分離） |
| 次 PR | 移動 | `.claude/skills/github-issue-manager/SKILL.md` | 363 | < 200 | PR-4 |
| 次 PR | 新規 | `.claude/skills/github-issue-manager/references/<topic>.md` | — | — | PR-4（Part 1〜4 を 4 ファイル化） |
| 次 PR | 移動 | `.claude/skills/claude-agent-sdk/SKILL.md` | 324 | < 200 | PR-5 |
| 次 PR | 新規 | `.claude/skills/claude-agent-sdk/references/<topic>.md` | — | — | PR-5（Direct SDK / SkillExecutor / AuthKeyService 分離） |

> **本 PR には含めない**。各 skill の独立 revert を保つため 1 PR = 1 skill を厳守する。

### 2-3. スコープ外（既に分割済み・行数 OK）

| skill | 行数 | 扱い |
| --- | ---: | --- |
| `aiworkflow-requirements` | 190 | スコープ外（既分割の参考事例） |
| `int-test-skill` | 121 | 対象外（200 行未満） |
| `skill-fixture-runner` | 99 | 対象外（200 行未満） |

---

## 3. same-wave sync（LOGS / topic-map）

本PRで実更新したのは PR-1 対象の `task-specification-creator` entry / references と workflow 成果物である。LOGS / task-workflow / 上位 wave 追記は Phase 13 gate または後続PRの同期対象として分離する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-28 | DEFERRED | `docs/30-workflows/LOGS.md` | A-3（Issue #131）Phase 1〜12 completed / Phase 13 approval pending の追記は Phase 13 gate 対象 |
| 2026-04-28 | DEFERRED | `.claude/skills/task-specification-creator/LOGS.md` | 自 skill 分割完了（517 → 115 行 / references 7 件 / mirror diff 0）のログ化は後続同期 |
| 2026-04-28 | DEFERRED | `.claude/skills/aiworkflow-requirements/LOGS.md` | A-3 参照ログ（Progressive Disclosure 採用パターン記録）は後続同期 |
| 2026-04-28 | 既存登録済み | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | skill-ledger / Progressive Disclosure entry は既存 topic-map に存在 |
| 2026-04-28 | 既存登録済み | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | skill-ledger / Progressive Disclosure entry は既存 resource-map に存在 |
| 2026-04-28 | 既存登録済み | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | skill-ledger / Progressive Disclosure entry は既存 quick-reference に存在 |

---

## 4. 別 PR（PR-N）— skill 改修ガイド Anchor 追記

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 別 PR | 追記 | `.claude/skills/task-specification-creator/references/skill-improvement-guide.md`（または既存ガイド） | 「fragment で書け」「200 行を超えたら分割」Anchor を恒久追記 |
| 別 PR | 追記 | `.agents/skills/task-specification-creator/references/skill-improvement-guide.md` | mirror 同期 |

> 本体 revert と独立に巻き戻せるよう **必ず別 PR** で実施する（AC-10）。

---

## 5. 削除（なし）

本タスクでは `.claude/skills/` / `.agents/skills/` 配下の **削除は行わない**。SKILL.md は移動（行数縮小）であり、移送先は references として **追加** のみ。

---

## 6. per-skill PR 計画との 1:1 対応確認

| PR | 対象 | changelog 行 | 状態 |
| --- | --- | --- | --- |
| PR-1 | task-specification-creator | 2-1（移動 1 + 新規 7 + 同期 1） | 本 PR / Phase 13 で提出 |
| PR-2 | automation-30 | 2-2（移動 1 + 新規 N） | 次 wave |
| PR-3 | skill-creator | 2-2 | 次 wave |
| PR-4 | github-issue-manager | 2-2 | 次 wave |
| PR-5 | claude-agent-sdk | 2-2 | 次 wave |
| PR-N | skill 改修ガイド Anchor 追記 | §4 | 別 PR |

→ Phase 13 PR description の根拠として、§2-1 のみを本 PR の変更範囲として記述する。
