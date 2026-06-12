# Phase 7: カバレッジ確認（設計書）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 7 / 13 |
| 名称 | カバレッジ確認 |
| 種別 | 設計書 |
| 対象範囲 | **本タスクで変更したファイル/ブロックのみ**（C1: web gate / C2: api gate + 消費者）。他 admin / profile / 既存 router は対象外 |
| 方針 | [Feedback BEFORE-QUIT-002] coverage の対象を変更ファイルに限定。[Feedback 5] 変更した関数/ブロックの line/branch 実測値を証跡に残す |

## 目的

本タスクで追加・変更したファイルと関数/ブロックについて、line / branch カバレッジの実測値を可視化し、
認証境界（fail-closed 分岐・内部認証分岐・401 分岐）が漏れなくテストで保護されていることを証跡として残す。
全ファイル一律のグローバル閾値ではなく、**変更行・変更分岐の網羅**を確認対象とする（[Feedback BEFORE-QUIT-002] / [Feedback 5]）。

## 実行タスク

1. C2（api）の変更ファイルを **targeted** で coverage 取得し、`requirePublicAccess` の3分岐を実測する。
2. C1（web）の変更ファイルを **targeted** で coverage 取得し、`(public)/layout.tsx` の session 分岐を実測する。
3. M-2（`INTERNAL_AUTH_SECRET` 未設定時の挙動）の branch を実測で確認する。
4. 変更ファイルごとの line / branch 実測値を「カバレッジ証跡表」に記録する。
5. 対象外（admin / profile / 既存 router 等）を明記し、coverage 低下を誤検出しない。

## 参照資料

| 参照資料 | パス | 用途 |
|---------|------|------|
| カバレッジ基準 | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 変更行網羅の基準 |
| 設計（変更ファイル一覧） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` | coverage 対象の特定 |
| 設計レビュー（M-2 追跡） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-3.md` | M-2 の解決確認 Phase は本 Phase 7 |
| テスト設計 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-4.md` | 各分岐に対応する TC |

## 実行手順

### 手順 1: 対象ファイル限定 coverage コマンド（targeted）

> 全件 `pnpm test --coverage` は実行しない（[Feedback BEFORE-QUIT-002]）。変更ファイルのみを `--coverage` で取得する。

```bash
# C2: api middleware（会員session / 内部認証 / 401 の3分岐）
mise exec -- pnpm --filter @ubm-hyogo/api test --coverage \
  src/middleware/require-public-access.ts \
  src/middleware/require-public-access.spec.ts

# C2: api public router（requirePublicAccess 適用後の 401/200 contract）
mise exec -- pnpm --filter @ubm-hyogo/api test --coverage \
  src/routes/public/index.ts \
  src/routes/public/index.contract.spec.ts

# C1: web (public)/layout（session?children:notice 分岐）+ LoginRequiredNotice
mise exec -- pnpm --filter @ubm-hyogo/web test --coverage \
  src/components/auth/LoginRequiredNotice.tsx \
  src/components/auth/LoginRequiredNotice.spec.tsx \
  "app/(public)/layout.spec.tsx"

