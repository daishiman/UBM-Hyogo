# Phase 2: 設計

| 項目 | 値 |
|------|-----|
| 対象 | sub-task 2a / 2b / 2c / 2d |
| 起点日 | 2026-05-08 |

## 1. spec ファイル構造（共通テンプレート）

```text
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'

test.describe('<route> × admin mutation flow', () => {
  test.beforeEach(async ({ adminPage }) => {
    // page.route() で GET 系を mock
  })

  test('成功系: <action>', async ({ adminPage }) => { /* … */ })
  test('失敗系 / race: <case>', async ({ adminPage }) => { /* … */ })
  test('member: 403', async ({ memberPage }) => { /* … */ })
  test('anonymous: /login redirect', async ({ anonymousPage }) => { /* … */ })
})
```

- describe 名は日本語可（既存 `admin-pages.spec.ts:11` 準拠）。
- 共通 mock setup は `beforeEach` で集約、シナリオ固有 mock は test 内で `page.route()` 上書き。
- screenshot 撮影は MVP 時点では任意（critical route smoke の screenshot は Stage 1 でカバー済み）。

---

## 2. `page.route()` mock 戦略

### 2a `admin-requests.spec.ts`

| シナリオ | mock |
|---------|------|
| 1 一覧 | GET `**/admin/requests?status=pending*` → fixture JSON（items 3 件） |
| 2 approve | POST `**/admin/requests/*/resolve` → 200 `{ resolvedAt }` |
| 3 reject | POST 同上 → 200。request body assertion で `resolution: 'reject'` & `resolutionNote` 確認 |
| 4 race | POST を最初の 1 回だけ 200、2 回目も 200 idempotent。`route.fulfill` カウンタで観測 |
| 5 認可 | member 用 GET `/admin/requests` → 403 / anonymous → 302 redirect |

### 2b `admin-identity-conflicts.spec.ts`

| シナリオ | mock |
|---------|------|
| 1 一覧 | GET `**/admin/identity-conflicts` → items 2 件 |
| 2 merge | POST `**/identity-conflicts/*/merge` → 200 `{ mergedMemberId }` |
| 3 dismiss | POST `**/identity-conflicts/*/dismiss` → 200 `{ dismissedAt }` |
| 4 DB 整合 | merge 後の GET `**/admin/members/<mergedId>` → 統合済 row mock。UI が再 fetch する想定 |
| 5 認可 | 2a と同様の 2 ロール分岐 |

### 2c `admin-member-delete.spec.ts`

| シナリオ | mock |
|---------|------|
| 1 二段確認 | UI のみで完結（API 不要） |
| 2 cascade preview | UI のみ（preview API がある場合は GET mock 追加。Phase 1 では UI 描画前提） |
| 3 delete | POST `**/admin/members/*/delete` → 200 `{ deletedAt, cascade: { … } }` |
| 4 認可 | 同上 |
| 5 audit | GET `**/admin/audit` → items に削除 entry 1 件含める fixture |

### 2d contract test

| 範囲 | 戦略 |
|------|------|
| request shape | UI fixture 用 shape を **zod schema** 化し、API route 実装が同 schema を `parse` できるかで verify |
| response shape | API ハンドラの return を同 schema に対して `parse` し、UI fixture と同型であること確認 |
| 配置 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` 1 ファイルに集約（endpoint 7 件、describe 単位で分割） |

---

## 3. fixture 再利用

| fixture | 利用 sub-task | 補足 |
|---------|--------------|------|
| `adminPage` | 2a / 2b / 2c | `apps/web/playwright/fixtures/auth.ts:39` |
| `memberPage` | 2a / 2b / 2c の認可境界 | `auth.ts:46` |
| `anonymousPage` | 2a / 2b / 2c の認可境界 | `auth.ts:53` |
| 新規 fixture | なし | **追加禁止**（CONST_007 と Stage 1 設計と整合） |

> 既存 `signSession()`（`auth.ts:14`）が TODO placeholder の場合、Stage 1 で活性化される前提。本 Stage はそれを破壊しない。

---

## 4. contract test 拓樸（topology）

```
contract-stage-2.test.ts
├── describe('GET /admin/requests')
│   └── shape parse / 異常系（status=invalid）
├── describe('POST /admin/requests/:id/resolve')
│   └── request body schema / response schema
├── describe('GET /admin/identity-conflicts')
├── describe('POST /admin/identity-conflicts/:id/merge')
├── describe('POST /admin/identity-conflicts/:id/dismiss')
├── describe('POST /admin/members/:id/delete')
└── describe('GET /admin/audit')
```

- 各 describe 内で **UI fixture と同じ object** を `parse` し、双方向同型を担保。
- schema は `apps/api/src/schemas/` または route 実装内 zod を **再 export して share**。新規 schema 重複定義禁止。

---

## 5. リスク分析

| # | リスク | 影響 | 緩和策 |
|---|--------|------|--------|
| R1 | UI 実装側で endpoint の path / query が想定と異なる | mock パターン miss → flaky | Phase 4 で UI source を確認後、`page.route()` パターンを正規表現で許容 |
| R2 | `signSession()` placeholder のまま | 全認可テストが skip / 失敗 | Stage 1 完了を **依存条件** として明示（index.md） |
| R3 | merge / delete の audit 実装が非同期で後追い書き込み | E2E で audit GET が空 | mock で audit response を組み立てるため実装非依存。実装側の eventual consistency は Stage 3 で観測 |
| R4 | contract schema を route 内で private 定義しており share 不可 | 重複 schema → drift | Phase 4 で schema を `apps/api/src/schemas/` に切り出す PR を分離（本 Stage の spec 範囲外） |
| R5 | `apps/web/app/(admin)/admin/<route>/page.tsx` が未実装 | E2E が 404 で不能 | Phase 1 inventory で実在確認済（`apps/web/app/(admin)/admin/{requests,identity-conflicts,members}` ディレクトリ存在） |
| R6 | cascade preview の実装が未確定 | 2c シナリオ 2 が組めない | preview なし設計の場合は test を skip + コメントで明示し、Stage 3 に持越し |

---

## 6. データ fixture 設計指針

- すべて **inline fixture**（外部 JSON ファイル化しない）。
- noteId / memberId は `req_001`, `m_src_01`, `m_dst_01` の prefix 付き固定値。
- 日時は ISO8601 固定（`2026-05-08T00:00:00Z`）。flaky 防止。
- 配列件数は最低 2 件（一覧 render の sort / pagination 表面化のため）。

---

## 7. CI / 実行

- 既存 `.github/workflows/` の playwright job がそのまま 4 ファイルを拾う想定。
- 並列度は既存 config（`apps/web/playwright.config.ts`）に従う。本 Stage で workers 数の調整なし。
- contract test は `pnpm --filter @ubm-hyogo/api test` で実行される既存 vitest 経路に乗る。

---

## 8. 完了定義（DoD, Phase 2 観点）

- spec 4 ファイル（index + phase-1/2/3）が揃う。
- 全 sub-task で「mock endpoint」「fixture」「認可境界」「DoD」が表で明示されている。
- リスクが phase-3 GO/NO-GO 判定に投入できる粒度で列挙されている。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 2
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

