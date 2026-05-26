[実装区分: 実装仕様書]

# Task E — admin 11 routes staging-visual baseline 取得 + required check 統合

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- Branch: `feat/admin-ui-prototype-alignment`
- 依存: Task A-D 完了後（admin shell 構成・dashboard 復旧・members/attendance 整合 完了が前提）
- 実装区分: 実装仕様書（CONST_004 デフォルト）

---

## Phase 1 — Requirements

### ゴール
Task A-D の admin shell 整備完了を受け、admin required routes × 4 viewport の Playwright staging-visual baseline を取得し、`*-linux.png` 正本として配置する。CI `playwright-smoke.yml` に admin visual job を追加し、regression 検出を required status check 候補として整備する。

### 背景（観察事実）
- 既存 visual spec: `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` で `adminLogin(context)` + `mockApi` fixture + `animation: none` injection + `toHaveScreenshot(..., { fullPage: true, maxDiffPixelRatio: 0.02 })` パターンが確立済み
- 既存 fixture: `apps/web/playwright/fixtures/auth.ts` に `adminLogin` / `mockApi` 提供（要確認: signature）
- `apps/web/playwright/tests/visual/` に `admin-dashboard.spec.ts-snapshots/` ディレクトリ命名で baseline 配置
- 既存 CI workflow: `.github/workflows/playwright-smoke.yml` / `playwright-visual-full.yml` / `playwright-visual-baseline-update.yml`
- MEMORY 既知 lessons:
  - `L-I902-001..004`: env-gated `[id]` / `-linux.png` 正本 / SSR fetch stub 不可 / rename grep gate
  - `L-I901-*`: 認証後 visual の cookie mint
  - `feedback_visual_baseline_github_token_retrigger`: bot baseline push は GITHUB_TOKEN なので pull_request イベント非発火 → 空コミットを開発者トークンで push し最終 HEAD を緑化

### Acceptance Criteria
- AC-1: `apps/web/playwright/tests/visual/admin-shell/` 配下の spec で required 10 routes × 4 viewport = **40 baseline PNG** を生成する。`E2E_ADMIN_MEMBER_ID` / `E2E_ADMIN_MEETING_ID` が両方ある場合だけ detail 2 routes を加え、最大 **48 baseline PNG** とする
- AC-2: baseline は `*-linux.png` 正本（macOS dev 環境では撮影しない・撮影しても commit しない）
- AC-3: `playwright-smoke.yml` の admin visual job 追加で `playwright test` 実行が green（diff 0）
- AC-4: env-gated route（`[id]`）は env var（例: `E2E_ADMIN_MEMBER_ID` / `E2E_ADMIN_MEETING_ID`）未設定時は skip し、設定時のみ baseline 撮影
- AC-5: regression（意図的に primitive token を破壊した dry-run）で diff が detect される
- AC-6: required status check 候補一覧を Phase 13 に列挙（実 PUT は user-gated）

### スコープ外
- 実装本体（Task A-D 完遂前提）
- non-admin route（public / member は issue-901 / 902 で済）
- 新規 mint 方式の追加（既存 `adminLogin` / `mint-cookie.sh` を継承）

### 不変条件
- `-linux.png` を正本とし macOS 撮影分は commit しない
- 認証 cookie 経路は **既存 `adminLogin` fixture / runtime-smoke-mint パターンを継承**（新規 mint 経路を作らない）
- bot による baseline push は GITHUB_TOKEN ゆえ pull_request 非発火 → **空コミット再トリガー** を Phase 5/13 に明記
- SSR fetch stub は不可（`mockApi` は client-side のみ）→ 必要なら staging API の実応答を `route.fulfill` で固定するか env-gate で skip
- spec ファイルは `*.spec.ts`（`.test.ts` 禁止）

---

## Phase 2 — Design

