# Phase 3: 設計レビュー — issue-870-apps-api-security-headers
> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-2-design.md](./phase-2-design.md) / 次 Phase: phase-4-test-plan.md

---

## 1. Gate 判定サマリー

| Gate 条件 | 判定 | 根拠 |
|---|---|---|
| 価値性 | PASS | セキュリティヘッダ未設定・CORS 無制御という実在リスクを解消する |
| 実現性 | PASS | Hono middleware と標準 `Headers` / `Response` のみで追加依存ゼロ。既存パターンと整合 |
| 整合性 | PASS | CLAUDE.md 不変条件 #5/#8・既存命名規則・Cache-Control 非上書き戦略が一貫 |
| 運用性 | PASS | `ALLOWED_ORIGINS` を env 別 wrangler.toml で制御。secret 不要 |

**Phase 4 へ進める: YES**

---

## 2. 4 条件の詳細評価

### 2-1. 価値性

**背景リスク（現状）:**
- `X-Content-Type-Options` 未設定 → MIME sniffing 攻撃ベクタあり
- `Strict-Transport-Security` 未設定 → HTTP downgrade 攻撃リスクあり
- `Referrer-Policy` 未設定 → センシティブ URL がリファラで漏洩するリスクあり
- CORS 制御なし → 任意オリジンからのクロスオリジンリクエストが通る

**解消効果:**
- 上記 4 リスクを middleware 1 ファイルで網羅的に解消できる
- 既存 Cache-Control（public cache 設定済み routes）を一切破壊しない非侵襲的設計

**評価: PASS**

### 2-2. 実現性

**技術的実現可能性:**
- Hono middleware と標準 Web API のみを使う。追加 npm パッケージ不要。
- `await next()` 後の `c.res.headers.set` は Hono の公式パターン（middleware docs に掲載）。
- `parseAllowedOrigins` は純粋関数（副作用なし）。Vitest で容易にテスト可能。
- `env.ALLOWED_ORIGINS` の追加は既存 `Env` interface への optional field 追加のみ。

**リスクと対策:**
| リスク | 対策 |
|---|---|
| denied preflight で allow headers が漏れる | 手書き middleware で denied origin には CORS allow headers を一切返さない |
| `c.env` の型が callback 内で推論されない場合 | callback を使わず middleware 本体で `c.env.ALLOWED_ORIGINS` を読む |
| wrangler.toml の named env 継承問題 | 各 `[env.*.vars]` に個別定義する設計で回避済み |

**評価: PASS（要実測確認あり・TC-06/TC-07 で担保）**

### 2-3. 整合性

**CLAUDE.md 不変条件との整合:**

| 不変条件 | 整合内容 |
|---|---|
| #5 D1 access は apps/api に閉じる | middleware は D1・R2 に一切触れない（ヘッダ操作のみ） |
| #8 test は `*.spec.ts` のみ | `security-headers.spec.ts`（`.test.ts` は使用しない） |
| 既存 endpoint surface のみ | 新 endpoint 追加なし・D1 schema 変更なし |
| env は `apps/web/src/lib/env.ts` 経由禁止 | `apps/api/src/env.ts` の `Env` interface を使用。web 側は無関係 |

**命名規則との整合:**
| 規則 | 遵守内容 |
|---|---|
| ファイル名 kebab-case | `security-headers.ts` |
| `MiddlewareHandler` 型 import from "hono" | Phase 2 §2-3 で明示 |
| env は optional field として `Env` interface に追加 | `readonly ALLOWED_ORIGINS?: string;` |

**既存設計との整合:**
- `app.notFound` / `app.onError` の前に middleware を挿入する位置は Hono の推奨パターンと一致
- `app.use("*", ...)` のグローバル適用は既存 API surface を変更しない

**評価: PASS**

### 2-4. 運用性

**設定管理:**
- `ALLOWED_ORIGINS` は非機密（公開 web origin のみ）なので `wrangler.toml` に平文記述可能
- 環境別独立管理: staging / production でそれぞれ `[env.*.vars]` に定義
- ローカル dev は `.dev.vars` で `ALLOWED_ORIGINS=http://localhost:3000` を設定（既存パターンに倣う）

