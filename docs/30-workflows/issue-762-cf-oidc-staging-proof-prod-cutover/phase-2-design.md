# Phase 2: 設計

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> task classification: code task (shell script + workflow YAML + reference doc)
> visual classification: NON_VISUAL
> 実装区分: **条件付き実装仕様書** (CONST_005 必須項目すべて含む / CONST_007 1サイクル完了スコープ)

---

## 1. Current Design Decision（本サイクルで実装する）

| 項目 | 設計 |
|---|---|
| `.github/workflows/web-cd.yml` deploy 挙動 | **不変**（コメント追加のみ） |
| GitHub OIDC permission (`id-token: write`) | 追加しない |
| Cloudflare OIDC exchange step | 追加しない |
| current credential | step-scoped `secrets.CLOUDFLARE_API_TOKEN`（Issue #640 由来）維持 |
| 周辺強化 1 | `scripts/oidc/verify-claim-pin.sh` 新規（claim 4 軸 dry-run 検証） |
| 周辺強化 2 | `scripts/redaction-check.sh` JWT + `cloudflare-aud` claim 拡張 |
| 周辺強化 3 | `.github/workflows/oidc-observation-window.yml` 新規（manual dispatch only / no-op verifier） |
| 周辺強化 4 | `deployment-secrets-management.md` future supported path gate G1-G4 追記 |
| 周辺強化 5 | `web-cd.yml` 根拠コメント追加 |
| evidence | primary-source revalidation（2026-05-17 時点）+ 周辺強化 dry-run + Phase 12 strict outputs |

## 2. ファイル別詳細設計

### 2.1 `scripts/oidc/verify-claim-pin.sh`（新規）

#### 構造

```bash
#!/usr/bin/env bash
set -euo pipefail

# 期待 claim 固定値（本サイクルで pin する 4 軸）
EXPECTED_REPOSITORY="daishiman/UBM-Hyogo"
ALLOWED_REFS=("refs/heads/main" "refs/heads/dev")
ALLOWED_ENVIRONMENTS=("production" "staging")
EXPECTED_EVENT_NAME="push"

# CLI 引数: --repository / --ref / --environment / --event-name
# parse → 固定値比較 → mismatch 列挙 → exit code 決定
```

#### 入出力

- 入力: CLI 引数 4 件（すべて必須）
- 出力（stdout）: 一致時 `PASS: subject claim pin verified (repository=..., ref=..., environment=..., event_name=...)`
- 出力（stderr）: mismatch 1 件ごとに `MISMATCH <field>: expected=<val>, got=<val>`
- exit code: 0=PASS / 1=mismatch / 2=引数エラー
- 副作用: なし（外部 API / OIDC token 発行・取得を一切行わない）

#### ref / environment 整合性

| ref | environment | event_name | 判定 |
|---|---|---|---|
| `refs/heads/main` | `production` | `push` | PASS |
| `refs/heads/dev` | `staging` | `push` | PASS |
| 上記以外の組合せ | — | — | mismatch（後続実切替時に拡張可） |

ref と environment の対応一致も検証する。

### 2.2 `scripts/redaction-check.sh`（編集）

#### 追加ロジック（既存 ACCOUNT_ID / token-like 検出の後段に追加）

```bash
# JWT 形式 (header.payload.signature) パターン
JWT_REGEX='eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
JWT_MATCHES="$(grep -E -n "$JWT_REGEX" "$INPUT_SRC" 2>/dev/null || true)"
if [ -n "$JWT_MATCHES" ]; then
  echo "::error::JWT-like token detected in log"
  printf '%s\n' "$JWT_MATCHES" | mask_line
  LEAK_FOUND=1
fi

# cloudflare-aud claim 文字列
CF_AUD_MATCHES="$(grep -F -n "cloudflare-aud" "$INPUT_SRC" 2>/dev/null || true)"
if [ -n "$CF_AUD_MATCHES" ]; then
  echo "::error::cloudflare-aud claim detected in log"
  printf '%s\n' "$CF_AUD_MATCHES" | mask_line
  LEAK_FOUND=1
fi
```

#### 互換性

- 既存 CLI（`--log` / `--account-id` / `--token-value-for-test` / stdin）不変
- 既存 exit semantics（leak あり=非ゼロ）不変
- 既存 `TOKEN_REGEX` の false positive を増やさない（JWT は別パターン、`cloudflare-aud` は literal）
- 既存 `mask_line` を再利用

### 2.3 `.github/workflows/oidc-observation-window.yml`（新規）

```yaml
# 目的: OIDC 切替後の observation window で fallback 起動 0 件を確認する manual gate 雛形
# 本サイクルでは no-op verifier。後続実切替 PR で実 verifier に差し替える
name: oidc-observation-window
on:
  workflow_dispatch:
    inputs:
      window_label:
        description: 'observation label (e.g., 2026-06-staging-proof)'
        required: true
        type: string
permissions:
  contents: read
concurrency:
  group: oidc-observation-window-${{ inputs.window_label }}
  cancel-in-progress: false
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: No-op observation gate (manual)
        run: |
          echo "observation window manual gate: ${{ inputs.window_label }}"
          echo "TODO(後続サイクル): fallback 起動回数 0 件確認 / deploy version 突合 / Cloudflare dashboard 突合"
```