### spec 配置案
```
apps/web/playwright/tests/visual/admin-shell/
  ├── dashboard.spec.ts                  (1) /admin
  ├── dashboard-attendance.spec.ts       (2) /admin/dashboard/attendance
  ├── members-list.spec.ts               (3) /admin/members
  ├── members-detail.spec.ts             (4) /admin/members/[id]   ← env-gated
  ├── tags.spec.ts                       (5) /admin/tags
  ├── meetings-list.spec.ts              (6) /admin/meetings
  ├── meetings-detail.spec.ts            (7) /admin/meetings/[id]  ← env-gated
  ├── schema.spec.ts                     (8) /admin/schema
  ├── schema-history.spec.ts             (9) /admin/schema/history
  ├── requests.spec.ts                   (10) /admin/requests
  ├── identity-conflicts.spec.ts         (11) /admin/identity-conflicts
  └── audit.spec.ts                      (12) /admin/audit
```

### viewport matrix
| project name | viewport | 用途 |
|---|---|---|
| `admin-visual-mobile`  | 375 × 812  | iPhone 12 想定 |
| `admin-visual-tablet`  | 768 × 1024 | iPad portrait |
| `admin-visual-desktop` | 1280 × 800 | 標準デスクトップ |
| `admin-visual-wide`    | 1440 × 900 | wide |

合計: 12 specs × 4 viewport = **48 撮影ポイント**。ただし env-gated 2 route（members/[id], meetings/[id]）は skip 既定 → CI 既定 baseline は **10 routes × 4 = 40 png**、env-gated 含め最大 **48 png**。

**決定**: 44 PNG は算術上の中間値であり、本仕様では採用しない。CI 既定は 40 PNG、detail seed 2 件を明示投入した実行だけ 48 PNG とする。片方の seed だけで 44 PNG を生成する運用は baseline 正本を不安定にするため禁止する。

### test data flow
```
beforeEach:
  1. context = browser.newContext({ viewport })
  2. adminLogin(context)                ← 既存 fixture, runtime-smoke-mint パターン
  3. mockApi 適用（GET 系のみ・mutation は触らない）
test:
  4. page.goto(route, { waitUntil: 'networkidle' })
  5. page.locator(<page heading selector>).waitFor({ state: 'visible' })
  6. page.addStyleTag({ content: 'animation/transition/caret 抑止' })
  7. expect(page).toHaveScreenshot(`${route-slug}.png`, { fullPage: true, maxDiffPixelRatio: 0.02 })
```

### env-gated routing
- `E2E_ADMIN_MEMBER_ID` 未設定 → `members-detail.spec.ts` は `test.skip`
- `E2E_ADMIN_MEETING_ID` 未設定 → `meetings-detail.spec.ts` は `test.skip`
- staging deploy 完了後、固定の seed ID を env var に投入 → CI で有効化

### waitForLoadState 戦略
- 既定: `networkidle`
- skeleton 表示 route（dashboard, audit）: 主要 heading の `waitFor({ state: 'visible' })` 必須
- async data fetch route（schema/history, audit）: 表 body 1 行目 `tr:nth-child(1)` を `waitFor`

### playwright.config.ts 改修方針
- 既存 `testIgnore` を確認し、`tests/visual/admin-shell/**` が拾われる project を新規追加（または既存 visual project に matrix 拡張）
- 既存 `tests/visual/admin-dashboard.spec.ts` は **重複回避のため archive 化**（または admin-shell/dashboard.spec.ts に統合し旧 spec 削除）

---

## Phase 3 — Design Review
- 既存 `admin-dashboard.spec.ts` との重複: 統合方針で解消（旧 spec を `tests/visual/admin-shell/dashboard.spec.ts` にリプレース）
- `adminLogin` fixture が runtime-smoke-mint パターンと整合しているかは Phase 5 着手時に再確認
- 4 viewport を 12 spec それぞれに matrix する場合、project ベースで viewport 設定すると spec 内 viewport hardcode 不要（推奨）

---

## Phase 4 — Test Plan

