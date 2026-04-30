# Phase 7 — coverage（3 マトリクス + AC 9/9 = 100% 宣言）

## Status

spec_created

> 観点 coverage は AC 9/9 = 100% を本書で宣言する。実走 coverage は Phase 11 manual-smoke-log.md と screenshots/ で 100% を確定させる。

---

## 1. シナリオ × 失敗ケース クロス表

縦軸: T-1〜T-5（Phase 4 §2）／ 横軸: FC-1〜FC-8（Phase 6 §1）

| | FC-1 | FC-2 | FC-3 | FC-4 | FC-5 | FC-6 | FC-7 | FC-8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-1 same-repo PR | | | ✓ | ✓ | | ✓ | | ✓ |
| T-2 fork PR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ |
| T-3 labeled trigger | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| T-4 workflow_dispatch audit | ✓ | | ✓ | ✓ | ✓ | | | ✓ |
| T-5 re-run | | | ✓ | ✓ | | | | ✓ |

### FC ごとのカバレッジ（少なくとも 1 シナリオ）

| FC | カバーするシナリオ | 備考 |
| --- | --- | --- |
| FC-1 | T-2, T-3 | trusted context での head checkout 検出は fork PR / labeled trigger で観測 |
| FC-2 | T-2, T-3, T-4 | triage / workflow_dispatch audit で `secrets.*` の参照が紛れ込む経路を網羅 |
| FC-3 | T-1, T-2, T-3, T-4, T-5 | 全シナリオで `persist-credentials: false` の不変条件を強制 |
| FC-4 | T-1, T-2, T-3, T-4, T-5 | `permissions: {}` ＋ job 単位最小昇格を全シナリオで点検 |
| FC-5 | T-2, T-4 | `workflow_run` 経由 secrets 橋渡しは fork PR / workflow_dispatch audit で観測 |
| FC-6 | T-1, T-2 | `pull_request` build/test workflow への secrets 流入は same-repo / fork PR で点検 |
| FC-7 | T-3 | labeled trigger の権限境界違反は labeled シナリオでのみ観測（運用ルール側） |
| FC-8 | T-1, T-2, T-3, T-4, T-5 | required status checks 名 drift は全シナリオで PR UI / branch protection 出力経由で観測 |

> 全 FC が **少なくとも 1 シナリオ** で覆われており、カバレッジ穴ゼロ。

---

## 2. 検証コマンド × FC カバレッジ表

Phase 5 runbook Step 4〜7 で実走するコマンド群と、各コマンドが担当する FC の対応。

| コマンド | 担当する FC | 実行 Phase |
| --- | --- | --- |
| `actionlint .github/workflows/*.yml` | FC-1, FC-3, FC-4 | Phase 5 Step 4 / Phase 9 G-2 |
| `yq '.permissions' .github/workflows/*.yml` | FC-4 | Phase 5 Step 4 / Phase 9 G-2 |
| `yq '.jobs[].steps[] \| select(.uses \| test("actions/checkout")) \| .with."persist-credentials"'` | FC-3 | Phase 5 Step 4 |
| `grep -RnE 'persist-credentials:\s*false' .github/workflows/` | FC-3 | Phase 5 Step 4 |
| `grep -RnE 'github\.event\.pull_request\.head\.(ref\|sha)' .github/workflows/` | FC-1 | Phase 5 Step 4 / Phase 9 G-3(a) |
| `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml` | FC-2 | Phase 5 Step 4 / Phase 9 G-3 / G-4 |
| `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-build-test.yml` | FC-6 | Phase 5 Step 4 / Phase 9 G-4 |
| `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` | FC-5 | Phase 5 Step 4 / Phase 9 G-3(b) |
| `gh run view <run-id> --log \| grep -iE 'secret\|GITHUB_TOKEN\|aws_\|cloudflare_api_token\|op://'` | FC-2, FC-3, FC-6（動的検証） | Phase 5 Step 5 / Phase 11 D-3 |
| `gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection --jq '.required_status_checks.contexts'` | FC-8 | Phase 5 Step 7 / Phase 9 G-6 |
| repository settings 確認（label 付与権限）／ CODEOWNERS 監査 | FC-7 | 運用ルール（Phase 11 reviewer） |

### FC ごとの検証手段カバレッジ

