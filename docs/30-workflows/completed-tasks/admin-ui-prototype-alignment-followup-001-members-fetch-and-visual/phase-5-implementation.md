---
spec_classification: implementation_spec
state: spec_created
phase: 5
phase_name: 実装
---

# Phase 5 — 実装

[実装区分: 実装仕様書]

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

T-5.1〜T-5.8 を 1 サイクル内で完了させ、staging で AC-1..AC-9 を満たす状態にする（PR / commit / push は user-gated）。

## 前提と入力

- Phase 1〜4 の確定設計
- CLAUDE.md「重要な不変条件」「UI prototype alignment / MVP recovery 不変条件」
- 既存 `apps/web/src/features/admin/components/_members/` / `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/app/api/admin/[...path]/route.ts` / `packages/shared/src/types/viewmodel/index.ts`

## 作業手順（タスク並列性）

| Task | 並列可否 | 依存先 |
|------|---------|-------|
| T-5.1 (404 root cause fix) | 単独走行可 | なし（最優先） |
| T-5.2 (adapter 拡張) | T-5.1 と並列可 | なし |
| T-5.3 (Table) | T-5.2 完了後 | T-5.2 |
| T-5.4 (Filters) | T-5.2 と並列可（互いに独立） | なし |
| T-5.5 (page-head) | 単独走行可 | なし |
| T-5.6 (Drawer) | T-5.2 完了後 | T-5.2 |
| T-5.7 (primitive top-up) | 単独走行可（最初に走らせる方が後段が楽） | なし |
| T-5.8 (tokens drift 0) | 最終 verify | T-5.3〜T-5.7 完了後 |

実際には T-5.1 / T-5.2 / T-5.5 / T-5.7 を並列着手 → T-5.3 / T-5.4 / T-5.6 → T-5.8 verify の 3 段。

## 成果物（各タスク）

### T-5.1 — ADMIN_FETCH_404 root cause 切り分け & fix

- **変更ファイル候補**:
  - `apps/web/src/lib/admin/safe-server-fetch.ts`
  - `apps/web/app/api/admin/[...path]/route.ts`
  - `apps/web/src/lib/env.ts`（`INTERNAL_API_BASE_URL` zod schema）
  - `apps/api/wrangler.toml`（D1 binding diff があれば）
- **シグネチャ**:
  - `safeServerFetch(path: string, init?: RequestInit): Promise<Response>` — 内部で `getEnv().INTERNAL_API_BASE_URL` を必須化（空文字 reject）
  - catch-all route `GET/POST/PATCH/DELETE` ハンドラの戻り値型は既存維持
- **入出力**:
  - 入力: `path="/admin/members"`, Authorization header（session JWT）
  - 出力: `apps/api` の `/admin/members` レスポンスを passthrough。401 は 401 のまま、404 マスクなし
- **追加テスト**: U-5 / U-6（Phase 4）
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run safe-server-fetch route.spec
  mise exec -- pnpm typecheck
  ```
- **DoD**: U-5/U-6 green。staging deploy 後 `GET /admin/members` が 200 を返し、`ADMIN_FETCH_404` が UI に表示されない。

### T-5.2 — adapter additive 拡張

- **変更ファイル候補**:
  - `apps/web/src/features/admin/adapters/members-view-model.ts`（新規）
  - `packages/shared/src/types/viewmodel/index.ts`（`AdminMemberListItem` / `AdminMemberDetailView` に additive field を `.optional()` 追加）
- **シグネチャ**:
  ```ts
  export function toMemberListRow(item: AdminMemberListItem, ctx: AdapterContext): MemberListRow
  export function toMemberDetail(view: AdminMemberDetailView, ctx: AdapterContext): MemberDetail
  type AdapterContext = { tagStore: ReadonlyMap<string, Tag[]> }
  ```
- **入出力**:
  - 入力: 既存 API レスポンス + tag store
  - 出力: `MemberListRow = AdminMemberListItem & { occupation?, ubmZone?, ubmMembershipType?, tags: Tag[], updatedAt: string, hue: number }`
  - `hue` は `stringHash(memberId) % HUE_COUNT` で決定論
  - `updatedAt` は `audit[].at` の最新 → fallback `lastSubmittedAt`
- **追加テスト**: U-4
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run members-view-model
  mise exec -- pnpm typecheck
  ```
- **DoD**: U-4 green。Zod schema 既存 consumer の test が継続 green。

### T-5.3 — `_members/MembersTable.tsx` プロトタイプ化

- **変更ファイル**: `apps/web/src/features/admin/components/_members/MembersTable.tsx`
- **シグネチャ**: `<MembersTable rows={MemberListRow[]} selected={Set<string>} onToggle={(id)=>void} onRowOpen={(id)=>void} onTogglePublish={(id, next)=>void} />`
- **入出力**: 列 = checkbox / avatar+name+occupation / メール mono / 区画 chip + ステータス chip / tags chips (max 2 + `+N`) / 最終更新 mono / 公開 switch+label / edit icon button
- **追加テスト**: U-1
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run MembersTable
  mise exec -- pnpm typecheck
  mise exec -- pnpm lint apps/web/src/features/admin/components/_members/MembersTable.tsx
  ```
- **DoD**: U-1 green。OKLch tokens のみ。FormField / `useAdminMutation` 不変条件遵守（switch toggle は `useAdminMutation` 経由）。

### T-5.4 — `_members/MembersFilters.tsx` pill-nav 化

- **変更ファイル**: `apps/web/src/features/admin/components/_members/MembersFilters.tsx`
- **シグネチャ**: `<MembersFilters value={FiltersState} count={number} onChange={(next)=>void} />`
- **入出力**: 検索 input（debounce 300ms）+ pill-nav 4 種（すべて/公開中/非公開/退会済み）+ 件数バッジ
- **追加テスト**: U-2
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run MembersFilters
  ```
