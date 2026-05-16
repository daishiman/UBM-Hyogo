# task-02 — staging-runtime-smoke environment-scoped secrets 配置

`[実装区分: 実装仕様書]`

**判定根拠**:
GitHub Actions environment secret の投入は runtime 操作（`gh secret set --env`）だが、本タスクは
それ単体に閉じず、(1) `.github/workflows/runtime-smoke-staging.yml` への guard step 追加（Phase 03
アーキ参照）と、(2) reusable runbook を冪等な shell script `scripts/smoke/provision-staging-secrets.sh`
として新規追加する 2 つのコード変更を伴う。よって純粋な合意形成タスクではない。CONST_004（docs-only
spec）例外条件には合致しないため、`実装仕様書` として扱う。

**1 サイクル内完了適合（CONST_007）**: 投入は数秒、workflow guard 追加は数行、shellcheck/actionlint
は CI 内で完結。先送り・分割 PR なし。

**関連 Issue**:
- Issue #571 phase-11 の **G1（Environment / Secret 配置）承認実行段階**を昇格させる。
- 上位 workflow: `docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/`

**並列性**: task-01（`.github/workflows/web-cd.yml` の OpenNext Workers 化）と完全独立。並列実装可。

**承認境界**:
PR diff で実装するのは workflow guard と `scripts/smoke/provision-staging-secrets.sh` まで。GitHub Environment への secret 実値投入、runtime smoke rerun、Slack failure injection は外部状態変更を伴うため Phase 13 user approval 後にだけ実行し、承認前の placeholder を PASS evidence と扱わない。

---

## Phase 1 — Context（背景・現状）

`docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/design/phase-01-context.md`「事実 2」より:

- `.github/workflows/runtime-smoke-staging.yml` line 23–46 は `environment: staging-runtime-smoke`
  配下で `${{ secrets.STAGING_API_BASE }}` 等 5 件を env マッピング済み。
- `.github/workflows/backend-ci.yml` line 124–129 は reusable workflow を `secrets: inherit` で呼ぶ。
- `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` の応答は
  **`{"total_count":0,"secrets":[]}`**（0 件）。
- repository-scoped secrets / variables にも `STAGING_*` は未登録。
- `scripts/smoke/runtime-attendance-provider.sh` line 57–60 は `: "${STAGING_API_BASE:?...}"` 等 4 件の
  必須チェックを持ち、不在時は exit 2 で即停止する。
- `scripts/smoke/ci-summary-post.sh` line 35–38 は `summary.json` 不在時にフォールバックなしで exit 1。

```
[Task B 因果]
environment "staging-runtime-smoke" 作成済 / secrets 0 件
  └─ workflow が空文字列を env 注入
      └─ runtime-attendance-provider.sh L57 :? で exit 2
          └─ summary.json 未生成
              └─ ci-summary-post.sh で「not found」→ ERROR
```

既存仕様:
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
  lines 150–167（Issue #571 staging runtime smoke section）が 5 件の environment-scoped 配置規約を正本化。
- `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-11.md` lines 40–58 に
  `op read` → `gh secret set --env` の投入コマンド群（**G1 承認待ち**ステータス）。

---

## Phase 2 — Requirements & Acceptance Criteria

Phase 02 設計書の REQ-B1 / REQ-B2 / REQ-B3 を AC 化する。

### AC-B1: 5 件の environment-scoped secret 配置（REQ-B1）

GitHub environment `staging-runtime-smoke` に以下 5 件が登録済みであること。

| secret name | 1Password 参照（実装時に `op item list` で実 path 確認） | 用途 |
|-------------|-----------------------------------------------------------|------|
| `STAGING_API_BASE` | `op://Cloudflare/UBM-Hyogo Staging/api-base-url` | smoke 対象 origin |
| `STAGING_ADMIN_BEARER` | `op://Cloudflare/UBM-Hyogo Staging/admin-bearer` | admin 認証 |
| `STAGING_MEMBER_ID` | `op://Cloudflare/UBM-Hyogo Staging/member-id` | smoke 対象 member |
| `STAGING_ME_BEARER` | `op://Cloudflare/UBM-Hyogo Staging/me-bearer` | member 認証 |
| `SLACK_WEBHOOK_INCIDENT` | `op://Cloudflare/UBM-Hyogo Shared/slack-webhook-incident` | 失敗通知 |

