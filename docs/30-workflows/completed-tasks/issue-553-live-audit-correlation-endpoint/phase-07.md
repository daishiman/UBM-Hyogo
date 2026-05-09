# Phase 7: CI/CD 統合（`audit-correlation-verify.yml` に live mode grep gate 追加）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| Source | `outputs/phase-7/phase-7.md` |
| 区分 | 実装（GitHub Actions） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5 / Phase 6 で追加した live wiring（apps/api 配下の Worker route + scheduled handler + persist + Slack notify、scripts 配下の `--mode=live`、runbook 追記）に対して、redact-safe 不変条件を CI で恒久化する。具体的には `.github/workflows/audit-correlation-verify.yml` に **live mode grep gate ジョブ** を追加し、`grep -F` で literal 検出（Slack webhook URL / PAT literal / salt literal / internal token literal）をかけ、ヒットすれば fail させる。`fixtures/` 配下は除外。`actionlint` / `shellcheck` は既存通り pass を維持。

親 Issue #516 で実装済の workflow 構造（`mise-action` → `pnpm install --frozen-lockfile` → typecheck → lint → vitest → bats → shellcheck → actionlint）を踏襲し、live mode 専用の追加ステップとジョブを最小差分で重ねる。

## 実行タスク

1. `.github/workflows/audit-correlation-verify.yml` のトリガ paths に live wiring 関連パス（`apps/api/src/routes/audit-correlation/**`、`apps/api/migrations/0017_audit_correlation_findings.sql`、`docs/runbooks/audit-correlation.md`）を追加する。
2. 既存 `verify` ジョブに live wiring の typecheck/lint/vitest を含める（`apps/api/src/routes/audit-correlation` の test path を追加）。
3. **新規ジョブ `redact-grep-gate`** を追加。`grep -F` で literal 検出をかけ、ヒット時 fail する。
4. 既存 `actionlint` / `shellcheck` ステップが live wiring 追加後も clean であることを確認する。
5. `live-mode.bats` を bats ステップに追加する。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `.github/workflows/audit-correlation-verify.yml` | 編集 | live mode grep gate ジョブ追加 + paths 追加 + live-mode.bats 追加 |

## 実装手順

### 1. workflow 全体構成

