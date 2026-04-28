# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 (設計) |
| 下流 | Phase 4 (テスト戦略) |
| 状態 | completed |
| user_approval_required | false |

## 目的

Phase 2 で確定した pattern / smoke / rollback / 解除手順に対し、代替案 4 案を比較し PASS / MINOR / MAJOR を確定する。Phase 4 への着手可否ゲートを判定する。

## 入力

- `outputs/phase-02/main.md`
- 原典スペック §3.4 推奨アプローチ
- 上流 runbook (`gitattributes-runbook.md`)

## 代替案比較

| 案 | 概要 | 評価 |
| --- | --- | --- |
| A: `**/_legacy.md` 単一 glob で全 skill を一括カバー | 1 行で済む | MINOR: 隣接 fragment 巻き込みリスクが残る。check-attr 検証で除外を保証する条件付き PASS |
| B: skill ごとに個別 path 列挙 | 安全だが冗長 | MAJOR: skill 追加時のメンテコスト増。A-2 完了で除去対象となる暫定 driver に固定コストを払うのは過剰 |
| C: `**/_legacy*.md`（lessons-learned 含む glob） | lessons-learned/_legacy_*.md も拾える | PASS: pattern 設計と整合 |
| D: A-2 を待たず先行適用 | 早期保険 | REJECT: fragment 化済みファイルにまで driver が残り技術負債化（原典 §3.2 依存タスク違反） |

## 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| pattern 過大化 | PASS | broad glob 禁止と check-attr 検証で二重防御 |
| 構造体保護 | PASS | JSON / YAML / SKILL.md に対する `unspecified` を必須検証項目に組込み |
| smoke 検証 | PASS | 2 worktree 並列追記 + merge 系列が原典 §6 と一致 |
| rollback | PASS | revert のみで完了し副作用なし |
| 解除条件 | MINOR | 「`_legacy.md` 空」を機械判定基準にする旨は記載済み。A-2 完了レビューチェックリストへの追加は Phase 12 documentation で確認 |
| 依存ゲート | CONDITIONAL | A-1〜A-3 が main マージ済みであることを派生実装タスクの着手前提として維持する |

## Phase 4 着手可否

- 判定: **CONDITIONAL PASS（仕様作成は完了、派生実装は条件付き着手可）**
- 条件: A-1 / A-2 / A-3 main マージ evidence と MINOR（解除条件チェックリスト追加）の Phase 12 documentation 解決
- 戻り先: なし（MAJOR ゼロ）

## Phase 13 blocked 条件

- AC-1〜AC-11 のいずれかが Phase 9 / Phase 10 で FAIL
- A-2 完了後の解除手順が Phase 12 で documentation 化されない場合

## 実行タスク

1. 代替案 A〜D の比較表作成
2. 観点別 PASS / MINOR / MAJOR 判定
3. MINOR 追跡テーブル作成
4. Phase 4 着手可否ゲート判定
5. Phase 13 blocked 条件記述

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Skill Ledger Overview | `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md` | A-2 → A-1 → A-3 → B-1 の実装順序と責務境界 |
| Skill Ledger Gitattributes Policy | `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 `merge=union` の許可・禁止・解除条件 |
| Skill Ledger Lessons Learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | skill ledger 4施策の苦戦箇所と再発防止 |


| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/main.md` |
| 必須 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md` |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-03/main.md` | 代替案比較 / PASS-MINOR-MAJOR 判定 / 着手可否ゲート / MINOR 追跡 |

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決Phase | 解決確認Phase |
| --- | --- | --- | --- |
| TECH-M-01 | A-2 完了レビューチェックリストへ「B-1 attribute 残存確認」を追加 | Phase 12 | Phase 12 |

## 完了条件 (DoD)

- [x] 代替案 4 案比較完了
- [x] PASS / MINOR / MAJOR 判定が観点別に確定
- [x] Phase 4 着手可否 = CONDITIONAL PASS
- [x] Phase 13 blocked 条件明記
- [x] MINOR 追跡テーブル記載

## 苦戦箇所・注意

- **D 案の誘惑**: 早く保険を効かせたい欲求があるが、A-2 完了前の先行適用は二重管理を生む。原典 §3.2 を必ず参照
- **「PASS だから何もしなくていい」誤読**: MINOR は Phase 12 で解決義務がある。MINOR 追跡テーブルから漏らさない

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 4（テスト戦略）
- 引き継ぎ: PASS 判定 / MINOR 1 件（Phase 12 解決）
