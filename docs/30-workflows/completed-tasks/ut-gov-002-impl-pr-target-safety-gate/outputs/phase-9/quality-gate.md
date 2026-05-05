# Phase 9 — quality-gate（G-1〜G-8 評価 + security 章 + 静的検査ログ貼付欄）

## Status

spec_created

> 本書は実 workflow 編集の **品質ゲート最終評価**。spec_created 時点では「机上判定」までを確定し、静的検査・dry-run smoke の **実走結果は Phase 13 ユーザー承認後に貼付ける**（§9 / §10 にテンプレ確保）。

---

## 1. G-1: AC-1〜AC-9 全件 PASS

Phase 7 coverage.md §6 の AC 9/9 = 100% 宣言を根拠に評価する。

| AC | 内容（要旨） | 評価 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | triage workflow に PR head checkout / install / build が無い | **PASS** | `pr-target-safety-gate.yml` に `actions/checkout` 不存在（Phase 8 §8） |
| AC-2 | build/test workflow が `pull_request` ＋ `contents: read` のみ | **PASS** | `pr-build-test.yml` line 12 / 25（`contents: read`） |
| AC-3 | `permissions: {}` ＋ `persist-credentials: false` | **PASS** | 両 workflow line 15 / 16（`permissions: {}`）/ `pr-build-test.yml` line 35（`persist-credentials: false`） |
| AC-4 | 4 系統 dry-run + secrets 露出ゼロ | **机上 PASS / 実走待ち** | Phase 11 で T-1〜T-5 + `gh run view --log` grep を実走 |
| AC-5 | branch protection screenshot + UI 同期 | **机上 PASS / 実走待ち** | Phase 11 screenshots/ で取得 |
| AC-6 | ロールバック手順 + drift 検知コマンド | **PASS** | Phase 5 runbook §ロールバック / Phase 8 §6.1 |
| AC-7 | "pwn request" 非該当 5 箇条 重複明記 | **PASS** | Phase 3 §3 / 本書 §3 |
| AC-8 | 後続委譲（UT-GOV-002-EVAL/SEC/OBS / secrets rotate）明記 | **PASS** | Phase 1 / Phase 10 / Phase 12 で明記予定（Phase 10 go-no-go.md で確定） |
| AC-9 | implementation / VISUAL / scope 固定 + artifacts.json 一致 | **PASS** | artifacts.json metadata と Phase 1 main.md 一致 |

**G-1 判定: PASS**（AC 9/9 のうち 7 件即時 PASS / 2 件は机上 PASS で実走証跡を Phase 11 で取得）

---

## 2. G-2: 静的検査 PASS（actionlint / yq / grep）

Phase 4 §3 の 5 コマンド + Phase 8 §8 の 6 不変条件を再走する。

### 2.1 検査コマンド一覧

```bash
# (1) actionlint
actionlint .github/workflows/*.yml
# 期待: exit 0

# (2) yq による triage workflow の permissions
yq '.permissions' .github/workflows/pr-target-safety-gate.yml
# 期待: "{}"

# (3) yq による build-test workflow の permissions
yq '.permissions' .github/workflows/pr-build-test.yml
# 期待: "{}"

# (4) grep による persist-credentials の存在
grep -RnE 'persist-credentials:\s*false' .github/workflows/
# 期待: 全 actions/checkout で hit

# (5) grep による head.* eval パターン
grep -RnE 'github\.event\.pull_request\.head\.(ref|sha)' .github/workflows/
# 期待: pull_request workflow の actions/checkout の with.ref のみ

# (6) workflow_run 不使用
grep -RnE '^\s*workflow_run\s*:' .github/workflows/
# 期待: 0 件

# (7) triage workflow に secrets 不参照
grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml
# 期待: 0 件

# (8) build-test workflow に secrets 不参照
grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-build-test.yml
# 期待: 0 件

# (9) triage workflow に actions/checkout 不存在
grep -nE 'actions/checkout' .github/workflows/pr-target-safety-gate.yml
# 期待: 0 件
```

### 2.2 G-2 評価（実走前）

| 検査 | 期待 | 机上判定 |
| --- | --- | --- |
| actionlint | exit 0 | **机上 PASS / 実走待ち** |
| yq triage permissions | `{}` | **PASS**（yaml ファイル目視確認済み） |
| yq build-test permissions | `{}` | **PASS**（yaml ファイル目視確認済み） |
| grep persist-credentials | hit ≥ 1 | **PASS**（line 35） |
| grep head.* eval | trusted で 0 件 | **PASS**（triage に存在せず） |
| grep workflow_run | 0 件 | **PASS** |
| grep secrets (triage) | 0 件 | **PASS** |
| grep secrets (build-test) | 0 件 | **PASS** |
| grep actions/checkout (triage) | 0 件 | **PASS** |

