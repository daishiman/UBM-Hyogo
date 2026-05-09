# Phase 1: 要件定義

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-08 |
| Implementation Mode | `new`（4 sub-task すべて新規ファイル） |
| Tier | standard |

## 共通前提条件

- `apps/web/playwright/fixtures/auth.ts:18-66` に `adminPage` / `memberPage` / `anonymousPage` 既存。再利用必須。
- `apps/web/playwright/tests/admin-pages.spec.ts` に admin 5 画面の smoke 既存（PR #594）。本 Stage は **mutation flow 系を追加**。
- API endpoint は全て実装済み（index.md「API endpoint inventory」参照）。
- `page.route()` mock により D1 を介さない。テスト fixture 内で response shape を組み立てる。
- 命名規則: `apps/web/playwright/tests/<area>-<action>.spec.ts`。

## P50 pre-check（Stage 全体）

| 観点 | 判定 |
|------|------|
| 既存 fixture で admin / member / anonymous をカバーできるか | OK（auth.ts:18-66） |
| 対象 endpoint が API 側に存在するか | OK（index.md inventory） |
| UI route が実在するか | OK（`apps/web/app/(admin)/admin/{requests,identity-conflicts,members}/`） |
| D1 直接アクセスを避けられるか | OK（`page.route()` mock のみ） |
| spec ファイル命名が衝突しないか | OK（`apps/web/playwright/tests/` 配下に同名なし） |

---

## 2a — `admin-requests.spec.ts`

### スコープ

| # | シナリオ | 検証 |
|---|---------|------|
| 1 | pending 一覧 render | GET `/admin/requests?status=pending` mock → 行数・列見出し |
| 2 | approve 成功 | POST `/admin/requests/:noteId/resolve` 200 → 一覧 refresh |
| 3 | reject + reason | POST 200 + body に `resolutionNote` 含む |
| 4 | approve race（並列クリック） | 2 回目の POST 200 idempotent（mock で 200 を返却） |
| 5 | admin-only access | member → 403、anonymous → `/login` redirect |

### Pre-conditions

- `/admin/requests` page 実装済み（`apps/web/app/(admin)/admin/requests/page.tsx` 存在前提）。
- `adminPage` cookie が `requireAdmin` middleware を通過する想定（fixture 既存実装）。

### 受け入れ基準

- 5 シナリオすべて green。
- `page.route()` で GET / POST の両系を mock。
- mutation 後の **再 fetch（refresh）** を waitFor で確認。

### 対象テストファイル

- 新規: `apps/web/playwright/tests/admin-requests.spec.ts`

---

## 2b — `admin-identity-conflicts.spec.ts`

### スコープ

| # | シナリオ | 検証 |
|---|---------|------|
| 1 | conflict 一覧 render | GET `/admin/identity-conflicts` mock → 行数・候補ペア |
| 2 | merge 成功 | confirm dialog → POST `/identity-conflicts/:id/merge` 200 |
| 3 | reject merge | dismiss action → POST `/identity-conflicts/:id/dismiss` 200 |
| 4 | DB 整合 post-merge | merge 後に GET `/admin/members/:mergedId` mock → 統合済 row 確認 |
| 5 | admin-only access | member → 403、anonymous → `/login` redirect |

### Pre-conditions

- `/admin/identity-conflicts` page 実装済み（`apps/web/app/(admin)/admin/identity-conflicts/page.tsx`）。
- merge confirm UI が dialog または ConfirmDialog primitive で実装されている前提（プロトタイプ正本順位 3）。

### 受け入れ基準

- merge / dismiss 双方の API call assertion。
- merge 後の **DB 整合 assertion** は API GET mock の response で確認（D1 直接アクセスなし）。
- 認可境界 2 ロール分岐。

### 対象テストファイル

- 新規: `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`

---

## 2c — `admin-member-delete.spec.ts`

### スコープ

