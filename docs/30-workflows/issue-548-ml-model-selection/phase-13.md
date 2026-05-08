# Phase 13: PR 作成

## 目的

ユーザー承認後に PR を作成する。Issue #548 は CLOSED 状態のため再オープン操作も close 操作も行わず、PR 本文に `Refs #548` のみ記載する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 多段ゲート（NON_VISUAL の二重承認）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | spec 完了 + comparison report 生成 evidence | ユーザー明示 OK |
| G2 | leakage grep が training artifact 2 本 + report 2 本に対し exit 0 | ユーザー明示 OK |
| G3 | commit / push 承認 | ユーザー明示 OK |
| G4 | PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させ、合算承認は禁止。

## PR 構成

- Title: `feat(cf-audit-log): add 3 ML classifier candidates and offline model-comparison harness (Refs #548)`
- Base: `dev`
- Body 必須項目:
  - Summary: 本サイクル実装スコープ（3 ML classifier + comparison harness + selection-criteria + 2 training scripts + 5 focused tests + synthetic 90 日 fixture + comparison report 生成）
  - Out of scope: production env での classifier 切替（FU-03-D）/ 本番 90 日 dataset 抽出（FU-03-B 完了待ち）
  - Refs #548（Closes は使わない）
  - Test plan: typecheck / lint / focused vitest 5 / training 2 本実行 / comparison report 生成 / leakage grep
  - Rollback: `gh variable set CF_AUDIT_CLASSIFIER --body "threshold"` 1 step（ただし本 PR は production 既定値変更を含まないため当面不要）
  - Evidence: `outputs/phase-11/` への path
  - Skill / SSOT updates: SSOT 2 + LOGS 2

## 禁止事項

- Issue #548 の `Closes #548` 記述
- Issue 状態の自動変更（reopen / close）
- production migration apply / production env 切替を本 PR に含めること
- `--no-verify` 系 hook skip

## 完了条件

- [ ] G1〜G4 各承認をユーザーから取得
- [ ] PR open 後 URL を `outputs/phase-13/main.md` に記録
- [ ] PR body に `Refs #548` 含む
- [ ] PR が production secret / token / model artifact（raw 値）を含まない

## 出力

- `outputs/phase-13/main.md`

## 参照資料

- `index.md`
- `phase-11.md` ・ `phase-12.md`
- CLAUDE.md `## PR作成の完全自律フロー`（NON_VISUAL では多段承認を優先するため、本 Phase はユーザー承認待ちで停止する）
- 親 #515 phase-13

## 統合テスト連携

- 不要（PR open 自体）

## 実行タスク

| Task | 内容 |
| --- | --- |
| 13-1 | 多段ゲート G1〜G4 承認取得 |
| 13-2 | PR open（`Refs #548`） |

## 依存Phase参照

Phase 1〜12 の成果物を上流契約として参照する。
