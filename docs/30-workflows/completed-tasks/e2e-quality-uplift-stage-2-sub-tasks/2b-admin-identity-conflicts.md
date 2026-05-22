# Sub-task 2b — `admin-identity-conflicts.spec.ts` 実装仕様書

> **[実装区分: 実装仕様書]**
> 本サブタスクの成果物は `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（実コード Playwright `.spec.ts`、約 200-240 行）。
> 親 workflow `e2e-quality-uplift-stage-2` のメタは `taskType=docs-only` の仕様書パッケージだが、CONST_004 に従い「後続で実コードを生む単位」は実装仕様書として記述する。
> 判断根拠: 後続出力物は markdown ではなく `.spec.ts` 1 ファイル / Playwright runtime 上で green になる必要がある / Phase 5 §1 #2 で新規実装と明示。

---

## 1. メタ情報

| key | value |
|-----|-------|
| sub-task ID | 2b |
| workflow | `e2e-quality-uplift-stage-2` |
| 対象 route | `/admin/identity-conflicts` |
| 出力ファイル | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| 種別 | E2E (Playwright) / 新規 |
| 行数目安 | 200-240 |
| 実装区分 | 実装仕様書 (CONST_004) |
| coverageTier | standard |
| visualEvidence | NON_VISUAL |
| Implementation Mode | `new` |
| 依存 / ブロッカー | なし（Stage 1 で `signSession()` 活性化済み・既存 fixture 流用） |
| 関連 phase | phase-2 §2.2b / phase-4 §1 Q2 / §3.2 / §4 / phase-5 §3.2 §4 |

---

## 2. 変更対象ファイル一覧

| # | path | 状態 | 行数目安 | 備考 |
|---|------|------|----------|------|
| 1 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 新規 | 200-240 | 本仕様の唯一の生成物 |
| 2 | `apps/web/playwright/fixtures/auth.ts` | 参照のみ | — | `adminPage` / `memberPage` / `anonymousPage` を import |
| 3 | `packages/shared/src/schemas/identity-conflict.ts` | 参照のみ | — | `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` を import（任意・型補強用） |

> 修正対象なし。新規 fixture 追加禁止（index.md §不変条件）。

---

## 3. test 構造表（6 ケース）

| # | test 名 | fixture | 主目的 | 主 assertion |
|---|---------|---------|--------|-------------|
| 1 | 成功系: 一覧表示 | `adminPage` | GET list の正常描画 | items 2 件、source/target member name 表示、`status='pending'` バッジ可視 |
| 2 | 成功系: merge | `adminPage` | merge mutation 経路 | confirm dialog → POST `/identity-conflicts/:id/merge` の request body が `{ targetMemberId, reason }` shape、200 後に該当行が一覧から消失 |
| 3 | 成功系: dismiss | `adminPage` | dismiss mutation 経路 | dismiss ボタン → POST `/dismiss` request body が `{ reason }` shape、200 後 UI 上 dismissed 表示 / 行除去 |
| 4 | DB 整合: merge 後の members 再 fetch | `adminPage` | merge 完了後の整合性反映 | merge 200 → UI が GET `/admin/members/<targetMemberId>` を発火、mock した統合済 row（`mergedAt` 保有）が表示される |
| 5 | 認可: member は 403 page | `memberPage` | admin-only 境界 | 直接 `/admin/identity-conflicts` 遷移 → API 403 → admin layout 内 403 表示 or `/profile` redirect、admin 専用要素は不可視 |
| 6 | 認可: anonymous は `/login` redirect | `anonymousPage` | unauth 境界 | `page.url()` が `/login` を含む |

> skip 0 件。`mergedMemberId` プロパティを使うテストは存在しない（Phase 4 §1 Q2）。

---

## 4. API mock pattern（`page.route()` 戦略）

| # | endpoint | URL pattern | method | 戦略 |
|---|----------|------------|--------|------|
| M1 | GET list | `**/admin/identity-conflicts*` | GET | `route.fulfill({ status:200, json: { items: [identityConflictItem×2] } })`。`beforeEach` で集約 |
| M2 | POST merge | `**/admin/identity-conflicts/*/merge` | POST | request body を `route.request().postDataJSON()` で取得し `{ targetMemberId: string, reason: string }` を assert。`MergeIdentityRequestZ.parse()` 通過必須。response は shared `MergeIdentityResponseZ` 準拠の `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` を 200 で返す |
| M3 | POST dismiss | `**/admin/identity-conflicts/*/dismiss` | POST | request body `{ reason: string }` を assert（`DismissIdentityConflictRequestZ.parse()` 通過必須）。response 200 `{ dismissedAt }` |
| M4 | GET member detail | `**/admin/members/*` | GET | merge 後の再 fetch 用。targetMemberId に対応する統合済 row を返す（`{ id, displayName, mergedAt, ...}`）。シナリオ 4 専用。`page.route()` 上書きで設定 |
| M5 | unauth GET list | `**/admin/identity-conflicts*` | GET | `memberPage` 専用 → 403 / `anonymousPage` 専用 → 401。UI 側の handling と整合 |

mock 上書きルール:
- 共通 GET (M1) は `beforeEach` で固定。M2-M4 は test 内で `await page.route(...)` で追加設定。
- counter は本 spec では不要（race 検証は 2a の責務）。
- D1 への直接アクセスを必要としない（不変条件 5 維持）。

---

## 5. fixture object 標準形

### 5.1 `identityConflictItem`

| field | 型 | 例 / 備考 |
|------|----|----------|
| `id` | `string` | `'cf_001'`（`<src>:<tgt>` 形でも可。route 実装の `:id` パラメータと整合する固定値） |
| `sourceMemberId` | `string` | `'m_src_01'` |
| `targetMemberId` | `string` | `'m_dst_01'` |
| `similarity` | `number` | `0.92` |
| `sourceDisplayName` | `string` | `'山田 太郎'` |
| `targetDisplayName` | `string` | `'山田 太郎（旧）'` |
| `status` | `'pending'` | 一覧 mock では固定 |
| `createdAt` | `string (ISO8601)` | `'2026-05-08T00:00:00Z'` |

> 配列件数 2 件以上（一覧 render の sort 表面化のため。phase-2 §6）。

### 5.2 merge response shape

| field | 型 | 例 |
|------|----|-----|
| `targetMemberId` | `string` | `'m_dst_01'` |
| `archivedSourceMemberId` | `string` | `'m_src_01'` |
| `mergedAt` | `string (ISO8601)` | `'2026-05-09T00:00:00Z'` |
| `auditId` | `string` | `'aud_merge_001'` |

> `mergedMemberId` は **絶対に含めない**（Phase 4 §1 Q2 結論・`identity-merge.ts:149,171` 参照）。
> `sourceMemberId` は list item 側の入力フィールド名としてのみ使用し、merge response では shared schema の `archivedSourceMemberId` を使う。

### 5.3 dismiss response shape

| field | 型 | 例 |
|------|----|-----|
| `dismissedAt` | `string (ISO8601)` | `'2026-05-09T00:00:00Z'` |

### 5.4 merged member detail (M4)

| field | 型 | 備考 |
|------|----|------|
| `id` | `string` | `targetMemberId` と一致 |
| `displayName` | `string` | 統合後の表示名 |
| `mergedAt` | `string (ISO8601)` | UI で「統合済」表示の根拠 |
| `mergedFromMemberId` | `string` | `archivedSourceMemberId` |

---

## 6. 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `adminPage` / `memberPage` / `anonymousPage` fixture（`auth.ts:39-67`） |
| 出力 | spec ファイル 1 件 / Playwright test report 6 件 |
| 副作用 | なし（`page.route()` のみ。実 API・実 D1 を叩かない） |
| 環境変数 | 既存 Playwright config 準拠。本 spec で追加なし |
| ネットワーク | `**/admin/identity-conflicts*` / `**/admin/members/*` を `page.route()` で完全 intercept |

---

## 7. テスト方針

| 項目 | 方針 |
|------|------|
| skip 件数 | **0 件**（cascade preview skip は 2c の責務） |
| `mergedMemberId` 使用 | **禁止**。merge response / fixture / assert すべて `targetMemberId` 系で記述 |
| describe 名 | 日本語可（`'/admin/identity-conflicts × mutation'` 等） |
| test 名 | `成功系: <action>` / `DB 整合: <case>` / `認可: <role> <expected>` |
| fixture 配置 | inline（外部 JSON 化禁止・phase-2 §6） |
| 日時値 | ISO8601 固定（`'2026-05-08T00:00:00Z'`, `'2026-05-09T00:00:00Z'`）。flaky 防止 |
| selector | `getByRole` / `getByText` / `getByTestId` 優先。色値・Tailwind class 依存禁止（不変条件 2） |
| zod 利用 | `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` を import し、mock handler 内で request body の `parse()` を実行（contract drift 即検出） |
| network mock | `page.route()` のみ。`page.unroute()` は `afterEach` で明示 cleanup（必要時） |
| 認可分岐 | member は API 403 → UI 403/redirect 表示確認。anonymous は `page.url()` が `/login` を含むこと |

---

## 8. ローカル実行コマンド

```bash
# 依存インストール（mise 経由で Node 24 / pnpm 10 を保証）
mise exec -- pnpm install

# 本 spec のみを実行
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts

# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# Lint
mise exec -- pnpm lint
```

> 全 spec を流したい場合は `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e`。

---

## 9. DoD（Definition of Done）

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` がリポジトリに存在する | `git ls-files apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| 2 | 6 test すべて green | `pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts` 終了コード 0 |
| 3 | typecheck pass | `pnpm --filter @ubm-hyogo/web typecheck` 終了コード 0 |
| 4 | lint pass | `pnpm lint` 終了コード 0 |
| 5 | 3 ロール分岐（admin / member / anonymous）が 1 ファイル内に共存 | grep `adminPage` / `memberPage` / `anonymousPage` がそれぞれ ≥1 hit |
| 6 | network 経路は `page.route()` mock のみ | `grep -nE "fetch\(|http://" admin-identity-conflicts.spec.ts` で実 endpoint hit 0 |
| 7 | merge response shape が `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` で shared `MergeIdentityResponseZ` parse 通過 | mock handler 内 `parse()` 呼び出しが test 中で例外を投げない |
| 8 | `mergedMemberId` 文字列が spec 内に出現しない | `grep -n "mergedMemberId" admin-identity-conflicts.spec.ts` が 0 hit |
| 9 | skip 0 件 | `grep -n "test.skip\|test.fixme" admin-identity-conflicts.spec.ts` が 0 hit |
| 10 | 行数 200-240 の範囲内 | `wc -l admin-identity-conflicts.spec.ts` |

---

## 10. 不変条件チェック（CLAUDE.md UI alignment 不変条件 1-5）

| # | 不変条件 | 本 spec での遵守方法 |
|---|---------|--------------------|
| 1 | 既存 API endpoint surface のみ利用・新規 endpoint 禁止 | `apps/api/src/routes/admin/identity-conflicts.ts:38,54,91` の 3 endpoint と `/admin/members/:id` のみを mock 対象とする。新 endpoint mock 禁止 |
| 2 | OKLch トークン正本化（HEX 直書き禁止） | selector で色値・`bg-[#xxx]` / `text-[#xxx]` 依存しない。`getByRole` / `getByTestId` を優先 |
| 3 | プロトタイプ正本順位（primitives 共有） | 新規 primitive を生成せず、UI 側既存 primitive の semantics（role / aria）に対して assert |
| 4 | D1 直接アクセス禁止（`apps/web` から D1 binding 禁止） | spec は `page.route()` mock のみ。D1 / Workers binding 操作なし |
| 5 | spec のみ作成・新規 fixture 禁止 | `auth.ts` の既存 3 fixture を import するだけ。新 fixture 追加なし |

---

## 11. 依存・ブロッカー

| 項目 | 状態 |
|------|------|
| API 実装ブロッカー | **なし**（GET 38 / merge 54 / dismiss 91 すべて実装済 / `apps/api/src/routes/admin/identity-conflicts.ts`） |
| repository 層 | `apps/api/src/repository/identity-merge.ts:149,171` で `targetMemberId` 返却確認済 |
| 共有 schema | `packages/shared/src/schemas/identity-conflict.ts` に `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` 公開済（再 export 不要） |
| fixture 層 | `apps/web/playwright/fixtures/auth.ts:39-67` で 3 ロール公開済 / Stage 1 で `signSession()` 活性化済 |
| UI 層 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` 実在前提（Phase 1 inventory で確認済 / phase-2 R5） |
| 後段 sub-task | 2d contract test が本 spec と同 fixture / 同 schema を参照する。本 spec の fixture 形（§5）を 2d で再利用可能にする |

---

## 12. 参照ファイル / セクション一覧

| 種別 | path / セクション |
|------|------------------|
| 親 index | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md` |
| 設計 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-2.md` §2.2b / §3 / §6 |
| Open Questions 解決 | `phase-4.md` §1 Q2（`mergedMemberId` 不使用）/ §3.2 / §4 |
| 実装ガイド | `phase-5.md` §3.2 / §4 fixture 標準形 |
| API GET | `apps/api/src/routes/admin/identity-conflicts.ts:38` |
| API merge | `apps/api/src/routes/admin/identity-conflicts.ts:54` |
| API dismiss | `apps/api/src/routes/admin/identity-conflicts.ts:91` |
| repository | `apps/api/src/repository/identity-merge.ts:149,171`（`targetMemberId` 返却根拠） |
| 共有 schema | `packages/shared/src/schemas/identity-conflict.ts`（`MergeIdentityRequestZ` / `MergeIdentityResponseZ` / `DismissIdentityConflictRequestZ`） |
| fixture | `apps/web/playwright/fixtures/auth.ts:1-67` |
| プロジェクト基準 | `CLAUDE.md` UI alignment 不変条件 1-5 |

---

## 13. 完了条件（仕様書側 Phase 観点）

- [x] メタ情報・変更対象・test 構造・mock pattern・fixture・I/O・テスト方針・実行コマンド・DoD・不変条件・依存が表で明示されている
- [x] `mergedMemberId` 不使用が明文化されている（§3 / §5.2 / §9-8）
- [x] merge response shape が `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` で固定されている（§5.2）
- [x] skip 0 件 / 6 ケースが明示されている（§3 / §9-9）
- [x] D1 直接アクセス禁止 / fixture 追加禁止 / OKLch 不変条件が遵守されている（§10）
- [x] 行数目安 200-240 / Implementation Mode `new` が記載されている（§1 / §2）

> 本サブタスクの実コード生成は本ワークフロー Stage 2 の Phase 5 配下で行われる前提。本仕様書はその受け入れ基準（DoD §9）を確定する。
