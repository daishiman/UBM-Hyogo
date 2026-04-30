# Phase 10 — go-no-go（AC × 証跡 × 判定 + Go/No-Go 条件 + 後続委譲）

## Status

spec_created

> 本書は実 workflow 編集の **最終 Go/No-Go 判定**。spec_created 時点では「机上 Go（実走証跡を Phase 11 で取得後に再判定）」を確定する。

---

## 1. AC × 証跡 × 判定（AC-1〜AC-9）

| AC | 受入条件（要旨） | 裏付け証跡 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `pr-target-safety-gate.yml` が triage / metadata 専用、PR head の checkout / install / build なし | `.github/workflows/pr-target-safety-gate.yml`（46 行、`actions/checkout` 不存在）/ Phase 8 §2.1 / Phase 9 G-3(a) | **PASS** |
| AC-2 | untrusted build/test が `pr-build-test.yml` に分離、`contents: read` のみ | `.github/workflows/pr-build-test.yml` line 12 / 25 / Phase 8 §2.2 | **PASS** |
| AC-3 | 全 workflow `permissions: {}` ＋ job 単位最小昇格 ＋ `persist-credentials: false` | 両 workflow line 15 / 16 / `pr-build-test.yml` line 35 / Phase 9 G-2 | **PASS** |
| AC-4 | 4 系統 dry-run smoke + secrets / token 露出ゼロ目視 | `outputs/phase-11/manual-smoke-log.md`（Phase 11 で取得）/ Phase 9 G-4 | **机上 PASS / 実走待ち** |
| AC-5 | GitHub Actions UI ＋ branch protection screenshot で job 名同期確認 | `outputs/phase-11/screenshots/`（Phase 11 で取得）/ Phase 9 G-5 | **机上 PASS / 実走待ち** |
| AC-6 | 単一 `git revert` ロールバック + drift 検知コマンド併記 | Phase 5 runbook §ロールバック / Phase 8 §6 / 本書 §6 | **PASS** |
| AC-7 | "pwn request" 非該当 5 箇条が Phase 3 / 9 で重複明記 | Phase 3 review.md §3 / Phase 9 quality-gate.md §3 / §10.1 | **PASS** |
| AC-8 | secrets rotate / OIDC 化 / security 最終署名が本タスク非対象、別タスクに委譲明記 | Phase 1 main.md / 本書 §4 / Phase 12 unassigned-task-detection | **PASS** |
| AC-9 | implementation / VISUAL / infrastructure_governance + security 固定 + artifacts.json 一致 | Phase 1 main.md / `artifacts.json` metadata / index.md AC-9 | **PASS** |

| 集計 | 件数 |
| --- | --- |
| PASS（即時） | 7（AC-1, 2, 3, 6, 7, 8, 9） |
| 机上 PASS / 実走待ち | 2（AC-4, AC-5） |
| MAJOR | **0** |
| MINOR | 0（FC-7 は AC 違反ではなく運用ルール側で扱うため、AC 評価対象外） |

---

## 2. GO 条件

以下を **全て満たす** とき Go と判定する。

| ID | 条件 | 確認方法 |
| --- | --- | --- |
| GO-1 | 静的検査（actionlint / yq / grep）全 PASS | Phase 9 quality-gate.md §9（実走後） |
| GO-2 | T-1〜T-5 dry-run smoke 全 PASS（same-repo / fork / labeled / workflow_dispatch audit / re-run） | Phase 11 manual-smoke-log.md |
| GO-3 | VISUAL evidence（GitHub Actions UI / branch protection）が 7 枚以上揃う | `outputs/phase-11/screenshots/` |
| GO-4 | "pwn request" 非該当 5 箇条が Phase 3 / 9 で重複明記済み | Phase 9 §3 / §10.1 |
| GO-5 | ロールバック手順（単一 `git revert`）が Phase 5 / 10 で机上検証済み | runbook §ロールバック / 本書 §6 |
| GO-6 | required status checks の job 名同期が `gh api` 出力で確認済み | Phase 9 G-6 / 本書 §6 |
| GO-7 | MAJOR 0 件 / AC 9/9 PASS | 本書 §1 |

