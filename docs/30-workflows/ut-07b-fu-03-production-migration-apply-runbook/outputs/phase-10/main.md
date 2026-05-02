# Phase 10: 最終レビュー（GO / NO-GO ゲート — 実装仕様書版）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 10 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## サマリ

実装仕様書スコープ（runbook + F1-F9 scripts + bats + CI gate）の最終ゲート判定として、本 Phase は **RUNTIME_EVIDENCE_GATED** を発出する。詳細は `../../phase-10.md` を参照。

## 主要判定

| 項目 | 判定 |
| --- | --- |
| MAJOR blocker | 0 |
| MINOR blocker | 0（MINOR 指摘 3 件は Phase 12 / 下流タスクへ移管） |
| 4 条件評価 | 矛盾なし PASS / 漏れなし PASS_WITH_OPEN_SYNC / 整合性 PASS / 依存関係整合 PASS |
| CONST_004 / 005 / 007 | 全 PASS |
| AC-1〜AC-20 | DOC_PASS（AC-12 のみ Phase 11 実走で RUNTIME_EVIDENCE_GATED） |
| Phase 11 進行判断 | RUNTIME_EVIDENCE_GATED（bats green + staging `DRY_RUN=1` + CI gate green が PR merge 前提） |
| Phase 12 進行判断 | PASS_WITH_OPEN_SYNC |
| Phase 13 進行判断 | blocked_until_user_approval |

## 実装ファイル一覧（F1-F9）

| ID | ファイル | 種別 |
| --- | --- | --- |
| F1 | `scripts/d1/preflight.sh` | new |
| F2 | `scripts/d1/postcheck.sh` | new |
| F3 | `scripts/d1/evidence.sh` | new |
| F4 | `scripts/d1/apply-prod.sh` | new |
| F5 | `scripts/cf.sh` | edit（`d1:apply-prod` サブコマンド追加） |
| F6 | `.github/workflows/d1-migration-verify.yml` | new |
| F7 | `scripts/d1/__tests__/*.bats` | new |
| F8 | `package.json` | edit（`test:scripts` script 追加） |
| F9 | `outputs/phase-05/main.md` | runbook 本体（spec） |

## 「production 実 apply は本タスク外」境界

- F4 apply-prod.sh のデフォルトは `DRY_RUN=1`
- `DRY_RUN=0` の production 適用手順は Phase 5 末尾に「本タスク外、参考」として配置
- 本 PR の merge は production migration apply のトリガーにしない
- 実 apply は別タスク（UT-07B-FU-04 候補）で運用承認のうえ実行

## 完了判定

RUNTIME_EVIDENCE_GATED — Phase 11 evidence 取得（bats / staging dry-run / CI gate）後に Phase 12 → Phase 13（ユーザー承認後）へ進行可能。