**検証**:
```
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
```
出力 5 行が上記 name 群に一致すること（順不同）。`total_count == 5`。

### AC-B2: smoke job が次回 dev push で green（REQ-B2）

secret 投入後、最初の `dev` branch への push（または manual `workflow_dispatch`）で
`runtime-smoke-staging` job が success となり、`ci-evidence/summary.json` が artifact として
download 可能であること。

### AC-B3: 値・token fragment が一切ログ等に出ない（REQ-B3）

- `provision-staging-secrets.sh` 実行ログに `op read` の出力（実値）が出現しないこと。
- `gh secret list --env staging-runtime-smoke` の出力に value 列が含まれない（gh CLI 仕様で name のみ）。
- workflow run log に `STAGING_*` の値が出現しない（`::add-mask::` 既存ステップで追加保護）。
- evidence ファイル群（Phase 11）は name と placement のみを記録し、値・hash・fragment を含まない。

---

## Phase 3 — Architecture / Detailed Design

### 変更対象一覧

| 種別 | パス | 内容 |
|------|------|------|
| **新規** | `scripts/smoke/provision-staging-secrets.sh` | 1Password → `gh secret set` の冪等 runbook を shell script として固定 |
| **編集** | `.github/workflows/runtime-smoke-staging.yml` | Slack 通知ステップに `if: failure() && hashFiles('ci-evidence/summary.json') != ''` 追加 |
| **runtime 操作（PR 外）** | GitHub environment `staging-runtime-smoke` | `bash scripts/smoke/provision-staging-secrets.sh` で 5 件分投入（user approval 後に実行者ローカルで） |
| **正本同期（編集）** | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Issue #571 セクションに provision script 参照行追加 |
| **正本同期（編集）** | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-11.md` | G1 手順を provision script 参照へ同期。secret 実投入は user approval 後まで PASS 扱いしない |

### 設計判断

1. **secret 投入は PR と独立**: `gh secret set` は GitHub 側の状態変更であり PR merge とは関係しない。
   shell script を repo に置く目的は「再現性のある runbook の固定化」と「将来の rotation 容易化」。
2. **`:?` 必須チェックは緩和しない**: `runtime-attendance-provider.sh` の `:?` は環境変数不在時の
   即停止を保証する。graceful skip にするのではなく、secrets 投入を本道として進める（CONST_007 整合）。
3. **workflow guard は二次セーフティネット**: Slack 通知ステップの `if:` ガードで、`summary.json`
   未生成時の連鎖 fail を抑止し「真の失敗ステップ」をログ上で識別しやすくする。primary fix ではない。
4. **staging marker check**: `STAGING_API_BASE` の値が real staging marker（`staging` / `-staging.` /
   `workers.dev` / `ubm-hyogo-web-staging` のいずれか）を含むことを **boolean 判定のみ**で確認。`localhost` / `127.0.0.1` は GitHub Actions runner から到達できないため拒否する。値そのものは
   stdout に出さない。production URL 誤投入の防衛線。
5. **op read 出力は変数に代入しない**: pipe チェーン (`op read ... | gh secret set ... --body -`)
   で揮発化する。変数バインドすると `set -x` 等で漏洩リスクが生じる。staging marker check 時のみ
   一時シェル変数に入れるが、その scope は関数内に閉じ、`unset` する。
6. **`set -x` 禁止**: provision script 全体で trace 出力を禁止。

---

## Phase 4 — Test Strategy

| レイヤ | 内容 | 期待結果 |
|--------|------|----------|
| 静的検査 | `bash -n scripts/smoke/provision-staging-secrets.sh` | syntax OK |
| 静的検査 | `shellcheck scripts/smoke/provision-staging-secrets.sh` | warning 0 件 |
| 静的検査 | `actionlint .github/workflows/runtime-smoke-staging.yml` | error 0 件 |
| 投入前 inventory | `gh secret list --env staging-runtime-smoke` | 0 件（または不足）であることを確認（値は表示されない） |
| 投入後 inventory | `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets[].name'` | 5 件すべて存在 |
| workflow re-run | 投入後の最初の dev push、または `gh workflow run runtime-smoke-staging.yml` | smoke job green、`ci-evidence/summary.json` artifact あり |
| redaction gate | `runtime-smoke-staging.yml` の既存 `redaction grep gate` ステップ | 既存どおり PASS（regression が無いこと） |
| 値漏洩監査 | `git grep -E '(STAGING_(API_BASE|ADMIN_BEARER|MEMBER_ID|ME_BEARER)|SLACK_WEBHOOK_INCIDENT)\s*=\s*[^$]'` 除外あり | 0 件 |