| FC | 静的コマンド | 動的検証 | 運用ルール |
| --- | --- | --- | --- |
| FC-1 | actionlint, grep `head.(ref\|sha)`, yq | gh run log | PR diff |
| FC-2 | grep `secrets\.` (triage) | gh run log | reviewer |
| FC-3 | grep `persist-credentials: false`, yq | gh run log | reviewer |
| FC-4 | yq `.permissions`, actionlint | gh run summary | reviewer |
| FC-5 | grep `workflow_run` | gh workflow list | PR diff |
| FC-6 | grep `secrets\.` (build-test) | gh run log | reviewer |
| FC-7 | （静的検知不可） | T-3 fork user label 試行 | repository settings / CODEOWNERS |
| FC-8 | gh api branches/protection | gh pr checks / PR UI | UT-GOV-004 連携 |

> 全 8 FC が **少なくとも 1 つのコマンド or 運用確認** でカバーされている（FC-7 のみ静的不可で運用ルール + 動的の 2 種、他は 3 種以上）。

---

## 3. VISUAL evidence × AC カバレッジ表

Phase 4 §6 の命名規約に従い、VISUAL evidence が AC を網羅することを確認する。

| VISUAL evidence | カバーする AC | 取得タイミング | 保存先 |
| --- | --- | --- | --- |
| GitHub Actions UI（run summary + job permissions） | AC-1, AC-2, AC-3, AC-4 | T-1〜T-5 各 run 完了直後 | `outputs/phase-11/screenshots/<scenario>-actions-ui-<YYYY-MM-DD>.png` |
| branch protection 画面（required status checks 一覧） | AC-5, AC-6 | T-5 完了時 / Step 7 同期確認時 | `outputs/phase-11/screenshots/branch-protection-{main,dev}-required-checks-<YYYY-MM-DD>.png` |
| 各 workflow run の checkout step ログ（base.sha or head.sha 表示） | AC-4（fork PR で secrets / token 露出ゼロ目視） | T-2 / T-3 run 内部 | screenshots に T-2 actions の checkout 詳細展開を含める |
| `gh api .../branches/{main,dev}/protection` のテキスト出力 | AC-5, AC-6 | Phase 5 Step 7 実行時 | `outputs/phase-5/static-check-log.md` のテキスト埋め込み |
| `pull_request_target` workflow に `actions/checkout` が無いことの diff 画面 | AC-1, AC-7 | Phase 8 before-after 確定時 | `outputs/phase-8/before-after.md`（Markdown 表）＋ PR review UI スクショ任意 |

### AC ごとの VISUAL カバレッジ

| AC | VISUAL evidence | コメント |
| --- | --- | --- |
| AC-1 | UI run summary（triage workflow に checkout が無いこと） | `pr-target-safety-gate.yml` には `actions/checkout` が物理的に存在しない（ファイル目視 + 静的 grep）。UI 上は steps に "Identify PR metadata" / "Triage placeholder" のみが並ぶことで担保 |
| AC-2 | UI run summary（build-test の permissions: contents: read） | T-1 / T-2 actions スクショで Job permissions を展開 |
| AC-3 | UI permissions + 静的検査ログ | T-1〜T-5 actions スクショ + static-check-log.md |
| AC-4 | T-1〜T-5 actions スクショ + `gh run view --log` テキスト | fork PR T-2 で secrets/token 露出ゼロを目視 |
| AC-5 | branch protection スクショ + `gh api` 出力 | main / dev 各 1 枚 |
| AC-6 | runbook 内 `git revert` 手順の机上検証 + drift 検知コマンド出力 | スクショは drift 確認時のみ任意 |
| AC-7 | review.md 5 箇条 + Phase 9 quality-gate 表 | 文書証跡 |
| AC-8 | 後続委譲先タスクへの link（Phase 10 go-no-go） | 文書証跡 |
| AC-9 | artifacts.json と Phase 1 main.md の固定値 diff | 文書証跡 |

> 計 **7 枚以上**のスクリーンショットを `outputs/phase-11/screenshots/` に保存することを Phase 7 で確約する（T-1〜T-5 各 actions = 5 枚 + main / dev branch protection 各 1 枚 = 計 7 枚以上）。

---

## 4. カバレッジ穴の追補方針

カバレッジ穴が新規発生した場合の追補先を 3 経路で固定する。

