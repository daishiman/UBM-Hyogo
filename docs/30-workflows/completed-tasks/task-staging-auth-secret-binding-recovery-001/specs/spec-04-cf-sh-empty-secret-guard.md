# spec-04: `scripts/cf.sh` empty-secret guard + 3 段チェック runbook 明文化

[実装区分: 実装仕様書]

## 1. 目的

`cf.sh secret put` が空の値（length 0）を Cloudflare に投入してしまう事故を入口で弾く。加えて secret 投入後の検証フローを runbook として明文化する。

## 2. 変更対象ファイル

| 種別 | path |
|------|------|
| 編集 | `scripts/cf.sh` |
| 仕様書 | 本ファイル（runbook 明文化を含む） |

## 3. 変更詳細

### 3.1 `cf.sh` の secret put 入口 guard

`cf.sh` は末尾で `$WRANGLER_BIN` に `exec` する構造。`WRANGLER_BIN` 決定後、`CF_SH_SKIP_WITH_ENV` 分岐より前に stdin guard を挿入する。

```bash
if [ "$1" = "secret" ] && [ "${2:-}" = "put" ] && [ ! -t 0 ]; then
  secret_stdin="$(cat)"
  if [ -z "$(printf '%s' "$secret_stdin" | tr -d '[:space:]')" ]; then
    echo "[cf.sh] refusing empty stdin for 'secret put ${3:-<missing-secret-name>}'" >&2
    exit 78
  fi
  for arg in "$@"; do
    if [ "$arg" = "--dry-run" ]; then
      echo "[cf.sh] dry-run: secret put ${3:-<missing-secret-name>} accepted non-empty stdin" >&2
      exit 0
    fi
  done
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    printf '%s' "$secret_stdin" | "$WRANGLER_BIN" "$@"
    exit $?
  fi
  printf '%s' "$secret_stdin" | "$REPO_ROOT/scripts/with-env.sh" mise exec -- "$WRANGLER_BIN" "$@"
  exit $?
fi
```

- 既存 `cf.sh` の構造に合わせて `case` 文の該当 branch に挿入
- 実値は echo 出力しない（length のみ）

### 3.2 3 段チェック runbook（本ファイルに明文化）

#### Step 1: name 登録確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep AUTH_SECRET
```

期待: 1 行 hit

#### Step 2: 再投入後の length verify

```bash
# 投入（実値は op 経由で動的注入）
bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging

# guard が "length=N" を stderr に出すため、N >= 32 を確認
```

#### Step 3: runtime curl で auth gate 動作確認

```bash
curl -sS -i -H "Authorization: Bearer $STAGING_ADMIN_BEARER" $STAGING_API_BASE/admin/members
```

期待:
- status 200
- body に `"members":[` を含む
- `"auth misconfigured"` を含まない

## 4. 入出力・副作用・エラー

| 関数/分岐 | 入力 | 出力 | 副作用 | エラー |
|-----------|------|------|--------|--------|
| secret put guard | stdin（secret 値） | exit code + stderr（実値なし） | wrangler secret put 呼出 | empty/blank で exit 78 |
| --dry-run | stdin + flag | "dry-run: ..." 表示 | なし | なし |

## 5. テスト方針（TC-CFSH-01/02）

| ID | コマンド | 期待 |
|----|----------|------|
| TC-CFSH-01 | `printf '' \| CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run` | exit 78 + stderr "refusing empty stdin" |
| TC-CFSH-02 | `printf '%s' "validlongvaluevalidlongvaluevalidlongvalue" \| CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run` | exit 0 + "accepted non-empty stdin" |

shell test は spec-03 の test runner に同梱しても良いし、独立 `scripts/__tests__/cf-sh.test.sh` を新規作成しても良い。

## 6. ローカル実行コマンド

```bash
# TC-CFSH-01
printf '' | CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run; echo "exit=$?"
# expect: exit=78

# TC-CFSH-02
printf '%s' "validlongvaluevalidlongvaluevalidlongvalue" | CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run; echo "exit=$?"
# expect: exit=0
```

## 7. DoD

- TC-CFSH-01/02 PASS
- 実値の echo 出力なし（length のみ）
- 3 段チェック runbook が本ファイルに明文化されている
- 既存の `cf.sh d1` / `cf.sh deploy` / `cf.sh rollback` 経路は壊れていない

## 8. 実装読込みで確定した前提

- `cf.sh` は `$WRANGLER_CMD` ではなく `$WRANGLER_BIN` を使う。
- `--dry-run` は secret put guard の local test 専用で、wrangler へ渡さない。
