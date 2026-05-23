[実装区分: 実装仕様書]

> **CONST_004 判定根拠**: 本 Phase が属する sub-task 2a の最終成果物は
> `apps/web/playwright/tests/admin-requests.spec.ts`（実行可能 TypeScript ソース）であり、
> CI（`pnpm test:e2e`）で green 判定されるランタイム成果物に直接接続する。
> 親 workflow `artifacts.json` は `taskType=docs-only` だが、CONST_004「ラベルより実態優先」
> 原則に従い、Phase 8〜10 を含む sub-task 2a の仕様書群はすべて **実装仕様書** として作成する。

---

# Phase 8: リファクタリング（sub-task 2a 単体スコープ）

| 項目 | 値 |
|------|-----|
| workflow_id | `task-spec-2a-admin-requests-e2e` |
| sub-task ID | `2a` |
| 親仕様 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172209-wt-12/docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 起点日 | 2026-05-09 |
| 焦点 | 2a spec 内 mock パターンの抽出方針確定（**抽出は本サブタスクでは実施しない**） |
| coverageTier | standard |
| workflow_state | spec_verified |
| visualEvidence | NON_VISUAL |
| 単一スコープ | sub-task 2a 単体（2b / 2c / 2d とは独立） |

---

## 1. 本 Phase のスコープ宣言（独立性）

本 Phase は **sub-task 2a（`/admin/requests` E2E）単体** のリファクタ方針を確定する。
sub-task 2b / 2c / 2d とは **独立** に判定でき、共通 helper 抽出（`apps/web/playwright/helpers/admin-mocks.ts`）は
**本サブタスク内では行わない**。本 Phase の出力は「抽出候補の所在と署名」を仕様レベルで明文化することに限定する。

### 1.1 抽出を本サブタスク内で行わない理由

| # | 理由 | 出典 |
|---|------|------|
| 1 | 親仕様書 §2.2「含まない」に「mock helper の `helpers/` 抽出（Phase 8 で実施）」と明記、Stage 2 横断 Phase 8 で行う扱い | 2a-admin-requests.md §2.2 / §11 |
| 2 | helper 抽出は 2a / 2b / 2c の 3 spec で重複が観測できて初めて DRY 圧が発生する。2a 単体で先行抽出すると 2b/2c の shape 差で 2 度手間になる | Stage 2 親 workflow `phase-8.md` §1 |
| 3 | CONST_007「単一実装サイクル内完了」を 2a 単体で保つには、抽出までを 1 サイクルに含めると spec 行数が 実装に応じた最小行数から逸脱しうる | 親仕様書 §3 行数目安 |

> **結論**: 本サブタスク（2a）では **spec 内 inline で mock を記述**し、helper 抽出は同 Stage 共通 Phase 8（または後続 Stage 3）で実施する。本 Phase はその「抽出候補」をリストアップする責務のみを負う。

---

## 2. 抽出候補（仕様レベルの所在マップ）

参照モデル: `apps/web/playwright/tests/admin-pages.spec.ts`（既存 admin smoke spec の構造 / 命名規則を踏襲）。

| # | 候補 helper 名 | 抽出元 (2a spec 内位置) | 想定シグネチャ | 抽出後配置（将来） |
|---|---------------|----------------------|--------------|------------------|
| 1 | `mockListRequests` | test 1〜4 共通 `beforeEach`（GET `/admin/requests` mock） | `(page: Page, fixture: { items: AdminRequestItem[] }) => Promise<void>` | `apps/web/playwright/helpers/admin-mocks.ts` |
| 2 | `mockResolveRequest` | test 2 / test 3 の POST `/admin/requests/*/resolve` mock | `(page: Page, opts: { expectBody?: Partial<ResolveBody>; response: { status: number; json: unknown } }) => Promise<void>` | 同上 |
| 3 | `mockResolveRace` | test 4 の counter 付き race mock | `(page: Page, opts: { firstResponse: ResolveResponse; secondResponse: ResolveResponse }) => Promise<void>` | 同上 |
| 4 | `createCallCounter` | mockResolveRace の closure ロジック | `() => { increment: () => number; current: () => number }` | 同上（純関数） |

