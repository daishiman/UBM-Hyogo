# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 (UT-GOV-004) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（test-strategy / governance） |

## 目的

本タスクは「コード実装」ではなく「branch protection 草案 8 contexts と GitHub Actions の実在 job 名を同期させる調査・設計タスク」であるため、伝統的な unit / integration / e2e の枠組みは直接適用できない。本 Phase では、それらを以下 3 種の検証に再構築する。

1. **存在性検証 (existence verification)**: `gh api` で各 context が GitHub の check-runs として実在し、過去 30 日以内に最低 1 回 SUCCESS している事実を確認する。
2. **抽出スクリプト dry-run (extractor dry-run)**: `.github/workflows/*.yml` から workflow `name:` / job `name:` / matrix 展開を機械的に抽出するスクリプトを、コミットせず擬似コード/コマンド例レベルで dry-run し、出力 context 名一覧の正しさを目視検証する。
3. **段階適用 phase-1 投入リスト健全性 (staged rollout sanity)**: 「30 日成功実績あり」を満たす context のみを phase-1 リストに含めることをチェックリスト化し、リストに含まれる context を branch protection に投入したと仮定したときに「永続 merge 不能」が起きない状態を 100% 担保する。

これにより Phase 5（実装ランブック = ドキュメント生成 + 検証スクリプト擬似コード化）を「迷わず実行できる」状態へ橋渡しする。

## 実行タスク

1. 草案 8 contexts (typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate) 各々について、検証 3 種（存在性 / 抽出 dry-run / phase-1 健全性）のマトリクスを完成する（完了条件: 8 × 3 = 24 セルに空欄無し）。
2. `gh api repos/:owner/:repo/commits/<recent-sha>/check-runs` の呼び出しテンプレートを定義し、抽出すべき JSON path（`.check_runs[].name`、`.check_runs[].conclusion`、`.check_runs[].completed_at`）を確定する（完了条件: jq クエリ例が記載される）。
3. `.github/workflows/` 全 5 ファイル (`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`) を対象に、抽出スクリプト `scripts/governance/extract-ci-contexts.sh` の dry-run 期待出力を雛形化する（完了条件: 期待出力サンプルが context 名 1 行 / レコードで列挙される）。
4. matrix 展開を含む job が現状存在するかを目視検証する手順を定義する（完了条件: `rg "^\s*strategy:" .github/workflows/` 等の確認コマンド例が runbook 化）。
5. phase-1（既出 context のみ投入）/ phase-2（新規 context 投入）の cut-off 条件を定義する（完了条件: 30 日 / 直近 main / SUCCESS conclusion の 3 条件 AND 連結であることを明記）。
6. lefthook ↔ CI 対応表の検証手段を定義する（完了条件: 同一 `pnpm <script>` を双方が呼ぶことを確認するための grep 例が runbook 化）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典 AC-1〜AC-7 / 苦戦箇所 §8.1〜§8.6 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-03/main.md | Phase 3 の GO 判定・base case |
| 必須 | .github/workflows/ci.yml | 実在 job `ci` |
| 必須 | .github/workflows/backend-ci.yml | 実在 job `backend-ci / deploy-staging`, `deploy-production` |
| 必須 | .github/workflows/validate-build.yml | 実在 check-run `Validate Build` |
| 必須 | .github/workflows/verify-indexes.yml | 実在 check-run `verify-indexes-up-to-date` |
| 必須 | .github/workflows/web-cd.yml | 実在 job `web-cd / deploy-staging`, `deploy-production` |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | 草案 8 contexts §2.b |
| 参考 | https://docs.github.com/en/rest/checks/runs | `gh api` check-runs エンドポイント仕様 |
| 参考 | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | required_status_checks の context 名生成規則 |

## 検証スイート設計（本タスク特性に合わせて再構築）

### 1. 存在性検証 (existence verification)

GitHub の branch protection は、過去に 1 度も check-run として報告されていない context 名を `required_status_checks.contexts` に投入すると永続 merge 不能を引き起こす（原典 §8.1）。本検証は、phase-1 投入候補の各 context について GitHub 上の実績を確認する。

