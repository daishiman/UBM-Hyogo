# Phase 8 — リファクタ

## 1. リファクタ方針

実装直後コードに対する以下の改善を本サイクル内で適用する（CONST_007 遵守、先送り禁止）。

## 2. DRY 化

### 2.1 ROUTES 定義の共通化

`auth-slot-coverage.spec.ts` 内に `const ROUTES` を closure として保持し、外部ファイル化はしない（spec 単独で完結する方が読みやすく、唯一の参照元のため）。

### 2.2 HEADER_LOCATOR 定数化

3 つの selector を OR で繋いだ literal を module-level `const HEADER_LOCATOR` に固定。Phase 5 で既に適用済み。

### 2.3 assertRender helper の抽出

state 別 expect chain は `assertRender(page, expected)` に抽出済み（Phase 5 §3）。

## 3. helper 抽出方針

| helper | 配置 | 理由 |
|--------|------|------|
| `assertRender(page, state)` | `auth-slot-coverage.spec.ts` 内 module-scope | spec 単独で完結。`fixtures/` 配下に出す必要なし |
| expired JWT 生成 | `auth-slot-coverage.spec.ts` 内で `signSessionJwt` の `nowSeconds` / `ttlSeconds` を指定 | 既存 fixture API で足りるため新 helper は追加しない |
| ROUTES 配列 | spec 内 `const` | spec 単独参照のため外部化なし |

## 4. 命名規約

| 対象 | 規約 |
|------|------|
| TC name | `${state} viewing ${path}` 形式（失敗時に grep 容易） |
| describe block | `auth-slot @${state}` 形式 |
| 型 | `State` / `Expectation` / `Route` の 3 型のみ。over-engineering 回避 |

## 5. 二重定義の排除

| 二重化候補 | 対応 |
|-----------|------|
| `auth-gate-state.spec.ts` との重複 | あちらは gate state 単独確認、こちらは matrix 横断。スコープが異なるため削除しない |
| 既存 `desktop-chromium` project での auto pick | `testIgnore` 追加で除外（Phase 5 §4.2） |

## 6. 設定の整理

| 設定 | 整理方針 |
|------|----------|
| `setup-auth` project の `testMatch` | `/setup-auth\.spec\.ts$/` で限定 |
| `auth-slot-coverage` project の dependencies | `['setup-auth']` で 1 依存のみ |
| CI job `auth-slot` の `needs` | `[smoke]` で既存 19-route smoke 後に走らせる |

## 7. リファクタ後の DoD

- [ ] ROUTES 配列が単一定義（spec 内 const）
- [ ] HEADER_LOCATOR が module-level 定数
- [ ] `assertRender` helper が state 別 expect chain を集約
- [ ] expired JWT regression が `signSessionJwt` の既存 API で実装されている
- [ ] `playwright.config.ts` の既存 projects に testIgnore 追加し、新 spec が `desktop-chromium` 等で誤実行されない
