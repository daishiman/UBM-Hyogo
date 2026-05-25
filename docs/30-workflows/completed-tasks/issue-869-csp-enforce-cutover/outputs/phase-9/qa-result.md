# Phase 9: QA 仕様（カバレッジ・エッジケース）

`[実装区分: QA 仕様書]` `[task_id: TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER]` `[spec_created]`

> 本 phase は「実施済みの QA 結果」ではなく、**実装時に満たすべき QA 手順と期待状態**を定義する仕様書である。

---

## NON_VISUAL QA

本タスクは `NON_VISUAL`（視覚的変更なし）であるため、スクリーンショット比較は実施しない。QA は unit / playwright smoke / grep gate で構成する。

---

## カバレッジ対象範囲

### 対象（本タスクで変更するコード）

| ファイル | カバレッジ対象の関数/ブロック |
|---------|--------------------------|
| `apps/web/src/lib/env.ts` | `getSecurityHeaderEnv` 全分岐 |
| `apps/web/middleware.ts` | `buildSecurityHeaderConfig` — `getSecurityHeaderEnv` 呼び出し経路 |

### 対象外（既存実装・変更禁止）

| ファイル | 理由 |
|---------|------|
| `apps/web/src/lib/security-headers.ts` | 既存実装で unit テスト済み。本タスクで変更しない |
| `apps/web/src/lib/security-headers.spec.ts` | 既存テストは回帰ガードとして維持する。追加・変更しない |

---

## getSecurityHeaderEnv のカバレッジ仕様

実装後に以下の line / branch カバレッジが実測で確認できる状態にすること。

| ケース | 分岐 | 対応 TC |
|-------|------|--------|
| `CSP_MODE` undefined → default `"report-only"` | zod default 分岐 | TC-01 |
| `CSP_MODE = "enforce"` → `"enforce"` 返却 | enum マッチ分岐 | TC-02 |
| `NEXT_PUBLIC_API_BASE_URL` → `apiBaseUrl` プロパティ | 正常系 | TC-03 |
| `CSP_MODE` 不正値 → zod throw | enum validation 失敗分岐 | TC-04 |

**期待**: `getSecurityHeaderEnv` の全 line / branch が TC-01〜TC-04 の rawEnv 引数注入により実行されること。

---

## エッジケース一覧

### エッジケース 1: CSP_MODE 未設定（undefined）

**シナリオ**: `rawEnv` に `CSP_MODE` キーが存在しない状態で `getSecurityHeaderEnv` を呼ぶ。

**期待挙動**: zod の `.default("report-only")` が適用され、`cspMode = "report-only"` が返る。

**検証 TC**: TC-01

---

### エッジケース 2: CSP_MODE = "" （空文字）

**シナリオ**: `rawEnv` に `CSP_MODE: ""` を渡す。

**期待挙動**: `z.enum(["report-only","enforce"])` のバリデーションが失敗し、ZodError が throw される。空文字は `default()` フォールバックの対象外（zod では `undefined` のみがデフォルト値を適用する）。

**検証方法**: TC-04 は "invalid-value" を代表値として使用する。空文字の挙動は同一 zod 経路であるため同じく throw となる。

---

### エッジケース 3: CSP_MODE = "invalid-value"（不正文字列）

**シナリオ**: `rawEnv` に `CSP_MODE: "invalid-value"` を渡す。

**期待挙動**: ZodError が throw される。

**検証 TC**: TC-04

---

### エッジケース 4: PLAYWRIGHT_TEST=1 + CSP_MODE=enforce 注入

**シナリオ**: playwright 実行時に `process.env.PLAYWRIGHT_TEST = "1"` かつ `process.env.CSP_MODE = "enforce"` が注入される。

**期待挙動**:
1. `readRawEnv()` が `{ ...cloudflareEnv, ...readProcessEnv() }` を返す。
2. `process.env.CSP_MODE = "enforce"` が cloudflare env を上書きする。
3. `getSecurityHeaderEnv` が `cspMode = "enforce"` を返す。
4. middleware が `Content-Security-Policy` ヘッダ（enforce）を付与する。
5. playwright の `headers["content-security-policy"]` が truthy、`headers["content-security-policy-report-only"]` が undefined になる。

