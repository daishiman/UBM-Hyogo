# Phase 7: カバレッジ確認 — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-6-test-additions.md](./phase-6-test-additions.md) / 次 Phase: なし（最終 Phase）

---

## 目的

`apps/api/src/middleware/security-headers.ts` の line / branch カバレッジ 100% を達成し、
全分岐が網羅されていることを確認する。

---

## カバレッジ対象の明示

**対象ファイル（変更ファイルのみ）**:
```
apps/api/src/middleware/security-headers.ts
```

**対象外**:
- `apps/api/src/index.ts`（既存ファイル。配線差分のみで大部分は変更なし）
- `apps/api/src/env.ts`（既存ファイル。フィールド追加のみ）
- `apps/api/wrangler.toml`（設定ファイル。テスト対象外）
- その他の既存ファイル

---

## カバレッジ目標

| エクスポート識別子 | line | branch | 備考 |
|---|---|---|---|
| `securityHeaders` | 100% | 100% | 全分岐（条件 A〜D）が TC-04/05/11/12 で網羅 |
| `parseAllowedOrigins` | 100% | 100% | TC-06（4 パターン）で網羅 |
| `corsFromEnv` | 100% | 100% | TC-07/08/09/10/14 で網羅 |

---

## 分岐網羅表

### `securityHeaders` の分岐

| 分岐 ID | 条件式 | TRUE パス | FALSE パス | 対応 TC |
|---|---|---|---|---|
| B-1 | `options?.hstsMaxAge ?? DEFAULT_HSTS_MAX_AGE` | カスタム値を使用 | デフォルト `31_536_000` を使用 | TC-02（デフォルト） / TC-02（カスタム） |
| B-2 | `options?.noStorePrefixes ?? DEFAULT_NO_STORE_PREFIXES` | カスタム prefix 一覧を使用 | デフォルト一覧を使用 | TC-13（カスタム） / TC-04（デフォルト） |
| B-3 | `pathname === prefix` | 完全一致 → `isProtectedPath = true` | 次の OR 条件へ | TC-11（`/me` 完全一致） |
| B-4 | `pathname.startsWith(\`${prefix}/\`)` | prefix/ 始まり → `isProtectedPath = true` | `false` のまま次の prefix へ | TC-04（`/me/profile`）/ TC-11（`/members` が不一致） |
| B-5 | `isProtectedPath && !existingCacheControl` | `no-store` を set | set しない（スキップ） | TC-04（true）/ TC-05（false: CC あり）/ TC-05（false: prefix 外） |
| B-5a | `isProtectedPath === true` 内の `!existingCacheControl` | CC なし → `no-store` set | CC あり → 上書きしない | TC-04（CC なし）/ TC-12（CC あり） |

### `parseAllowedOrigins` の分岐

| 分岐 ID | 条件式 | TRUE パス | FALSE パス | 対応 TC |
|---|---|---|---|---|
| P-1 | `!raw` | `[]` を返す（early return） | split 処理へ進む | TC-06（`undefined`）/ TC-06（カンマ区切り） |
| P-2 | `s.length > 0`（filter 内） | 空除去せず配列に残す | 空文字を除去 | TC-06（`"a, b ,,c"` で空要素除去） |

> `!raw` は `undefined` と `""` の両方で `true` になる（falsy 判定）。
> TC-06 の `parseAllowedOrigins("")` → `[]` が B-P1 の空文字ケースを網羅する。

### `corsFromEnv` の `origin` callback の分岐

| 分岐 ID | 条件式 | TRUE パス | FALSE パス | 対応 TC |
|---|---|---|---|---|
| C-1 | `allowed.includes(origin)` | `origin` を返す（ACAO = origin） | `null` を返す（ACAO なし） | TC-07（TRUE）/ TC-08（FALSE） |
| C-2 | `c.env?.ALLOWED_ORIGINS` が truthy | `parseAllowedOrigins` に実値を渡す | `undefined` を渡す → `[]` | TC-07（有り）/ TC-10（`undefined`） |

---

## no-store prefix 一致の詳細網羅表

| テストパス | prefix `/me` との一致結果 | `isProtectedPath` | CC 補完 | 対応 TC |
|---|---|---|---|---|
| `/me` | `pathname === "/me"` → `true` | `true` | `no-store` 付与 | TC-11 |
| `/me/profile` | `pathname.startsWith("/me/")` → `true` | `true` | `no-store` 付与 | TC-04 |
| `/me/profile/details` | `pathname.startsWith("/me/")` → `true` | `true` | `no-store` 付与 | TC-11 |
| `/members` | `pathname === "/me"` → `false` / `pathname.startsWith("/me/")` → `false` | `false` | CC 補完なし | TC-11 |
| `/public/form-preview` | いずれの prefix とも不一致 | `false` | CC 補完なし（TC-05 の CC はハンドラ設定） | TC-05 |
| `/auth/session` | `pathname.startsWith("/auth/")` → `true` | `true` | `no-store` 付与 | TC-04 |
| `/admin/members` | `pathname.startsWith("/admin/")` → `true` | `true` | `no-store` 付与 | （TC-15 内） |
| `/internal/health` | `pathname.startsWith("/internal/")` → `true` | `true` | `no-store` 付与 | TC-11 |

---

## カバレッジ実行コマンド

```bash
# カバレッジ付き unit テスト（security-headers.ts のみを対象ファイルに絞る）
mise exec -- pnpm exec vitest run apps/api \
  --coverage \
  --coverage.include="src/middleware/security-headers.ts" \
  src/middleware/__tests__/security-headers.spec.ts
```

