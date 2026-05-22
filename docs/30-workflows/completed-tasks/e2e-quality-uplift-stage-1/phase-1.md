# Phase 1: 要件定義

> 起案日: 2026-05-08 / workflow: `e2e-quality-uplift-stage-1`

## 1. サブタスク 1a — Public-flow email leak assertion

### 1a-1 スコープ

| 項目 | 値 |
|------|----|
| 対象 spec | `apps/web/playwright/tests/public-flow.spec.ts:9` |
| 対象 route | `/`（landing）, `/(public)/members`（一覧）, `/(public)/members/[id]`（詳細・`m-1`） |
| 追加 test case 数 | 1（既存 desktop full flow describe 内に append、または 同 describe に新 test を追加） |
| implementation_mode | `new`（既存ファイル末尾に新 test 追加） |
| 触る行 | `public-flow.spec.ts:9-42`（describe 末尾） |

### 1a-2 前提条件

| 前提 | 確認手段 |
|------|---------|
| `HomePage` / `MembersListPage` / `MemberDetailPage` page object が存在 | `apps/web/playwright/page-objects/` を import 確認（`public-flow.spec.ts:4-7`） |
| 既知 fixture email が seed される | `apps/web/playwright/fixtures/d1-seed.ts` 上の `responseEmail` 既定値を採用、無い場合は test 内 const で定数化 |
| `m-1` 詳細 page が render される | 既存 `detail.assertHeading()` が pass（同ファイル `:25`） |

### 1a-3 受け入れ基準

| ID | 基準 |
|----|------|
| AC-1a-01 | 既知 fixture email（例 `system+responseEmail@example.test`）が `/`, `/members`, `/members/m-1` のいずれの DOM にも含まれない |
| AC-1a-02 | 補助 assertion: `body` の textContent に `/@/` matcher が存在しない（false negative 抑制） |
| AC-1a-03 | 非 public consent member（`publicConsent=false`）の email も同様に出力されない（fixture 拡張で seed） |
| AC-1a-04 | 既存 desktop / mobile flow を破壊しない（既存 test は緑のまま） |

### 1a-4 命名規則

| 種別 | 規約 | 例 |
|------|------|----|
| test 名 | `regression: <failure-mode> <route>` | `regression: responseEmail must not leak on public routes` |
| testId | 既存 prototype primitive の testId のみ参照（新規追加なし） | — |
| fixture const | `LEAK_PROBE_EMAIL` （UPPER_SNAKE） | `const LEAK_PROBE_EMAIL = 'system+responseEmail@example.test'` |

### 1a-5 P50 pre-check

| チェック | 結果 |
|---------|------|
| 既存ファイルが存在し読み取り可能 | OK（`public-flow.spec.ts` 42 行） |
| 既存 describe が 1 件 | OK（`public flow (landing → 一覧 → 詳細 → 登録)`） |
| 追加 test に必要な page object 全て利用可能 | OK |
| 新規 endpoint / D1 schema 変更不要 | OK |

---

## 2. サブタスク 1b — Pending-sticky race assertion

### 1b-1 スコープ

| 項目 | 値 |
|------|----|
| 対象 spec A | `apps/web/playwright/tests/profile-visibility-request.spec.ts:7` |
| 対象 spec B | `apps/web/playwright/tests/profile-delete-request.spec.ts:7` |
| 対象 route | `/profile`（往復対象として `/` を採用） |
| 追加 test case 数 | 2（A・B 各 1 件） |
| implementation_mode | `new` |
| 触る行 | A: `profile-visibility-request.spec.ts:79`（describe 末尾）, B: `profile-delete-request.spec.ts:62`（describe 末尾） |

### 1b-2 前提条件

| 前提 | 確認手段 |
|------|---------|
| `memberPage` fixture が利用可能 | `auth.ts:48` で定義済 |
| `[data-pending-type=visibility_request]` / `[data-pending-type=delete_request]` selector が安定 | 既存 TC-E-01（`profile-visibility-request.spec.ts:27`）/ TC-E-03（`profile-delete-request.spec.ts:32`）で使用中 |
| `GET /api/me` を mock する route pattern 設計 | `**/api/me`（末尾 `/` 無し・query 無し）を採用、`-request` 系と衝突しない |
| navigate round-trip 用の中間 route | `/`（landing）を採用、login redirect の影響回避 |