### 撮影 matrix（最大 48）
| # | route | mobile | tablet | desktop | wide | env-gate |
|---|---|---|---|---|---|---|
| 1 | `/admin` | ○ | ○ | ○ | ○ | — |
| 2 | `/admin/dashboard/attendance` | ○ | ○ | ○ | ○ | — |
| 3 | `/admin/members` | ○ | ○ | ○ | ○ | — |
| 4 | `/admin/members/[id]` | ○ | ○ | ○ | ○ | `E2E_ADMIN_MEMBER_ID` |
| 5 | `/admin/tags` | ○ | ○ | ○ | ○ | — |
| 6 | `/admin/meetings` | ○ | ○ | ○ | ○ | — |
| 7 | `/admin/meetings/[id]` | ○ | ○ | ○ | ○ | `E2E_ADMIN_MEETING_ID` |
| 8 | `/admin/schema` | ○ | ○ | ○ | ○ | — |
| 9 | `/admin/schema/history` | ○ | ○ | ○ | ○ | — |
| 10 | `/admin/requests` | ○ | ○ | ○ | ○ | — |
| 11 | `/admin/identity-conflicts` | ○ | ○ | ○ | ○ | — |
| 12 | `/admin/audit` | ○ | ○ | ○ | ○ | — |

### regression detection 検証
- dry-run: `apps/web/src/styles/tokens.css` の `--color-surface` を一時改変 → diff 検出を確認 → revert

---

## Phase 5 — Implementation

### 5.1 変更ファイル一覧
| # | ファイル | 種別 | 概要 |
|---|---|---|---|
| 1 | `apps/web/playwright/tests/visual/admin-shell/dashboard.spec.ts` | 新規 | `/admin` baseline（旧 admin-dashboard.spec.ts 統合） |
| 2 | `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` | 新規 | `/admin/dashboard/attendance` baseline |
| 3 | `apps/web/playwright/tests/visual/admin-shell/members-list.spec.ts` | 新規 | `/admin/members` baseline |
| 4 | `apps/web/playwright/tests/visual/admin-shell/members-detail.spec.ts` | 新規 | env-gated baseline |
| 5 | `apps/web/playwright/tests/visual/admin-shell/tags.spec.ts` | 新規 | `/admin/tags` baseline |
| 6 | `apps/web/playwright/tests/visual/admin-shell/meetings-list.spec.ts` | 新規 | `/admin/meetings` baseline |
| 7 | `apps/web/playwright/tests/visual/admin-shell/meetings-detail.spec.ts` | 新規 | env-gated baseline |
| 8 | `apps/web/playwright/tests/visual/admin-shell/schema.spec.ts` | 新規 | `/admin/schema` baseline |
| 9 | `apps/web/playwright/tests/visual/admin-shell/schema-history.spec.ts` | 新規 | `/admin/schema/history` baseline |
| 10 | `apps/web/playwright/tests/visual/admin-shell/requests.spec.ts` | 新規 | `/admin/requests` baseline |
| 11 | `apps/web/playwright/tests/visual/admin-shell/identity-conflicts.spec.ts` | 新規 | `/admin/identity-conflicts` baseline |
| 12 | `apps/web/playwright/tests/visual/admin-shell/audit.spec.ts` | 新規 | `/admin/audit` baseline |
| 13 | `apps/web/playwright/tests/visual/admin-shell/_helpers.ts` | 新規 | `waitAdminPageReady(page, headingSelector)` + `freezeAnimations(page)` 共通化 |
| 14 | `apps/web/playwright.config.ts` | 更新 | `projects` に `admin-visual-{mobile,tablet,desktop,wide}` 追加、`testMatch: 'tests/visual/admin-shell/**/*.spec.ts'` |
| 15 | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` | 削除 | 13 番 dashboard.spec.ts に統合 |
| 16 | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/` | 削除 | 旧 baseline 破棄、新パス配下で再取得 |
| 17 | `.github/workflows/playwright-smoke.yml` | 更新 | `admin-visual` job 追加（4 viewport matrix） |