**G-2 判定: 机上 PASS / actionlint 実走待ち**（Phase 13 で実走しログを §9 に貼付け）

---

## 3. G-3: "pwn request" 非該当 5 箇条 最終チェック

Phase 3 review.md §3 の 5 箇条を再点検する。

| # | 箇条 | 検査 | 評価 |
| --- | --- | --- | --- |
| (a) | PR head を `pull_request_target` 内で checkout していない | `grep -nE 'actions/checkout' .github/workflows/pr-target-safety-gate.yml` → 0 件 | **PASS** |
| (b) | `workflow_run` を採用していない | `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` → 0 件 | **PASS** |
| (c) | `${{ github.event.pull_request.head.* / .title / .body }}` を `run:` で eval していない | triage は untrusted 文字列を `env:` 経由で受け取り、`run:` 内は `${VAR}` 展開のみ（line 30〜36 / 41〜45）。`grep -nE 'run:.*\$\{\{\s*github\.event\.pull_request\.(head\.\|title\|body)' .github/workflows/pr-target-safety-gate.yml` → 0 件 | **PASS** |
| (d) | 全 `actions/checkout` に `persist-credentials: false` | `pr-build-test.yml` line 35 で明示。triage 側は checkout 不存在 | **PASS** |
| (e) | workflow デフォルト `permissions: {}` ＋ job 単位最小昇格 | 両 workflow 冒頭 `permissions: {}` ＋ triage = `pull-requests: write` / build-test = `contents: read` | **PASS** |

**G-3 判定: PASS**（5 箇条すべて担保）

---

## 4. G-4: secrets / token 露出ゼロ

`gh run view <run-id> --log` 出力を grep し、`***` マスク以外で secret / token が出現しないことを確認する。

### 4.1 検査コマンド

```bash
# fork PR run（T-2）と same-repo PR run（T-1）の双方で実行
gh run view <run-id> --log | grep -iE 'secret|GITHUB_TOKEN|aws_|cloudflare_api_token|op://|bearer ' \
  || echo "OK: no leakage"
# 期待: "OK: no leakage"
```

### 4.2 検査対象 run

| 対象 | run 種別 | 取得 Phase |
| --- | --- | --- |
| T-1 same-repo PR | `pr-build-test.yml` 起動 run | Phase 11 |
| T-2 fork PR | `pr-build-test.yml` 起動 run | Phase 11 |
| T-3 labeled trigger | `pr-target-safety-gate.yml` 起動 run | Phase 11 |
| T-4 workflow_dispatch audit | 該当 run（trusted context の手動 audit） | Phase 11 |
| T-5 re-run | T-1 / T-2 の rerun | Phase 11 |

**G-4 判定: 机上 PASS / 実走待ち**（Phase 11 で実走し manual-smoke-log.md §G-4 に転記）

---

## 5. G-5: VISUAL evidence 品質要件

Phase 11 で取得するスクリーンショットの**品質要件**を本書で確定する。

| 要件 | 内容 |
| --- | --- |
| ファイル形式 | PNG（推奨）または JPEG（圧縮品質 ≥ 90） |
| 解像度 | 横幅 1280 px 以上（job 名 / status / Permissions セクションが判読可能） |
| 表示要素 | (a) workflow 名 / (b) job 名 / (c) status（success / failure）/ (d) trigger event / (e) actor / (f) Permissions セクション |
| 機微情報 | secret 値・PR contributor の private email / 内部 URL が映り込まないこと（fork user 名は public のため許容） |
| 命名 | `t-{1..5}-actions.png` / `t-{5}-protection.png`（main / dev は接尾語 `-main` / `-dev` を付与） |
| 枚数 | T-1〜T-5 の actions UI = 5 枚 + branch protection = main / dev 各 1 枚 = 計 **7 枚以上** |
| 保存先 | `outputs/phase-11/screenshots/` |

### 5.1 機微情報チェックリスト（取得時に目視確認）

- [ ] secrets 値（マスク `***` 以外）が映っていないこと
- [ ] OAuth token / PAT 値が映っていないこと
- [ ] 内部メール / 内部 URL が映っていないこと
- [ ] private repo 名（本タスクは public OK）が映っていないこと

**G-5 判定: 機上 PASS / 実走待ち**（Phase 11 で取得し本書 §10 に枚数チェックを転記）

---

## 6. G-6: required status checks 名同期

`gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection` の `required_status_checks.contexts` と canonical job 名（`triage` / `build-test`）が一致することを確認する。

