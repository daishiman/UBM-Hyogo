# Phase 4 — 検証マトリクス（test-matrix）

## Status
done

> docs-only タスクのため、本書は **「テスト実装」ではなく「草案仕様の検証手順」** を列挙する。
> 実適用は Phase 5 ランブックで行い、本書はその前段の dry-run 計画を担う。

---

## 1. 検証手段の凡例

| 略号 | 手段 | 実行コスト |
| --- | --- | --- |
| L1 | 静的 schema lint（`jq` / `yq` / `actionlint`） | 低 |
| L2 | `gh api` dry-run（GET のみ・書き込みしない） | 低 |
| L3 | `act` によるローカル workflow 実行 | 中（Docker 要） |
| L4 | OPA/Conftest rego policy 検査（任意） | 中 |

---

## 2. 検証マトリクス本体

### 2.1 branch-protection.main.json.draft

| ID | 検証項目 | 手段 | コマンド例 | PASS 基準 | FAIL 基準 |
| --- | --- | --- | --- | --- | --- |
| M-01 | JSON が valid | L1 | `jq . branch-protection.main.json.draft` | 構文エラーなし | parse error |
| M-02 | 必須 8 contexts 完備 | L1 | `jq '.required_status_checks.contexts \| length' …` | `== 8` | それ以外 |
| M-03 | approving=2 | L1 | `jq '.required_pull_request_reviews.required_approving_review_count'` | `== 2` | それ以外 |
| M-04 | enforce_admins=true | L1 | `jq '.enforce_admins'` | `true` | `false` / null |
| M-05 | required_linear_history=true | L1 | 同上 | `true` | それ以外 |
| M-06 | allow_force_pushes=false | L1 | 同上 | `false` | `true` |
| M-07 | 既存 main 設定との diff | L2 | `gh api repos/:o/:r/branches/main/protection` を取得し `diff` | 差分が "意図したもの" のみ | 想定外差分 |
| M-08 | rego policy（任意） | L4 | `conftest test branch-protection.main.json.draft -p policy/` | 全 rule allow | deny 出現 |

### 2.2 branch-protection.dev.json.draft

| ID | 検証項目 | 手段 | PASS 基準 |
| --- | --- | --- | --- |
| D-01 | approving=1 | L1 | `== 1` |
| D-02 | require_code_owner_reviews=false | L1 | `false` |
| D-03 | require_last_push_approval=false | L1 | `false` |
| D-04 | contexts は main と同一 | L1 | `diff <(jq -S .required_status_checks.contexts main) <(jq -S … dev)` が空 |
| D-05 | linear_history=true | L1 | `true` |
| D-06 | 既存 dev 設定との diff | L2 | `gh api … /branches/dev/protection` |

### 2.3 merge-policy（repository setting）

| ID | 検証項目 | 手段 | PASS 基準 |
| --- | --- | --- | --- |
| P-01 | allow_squash_merge=true | L2 | `gh api repos/:o/:r \| jq .allow_squash_merge` が `true` |
| P-02 | allow_merge_commit=false | L2 | `false` |
| P-03 | allow_rebase_merge=false | L2 | `false` |
| P-04 | delete_branch_on_merge=true | L2 | `true` |
| P-05 | squash_merge_commit_title=PR_TITLE | L2 | 文字列一致 |

### 2.4 auto-rebase.workflow.yml.draft

| ID | 検証項目 | 手段 | PASS 基準 |
| --- | --- | --- | --- |
| A-01 | YAML が valid | L1 | `yq . auto-rebase.workflow.yml.draft` 成功 |
| A-02 | actionlint が通る | L1 | `actionlint -shellcheck= auto-rebase.workflow.yml.draft` 0 件 |
| A-03 | trigger に push(main,dev) と pull_request(labeled,synchronize) の両方 | L1 | `yq '.on'` で確認 |
| A-04 | concurrency キー定義あり | L1 | `yq '.concurrency.group'` 非 null |
| A-05 | permissions が contents:write / pull-requests:write のみ | L1 | 余計な scope なし |
| A-06 | label `auto-rebase` 条件式が `if:` に存在 | L1 | grep 一致 |
| A-07 | コンフリクト時 `exit 1` で停止 | L1 | run スクリプト内に `exit 1` 確認 |
| A-08 | `act` でラベル無し PR では rebase job が skip | L3 | `act pull_request -e events/pr-no-label.json` で `if` 条件で skip |
| A-09 | `act` でラベル付き PR で rebase job 起動（モック） | L3 | job が start する |

### 2.5 pr-target-safety-gate.workflow.yml.draft

| ID | 検証項目 | 手段 | PASS 基準 |
| --- | --- | --- | --- |
| S-01 | YAML valid | L1 | `yq` 成功 |
| S-02 | workflow-level `permissions: {}` | L1 | `yq '.permissions'` が空オブジェクト |
| S-03 | `pull_request_target` 内に PR head checkout がない | L1 | `github.event.pull_request.head.sha` が出現しない |
| S-04 | `pull_request_target` 内に install/build/test 実行がない | L1 | `pnpm install` / `pnpm build` / `pnpm test` が出現しない |
| S-05 | untrusted build は別 `pull_request` workflow に分離 | L1 | `pr-untrusted-build.workflow.yml.draft` が存在 |
| S-06 | untrusted build の checkout ref が `head.sha` かつ `persist-credentials:false` | L1 | grep 一致 |
| S-07 | triage job は default branch から checkout | L1 | grep `default_branch` |
| S-08 | triage job が PR コードを実行しない（run に PR ファイル参照なし） | L1 目視 | レビューで確認 |
| S-09 | actionlint clean | L1 | 0 件 |
| S-10 | rego: `pull_request_target` で PR code 実行 step がない | L4 | conftest deny=0 |

---

## 3. 受入条件 ↔ 検証 ID 対応

| Phase 1 AC | 対応する検証 ID |
| --- | --- |
| AC-1 main/dev protection JSON | M-01〜M-08 / D-01〜D-06 |
| AC-2 squash-only | P-01〜P-05 / M-05 / D-05 |
| AC-3 auto-rebase workflow | A-01〜A-09 |
| AC-4 pr_target safety | S-01〜S-10 |
| AC-5 横断境界 | docs 整合のため Phase 6 failure-cases と相互参照 |
| AC-6 Phase 13 ゲート | 各 main.md 冒頭注記の存在チェック（L1 grep） |
| AC-7 草案宣言 | 同上 |

---

## 4. 検証実行順（推奨）

1. L1 schema lint（M-01..M-06 / D-01..D-05 / A-01..A-07 / S-01..S-09）
2. L2 既存 GitHub 設定の取得・diff（M-07 / D-06 / P-01..P-05）
3. L3 `act` ローカル実行（A-08 / A-09）
4. L4 OPA/Conftest（M-08 / S-10）— 環境が無ければ skip 可

L1〜L2 は **必須**、L3〜L4 は CONDITIONAL PASS を許容（Phase 4 main.md §3）。

---

## 5. 申し送り

- L2 を実行する際、**書き込み API（PUT/PATCH）を絶対に呼ばない**（GET のみ）。MEMORY ルール「設定値・機密情報をドキュメントに残さない」と同質の事故防止。
- `gh api` の出力を test ログとしてリポにコミットしない（PII / org slug 露出防止）。
