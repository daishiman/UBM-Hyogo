# Implementation Guide — Stage 3 (Issue #608)

## Part 1: 中学生レベル

テストを「見るだけ」ではなく、「合格しないと合体できない鍵」にする作業です。

E2E は 3 種類のブラウザ（Chrome / Firefox / mobile WebKit）で動きますが、ブランチプロテクションが必要とするのは `e2e-tests-coverage-gate` という 1 つのまとめ役だけ。まとめ役は「3 ブラウザ全部成功」と「coverage 80% 以上」を一度に確認するので、鍵を増やさずに守る範囲は据え置きます。Lighthouse の鍵 `lighthouse-ci` も追加し、サーバー起動待ちは `wait-on` という安定した道具に置き換えました。

## Part 2: 技術者向け概要

- Desired contexts manifest: `.github/branch-protection/{dev,main}.json`
- Governance-invariant apply: `.github/branch-protection/apply.sh`
- Drift verifier: `scripts/verify-branch-protection.sh`
- Lighthouse readiness: `.github/workflows/lighthouse.yml` で `nohup` + `pnpm dlx wait-on`
- Branch protection の operational SSOT は GitHub 側 fresh GET。repo 側 JSON は `contexts` と `strict` の desired-state manifest

## 変更ファイル一覧（PR scope）

| パス | 種別 | 目的 |
| --- | --- | --- |
| `.github/branch-protection/dev.json` | 新規 | dev desired contexts + strict |
| `.github/branch-protection/main.json` | 新規 | main desired contexts + strict |
| `.github/branch-protection/apply.sh` | 新規 | fresh GET → contexts swap → CLAUDE.md INV 正規化 → optional preserve |
| `.github/branch-protection/README.md` | 新規 | 最小 apply / verify 手順 |
| `scripts/verify-branch-protection.sh` | 編集 | desired manifest 比較 + INV hard check + `OK(<branch>): no drift` |
| `.github/workflows/lighthouse.yml` | 編集 | `nohup` + `wait-on`、`pull_request.branches=[dev,main]` |
| `.github/workflows/ci.yml` | 編集 | actionlint 対象を全 workflow YAML に拡張 |
| `docs/30-workflows/e2e-quality-uplift-stage-3/` | 編集 | phase 1..13 と outputs/phase-11..12 を current 実装に整合 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 | Stage 3 完了状態を反映（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | Stage 3 行を更新（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | Stage 3 evidence boundary 更新（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md` | 編集 | Stage 3 status / Current Facts 行を最新化（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 編集 | desired manifest と operational SSOT の境界規則を追記（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/references/quality-e2e-testing.md` | 編集 | `lighthouse-ci` wait-on readiness pattern を追記（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` | 編集 | L-E2EQU-S3A-001..003 を追記（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/changelog/20260512-e2e-quality-uplift-stage-3-issue-608.md` | 新規 | 同期記録（Phase 2 で実施） |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 編集 | ヘッドラインに 1 行追記（Phase 2 で実施） |

## 主要設計判断（Phase 2 / 3 由来）

- **D-1**: branch protection は GitHub 実値が正本。repo 内 JSON は `contexts` / `strict` の desired-state manifest に限定する。
- **D-2**: required contexts = `ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`。matrix shard 個別の `e2e (<project>)` は採用しない。
- **D-3**: `apply.sh` は fresh GET → contexts 差し替え → CLAUDE.md 4 不変条件 (`required_pull_request_reviews=null`, `enforce_admins=true`, `required_linear_history=true`, `lock_branch=false`) 正規化 → optional fields 保持。
- **D-4**: lighthouse 起動 step は `nohup` 起動 + `pnpm dlx wait-on -t 120000`。旧 `for i in {1..60}` retry loop は廃止。
- **D-5**: pre/post snapshot は read-only `gh api GET`、`jq -S` で sort 出力。

## 苦戦箇所（後段 lessons-learned へ昇格対象）

1. **PR 範囲外の governance drift を巻き込むかの判断**: pre snapshot 時点で `enforce_admins=false` / `required_linear_history=false` が CLAUDE.md 宣言と drift。Issue #608 の scope は `required_status_checks.contexts` のみだが、PUT payload が全体形を要求するため「CLAUDE.md 不変条件として宣言済みの field は同時に正規化、それ以外は fresh GET 保持」という境界線を Phase 3 R-2 で確定した。
2. **集約 required context の選択（matrix vs aggregate）**: 早期案では `e2e (desktop-chromium)` / `e2e (desktop-firefox)` / `e2e (mobile-webkit)` を 3 件 required 化する案があったが、運用面の drift 面積が増えるだけで保証は重複する。`e2e-tests-coverage-gate` の集約 job 1 件採用に倒した。
3. **lighthouse readiness の手作り loop**: 旧 step は `for i in {1..60}; do curl ...; done` の retry loop で、SIGTERM 漏れ・PID 未保存・ログ未収集が併発し CI 上で flaky だった。`nohup` + `wait-on` + PID ファイル化で post-step 整理可能に。
4. **`main` PR への lighthouse 発火経路**: 旧 `lighthouse.yml` は `pull_request.branches` が dev だけだった。main 向け branch protection で required 化すると main PR で check が生成されず blocker になるため、`branches: [dev, main]` に拡張。

## 検証方法（適用後）

```bash
# 1. drift 検査
bash scripts/verify-branch-protection.sh
# 期待: 末尾に `OK(dev): no drift` / `OK(main): no drift` + PASS branch protection verification

# 2. required contexts の機械可読確認
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts | sort'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts | sort'
# 期待: ["Validate Build","ci","coverage-gate","e2e-tests-coverage-gate","lighthouse-ci"]

# 3. CLAUDE.md 不変条件
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '{reviews: .required_pull_request_reviews, enforce: .enforce_admins.enabled, linear: .required_linear_history.enabled, lock: .lock_branch.enabled}'
# 期待: {reviews:null, enforce:true, linear:true, lock:false}

# 4. lighthouse 実行（user-gated）
gh workflow run lighthouse.yml --ref dev
gh run watch
```

## Roll-back 手順

1. Phase 11 の pre snapshot を読み込む:
   ```bash
   PRE_DEV=docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-dev-pre.json
   ```
2. pre snapshot の `required_status_checks.contexts` を取り出し、一時 desired manifest として書き出す:
   ```bash
   jq '{strict: .required_status_checks.strict, contexts: .required_status_checks.contexts}' \
     "$PRE_DEV" > /tmp/dev-rollback.json
   ```
3. `apply.sh` の差し替え対象を `/tmp/dev-rollback.json` に向けて手動再 PUT、または直接 `gh api -X PUT` で contexts を pre 値に戻す。
4. CLAUDE.md 不変条件は drift が「意図的修正」だったため、roll-back 時は `enforce_admins` / `required_linear_history` を pre 値に戻すかどうかを **user に判断委譲**する（一括 rollback は推奨しない）。
5. `bash scripts/verify-branch-protection.sh` で drift 解消を確認。
6. `.github/branch-protection/{dev,main}.json` / `apply.sh` / `scripts/verify-branch-protection.sh` / `.github/workflows/lighthouse.yml` のファイル変更は `git revert <commit>` で戻す。

## 残 runtime evidence（user-gated）

- `gh pr checks <pr>` の required-context 表示キャプチャ（`outputs/phase-11/runtime-evidence/pr-checks.txt`）
- `lighthouse.yml` の `workflow_dispatch` 成功 run ログ（`outputs/phase-11/runtime-evidence/lighthouse-run.txt`）

これらが揃った段階で `workflow_state` を `implemented_local_runtime_pending` → `completed` に昇格する。
