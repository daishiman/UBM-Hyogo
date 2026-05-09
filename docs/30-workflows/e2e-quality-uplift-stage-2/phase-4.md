# Phase 4: テスト作成（TDD Red 設計）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 対象 | sub-task 2a / 2b / 2c / 2d |
| Implementation Mode | `new` |
| 前提 | Stage 1 完了（`signSession()` 活性化済み）/ Phase 1-3 GO |

> 本 Phase は **TDD Red** に相当。spec ファイルを「失敗する状態」で記述し、後続 Phase 5 で実装を Green 化させる設計を確定する。

---

## 1. Open Questions の Phase 4 入口での解決記録

| # | 問い | 解決結果 | 根拠 |
|---|------|---------|------|
| Q1 | `requireAdmin` middleware が member に対し 403 か `/login` redirect か | **API は 401/403 を JSON で返す**（`requireAdmin` は middleware 層で `c.json({error:"unauthorized"},401)` / `c.json({error:"forbidden"},403)`）。UI 側は `apps/web` の middleware/route handler が 401 を捕捉して `/login` redirect する想定。member（cookie 有・isAdmin=false）→ **API 403 → UI は admin layout で 403 page or `/profile` redirect**、anonymous → **API 401 → UI は `/login` redirect** | `apps/api/src/middleware/require-admin.ts:80,84,110,114,117-118` |
| Q2 | merge response に `mergedMemberId` が含まれるか | **含まれない**。`mergeIdentities()` の戻り値は `targetMemberId` を返す（identity-merge.ts:149,171）。spec の mock fixture は `{ targetMemberId, sourceMemberId, mergedAt }` shape に修正 | `apps/api/src/repository/identity-merge.ts:149,171` |
| Q3 | `/admin/members/:id/delete` の `reason` 必須/任意 | **必須**。`DeleteBodyZ = z.object({ reason: z.string().trim().min(1).max(500) })`。空文字 / 欠落は 422 | `apps/api/src/routes/admin/member-delete.ts:10,53-56` |
| Q4 | audit endpoint の sort 順 | Phase 4 で確認した結果、audit エンドポイント側は spec mock では sort 順を固定 fixture で表現するため **実装側 sort 順に依存しない** 設計とする | `apps/api/src/routes/admin/audit.ts:144` (mock 側で order 固定) |
| Q5 | cascade preview endpoint 実在 | **未実装**。`grep -rn "delete-preview\|deletePreview\|cascade.*preview"` で 0 件。**2c シナリオ 2（cascade preview）は skip + Stage 3 持越し**。phase-12 未タスクへ送る | grep 結果 0 件 |
| Q6 | 2d schema share 可否 | **可能**。merge / dismiss の zod schema は `packages/shared/src/schemas/identity-conflict.ts:28` 等で既に share 済み。**schema 切り出し PR の先行は不要**。`DeleteBodyZ` のみ route 内 inline のため、必要なら 2d 内で route から再 export して share | `packages/shared/src/schemas/identity-conflict.ts:28` |

> Q5 結論により、**phase-2 §2.2c シナリオ 2 は `test.skip()` + `// TODO(stage-3): cascade preview API 実装後に有効化` コメントで残す**。

---

## 2. テストファイル一覧（targeted test file list）

| # | path | 種別 | 状態 |
|---|------|------|------|
| 2a | `apps/web/playwright/e2e/admin-requests.spec.ts` | E2E (Playwright) | 新規 |
| 2b | `apps/web/playwright/e2e/admin-identity-conflicts.spec.ts` | E2E (Playwright) | 新規 |
| 2c | `apps/web/playwright/e2e/admin-member-delete.spec.ts` | E2E (Playwright) | 新規 |
| 2d | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | Vitest contract | 新規 |

> ファイル命名は既存 `apps/web/playwright/e2e/admin-pages.spec.ts` 命名規則と整合（kebab-case + `.spec.ts`）。

---

## 3. spec 別 test 構造（Red 状態の設計）

### 3.1 `admin-requests.spec.ts` (2a)

| # | test 名 | fixture | 主 assertion |
|---|---------|---------|-------------|
| 1 | 成功系: pending list 表示 | `adminPage` | `getByRole('row')` が 3 件、`status=pending` バッジ可視 |
| 2 | 成功系: approve | `adminPage` | POST body に `resolution:'approve'`、UI から該当行が消える |
| 3 | 成功系: reject + 理由必須 | `adminPage` | reject ボタン → modal → reason 必須 validation、POST body に `resolution:'reject', resolutionNote` |
| 4 | 失敗系: race（二重 approve） | `adminPage` | 1 回目 200 / 2 回目 409 (`already_resolved`) → toast/alert 観測 |
| 5 | 認可: member は 403 page | `memberPage` | UI は admin layout 内で 403 page or `/profile` redirect、`adminPage` 専用要素は不可視 |
| 6 | 認可: anonymous は `/login` redirect | `anonymousPage` | `page.url()` が `/login` を含む |

### 3.2 `admin-identity-conflicts.spec.ts` (2b)

