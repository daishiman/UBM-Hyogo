# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 (UT-GOV-004) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（runbook / governance documentation） |

## 目的

本タスクの「実装」は **コードの新規実装ではなく、ドキュメント生成と検証スクリプトの擬似コード化** である。本 Phase では Phase 4 で確定した検証 3 種（存在性 / 抽出 dry-run / phase-1 健全性）を一連の runbook に組み立て、以下 5 種の確定成果物を生成する手順を順序付きで記述する。

1. 実在 workflow / job 名一覧表 (Markdown)
2. 確定 context 名リスト（UT-GOV-001 が直接参照）
3. lefthook hook ↔ CI job 対応表
4. 段階適用案 (phase-1 既出のみ / phase-2 新規投入条件)
5. `strict` 採否決定メモ（dev=false / main=true 推奨案を含む）

## 実行タスク

1. 検証スクリプト `scripts/governance/extract-ci-contexts.sh` の擬似コードを記述する（完了条件: stdin / stdout 契約、grep / yq の代替、context 名生成規則の 3 点が明記）。
2. `gh api` を用いた存在性 + 30 日成功実績検証手順を Step ごとに分解する（完了条件: jq 抽出パスと出力先パスが指定）。
3. 実在 workflow / job 名一覧表の Markdown 雛形を作成する（完了条件: 5 workflow ファイル × N jobs の表形式が draft で完成）。
4. 確定 context 名リストのテンプレを作成する（完了条件: phase-1 投入対象 / phase-2 リレー対象 / 除外 の 3 区分）。
5. lefthook hook ↔ CI job 対応表の生成手順を runbook 化する（完了条件: 同一 `pnpm <script>` ペアの目視 + grep 抽出手順）。
6. `strict: true` 採否決定メモのテンプレを作成する（完了条件: dev / main 別の採否と根拠 3 行以上）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典 §2.4 成果物・§8 苦戦箇所 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-04.md | 検証マトリクス・gh api テンプレ |
| 必須 | .github/workflows/ci.yml | name: ci / job: ci |
| 必須 | .github/workflows/backend-ci.yml | name: backend-ci / jobs: deploy-staging, deploy-production |
| 必須 | .github/workflows/validate-build.yml | name: Validate Build / job: Validate Build |
| 必須 | .github/workflows/verify-indexes.yml | name: verify-indexes-up-to-date / job: verify-indexes-up-to-date |
| 必須 | .github/workflows/web-cd.yml | name: web-cd / jobs: deploy-staging, deploy-production |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md | 既存草案の context drift hazard 参照元 |
| 参考 | https://docs.github.com/en/rest/checks/runs | check-runs API |

## 生成成果物（5 種）と出力先

| # | 成果物 | 出力パス |
| --- | --- | --- |
| 1 | 実在 workflow / job 名一覧表 | `outputs/phase-05/workflow-job-inventory.md` |
| 2 | 確定 context 名リスト | `outputs/phase-05/required-contexts-final.md` |
| 3 | lefthook ↔ CI 対応表 | `outputs/phase-05/lefthook-ci-mapping.md` |
| 4 | 段階適用案 | `outputs/phase-05/staged-rollout-plan.md` |
| 5 | strict 採否決定メモ | `outputs/phase-05/strict-mode-decision.md` |

## runbook

### Step 0: 事前準備

```bash
# 環境確認 (Node 24 / pnpm 10 / gh)
mise exec -- node --version
mise exec -- pnpm --version
gh auth status   # repo:read, actions:read scope を保有していること
```

### Step 1: 抽出スクリプト擬似コード化（実コミット不要）

`scripts/governance/extract-ci-contexts.sh` の **擬似コード**:

```bash
#!/usr/bin/env bash
# 入力: .github/workflows/*.yml
# 出力: stdout に "<workflow_name> / <job_name>" を 1 行 / context で出力
set -euo pipefail

for f in .github/workflows/*.yml; do
  # workflow name (省略時は basename)
  wf_name=$(yq '.name // ""' "$f")
  [ -z "$wf_name" ] && wf_name=$(basename "$f" .yml)

  # job 列挙 (matrix 展開未対応 = 現状 OK)
  yq -r '.jobs | to_entries[] | .key + "\t" + (.value.name // .key)' "$f" \
    | while IFS=$'\t' read -r job_key job_name; do
        echo "${wf_name} / ${job_name}"
      done
done | sort -u
```

期待出力（Phase 4 dry-run 雛形と一致するか目視）:

```
backend-ci / deploy-production
backend-ci / deploy-staging
ci
Validate Build
verify-indexes-up-to-date
web-cd / deploy-production
web-cd / deploy-staging
```

> 注: 本タスクではこのスクリプトを **コミットしない**。Phase 5 の成果物は擬似コードと dry-run 結果の Markdown 化のみ。実装は UT-GOV-005 等の後続で行うか、運用者が一度限り手元で実行して結果を取り込む。

### Step 2: `gh api` で存在性 + 30 日成功実績検証

