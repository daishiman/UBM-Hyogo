# Phase 5: 実装

## メタ情報

- phase: 5 / implementation
- prev: phase-4-test-plan
- next: phase-6-test-additions
- implementation_kind: 実装仕様書

## 目的

Phase 2 設計と Phase 4 テスト計画に基づき、`.env.example` / runbook / skill reference の `op://` 参照を canonical へ統一する差分を作成し、legacy path 残存を検知する grep gate スクリプトを新規追加する。**1Password vault 実 mutation・GitHub Secrets 変更・commit は本 Phase で実行しない**（Phase 11 で user-gated）。

## 実行タスク

1. `.env.example` / runbook / deployment secrets 正本の op reference 差分を作成する
2. `scripts/verify-onepassword-op-uri-canonical.sh` の仕様を実装差分として固定する
3. `apps/web/.dev.vars.example` / `scripts/cf.sh` の direct deploy-token reference なしを記録する

## 前提条件（実装着手 gate）

実装着手前に必ず以下を operator に依頼・確認すること:

1. 依存 issue #762 / #763 / #718 がすべて closed
2. canonical op:// path（`op://UBM-Hyogo/Cloudflare/api_token_staging` / `op://UBM-Hyogo/Cloudflare/api_token_production`）が ut-27 で確定済み
3. 1Password vault `UBM-Hyogo` 内に Item `Cloudflare` と field `api_token_staging` / `api_token_production` の skeleton が存在（実値投入は Phase 11）

> 上記が未満たしの場合、Phase 5 の差分のみ作成し PR マージは Phase 11 完了後とする。

## 入力

- canonical op:// path 2 件
- 現状の `.env.example` / `docs/runbooks/cloudflare-waf-operations.md` / `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 内の legacy op:// path
- Phase 4 grep regex pattern

## 出力

- `outputs/phase-5/implementation-diff.md`
- `outputs/phase-5/file-change-checklist.md`

## 要件

### 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
|------|---------|------|
| `.env.example`（root） | 編集 | legacy op:// 参照 → canonical 参照に統一 |
| `apps/web/.dev.vars.example` | 確認のみ | CLOUDFLARE_API_TOKEN 参照が無いことを baseline 確認（差分 0） |
| `scripts/cf.sh` | 確認のみ | `op://` 参照を直接持たない（`.env` 経由）ことを baseline 確認（差分 0） |
| `docs/runbooks/cloudflare-waf-operations.md` | 編集 | `op://Cloudflare/API Token/credential` → WAF 専用 path `op://UBM-Hyogo/Cloudflare-WAF/api_token_waf` へ更新（deploy token canonical 2 path と混同しない） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | inventory 表に canonical 2 行追加、legacy 行に `deprecated` marker、changelog に 2026-05-18 / issue-765 行追加 |
| `scripts/verify-onepassword-op-uri-canonical.sh` | 新規 | legacy op:// path 残存 0 件 gate |

### 設定/コード差分案

#### `.env.example`（編集）

```diff
- CLOUDFLARE_API_TOKEN=op://Cloudflare/API Token/credential
+ # staging / production で path を切替えること
+ CLOUDFLARE_API_TOKEN=op://UBM-Hyogo/Cloudflare/api_token_staging
+ # production 切替時:
+ # CLOUDFLARE_API_TOKEN=op://UBM-Hyogo/Cloudflare/api_token_production
```

（実 token 値・hash・URI 値は記述しない。path 識別子のみ）

#### `docs/runbooks/cloudflare-waf-operations.md`（編集）

```diff
- 1Password 参照: `op://Cloudflare/API Token/credential`
+ 1Password 参照（WAF 専用）: `op://UBM-Hyogo/Cloudflare-WAF/api_token_waf`
```

#### `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（編集）

```diff
  | CLOUDFLARE_API_TOKEN | runtime | op://Cloudflare/API Token/credential | (legacy)
+ | CLOUDFLARE_API_TOKEN | runtime | op://Cloudflare/API Token/credential | deprecated (#765, 2026-05-18) |
+ | CLOUDFLARE_API_TOKEN (staging)    | runtime | op://UBM-Hyogo/Cloudflare/api_token_staging    | canonical |
+ | CLOUDFLARE_API_TOKEN (production) | runtime | op://UBM-Hyogo/Cloudflare/api_token_production | canonical |

  ## Changelog
+ - 2026-05-18 (issue-765): 1Password vault を `UBM-Hyogo` 配下へ集約。
+   Cloudflare API Token は `api_token_staging` / `api_token_production` field を canonical とする。
```