### 2.1 抽出候補の責務定義

| helper | 単一責務 | 副作用 | 不変条件 |
|--------|---------|-------|---------|
| `mockListRequests` | GET 一覧 mock 装着のみ | `page.route()` 登録 | 200 / `{ items: AdminRequestItem[] }` を返す。色値・OKLch 非依存 |
| `mockResolveRequest` | POST resolve の単発 mock | `page.route()` 登録 + request body assert（任意） | body shape を zod 等で破壊しない（spec 側 expect で検証） |
| `mockResolveRace` | counter 付き 2 回呼び出し分岐 | `page.route()` 登録 + closure counter | 1 回目と 2 回目で response 分岐が決定論的 |
| `createCallCounter` | 呼び出し回数の closure 管理 | なし（純関数） | test scope 外に状態を漏らさない |

> いずれも **fixture ではなく純関数 / route 登録関数**。`apps/web/playwright/fixtures/auth.ts` への追加は **禁止**（CLAUDE.md UI alignment 不変条件 5 / 親仕様書 §11）。

---

## 3. 2a spec 内での記述方針（本サブタスク確定形）

| 区分 | 方針 |
|------|------|
| GET mock | test 1〜4 の `test.beforeEach` 内に **inline で記述**（helper 化しない） |
| POST resolve mock（approve / reject） | 各 test 内 `test()` 関数 scope に **inline 記述**、closure で request body を捕捉して `expect` する |
| race counter | test 4 内に `let calls = 0` を closure で保持し inline 記述（親仕様書 §5.1 擬似コード準拠） |
| import | `apps/web/playwright/fixtures/auth.ts` の `adminPage` / `memberPage` / `anonymousPage` のみ。`helpers/` からは **何も import しない** |

### 3.1 記述順序ルール（参照モデル: `admin-pages.spec.ts`）

```text
1. import（fixtures/auth.ts のみ）
2. type AdminRequestItem 定義
3. const adminRequestItem / listFixture 定数
4. test.describe('/admin/requests × admin mutation flow')
   ├─ test.describe('admin role')
   │   ├─ test.beforeEach（GET mock 装着）
   │   ├─ test('成功系: pending list 表示')
   │   ├─ test('成功系: approve')
   │   ├─ test('成功系: reject + 理由必須')
   │   └─ test('失敗系: race（stale approve は 409）')
   └─ test.describe('authorization boundary')
       ├─ test('member は /login?gate=admin_required redirect')
       └─ test('anonymous は /login redirect')
```

---

## 4. リファクタの観測可能効果（本サブタスク内）

本サブタスクでは helper 抽出を行わないため、定量的な行数削減は **次サイクル（同 Stage 共通 Phase 8）で計測**する。
本 Phase で確定するのは「抽出すべき箇所の identification」のみ。

| 観点 | 本サブタスク内 | 将来（共通 Phase 8 抽出後） |
|------|--------------|---------------------------|
| `page.route()` 呼び出し総行数 | 2a 内に約 25–35 行 inline | helper 経由で 2a 内 10 行未満 |
| race counter のロジック | 2a 内 inline（5–8 行） | 1 helper（2b の ALREADY_MERGED と共有） |
| GET mock の重複 | 2a 内 1 箇所（beforeEach） | helper 1 箇所 + 2a/2b/2c の 3 呼び出し |

---

## 5. 不変条件（リファクタ判定後も維持）

| # | 不変条件 | 確認方法 | 出典 |
|---|---------|---------|------|
| 1 | 既存 API endpoint surface のみ利用 | spec 内 mock pattern が既存 GET / POST resolve のみ | CLAUDE.md UI alignment §不変条件 1 / 親仕様書 §11 |
| 2 | OKLch トークン正本（HEX 直書き禁止） | `grep -rn 'bg-\[#\|text-\[#' apps/web/playwright/tests/admin-requests.spec.ts` → 0 件 | CLAUDE.md UI alignment §不変条件 2 |
| 3 | プロトタイプ正本順位維持（新 primitive 追加禁止） | spec は UI primitives を追加せず既存画面に対する e2e のみ | CLAUDE.md UI alignment §不変条件 3 |
| 4 | `apps/web` から D1 binding 直接アクセス禁止 | spec / helper（将来分含む）が `D1Database` 参照しない | CLAUDE.md 重要不変条件 5 |
| 5 | 新 fixture 追加禁止 | `git diff` で `apps/web/playwright/fixtures/auth.ts` 拡張なし | 親 workflow `index.md` / 親仕様書 §11 |
| Stage 2 横断 | `page.route()` mock のみで決定論性確保 | spec 内に `requestEnv` / D1 binding 参照 0 | 親 workflow `index.md` |

