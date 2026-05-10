# Phase 1: 要件定義

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| Task ID | task-14 |
| Task name | my-profile-and-requests |
| 起票日 | 2026-05-09 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch（想定） | `feat/task-14-my-profile-and-requests` |
| 対象 route | `/profile` (App Router, Cloudflare Workers / `@opennextjs/cloudflare` SSR) |
| 工数見積 | 1.0 人日 |

---

## 1. 背景と目的

`/profile`（会員マイページ）は現在 prototype（`docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の `MyProfile` block）から逸脱しており、HEX 直書き / 旧コンポーネントが残存する。task-14 では **4 領域構成**（公開状態バナー / 公開範囲サマリ / 申請パネル / 削除申請）に再構築し、OKLch tokens に揃え、pending 連動の disable ロジックを確立する。

成果として以下を得る:

- prototype 準拠の 4 領域 UI が描画される
- 公開状態 3 値（public / member_only / hidden）× authGateState 3 値（active / rules_declined / deleted）の Banner マトリクスが網羅
- pending request 存在時に対応する申請ボタンが disabled、`<RequestPendingBanner>` で可視化
- `apps/api` および `apps/web/app/api/me/*` の **API surface は一切変更しない**

---

## 2. ゴール（Definition of Done）

| ID | 条件 | 検証 |
|----|------|------|
| G-14-1 | `/profile` の 4 領域が prototype 準拠で描画される | 手動 + Playwright |
| G-14-2 | OKLch tokens 全領域適用 / HEX 直書き 0 件 | profile token grep gate |
| G-14-3 | `RequestPendingBanner` が pending 申請を表示し、二重申請を抑止 | Vitest + 手動 |
| G-14-4 | 公開範囲申請で `POST /api/me/visibility-request` が 1 回呼ばれる | Vitest（fetch mock） |
| G-14-5 | 削除申請で `POST /api/me/delete-request` が 1 回呼ばれる | Vitest |
| G-14-6 | `apps/api/src/routes/me/*` の追加・変更 0 | `git diff` |
| G-14-7 | `apps/web` から D1 への直接アクセス無し | `grep` |
| G-14-8 | a11y critical violation 0（focus trap, role=dialog, aria-labelledby） | jest-axe + Playwright |
| G-14-9 | 認証未確立時 `/login?redirect=/profile` redirect | Playwright |
| G-14-10 | staging / dev 起動で 4 領域 + 2 Dialog を一巡して Sentry 新規 issue 0 | 手動 smoke + Sentry |

## 3. 非ゴール

- 新 API endpoint 追加（`apps/web/app/api/me/*` 既存 surface 不変）
- D1 schema 変更
- プロフィール本文の inline 編集 UI（不変条件 #4）
- Form schema の inline 表示変更
- 退会の即時反映（管理 queue 経由のままとする）
- attendance（出欠）の編集機能

---

## 4. スコープ

| in scope | out of scope |
|---------|-------------|
| `apps/web/app/profile/page.tsx` 編集（4 領域配置） | 新規 API endpoint |
| `_components/PublicVisibilityBanner.tsx` 新規作成 | D1 schema migration |
| `StatusSummary.tsx` の rebuild（Card + Badge + tokens） | 出欠の編集機能 |
| `VisibilityRequestDialog` / `DeleteRequestDialog` の Dialog primitive 化 | 即時退会フロー |
| `RequestActionPanel` / `RequestPendingBanner` / `RequestErrorMessage` の minor edit | プロフィール inline 編集 |
| `_components/__tests__/*` Vitest 追記 | 新規 ui-primitive の追加 |
| `e2e/profile-smoke.spec.ts` への append | task-18 で行う smoke spec の新規作成本体 |

---

## 5. P50 pre-check（事前確認サマリ）

| 確認項目 | 期待 | 根拠 |
|---------|------|------|
| `apps/web/app/profile/page.tsx` 存在 | 既存 | 起票元タスク §3 |
| `apps/web/src/lib/fetch/authed.ts` の `fetchAuthed` 存在 | 既存 | 起票元タスク §0.3 |
| `apps/web/src/lib/api/me-types.ts` の `MeProfileResponse` / `MeSessionResponse` 存在 | 既存 | 起票元タスク §0.6 |
| `apps/api/src/routes/me/*` の endpoint surface | 不変・追加禁止 | 起票元タスク §0.4, §12 |
| ui-primitive `<Dialog>` (task-10) | 利用可能前提 | task-14 依存 |
| OKLch tokens (task-09) | `apps/web/src/styles/tokens.css` 整備済 | task-14 依存 |
| `/login?redirect=` 着地 (task-13) | 着地先 `/profile` | task-14 依存 |

### 5.1 正本契約 / evidence ledger

| 契約 | 正本 | 実装時の確認 |
|------|------|-------------|
| prototype block | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の `MyProfile` block | 4 領域・主要 copy・密度を Phase 6 component と照合 |
| 起票元 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-14-w5-par-my-profile-and-requests.md` | write scope / 不変条件 / task-18 境界を照合 |
| API contract | `GET /me`, `GET /me/profile`, `POST /me/visibility-request`, `POST /me/delete-request` | Phase 5 の `fetchAuthed` 呼び出し規約のみ使用 |
| tokens | task-09 Tailwind v4 / OKLch tokens | profile token grep green |
| primitives | task-10 UI primitives | `Card` / `Banner` / `Badge` / `Dialog` / `Button` / `Input` を使い、新規 primitive は作らない |
| login redirect | task-13 login redirect | 未ログイン `/profile` が `/login?redirect=/profile` |

---

## 6. 依存・並列関係

```
[task-09 OKLch tokens] ────┐
[task-10 ui-primitives]────┼──▶ [task-14 my-profile-and-requests] ──▶ [task-18]
[task-13 login redirect]   ┘
```

並列可能: task-11, 12, 13, 15, 16, 17（route scope と既存 API surface が独立）

---

## 7. 完了条件サマリ

- 本 phase 完了 = G-14-1..10 の DoD 全項目を実装仕様書に反映済 / Phase 2 へ進める状態
- リスク: 上流 type 不整合（→ Phase 4 で adapter 定義）、Cloudflare Workers SSR での `document` 参照（→ Phase 6 で client 境界明示）
