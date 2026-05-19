# Phase 4: テスト計画

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. テスト対象と方針

本サイクルは「周辺強化 5 件」を実コード変更として実装するため、各変更ごとに静的解析（`shellcheck` / `actionlint` / markdown lint）と shell unit test（plain bash spec 形式）の二層で検証する。実 OIDC token は発行しないため runtime test は行わず、すべて静的・dry-run のみ。

| 周辺強化 | 対象ファイル | 検証種別 | 検証ツール |
|---|---|---|---|
| (1) claim pin dry-run helper | `scripts/oidc/verify-claim-pin.sh` | shell static + unit test | `shellcheck` / plain bash spec |
| (2) redaction JWT + cf-aud 拡張 | `scripts/redaction-check.sh` | shell static + 追加 fixture test + 既存 regression | `shellcheck` / plain bash spec |
| (3) observation window workflow 雛形 | `.github/workflows/oidc-observation-window.yml` | YAML static + schema | `actionlint` / `yamllint` |
| (4) deployment-secrets-management.md 反映 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | markdown lint + 構造 grep | `lefthook` md-lint / `grep` |
| (5) web-cd.yml 根拠コメント | `.github/workflows/web-cd.yml` | YAML static + diff guard | `actionlint` / `git diff --shortstat` |

## 2. 周辺強化別 test plan

### 2.1 claim pin dry-run helper

| 観点 | 内容 |
|---|---|
| 配置 | `scripts/oidc/__tests__/verify-claim-pin.spec.sh` |
| 前提 | `shellcheck` と plain bash spec をローカルで実行可能 |
| 副作用 | なし（外部 API 呼び出し禁止） |
| 既存 regression | 既存 `scripts/__tests__/` の sh test に影響を出さないこと |

#### 2.1.1 ケース表（subject claim 4 軸 → exit code）

| # | repository | ref | environment | event_name | 期待 exit | 期待 stderr |
|---|---|---|---|---|---|---|
| 1 | `daishiman/UBM-Hyogo` | `refs/heads/main` | `production` | `push` | 0 | （なし） |
| 2 | `daishiman/UBM-Hyogo` | `refs/heads/dev` | `staging` | `push` | 0 | （なし） |
| 3 | `daishiman/OTHER-REPO` | `refs/heads/main` | `production` | `push` | 1 | `MISMATCH repository:` を 1 行含む |
| 4 | `daishiman/UBM-Hyogo` | `refs/heads/feature/foo` | `production` | `push` | 1 | `MISMATCH ref:` を 1 行含む |
| 5 | `daishiman/UBM-Hyogo` | `refs/heads/main` | `staging` | `push` | 1 | `MISMATCH environment:` を 1 行含む（ref/env 対応不一致） |
| 6 | `daishiman/UBM-Hyogo` | `refs/heads/main` | `production` | `pull_request` | 1 | `MISMATCH event_name:` を 1 行含む |
| 7 | （`--repository` 省略） | `refs/heads/main` | `production` | `push` | 2 | usage 行を含む |
| 8 | （全引数省略） | — | — | — | 2 | usage 行を含む |

#### 2.1.2 検証コマンド

```bash
shellcheck scripts/oidc/verify-claim-pin.sh scripts/oidc/__tests__/verify-claim-pin.spec.sh
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh
```

#### 2.1.3 DoD

- [ ] `shellcheck` 警告 0 件
- [ ] 上記 9 ケースすべて PASS
- [ ] 外部 API call / OIDC token 発行が発生しない（trace / strace 確認は不要、code review で担保）

### 2.2 redaction-check.sh の JWT + cf-aud 拡張

| 観点 | 内容 |
|---|---|
| 配置 | `scripts/__tests__/redaction-check.test.sh`（既存テスト directory が `scripts/__tests__/redaction/` であればそちらに合わせる） |
| fixture | `scripts/__tests__/tmp-fixtures/`（JWT 含む log / cf-aud 含む log / clean log / pnpm-lock integrity 風 log / 既存 ACCOUNT_ID leak log） |
| 互換 | 既存の ACCOUNT_ID / token-like 検出 regression が PASS |