```yaml
name: audit-correlation-verify

on:
  pull_request:
    paths:
      - 'apps/api/src/audit-correlation/**'
      - 'apps/api/src/routes/audit-correlation/**'
      - 'apps/api/migrations/0017_audit_correlation_findings.sql'
      - 'apps/api/src/index.ts'
      - 'apps/api/wrangler.toml'
      - 'scripts/audit-correlation/**'
      - 'docs/runbooks/audit-correlation.md'
      - '.github/workflows/audit-correlation-verify.yml'
  push:
    branches: [main, dev]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - name: Install dependencies
        run: mise exec -- pnpm install --frozen-lockfile
      - name: Typecheck
        run: mise exec -- pnpm --filter @ubm-hyogo/api typecheck
      - name: Lint
        run: mise exec -- pnpm --filter @ubm-hyogo/api lint
      - name: Vitest (audit-correlation core)
        run: mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation
      - name: Vitest (audit-correlation route)
        run: mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/audit-correlation
      - name: Install bats and shellcheck
        run: sudo apt-get update && sudo apt-get install -y bats shellcheck
      - name: bats grep-gate (fixture)
        run: mise exec -- bats scripts/audit-correlation/__tests__/grep-gate.bats
      - name: bats runner determinism (fixture)
        run: mise exec -- bats scripts/audit-correlation/__tests__/runner-determinism.bats
      - name: bats live-mode
        run: mise exec -- bats scripts/audit-correlation/__tests__/live-mode.bats
      - name: shellcheck
        run: shellcheck scripts/audit-correlation/*.sh
      - name: actionlint
        run: |
          bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
          ./actionlint -color .github/workflows/audit-correlation-verify.yml

  redact-grep-gate:
    runs-on: ubuntu-24.04
    needs: []
    steps:
      - uses: actions/checkout@v4
      - name: Build search target list (excluding fixtures/)
        id: targets
        run: |
          {
            echo 'paths<<EOF'
            git ls-files \
              'apps/api/src/audit-correlation/**' \
              'apps/api/src/routes/audit-correlation/**' \
              'apps/api/migrations/0017_audit_correlation_findings.sql' \
              'scripts/audit-correlation/**' \
              'docs/runbooks/audit-correlation.md' \
              | grep -v '/fixtures/' \
              || true
            echo EOF
          } >> "$GITHUB_OUTPUT"
      - name: Grep gate - Slack webhook URL literal
        run: |
          # Slack incoming webhook URL prefix を literal 検出
          paths='${{ steps.targets.outputs.paths }}'
          if [ -z "$paths" ]; then echo "no targets"; exit 0; fi
          # shellcheck disable=SC2086
          if echo "$paths" | xargs grep -F -n 'https://hooks.slack.com/services/'; then
            echo "::error::Slack webhook URL literal detected. Use env reference (op://...) only." >&2
            exit 1
          fi
      - name: Grep gate - GitHub PAT literal prefixes
        run: |
          paths='${{ steps.targets.outputs.paths }}'
          if [ -z "$paths" ]; then exit 0; fi
          # ghp_ / github_pat_ プレフィックスを literal 検出
          # shellcheck disable=SC2086
          if echo "$paths" | xargs grep -F -n -e 'ghp_' -e 'github_pat_'; then
            echo "::error::GitHub PAT literal prefix detected. Use op:// references only." >&2
            exit 1
          fi
      - name: Grep gate - audit correlation salt literal
        run: |
          paths='${{ steps.targets.outputs.paths }}'
          if [ -z "$paths" ]; then exit 0; fi
          # 既知の本番 salt literal が誤って commit されていないか
          # （正本値は 1Password に保管。test-salt-do-not-use-in-prod は fixtures/ のみ許容）
          # shellcheck disable=SC2086
          if echo "$paths" | xargs grep -F -n 'AUDIT_CORRELATION_SALT_VALUE='; then
            echo "::error::Salt literal assignment detected. Salt must be injected via Cloudflare Secrets only." >&2
            exit 1
          fi
      - name: Grep gate - internal token literal
        run: |
          paths='${{ steps.targets.outputs.paths }}'
          if [ -z "$paths" ]; then exit 0; fi
          # shellcheck disable=SC2086
          if echo "$paths" | xargs grep -F -n 'AUDIT_CORRELATION_INTERNAL_TOKEN_VALUE='; then
            echo "::error::Internal token literal assignment detected." >&2
            exit 1
          fi
```

不変条件:
- すべての検出は `grep -F`（fixed string）で行い、誤検知を最小化する。
- 検索対象から `fixtures/` を除外（fixture には dummy literal が含まれる前提）。
- `xargs grep` の exit code 1（マッチなし）を許容するため、明示的に `if echo ... | xargs grep -F`形で「マッチがあれば fail」を表現する。
- `paths` が空のとき `xargs` が引数なしで `grep` を呼んで stdin 待ちにならないよう、空チェックでガードする。
- `actionlint` / `shellcheck` は workflow 自身に対しても clean を維持する（既存ステップで自己検証）。

### 2. fixtures/ 除外の根拠

- `scripts/audit-correlation/fixtures/` には `test-salt-do-not-use-in-prod` などの dummy literal が意図的に含まれる。
- 本番 redact-safe 不変条件は「fixtures/ 配下を除く実装コード / migration / runbook / scripts 本体」に対して適用する。
- 除外フィルタは `grep -v '/fixtures/'` で実装する。

### 3. 既存ジョブとの整合

- 既存 `verify` ジョブ単独で済んでいた構造に **`redact-grep-gate` を別ジョブ** として追加することで、grep gate の fail と test fail を切り分けやすくする。
- branch protection 必須化は本タスクスコープ外（Phase 12 の TODO として記録）。