---

## 3. NO-GO 条件

以下のいずれかが該当した時点で No-Go。Phase 9 §12 の戻り先に従って差し戻し。

| ID | 条件 | 戻り先 |
| --- | --- | --- |
| NO-1 | PR head の checkout / install / build が `pull_request_target` 側に残存 | Phase 5 / 8（FC-1） |
| NO-2 | `persist-credentials: false` 未指定の `actions/checkout` がある | Phase 5 / 8（FC-3） |
| NO-3 | `workflow_run` 経由で secrets が fork PR build に橋渡しされる経路出現 | Phase 5（FC-5） |
| NO-4 | required status checks の job 名 drift（branch protection と実 workflow 不一致） | Phase 5 Step 7 / UT-GOV-001（FC-8） |
| NO-5 | fork PR の dry-run run logs に secrets / token 露出兆候 | Phase 5 / 8（FC-2 / FC-6）+ secrets rotate 別タスク |
| NO-6 | 静的検査 / T-1〜T-5 smoke / VISUAL evidence のいずれかが揃わない | Phase 5 / 11 |
| NO-7 | "pwn request" 非該当 5 箇条のいずれかが欠落 | Phase 3 / 9 |

---

## 4. 後続委譲（本タスク非対象）

本タスクのスコープから **明示的に外す**項目と委譲先タスクの起票条件:

| 項目 | 委譲先タスク | 起票条件 | 引き継ぎ事項 |
| --- | --- | --- | --- |
| OIDC 化（`id-token: write` 化評価） | **UT-GOV-002-EVAL** | 本実装 merge 後の任意タイミング | 現 `permissions:` 表（Phase 9 §10.3）/ secrets allowlist（§10.4） |
| security review 最終署名 | **UT-GOV-002-SEC** | 本実装 merge ＋ Phase 11 manual smoke 完了後 | 5 箇条担保証跡 / FC-1〜FC-8 / quality-gate.md |
| secrets inventory automation | **UT-GOV-002-OBS** | 本実装 merge 後、観測対象 workflow の固定後 | secrets allowlist / GITHUB_TOKEN scope 表 |
| secrets rotate（`CLOUDFLARE_API_TOKEN` / `OP_SERVICE_ACCOUNT_TOKEN` / その他） | secrets rotate 別タスク（任意命名） | 本実装 merge 後の任意タイミング、または NO-5 観測時即時 | rotate 対象 secret 一覧 / `gh run view --log` 検査結果 |

> 上記委譲先の起票は Phase 12 `unassigned-task-detection.md` に転記する。本 Phase は記録の確定が責務。

---

## 5. ステークホルダー提示物（5 種）

solo 運用のため必須レビュアー数は 0 だが、後続評価タスクへ提示すべき成果物を以下 5 種類で固定する。

| # | 提示物 | パス | 提示先（後続タスク） |
| --- | --- | --- | --- |
| (a) | quality-gate 評価 | `outputs/phase-9/quality-gate.md` | UT-GOV-002-SEC |
| (b) | 手動 smoke ログ | `outputs/phase-11/manual-smoke-log.md` | UT-GOV-002-SEC / UT-GOV-002-OBS |
| (c) | VISUAL evidence | `outputs/phase-11/screenshots/`（7 枚以上） | UT-GOV-002-SEC |
| (d) | リファクタ before/after | `outputs/phase-8/before-after.md` | UT-GOV-002-EVAL |
| (e) | 実 workflow 最終 diff | `.github/workflows/pr-target-safety-gate.yml` / `.github/workflows/pr-build-test.yml` の最終内容 | UT-GOV-002-EVAL / UT-GOV-002-SEC |