# C2: 消費者（sitemap / og）の X-Internal-Auth 付与分岐
mise exec -- pnpm --filter @ubm-hyogo/web test --coverage app/sitemap.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/og test --coverage src/member-source.spec.ts
```

> 実ファイル名（`*.spec.ts` / `*.contract.spec.ts`）は Phase 4 で確定したテスト suite 名に合わせる（不変条件 #8: `*.spec.{ts,tsx}` のみ）。`vitest.d1.config.ts` 等の config 指定が必要な contract spec は Phase 4 の指定に従う。

### 手順 2: カバレッジ証跡表（変更ブロックの line/branch 実測）

各変更ファイルの**変更した関数/ブロック**について、line / branch の実測値を記録する。閾値は「変更行・変更分岐を網羅（line 100% / branch 100%）」とする。

| 対象ファイル | 対象ブロック | 検証する分岐 | line 目標 | branch 目標 | 対応 TC | 実測（実行時記入） |
|-------------|-------------|-------------|----------|------------|---------|-------------------|
| `apps/api/src/middleware/require-public-access.ts` | `requirePublicAccess()` | (a) 会員 session 有効 → `next()` | 100% | 100% | TC-API-200-SESSION | `__` |
| 同上 | `requirePublicAccess()` | (b) `X-Internal-Auth` 一致 → `next()` | 100% | 100% | TC-API-200-INTERNAL | `__` |
| 同上 | `requirePublicAccess()` | (c) session 無 かつ 内部認証無 → `401` | 100% | 100% | TC-API-401-NOAUTH | `__` |
| 同上 | `requirePublicAccess()` | (d) session 検証 throw → fail-closed `401`（AC-9） | 100% | 100% | TC-API-401-THROW | `__` |
| 同上 | `requirePublicAccess()` | (e) **M-2**: `INTERNAL_AUTH_SECRET` 未設定 → 内部経路は通さず（session のみ可） | 100% | 100% | TC-API-M2-NOSECRET | `__` |
| `apps/api/src/routes/public/index.ts` | `createPublicRouter()` の `app.use("*", requirePublicAccess())` 行 | ゲート適用が全 endpoint に効く | 100% | n/a | TC-API-ROUTER-GATE | `__` |
| `apps/web/app/(public)/layout.tsx` | layout 本体 | (f) `session` あり → children 描画 | 100% | 100% | TC-WEB-AUTHED | `__` |
| 同上 | layout 本体 | (g) `session` なし → `LoginRequiredNotice` 描画（children 非 render・AC-5） | 100% | 100% | TC-WEB-UNAUTH | `__` |
| 同上 | layout 本体 | (h) `getSession()` throw → fail-closed notice 描画 | 100% | 100% | TC-WEB-THROW | `__` |
| `apps/web/src/components/auth/LoginRequiredNotice.tsx` | `LoginRequiredNotice()` | (i) `redirectTo` 指定 → `/login?redirect=...` 生成 | 100% | 100% | TC-WEB-NOTICE-REDIRECT | `__` |
| 同上 | `LoginRequiredNotice()` | (j) `redirectTo` 未指定 → `redirect=/` フォールバック | 100% | 100% | TC-WEB-NOTICE-DEFAULT | `__` |
| `apps/web/app/sitemap.ts` | members fetch | (k) `X-Internal-Auth` header 付与 | 100% | n/a | TC-SITEMAP-HEADER | `__` |
| `apps/og/src/member-source.ts` | service binding fetch | (l) `X-Internal-Auth` header 付与 | 100% | n/a | TC-OG-HEADER | `__` |

> 実測値は targeted coverage 実行後に各セルへ記入する。`branch` 列が `n/a` の行は分岐を持たない（単純付与）ため line のみ確認する。

### 手順 3: M-2（`INTERNAL_AUTH_SECRET` 未設定）の branch 実測

M-2 の解決確認は本 Phase 7。`requirePublicAccess` の内部認証分岐は env の有無で挙動が変わるため、両方の branch を実測する。

| 状態 | 内部経路（`X-Internal-Auth` のみ） | session 経路 | 期待 |
|------|-----------------------------------|-------------|------|
| `INTERNAL_AUTH_SECRET` 設定済み | 一致で 200 / 不一致で 401 | session 有効で 200 | branch 両方 hit |
| `INTERNAL_AUTH_SECRET` 未設定（local/test） | **401**（内部経路を通さない） | session 有効で 200 | 未設定 branch を hit |

- 確認コマンド: 上記手順 1 の `require-public-access.spec.ts` を env 設定あり/なしの2ケースで実行し、TC-API-M2-NOSECRET の branch が hit することを `--coverage` の branch 列で確認する。

## 統合テスト連携

- 変更ファイルの coverage は Phase 4/6 で作成した TC が担保する（本 Phase は実測の可視化）。
- 既存 `/profile`・`/admin/*` ゲートテストは**対象外**（変更していない）。これらのグローバル coverage 値が本タスクで低下していないことのみ Phase 9 で確認する。

## 多角的チェック観点（AIが判断）

- システム系: 認証境界の3分岐（session / internal / deny）はすべて hit しないと fail-closed が証明できない。401 分岐の未 hit は「公開漏れ」リスクの盲点。
- 問題解決系: M-2（env 未設定）の branch を実測することで、local/test と production の挙動差を仕様として固定する。

## サブタスク管理

- [ ] targeted coverage コマンドを変更ファイルに限定して実行した
- [ ] カバレッジ証跡表に line/branch 実測値を記入した
- [ ] M-2 の `INTERNAL_AUTH_SECRET` 未設定 branch を実測で確認した
- [ ] 対象外（admin/profile/既存 router）を明記した

## 成果物

| 成果物 | 配置 |
|--------|------|
| カバレッジ確認（本書 + 実測記入） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-7.md` |
| coverage 実測ログ | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/outputs/phase-7/coverage-evidence.md` |

## 完了条件

- [ ] 変更ファイルの line/branch 実測値が証跡表に記録されている
- [ ] `requirePublicAccess` の session/internal/401/throw 分岐が branch 100%
- [ ] `(public)/layout` の session?children:notice 分岐が branch 100%
- [ ] M-2 の未設定 branch が hit している（解決確認）
- [ ] 対象外範囲が明記されている

## タスク100%実行確認【必須】

- [ ] 変更ブロック限定の coverage を取得し、3分岐 + M-2 の実測値を残した

## 次Phase

[phase-8.md](phase-8.md) — リファクタリング（M-1: JWT 検証共通ヘルパー抽出）
