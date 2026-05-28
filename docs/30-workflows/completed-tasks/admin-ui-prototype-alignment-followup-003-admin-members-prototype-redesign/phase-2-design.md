# Phase 2 — 設計

[実装区分: 実装仕様書]

## 1. UI ツリー（prototype 準拠）

```
<AdminMembersPage> (server component, app/(admin)/admin/members/page.tsx)
  ├── <AdminPageHeader title="メンバー管理"
  │                    eyebrow="ADMIN / MEMBERS"
  │                    description="回答データ・公開フラグ・タグ付けをここから操作します。"
  │                    breadcrumbs=[{label:"会員管理"}]
  │                    actions={<ExportCsvButton disabled /> <SyncFromFormsButton />}/>
  ├── result.ok
  │   ├── <MembersClientShell initial={result.data}> (client)
  │   │   ├── <MembersFilters>            -- card card-pad
  │   │   │   ├── <SearchField q onChange>            -- Search primitive
  │   │   │   ├── <PillNav options={all|public|private|deleted} value={filterMapped}>
  │   │   │   └── <CountIndicator total={rows.length} />
  │   │   ├── <BulkActionBar selectedIds onPublishToggle onDelete /> (既存維持・軽微改修)
  │   │   ├── <MembersTable items selected onToggle onOpenRow page pageSize total onPageChange>
  │   │   │   └── <tr> per row
  │   │   │       ├── checkbox
  │   │   │       ├── <MemberAvatar memberId fullName />  -- hue 派生
  │   │   │       ├── name(font-weight:600) + occupation(small) — occupation 不在時 "—"
  │   │   │       ├── email(mono small, mask 維持)
  │   │   │       ├── <MemberStateChipRow publishState isDeleted />  -- prototype の chip-row
  │   │   │       ├── <TagListCell> — list response に tags 無し → "—" + tooltip
  │   │   │       ├── lastSubmittedAt(small mono)
  │   │   │       ├── <MemberPublishSwitch publishState isDeleted onChange /> (140px)
  │   │   │       └── edit pencil <Button variant="ghost" size="sm" icon="edit" />
  │   │   └── <Pagination current total pageSize hasPrev hasNext onPrev onNext />
  │   └── (Drawer は ClientShell が制御)
  └── result.err
      └── <AdminSectionErrorClient sectionLabel="会員管理" code message />

<MemberDrawer open memberId onClose> (client, fetch detail on open)
  ├── drawer-head: Avatar + name + email/responseId + close
  ├── drawer-body
  │   ├── VISIBILITY card-flat
  │   │   ├── row-between: サイト公開 + Switch (mutation 配線)
  │   │   ├── divider
  │   │   ├── row-between: 管理者メモ ラベル
  │   │   └── <FormField as="textarea"> rows=3
  │   ├── TAGS card-flat
  │   │   └── tag-pill grid (selected / unselected). selected は drawer 開いた時点の tags、編集は disabled+tooltip "未対応"
  │   ├── FORM RESPONSE KVList
  │   │   ├── 回答ID
  │   │   ├── 送信日時
  │   │   ├── UBM区画
  │   │   ├── ステータス
  │   │   ├── お住まい
  │   │   ├── 職業
  │   │   └── ビジネス概要
  │   └── DELETED card-flat (isDeleted のときのみ)
  │       ├── 退会日 / 理由
  │       └── 復元 Button
  └── drawer-foot
      ├── (Left) 退会処理（論理削除）Button danger (非削除時のみ)
      ├── flex spacer
      ├── 閉じる Button ghost
      └── 保存 Button primary (本サイクルでは admin メモ 永続のみ。タグ pill は disabled)
```

## 2. コンポーネント表

