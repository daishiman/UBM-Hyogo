# Phase 1: 要件定義 — サブタスク 2a `/admin/requests` E2E

> **[実装区分: 実装仕様書]**
>
> CONST_004 判定根拠: 本仕様書の最終成果物は `apps/web/playwright/tests/admin-requests.spec.ts`
> という Playwright `.spec.ts` の TypeScript ソースであり、CI（`pnpm --filter @ubm-hyogo/web test:e2e`）
> が直接 green/red を判定する**ランタイム実行対象の実装コード**である。出力が runtime 成果物に
> 直接接続するため、`taskType=docs-only` ラベルの有無に関わらず「実態優先」で実装仕様書として作成する。

---

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| workflow_id | `task-spec-2a-admin-requests-e2e` |
| 親 workflow | `e2e-quality-uplift-stage-2` |
| sub-task ID | `2a`（単体スコープ。2b / 2c / 2d は対象外） |
| 起点日 | 2026-05-09 |
| Implementation Mode | `new`（新規ファイル追加） |
| coverageTier | standard（line >= 70% / critical smoke 100%） |
| visualEvidence | NON_VISUAL（mock 駆動・スクリーンショット不要） |
| workflow_state | spec_verified |
| evidence_state | runtime_pending |
| 単一サイクル | CONST_007 適用（仕様書 → spec 実装 → green 化を 1 サイクル完結） |
| 実装区分 | **実装仕様書**（CONST_004） |
| 主入力 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 親仕様書 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/{index.md, phase-1.md, phase-2.md, phase-4.md, phase-5.md}` |

---

## 2. 目的

`/admin/requests` ルートの **mutation flow（approve / reject）**、**race（二重 approve → 409）**、
**admin-only 認可境界（admin / member / anonymous の 3 ロール分岐）** を、
Playwright + `page.route()` mock のみで決定論的に検証する E2E spec を新規追加する。

D1 への直接アクセスを介さず、Stage 1 で活性化済の既存 fixture（`adminPage` / `memberPage` / `anonymousPage`）を
再利用して認可境界を観測可能にする。新 endpoint 追加・新 fixture 追加・D1 schema 変更を行わず、
既存 API endpoint surface の挙動を UI 越しに保証する。

---

## 3. スコープ

| 含む | 含まない |
|------|----------|
| approve 成功 / reject 成功 / pending 一覧 render の 3 成功系 | 新規 API endpoint 追加 |
| stale approve race（stale 409 mock で 1 回目 200 / 2 回目 409） | D1 schema 変更 |
| 認可 3 ロール検証（admin / member / anonymous） | Google Form 仕様変更 |
| `page.route()` による GET / POST mock（spec 内 inline） | 新 fixture 追加（既存 `auth.ts` のみ再利用） |
| `adminRequestItem` fixture object 定義（spec 内 inline） | mock helper の `helpers/` 抽出（Phase 8 リファクタで実施） |
| `apps/web/playwright/fixtures/auth.ts` の 3 fixture import | サブタスク 2b / 2c / 2d の test |
| | cascade preview の `test.skip`（2c 専用） |

> 2b / 2c / 2d との関係: 完全独立で並列実装可。本仕様書は 2a 単体に閉じる。

---

## 4. Pre-conditions（前提条件）

| # | 前提 | 確認方法 / 出典 |
|---|------|----------------|
| 1 | Stage 1（admin smoke + fixtures 整備）が完了し、`signSession()` が活性化済 | `apps/web/playwright/fixtures/auth.ts:1-67` の 3 fixture が利用可能 |
| 2 | API endpoint 実装済（GET `/admin/requests` / POST `/admin/requests/:noteId/resolve`） | `apps/api/src/routes/admin/requests.ts:194,254` |
| 3 | UI route 実装済（`/admin/requests` page） | `apps/web/app/(admin)/admin/requests/page.tsx` 存在 |
| 4 | `adminPage` cookie が `requireAdmin` middleware を通過する | Stage 1 で確認済 |
| 5 | `requireAdmin` middleware の動作（API 401/403 + UI 側 `/login` redirect / 403 page）が確定 | 親 workflow Phase 4 §1 Q1 で解決済 |
| 6 | `apps/web/playwright/tests/admin-requests.spec.ts` が未作成 | `test -f` で不在確認 |
| 7 | 命名規則と既存モデルが利用可能 | 参照: `apps/web/playwright/tests/admin-pages.spec.ts` |

---

## 5. 受け入れ基準（AC）

| # | 受け入れ基準 | 観測方法 |
|---|-------------|---------|
| AC1 | `apps/web/playwright/tests/admin-requests.spec.ts` が新規追加され、仕様ケース 6 件 の範囲に収まる | `wc -l` |
| AC2 | 6 test 全 green / `test.skip` 0 件 | Playwright reporter |
| AC3 | 成功系 3（一覧 / approve / reject）/ 失敗系 1（race 409）/ 認可系 2（member / anonymous）の構成 | spec inspect |
| AC4 | `page.route()` mock のみで実行され、D1 binding / Google API への直接アクセス 0 | spec 内 `route.fulfill` 確認 + binding 参照 grep 0 |
| AC5 | 既存 fixture（`adminPage` / `memberPage` / `anonymousPage`）のみ利用、新 fixture 追加なし | `auth.ts` の diff 0 |
| AC6 | counter 付き race mock で 2 回目が 409（`already_resolved`）を返す経路が含まれる | spec inspect |
| AC7 | reject test で空送信時に inline validation error が観測され、入力後 POST body に `{ resolution: 'reject', resolutionNote }` が含まれる | request body assert |
| AC8 | selector が `getByRole` / `getByLabel` / `getByText` ベースで、色値依存（`bg-[#xxx]` 等）を含まない | spec inspect + grep |
| AC9 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `mise exec -- pnpm lint` 全 pass | tsc / ESLint exit 0 |
| AC10 | fixture object に `mergedMemberId` 等 Stage 2 横断で禁止された key を含まない | `grep -c "mergedMemberId" == 0` |

---

## 6. 対象テストファイル

| # | path | 区分 | 行数目安 | 備考 |
|---|------|------|----------|------|
| 1 | `apps/web/playwright/tests/admin-requests.spec.ts` | **新規** | 実装に応じた最小行数 | 本サブタスクの主成果物 |
| 2 | `apps/web/playwright/fixtures/auth.ts` | 既存・参照のみ | — | `adminPage` / `memberPage` / `anonymousPage` を named import |
| 3 | `apps/api/src/routes/admin/requests.ts` | 既存・参照のみ | — | mock 対象 endpoint shape の正本（GET 194 行付近 / POST resolve 254 行付近） |

> 本サブタスクで**修正・削除対象ファイルは存在しない**。新規 1 ファイルのみ追加。

---

## 7. 関数 / 型シグネチャ（Phase 2 で詳細化、Phase 1 で骨格を確定）

| # | 識別子 | 種別 | 配置 | 用途 |
|---|--------|------|------|------|
| 1 | `AdminRequestItem` | TypeScript type | spec 内 inline | fixture object の型契約 |
| 2 | `adminRequestItem` | 値（const） | spec 内 inline | 単一 row の base fixture |
| 3 | `listFixture` | 値（const） | spec 内 inline | 3 件の pending list（test 1-4 の `beforeEach` 用） |
| 4 | `test.describe('/admin/requests × admin mutation flow')` | Playwright describe | spec top-level | ルートグループ |
| 5 | `test.describe('admin role')` | Playwright describe | 上記配下 | test 1-4（`adminPage` fixture） |
| 6 | `test.describe('authorization boundary')` | Playwright describe | 上記配下 | test 5-6（`memberPage` / `anonymousPage`） |

> 詳細な型定義は Phase 2 §6（fixture object 標準形）で確定する。

---

## 8. 入出力（test 別の前提・操作・期待観測）

| # | test | 前提状態 | 操作 | 期待 UI | 期待 Network | 副作用 |
|---|------|----------|------|---------|------------|--------|
| 1 | 一覧 render | `adminPage` cookie / GET mock 装着 | route 訪問 | row 3 件・各行に pending バッジ | GET `/admin/requests` 1 回 | なし |
| 2 | approve | test 1 + POST 200 mock | row[0] approve 押下 | 該当 row 消失（再 fetch or optimistic） | POST resolve 1 回、body `{ resolution: 'approve' }` | なし |
| 3 | reject | test 1 + POST 200 mock + reason input | reject → modal → 空 submit → 入力後 submit | 空 submit で inline error → 入力後 row 消失 | POST resolve 1 回、body `{ resolution: 'reject', resolutionNote }` | なし |
| 4 | race | stale 409 mock | approve 連続 2 回 | 2 回目で error toast/alert | POST resolve 2 回（1 回目 200、2 回目 409） | なし |
| 5 | member: /login?gate=admin_required | `memberPage` cookie | `/admin/requests` 訪問 | `/login?gate=admin_required` redirect / admin row 不可視 | API 任意（`requireAdmin` で 403） | なし |
| 6 | anonymous: redirect | `anonymousPage`（cookie なし） | `/admin/requests` 訪問 | `page.url()` が `/login` を含む | API 任意（401） | なし |

> 副作用は全て mock 上に留まり、D1 / Google API / file system へ伝播しない（CLAUDE.md 不変条件 5 維持）。

---

## 9. テスト方針

| 区分 | カウント | 必須 / 任意 | 備考 |
|------|---------|-------------|------|
| 成功系 | 3（test 1, 2, 3） | 必須 | 一覧 render / approve / reject |
| 失敗系 | 1（test 4） | 必須 | stale approve race（409） |
| 認可 | 2（test 5, 6） | 必須 | member `/login?gate=admin_required` / anonymous `/login` redirect |
| `test.skip` | **0**（**禁止**） | — | cascade preview の skip は 2c のみ。2a では一切使用しない |
| 合計 | 6 | — | — |

---

## 10. 実行コマンド（ローカル / CI）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

> `pnpm install --force` は不要（lockfile 変更を伴わないため）。

---

## 11. Definition of Done（DoD・Phase 1 観点）

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | 主入力（`2a-admin-requests.md`）の §1〜§14 が本仕様書に網羅されている | 章マッピング確認 |
| 2 | 受け入れ基準 AC1–AC10 が観測可能な形で表現されている | §5 表 |
| 3 | Pre-conditions 7 項目が出典付きで列挙されている | §4 表 |
| 4 | 対象テストファイル（新規 1 / 参照 2）が確定している | §6 表 |
| 5 | 実装区分判定根拠（CONST_004）が冒頭で明示されている | 冒頭 quote |
| 6 | CLAUDE.md UI alignment 不変条件 1-5 と Stage 2 横断不変条件が反映されている | §12 |

---

## 12. 不変条件チェック（CLAUDE.md UI alignment 1-5 + Stage 2 横断）

| # | 不変条件 | 出典 | 本 Phase での適合 |
|---|----------|------|------------------|
| 1 | 既存 API endpoint surface のみ利用、新 endpoint 追加・D1 schema 変更・Google Form 仕様変更禁止 | CLAUDE.md UI alignment §不変条件 1 | mock 対象は `apps/api/src/routes/admin/requests.ts` の既存 GET / POST resolve のみ。新 endpoint 0 |
| 2 | OKLch トークン正本化、HEX 直書き / `bg-[#xxx]` 禁止 | CLAUDE.md UI alignment §不変条件 2 | spec selector に色値依存なし（AC8） |
| 3 | プロトタイプ正本順位（primitives + tokens + rhythm 維持） | CLAUDE.md UI alignment §不変条件 3 | UI primitives を生やさず既存画面に対する e2e のみ |
| 4 | `apps/web` から D1 binding 直接アクセス禁止 | CLAUDE.md 重要不変条件 5 | `page.route()` mock のみ。D1 binding 参照 0（AC4） |
| 5 | 既存 fixture 再利用、新 fixture 追加禁止 | 親 workflow `index.md` | `auth.ts` の 3 fixture を import するのみ（AC5） |
| S1 | `page.route()` mock 限定、D1 直接アクセス回避 | Stage 2 横断不変条件 | 全 mock を `page.route()` で記述 |
| S2 | `test.skip` 禁止（cascade preview のみ 2c で許容） | Stage 2 横断 + CONST_007 | 本 spec の skip 0 件（AC2） |

---

## 13. 依存・ブロッカー

| 項目 | 状態 | 備考 |
|------|------|------|
| Stage 1 admin smoke + fixtures | 完了済 | `signSession()` 活性化済、3 fixture 利用可能 |
| `apps/api/src/routes/admin/requests.ts` | 完了済 | GET 194 行付近 / POST resolve 254 行付近 |
| `apps/web/app/(admin)/admin/requests/page.tsx` | 完了済 | UI route 存在前提 |
| 親 workflow Phase 4 Open Question Q1（`requireAdmin` 動作） | 解決済 | API 401/403 JSON + UI 側 `/login` redirect / 403 page |
| 2b / 2c / 2d | **独立** | 2a の green 化は他サブタスク完了に依存しない |

> **ブロッカー: なし**。本仕様書受領後すぐに Phase 2（設計）→ spec 実装フェーズへ進める。

---

## 14. 参照

| 用途 | path |
|------|------|
| 主入力（実装仕様の正本） | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| governance index | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/index.md` |
| 親 workflow Phase 1 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-1.md` |
| API 実装（GET / POST resolve） | `apps/api/src/routes/admin/requests.ts:194,254` |
| fixture 正本 | `apps/web/playwright/fixtures/auth.ts:1-67` |
| 命名・構造の参照モデル | `apps/web/playwright/tests/admin-pages.spec.ts` |
| UI alignment 不変条件 | `CLAUDE.md` § UI prototype alignment / MVP recovery |