```bash
# (a) 直近 main commit から check-runs スナップショット
RECENT_SHA=$(gh api repos/:owner/:repo/commits/main --jq '.sha')
gh api "repos/:owner/:repo/commits/${RECENT_SHA}/check-runs?per_page=100" \
  --jq '.check_runs[] | {name, conclusion, completed_at}' \
  > outputs/phase-05/check-runs-recent.json

# (b) 過去 30 日の workflow runs から成功実績集計
gh api --paginate "repos/:owner/:repo/actions/runs?branch=main&status=success" \
  --jq '.workflow_runs[] | select(.created_at > "'$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)'") | .name' \
  | sort | uniq -c | sort -rn \
  > outputs/phase-05/success-30days.txt

# (c) Step 1 出力との突合
diff <(awk '{print $2" / "$2}' outputs/phase-05/success-30days.txt) \
     outputs/phase-05/extract-output.txt || true
```

### Step 3: 実在 workflow / job 名一覧表の生成

`outputs/phase-05/workflow-job-inventory.md` のテンプレ:

| workflow file | workflow name | job key | job name | 想定 context (`<workflow> / <job>`) | matrix |
| --- | --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | `ci.yml` | `ci` | `ci` | `ci` | なし |
| `.github/workflows/backend-ci.yml` | `backend-ci` | `deploy-staging` | (省略=key 採用) | `backend-ci / deploy-staging` | なし |
| `.github/workflows/backend-ci.yml` | `backend-ci` | `deploy-production` | (省略=key 採用) | `backend-ci / deploy-production` | なし |
| `.github/workflows/validate-build.yml` | `Validate Build` | `validate-build` | `Validate Build` | `Validate Build` | なし |
| `.github/workflows/verify-indexes.yml` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date` | `verify-indexes-up-to-date / verify-indexes-up-to-date` | なし |
| `.github/workflows/web-cd.yml` | `web-cd` | `deploy-staging` | (省略=key 採用) | `web-cd / deploy-staging` | なし |
| `.github/workflows/web-cd.yml` | `web-cd` | `deploy-production` | (省略=key 採用) | `web-cd / deploy-production` | なし |

> Step 2 (a) の `outputs/phase-05/check-runs-recent.json` と突合し、`name` フィールドの実値で表を確定する。

### Step 4: 確定 context 名リストの生成

`outputs/phase-05/required-contexts-final.md` のテンプレ:

```markdown
## phase-1 投入対象（UT-GOV-001 即時投入可）

- `ci` ← 草案 typecheck / lint を aggregate job として内包（unit-test は含めない）
- `Validate Build` ← 草案 build に対応
- `verify-indexes-up-to-date` ← skill index drift gate

## phase-2 リレー対象（CI 新設後に追加）

- `integration-test` → 未存在 / UT-GOV-005 で workflow 新設後に投入
- `security-scan` → 未存在 / UT-GOV-005
- `docs-link-check` → 未存在 / UT-GOV-005
- `phase-spec-validate` → 未存在 / UT-GOV-005

## branch protection から意図的に除外

- `backend-ci / deploy-*` ← デプロイ系は required にしない (PR merge gate と分離)
- `web-cd / deploy-*` ← 同上
```

> 草案 8 contexts (typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate) のうち、phase-1 で必須化するのは「実在 + 30 日 success」を満たすもののみ。

### Step 5: lefthook ↔ CI 対応表の生成

`outputs/phase-05/lefthook-ci-mapping.md` のテンプレ:

| lefthook hook | 呼び出す pnpm script | CI workflow / job | CI 側 run コマンド |
| --- | --- | --- | --- |
| `pre-commit` | `pnpm typecheck` | `ci` | `pnpm typecheck` |
| `pre-commit` | `pnpm lint` | `ci` | `pnpm lint` |
| `pre-push` | `pnpm test` (該当時) | `ci` | `pnpm test` |
| `pre-push` | `pnpm build` (該当時) | `Validate Build` | `pnpm build` |

検証 grep:

```bash
rg -n 'pnpm (typecheck|lint|test|build)' lefthook.yml .github/workflows/
```

両側で **同名の `pnpm <script>` を呼んでいる** ことが対応表の整合条件。差分があれば Phase 6 のドリフト failure case に登録する。

### Step 6: `strict: true` 採否決定メモ

`outputs/phase-05/strict-mode-decision.md` のテンプレ:

```markdown
## 採否決定 (UT-GOV-004 合意)

| ブランチ | strict | 根拠 |
| --- | --- | --- |
| dev | false | solo 開発のため up-to-date 必須化は摩擦のみ増やす。CI gate で品質保証は十分。 |
| main | true | production への merge は base 最新を必須化し、main の壊れリスクを最小化する。 |

## トレードオフ記録

- main strict=true による副作用: 他 PR が merge されるたび rebase が必要 (solo 運用では稀少のため受容可)。
- 将来チーム化した場合は dev も strict=true への切り替えを再検討する (UT-GOV-001 の運用 review 時)。
```

## 擬似コード（運用ループ全体）

```bash
# 1) extract  : 実在 workflow / job 名抽出
bash scripts/governance/extract-ci-contexts.sh > outputs/phase-05/extract-output.txt