- **DoD**: U-2 green。既存 `<select>` 3 種は削除。URL 同期は `MembersClientShell` で行う。

### T-5.5 — page-head action row

- **変更ファイル**: `apps/web/app/(admin)/admin/members/page.tsx` あるいは `apps/web/src/features/admin/components/_members/MembersPageHead.tsx`（新規）
- **シグネチャ**: `<MembersPageHead total={number} onExport?={()=>void} onImport?={()=>void} />`
- **入出力**: eyebrow `ADMIN / MEMBERS` + h-page `メンバー管理` + muted description + btn-row 右寄せ（CSV エクスポート ghost / Forms から取り込み primary）
- MVP 範囲外操作は `disabled + title="MVP 範囲外"` で表示のみ
- **追加テスト**: 既存 page.spec.tsx があれば assertion 追加。なければ `MembersPageHead.spec.tsx` を新規（assertion: eyebrow / h-page / 2 button disabled+title）
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run MembersPageHead
  ```
- **DoD**: テスト green。OKLch tokens のみ。

### T-5.6 — `_members/MemberDrawer.tsx` プロトタイプ化

- **変更ファイル**: `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
- **シグネチャ**: `<MemberDrawer member={MemberDetail | null} onClose={()=>void} onSave={(patch)=>void} onDeactivate={()=>void} onRestore?={()=>void} />`
- **入出力**:
  - head: avatar + name + email mono + responseId
  - body: VISIBILITY (Switch + Textarea admin memo) / TAGS (Chip グループ) / FORM RESPONSE (KVList: 回答ID / 送信日時 / UBM区画 / ステータス / お住まい / 職業 / ビジネス概要) / DELETED ブロック (条件付き + 復元ボタン)
  - foot: 退会処理(danger) / 閉じる / 保存(primary)
- mutation は `@/features/admin/hooks/useAdminMutation` 経由
- 入力は `FormField` 経由（admin memo textarea）
- **追加テスト**: U-3
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run MemberDrawer
  ```
- **DoD**: U-3 green。不変条件 #9 / #10 遵守。

### T-5.7 — 不足 primitive 補充

- **変更ファイル候補**:
  - `apps/web/src/components/ui/Avatar.tsx`（`hue` prop が欠けていれば additive 追加）
  - `apps/web/src/components/ui/Chip.tsx`（tone 5 種が揃っていなければ拡張）
  - `apps/web/src/components/ui/PillNav.tsx`（既存 `Segmented` / `LinkPills` で代替不能と判明した場合のみ新規）
- **シグネチャ例**:
  ```ts
  export type AvatarProps = { name: string; hue?: number; size?: "sm" | "md" | "lg" }
  export type ChipTone = "neutral" | "success" | "warning" | "danger" | "info"
  ```
- **入出力**: 既存 API を破壊しない additive 変更のみ
- **追加テスト**: 既存 primitive spec があれば assertion 追加。新規 `PillNav` は `PillNav.spec.tsx` 同梱必須
- **実行コマンド**:
  ```bash
  mise exec -- pnpm --filter web test -- --run Avatar Chip PillNav
  ```
- **DoD**: 既存 primitive 利用 consumer の test が継続 green。

### T-5.8 — design tokens drift 0

- **変更ファイル**: なし（verify のみ）
- **検証**:
  ```bash
  mise exec -- pnpm verify:design-tokens
  rg -n 'bg-\[#|text-\[#|border-\[#' apps/web/src/features/admin/components/_members apps/web/src/components/ui
  ```
- **DoD**: 上記いずれも検出 0 件。`verify-design-tokens` gate green。

## 完了条件 (DoD) — Phase 5 全体

- T-5.1〜T-5.8 がすべて DoD 達成
- `pnpm --filter web test -- --run` の対象 spec すべて green
- `pnpm typecheck` / `pnpm lint` / `verify:design-tokens` すべて green

## 検証コマンド（Phase 5 集約）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- --run
mise exec -- pnpm verify:design-tokens
mise exec -- pnpm gate-metadata:validate
```

## 想定リスク

| リスク | 緩和策 |
|--------|--------|
| 404 root cause が (d) D1 binding 起因の場合、staging deploy 必須 → user-gated に押し出される | Phase 11 で `bash scripts/cf.sh deploy --env staging` を 1 度実行する想定で残置 |
| `answers_json` schema 揺れで adapter null 急増 | T-5.2 の `.optional()` + UI 側 N/A 表記で吸収 |
| pill-nav primitive を新規追加すると共有 primitive 増殖 | `Segmented` で代替試行 → 不能時のみ最小追加 |

## ロールバック

- `git revert <commit>` で本 followup の変更を全戻し
- adapter additive のみのため、ロールバック後も既存 consumer は壊れない

## 関連 spec

- `phase-2-design.md` / `phase-4-test-plan.md`
- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/phase-5-implementation.md`