| 穴の種類 | 追補先 | 手順 |
| --- | --- | --- |
| シナリオ穴（FC が T-1〜T-5 でカバーされない） | `outputs/phase-4/test-matrix.md` | 追補テスト T-6 以降を追加し、本書 §1 表を更新 |
| 失敗ケース穴（既存 FC で表現できない新規症状） | `outputs/phase-6/failure-cases.md` | 新 FC（FC-9 以降）を追加し、Severity / 検出 / 是正を埋める |
| 運用穴（静的・動的・レビューいずれでも検知不能） | `outputs/phase-12/unassigned-task-detection.md` | 未カバー項目として起票し、別タスク（観測自動化 / 運用ルール改定）に委譲 |

> いずれの追補も本タスク Phase 9 quality-gate G-1 / G-2 / G-3 の評価対象に含める。

---

## 5. 最低限実走必須項目（M-1〜M-3）

Phase 11 manual smoke で **必ず実走** する 3 項目。これらが不通過なら Phase 13 ユーザー承認に進まない。

| ID | 内容 | 担当 FC / AC | 証跡 |
| --- | --- | --- | --- |
| **M-1** | same-repo PR の dry-run（T-1）+ GitHub Actions UI スクショ取得 | FC-3, FC-4, FC-6, FC-8 / AC-2, AC-3, AC-4 | `outputs/phase-11/screenshots/same-repo-pr-actions-ui-<YYYY-MM-DD>.png` ＋ manual-smoke-log.md#T-1 |
| **M-2** | fork PR の dry-run（T-2）+ `gh run view --log` の grep（secrets / token / op:// 検出 0 件） | FC-1, FC-2, FC-3, FC-4, FC-5, FC-6 / AC-1, AC-3, AC-4 | `outputs/phase-11/screenshots/fork-pr-actions-ui-<YYYY-MM-DD>.png` ＋ manual-smoke-log.md#T-2 |
| **M-3** | branch protection の required status checks 名同期確認 + スクショ取得 | FC-8 / AC-5, AC-6 | `outputs/phase-11/screenshots/branch-protection-{main,dev}-required-checks-<YYYY-MM-DD>.png` ＋ static-check-log.md の `gh api` 出力 |

> T-3 / T-4 / T-5 は M-1〜M-3 で覆える観点を補強する位置付け。fork repo を使う M-2 は実走コスト最大だが、AC-4（secrets 露出ゼロ目視）の唯一の根拠源のため省略不可。

---

## 6. 観点 coverage AC 9/9 = 100% 宣言

| AC | カバー要素 | 判定 |
| --- | --- | --- |
| AC-1 | `pr-target-safety-gate.yml` に checkout 不存在（FC-1）/ シナリオ T-2, T-3 / VISUAL UI | **100%** |
| AC-2 | build-test workflow の `contents: read` のみ（FC-4）/ シナリオ T-1, T-2 / VISUAL UI | **100%** |
| AC-3 | `permissions: {}` + `persist-credentials: false`（FC-3, FC-4）/ 全シナリオ / VISUAL UI + 静的ログ | **100%** |
| AC-4 | 4 系統 dry-run（T-1〜T-5）+ secrets / token 露出ゼロ（FC-2, FC-6）/ M-2 必須 | **100%** |
| AC-5 | branch protection スクショ + gh api 出力（FC-8）/ M-3 必須 | **100%** |
| AC-6 | 単一 `git revert` + drift 検知コマンド（runbook §ロールバック / FC-8）| **100%** |
| AC-7 | 5 箇条（review.md §3）+ Phase 9 quality-gate G-3 で再点検 | **100%** |
| AC-8 | 後続委譲（UT-GOV-002-EVAL/SEC/OBS）が Phase 1 / 10 / 12 で明記 | **100%** |
| AC-9 | implementation / VISUAL / infrastructure_governance + security が artifacts.json と一致 | **100%** |

**観点 coverage: AC 9/9 = 100%** を本書で宣言する。

実走 coverage は **Phase 11 manual smoke** で M-1〜M-3 を実行し、`outputs/phase-11/manual-smoke-log.md` および `screenshots/` で 100% を確定させる。

---

## 7. 次 Phase への引き継ぎ

- Phase 8 リファクタリングは本書のカバレッジ穴ゼロ宣言を前提として、振る舞いを変えない構造整理 / 命名統一 / コミット分割計画に専念する。
- Phase 9 quality-gate は本書 §1〜§3 を G-1（AC 9/9 PASS）の根拠として参照する。
- Phase 11 manual smoke は §5 M-1〜M-3 を必須実走項目として参照する。