# 2) verify   : gh api で存在 + 30 日 success 確認
bash scripts/governance/verify-context-existence.sh \
  --inputs outputs/phase-05/extract-output.txt \
  --window 30d \
  > outputs/phase-05/verification-result.txt

# 3) classify : phase-1 / phase-2 / 除外 に分類
bash scripts/governance/classify-contexts.sh \
  --extract outputs/phase-05/extract-output.txt \
  --verify  outputs/phase-05/verification-result.txt \
  --draft   "typecheck,lint,unit-test,integration-test,build,security-scan,docs-link-check,phase-spec-validate" \
  > outputs/phase-05/required-contexts-final.md
```

> 上記 3 スクリプトは本 Phase では **擬似コードレベル** のみ。実コミット / 実行は運用者の手元または UT-GOV-005 のリレーで行う。

## sanity check

```bash
# 抽出 vs 実在 check-runs の突合
diff <(sort outputs/phase-05/extract-output.txt) \
     <(jq -r '.check_runs[].name' outputs/phase-05/check-runs-recent.json | sort -u)

# phase-1 リスト全件が gh api で 30 日 success を持つこと
for ctx in $(awk '/phase-1/{flag=1} /phase-2/{flag=0} flag && /^- /{print $2}' outputs/phase-05/required-contexts-final.md | tr -d '`'); do
  echo "checking: $ctx"
  gh api "repos/:owner/:repo/commits/main/check-runs" \
    --jq ".check_runs[] | select(.name==\"$ctx\" and .conclusion==\"success\") | .completed_at" | head -1
done
```

## canUseTool 適用範囲

- 本 Phase では Markdown 生成のみ (Edit / Write) を使用する。
- `gh api` 実行は read-only のため canUseTool 制約不要。
- branch protection の **適用** は UT-GOV-001 の責務であり本 Phase 対象外 (N/A)。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 検証 3 種 → runbook の Step 1〜2 |
| Phase 6 | 擬似コード上の例外パスを failure case に展開 |
| Phase 7 | 5 成果物 → AC-1〜AC-7 のトレース表 |

## 多角的チェック観点

- 価値性: 5 成果物が AC-1〜AC-7 全てをカバーするか。
- 実現性: `gh api` 一発で 30 日 success 集計が取れるか (rate limit 内に収まるか)。
- 整合性: 抽出スクリプト出力と GitHub の実 context 名が `<workflow> / <job>` 規則で一致するか。
- 運用性: phase-1 確定リストが UT-GOV-001 にコピペで投入可能な形式か。
- セキュリティ: `gh` token は read-only scope のみで足りるか確認。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | extract 擬似コード化 | spec_created |
| 2 | gh api 存在性 + 30 日成功検証 Step 化 | spec_created |
| 3 | workflow / job 一覧表テンプレ | spec_created |
| 4 | 確定 context 名リストテンプレ (3 区分) | spec_created |
| 5 | lefthook ↔ CI 対応表 runbook 化 | spec_created |
| 6 | strict 採否決定メモテンプレ | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | runbook + 擬似コード + 5 成果物テンプレへのリンク |
| ドキュメント | outputs/phase-05/workflow-job-inventory.md | 実在 workflow / job 名一覧表 (Step 3) |
| ドキュメント | outputs/phase-05/required-contexts-final.md | 確定 context 名リスト (Step 4) |
| ドキュメント | outputs/phase-05/lefthook-ci-mapping.md | lefthook ↔ CI 対応表 (Step 5) |
| ドキュメント | outputs/phase-05/staged-rollout-plan.md | 段階適用案 (phase-1 / phase-2) |
| ドキュメント | outputs/phase-05/strict-mode-decision.md | strict 採否決定メモ (Step 6) |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] 抽出スクリプト擬似コードが stdin/stdout 契約付きで記述
- [ ] `gh api` Step が jq クエリと出力先付きで Step 化
- [ ] workflow / job 一覧表が 5 workflow / 7 job 行で draft 完成
- [ ] 確定 context 名リストが phase-1 / phase-2 / 除外 の 3 区分で完成
- [ ] lefthook ↔ CI 対応表が `pnpm <script>` ペアで整合
- [ ] strict 採否メモに dev=false / main=true の根拠記述

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 5 成果物テンプレすべてが output ディレクトリに配置予約
- 草案 8 contexts 全てが phase-1 / phase-2 / 除外 のいずれかに分類
- UT-GOV-001 が直接コピペできる形で確定 context 名リストが生成

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 擬似コード上の例外パス (extract / verify / classify いずれか fail) を Phase 6 failure case に展開
  - phase-1 投入リスト → Phase 6 の「永続 merge 不能事故」シナリオの直接入力
  - lefthook ↔ CI 対応表 → Phase 6 のドリフト検出シナリオの直接入力
- ブロック条件:
  - `gh api` 実測なしで phase-1 リストが確定する (存在性検証スキップ禁止)
  - 確定 context 名リストが `<workflow> / <job>` フルパス未指定で完成する