> `--coverage.include` で対象ファイルを `security-headers.ts` に限定することで、
> 変更ファイル以外のカバレッジが結果に混入しない。

### 期待するカバレッジレポート出力

```
 % Coverage report from v8
 File                                              | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------------------------|---------|----------|---------|---------|
 middleware/security-headers.ts                    |   100   |   100    |   100   |   100   |
```

---

## テストケースとカバレッジの対応マップ

| TC | 主な検証内容 | 網羅する分岐 |
|---|---|---|
| TC-01 | `X-Content-Type-Options: nosniff` 常時付与 | `securityHeaders` のヘッダ set ロジック（B-1, B-2 デフォルト経路） |
| TC-02 | `Strict-Transport-Security` デフォルト / カスタム | B-1（TRUE / FALSE 両経路） |
| TC-03 | `Referrer-Policy: no-referrer` 常時付与 | ヘッダ set ロジック |
| TC-04 | `/me/profile` に `no-store` 補完（CC なし） | B-4（TRUE: prefix/ 始まり）、B-5（TRUE: CC なし） |
| TC-05 | `/public/form-preview` の CC 上書き禁止 | B-4（FALSE: prefix 外）、B-5（FALSE: CC あり） |
| TC-06 | `parseAllowedOrigins` パース | P-1（TRUE: undefined）、P-2（空除去） |
| TC-07 | allowlist 内 Origin → ACAO echo | C-1（TRUE）、C-2（TRUE） |
| TC-08 | allowlist 外 Origin → ACAO なし | C-1（FALSE） |
| TC-09 | OPTIONS preflight → 204 + ACAO | C-1（TRUE） / corsFromEnv の OPTIONS 処理 |
| TC-10 | ALLOWED_ORIGINS 未定義 → deny-by-default | C-2（FALSE: undefined → P-1 TRUE） |
| TC-11 | prefix 完全一致 / `/members` 不一致 | B-3（TRUE）、B-4（FALSE: `/members`）、B-4（TRUE: サブパス） |
| TC-12 | 既存 CC あり（冪等性） | B-5a（FALSE: CC あり） |
| TC-13 | カスタム `noStorePrefixes` | B-2（TRUE: カスタム経路） |
| TC-14 | CORS 境界テスト（空白 / 部分一致 / プロトコル違い） | C-1（FALSE 各種パターン） |
| TC-15 | 全 HTTP メソッドでのヘッダ付与 | ヘッダ set ロジック（メソッド非依存） |
| TC-16 | エクスポート定数の値確認 | `SECURITY_HEADERS` / `DEFAULT_HSTS_MAX_AGE` / `DEFAULT_NO_STORE_PREFIXES` |

---

## カバレッジ 100% 達成の確認手順

1. Phase 4 / Phase 6 のテストファイルをすべて `security-headers.spec.ts` に配置する
2. Phase 5 の `security-headers.ts` を実装する
3. 以下を順に実行する:

```bash
# ステップ 1: typecheck（型エラーがないことを確認）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# ステップ 2: lint（コードスタイル確認）
mise exec -- pnpm --filter @ubm-hyogo/api lint

# ステップ 3: unit テスト実行（TC-01〜TC-16 全 GREEN 確認）
mise exec -- pnpm exec vitest run apps/api \
  src/middleware/__tests__/security-headers.spec.ts

# ステップ 4: カバレッジ確認（100% 目標）
mise exec -- pnpm exec vitest run apps/api \
  --coverage \
  --coverage.include="src/middleware/security-headers.ts" \
  src/middleware/__tests__/security-headers.spec.ts

# ステップ 5: D1 lane 回帰確認（public route Cache-Control 不変）
mise exec -- pnpm exec vitest run apps/api \
  --config vitest.d1.config.ts \
  src/routes/public/index.contract.spec.ts
```

4. ステップ 4 で `% Branch: 100` が確認できなかった場合は、未網羅の分岐を特定し TC を追加する

---

## カバレッジが 100% にならない場合のデバッグ手順

### 未網羅分岐の特定

```bash
# v8 カバレッジで詳細 HTML レポートを生成
mise exec -- pnpm exec vitest run apps/api \
  --coverage \
  --coverage.reporter=html \
  --coverage.include="src/middleware/security-headers.ts" \
  src/middleware/__tests__/security-headers.spec.ts

# apps/api/coverage/index.html をブラウザで開いて未網羅行（赤）を確認
```

### よくある未網羅ケース

| 未網羅パターン | 原因 | 追加すべきテスト |
|---|---|---|
| `options?.hstsMaxAge` の Optional chaining | カスタム hstsMaxAge を渡すテストが不足 | TC-02（カスタム値） |
| `c.env?.ALLOWED_ORIGINS` の `?.` | `c.env` が `undefined` のケースが不足 | TC-10（env = makeEnv(undefined)） |
| `pathname === prefix` の完全一致 | `/me/` 始まりのみテストして `/me` 完全一致が未カバー | TC-11（`/me` 完全一致） |
| `parseAllowedOrigins("")` | 空文字が `!raw` で early return されることを確認 | TC-06（空文字 → `[]`） |

---

## CLAUDE.md 不変条件チェック

| 条件 | 確認 |
|---|---|
| カバレッジ対象は変更ファイルのみ | `--coverage.include="src/middleware/security-headers.ts"` で限定 |
| #8: テストは `*.spec.ts` のみ | `security-headers.spec.ts` |
| D1 lane 回帰は `vitest.d1.config.ts` で実行 | ステップ 5 のコマンドで明示 |