#### 2.2.1 ケース表（input → expected redaction）

| # | input fixture | 期待 exit | 期待 `::error::` 行 |
|---|---|---|---|
| R1 | `auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part_abcdef` | 非ゼロ | `JWT-like token detected in log` |
| R2 | `claim: cloudflare-aud=foo` | 非ゼロ | `cloudflare-aud claim detected in log` |
| R3 | `OK: deploy completed, no secrets` | 0 | （`::error::` 行なし） |
| R4 | `integrity: sha512-eyJxxxx` 風（`.` を含まない base64） | 0 | （JWT 誤検出なし） |
| R5 | `account_id=00000000000000000000000000000000`（既存 32-hex pattern） | 非ゼロ | 既存 ACCOUNT_ID leak 行（regression） |
| R6 | R1 と R2 を 1 ファイルで両方含む | 非ゼロ | JWT + cf-aud の両 `::error::` 行 |
| R7 | clean log（空ファイル） | 0 | （`::error::` 行なし） |

#### 2.2.2 検証コマンド

```bash
shellcheck scripts/redaction-check.sh scripts/__tests__/redaction-check.test.sh
bash scripts/__tests__/redaction-check.test.sh
```

#### 2.2.3 DoD

- [ ] `shellcheck` 警告 0 件（既存 baseline からの increment 0）
- [ ] 新規 7 ケースすべて PASS
- [ ] 既存 ACCOUNT_ID / token-like 検出ケース regression 0 件
- [ ] R4 で JWT regex が `pnpm-lock.yaml` integrity hash を誤検出しないこと

### 2.3 observation window workflow 雛形

| 観点 | 内容 |
|---|---|
| 検証 | `actionlint` で schema PASS / `yamllint` で format PASS |
| trigger guard | `grep -E "^on:" -A 5 .github/workflows/oidc-observation-window.yml` で `workflow_dispatch` のみ含むこと |
| permission guard | `grep -E "id-token" .github/workflows/oidc-observation-window.yml` がヒット 0 件であること |

#### 2.3.1 ケース表

| # | 観点 | 検証コマンド | 期待 |
|---|---|---|---|
| W1 | `actionlint` PASS | `actionlint .github/workflows/oidc-observation-window.yml` | exit 0 |
| W2 | `workflow_dispatch` only | `rg -n "^on:" -A 5 .github/workflows/oidc-observation-window.yml` | `push` / `schedule` を含まない |
| W3 | `id-token: write` 未付与 | `rg -n "id-token" .github/workflows/oidc-observation-window.yml` | match 0 件 |
| W4 | `permissions: contents: read` のみ | `rg -n "permissions:" -A 3 .github/workflows/oidc-observation-window.yml` | `contents: read` のみ |
| W5 | no-op verifier の echo 構造 | `rg -n "observation window manual gate" .github/workflows/oidc-observation-window.yml` | match 1 件以上 |

#### 2.3.2 DoD

- [ ] `actionlint` 警告 0 件
- [ ] W1-W5 すべて期待を満たす

### 2.4 deployment-secrets-management.md 反映

| 観点 | 内容 |
|---|---|
| 検証 | markdown lint（既存 lefthook 設定）+ 構造 grep |
| 構造 grep | `## OIDC Future Supported Path Gate（issue-762 反映）` 見出し存在、G1-G4 行存在、`current safe baseline（2026-05-17 時点）` セクション存在 |

#### 2.4.1 ケース表