### 1b-3 受け入れ基準

| ID | 基準 |
|----|------|
| AC-1b-01 | submit → 202 → `[data-pending-type=visibility_request]` 表示後、`/` に navigate → `/profile` に戻った時点でも同 selector が visible |
| AC-1b-02 | 復帰時の `GET /api/me` mock response に `pendingRequests: [{type:'visibility_request', status:'pending', ...}]` を含める |
| AC-1b-03 | delete_request 版も同様に round-trip 後も pending が visible |
| AC-1b-04 | 既存 TC-E-01..06 / TC-E-03 / TC-E-09 を破壊しない |

### 1b-4 命名規則

| 種別 | 規約 | 例 |
|------|------|----|
| test 名 | `TC-E-<num>: pending-sticky after navigate round-trip` | `TC-E-07: visibility pending sticky after round-trip` / `TC-E-10: delete pending sticky after round-trip` |
| mock 関数 | `mockMeWithPending(page, type)` （ファイル内 helper） | — |

> TC-E-07 / TC-E-10 番号は既存 TC（01..06 / 03 / 09）を考慮し、未使用の最小番号として採番。

### 1b-5 P50 pre-check

| チェック | 結果 |
|---------|------|
| 既存 spec ファイル 2 本が存在 | OK |
| `memberPage.route` 用法が既存テストで確立 | OK（`profile-visibility-request.spec.ts:11`） |
| `GET /api/me` の actual response shape | **要確認**: `apps/web/src/app/profile/page.tsx` の data fetch 実装に合わせる（Phase 2 で採取） |
| `pending` selector が server data 駆動で render される | **要確認**（Phase 2 で実装ソース確認） |

---

## 3. 対象ファイル / 行 inventory

| 種別 | パス | 触る箇所 |
|------|------|---------|
| 編集 | `apps/web/playwright/tests/public-flow.spec.ts` | `:42` 直前に新 test 追加 |
| 編集 | `apps/web/playwright/tests/profile-visibility-request.spec.ts` | `:78` 直前（describe 閉じ括弧の前）に新 test 追加 |
| 編集 | `apps/web/playwright/tests/profile-delete-request.spec.ts` | `:61` 直前（describe 閉じ括弧の前）に新 test 追加 |
| 参照のみ | `apps/web/playwright/fixtures/auth.ts` | `memberPage` / `anonymousPage` fixture |
| 参照のみ | `apps/web/playwright/fixtures/d1-seed.ts` | `responseEmail` seed 値の確認 |

## 4. 実装方針サマリ

| サブタスク | 主戦略 | 補助戦略 |
|-----------|--------|---------|
| 1a | fixture-driven exact match assertion (`not.toContainText(LEAK_PROBE_EMAIL)`) | DOM regex probe `not.toContainText(/@/)` |
| 1b | `page.route('**/api/me', ...)` で復帰時の server state を mock | round-trip target は `/`（最も軽量・redirect 副作用なし） |

## 5. リスク

| リスク | 影響 | 対処 |
|--------|------|------|
| `GET /api/me` shape が想定と異なり mock が効かない | 1b の AC-1b-02 達成不可 | Phase 2 で実装ソース確認 → shape 確定 |
| `responseEmail` を持つ fixture が seed されておらず leak が原理的に起きない | 1a の test が常に pass する vacuous test 化 | fixture 拡張または test 内で `system+responseEmail@example.test` を擬似 inject せずに「絶対不在」を保証する設計（vacuous でも regression-guard 価値あり）として明記 |
| `not.toContainText(/@/)` が footer/legal 表記の email に false positive | flaky | probe email を tokenize した特定 sentinel に切替可能な構造で実装 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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
3. validator と grep gate の結果を Phase 12 evidence に反映し、Phase 11 は実行ログ・skip count・runner version として分離する。

## 統合テスト連携

- NON_VISUAL implementation phase は Playwright assertion 差分、spec completeness、grep gate、artifact parity を検証する。
- E2E runtime 実行結果は outputs/phase-11/evidence に保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- apps/web/playwright/tests/public-flow.spec.ts、profile-visibility-request.spec.ts、profile-delete-request.spec.ts の assertion 差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

