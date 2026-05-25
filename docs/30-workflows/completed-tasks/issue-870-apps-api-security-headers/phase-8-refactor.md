# Phase 8: リファクタリング — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-7-coverage.md](phase-7-coverage.md) / 次 Phase: [phase-9-qa.md](phase-9-qa.md)

## 目的

実装完了後のコードを単一責務・可読性の観点で見直し、将来の保守コストを下げる。
本タスクは `apps/api/src/middleware/security-headers.ts` を**新規追加**するだけのため、
大規模なリファクタリングは発生しない。重複排除と定数集約のみを対象とする。

---

## 8-1. リファクタリング対象一覧

### 対象 1: ヘッダ値定数の集約

| 項目 | Before（実装直後の想定） | After（リファクタ後） | 理由 |
|------|------------------------|---------------------|------|
| `"nosniff"` などのリテラル値 | 関数内にインラインで散在する可能性あり | `SECURITY_HEADERS` const オブジェクトに集約済み（`"X-Content-Type-Options": "nosniff"` / `"Referrer-Policy": "no-referrer"`） | テスト・コメント・実装コードで値が一致することを保証。変更箇所を 1 か所に限定 |
| HSTS max-age 値 `31536000` | 数値リテラルを直接使用 | `DEFAULT_HSTS_MAX_AGE = 31_536_000` として export する名前付き定数に集約 | マジックナンバーを排除し、テストコード内でも同じ定数を参照させる |
| `no-store` を付与するパスプレフィックス | 関数内配列として直接定義 | `DEFAULT_NO_STORE_PREFIXES = ["/me", "/auth", "/admin", "/internal"] as const` として export する名前付き定数に集約 | テスト TC-06〜TC-08 がこの定数を参照可能になり、定義とテストの二重管理を排除 |

### 対象 2: `parseAllowedOrigins` の独立性確保

| 項目 | Before | After | 理由 |
|------|--------|-------|------|
| `parseAllowedOrigins` の実装 | `corsFromEnv` 内部にインライン実装 | `export const parseAllowedOrigins` として独立 export | TC-02〜TC-04 がホワイトボックスでパース結果を検証できる。`corsFromEnv` はこの関数を呼び出す薄いラッパーになる |

### 対象 3: `securityHeaders` のオプション型整理

| 項目 | Before | After | 理由 |
|------|--------|-------|------|
| オプション型 | インライン型 `{ hstsMaxAge?: number; noStorePrefixes?: readonly string[] }` | `export interface SecurityHeadersOptions` として外部から import 可能に | テストや将来の呼び出し元が型をインポートして使える |

---

## 8-2. 対象外（スコープ外）

| 候補 | 対象外の理由 |
|------|------------|
| `apps/web/src/lib/security-headers.ts` との共有 helper 化 | 現時点では `apps/api` と `apps/web` の 2 app のみが callsite。`packages/` への抽出は将来の packages 整理 wave で再検討する。**本タスクでは未タスク化もしない**。 |
| CORS logic の汎用パッケージ化 | 同上。`@ubm-hyogo/api` 内に閉じる現行構成が適切。 |
| index.ts の全体的な再構成 | 本タスクの変更は middleware 登録 2 行の追加のみ。広範な構造変更は禁止（既存 endpoint surface 不変条件）。 |

---

## 8-3. リファクタリング後の確認手順

実装フェーズ（Phase 5）完了後にリファクタを適用したら、以下の順序で確認する。

```bash
# 1. 型チェック
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# 2. リント
mise exec -- pnpm --filter @ubm-hyogo/api lint

# 3. 全 TC グリーン確認
mise exec -- pnpm exec vitest run apps/api src/middleware/__tests__/security-headers.spec.ts

# 4. 定数が正しく export されていることを grep で確認
grep -n "export const SECURITY_HEADERS\|export const DEFAULT_HSTS_MAX_AGE\|export const DEFAULT_NO_STORE_PREFIXES\|export interface SecurityHeadersOptions\|export const parseAllowedOrigins\|export const corsFromEnv\|export const securityHeaders" \
  apps/api/src/middleware/security-headers.ts
```

期待出力（行番号は実装次第で変わるが、6 件が全て出力されること）:

```
<行番号>:export const SECURITY_HEADERS = ...
<行番号>:export const DEFAULT_HSTS_MAX_AGE = ...
<行番号>:export const DEFAULT_NO_STORE_PREFIXES = ...
<行番号>:export interface SecurityHeadersOptions ...
<行番号>:export const parseAllowedOrigins = ...
<行番号>:export const securityHeaders = ...
<行番号>:export const corsFromEnv = ...
```

---

## 8-4. DoD（Definition of Done）

- [ ] `SECURITY_HEADERS` / `DEFAULT_HSTS_MAX_AGE` / `DEFAULT_NO_STORE_PREFIXES` がそれぞれ名前付き export として存在し、関数内に同じ値のリテラルが重複していない
- [ ] `parseAllowedOrigins` が独立 export として存在し、`corsFromEnv` がこれを呼び出す構造になっている
- [ ] `SecurityHeadersOptions` が `export interface` として定義されている
- [ ] typecheck / lint / TC-01〜TC-10 がすべてグリーン
- [ ] `apps/web/src/lib/security-headers.ts` との統合は**スコープ外**として記録（未タスク化しない）