| 草案 context | 推定実在 context | 確認コマンド (擬似) |
| --- | --- | --- |
| typecheck | `ci`（内部 step として typecheck を含むと推定） | `gh api repos/:owner/:repo/commits/<main-sha>/check-runs --jq '.check_runs[] | select(.name=="ci") | {name, conclusion, completed_at}'` |
| lint | `ci`（同上） | 同上 |
| unit-test | （独立 workflow/job なし → phase-2 候補） | 同上で結果 0 件確認 |
| integration-test | （未存在の可能性 → phase-2 候補） | 同上で結果 0 件確認 |
| build | `Validate Build` | `... | select(.name=="Validate Build")` |
| security-scan | （未存在 → phase-2 候補） | 同上で 0 件確認 |
| docs-link-check | （未存在 → phase-2 候補 / UT-GOV-005 リレー） | 同上 |
| phase-spec-validate | （未存在 → phase-2 候補 / UT-GOV-005 リレー） | 同上 |

> 注: 上記「推定」は workflow ファイルの目視結果に基づく草案。確定は Phase 5 の `extract-ci-contexts.sh` dry-run 結果と `gh api` 実測で行う。

### 2. 抽出スクリプト dry-run (extractor dry-run)

`scripts/governance/extract-ci-contexts.sh`（Phase 5 で擬似コード化）は以下の擬似挙動を持つ:

- 入力: `.github/workflows/*.yml`
- 出力 (stdout, 1 行 / context):
  ```
  ci
  backend-ci / deploy-staging
  backend-ci / deploy-production
  Validate Build / Validate Build
  verify-indexes-up-to-date / verify-indexes-up-to-date
  web-cd / deploy-staging
  web-cd / deploy-production
  ```
- dry-run 検証観点:
  - workflow `name:` 省略時に file basename を採用するロジックが正しいか
  - job `name:` 省略時に YAML key を採用するロジックが正しいか
  - matrix 展開がある場合 `<workflow> / <job> (<matrix-value>)` のサフィックスを生成するか（現状 matrix 不在のため No-op を期待）
  - 同名 job の workflow 跨ぎを `<workflow> / <job>` のフルパスで一意化しているか（原典 §8.3）

### 3. 段階適用 phase-1 投入リスト健全性 (staged rollout sanity)

phase-1 リストへ含めるための条件 (3 条件 AND):

1. **存在性**: `gh api ... check-runs` で `name` 一致レコードが取得できる
2. **直近成功**: `conclusion == "success"` のレコードが過去 30 日以内に 1 件以上存在
3. **対象ブランチ**: 該当 check-run が `main` または `dev` の HEAD 系列で実行された (`gh api repos/:owner/:repo/commits/<main-sha>/check-runs`)

3 条件いずれかを欠く context は phase-1 から除外し、phase-2 / UT-GOV-005 等のリレー対象に回す。

### 検証マトリクス（8 contexts × 3 検証種）

| context | 存在性 | 抽出 dry-run | phase-1 健全性 |
| --- | --- | --- | --- |
| typecheck | gh api 実測 (推定: `ci` 内 step、独立 context 化なら新設要) | extract 出力に有無確認 | 30 日 success 確認 / 無ければ phase-2 |
| lint | 同上 | 同上 | 同上 |
| unit-test | 独立 workflow/job なし | extract 出力に無いことを確認 | phase-2 |
| integration-test | gh api で 0 件想定 | extract 出力に無いことを確認 | phase-2 確定 |
| build | gh api 実測 (推定: `Validate Build / Validate Build`) | extract 出力で確認 | 30 日 success 確認 |
| security-scan | gh api で 0 件想定 | extract 出力に無いことを確認 | phase-2 確定 / UT-GOV-005 リレー候補 |
| docs-link-check | gh api で 0 件想定 | extract 出力に無いことを確認 | phase-2 確定 / UT-GOV-005 リレー候補 |
| phase-spec-validate | gh api で 0 件想定 | extract 出力に無いことを確認 | phase-2 確定 / UT-GOV-005 リレー候補 |

空セル無しを完了条件とする。

## 抽出スクリプト dry-run の事前確認手順

```bash
# 1. workflow 全列挙
ls -1 .github/workflows/*.yml

# 2. workflow name / job name の grep 抽出（dry-run 雛形）
grep -nE '^(name:|  [a-z_-]+:|    name:)' .github/workflows/*.yml

# 3. matrix 不在を確認
rg -n '^\s*strategy:|matrix:' .github/workflows/ || echo "no matrix"

# 4. 期待 context 一覧との突合（手動）
```

## `gh api` 検証コマンドテンプレート

