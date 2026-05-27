# Phase 5 — 実装サマリ

実行日: 2026-05-26
実行ブランチ: task-20260526-145759-wt-18 (HEAD)

## T-5.1 — 404 root cause hardening

- `apps/web/app/api/admin/[...path]/route.ts`
  - `FALLBACK_INTERNAL_API` を localhost 専用 fallback に格下げ。`NODE_ENV=production` または `ENVIRONMENT=staging` で `INTERNAL_API_BASE_URL` が空なら 500 を即返す（`error: "internal_api_base_url_missing"`）。これで `ADMIN_FETCH_404` の根本原因（env 漏れによる 127.0.0.1 への空打ち）を構造的に塞いだ。
- `apps/web/src/lib/admin/server-fetch.ts`
  - 404/5xx 時に upstream response body を最大 256 文字 truncate して error message に含めるよう拡張。今後 staging で観測されたら `body=...` で root cause が判別できる。
- `apps/web/src/lib/admin/safe-server-fetch.ts`: 変更不要（既存 wrapper のまま）。
- 追加 spec: `apps/web/app/api/admin/[...path]/route.spec.ts`
  - 500 fail-fast（staging で env 欠落）
  - upstream 401 を 401 のまま素通し（404 マスクなし）
  - 非 admin session で 403

## T-5.2 — Adapter additive 拡張

- 新規: `apps/web/src/features/admin/adapters/members-view-model.ts`
  - `stringHashHue(memberId)` 決定論的 hue 派生
  - `toMemberListRow(item, ctx?)` — additive: `occupation` / `ubmZone` / `ubmMembershipType` / `tags` / `updatedAt` / `hue`
  - `toMemberDetail(view, ctx?)` — additive: `responseId` / `submittedAt` / `location` / `occupation` / `ubmZone` / `ubmMembershipType` / `tags` / `hue` / `updatedAt` / `deletedAt` / `deletedReason`
  - `deriveUpdatedAt(view)` audit[] 最大 occurredAt → fallback `lastSubmittedAt`
- `packages/shared` は触っていない（既存 ViewModel 互換を維持し additive 派生は web 側のみ）。
- 追加 spec: `apps/web/src/features/admin/adapters/__tests__/members-view-model.spec.ts`

## T-5.3 — MembersTable プロトタイプ化

- `apps/web/src/features/admin/components/_members/MembersTable.tsx` 全面刷新
  - 列: 選択 / メンバー(Avatar+name+occupation) / メール mono / 区画 Chip(dot) + ステータス Chip / タグ Chip × max 2 + `+N` / 最終更新 mono / 公開 Switch+ラベル or 退会 Chip / 編集 ghost icon Button
  - `onTogglePublish?` / `tagsByMember?` / `summariesByMember?` を additive prop で追加（call site は既存維持）
- 追加 spec: `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`（旧 task-15 specを差し替え）
  - 列ヘッダ存在 / avatar / occupation / tags max 2 + +N / 退会 Chip / Switch / edit button / checkbox / a11y violations 0

## T-5.4 — MembersFilters pill-nav 化

- `apps/web/src/features/admin/components/_members/MembersFilters.tsx` 全面刷新
  - 旧 select 3種（ゾーン/状態/並び順）を削除し、search input (debounce 300ms 既定) + pill-nav 4種（すべて/公開中/非公開/退会済み）+ 件数バッジに移行
  - `MembersFilterValue` 型 (q/zone/filter/sort) は維持（URL同期のため）。zone/sort はサーバ側で受け取るが UI からは外す（プロトタイプには無い）。
- 追加 spec: `apps/web/src/features/admin/components/__tests__/MembersFilters.spec.tsx`（旧 task-15 specを差し替え）
  - pill 4種 / クリックで filter 変更 / 件数表示 / debounced search (vi.useFakeTimers で 299ms 不発・301ms 発火) / loading

## T-5.5 — page-head action row

- 新規: `apps/web/src/features/admin/components/_members/MembersPageHead.tsx`
  - eyebrow `ADMIN / MEMBERS` + h-page `メンバー管理` + muted description（件数付き）+ btn-row 右寄せ
  - CSV エクスポート(ghost) / Forms から取り込み(primary) を `disabled + title="MVP 範囲外"` で配置
- `apps/web/app/(admin)/admin/members/page.tsx` を MembersPageHead 利用に切替。Breadcrumb は page.tsx 直配置（primitive-adoption gate を維持）。
- 追加 spec: `apps/web/src/features/admin/components/__tests__/MembersPageHead.spec.tsx`

## T-5.6 — MemberDrawer プロトタイプ化

- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` 全面刷新
  - head: Avatar(lg) + name + email mono + responseId
  - body: VISIBILITY セクション (Switch + Textarea via FormField "admin-memo") / TAGS セクション (Chip グループ) / FORM RESPONSE KVList (回答ID/送信日時/UBM区画/ステータス/お住まい/職業/ビジネス概要) / DELETED ブロック (条件付き、deletedAt + reason + 復元ボタン)
  - foot: 退会処理(danger) / 閉じる(ghost) / 保存(primary)
  - 3 mutation は `useAdminMutation` 経由:
    - PATCH `/api/admin/members/:id/publish` (refreshOnSuccess)
    - DELETE `/api/admin/members/:id` (onSuccess: onClose)
    - PATCH `/api/admin/members/:id` { adminMemo } (onSuccess: onClose)
  - 旧 NotificationOptOutToggle / タグ管理リンクは削除（プロトタイプに無い）。代わりに drawer 内 Tag chips を直接表示。
- 追加 spec: `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx`（旧 task-15 specを差し替え）

## T-5.7 — primitive top-up

- `apps/web/src/lib/tones.ts`
  - `ChipTone` に semantic 5種 (neutral / success / warning / danger / info) を additive 追加（既存 stone/warm/cool/green/amber/red と co-exist）
- `apps/web/src/components/ui/Chip.tsx`
  - `dot?: boolean` additive prop 追加（プロトタイプ準拠の dot indicator）
- `apps/web/src/components/ui/Avatar.tsx`
  - 既存実装で `hue?` prop と `hashStringToHue(memberId ?? name)` が揃っており変更不要を確認
- 新規: `apps/web/src/components/ui/PillNav.tsx`
  - Segmented (radiogroup) とは責務が異なる tablist 型の pill ナビゲーション。`options` / `value` / `onChange` / `ariaLabel`。count badge も option 単位で持てる。
- 追加 spec: `apps/web/src/components/ui/__tests__/PillNav.spec.tsx`

## T-5.8 — design tokens drift 0

- `rg -n 'bg-\[#|text-\[#|border-\[#' apps/web/src/features/admin/components/_members apps/web/src/components/ui` → 検出 0 件
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` → green
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` → green
- `mise exec -- pnpm --filter @ubm-hyogo/web test` → 1163 passed / 1 skipped / 0 failed
