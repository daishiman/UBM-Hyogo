# Phase 9 — Quality Gate

## 0. 凡例

- **PASS**: 充足エビデンスがあり、追加対応不要
- **MINOR**: 軽微な未充足（運用補強で対応可能）
- **MAJOR**: 受入条件未達。該当 Phase に差し戻し

## 1. AC-1〜AC-9 充足エビデンス表

| AC | 受入条件（要約） | 充足箇所 | エビデンス path | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `pull_request_target` 内に PR head の checkout / code execution が **置かれていない** | Phase 2 §2.1 / §3 / §4 #1、Phase 4 test-matrix | `outputs/phase-2/design.md` §2.1 / §3、`outputs/phase-4/test-matrix.md` | PASS |
| AC-2 | untrusted build は `pull_request` workflow に分離、`contents: read` のみ | Phase 2 §2.2 / §3、Phase 5 runbook | `outputs/phase-2/design.md` §2.2、`outputs/phase-5/runbook.md` | PASS |
| AC-3 | fork PR シナリオで token / secret が露出しない設計である | Phase 2 §2.4 / §4、Phase 4 test-matrix、Phase 6 failure-cases、Phase 9 §3 | `outputs/phase-2/design.md` §2.4、`outputs/phase-4/test-matrix.md`、`outputs/phase-6/failure-cases.md`、本書 §3 | PASS（設計証跡） |
| AC-4 | "pwn request" 非該当根拠（5 箇条）がレビュー記録に残る | Phase 3 §3、本書 §2 | `outputs/phase-3/review.md` §3、本書 §2 | PASS |
| AC-5 | `permissions: {}` ＋ job 単位昇格 ＋ 全 checkout `persist-credentials: false` の三重明記 | Phase 2 §2.1 / §2.2、Phase 5 runbook、本書 §4 | `outputs/phase-2/design.md`、`outputs/phase-5/runbook.md`、本書 §4 | PASS |
| AC-6 | 親タスク Phase 2 §6 草案を input として継承 | Phase 1 §1、Phase 2 §1、Phase 3 §0 / §2 N-1 | `outputs/phase-1/main.md` §1、`outputs/phase-2/design.md` §1、`outputs/phase-3/review.md` §0 / §2 | PASS |
| AC-7 | docs-only / NON_VISUAL / infrastructure_governance + security の固定 | index.md、artifacts.json、Phase 1 §0 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/index.md`、`artifacts.json` | PASS |
| AC-8 | 実 workflow 編集 / dry-run 実走は本タスク非対象 | Phase 1 §5、Phase 13、各 phase 冒頭注記 | `outputs/phase-1/main.md` §5、phase-13.md | PASS |
| AC-9 | ロールバック設計（単一 revert コミット粒度）の三重明記 | Phase 2 §5、Phase 5 runbook、Phase 10 go-no-go | `outputs/phase-2/design.md` §5、`outputs/phase-5/runbook.md`、`outputs/phase-10/go-no-go.md` | PASS |

## 2. "pwn request" 非該当レビュー記録（AC-4）

Phase 3 review.md §3 を入力に、5 箇条の最終確認結果を記録する。

| # | 箇条 | 設計上の保証 | 検証手段 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | `pull_request_target` で PR head を checkout しない | Phase 2 §2.1 で `ref: default_branch` または `base.sha` 固定 | actionlint + yq で `on.pull_request_target` workflow の checkout `ref` から `head.*` を排除 | PASS |
| 2 | `workflow_run` を介した secrets 橋渡しをしない | 代替案 D を MAJOR 却下 | `grep 'on:\s*workflow_run'` が 0 件 | PASS |
| 3 | `${{ github.event.pull_request.head.* / title / body }}` を script に直接 eval しない | env 経由のみ許可 | grep で `run:` 内の直接展開を検出 | PASS |
| 4 | 全 `actions/checkout` に `persist-credentials: false` を強制 | Phase 2 §2.1 / §2.2 / §3、Phase 5 runbook、本書 §4 で三重明記 | yq で全 workflow の checkout `persist-credentials` を抽出 | PASS |
| 5 | workflow デフォルト `permissions: {}` ＋ job 単位最小昇格 | Phase 2 §2.1 / §2.2、Phase 5 runbook、本書 §4 で三重明記 | yq で root `permissions: {}` と job permissions を確認 | PASS |

## 3. fork PR シナリオ token 非露出証跡（AC-3）

| シナリオ | 設計上の保証 | エビデンス | 判定 |
| --- | --- | --- | --- |
| same-repo PR | secrets / GITHUB_TOKEN は untrusted build に渡らない設計（`permissions: contents: read` のみ） | Phase 2 §2.2、Phase 4 test-matrix | PASS（設計証跡） |
| fork PR | GitHub が secrets を注入しない＋ `${{ secrets.* }}` を一切参照しない設計 | Phase 2 §2.2 / §2.4、Phase 4 test-matrix | PASS（設計証跡） |
| labeled trigger | triage workflow は label 操作のみで PR head を checkout しない | Phase 2 §2.1、Phase 4 test-matrix | PASS |
| scheduled trigger | `schedule` を使う workflow は PR head を扱わない | Phase 4 test-matrix、Phase 6 failure-cases | PASS |
| re-run | re-run でも `actions: write` を付与しないため連鎖 trigger 不可 | Phase 3 §4 S-3 | PASS |

## 4. permissions / persist-credentials / 最小権限の三重明記確認（AC-5）

| 明記箇所 | 内容 | 判定 |
| --- | --- | --- |
| `outputs/phase-2/design.md` §2.1 / §2.2 / §3 | workflow デフォルト `permissions: {}`、job 単位昇格、全 checkout `persist-credentials: false` | PASS |
| `outputs/phase-5/runbook.md`（Phase 5 runbook） | 同方針を実装手順として再掲 | PASS |
| 本書 §4（Phase 9 quality-gate.md） | quality gate として三重明記が成立していることを確認 | PASS |

> AC-5 の三重明記要件は本表で成立を確認した。

## 5. G-1〜G-7 ゲート評価

| Gate | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| G-1 | AC-1〜AC-9 が全 PASS | PASS | 本書 §1、`outputs/phase-7/coverage.md` |
| G-2 | 失敗ケース FC-1〜FC-8 で MAJOR 0 件（許容 MINOR は FC-7 / FC-8 の運用補強のみ） | PASS | `outputs/phase-6/failure-cases.md` |
| G-3 | security 観点 S-1〜S-5 がレビュー記録に残る | PASS | `outputs/phase-3/review.md` §4 |
| G-4 | NO-GO 条件 N-1〜N-3 が解消 | PASS | `outputs/phase-3/review.md` §2、index.md 依存関係 |
| G-5 | canonical 4 用語の表記揺れゼロ | PASS | `outputs/phase-8/before-after.md` §1 |
| G-6 | 内部リンク切れゼロ（Phase 11 で再検証） | MINOR | Phase 11 で実走確認予定（手順は Phase 8 main.md §2.5 に定義） |
| G-7 | artifacts.json と本文 Phase status 一致 | PASS | `artifacts.json` |

> G-6 のみ Phase 11 実走依存のため MINOR 扱いとし、本タスクの quality gate 通過条件としては許容範囲内とする。

## 6. security 節

### 6.1 "pwn request" 非該当 5 箇条

本書 §2 を最終記録とする。

### 6.2 secrets 棚卸し

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| triage workflow が触る secrets | なし（`${{ secrets.* }}` 不参照） | Phase 5 runbook で `grep '\${{\s*secrets\.'` を実走する設計 |
| untrusted build workflow が触る secrets | なし | fork PR では GitHub が secrets を注入しない＋設計上も不参照 |
| 実走時の棚卸し記録欄 | 後続実装タスクが埋める | 本書 §8（実走必須 M-1〜M-3 再確認欄）参照 |

### 6.3 GITHUB_TOKEN scope の最小化

| workflow | デフォルト `permissions` | job 単位 | 判定 |
| --- | --- | --- | --- |
| triage workflow | `{}` | `pull-requests: write` のみ | PASS |
| untrusted build workflow | `{}` | `contents: read` のみ | PASS |

## 7. 通過条件 / 戻り先ルール

- 通過条件: G-1〜G-5 / G-7 が PASS、G-6 は Phase 11 で再検証する MINOR を許容
- MAJOR 検出時の戻り先:
  - AC-1 / AC-2 / AC-5 違反 → Phase 2 design.md
  - AC-4 / "pwn request" 5 箇条欠落 → Phase 3 review.md
  - AC-3（fork PR）違反 → Phase 4 test-matrix.md
  - AC-9（ロールバック）違反 → Phase 2 §5 / Phase 5 runbook
  - FC-x の MAJOR 残存 → Phase 6 failure-cases.md

## 8. 実走必須項目 M-1〜M-3 再確認欄（後続実装タスクが埋める）

| ID | 内容 | 確認方法 | 結果欄（実走時に記入） |
| --- | --- | --- | --- |
| M-1 | actionlint で `on.pull_request_target` workflow の checkout `ref` に `head.*` が含まれない | `actionlint -format ...` | _未記入_ |
| M-2 | yq で全 workflow の root `permissions: {}` と全 checkout `persist-credentials: false` を確認 | `yq` script（Phase 5 runbook 参照） | _未記入_ |
| M-3 | fork PR の GITHUB_TOKEN が untrusted build で read-only であることを実 PR で観測 | dry-run 実走 PR にて `${{ github.token }}` の scope ログを取得 | _未記入_ |

## 9. 結論

- **MAJOR: 0 件**、**MINOR: 1 件（G-6 / Phase 11 実走依存）**、**PASS: 多数**
- AC-1〜AC-9 の全てが設計証跡として PASS。本タスクの quality gate は通過とみなすが、実走 PASS は後続 UT-GOV-002-IMPL で取得する。
- Phase 10 最終レビューへ進行可能