**変更容易性:**
- `ALLOWED_ORIGINS` の値を変更するだけで allowlist を更新可能
- `SecurityHeadersOptions` で HSTS max-age / noStorePrefixes をカスタマイズ可能
- デフォルト値を定数として export しているため、unit test でも容易に参照可能

**監視・デバッグ:**
- middleware は状態を持たないため、障害調査が単純
- ヘッダ付与の確認は curl で即時検証可能（実装後の smoke 手順に記載予定）

**評価: PASS**

---

## 3. 因果ループ図

### 3-1. 強化ループ（R）: セキュリティ意識の向上サイクル

```
セキュリティヘッダ整備
        ↓ (+)
CI/テストでヘッダ付与を継続検証
        ↓ (+)
新機能追加時もテストが通ることでヘッダの維持が保証
        ↓ (+)
セキュリティ品質の継続的向上
        ↓ (+)
セキュリティヘッダ整備（強化ループ: セキュリティ品質が上がるほど整備動機が増す）
```

### 3-2. バランスループ（B）: Cache-Control 保護による破壊防止

```
既存 Cache-Control 設定（public routes の max-age=60）
        ↓ (-)
middleware による上書きリスク
        ↓ (-)
「既存値チェック → null の場合のみ補完」戦略
        ↓ (+)
上書きリスクの解消
        ↓ (-)
既存 Cache-Control 設定の破壊（バランスループ: 設定破壊を防ぐ力が働く）
```

---

## 4. 責務境界の確認

| 確認項目 | 状態 | 根拠 |
|---|---|---|
| middleware が状態を持たない | OK | `securityHeaders` / `corsFromEnv` はファクトリ関数。request ごとに closure で処理し、module スコープに mutable state を置かない |
| レスポンス境界のみ触る | OK | `c.res.headers` のみ操作。`c.req.body` / D1 / R2 / KV には触れない |
| ルートハンドラの責務を侵害しない | OK | `await next()` 後に操作するため、ルートの Cache-Control 設定を優先する |
| CORS は corsFromEnv が担い、securityHeaders は担わない | OK | 関心の分離。CORS ヘッダと静的セキュリティヘッダを独立した middleware に分割 |

---

## 5. MINOR / MAJOR 指摘

### 5-1. MINOR 指摘

| ID | 内容 | 対応方針 |
|---|---|---|
| M-01 | CORS helper が request header をそのまま echo すると許可範囲が広がる可能性がある | 固定 allow headers（`Authorization`, `Content-Type`, `X-Request-ID`）のみ返す |
| M-02 | `DEFAULT_NO_STORE_PREFIXES` に `/internal` が含まれるが、現時点で `/internal` route は存在しない | 将来の route 追加を見越した予防的設定として許容する。不要であれば実装サイクルで削除可能 |

### 5-2. MAJOR 指摘

なし。設計上の重大な問題は検出されていない。

### 5-3. 未タスク化の判定

- M-01 は実装サイクル内で解消可能なため、別 issue 化は不要
- M-02 は設計上の意図的決定として記録。別 issue 化は不要

---

## 6. carry-over 確認

| carry-over 元 | 状態 | 本タスクとの関係 |
|---|---|---|
| `docs/30-workflows/apps-web-security-headers-hardening/` | 完了済み | `apps/web` 側の完了を受けて `apps/api` 側を実装する follow-up |
| `awshh-followup-004-apps-api-security-headers.md` | completed-tasks へ移動済み | 本タスクの起点 |

---

## 7. Phase 4 へ進めるための前提確認

- [x] Phase 1 要件定義（スコープ・AC・変更対象ファイル）が確定している
- [x] Phase 2 設計（シグネチャ・定数・適用位置・非上書き戦略）が確定している
- [x] CLAUDE.md 不変条件との整合が確認されている
- [x] 既存 Cache-Control への非侵襲性が設計で保証されている
- [x] denied origin / allowed origin / preflight の手書き CORS 境界確認が TC に組み込まれている
- [x] MINOR 指摘 2 件は実装サイクル内で解消可能と判断されている

**Phase 4（テスト計画）へ進める: GO**