| # | 検証コマンド | 期待 |
|---|---|---|
| D1 | `rg -n "OIDC Future Supported Path Gate" .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | match 1 件 |
| D2 | `rg -n "^\| G[1-4] \|" .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 4 件 |
| D3 | `rg -n "current safe baseline（2026-05-17 時点）" .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | match 1 件 |
| D4 | lefthook markdown lint | exit 0 |

#### 2.4.2 DoD

- [ ] D1-D4 すべて PASS
- [ ] 既存セクションの heading / 順序が破壊されていない

### 2.5 web-cd.yml 根拠コメント

| 観点 | 内容 |
|---|---|
| 検証 | `actionlint` PASS / diff がコメント追加のみであること |
| diff guard | `git diff dev -- .github/workflows/web-cd.yml | rg -v '^[+-]\s*#'` が `+` / `-` 行を含まないこと（ただし context 行除く） |

#### 2.5.1 ケース表

| # | 検証コマンド | 期待 |
|---|---|---|
| C1 | `actionlint .github/workflows/web-cd.yml` | exit 0 |
| C2 | `rg -c "NOTE\(issue-762\)" .github/workflows/web-cd.yml` | 2（staging / production 2 箇所） |
| C3 | `git diff dev -- .github/workflows/web-cd.yml` 中の non-comment 変更行 | 0 件（コメント追加のみ） |
| C4 | `rg -n "id-token" .github/workflows/web-cd.yml` | match 0 件（本サイクルで付与しない） |

#### 2.5.2 DoD

- [ ] C1-C4 すべて PASS
- [ ] deploy step の `env:` / `with:` 構造が不変

## 3. CI gate との整合性確認方針

| CI gate | 影響 | 整合性確認 |
|---|---|---|
| `actionlint` (`.github/workflows/*.yml`) | 新規 workflow 1 件追加・既存 workflow 編集 1 件 | 両 yml が `actionlint` PASS であること（§2.3 W1 / §2.5 C1） |
| `verify-indexes-up-to-date` | reference doc 編集のため `.claude/skills/aiworkflow-requirements/indexes/` の rebuild が必要な可能性 | `mise exec -- pnpm indexes:rebuild` 実行後 `git diff` が drift 0 件 |
| `verify-gate-metadata` | 本サイクル task spec の gate metadata（phase1-13）整合 | `index.md` の Phase 表と実ファイル名 1:1 一致 |
| `verify-test-suffix` | 新規テストファイルが shell script のため対象外 | `*.sh` は CLAUDE.md 不変条件 8 の禁止 suffix `*.test.{ts,tsx}` に該当しない |
| 既存 lefthook（`block-test-suffix` / `staged-task-dir-guard`） | 対象外 | 影響なし |

## 4. 検証実行順序（ローカル）

```bash
# 1. 静的解析
shellcheck scripts/oidc/verify-claim-pin.sh scripts/redaction-check.sh
actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml

# 2. shell unit test
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh
bash scripts/__tests__/redaction-check.test.sh

# 3. 既存 regression
bash scripts/__tests__/redaction-check.test.sh
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. indexes drift
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/

# 5. 構造 grep
rg -c "NOTE\(issue-762\)" .github/workflows/web-cd.yml  # → 2
rg -n "OIDC Future Supported Path Gate" .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

## 5. テスト fixture 設計

`scripts/__tests__/tmp-fixtures/` 配下に以下を新規配置:

| ファイル名 | 内容 | 対応ケース |
|---|---|---|
| `jwt-only.log` | `auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part_abcdef` | R1 |
| `cf-aud-only.log` | `claim: cloudflare-aud=foo` | R2 |
| `clean.log` | `OK: deploy completed, no secrets` | R3 |
| `pnpm-lock-integrity.log` | `integrity: sha512-eyJabcdef0123456789...` （`.` を含まない base64 形式） | R4 |
| `account-id-leak.log` | 既存 ACCOUNT_ID leak fixture を流用（無ければ新規） | R5 |
| `jwt-and-cf-aud.log` | R1 + R2 を 1 ファイルに連結 | R6 |
| `empty.log` | 空ファイル | R7 |

実 JWT 値・実 Cloudflare Account ID は使用しない（fixture 内も dummy のみ）。

## 6. DoD（Phase 4 全体）

- [ ] 周辺強化 5 件すべてに対し test plan が記述されている
- [ ] 各 plan が ケース表 + 検証コマンド + DoD を持つ
- [ ] `shellcheck` 0 warn / `actionlint` 0 warn を全体 DoD として明示
- [ ] 既存 `redaction-check.sh` regression（ACCOUNT_ID leak 検出）が plan に含まれる
- [ ] CI gate との整合性確認（§3）が記述されている
- [ ] 実 OIDC token / 実 JWT 値 / 実 Cloudflare Account ID を test fixture に含めないことが明記されている