| Component | 種別 | 場所 | Props (signature) | 責務 |
| --- | --- | --- | --- | --- |
| `MemberAvatar` | client | `_members/MemberAvatar.tsx` | `{ memberId: string; fullName: string; size?: "sm"\|"md"; }` | hue を memberId hash で 0..7 に派生し、`<Avatar>` (既存 ui/Avatar) を size + hue で描画 |
| `MemberStateChipRow` | client | `_members/MemberStateChip.tsx` (named export `MemberStateChipRow`) | `{ publishState: PublishState; isDeleted: boolean; }` | publishState→chip tone 変換 + isDeleted は "退会" danger chip 単独 |
| `MemberPublishSwitch` | client | `_members/MemberPublishSwitch.tsx` | `{ memberId: string; publishState: PublishState; isDeleted: boolean; onSuccess?: (next: PublishState) => void; }` | `useAdminMutation` 経由で `PATCH /admin/members/:id/status` を呼ぶ。失敗時は元値復帰 + error toast |
| `TagPill` | client | `_shared/TagPill.tsx` | `{ children: ReactNode; selected?: boolean; onClick?: () => void; disabled?: boolean; }` | prototype の tag-pill DOM/CSS 等価 (`<button className={`tag-pill ${selected?"selected":""}`}>`) |
| `PillNav` | client | `_shared/PillNav.tsx` | `{ options: ReadonlyArray<{value: string; label: string}>; value: string; onChange: (v: string) => void; ariaLabel: string; }` | prototype の pill-nav DOM/CSS 等価。`<div role="tablist">` + `<button role="tab" aria-selected>` |
| `MembersTable` | client (書き換え) | `_members/MembersTable.tsx` | 既存 props維持。公開列は `MemberPublishSwitch` の `onSuccess` で shell state を更新 | テーブル本体。`MemberAvatar`/`MemberStateChipRow`/`MemberPublishSwitch` を組み合わせる |
| `MembersFilters` | client (書き換え) | `_members/MembersFilters.tsx` | 既存 props（`value: MembersFilterValue`, `onChange`, `loading`, `zoneOptions`） | prototype 構造 (Field 検索 + PillNav 状態 + 件数 small) に再構成。zone select は本サイクルでは隠す（list が zone を返さない）or detail filter として保持 |
| `MemberDrawer` | client (書き換え) | `_members/MemberDrawer.tsx` | 既存 props (`memberId`, `onClose`) | prototype の4セクション構成 (VISIBILITY / TAGS / FORM RESPONSE / DELETED) を `<Drawer>` 内で組む。タグ pill は disabled+tooltip |
| `MembersClientShell` | client (書き換え) | `_members/MembersClientShell.tsx` | 既存 props + drawer state 管理 | URLSearchParams 同期 + drawer 開閉 state + 楽観更新 |

## 3. data adapter（API surface gap）

list response が返さない field の補完:

| Field | API list 提供 | 補完方法 |
| --- | --- | --- |
| `hue` | × | `lib/admin/member-hue.ts` の `memberHue(memberId: string): 0|1|2|3|4|5|6|7` で memberId の char code 合計 mod 8 で派生 |
| `zone` | × | list 列では "—" + tooltip "drawer で確認"。Drawer は detail fetch (`/admin/members/:id`) で answers_json から取得 |
| `occupation` | × | list 列は "—"。Drawer は detail で取得 |
| `tags` | × | list 列は "—"。Drawer は detail で取得（read-only 表示） |

純関数化のため `member-hue.ts` は side-effect free・no-import で実装し、`apps/web/src/lib/admin/member-hue.spec.ts` で 8 distribution テスト。

## 4. 404 復旧戦略（Lane A）

Phase 5 Lane A の最初の step で **3 仮説（H1/H2/H3）を実走切り分け** する:

```bash
# step 1: 未認証で staging に直接 curl
curl -i https://ubm-hyogo-api-staging.<workers-subdomain>/admin/members
# step 2: 認証済 cookie で curl
curl -i -H "Cookie: __Secure-next-auth.session-token=..." https://ubm-hyogo-api-staging.<workers-subdomain>/admin/members
# step 3: wrangler tail でリクエスト URL と response を観測
wrangler tail ubm-hyogo-api-staging --env staging --format json
```

