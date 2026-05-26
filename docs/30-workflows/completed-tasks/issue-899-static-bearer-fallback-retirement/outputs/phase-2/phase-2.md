# Phase 2 — 設計

## 1. workflow diff 設計（`.github/workflows/runtime-smoke-staging.yml`）

### 1-1. job.env（`:28-37`）

**Before**:

```yaml
    env:
      STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
      STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}
      STAGING_MEMBER_ID: ${{ secrets.STAGING_MEMBER_ID }}
      STAGING_ME_BEARER: ${{ secrets.STAGING_ME_BEARER }}
      # 署名鍵が設定されていれば mint step が実行毎に短命 JWT を発行する（失効不能）。
      # 未設定時は mint step を skip し、上記の静的 bearer を使う後方互換 fallback。
      STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
      # staging では freshness gate を warn-only にして、静的 bearer の寿命切れで
      # smoke 全体が毎回 fail するのを防ぐ。'1' にすると従来の hard-fail へ復帰できる。
      RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'
```

**After**:

```yaml
    env:
      STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
      STAGING_MEMBER_ID: ${{ secrets.STAGING_MEMBER_ID }}
      # mint step が実行毎に短命 JWT を発行する（失効不能・恒久化）。issue #899 で
      # 静的 bearer fallback を撤去済み。STAGING_AUTH_SECRET 未設定時は mint step
      # 冒頭で fail-fast し、static 経路へ復活する余地は構造的に存在しない。
      STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
```

撤去理由:

- `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`: mint step が GITHUB_ENV へ export するため job.env からの inject は不要
- `RUNTIME_SMOKE_FRESHNESS_ENFORCE` env 削除: `bearer-freshness-gate.mts` の既定（env 未設定時 hard-fail）に委ね、warn-only の根拠を消す

### 1-2. mint step（`:44-71` → 簡素化 + fail-fast 追加）

**変更点**:

- `if: env.STAGING_AUTH_SECRET != ''` を削除（常時実行）
- `run:` 冒頭に fail-fast guard を追加:

```bash
run: |
  if [ -z "${STAGING_AUTH_SECRET:-}" ]; then
    echo "::error::STAGING_AUTH_SECRET is required for mint-only runtime smoke (issue #899 retired static fallback). Provision via 'gh secret set STAGING_AUTH_SECRET --env staging-runtime-smoke'."
    exit 1
  fi
  mint_out="$(mktemp)"
  # ... 以降既存と同一 ...
```

- mint → `::add-mask::` → `GITHUB_ENV export` の 1-step redaction sequence は完全保全（不変条件）

### 1-3. mask staging credentials step（`:88-99` → 簡素化）

**Before**:

```yaml
      - name: mask staging credentials
        run: |
          if [ -z "${RUNTIME_SMOKE_AUTH_PATH:-}" ]; then
            echo "RUNTIME_SMOKE_AUTH_PATH=static-fallback" >> "$GITHUB_ENV"
            echo "::notice::runtime-smoke auth path: static-fallback (STAGING_AUTH_SECRET not provisioned)"
          else
            echo "::notice::runtime-smoke auth path: $RUNTIME_SMOKE_AUTH_PATH"
          fi
          echo "::add-mask::$STAGING_ADMIN_BEARER"
          echo "::add-mask::$STAGING_ME_BEARER"
          echo "::add-mask::$STAGING_API_BASE"
          echo "::add-mask::$STAGING_MEMBER_ID"
```

**After**:

```yaml
      - name: mask staging credentials
        run: |
          echo "::notice::runtime-smoke auth path: ${RUNTIME_SMOKE_AUTH_PATH:-unknown}"
          echo "::add-mask::$STAGING_ADMIN_BEARER"
          echo "::add-mask::$STAGING_ME_BEARER"
          echo "::add-mask::$STAGING_API_BASE"
          echo "::add-mask::$STAGING_MEMBER_ID"
```

> mint step が常時実行で `RUNTIME_SMOKE_AUTH_PATH=minted` を必ず export するため、`-:unknown` は理論上到達しないが defensive fallback として残す。

### 1-4. verify required staging secrets step（`:73-86`）

変更なし。撤去後も `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` は **mint step の GITHUB_ENV export** によって runtime に存在するため、本 step の必須 4 secret check はそのまま機能する。

### 1-5. verify bearer freshness step（`:101-104`）

run コマンド変更なし。job.env の `RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'` 削除により、`bearer-freshness-gate.mts` 既定の hard-fail へ自動昇格。コメント文面のみ更新:

```yaml
      - name: verify bearer freshness
        # mint step が短命 JWT を発行するため hard-fail 既定で運用する。
        # 緊急時のみ workflow_dispatch input で warn-only に切替検討（現状は未提供）。
        run: pnpm exec tsx scripts/smoke/bearer-freshness-gate.mts
```

## 2. runbook diff 設計（`docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`）

### 2-1. 撤去対象 section

- `### 後方互換 fallback を残す理由`（mint 一本化により消滅）
- `### 即時運用復旧（mint 導入前に今すぐ緑にしたい場合）`（static 経路廃止により消滅）

### 2-2. 追加 section

```markdown
### 静的 bearer secret の物理削除手順（issue #899 完了時）

mint 経路で smoke green を確認後、GitHub Environment `staging-runtime-smoke` から
静的 bearer secret を物理削除する。順序を厳守すること。

```bash
# 1. workflow 撤去 PR が merge 済み & mint path で smoke green であることを確認
gh run list --workflow runtime-smoke-staging.yml --branch dev --limit 5

# 2. 静的 bearer secret を物理削除
gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke
gh secret delete STAGING_ME_BEARER --env staging-runtime-smoke

# 3. 削除後に空 commit で smoke を再実行し minted-only で green を再確認
gh workflow run runtime-smoke-staging.yml --ref dev
```
```

### 2-3. minted-only 運用記述

冒頭サマリーに「runtime-smoke-staging は mint 経路に一本化済み（issue #899 完了）。`STAGING_AUTH_SECRET` provisioning が必須」を追記。

## 3. SSOT diff 設計（`docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`）

§6 恒久化導線の状態表で「fallback 撤去（#899）: 完了予定」を「**完了済み**（実装 PR #<id> 2026-MM-DD）」へ更新するパターンを記述。実装時に PR 番号と日付を確定する。

## 4. 順序図（dependency-arrow）

```
[#916 provisioning complete + mint smoke green]
            ↓ (prerequisite)
[本仕様書 commit / PR #spec]
            ↓
[実装 PR #impl: workflow edit + runbook + SSOT]
            ↓ (merge)
[mint-only smoke green 再確認 (user-gated)]
            ↓
[gh secret delete STAGING_ADMIN_BEARER / STAGING_ME_BEARER (user-gated)]
            ↓
[bearer-lifecycle-ssot.md §6 status を「完了済み」へ更新 (follow-up commit or impl PR 内)]
```