---

## 6. 後続 Phase へのハンドオフ

| 受け側 Phase | 引き継ぎ内容 |
|-------------|------------|
| Phase 9（品質保証） | 本 Phase で「helper 抽出を行わない」決定をしたため、Phase 9 の grep gate には helper 経由の参照を期待しない。inline mock の検証パスを明示 |
| 同 Stage 共通 Phase 8（Stage 2 横断） | 本 Phase §2 の抽出候補リストを引数に、`apps/web/playwright/helpers/admin-mocks.ts` を 2a/2b/2c の 3 spec 横断で抽出 |
| Stage 3（後続 workflow） | 共通 Phase 8 でも未消化な抽出があれば Stage 3 へ申し送り |

---

## 7. Phase 8 完了定義

- [x] 本サブタスク内では helper 抽出を **行わない** 旨を §1 で明示
- [x] 抽出候補 4 件（`mockListRequests` / `mockResolveRequest` / `mockResolveRace` / `createCallCounter`）の所在・署名を §2 で確定
- [x] 2a spec 内記述方針（inline / 参照モデル `admin-pages.spec.ts`）を §3 で確定
- [x] 不変条件 5 件 + Stage 2 横断 1 件すべて維持の見通しを §5 で記述
- [x] 後続 Phase / Stage への引き継ぎを §6 で明示

> Phase 9 へ進める。

---

## 参照（正本）

| 用途 | path |
|------|------|
| 親 sub-task 仕様書 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172209-wt-12/docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| Stage 2 横断 Phase 8 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260509-172114-wt-11/docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-8.md` |
| 参照モデル | `apps/web/playwright/tests/admin-pages.spec.ts` |
| Auth fixture | `apps/web/playwright/fixtures/auth.ts:1-67` |
| 不変条件 | `CLAUDE.md` § UI prototype alignment / MVP recovery §不変条件 1–5 |

---

## Template Compliance Appendix

### メタ情報

- workflow: task-spec-2a-admin-requests-e2e
- phase: 8
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

### 目的

sub-task 2a 単体のリファクタ方針を「helper 抽出は行わず、抽出候補のみ identification する」レベルで確定し、CONST_007 の単一サイクル完了に整合させる。

### 実行タスク

- 抽出候補 4 件の所在・署名・将来配置を仕様レベルで明文化する。
- 2a spec 内の inline 記述方針を確定する（参照モデル `admin-pages.spec.ts`）。
- 不変条件 5 件 + Stage 2 横断 1 件の維持確認パスを定義する。

### 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 sub-task 仕様書 `2a-admin-requests.md`

### 実行手順

1. 本 phase §1 で本サブタスク内 helper 抽出を **行わない** と決定する。
2. §2 で抽出候補（4 件）の所在・署名を確定する。
3. §3 で 2a spec 内 inline 記述順序を確定する。
4. §5 で不変条件 5 件 + Stage 2 横断 1 件の grep gate 経路を Phase 9 へ引き継ぐ。

### 統合テスト連携

- NON_VISUAL phase につき、Playwright 実行は次 Phase（9）で行う。
- 本 Phase は spec 構造の identification に限定し、ランタイム実行は伴わない。

### 成果物

- 本 phase markdown
- Phase 9 の grep gate 用に「helper 経由参照なし」の確認チェック項目を引き継ぎ

### 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier、line >= 70% 維持の前提条件のみ確定（実測は Phase 9）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合（2b / 2c / 2d と独立）を確認する。

### タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
- [x] 「helper 抽出は本サブタスク範囲外」の決定を §1 で明示し、Phase 9 / 共通 Phase 8 / Stage 3 への引き継ぎ経路を §6 で確定した。
