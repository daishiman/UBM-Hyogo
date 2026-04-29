# 公開 endpoint の miniflare contract / integration / leak suite 整備 - タスク指示書

## メタ情報

```yaml
issue_number: 220
```

| 項目         | 内容                                                               |
| ------------ | ------------------------------------------------------------------ |
| タスクID     | 04a-followup-001-miniflare-public-contract-suite                   |
| タスク名     | 公開 endpoint の miniflare contract / integration / leak suite 整備 |
| 分類         | 改善                                                               |
| 対象機能     | 公開 API (`/public/*`) の e2e / contract 検証                      |
| 優先度       | 中                                                                 |
| 見積もり規模 | 中規模                                                             |
| ステータス   | 未実施                                                             |
| 発見元       | 04a Phase 12 unassigned-task-detection (U-1)                       |
| 発見日       | 2026-04-29                                                         |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a では公開 endpoint 4 本（`/public/stats`, `/public/members`, `/public/members/:id`, `/public/form-preview`）の実装と unit テストを完了したが、miniflare 上で D1 binding を立てた contract / integration テストはスコープから外している（Phase 10 で 06a または別タスクへ移送と記録）。`apps/web` の公開実装が始まる時点で contract が必要になる。

### 1.2 問題点・課題

- unit + converter 単体テストでは leak（responseEmail / rulesConsent / adminNotes）の多層防御 6 層が結線で機能している保証は弱い
- `index.ts` での `app.route("/public", ...)` mount 周辺は session middleware 非適用前提だが、middleware 追加リグレッションを captureできるテストが存在しない
- 公開 endpoint は未認証で叩かれるため、leak リグレッションの impact が最大

### 1.3 放置した場合の影響

- session middleware を後続タスクで誤って `/public` にも適用してしまった場合、unit test では検知できない
- 不変条件 #1〜#14（特に admin-managed data 分離）の結線レベル違反を本番環境まで通してしまう
- `apps/web` 公開実装側で contract 不一致が発生したとき、原因特定コストが増大

---

## 2. 何を達成するか（What）

### 2.1 目的

miniflare ベースで `apps/api` を立ち上げ、公開 endpoint 4 本を fetch する contract / integration / leak suite を整備する。

### 2.2 完了状態

- miniflare で D1 binding を持つ Worker を起動できる test harness が存在する
- 公開 endpoint 4 本に対する happy path / leak regression / status filter / pagination の contract test が pass する
- session middleware を `/public` に適用すると test が fail することを保証する（red 確認テスト）

### 2.3 スコープ

#### 含むもの

- miniflare + vitest 統合 test harness の構築（`apps/api/test/contract/` 配下）
- `/public/*` 4 endpoint の happy path contract
- leak regression: `responseEmail` / `rulesConsent` / `adminNotes` が response に含まれないことの結線確認
- status filter (`active` / `provisional` 限定) の結線確認
- pagination meta の結線確認

#### 含まないもの

- `apps/web` 側の e2e（playwright 等）
- KV cache 層が導入された場合のテスト（U-2 の後）
- 認証付き endpoint の contract（別タスク）

### 2.4 成果物

- `apps/api/test/contract/public-*.test.ts`
- miniflare setup util (`apps/api/test/contract/_harness.ts` 等)
- vitest config への contract project 追加
- CI workflow への gate 追加（必要なら別 PR）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04a の本実装がマージ済み
- `apps/api/wrangler.toml` の D1 binding 名が確定している
- D1 fixtures（公開対象 / 非公開ステータス / leak 候補レコード）が用意可能

### 3.2 実行手順

1. miniflare 用 fixture seed SQL を準備（active / provisional / pending / withdrawn / 削除済み 各 1 件）
2. `_harness.ts` で miniflare の D1 bind と `app.fetch` を共通化
3. `/public/stats` の KPI / zone / meetings / lastSync 形状 contract
4. `/public/members` の検索 + pagination contract
5. `/public/members/:id` の 200 / 404 / leak regression
6. `/public/form-preview` の visibility filter contract
7. session middleware を `/public` 配下に挿入する mutation を入れた構成で test を走らせ、fail することを確認するテスト

### 3.3 受入条件 (AC)

- AC-1: `pnpm --filter @ubm/api test:contract` で contract suite が実行できる
- AC-2: 4 endpoint × happy path がすべて pass
- AC-3: leak regression (`responseEmail` / `rulesConsent` / `adminNotes`) が response 全体（JSON.stringify）に含まれないことを assert
- AC-4: 削除済み / pending / withdrawn の member が list にも detail にも出ないことを assert
- AC-5: pagination meta (`page`, `limit`, `total`, `totalPages`) が境界値で正しい
- AC-6: `/public/form-preview` が `visibility !== 'public'` の field を返さない
- AC-7: `/public/*` に session middleware を挿入した状態で 401 にならない（middleware 非適用の保証）テストが存在する

---

## 4. 苦戦箇所 / 学んだこと（04a で得た知見）

### 4.1 leak 防御 6 層の検証粒度

unit test では converter 単体で leak を検証したが、SQL where → repository EXISTS → converter status 二重チェック → visibility filter → runtime delete → zod strict の 6 層が **結線として機能している** ことの保証は contract test でしか得られない。defense in depth は層単位ではなく結線単位でテストする必要がある。

### 4.2 session middleware の適用範囲

`apps/api/src/index.ts` で `/public` を `/public/healthz` 直後に mount する判断をしたが、session middleware の適用順序を後から触るとリグレッションが起きやすい。route mount 順序を test で固定する必要がある。

### 4.3 fixture のメンテ性

miniflare で D1 fixture を seed する際、本番 schema と分岐すると保守不能になる。`_shared/fixtures/` 経由の seed を一本化する方針で skill 化（S-4 改善提案と同じ）すべき。

---

## 5. 関連リソース

- `docs/30-workflows/04a-parallel-public-directory-api-endpoints/outputs/phase-12/implementation-guide.md`
- `apps/api/src/_shared/public-filter.ts`
- `apps/api/src/repository/publicMembers.ts`
- `apps/api/src/routes/public/index.ts`
- 04a Phase 10 outputs / Phase 12 unassigned-task-detection.md U-1