テスト実行は CI（既存 `lint-workflows` 系）と手元の shellcheck で完結する。新規ユニットテストは
作らない（YAGNI）。

---

## Phase 5 — Implementation Skeleton

### 5.1 `scripts/smoke/provision-staging-secrets.sh`（新規・完全コード）

```bash
#!/usr/bin/env bash
# Provision GitHub environment secrets for `staging-runtime-smoke`.
#
# 設計参照:
#   docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/design/phase-03-architecture.md
#   docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/tasks/
#     task-02-staging-runtime-smoke-secrets-provisioning/index.md
#
# 不変条件（INV-003 / INV-007 / CLAUDE.md「シークレット管理」）:
#   - secret 値・token fragment を一切 stdout / log / file に出さない
#   - `op read` の出力は変数バインドせず、pipe で `gh secret set --body -` に直流する
#   - environment-scoped でのみ配置する（repository-scoped に置かない）
#   - `set -x` 禁止
#
# 実行前提:
#   - 実行者がローカルで `op signin` 済みかつ session token 有効
#   - 実行者の `gh auth status` が `daishiman/UBM-Hyogo` への write 権限を持つ
set -euo pipefail

REPO="daishiman/UBM-Hyogo"
ENV_NAME="staging-runtime-smoke"

# (name, op-reference) の 5 件。順序は固定（再現性のため）。
SECRETS=(
  "STAGING_API_BASE:op://Cloudflare/UBM-Hyogo Staging/api-base-url"
  "STAGING_ADMIN_BEARER:op://Cloudflare/UBM-Hyogo Staging/admin-bearer"
  "STAGING_MEMBER_ID:op://Cloudflare/UBM-Hyogo Staging/member-id"
  "STAGING_ME_BEARER:op://Cloudflare/UBM-Hyogo Staging/me-bearer"
  "SLACK_WEBHOOK_INCIDENT:op://Cloudflare/UBM-Hyogo Shared/slack-webhook-incident"
)

usage() {
  cat <<'USAGE'
Usage: bash scripts/smoke/provision-staging-secrets.sh

Provision 5 environment-scoped secrets to GitHub environment
`staging-runtime-smoke` from 1Password references. Idempotent.

Prerequisites:
  - `op signin` (1Password CLI session) is active
  - `gh auth status` shows write access to daishiman/UBM-Hyogo

Outputs:
  - stdout: secret name only on each success line. Never values.
  - exit 0 on success; non-zero on any verification failure.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "::error::required command not found: $cmd" >&2
    exit 1
  fi
}

require_cmd op
require_cmd gh

# 1Password session 確認（実値は出さない。whoami は account 名のみ）
if ! op whoami >/dev/null 2>&1; then
  echo "::error::1Password CLI session is not active. Run 'op signin' first." >&2
  exit 1
fi

# gh auth 確認
if ! gh auth status >/dev/null 2>&1; then
  echo "::error::gh CLI is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

# staging marker check: STAGING_API_BASE の値が staging を指していることだけを boolean 判定。
# 値そのものは stdout に出さない（一時変数は関数 scope に閉じ、終了時に unset する）。
verify_staging_marker() {
  local ref="op://Cloudflare/UBM-Hyogo Staging/api-base-url"
  local value
  value="$(op read "$ref")"
  if printf '%s' "$value" | grep -qE '(staging|-staging\.|workers\.dev|ubm-hyogo-web-staging)'; then
    echo "PASS: STAGING_API_BASE staging marker detected (value not printed)"
  else
    echo "::error::STAGING_API_BASE does not look like a staging origin. Refusing to provision." >&2
    unset value
    exit 1
  fi
  unset value
}

verify_staging_marker

# 投入ループ。op read | gh secret set --body - の pipe で値を揮発化する。
for pair in "${SECRETS[@]}"; do
  name="${pair%%:*}"
  ref="${pair#*:}"
  if op read "$ref" \
    | gh secret set "$name" \
        --env "$ENV_NAME" \
        --repo "$REPO" \
        --body -; then
    echo "set: $name"
  else
    echo "::error::failed to set secret: $name" >&2
    exit 1
  fi
done

# 投入後 inventory verification（name のみ）
echo "---"
echo "verifying inventory:"
inventory="$(gh api "repos/${REPO}/environments/${ENV_NAME}/secrets" --jq '.secrets[].name' | sort)"
expected="$(printf '%s\n' "${SECRETS[@]}" | awk -F: '{print $1}' | sort)"

if [[ "$inventory" == "$expected" ]]; then
  printf '%s\n' "$inventory"
  echo "OK: 5 secrets present in environment '$ENV_NAME'"
else
  echo "::error::inventory mismatch" >&2
  echo "expected:" >&2
  printf '%s\n' "$expected" >&2
  echo "actual:" >&2
  printf '%s\n' "$inventory" >&2
  exit 1
fi
```