### 5.2 spec シグネチャ
```ts
// admin-shell/dashboard.spec.ts (例)
import { expect, test } from '@playwright/test'
import { adminLogin } from '../../../fixtures/auth'
import { waitAdminPageReady, freezeAnimations } from './_helpers'

test('admin dashboard staging visual baseline', async ({ page, context }) => {
  await adminLogin(context)
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, '[aria-labelledby="admin-dashboard-h"]')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-dashboard.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
```
- `test name pattern`: `admin <route-slug> staging visual baseline`
- `projects`: `admin-visual-{mobile,tablet,desktop,wide}` matrix
- baseline 命名: `admin-<route-slug>-{project}-linux.png`

### 5.3 baseline 取得手順
1. **local first（dry-run only）**: `pnpm --filter @ubm/web exec playwright test tests/visual/admin-shell --project=admin-visual-desktop` で test 構造のみ確認（macOS 撮影分は commit しない）
2. **staging deploy 確認**: Task A-D 実装が staging に反映済み・admin 11 routes が 200 を返すことを確認
3. **CI baseline 撮影**: `.github/workflows/playwright-visual-baseline-update.yml` の workflow_dispatch で `admin-shell` scope を指定 → `playwright test --update-snapshots` を Linux runner で実行
4. **bot push**: workflow が GITHUB_TOKEN で baseline `-linux.png` を branch に push
5. **空コミット再トリガー（user-gated）**: bot push は pull_request 非発火のため、ユーザーが明示承認した場合だけ `git commit --allow-empty -m "chore(visual): retrigger after admin baseline"` を開発者トークンで push し最終 HEAD で全 check 再評価

### 5.4 CI integration 手順
1. `.github/workflows/playwright-smoke.yml` に job 追加:
   ```yaml
   admin-visual:
     name: admin visual (${{ matrix.viewport }})
     strategy:
       matrix:
         viewport: [mobile, tablet, desktop, wide]
     steps:
       - run: pnpm --filter @ubm/web exec playwright test --project=admin-visual-${{ matrix.viewport }}
   ```
2. required check 追加（**user-gated**）:
   - `playwright-smoke / admin visual (mobile)`
   - `playwright-smoke / admin visual (tablet)`
   - `playwright-smoke / admin visual (desktop)`
   - `playwright-smoke / admin visual (wide)`
3. 既存 `gh api -X PUT /repos/{owner}/{repo}/branches/{dev,main}/protection` への追加は **user 明示承認後のみ**

---

## Phase 6 — Test Additions
- baseline spec 自体が visual test
- 単体 unit test 追加: `_helpers.ts` の `waitAdminPageReady` / `freezeAnimations` は playwright 依存のため unit test 不要

---

## Phase 7 — Coverage
- 対象外（visual baseline はカバレッジ計測スコープ外）

---

## Phase 8 — Refactor
- 既存 `admin-dashboard.spec.ts` を `admin-shell/dashboard.spec.ts` に統合する際、import path を `../../fixtures/auth` → `../../../fixtures/auth` に調整
- 共通 helper を `_helpers.ts` に集約し、各 spec を 15-20 行以下に圧縮

---

## Phase 9 — QA

### ローカル検証（macOS）
- `pnpm --filter @ubm/web exec playwright test tests/visual/admin-shell --list` で required 40 件 + env-gated 8 件の合計 48 件が list されることを確認（env-gated は未設定時 skip）
- 構造のみ確認・撮影分 commit しない

### CI 検証
- `admin-visual` job 4 matrix 全 green
- baseline png 数を script で集計: `find apps/web/playwright/tests/visual/admin-shell -name '*-linux.png' | wc -l` が **40（env-gated 無）または 48（env-gated 有）** と一致
- regression dry-run（token 改変→diff 検出→revert）

### gate
- `pnpm typecheck` / `pnpm lint` green
- `bash scripts/verify-pr-ready.sh` green
- `gate-metadata:validate` ERROR:0
- `verify:phase12-compliance` pass
- `indexes:rebuild` idempotent（md5 一致）

---

## Phase 10 — Final Review
- Task A-D 実装の staging 反映完了が前提（未完なら Task E 着手しない）
- env-gated 2 route は seed ID が 2 件そろった場合だけ有効化する。片方だけ有効化して 44 PNG にする運用は禁止
- bot push 後の空コミット再トリガーを忘れない（feedback_visual_baseline_github_token_retrigger）