> 提示先ロール（platform / devops / security の 3 ロール）は実体上は本人だが、後続タスク UT-GOV-002-EVAL/SEC/OBS の起動条件として記録する。

---

## 6. ロールバック設計の最終確認

### 6.1 単一 `git revert` 粒度

| コミット | revert コマンド | 効果 |
| --- | --- | --- |
| (1) safety gate 適用 | `git revert <sha-1>` | 両 workflow ファイルが削除され、safety gate 導入前へ戻る |
| (2) 不要 step 除去 | `git revert <sha-2>` | 旧 step 復活（spec_created 時点では空コミット相当） |
| (3) required status checks 名同期 | `git revert <sha-3>` | branch protection contexts のみ旧名へ戻る |

### 6.2 drift 検知コマンド（再記録）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
```

期待: `["triage", "build-test", ...（既存 contexts）]` が両 branch で一致。drift 観測時は UT-GOV-001 の branch protection JSON 更新 PR を本タスクのロールバック PR と同期適用。

### 6.3 ロールバック判断トリガ（再記録）

- fork PR で `GITHUB_TOKEN` / secrets 露出が観測（FC-2 / FC-6）
- triage job が untrusted code を評価したインシデント（FC-1）
- required status checks 名 drift で dev / main がブロック（FC-8）

---

## 7. レビュアー指定方針（solo 運用再確認）

| 項目 | 値 |
| --- | --- |
| 必須レビュアー数 | **0**（CLAUDE.md solo 運用ポリシー / `required_pull_request_reviews=null`） |
| 品質保証 | CI gate（`required_status_checks`）/ 線形履歴（`required_linear_history`）/ 会話解決必須（`required_conversation_resolution`）/ force-push & 削除禁止 |
| 自己レビュー | 本書 + Phase 9 quality-gate.md + Phase 11 manual-smoke-log.md でセルフ最終承認 |
| Issue #204 | CLOSED のまま扱う（再オープンしない / Decision Log 既定） |

---

## 8. 最終 Go/No-Go 判定

| 項目 | 値 |
| --- | --- |
| spec_created 時点の机上判定 | **GO（机上）** |
| 実走前提 | Phase 11 で M-1〜M-3 を実走し、`outputs/phase-11/manual-smoke-log.md` + `screenshots/`（7 枚以上）を取得 |
| 実走後の最終判定タイミング | Phase 13 完了確認で再判定（静的検査ログ + 実走証跡を `outputs/phase-9/quality-gate.md` §9 に貼付け後） |
| 現時点での総合状態 | **`spec_created → 実走証跡を Phase 11 で取得後に再判定`** |
| MAJOR 件数 | **0** |
| AC PASS | **9/9（うち AC-4 / AC-5 は机上 PASS / 実走待ち）** |
| NO-GO 条件該当 | **0 件** |

### 判定ロジック

- 机上判定で `MAJOR 0 件 ∧ AC 9/9 PASS（机上）∧ NO-GO 条件 0 件` を満たす → **机上 GO**。
- Phase 11 で `MAJOR 0 件 ∧ T-1〜T-5 smoke PASS ∧ VISUAL evidence ≥ 7 枚 ∧ secrets 露出 0` が確認できれば → **最終 GO**（Phase 13 ユーザー承認に進む）。
- 1 つでも欠ければ Phase 9 §12 の戻り先ルールに従い差し戻し。

---

## 9. 次 Phase への引き継ぎ

- Phase 11 manual smoke は本書 §2 GO 条件 GO-1〜GO-7 と Phase 7 §5 M-1〜M-3 を実走し、本書 §1 表の AC-4 / AC-5 を **PASS（実走済み）** に更新する。
- Phase 12 documentation-changelog / unassigned-task-detection は本書 §4 後続委譲先 4 件 / §5 ステークホルダー提示物 5 種を起点に整理する。
- Phase 13 完了確認は本書 §8 最終 Go/No-Go 判定を **GO（実走確定）** に更新し、ユーザー承認後に commit / push / PR 作成へ進む。