| # | test 名 | fixture | 主 assertion |
|---|---------|---------|-------------|
| 1 | 成功系: 一覧表示 | `adminPage` | items 2 件、source/target member name 表示 |
| 2 | 成功系: merge | `adminPage` | confirm dialog → POST `/identity-conflicts/:id/merge` body `{ targetMemberId, reason }`、200 後一覧から消失 |
| 3 | 失敗系: merge reject（dismiss） | `adminPage` | dismiss ボタン → POST `/dismiss` body `{ reason }`、UI dismissed 表示 |
| 4 | DB 整合: merge 後の members 再 fetch | `adminPage` | merge 200 後 GET `/admin/members/<targetMemberId>` を mock、UI が再 fetch して merge 済 row 表示 |
| 5 | 認可: member 403 / anonymous redirect | `memberPage` / `anonymousPage` | 上記 2a と同パターン |

### 3.3 `admin-member-delete.spec.ts` (2c)

| # | test 名 | fixture | 主 assertion |
|---|---------|---------|-------------|
| 1 | 成功系: 二段確認 → 削除 | `adminPage` | 1 段目 button click → 2 段目 confirm dialog（reason 入力）→ POST 200、UI 該当行 `is_deleted` 表示切替 |
| 2 | (skip) cascade preview | — | `test.skip()` + `// TODO(stage-3): cascade preview API 未実装` |
| 3 | 失敗系: reason 空 → 422 | `adminPage` | reason 未入力で submit → API 422 → UI inline error |
| 4 | audit log entry 連動 | `adminPage` | 削除後に GET `/admin/audit` mock → `action='admin.member.deleted'` entry を一覧で表示 |
| 5 | 認可: member 403 / anonymous redirect | `memberPage` / `anonymousPage` | 同上 |

### 3.4 `contract-stage-2.test.ts` (2d)

| describe | schema source | test |
|---------|--------------|------|
| `GET /admin/requests` | route 実装の query schema | UI fixture object を `parse` → ok |
| `POST /admin/requests/:id/resolve` | request body schema | `{ resolution:'approve' }` / `{ resolution:'reject', resolutionNote }` parse |
| `GET /admin/identity-conflicts` | route schema + `IdentityConflict` zod | items[].shape 同型 |
| `POST /admin/identity-conflicts/:id/merge` | `MergeIdentityRequestZ`（`packages/shared`） | UI fixture parse + response shape `{ targetMemberId, sourceMemberId, mergedAt }` 確認 |
| `POST /admin/identity-conflicts/:id/dismiss` | `DismissIdentityConflictRequestZ` | parse |
| `POST /admin/members/:id/delete` | `DeleteBodyZ`（route 内 inline → 2d で再 export） | `reason` 必須・空 NG |
| `GET /admin/audit` | response schema | items[].shape 同型 |

---

## 4. API mock pattern per endpoint（`page.route()` 戦略）

| endpoint | URL pattern | method | mock 戦略 |
|----------|------------|--------|----------|
| GET `/admin/requests` | `**/admin/requests*` | GET | inline fixture（items 3 件 / status=pending） |
| POST `/admin/requests/:id/resolve` | `**/admin/requests/*/resolve` | POST | counter 付き handler（1 回目 200 / 2 回目 409 で race 検証） |
| GET `/admin/identity-conflicts` | `**/admin/identity-conflicts*` | GET | items 2 件 |
| POST `/admin/identity-conflicts/:id/merge` | `**/identity-conflicts/*/merge` | POST | request body assert + 200 `{ targetMemberId, sourceMemberId, mergedAt }` |
| POST `/admin/identity-conflicts/:id/dismiss` | `**/identity-conflicts/*/dismiss` | POST | 200 `{ dismissedAt }` |
| POST `/admin/members/:id/delete` | `**/admin/members/*/delete` | POST | reason 空 → 422 / reason 有 → 200 `{ id, isDeleted, deletedAt }` |
| GET `/admin/audit` | `**/admin/audit*` | GET | 削除 entry を含む items |
| GET `/admin/members/:id` | `**/admin/members/*` | GET | merge 後の整合 row（2b シナリオ 4 専用） |

> mock counter は `let calls = 0` を test scope で保持し、`route.fulfill` 内で increment して分岐する。

---

## 5. 命名規則整合性チェック

| 項目 | 規則 | 適合 |
|------|------|------|
| ファイル名 | kebab-case + `.spec.ts` | OK |
| test.describe 名 | 日本語可（既存 `admin-pages.spec.ts:11` 準拠） | OK |
| test 名 | `成功系: <action>` / `失敗系: <case>` / `認可: <role> <expected>` | OK |
| fixture 名 | `adminPage` / `memberPage` / `anonymousPage`（追加禁止） | OK |
| contract test ファイル名 | `contract-stage-2.test.ts`（既存 `contract.test.ts` と並列） | OK |

---

## 6. Red 状態の確認方法

| spec | Red の根拠 |
|------|-----------|
| 2a / 2b / 2c | spec ファイル新規作成。実装側に対応 UI handler / dialog / toast が無い場合 fail |
| 2d | UI fixture object と API route の zod schema が同型でない場合 parse 失敗 |

---

## 7. Phase 4 完了定義

- [x] Open Questions Q1-Q6 が解決済（§1）
- [x] テストファイル 4 件の path / 種別 / 状態が確定（§2）
- [x] spec 別 test 構造表が完成（§3）
- [x] mock pattern が endpoint 単位で表化（§4）
- [x] 命名規則の整合確認（§5）
- [x] cascade preview skip + Stage 3 持越し記録（§1 Q5）
- [x] 2d schema share 可否確定（§1 Q6）

> Phase 5 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 4
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

