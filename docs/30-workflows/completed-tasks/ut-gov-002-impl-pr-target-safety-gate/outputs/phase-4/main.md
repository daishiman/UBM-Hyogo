# Phase 4 — テスト設計（main）

## Status

spec_created

> 本書は本タスク（UT-GOV-002-IMPL）の **dry-run 実走計画** を定義する。Phase 2 design.md / Phase 3 review.md を input として、`outputs/phase-4/test-matrix.md` を「実走するテスト」テンプレとして固定し、Phase 5 runbook と Phase 11 manual smoke の入口条件にする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 4 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| GitHub Issue | #204 |

## 0. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `outputs/phase-1/main.md` | 真の論点 (a)〜(d) / リスク R-1〜R-4 |
| `outputs/phase-2/design.md` §2〜§6 | 責務分離設計・実 workflow YAML 構造・required status checks 同期方針 |
| `outputs/phase-3/review.md` §3〜§5 | "pwn request" 非該当 5 箇条・S-1〜S-6・ロールバックレビュー |
| 上流 dry-run `phase-4/test-matrix.md` | T-1〜T-5 / D-1〜D-6 / F-1〜F-4 の母本（本タスクで F-5 を追加し実走前提に書き直す） |
| `index.md` AC-1〜AC-9 | 受入条件 |

## 1. 観点の固定（4 観点）

各 T-1〜T-5 で必ず以下 4 観点を検証する。検証列は `test-matrix.md` で各シナリオごとに展開する。

| ID | 観点 | 確認内容 |
| --- | --- | --- |
| (a) | `permissions:` の最終効果 | workflow デフォルトと job 単位の昇格が design.md §2.1 / §2.2 と一致 |
| (b) | `actions/checkout` の `ref` と `persist-credentials: false` | triage workflow は head 参照しない、build-test workflow は head.sha + persist-credentials:false |
| (c) | secrets / `GITHUB_TOKEN` の参照有無 | triage / build-test 双方で `${{ secrets.* }}` 不参照、token は最小権限のみ |
| (d) | `github.event.pull_request.head.* / .title / .body` が trusted job で eval されないこと | `run:` シェル展開禁止、必要なら `env:` 経由 |

## 2. T-1〜T-5 シナリオの位置づけ

| ID | シナリオ | trigger | 観点重視 |
| --- | --- | --- | --- |
| T-1 | same-repo PR build/test | `pull_request` | (a)(b)(c) |
| T-2 | fork PR build/test | `pull_request` | (b)(c) — secrets 注入されないこと |
| T-3 | labeled trigger（triage） | `pull_request_target.types: [labeled]` | (a)(b)(c)(d) — 全観点 |
| T-4 | workflow_dispatch audit | `workflow_dispatch` | (a)(c) — 手動 audit で permissions が固定 |
| T-5 | re-run（手動） | UI 上の re-run | (a) — required status checks 名同期 |

詳細マトリクスは `outputs/phase-4/test-matrix.md` を参照。

## 3. 静的検査と動的検査の関係

- **静的検査（Phase 5 Step 4 で実走）**: actionlint / yq×2 / grep×2 の 5 コマンド。実 workflow ファイル投入直後に実行し、F-1〜F-5 のいずれにも該当しないことを確認する。
- **動的検査（Phase 5 Step 5 で実走 → Phase 11 で VISUAL 取得）**: T-1〜T-5 を `gh` 経由で起動し、`gh run view <run-id> --log` を grep して secrets / token 露出を 0 件とする。

両者が PASS した時点で AC-3 / AC-4 / AC-7 を充足する。

## 4. 失敗判定 F-1〜F-5（MAJOR）

| ID | 失敗条件 | 対応 AC |
| --- | --- | --- |
| F-1 | `pull_request_target` workflow が PR head を checkout、または `head.* / title / body` を `run:` で直接展開 | AC-1 / AC-7 |
| F-2 | `actions/checkout` で `persist-credentials: false` が欠落 | AC-3 / AC-7 |
| F-3 | secrets が fork PR build へ渡る、または triage workflow で secrets 参照 | AC-3 / AC-4 |
| F-4 | workflow デフォルト `permissions:` が広範（`write-all` / `contents: write` 等） | AC-3 |
| F-5 | required status checks 名 drift（branch protection の `contexts` と新 job 名が不一致） | AC-5 / AC-6 |

> F-1〜F-5 のいずれかが 1 件以上検出された場合、Phase 9 quality-gate の MAJOR 0 件条件を満たさず NO-GO。

## 5. VISUAL evidence

T-1〜T-5 各 run について、GitHub Actions UI（run summary / job permissions 表示）と branch protection 画面（required status checks 一覧）のスクリーンショットを `outputs/phase-11/screenshots/` に Phase 11 正本の `<scenario>-<view>-<YYYY-MM-DD>.png` 命名で保存。詳細タイミングは `test-matrix.md` §6 を参照。

## 6. 次 Phase への引き継ぎ

- Phase 5 runbook は本書 §1〜§5 を Step 4（静的検査）/ Step 5（動的検査）/ Step 6（VISUAL 取得）/ Step 7（required status checks 同期）に配線する。
- Phase 9 quality-gate は F-1〜F-5 を 0 件確認し、§4 表を再走させる。
- Phase 11 manual smoke は T-1〜T-5 を `manual-smoke-log.md` に転記し、`screenshots/` を確定する。

## 7. 完了条件チェック

- [x] 4 観点 (a)〜(d) を §1 に明記
- [x] T-1〜T-5 の trigger / 観点重視マッピングを §2 に明記
- [x] 静的検査と動的検査の関係を §3 に明記
- [x] F-1〜F-5（MAJOR）を §4 に明記
- [x] VISUAL evidence 取得タイミング・命名規約を §5 に明記
- [x] `test-matrix.md` の存在とフォーマット仕様を §2 / §5 から参照