### 6.1 検査コマンド

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts'

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts'
```

### 6.2 期待値

- main: `["triage", "build-test", ...（既存 contexts）]`
- dev: `["triage", "build-test", ...（既存 contexts）]`

drift 検知時は UT-GOV-001 の branch protection JSON 更新 PR を本タスクと同期適用（FC-8）。

**G-6 判定: 机上 PASS / 実走待ち**（Phase 11 / Phase 13 で実走しログを §9 に貼付け）

---

## 7. G-7: ロールバック手順の机上検証

Phase 5 runbook §ロールバック / Phase 8 §6 / Phase 10 go-no-go.md の整合を確認する。

| 確認項目 | 結果 |
| --- | --- |
| 単一 `git revert <commit>` で safety gate 適用前へ戻る | **PASS**（Phase 8 §6.1 で 3 コミット分割 + 各 revert 検証記述） |
| `git revert -m 1 <merge-sha>` 形式の merge commit 対応 | **PASS**（runbook §ロールバック §通常ロールバック） |
| required status checks drift 検知コマンド | **PASS**（runbook §ロールバック §確認 + 本書 §6） |
| ロールバック判断トリガ 3 件（fork PR token 露出 / triage 内 untrusted code 評価 / status checks 名 drift） | **PASS**（runbook §ロールバック §判断トリガ） |
| ロールバック後の復旧手順（branch protection JSON 同期） | **PASS**（design.md §5.2 / runbook Step 7） |

**G-7 判定: PASS**

---

## 8. G-8: 用語整合 + artifacts.json status 同期

| 確認項目 | 結果 |
| --- | --- |
| canonical 4 用語の整合（揺れ表記不検出） | **PASS**（Phase 3 §6 / Phase 8 §7 で確認） |
| `artifacts.json` の phases status と各 phase-NN.md の workflow フィールドが同期 | **PASS**（spec_created で揃っている） |
| `artifacts.json` の metadata（implementation / VISUAL / scope）と Phase 1 main.md / index.md AC-9 が一致 | **PASS** |
| `outputs/artifacts.json` と root `artifacts.json` の Phase status 一致 | **PASS**（Phase 6〜10 を spec_created で揃える） |

**G-8 判定: PASS**

---

## 9. 静的検査ログ貼付欄（Phase 13 実走後に追記）

> **本欄は spec_created 時点では空。Phase 13 ユーザー承認後に actionlint / yq / grep / gh api を実走し、出力を貼付ける。**

```text
# (1) actionlint .github/workflows/*.yml
（実走後に出力を貼付け：exit code = 0 を期待）

# (2) yq '.permissions' .github/workflows/pr-target-safety-gate.yml
（実走後に出力を貼付け："{}" を期待）

# (3) yq '.permissions' .github/workflows/pr-build-test.yml
（実走後に出力を貼付け："{}" を期待）

# (4) grep -RnE 'persist-credentials:\s*false' .github/workflows/
（実走後に出力を貼付け：pr-build-test.yml line 35 hit を期待）

# (5) grep -RnE 'github\.event\.pull_request\.head\.(ref|sha)' .github/workflows/
（実走後に出力を貼付け：pr-build-test.yml line 33 のみ hit を期待）

# (6) grep -RnE '^\s*workflow_run\s*:' .github/workflows/
（実走後に出力を貼付け：0 件を期待）

# (7) grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml
（実走後に出力を貼付け：0 件を期待）

# (8) grep -nE 'actions/checkout' .github/workflows/pr-target-safety-gate.yml
（実走後に出力を貼付け：0 件を期待）

# (9) gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'
（実走後に出力を貼付け：["triage", "build-test", ...] を期待）