#### 制約

- trigger は `workflow_dispatch` のみ（`push` / `schedule` を持たせない）
- `permissions: contents: read` のみ（`id-token: write` は付与しない）
- `actionlint` PASS を維持

### 2.4 `.github/workflows/web-cd.yml`（編集・コメント追加のみ）

deploy step `env:` ブロックの直前に以下コメントを追加（staging / production の両 job）:

```yaml
      # NOTE(issue-762): step-scoped `secrets.CLOUDFLARE_API_TOKEN` は current safe baseline。
      # Cloudflare 公式 OIDC deploy support (`cloudflare/wrangler-action#402`) が
      # supported になるまで `permissions: id-token: write` と OIDC exchange step は追加しない。
      # 詳細: docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/
      - name: Deploy to Cloudflare Workers (...)
```

YAML semantics 不変。`actionlint` は通過する。

### 2.5 `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（編集）

追加セクション骨子:

```markdown
## OIDC Future Supported Path Gate（issue-762 反映）

Cloudflare 公式 OIDC deploy support が確認された後にのみ、以下 G1-G4 を順に満たすこと。

| Gate | 内容 | 担当 |
|---|---|---|
| G1 | Cloudflare docs / wrangler-action release notes が input 名 / audience / exchange endpoint / rollback path を明示 | 後続サイクル primary-source revalidation |
| G2 | staging job で OIDC proof 取得、redacted log + `scripts/redaction-check.sh` PASS + `scripts/oidc/verify-claim-pin.sh` PASS | issue-717-followup-001 後続 |
| G3 | production cutover（subject claim pin: repository=daishiman/UBM-Hyogo, ref=refs/heads/main, environment=production, event_name=push） | issue-717-followup-001 後続 |
| G4 | observation window で fallback 起動 0 件確認後、legacy token 物理失効を `docs/30-workflows/issue-718-legacy-cf-token-revocation` で実行 | docs/30-workflows/issue-718-legacy-cf-token-revocation |

### current safe baseline（2026-05-17 時点）

- `.github/workflows/web-cd.yml` は step-scoped `secrets.CLOUDFLARE_API_TOKEN` を維持
- `permissions: id-token: write` は付与しない
- `scripts/redaction-check.sh` は JWT + `cloudflare-aud` claim も leak 検出
- `scripts/oidc/verify-claim-pin.sh` は dry-run 検証 helper として常時利用可能
```

## 3. Future Supported Path Gate（後続サイクル送り）

| Gate | 内容 | 本サイクルでの扱い |
|---|---|---|
| G1 | 公式 input 名 / audience / exchange endpoint / rollback path 明示 | primary-source 監視のみ |
| G2 | staging OIDC proof + redacted log 保存 + claim pin verify | 雛形（observation workflow + claim pin script）のみ |
| G3 | production cutover | 設計記述のみ |
| G4 | legacy token 物理失効 | `docs/30-workflows/issue-718-legacy-cf-token-revocation` 所有・blocked 維持 |

## 4. Four-Condition Check

| 条件 | 判定 | 根拠 |
|---|---|---|
| 矛盾なし | PASS | unsupported OIDC を current implementation に昇格させていない。`web-cd.yml` deploy 挙動は不変 |
| 漏れなし | PASS | claim pin / redaction / observation gate / 正本 reference / 根拠コメントの 5 件で周辺強化を網羅。実切替・物理失効は明示的 out-of-scope |
| 整合性あり | PASS | `conditional_implementation_with_peripheral_hardening` で統一。CONST_004 / CONST_005 / CONST_007 一貫 |
| 依存関係整合 | PASS | 公式 support → staging proof (G2) → production cutover (G3) → revocation (G4) の順序を gate 化 |

## 5. 命名・配置整合

- `scripts/oidc/` を新規ディレクトリとして配置。OIDC 関連 helper の集約場所として後続実切替時にも再利用
- 新規 workflow 名 `oidc-observation-window` は既存 workflow 命名規則（kebab-case）に整合
- reference doc の追加セクションは既存 H2 階層に揃える

## 6. リスクと緩和

| リスク | 緩和策 |
|---|---|
| `verify-claim-pin.sh` が後続実切替時に固定値陳腐化 | reference doc の表と script の `EXPECTED_*` を 1:1 で対応させ、未来の修正点を明示 |
| JWT regex の false positive が `pnpm-lock.yaml` integrity hash 等を誤検出 | 既存 `TOKEN_REGEX` のフィルタと同様、JWT は `eyJ` プレフィックス + 2 つの `.` 区切りで限定済 |
| observation workflow が manual のまま放置 | reference doc に「後続サイクル実切替時に no-op verifier を実 verifier へ差し替える」と明示 |
| `web-cd.yml` コメント追加が `actionlint` で予期せぬ警告 | コメントは既存 YAML 構造内で完結。事前に `actionlint` 検証 |
