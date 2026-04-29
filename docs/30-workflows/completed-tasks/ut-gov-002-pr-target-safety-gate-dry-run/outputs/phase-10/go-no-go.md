# Phase 10 — Go / No-Go 判定

## 0. 凡例

- **PASS**: 受入条件を充足
- **MINOR**: 軽微な未充足（運用補強 / 後続 Phase で吸収）
- **MAJOR**: 受入条件未達。GO 不可

本タスクは docs-only / NON_VISUAL の dry-run specification 整備タスクであり、本 Phase の **GO** は「仕様書整備の完了」を意味する（dry-run 実走は別 PR / 後続実装タスクで行う、AC-8）。

## 1. AC × 証跡 × 判定

| AC | 受入条件（要約） | 裏付け証跡 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `pull_request_target` 内に PR head の checkout / code execution が **置かれていない** | `outputs/phase-2/design.md` §2.1 / §3 / §4 #1、`outputs/phase-4/test-matrix.md`、`outputs/phase-9/quality-gate.md` §1 / §2 | PASS |
| AC-2 | untrusted build は `pull_request` workflow に分離、`contents: read` のみ | `outputs/phase-2/design.md` §2.2、`outputs/phase-5/runbook.md`、`outputs/phase-9/quality-gate.md` §1 | PASS |
| AC-3 | fork PR シナリオで token / secret 露出ゼロの設計証跡 | `outputs/phase-4/test-matrix.md`、`outputs/phase-6/failure-cases.md`、`outputs/phase-9/quality-gate.md` §3 | PASS（設計証跡） |
| AC-4 | "pwn request" 非該当根拠（5 箇条）がレビュー記録に残る | `outputs/phase-3/review.md` §3、`outputs/phase-9/quality-gate.md` §2 | PASS |
| AC-5 | `permissions: {}` ＋ job 単位昇格 ＋ 全 checkout `persist-credentials: false` の三重明記 | `outputs/phase-2/design.md` §2.1 / §2.2 / §3、`outputs/phase-5/runbook.md`、`outputs/phase-9/quality-gate.md` §4 | PASS |
| AC-6 | 親タスク Phase 2 §6 草案を input として継承 | `outputs/phase-1/main.md` §1、`outputs/phase-2/design.md` §1、`outputs/phase-3/review.md` §0 / §2 N-1 | PASS |
| AC-7 | docs-only / NON_VISUAL / infrastructure_governance + security の固定 | `index.md`、`artifacts.json`、`outputs/phase-1/main.md` §0 / §5 | PASS |
| AC-8 | 実 workflow 編集 / dry-run 実走は本タスク非対象（別 PR） | `outputs/phase-1/main.md` §5、`phase-13.md`、各 phase 冒頭注記 | PASS |
| AC-9 | ロールバック設計（単一 revert コミット粒度）の三重明記 | `outputs/phase-2/design.md` §5、`outputs/phase-5/runbook.md`、本書 §4 | PASS |

集計: **MAJOR 0 件 / MINOR 0 件 / PASS 9 件**。

## 2. GO 判定基準

以下の **全て** を満たす場合に GO とする。

- [x] AC-1〜AC-9 が全て PASS（本書 §1）
- [x] NO-GO 条件 N-1〜N-3 / AC 違反追加 NO-GO のいずれにも抵触しない（本書 §3）
- [x] 親タスク（task-github-governance-branch-protection）Phase 2 §6 草案の input 継承が確認済み（AC-6）
- [x] artifacts.json と index.md の Phase status が同期されている
- [x] Phase 9 quality-gate.md で MAJOR 0 件が記録されている
- [x] AC-9 ロールバック設計が三重明記（design.md §5 / runbook.md / 本書 §4）で成立

## 3. NO-GO 条件（独立表）

以下のいずれかに該当する場合は **NO-GO**。本タスクは docs-only のため、判定対象は仕様書整備の完成度であり、抵触時は該当 Phase に差し戻す。