**関数シグネチャ相当**:
- `usage()` — stdout に使用法。副作用なし。
- `require_cmd <cmd>` — 入力: コマンド名 / 出力: なし / 副作用: 不在時 exit 1。
- `verify_staging_marker()` — 入力: なし / 出力: PASS 行のみ / 副作用: marker 不一致時 exit 1。値は never print。

### 5.2 `.github/workflows/runtime-smoke-staging.yml` 修正 diff

current line 65–74:

```yaml
      - name: post failure summary to Slack
        if: failure()
        env:
          SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
        run: |
          if [ -z "${SLACK_WEBHOOK_INCIDENT:-}" ]; then
            echo "::error::SLACK_WEBHOOK_INCIDENT is required for failure notification"
            exit 1
          fi
          bash scripts/smoke/ci-summary-post.sh ci-evidence
```

after（`if:` に `summary.json` 存在 guard を AND 結合。本文は維持）:

```yaml
      - name: post failure summary to Slack
        if: failure() && hashFiles('ci-evidence/summary.json') != ''
        env:
          SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
        run: |
          if [ -z "${SLACK_WEBHOOK_INCIDENT:-}" ]; then
            echo "::error::SLACK_WEBHOOK_INCIDENT is required for failure notification"
            exit 1
          fi
          bash scripts/smoke/ci-summary-post.sh ci-evidence
```

> 補足: `:?` 必須チェック（`runtime-attendance-provider.sh` 側）は維持する。secrets 投入を本道とし、
> guard は二次的セーフティネット（summary.json 未生成時の `ci-summary-post.sh` 起動を抑止し、
> 真の失敗 step「run runtime smoke」をログ上で識別しやすくする）。

### 5.3 secret 投入手順（runbook、人手実行 1 回 / rotation 時に再実行）

```bash
# 1Password CLI session を起動（実値は表示されない）
op signin

# provision script を実行（idempotent）
bash scripts/smoke/provision-staging-secrets.sh

# 投入後の name-only inventory を evidence として保存
mkdir -p docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/tasks/task-02-staging-runtime-smoke-secrets-provisioning/outputs/phase-11
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' \
  > docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/tasks/task-02-staging-runtime-smoke-secrets-provisioning/outputs/phase-11/secret-name-inventory.txt
```

### 入力・出力・副作用まとめ

| 項目 | 値 |
|------|----|
| 入力 | 1Password vault `Cloudflare`（5 items）/ 実行者の op session / 実行者の gh auth |
| 出力 | stdout: secret name と PASS/OK のみ。値は never print |
| 副作用 | GitHub environment `staging-runtime-smoke` 配下に 5 件の secret を作成または上書き（idempotent） |
| 失敗時 | exit 1。GitHub 側の状態は途中状態のまま残るが、再実行で収束（idempotent） |

---

## Phase 6 — Refactoring

- 共通ロジックは `scripts/smoke/provision-staging-secrets.sh` に閉じる。
- production 用 `provision-production-secrets.sh` は将来別タスクで派生（YAGNI: 本サイクルでは作らない）。
- 配列定義は (name, op-ref) ペアの単純配列とし、外部 YAML 化はしない（5 件、変更頻度低）。