#### `scripts/verify-onepassword-op-uri-canonical.sh`（新規）

```bash
#!/usr/bin/env bash
set -euo pipefail

# legacy deploy-token op:// path を検知する gate。
# CloudflareSecurity / WAF / audit token など deploy token 以外の op:// path は対象外。

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

DENY_RE='op://(Cloudflare/API Token/credential|Vault/Cloudflare/api_token|UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN|Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN)'
TARGETS=(
  '.env.example'
  'docs/runbooks/cloudflare-waf-operations.md'
  '.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md'
  'scripts/cf.sh'
  'apps/web/.dev.vars.example'
)

illegal=$(git grep -nE "$DENY_RE" -- "${TARGETS[@]}" || true)

if [[ -n "$illegal" ]]; then
  echo "::error:: legacy op:// path remains:" >&2
  echo "$illegal" >&2
  exit 1
fi

echo "OK: no legacy Cloudflare deploy-token op:// paths remain in operational surfaces"
exit 0
```

### 入出力 / 副作用

- 入力: stdin なし
- 出力: stdout に grep gate 結果（`OK:` または `::error::`）
- 副作用: ファイル編集のみ。1Password vault 実 mutation・GitHub Secrets 変更・commit は本 Phase で実施しない

## ローカル実行・検証コマンド

```bash
chmod +x scripts/verify-onepassword-op-uri-canonical.sh
bash scripts/verify-onepassword-op-uri-canonical.sh
echo "exit=$?"

mise exec -- pnpm lint
mise exec -- pnpm typecheck

# `.env.example` 編集後の参照確認（実値は読まない）
grep -nE 'op://' .env.example
grep -nE 'op://' docs/runbooks/cloudflare-waf-operations.md
grep -nE 'op://' .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

## DoD（Definition of Done）

- [ ] `.env.example` が canonical 2 path のみを参照
- [ ] `docs/runbooks/cloudflare-waf-operations.md` の legacy path 行が WAF 専用 path に置換済
- [ ] `deployment-secrets-management.md` inventory 表に canonical 2 行追加 + legacy 行に `deprecated (#765, 2026-05-18)` marker
- [ ] `deployment-secrets-management.md` changelog に 2026-05-18 / issue-765 行追加
- [ ] `scripts/verify-onepassword-op-uri-canonical.sh` がローカル exit 0
- [ ] `apps/web/.dev.vars.example` / `scripts/cf.sh` に差分 0 件（baseline 確認結果を file-change-checklist に明記）
- [ ] `pnpm lint` / `pnpm typecheck` green

## 依存タスク

- issue-762 / issue-763 / issue-718（closed 前提）

## 参照資料

- `phase-2-design.md`
- `phase-4-test-plan.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 統合テスト連携

- shell gate と `pnpm lint` / `pnpm typecheck` を実装検証の主経路にする
- user-gated `cf.sh whoami` は Phase 11 に移し、未実行状態を runtime pending として記録する

## 成果物

- `outputs/phase-5/implementation-diff.md`（git diff のサマリ・実値 0）
- `outputs/phase-5/file-change-checklist.md`（変更 3 / 確認 2 / 新規 1 の一覧と diff 行数）

## 完了条件

- [ ] DoD 全項目 green
- [ ] Phase 6 へ進む準備（grep gate 緑化確認）が整っている

## タスク100%実行確認【必須】

- [ ] 変更対象 3 ファイルすべてに編集が入った
- [ ] 確認対象 2 ファイル（`apps/web/.dev.vars.example` / `scripts/cf.sh`）の baseline 差分 0 を明記
- [ ] 新規 grep gate script が実行可能（chmod +x 済）
- [ ] 実値・token 値・vault URI 値が一切記載されていない

## 次Phase

phase-6-test-additions.md