---

## Phase 11 — Manual Test / Evidence

### evidence 配置
```
docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/task-E-visual-baseline/
  ├── mobile/
  │   ├── admin-dashboard.png
  │   ├── admin-dashboard-attendance.png
  │   ├── admin-members.png
  │   ├── admin-members-detail.png        (env-gated)
  │   ├── admin-tags.png
  │   ├── admin-meetings.png
  │   ├── admin-meetings-detail.png       (env-gated)
  │   ├── admin-schema.png
  │   ├── admin-schema-history.png
  │   ├── admin-requests.png
  │   ├── admin-identity-conflicts.png
  │   └── admin-audit.png
  ├── tablet/   (同 12 routes)
  ├── desktop/  (同 12 routes)
  └── wide/     (同 12 routes)
```
- 各 png は CI 撮影分（`-linux.png`）の縮小コピーまたはシンボリック参照
- env-gated 2 routes は seed ID 投入後にのみ配置（未投入時は plain.md で skip 明記）

### evidence 表（Phase 11 必須）
| viewport | route | baseline path | status |
|---|---|---|---|
| mobile | /admin | outputs/phase-11/task-E-visual-baseline/mobile/admin-dashboard.png | pending |
| ... | ... | ... | ... |

---

## Phase 12 — Documentation

### 中学生レベル概念説明
- **visual baseline**: 「画面が変わってないか確かめるための見本画像」。CI が新しい撮影画像と見本を比べて、ピクセル差が大きいと fail する
- **viewport**: 「ブラウザの窓の大きさ」。スマホ・タブレット・PC で見え方が違うので 4 通りで撮る
- **env-gated**: 「環境変数があるときだけテストする」。詳細ページは ID が要るので、ID が無いときは skip
- **bot push**: 「CI が自動で commit する」。ただし GitHub の bot token は pull_request イベントを発火させないルールなので、人間が後から空 commit を push して再評価させる必要がある

### implementation-guide.md（要追記）
- baseline 取得 → bot push → 空コミット再トリガーの 3 ステップ運用フロー

---

## Phase 13 — PR

### branch
- `feat/admin-ui-prototype-alignment`（親 workflow と同一・Task A-D と同 branch でも可）

### required status check 候補（user-gated）
- `playwright-smoke / admin visual (mobile)`
- `playwright-smoke / admin visual (tablet)`
- `playwright-smoke / admin visual (desktop)`
- `playwright-smoke / admin visual (wide)`

### PR 本文要点
- Task A-D 完了を前提とする admin 11 routes baseline 取得
- 撮影 spec 12 + helper 1 + config 1 + workflow 1 を追加、旧 admin-dashboard.spec.ts を統合削除
- env-gated 2 route の運用方針（seed ID 2 件投入で 40 → 48 png。片方だけの 44 png は禁止）
- bot push 後の空コミット再トリガーを明記

### DoD
- [ ] 12 spec + helper + config + workflow 配置
- [ ] CI `admin-visual` 4 viewport job green
- [ ] `-linux.png` baseline 40（env-gate 無）または 48（有）配置
- [ ] regression dry-run で diff 検出を確認
- [ ] Phase 11 evidence 表埋め（path / status）
- [ ] required check 候補列挙（実 PUT は user-gated・未実施でも DoD pass）
- [ ] `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` green
- [ ] `gate-metadata:validate` ERROR:0 / `verify:phase12-compliance` pass / `indexes:rebuild` idempotent

### 不変条件再掲
- `-linux.png` 正本（macOS 撮影分は commit しない）
- 認証 cookie 経路は既存 `adminLogin` / runtime-smoke-mint パターンを継承
- bot baseline push 後は **空コミット再トリガー必須**
- 要確認箇所は `adminLogin` fixture signature / staging seed ID の 2 点のみ。baseline 数は 40/48 に固定し、44 は不採用