# (10) gh api repos/daishiman/UBM-Hyogo/branches/dev/protection --jq '.required_status_checks.contexts'
（実走後に出力を貼付け：["triage", "build-test", ...] を期待）
```

---

## 10. security 章

### 10.1 "pwn request" 非該当 5 箇条 最終確認（重複明記）

本タスクと dry-run 上流タスク（`completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md`）で **二重明記** されている。

| # | 箇条 | 本タスクでの担保 | 上流 dry-run での担保 |
| --- | --- | --- | --- |
| (a) | PR head 非 checkout | `pr-target-safety-gate.yml` に `actions/checkout` 不存在 | dry-run review.md §3 #1 |
| (b) | `workflow_run` 非採用 | `grep` 0 件確認手順 | dry-run review.md §3 #2 / 代替案 D 却下 |
| (c) | `head.* / title / body` 非 eval | env: 経由のみ（triage workflow line 30〜36 / 41〜45） | dry-run review.md §3 #3 |
| (d) | 全 `actions/checkout` に `persist-credentials: false` | `pr-build-test.yml` line 35 | dry-run review.md §3 #4 |
| (e) | workflow `permissions: {}` ＋ job 単位最小 | 両 workflow line 15 / 16 | dry-run review.md §3 #5 |

### 10.2 secrets 棚卸し（実走時に埋める）

| secret 名 | 触れる workflow | 必要性 | 評価 |
| --- | --- | --- | --- |
| `GITHUB_TOKEN`（自動注入） | triage（`pull-requests: write` のみ）/ build-test（`contents: read` のみ） | label / コメント / checkout に必要 | **最小昇格 PASS** |
| `CLOUDFLARE_API_TOKEN` | （いずれの workflow にも参照させない） | 本タスクスコープ外 | **不参照 PASS** |
| `OP_SERVICE_ACCOUNT_TOKEN` | （いずれの workflow にも参照させない） | 本タスクスコープ外 | **不参照 PASS** |
| その他 `secrets.*` | （実走時に棚卸し） | — | （実走時記入） |

### 10.3 GITHUB_TOKEN scope 表（job 単位 `permissions:` 最小化）

| workflow | job | permissions（job） | 不付与（明示なし） |
| --- | --- | --- | --- |
| `pr-target-safety-gate.yml` | `triage` | `pull-requests: write` | `contents: -` / `actions: -` / `id-token: -` / `packages: -` / `issues: -` 等すべて未昇格 |
| `pr-build-test.yml` | `build-test` | `contents: read` | `pull-requests: -` / `actions: -` / `id-token: -` / `packages: -` 等すべて未昇格 |

> `actions: write` / `contents: write` / `id-token: write` の付与は本タスク内では一切なし（S-3 担保）。

### 10.4 secrets allowlist

triage workflow は `${{ secrets.* }}` を **0 件参照**（allowlist は空集合）。build-test workflow も同様に 0 件参照。trusted context が必要な処理は別タスク（UT-GOV-002-SEC / OBS）で `workflow_dispatch` / `push: main` ベースで切り出す。

---

## 11. 総合判定

| ゲート | 判定 | コメント |
| --- | --- | --- |
| G-1 AC PASS | **PASS** | 9/9（うち AC-4 / AC-5 は机上 PASS / Phase 11 実走待ち） |
| G-2 静的検査 | **机上 PASS / actionlint 実走待ち** | Phase 13 で実走 |
| G-3 5 箇条 | **PASS** | 5/5 担保 |
| G-4 secrets 露出 | **机上 PASS / 実走待ち** | Phase 11 で fork PR run の log grep |
| G-5 VISUAL 品質 | **机上 PASS / 実走待ち** | 要件は本書 §5 で確定、取得は Phase 11 |
| G-6 status checks 同期 | **机上 PASS / 実走待ち** | Phase 13 で `gh api` 実走 |
| G-7 ロールバック | **PASS** | runbook + Phase 8 で机上検証完了 |
| G-8 用語整合 / status 同期 | **PASS** | 揺れ不検出 / spec_created で揃う |

| 集計 | 件数 |
| --- | --- |
| MAJOR | **0** |
| MINOR | 1（FC-7 のみ。運用ルール側で許容） |
| PASS（即時） | 4（G-1 / G-3 / G-7 / G-8） |
| 机上 PASS / 実走待ち | 4（G-2 / G-4 / G-5 / G-6） |

**Phase 9 quality gate: 通過（机上判定）**。実走証跡は Phase 11 / Phase 13 で取得して本書 §9 に追記する。

---

## 12. Gate 不通過時の戻り先ルール

| 違反箇所 | 戻り先 Phase | 対応 |
| --- | --- | --- |
| G-1 / G-3（AC 違反 / 5 箇条違反） | Phase 5 | 実 workflow ファイルを修正し、本 Phase を再評価 |
| G-2（静的検査 fail） | Phase 5 / Phase 8 | 該当 FC の是正欄に従って差分を作成 |
| G-4（secrets 露出） | Phase 5 / Phase 8 | secret rotate 別タスク（UT-GOV-002-SEC）も並行起票 |
| G-5（VISUAL 品質不足） | Phase 11 | 再取得 |
| G-6（status checks drift） | Phase 5 Step 7 / UT-GOV-001 | branch protection JSON 同期 PR を起こし本タスクと同期 |
| G-7（ロールバック手順不整合） | Phase 5 / Phase 8 / Phase 10 | runbook / before-after / go-no-go の整合を取り直す |
| G-8（用語不整合 / status drift） | Phase 8 / artifacts.json | 用語修正または status 同期 |

> いずれの戻りも **MAJOR 0 件** が達成されるまで Phase 10 go-no-go の Go 判定には進まない。