---

## Phase 7 — Integration

- task-01（`web-cd` OpenNext Workers 化）と独立。並列に実装・merge してよい。
- 投入完了 + workflow guard merge 後、最初の `dev` push（または `gh workflow run runtime-smoke-staging.yml`）
  で smoke job が green になることをもって統合完了とする。
- `backend-ci.yml` の `runtime-smoke-staging` reusable workflow 呼び出し（`secrets: inherit`）は変更しない。

---

## Phase 8 — Performance

- `gh secret set` × 5 + inventory verification 1 回 ≈ **5 秒**。手元実行のみ、CI 時間への影響なし。
- workflow guard 追加分は `if:` の式評価のみで実質ゼロ。

---

## Phase 9 — Security & Operations

### Secret hygiene 規律

- `op read` の stdout を変数バインドしない（pipe チェーン内で揮発化）。
- staging marker check のみ一時的に変数に格納するが、関数 scope 内に閉じ即 `unset`。
- `set -x` を絶対に有効化しない。
- `gh secret set --body -` で stdin 注入することで、引数経由（`ps` 可視）の値露出を排除。
- ログ・docs・artifacts・PR body・commit message に値・hash・fragment を出さない。

### 既存保護機構との整合

- `runtime-smoke-staging.yml` の `mask staging credentials` ステップは継続（既存）。
- `redaction grep gate` ステップも継続（既存）。

### ローテーション手順

1. 1Password で対象 item の値を更新。
2. `bash scripts/smoke/provision-staging-secrets.sh` を再実行（idempotent: 上書き）。
3. 次の `dev` push または `gh workflow run runtime-smoke-staging.yml` で動作確認。

### 漏洩疑い時の rollback

```bash
for name in STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER SLACK_WEBHOOK_INCIDENT; do
  gh secret delete "$name" --env staging-runtime-smoke --repo daishiman/UBM-Hyogo
done
# 1Password 側で値を再生成 → provision script を再実行
```

削除後は smoke job が `:?` で fail するが、本番影響なし（staging のみ）。

---

## Phase 10 — Documentation 更新

### 10.1 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

Issue #571 セクション（lines 150–167）末尾に provision script への参照を 1 行追記する。

追加位置: line 167（`Before runtime execution, validate both name-only secret inventory ...` の直後）。

追加内容（diff イメージ）:

```diff
 - Before runtime execution, validate both name-only secret inventory and a value-without-printing staging marker check for `STAGING_API_BASE`.
+- Provisioning script: `scripts/smoke/provision-staging-secrets.sh` (idempotent; reads from 1Password via `op read`, writes via `gh secret set --env staging-runtime-smoke --body -`). Re-run on rotation.
```

### 10.2 `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-11.md`

「### G1 承認 — GitHub Environment / Secret 配置」セクションのステータス記述を更新する。

更新点:
- セクション直下に `**Status: prepared-local / pending user approval**` を追記し、承認後の実行コマンドを `bash scripts/smoke/provision-staging-secrets.sh` に一本化する。
- 投入コマンド例の冒頭に「以下は手動 runbook の正本だが、**実運用は `scripts/smoke/provision-staging-secrets.sh` を使う**」旨の 1 文を追加。

---

## Phase 11 — Acceptance Evidence（NON_VISUAL）

evidence canonical paths（`outputs/phase-11/` 配下）:

| ファイル | 取得コマンド / 内容 | 値漏洩懸念 |
|----------|-----------------------|-----------|
| `secret-name-inventory.txt` | `gh api .../staging-runtime-smoke/secrets --jq '.secrets[].name'` の出力（5 行）。値ハッシュ・updated_at すら含めない | なし（name のみ） |
| `gh-environment-check.json` | `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke` 全体。`secrets` フィールドは含まない（または name のみ抽出後に保存） | なし |
| `shellcheck.log` | `shellcheck scripts/smoke/provision-staging-secrets.sh` 出力 | なし |
| `actionlint.log` | `actionlint .github/workflows/runtime-smoke-staging.yml` 出力 | なし |
| `runtime-smoke-rerun-id.txt` | 投入後の最初の green run の `run_id`（数値のみ） | なし |
| `summary-json-exists.txt` | `gh run download <run_id> -n runtime-smoke-staging-<run_id> -D /tmp/x && ls -l /tmp/x/summary.json` の出力。**中身は転記しない** | なし（ls 出力のみ） |