## テスト方針

| 種別 | 内容 |
| --- | --- |
| actionlint | `actionlint -color .github/workflows/audit-correlation-verify.yml` clean |
| shellcheck | `shellcheck` で workflow 内 `run:` ブロックの bash が clean（actionlint が embedded shellcheck を呼ぶ） |
| grep gate self-test | ローカルで意図的に `https://hooks.slack.com/services/T000/B000/xxx` を検出対象パスに含めると fail することを 1 度確認（確認後は revert） |
| 既存ジョブ regression | typecheck / lint / vitest / bats / shellcheck / actionlint が green を維持 |

## ローカル実行・検証コマンド

```bash
# actionlint local
mise exec -- bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
./actionlint -color .github/workflows/audit-correlation-verify.yml

# 手動で grep gate を再現
git ls-files \
  'apps/api/src/audit-correlation/**' \
  'apps/api/src/routes/audit-correlation/**' \
  'apps/api/migrations/0017_audit_correlation_findings.sql' \
  'scripts/audit-correlation/**' \
  'docs/runbooks/audit-correlation.md' \
  | grep -v '/fixtures/' \
  | xargs grep -F -n 'https://hooks.slack.com/services/' || echo "OK: no slack literal"

git ls-files \
  'apps/api/src/audit-correlation/**' \
  'apps/api/src/routes/audit-correlation/**' \
  'scripts/audit-correlation/**' \
  | grep -v '/fixtures/' \
  | xargs grep -F -n -e 'ghp_' -e 'github_pat_' || echo "OK: no PAT literal"

# shellcheck (workflow 配下の run: は actionlint で検証されるが、scripts は単独でも実行)
mise exec -- shellcheck scripts/audit-correlation/*.sh
```

## 統合テスト連携

- 上流: Phase 5 / Phase 6 の実装ファイル群が grep gate の検査対象となる。
- 下流: Phase 11 の evidence 収集で本 workflow の green run URL を記録。Phase 13 PR で `audit-correlation-verify` の status check を確認する。
- branch protection への required status check 追加は Phase 12 の TODO として記録（本 Phase では設定変更しない）。

## 参照資料

- `docs/30-workflows/issue-553-live-audit-correlation-endpoint/phase-05.md`
- `docs/30-workflows/issue-553-live-audit-correlation-endpoint/phase-06.md`
- `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-07.md`（既存 workflow 構造の正本）
- 既存 `.github/workflows/audit-correlation-verify.yml`
- CLAUDE.md「Governance / CODEOWNERS」「シークレット管理」
- actionlint: <https://github.com/rhysd/actionlint>
- `grep -F`（fixed string）man page

## 成果物（`outputs/phase-7/phase-7.md`）

- 編集後の `audit-correlation-verify.yml` 全文
- live mode grep gate ジョブ `redact-grep-gate` を別ジョブにした設計判断
- `fixtures/` 除外フィルタ採用根拠
- `grep -F` literal 検出方針の理由
- 必須 status check 登録は Phase 12 TODO として記録した旨

## 完了条件（DoD）

- [ ] `.github/workflows/audit-correlation-verify.yml` に `redact-grep-gate` ジョブが追加され、Slack webhook URL / PAT literal / salt literal assignment / internal token literal assignment の 4 検出が `grep -F` で行われている。
- [ ] `fixtures/` 配下が除外フィルタ（`grep -v '/fixtures/'`）で正しく除外されている。
- [ ] `actionlint -color .github/workflows/audit-correlation-verify.yml` clean。
- [ ] `shellcheck scripts/audit-correlation/*.sh` clean。
- [ ] `verify` ジョブに `live-mode.bats` ステップと `apps/api/src/routes/audit-correlation` の vitest ステップが追加されている。
- [ ] PR 上で workflow が走り、`verify` / `redact-grep-gate` 両ジョブが green。
- [ ] 意図的な literal 注入実験で grep gate が fail することを 1 度確認済み（確認後 revert / commit しない）。
