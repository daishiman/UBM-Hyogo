# [#900] "[ci-green-recovery-followup-002-workflow-permissions-least-privilege-audit] 全 workflow の top-level permissions 最小権限監査"

## メタ情報

```yaml
task_id: ci-green-recovery-followup-002-workflow-permissions-least-privilege-audit
task_name: 全 workflow の top-level permissions 最小権限監査
category: CI hardening/セキュリティ
target_feature: .github/workflows/* の top-level permissions
priority: 中
scale: 中規模
status: 未実施
source_phase: docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/unassigned-task-detection.md（2回目検証 follow-up）
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/unassigned-task/ci-green-recovery-followup-002-workflow-permissions-least-privilege-audit.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---
## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `ci-green-recovery-smoke-coverage-shard`（Lane C）の根本原因は、`.github/workflows/ci.yml` に top-level `permissions:` ブロックが存在せず、default workflow token の権限が（org / repo 設定や別 PR 由来で）縮退した状況で `actions/checkout@v4` が credential を読めず exit 128 で失敗する構造的弱点だった。

中学生向けに説明すると、GitHub Actions の各 workflow には「この workflow が repo に対してできること（読む・書く）」を決める権限設定がある。これを明示しないと、GitHub 側の既定値や他の設定変更にぶら下がって権限が知らないうちに弱まり、コードを取ってくる最初のステップ（checkout）すら失敗することがある。各 workflow に「最低限これだけは読める」と自分で宣言しておけば、外側の設定がどう変わっても土台が崩れない。

親タスクは `ci.yml` にだけ `permissions: contents: read`（`ci.yml:15-16`）を追加して対処したが、**同じ弱点が他の 12 workflow に残存**している。`runtime-smoke-staging.yml:15-16` のように既に明示済みの workflow もある一方、12 件は top-level 宣言が無い。

### 1.2 問題点・課題

2026-05-23 時点で top-level `permissions:` ブロックを持たない 12 workflow:

- `backend-ci.yml`（`runtime-smoke-staging` を呼ぶ orchestrator。優先度高）
- `d1-migration-verify.yml`
- `e2e-tests.yml`
- `lighthouse.yml`
- `playwright-smoke.yml`
- `playwright-visual-baseline-update.yml`
- `playwright-visual-full.yml`
- `validate-build.yml`
- `verify-design-tokens.yml`
- `verify-esbuild.yml`
- `verify-primitive-adoption.yml`
- `web-cd.yml`（deploy 系。job-level に `contents: read` を持つ。`web-cd.yml:19-20`, `web-cd.yml:68-69`）

これら 12 件は default token 権限の縮退時に checkout-credential 失敗クラス（exit 128）を再現しうる。`ci.yml` だけ hardening されたため、防御が一貫していない。

### 1.3 放置した場合の影響

- default token 権限が縮退する設定変更（org policy 変更・別 PR の `permissions` 縮小の波及等）が入った瞬間、12 workflow のいずれかが checkout 段階で予告なく落ち、CI green が崩れる。
- 失敗が transient に見えるため（同一 run の前段 job は同じ checkout で成功しうる）、再発のたびに「transient か構造的か」の切り分けに時間を要する。親タスクと同じ調査コストを 12 回繰り返すことになる。
- 過剰権限のまま放置された workflow があれば、token 漏洩時の被害範囲が不必要に広い（least-privilege 違反）。

---

## 2. 何を達成するか（What）

### 2.1 目的

全 workflow を監査し、各 workflow のジョブが実際に必要とする最小権限を top-level `permissions:` ブロックとして明示することで、checkout-credential 失敗クラスを構造的に予防し、token 漏洩時の被害範囲を最小化する。

### 2.2 スコープ

#### 含むもの

- 上記 12 workflow を 1 件ずつ調査し、ジョブが実際に必要とする権限を top-level `permissions:` で明示する。
  - 既定は `contents: read`。
  - deploy / release 系は `id-token: write`（OIDC）、`packages: write`、`deployments: write` 等を job-level で個別判定。
  - `playwright-visual-baseline-update.yml` は baseline を `git commit` / `git push` し job-level に `contents: write` / `pull-requests: write` を持つ（`playwright-visual-baseline-update.yml:15-17`, push は同 `:114` 付近）。この場合 top-level は最小（`contents: read`）に置き、write は既存の job-level 宣言で上書きする。
  - `web-cd.yml` は job-level に既に `contents: read` を持つため、top-level も `contents: read` とし job-level 宣言と矛盾させない。
- 既に top-level permissions を持つ workflow（`ci.yml:15-16` の `contents: read`、`runtime-smoke-staging.yml:15-16` の `contents: read` 等）の値が過剰でないかを軽く確認する。
- actionlint（`ci.yml:52-56` で 1.7.7 を download し `.github/workflows/*.yml` を lint）が全 workflow に対し PASS することを確認する。

#### 含まないもの（スコープ外）

- workflow のロジック / トリガー（`on:`）の変更。
- secret / 変数の追加・変更。
- required status check の context 名変更（branch protection 維持のため不変条件）。

### 2.3 成果物

- 12 workflow への top-level `permissions:` ブロック追加。
- 既存 permissions 保有 workflow の過剰判定メモ（過剰がなければ「過剰なし」と記録）。

---

## 3. どのように実行するか（How）

### 3.1 推奨アプローチ（workflow ごとの権限判定方針・調査手順）

#### 判定の基本方針

1. workflow を 1 件ずつ開き、全 job の step が repo に対し行う操作を読み解く。
   - `actions/checkout`、test 実行、build、lint のみ → `contents: read` で十分。
   - `git push` / `git commit` で repo を書き換える → `contents: write`（top-level ではなく当該 job-level で上書きが原則）。
   - `gh pr comment` / PR 操作 → `pull-requests: write`。
   - OIDC を使う deploy（`id-token`）→ `id-token: write`。
   - `gh release` → `contents: write`。
2. top-level には「全 job が共通で必要とする最小権限」を置く。書き込みが必要なのは一部 job のみなら、top-level を `contents: read` にして当該 job だけ job-level で上書きする（least-privilege 粒度）。
3. `web-cd.yml` のように job-level が既にある場合は、top-level を job-level と整合する最小値（`contents: read`）にし、二重定義の矛盾を避ける。

#### 調査手順

```bash
# 1. top-level permissions の有無を一覧化
for f in .github/workflows/*.yml; do
  grep -q "^permissions:" "$f" && echo "HAS $f" || echo "MISSING $f"
done

# 2. 各 workflow の write 系操作を洗い出す（権限判定の根拠）
grep -n "git push\|git commit\|gh release\|gh pr\|id-token\|packages:\|deployments:\|permissions:" .github/workflows/*.yml
```

各 workflow について「必要権限とその根拠（どの step が要求するか）」を 1 行メモに残し、top-level ブロックを `on:` の直後・`jobs:` の前（`ci.yml:15-17` と同じ位置）に挿入する。

### 3.2 検証方法（actionlint / required context 名不変の確認）

```bash
# actionlint（local 未導入なら download。CI と同じ 1.7.7）
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7
./actionlint -color .github/workflows/*.yml

# 全 workflow が top-level permissions を持つことの確認
for f in .github/workflows/*.yml; do
  grep -q "^permissions:" "$f" || echo "STILL MISSING: $f"
done

# required status check の context 名（job 名）が変わっていないことの確認
git diff dev -- .github/workflows/ | grep -E "^[+-]\s+(name:|.*:\s*$)" | grep -iE "job|name" || echo "no job-name diff"
```

- actionlint local 未導入時は CI の actionlint step（`ci.yml:52-56`）を最終検証ゲートとする。
- required context 名（`audit-correlation-verify / verify`、`verify-design-tokens / verify-design-tokens`、`playwright-smoke / smoke (chromium)` 等。CLAUDE.md ブランチ戦略節参照）に対応する job 名・job key を変更していないことを diff で確認する。

---

## 4. 苦戦箇所（将来の課題解決のための知見）

1. **transient と構造的弱点の切り分けが観測依存**: Lane C の checkout 失敗は、同一 run の前段 job が同じ default checkout で成功していたため「transient か構造的か」を静的に断定できず、CI re-run というユーザー運用側の観測に依存した。permissions 明示は「無害な防御的 hardening」として、再現を待たず先回りで適用する判断が必要だった。この監査でも各 workflow で「実際に失敗を観測していない」段階で予防的に権限を絞るため、過小権限で逆に job を壊さないバランスが難所。`git push` / `gh pr` 等の write 操作を見落として `contents: read` だけにすると、これまで動いていた job を新たに壊す。

2. **least-privilege の粒度判定**: top-level に `contents: read` を一律で置くと、job 個別の write 要求（deploy / `gh release` / OIDC `id-token: write` / baseline 更新の `contents: write`）と衝突する。`playwright-visual-baseline-update.yml`（job-level `contents: write` / `pull-requests: write`）や `web-cd.yml`（job-level `contents: read`）のように job-level 宣言を持つものは、top-level を最小に保ちつつ job-level で上書きする構造を崩さないこと。workflow ごとに必要権限を読み解く調査コストがある。

3. **actionlint local 未実行**: 親タスクでは local に actionlint が無く（command not found）、workflow 変更は構造レビューのみで、最終検証は CI の actionlint step（`ci.yml:52-56` が 1.7.7 を download し全 workflow を lint）に委ねた。この監査も同様に、local 検証が困難な場合は CI gate を最終検証とする前提を明記する必要がある。先に CI を通すのではなく、構造レビュー（手順 3.2 の grep 確認）で自己検証してから push する。

---

## 5. 完了条件チェックリスト

- [ ] `backend-ci.yml` に top-level `permissions:`（必要権限の根拠メモ付き）を追加した。
- [ ] `d1-migration-verify.yml` に top-level `permissions:` を追加した。
- [ ] `e2e-tests.yml` に top-level `permissions:` を追加した。
- [ ] `lighthouse.yml` に top-level `permissions:` を追加した。
- [ ] `playwright-smoke.yml` に top-level `permissions:` を追加した。
- [ ] `playwright-visual-baseline-update.yml` に top-level `permissions:` を追加した（job-level の `contents: write` / `pull-requests: write` を維持）。
- [ ] `playwright-visual-full.yml` に top-level `permissions:` を追加した。
- [ ] `validate-build.yml` に top-level `permissions:` を追加した。
- [ ] `verify-design-tokens.yml` に top-level `permissions:` を追加した。
- [ ] `verify-esbuild.yml` に top-level `permissions:` を追加した。
- [ ] `verify-primitive-adoption.yml` に top-level `permissions:` を追加した。
- [ ] `web-cd.yml` に top-level `permissions:` を追加した（job-level 宣言と矛盾しない最小値）。
- [ ] 既存 permissions 保有 workflow（`ci.yml` / `runtime-smoke-staging.yml` 等）の過剰判定を実施し、結果をメモした。
- [ ] actionlint（`ci.yml:52-56` 相当、1.7.7）が全 workflow に対し PASS する（local もしくは CI gate で確認）。
- [ ] required status check の context 名（job 名・job key）を一切変更していないことを diff で確認した。
- [ ] workflow のロジック / トリガー / secret を変更していない。

---

## 6. 参照情報

- 親タスク: `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/`
- 発見元 phase: `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/unassigned-task-detection.md`（2回目検証 follow-up）
- `.github/workflows/ci.yml`（`permissions: contents: read` = `:15-16`、actionlint step = `:52-56`）
- `.github/workflows/runtime-smoke-staging.yml`（`permissions: contents: read` = `:15-16`）
- `.github/workflows/web-cd.yml`（job-level `contents: read` = `:19-20`, `:68-69`）
- `.github/workflows/playwright-visual-baseline-update.yml`（job-level `contents: write` / `pull-requests: write` = `:15-17`、`git push` = `:114` 付近）
- `CLAUDE.md` ブランチ戦略節（required status check context 名の不変条件）
- GitHub Actions docs: workflow / job レベル `permissions` と `GITHUB_TOKEN` の権限縮退仕様

---

## 備考

Phase 13 の commit / push / PR はユーザー承認ゲートであり、本タスクの作成時点では実行しない。secret / token の実値は本タスクの全成果物において記述しない。