| ID | 条件 | 検出手段 | 現状 |
| --- | --- | --- | --- |
| N-1 | 親タスク Phase 2 §6 草案を input として継承していない（AC-6 違反） | Phase 2 design.md §1 / §3 から親タスク参照欠落、または YAML 構造が著しく逸脱 | 抵触なし |
| N-2 | UT-GOV-001 未適用で required status checks 名が job 名と未同期 | branch protection 状態確認（実走は Phase 11 / 後続実装タスク） | 抵触なし（前提条件として明記済み） |
| N-3 | UT-GOV-007 未適用で `uses:` が SHA pin されていない | actionlint / yq による静的検査（Phase 5 runbook） | 抵触なし（前提条件として明記済み） |
| AC-1 違反 | `pull_request_target` 内に PR head の checkout / code execution が残存 | actionlint + yq | 抵触なし |
| AC-3 違反 | fork PR シナリオで token / secret 露出が観測 / 設計上排除されない | test-matrix / failure-cases | 抵触なし |
| AC-4 違反 | "pwn request" 5 箇条のいずれかが欠落 | review.md §3 | 抵触なし |
| AC-5 違反 | `permissions: {}` / job 単位昇格 / `persist-credentials: false` のいずれかが欠落 | yq + design / runbook / quality-gate の三重明記確認 | 抵触なし |
| AC-9 違反 | ロールバック設計が単一 revert コミット粒度になっていない / 三重明記欠落 | design.md §5 / runbook.md / 本書 §4 | 抵触なし |
| 追加 | `workflow_run` 経由の secrets 橋渡しが残存 | grep `on:\s*workflow_run` | 抵触なし |
| 追加 | 任意の workflow に `${{ github.event.pull_request.head.* / title / body }}` の直接 eval が残存 | grep | 抵触なし |

## 4. AC-9 ロールバック設計の最終確認

| 項目 | 確認 | 根拠 |
| --- | --- | --- |
| 単一 revert コミットで safety gate 適用前へ戻せる | OK | `outputs/phase-2/design.md` §5.1 |
| `git revert <safety-gate コミット>` の 1 コマンドで完了 | OK | `outputs/phase-2/design.md` §5.1、`outputs/phase-5/runbook.md` |
| required status checks の job 名ドリフトがない | OK | `outputs/phase-2/design.md` §5.2、UT-GOV-001 と同期方針 |
| ロールバック判断トリガが明文化（fork PR token 露出 / triage が untrusted code 評価 / status checks 名ドリフト） | OK | `outputs/phase-2/design.md` §5.3 |
| AC-9 三重明記（design.md / runbook.md / 本書） | OK | 本書 §1 AC-9 行 |

## 5. レビュアー指定方針（solo 運用）

CLAUDE.md 準拠。

- 必須レビュアー数: **0**
- 品質担保: CI gate（required status checks）／ 線形履歴 ／ 会話解決必須化 ／ force push & 削除禁止
- 本タスクは docs-only のため、CI gate 通過と本書の GO 判定のみで承認可能

## 6. 残課題候補（unassigned-task 予約）

Phase 12 unassigned-task-detection.md へ送る候補:

| 候補 ID | 内容 | 想定 scope |
| --- | --- | --- |
| U-A | dry-run 実走（fork PR / 実 PR を用いた smoke）の別 PR 切り出し | infrastructure_governance + security |
| U-B | secrets 棚卸しの自動化（GitHub OIDC / OpenID 化評価を含む） | security |
| U-C | `workflow_run` を使うケースが将来発生した場合の追加レビュー観点策定 | security |
| U-D | required status checks 名と job 名のドリフト自動検知 CI 追加 | infrastructure_governance |

## 7. 最終 GO / NO-GO 判定

**GO（仕様書整備の完了として）**

- AC-1〜AC-9: 9 件 PASS、MAJOR 0 件。本タスクの GO は仕様作成 GO であり、実 workflow の安全性担保完了は後続 UT-GOV-002-IMPL / UT-GOV-002-SEC の完了後に判定する。
- NO-GO 条件 N-1〜N-3 および AC 違反追加 NO-GO のいずれにも抵触しない
- AC-9 ロールバック設計の三重明記が成立
- 親タスク Phase 2 §6 草案の input 継承を確認
- 本タスクの GO は **dry-run specification / runbook の整備完了** を意味し、dry-run の実走は U-A（別 PR / 後続実装タスク）に委ねる
- commit / push / PR 作成はユーザー承認後に Phase 13 で実施

> Phase 11（手動 smoke / リンクチェック）→ Phase 12（ドキュメント更新 / unassigned-task 予約）→ Phase 13（ユーザー承認）へ進行可能。