```bash
# 直近 main の commit から check-runs を取得
RECENT_SHA=$(gh api repos/:owner/:repo/commits/main --jq '.sha')

gh api "repos/:owner/:repo/commits/${RECENT_SHA}/check-runs?per_page=100" \
  --jq '.check_runs[] | {name, conclusion, completed_at}' \
  | tee outputs/phase-04/check-runs-snapshot.json

# 過去 30 日 success 確認 (workflow runs 経由)
gh api "repos/:owner/:repo/actions/runs?branch=main&status=success&created=>=$(date -u -v-30d +%Y-%m-%d)" \
  --jq '.workflow_runs[].name' | sort -u
```

## lefthook ↔ CI 対応表 検証手順

- lefthook 設定 `lefthook.yml` の hook (pre-commit / pre-push) が呼ぶ `pnpm <script>` と、`.github/workflows/*.yml` の `run:` で呼ばれる `pnpm <script>` が一致することを確認する。
- 検証コマンド例:

```bash
rg -n 'pnpm (typecheck|lint|test|build)' lefthook.yml .github/workflows/
```

- 結果が「両側で同じ script 名を使う」ペアになっていれば PASS。差分があれば対応表の修正対象として記録する（Phase 5 で対応表生成、Phase 6 でドリフト検出シナリオ化）。

## 実行手順

1. 検証マトリクス (8 × 3) を `outputs/phase-04/test-strategy.md` に転記する。
2. `gh api` 検証コマンドテンプレートを runbook draft として固定（実行は Phase 5）。
3. 抽出スクリプト dry-run 期待出力を 1 行/context で列挙する。
4. phase-1 cut-off 条件 (3 条件 AND) を文書化。
5. lefthook ↔ CI 検証 grep を Phase 5 の対応表生成手順に予約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 検証コマンド・dry-run 期待出力を実装 runbook の Step に紐付け |
| Phase 6 | 各検証で異常を検出した場合の rollback / mitigation を failure case に流し込み |
| Phase 7 | AC-1 / AC-2 / AC-3 / AC-4 を本 Phase の検証 3 種にトレース |

## 多角的チェック観点

- 価値性: 検証 3 種が AC-1〜AC-4（特に AC-3 の「30 日成功実績」）を完全カバーするか。
- 実現性: `gh api` の rate limit (5000 req/h authenticated) を踏まえ、1 タスクで超過しないか。
- 整合性: 抽出スクリプトの出力 context 名と GitHub の実 context 名が `<workflow> / <job>` 規則で一致するか。
- 運用性: phase-1 cut-off 条件が運用者にとって機械判定可能か。
- 認可境界: `gh api` 実行に必要な GitHub Token の権限 scope (repo: read, actions: read) が明示されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 8 × 3 検証マトリクス定義 | spec_created |
| 2 | gh api 検証テンプレート確定 | spec_created |
| 3 | 抽出スクリプト dry-run 期待出力雛形 | spec_created |
| 4 | matrix 展開有無の確認手順 | spec_created |
| 5 | phase-1 cut-off 3 条件確定 | spec_created |
| 6 | lefthook ↔ CI 検証 grep 確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 8 × 3 マトリクス・gh api テンプレ・dry-run 期待出力・cut-off 条件 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 8 contexts × 3 検証種のマトリクスに空セル無し
- [ ] `gh api` 検証コマンドテンプレートが jq 付きで記述
- [ ] 抽出スクリプト dry-run 期待出力が 1 行/context で列挙
- [ ] phase-1 cut-off 条件 (存在 + 30 日 success + 対象 branch) が AND で固定
- [ ] lefthook ↔ CI 検証 grep が runbook 入り

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- 草案 8 contexts 全てがマトリクスに登場
- 「永続 merge 不能」回避の存在性検証が phase-1 投入条件と一致

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - `gh api` 検証テンプレート → Phase 5 の Step 2 で実行
  - 抽出スクリプト dry-run 期待出力 → Phase 5 の Step 1 (`extract-ci-contexts.sh` 擬似コード) の比較対象
  - phase-1 cut-off 条件 → Phase 5 の段階適用案セクションに反映
  - lefthook ↔ CI 検証 grep → Phase 5 の対応表生成手順に組み込み
- ブロック条件:
  - `gh api` の実行権限 (Token scope) が確定しないまま Phase 5 着手
  - 8 contexts のいずれかが「推定」のままで実測確認の予約が抜ける