| # | シナリオ | 検証 |
|---|---------|------|
| 1 | 二段確認（checkbox + reason） | submit 前に両方未充足だと button disabled |
| 2 | cascade delete preview | confirm 前に「関連 N 件削除予告」表示 |
| 3 | delete 成功 | POST `/admin/members/:id/delete` 200 → 一覧 refresh |
| 4 | admin-only access | member → 403、anonymous → `/login` redirect |
| 5 | audit log 連動 | delete 後に GET `/admin/audit` mock → 該当 entry 存在 assert |

### Pre-conditions

- `/admin/members` page に delete gate UI 実装済み（component: `apps/web/src/components/admin/` 配下想定）。
- audit endpoint が delete 操作を記録する設計（`apps/api/src/routes/admin/member-delete.ts:44` + `audit.ts:144`）。

### 受け入れ基準

- 5 シナリオ green。
- 二段確認 UI が disabled 制御込みで観測可能。
- audit assertion は **GET `/admin/audit` mock の return shape** に該当 entry を含めて間接検証。

### 対象テストファイル

- 新規: `apps/web/playwright/tests/admin-member-delete.spec.ts`

---

## 2d — Contract test 拡張

### スコープ

2a/2b/2c で mock 対象とする endpoint について、**UI 期待 shape ↔ API 実装 shape** の同型性を契約テストで保証する。

### 対象 endpoint（index.md inventory 抜粋）

| endpoint | UI consumer | shape 検証ポイント |
|----------|------------|-------------------|
| GET `/admin/requests` | 2a 一覧 | `{ items: [{ noteId, type, status, createdAt, … }] }` |
| POST `/admin/requests/:id/resolve` | 2a approve/reject | `{ resolution, resolutionNote? }` request / `{ resolvedAt }` response |
| GET `/admin/identity-conflicts` | 2b 一覧 | `{ items: [{ id, candidateA, candidateB, … }] }` |
| POST `/identity-conflicts/:id/merge` | 2b merge | `{ mergedMemberId, … }` |
| POST `/identity-conflicts/:id/dismiss` | 2b dismiss | `{ dismissedAt }` |
| POST `/admin/members/:id/delete` | 2c delete | `{ reason }` request / `{ deletedAt, cascade: { … } }` response |
| GET `/admin/audit` | 2c audit assert | `{ items: [{ entryId, action, targetId, actorId, at, … }] }` |

### 既存 contract test 配置

- `apps/api/src/audit-correlation/__tests__/contract.test.ts:1`
- `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts:1`

> Stage 2d は新規 contract test を **既存 `__tests__` 直下** に追加する。endpoint 単位で 1 ファイル、または 1 ファイルに集約のいずれかは Phase 2 で判定。

### 受け入れ基準

- 上表 7 endpoint 全件で request / response shape が zod schema または同等の型契約で検証される。
- UI 側 fixture（`page.route()` の return shape）と同じ schema を share できること。

### 対象テストファイル（新規 / 拡張）

- 新規 or 既存拡張: `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（Phase 2 で確定）

---

## Inventory（成果物一覧）

| 種別 | path | 状態 |
|------|------|------|
| spec doc | `docs/30-workflows/e2e-quality-uplift-stage-2/index.md` | 本 Stage で作成 |
| spec doc | `docs/30-workflows/e2e-quality-uplift-stage-2/phase-1.md` | 本ファイル |
| spec doc | `docs/30-workflows/e2e-quality-uplift-stage-2/phase-2.md` | 本 Stage で作成 |
| spec doc | `docs/30-workflows/e2e-quality-uplift-stage-2/phase-3.md` | 本 Stage で作成 |
| (実装範囲外) | `apps/web/playwright/tests/admin-requests.spec.ts` | 後続タスクで実装 |
| (実装範囲外) | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 後続タスクで実装 |
| (実装範囲外) | `apps/web/playwright/tests/admin-member-delete.spec.ts` | 後続タスクで実装 |
| (実装範囲外) | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 後続タスクで実装 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