NON_VISUAL: スクリーンショット不要。すべて text/json artifact。

---

## Phase 12 — Close-out Compliance

### 実装区分整合
- `[実装区分: 実装仕様書]` ✓ — Phase 1–13 を埋め、shell script 完全コードと yaml diff を提示済み。

### secret hygiene gate

```bash
git grep -E '(STAGING_(API_BASE|ADMIN_BEARER|MEMBER_ID|ME_BEARER)|SLACK_WEBHOOK_INCIDENT)\s*=\s*[^$]' \
  -- ':!docs' ':!.github' ':!scripts/smoke/provision-staging-secrets.sh'
```
→ **0 件であること**（除外対象は仕様書・workflow YAML（`${{ secrets.X }}` 形）・provision script の配列宣言）。

### placeholder token gate

```bash
git grep -E '(TODO|FIXME|XXX|REPLACE_ME|<your-)' \
  scripts/smoke/provision-staging-secrets.sh \
  docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/tasks/task-02-staging-runtime-smoke-secrets-provisioning/
```
→ 0 件。

### CONST_005 必須項目 self-check

- [x] 変更対象ファイル一覧（新規 1: provision script / 編集 1: workflow yaml / runtime 操作: gh secret set ×5 / 正本同期 編集 2 ファイル）
- [x] 関数シグネチャ相当（`usage` / `require_cmd` / `verify_staging_marker` + workflow step 名 `post failure summary to Slack`）
- [x] 入力・出力・副作用（op:// 参照 5 件入力 / GitHub env secret 5 件出力 / value never to stdout 副作用制約）
- [x] テスト方針（`bash -n` / `shellcheck` / `actionlint` / name-only inventory / re-run green / redaction gate 既存維持）
- [x] ローカル検証コマンド（Phase 5.3 runbook + Phase 4 検証コマンド逐語）
- [x] DoD（Phase 02 `task-02 DoD` 3 項目を逐語転記、下記）

### task-02 DoD（Phase 02 設計書からの逐語転記）

1. `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` の `total_count == 5`、name 一覧に上記 5 件すべて
2. 次の `runtime-smoke-staging` 実行が成功し、`ci-evidence/summary.json` artifact が download 可能
3. secret 値が secrets 一覧の `name`（フィールド）以外に出力されていない

---

## Phase 13 — PR / Commit Plan

### branch 名
`fix/staging-runtime-smoke-secrets-provisioning`

### commit メッセージ
```
fix(ci): provision staging-runtime-smoke env secrets and harden post step

- add scripts/smoke/provision-staging-secrets.sh (idempotent op->gh runbook)
- harden runtime-smoke-staging.yml: gate Slack post on summary.json existence
- update Issue #571 phase-11 G1 status & deployment-secrets-management ref

evidence: docs/30-workflows/ci-pipeline-recovery-web-cd-and-runtime-smoke/
  tasks/task-02-staging-runtime-smoke-secrets-provisioning/outputs/phase-11/
```

### PR base
`dev`

### secret 投入操作の実行タイミング

`gh secret set --env staging-runtime-smoke ...` は **PR とは独立に、実行者ローカルで `bash scripts/smoke/provision-staging-secrets.sh` を実行することで完了**する。

- PR merge では GitHub environment の secret 状態は変わらない（GitHub Actions は repo 内ファイルしか参照しない、secret 状態はリポジトリ設定として別管理）。
- したがって `gh pr merge` の前後どちらに投入を行っても良いが、推奨順序は次のとおり:
  1. PR 作成前に `bash scripts/smoke/provision-staging-secrets.sh` をローカル実行し、AC-B1 を満たす。
  2. PR を `dev` にマージ。
  3. マージ後の最初の `dev` push CI で AC-B2 を満たすことを確認。
  4. evidence を `outputs/phase-11/` に格納し、確認済みなら本仕様書の Phase 12 self-check 結果を runtime completed として更新。

### 残課題

なし（CONST_007: 1 サイクル内完了）。
