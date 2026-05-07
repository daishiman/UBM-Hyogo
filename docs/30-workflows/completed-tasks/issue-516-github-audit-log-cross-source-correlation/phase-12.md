# Phase 12: implementation guide / SSOT sync / changelog 等 6 タスク

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| Source | `outputs/phase-12/main.md` |
| 区分 | ドキュメント / SSOT 同期（task-specification-creator phase-12-spec.md 準拠） |
| 想定所要 | 0.5 人日 |

## 目的

`.claude/skills/task-specification-creator/references/phase-12-spec.md` の strict 7 files と 6 必須タスク（Task 6 compliance check を含む）を完了し、システム仕様書 / changelog / unassigned-task 検出 / skill feedback / compliance を更新する。

## 実行タスク

以下の 6 必須タスクと Task 6 compliance check を実行し、`outputs/phase-12/` の strict 7 files を揃える。

## 6 必須タスク + Task 6 compliance check

### 1. 実装ガイド Part1（`outputs/phase-12/implementation-guide.md`）

PR 本文から参照される実装の詳細解説。以下を含む:
- 変更点サマリ（apps/api/src/audit-correlation/ / scripts/audit-correlation/ / .github/workflows/）
- redact-safe join key 設計の中学生レベル概念説明（hash とは何か / salt がなぜ要るか）
- HIGH severity 判定ロジックの図解
- 既知の限界（live wiring 未実装 / D1 永続化なし）
- follow-up TODO（Cloudflare Worker への live endpoint 追加 / branch protection 必須化）

### 2. system-spec-update-summary.md

- `docs/00-getting-started-manual/specs/` 配下で audit log / security 章への追記が必要かを判定。
- 追記が必要な場合は本タスクスコープに含める（CONST_007 整合）。
- 不要なら「変更不要」を根拠付きで記録。

### 3. システム仕様書更新 / `aiworkflow-requirements` SSOT 同期

- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` を新規作成（SSOT）。内容:
  - 役割: cross-source audit correlation
  - 入出力: GitHub `/orgs/{org}/audit-log` + Cloudflare audit → CorrelatedFinding[]
  - PII redaction ポリシー
  - HIGH severity 判定基準
  - runbook へのリンク
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` に `audit-correlation` / `fingerprint hash` / `cross-source` キーワードを追加。
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に Issue #516 の即時導線を追加。
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` に新 reference を登録。
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` に security topic 追加。
- 検証: `mise exec -- pnpm indexes:rebuild` を実行 → drift なしを確認。

### 4. changelog（`outputs/phase-12/documentation-changelog.md`）

- 「Issue #516 cross-source correlation 基盤を追加」を記録。
- 影響範囲: `apps/api/src/audit-correlation/`（新規）/ `scripts/audit-correlation/`（新規）/ `.github/workflows/audit-correlation-verify.yml`（新規）/ `docs/runbooks/audit-correlation.md`（新規）。
- 互換性: 既存ランタイムへの破壊的変更なし。

### 5. unassigned-task 検出（`outputs/phase-12/unassigned-task-detection.md`）

- 検出: 「Cloudflare Worker への live audit-correlation endpoint 追加」「branch protection に `audit-correlation-verify / verify` を必須登録」「salt rotation 自動化」を **新規 unassigned-task として formalize** する。
- 起票形式: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-XX-*.md`。外部権限 / branch protection 実設定 / live endpoint 設計のように今回実装スコープから独立するものだけを未タスク化し、`unassigned-task-detection.md` に理由・実施時期・配置先を記録する。

### 6. skill feedback report（`outputs/phase-12/skill-feedback-report.md`）

- task-specification-creator skill に対する feedback:
  - phase-12-spec.md の 6 タスク構造は機能した
  - NON_VISUAL evidence template が今回のような security タスクで有効
  - 改善提案: cross-source correlation 系タスクは Phase 1 で「join key 仕様確定」を強制する template があると良い

### 7. compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

- CONST_005（実装区分 / 変更ファイル / 関数シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD）が全 phase で揃っていることを確認。
- CONST_007（1 サイクル完了スコープ）整合性確認: 全 13 phase が 4-5 人日で完結。

## ローカル実行コマンド

```bash
mise exec -- pnpm indexes:rebuild
mise exec -- pnpm sync:check  # main / dev 同期確認
```

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`（新規）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`

## 完了条件（DoD）

- [ ] 6 タスクすべての成果物が揃っている。
- [ ] aiworkflow-requirements の indexes drift なし（`pnpm indexes:rebuild` 後 git diff 空）。
- [ ] CONST_005 / CONST_007 整合性が compliance-check で文書化。
- [ ] `verify-indexes-up-to-date` CI gate が green。