**検証**: playwright smoke の enforce モード実行（`CSP_MODE=enforce mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts`）で確認する。

---

### エッジケース 5: 両ヘッダの同時出力防止

**シナリオ**: `buildSecurityHeaders` が enforce モード時に `Content-Security-Policy-Report-Only` を同時に付与しないこと。

**期待挙動**: `cspMode === "enforce"` のとき `Content-Security-Policy` のみが付与され、`Content-Security-Policy-Report-Only` は付与されない（逆も同様）。

**検証**: playwright TC-07 の `expect(headers[oppositeHeaderName]).toBeUndefined()` アサーション。

**根拠**: `buildSecurityHeaders` の実装（既存・変更禁止）は CSP ヘッダを 1 種類のみ `h.set()` するため、両ヘッダの同時出力は構造上発生しない。TC-07 はこの不変性を smoke で保証する。

---

### エッジケース 6: wrangler.toml [vars] と [env.production.vars] の二重設定

**シナリオ**: `[vars]` と `[env.production.vars]` の両方に `CSP_MODE = "report-only"` を定義する。

**期待挙動**: Cloudflare Workers のデプロイ時は `[env.production.vars]` が優先される（環境固有設定が `[vars]` を上書き）。どちらも `"report-only"` であるため、production 動作に影響しない。

**検証**: ローカル wrangler dev と production デプロイの両方で `Content-Security-Policy-Report-Only` ヘッダが付与されること。

---

## middleware buildSecurityHeaderConfig の QA

`buildSecurityHeaderConfig` は直接 unit テストしない（private function 扱い）。代わりに以下で間接的に検証する。

| 検証手段 | 確認内容 |
|---------|---------|
| playwright TC-07 | enforce / report-only の両モードでヘッダが正しく付与される |
| playwright TC-08 | connect-src が apiBaseUrl を含む |
| G-07（grep gate） | `process.env.*` 直接参照の新規追加なし |

---

## 回帰ガード

### 既存 security-headers.spec.ts（変更禁止）

実装後に既存テスト件数と合格件数が変化しないことを確認する。

```bash
mise exec -- pnpm --filter web test -- security-headers
```

**期待**: 実装前と同じ件数の TC が PASS であること。

### middleware の既存認証ロジック

`guardedMiddleware` の `/admin` / `/profile` ガード処理は変更しない。`buildSecurityHeaderConfig` の差替のみであるため回帰リスクは低いが、以下で確認する。

```bash
# admin redirect が 307/308 を返すこと
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts -g "admin redirect"
```

---

## QA 成功基準

実装後に以下をすべて満たすこと。

- [ ] `getSecurityHeaderEnv` の TC-01〜TC-04 全 PASS
- [ ] エッジケース 1〜3（CSP_MODE falsy / 不正値）の挙動が TC-04 で確認できること
- [ ] playwright security-headers.spec.ts（report-only モード）全テスト PASS
- [ ] playwright security-headers.spec.ts（`CSP_MODE=enforce` モード）全テスト PASS
- [ ] TC-07 の `oppositeHeaderName undefined` アサーションが both モードで PASS
- [ ] 既存 security-headers.spec.ts の件数・合格数が変化しないこと
- [ ] phase-8 G-01〜G-10 ゲート全 PASS

---

## staging ランタイム境界

staging / production の実レスポンス確認は Cloudflare Workers へのデプロイが必要であるため user-gated とする。

```bash
# staging デプロイ後の確認コマンド（参考）
curl -sI https://ubm-hyogo-web-staging.daishimanju.workers.dev/ \
  | grep -iE "content-security-policy"
# 期待: "content-security-policy:" ヘッダが存在（enforce モード）
# "content-security-policy-report-only" は存在しないこと
```

このランタイム確認は Phase 11 の evidence として記録する。