切り分け結果に応じた最小修正:

- **H1 (env var)**: `apps/web/wrangler.toml` の `[env.staging.vars]` の `INTERNAL_API_BASE_URL` を実 URL に揃える（コード変更なし or `.dev.vars.example` 更新のみ）
- **H2 (auth → 404)**: `apps/api/src/routes/admin/_shared.ts` の `requireAdmin` を「unauth → 401 を return」「Hono notFound に流れない」順序に整流。具体的には `c.json({ ok:false, error:"UNAUTHORIZED" }, 401)` を確実に return し、middleware から throw しない。CIN 既存 spec が壊れたら追加で fixture 更新
- **H3 (mount path)**: `apps/api/src/index.ts` の `app.route("/admin", ...)` 配線を確認し、`/api/admin` プレフィックス想定であれば web 側 `server-fetch.ts` の base URL に `/api` を追加する（または逆）

修正後の確証ステップ:
1. `apps/api` ローカル `pnpm --filter @ubm-hyogo/api dev` で `curl http://localhost:8787/admin/members` が 401 を返す
2. staging deploy 後 `curl -i` で 401（unauth）→ 認証済で 200

## 5. mutation 配線

```ts
// MemberPublishSwitch.tsx
const togglePublish = useAdminMutation<
  { publishState: PublishState },
  { ok: true }
>({
  method: "PATCH",
  path: (vars) => `/admin/members/${memberId}/status`,
  body: (vars) => ({ publishState: vars.publishState }),
  optimistic: { from: current, to: nextPublishState(current) },
  onError: (err) => toast.error(`更新に失敗: ${err.message}`),
  onSuccess: (next) => toast.success("公開ステータスを更新しました"),
});
```

論理削除 / 復元も同形（`POST /admin/members/:id/delete` の body 仕様は member-delete.ts L46 に従う）。

## 6. token / styles

すべて既存 OKLch token (`--ubm-color-*`) で表現する。新規 token 追加は禁止。
prototype の `card-flat` / `card-pad` / `page-head` / `chip-row` 等の class 名は **Tailwind utility + arbitrary value（token var）** で表現する（`apps/web/src/styles/tokens.css` のトークン経由のみ）。

例:
```tsx
<div className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
```

## 7. テスト戦略 overview（詳細は Phase 4）

- vitest unit: `member-hue.spec.ts` (8 distribution) / `MemberAvatar.spec.tsx` (hue prop forward) / `MemberStateChip.spec.tsx` (publishState → chip tone マッピング) / `MemberPublishSwitch.spec.tsx` (mutation 楽観更新 + rollback) / `TagPill.spec.tsx` (selected toggle DOM) / `PillNav.spec.tsx` (role=tab + aria-selected)
- vitest interaction: `MembersClientShell.spec.tsx` で filter URL 同期 + drawer 開閉
- Playwright visual: `admin-members-visual.spec.ts` で 4 viewport × 4 state baseline
- jest-axe: drawer-open state で 0 violation

## 8. リスク・代替案

| リスク | 影響 | 緩和 |
| --- | --- | --- |
| H2 修正が他 admin endpoint の auth 挙動に副作用 | 他ページ regression | `_shared.ts` の修正は **return code を 401 に確実化するだけ**。throw 廃止が影響範囲広い場合は本ワークフロー対象 endpoint だけ局所修正 |
| Playwright baseline が 16 PNG で flaky | CI ノイズ | `expect(page).toHaveScreenshot({ maxDiffPixels: 100 })` でしきい値設定。flaky なら state ごとに `.skip` で degrade |
| Drawer detail fetch が遅い | UX 低下 | `<Drawer>` 内で skeleton → fetch 完了で差し替え。既存 detail endpoint は本サイクルで変更しない |
| `useAdminMutation` の楽観更新が race | Switch 連打 | hook 既存の inflight guard を利用（既存仕様に依存） |
