# Phase 5 — 実装手順

[実装区分: 実装仕様書]

> Lane A-1 は serial prerequisite。404 仮説を 1 つに絞った後に Lane B〜D を並列化する。Lane A の修正実装自体は、原因確定後に他 Lane と並列実行してよい。

## Lane A: staging 404 復旧

### Step A-1: 仮説切り分け

```bash
# (1) 未認証で curl
curl -i https://<api-staging-host>/admin/members
# 期待: 401 (実際に 404 が返れば H2 確定)

# (2) 認証済 cookie で curl (browser から DevTools で取得した session token を使用)
curl -i -H "Cookie: __Secure-next-auth.session-token=<TOKEN>" https://<api-staging-host>/admin/members

# (3) wrangler tail で実 URL/path/status を 1 分観測
mise exec -- bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format json | head -50

# (4) env vars 確認
mise exec -- bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run | grep -E "INTERNAL_API_BASE_URL"
```

切り分け表は `outputs/phase-11/lane-a-route-cause.md` に記録（H1/H2/H3 のうち実観測で確定したものを示す）。

### Step A-2: 仮説別最小修正

#### H2 採用時（最有力）

ファイル: `apps/api/src/routes/admin/_shared.ts` (または該当 middleware)

```ts
// before (推定): unauth 時に throw → Hono の error/notFound へ流れる
// after: c.json(..., 401) を確実に return する
export async function requireAdmin(c: Context) {
  const session = await getSession(c);
  if (!session?.user?.isAdmin) {
    return c.json({ ok: false, error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, 401);
  }
  return null; // 通過
}
```

呼び出し側（`members.ts` L227 付近）:
```ts
admin.get("/members", async (c) => {
  const unauth = await requireAdmin(c);
  if (unauth) return unauth;  // ← 401 をそのまま return
  // ... 既存処理
});
```

`apps/api/src/index.ts` の `app.notFound` 配線は変更しない（404 は本来の "route 未配置" だけに使う）。

#### H1 採用時

ファイル: `apps/web/wrangler.toml`
```toml
[env.staging.vars]
INTERNAL_API_BASE_URL = "https://<実際の api-staging URL>"
```

#### H3 採用時

ファイル: `apps/web/src/lib/admin/server-fetch.ts`
```ts
// path prefix を /api に揃える、または逆方向で一致させる
const url = `${resolveApiBase()}${prefix}${pathname}${qs ? `?${qs}` : ""}`;
```

### Step A-3: regression test 追加

H2 採用時のみ:
- `apps/api/src/routes/admin/__tests__/auth-401-not-404.spec.ts` を新規作成。未認証 fetch で 401 を assert。

### Step A-4: DoD (Lane A)

- staging deploy 後、未認証 curl で 401 / 認証済で 200 を確認（log を `outputs/phase-11/lane-a-route-cause.md` に保存）
- 既存 admin spec が全 PASS（`pnpm --filter @ubm-hyogo/api test`）

---

## Lane B: 共有 primitive 追加

### Step B-1: `member-hue.ts`

ファイル: `apps/web/src/lib/admin/member-hue.ts`

```ts
export type MemberHue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function memberHue(memberId: string): MemberHue {
  let sum = 0;
  for (let i = 0; i < memberId.length; i++) {
    sum = (sum + memberId.charCodeAt(i)) % 1024;
  }
  return (sum % 8) as MemberHue;
}
```

spec: `member-hue.spec.ts`（Phase 4 T-01）。

### Step B-2: `MemberAvatar`

ファイル: `apps/web/src/features/admin/components/_members/MemberAvatar.tsx`

```tsx
"use client";
import { Avatar } from "../../../../components/ui/Avatar";
import { memberHue } from "../../../../lib/admin/member-hue";

export interface MemberAvatarProps {
  readonly memberId: string;
  readonly fullName: string;
  readonly size?: "sm" | "md";
}

export function MemberAvatar({ memberId, fullName, size = "md" }: MemberAvatarProps) {
  const hue = memberHue(memberId);
  return <Avatar name={fullName} hue={hue} id={memberId} size={size} />;
}
```

既存 `Avatar` 実装が `hue` prop を未対応の場合、Avatar 側にも `hue?: 0..7` prop を追加する（prototype primitives.jsx の `data-hue` をそのまま表現）。Avatar 修正範囲は本仕様の Lane B に含める。

### Step B-3: `MemberStateChip`

ファイル: `apps/web/src/features/admin/components/_members/MemberStateChip.tsx`

```tsx
"use client";
import { Chip } from "../../../../components/ui/Chip";
import type { PublishState } from "@ubm-hyogo/shared";

const TONE: Record<PublishState, "ok" | "warn" | "neutral"> = {
  public: "ok",
  member_only: "warn",
  hidden: "neutral",
};
const LABEL: Record<PublishState, string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

export function MemberStateChipRow({
  publishState,
  isDeleted,
}: {
  publishState: PublishState;
  isDeleted: boolean;
}) {
  if (isDeleted) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="danger" dot>退会</Chip>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <Chip tone={TONE[publishState]} dot>{LABEL[publishState]}</Chip>
    </div>
  );
}
```

### Step B-4: `MemberPublishSwitch`

ファイル: `apps/web/src/features/admin/components/_members/MemberPublishSwitch.tsx`

```tsx
"use client";
import { useState } from "react";
import { Switch } from "../../../../components/ui/Switch";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import { toast } from "../../../../components/ui/Toast";
import type { PublishState } from "@ubm-hyogo/shared";

export interface MemberPublishSwitchProps {
  readonly memberId: string;
  readonly publishState: PublishState;
  readonly isDeleted: boolean;
  readonly onSuccess?: (next: PublishState) => void;
}

export function MemberPublishSwitch({ memberId, publishState, isDeleted, onSuccess }: MemberPublishSwitchProps) {
  const [local, setLocal] = useState<PublishState>(publishState);
  const mutation = useAdminMutation({
    method: "PATCH",
    path: `/admin/members/${memberId}/status`,
  });

  if (isDeleted) {
    return <span className="text-xs text-[var(--ubm-color-text-muted)]">退会済み</span>;
  }

  const next: PublishState = local === "public" ? "hidden" : "public";

  return (
    <div className="flex items-center gap-2">
      <Switch
        on={local === "public"}
        onToggle={async () => {
          const prev = local;
          setLocal(next);
          try {
            await mutation.trigger({ publishState: next });
            onSuccess?.(next);
            toast.success("公開ステータスを更新しました");
          } catch (err) {
            setLocal(prev);
            toast.error(`更新に失敗しました: ${(err as Error).message}`);
          }
        }}
        ariaLabel={`公開状態を切替（現在 ${local === "public" ? "公開" : "非公開"}）`}
      />
      <span className="text-xs">{local === "public" ? "公開" : "非公開"}</span>
    </div>
  );
}
```

### Step B-5: `TagPill` / `PillNav`

ファイル: `apps/web/src/features/admin/components/_shared/TagPill.tsx`

```tsx
"use client";
import type { ReactNode } from "react";

export function TagPill({
  children, selected = false, onClick, disabled = false,
}: { children: ReactNode; selected?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
        selected
          ? "border-[var(--ubm-color-accent)] bg-[var(--ubm-color-accent-soft)] text-[var(--ubm-color-accent)]"
          : "border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] text-[var(--ubm-color-text-secondary)]",
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--ubm-color-surface-panel-2)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
```

ファイル: `apps/web/src/features/admin/components/_shared/PillNav.tsx`

```tsx
"use client";
export function PillNav<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex gap-1 rounded-full border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-0.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "rounded-full px-3 py-1 text-xs transition",
              selected
                ? "bg-[var(--ubm-color-accent)] text-[var(--ubm-color-on-accent)]"
                : "text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-panel-2)]",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
```

barrel: `_shared/index.ts` に `export { TagPill } from "./TagPill"; export { PillNav } from "./PillNav";` を追記。

> **token 不在チェック**: `--ubm-color-accent-soft` / `--ubm-color-on-accent` が `tokens.css` に存在しない場合は、既存 token (`--ubm-color-accent` の color-mix or 既存の `--ubm-color-surface-accent-soft` 等) に置換する。Phase 9 で `verify-design-tokens` が補完する。

### Step B-6: spec 追加（Phase 4 T-02..T-06）

それぞれ `__tests__/` 配下に `*.spec.tsx` で追加。

### Step B-7: DoD (Lane B)

- 上記 primitive 5 ファイル + util 1 + spec 6 が green
- HEX 直書き 0 件 (`pnpm verify:design-tokens`)

---

## Lane C: `_members/*.tsx` in-place rewrite

### Step C-1: `MembersFilters.tsx` rewrite

prototype L204-221 構造（grid 1fr auto auto + Field 検索 + pill-nav 状態 + 件数 small）に書き換え。

主要差分:
- 既存 zone select は本サイクルで隠す（DOM から除去するか visually-hidden）。理由: list response が zone を返さないため filter UX が成立しない。隠蔽は `// TODO(followup-004)` コメントで明示
- `<PillNav>` を使う。filter enum マッピング: `all → ""` / `public → "published"` / `private → "hidden"` / `deleted → "deleted"`
- 件数表示は親 (`MembersClientShell`) から prop で受ける

props は既存互換を維持（呼び出し側の page.tsx 変更不要）。

### Step C-2: `MembersTable.tsx` rewrite

prototype L223-276 のカラム構造に書き換え:

```tsx
<thead>
  <tr>
    <th width="40">{/* checkbox */}</th>
    <th>メンバー</th>
    <th>メール</th>
    <th>区画 / ステータス</th>
    <th>タグ</th>
    <th>最終更新</th>
    <th width="140">公開</th>
    <th width="60">{/* edit */}</th>
  </tr>
</thead>
```

行内容:
- `<MemberAvatar memberId fullName size="sm" />` + name (font-weight:600) + occupation `<div className="text-xs">{m.occupation ?? "—"}</div>`
- `<span className="font-mono text-xs">{maskEmail(m.responseEmail)}</span>`
- `<MemberStateChipRow publishState={m.publishState} isDeleted={m.isDeleted} />`（zone chip は list に zone field 無いので publishState のみ表示。Drawer で zone を出す）
- tags 列: `<span className="text-xs text-muted">—</span>` + title="drawer で確認"
- lastSubmittedAt: `<span className="font-mono text-xs">{m.lastSubmittedAt}</span>`
- 公開列: `<MemberPublishSwitch memberId publishState isDeleted />`
- edit pencil: `<Button variant="ghost" size="sm" icon="edit" aria-label="編集" onClick={() => onOpenRow(m.memberId)} />`

行クリックで `onOpenRow`、`<td>` 内 Switch / edit は `stopPropagation()` で row click を抑止。

### Step C-3: `MemberDrawer.tsx` rewrite

prototype L278-363 の4セクション構成:

1. **drawer-head**: `<MemberAvatar size="md" />` + name + `{email} · {responseId}` + close button
2. **drawer-body**:
   - **VISIBILITY card-flat**: row-between (サイト公開 label + `<Switch>` mutation 配線) → divider → row-between (管理者メモ label) → `<FormField as="textarea" rows={3}>` (本サイクルでは保存配線。`PATCH /admin/members/:id/notes` がある場合のみ。なければ disabled + tooltip)
   - **TAGS card-flat**: `<div className="flex flex-wrap gap-2">` で `<TagPill selected={memberTags.includes(t)} disabled>{t}</TagPill>` を `ALL_TAGS` 14 件まで列挙。本サイクルでは disabled（理由: tag mutation 未配線。tooltip "タグ編集は別タスクで対応"）
   - **FORM RESPONSE KVList**: 既存 `<KVList rows={[...]}/>` で 7 行（回答ID / 送信日時 / UBM区画 / ステータス / お住まい / 職業 / ビジネス概要）
   - **DELETED card-flat** (isDeleted のみ): 退会日 / 理由 + 復元 Button (mutation)
3. **drawer-foot**:
   - left: 退会処理（論理削除）Button danger (非削除時のみ) → `confirm` dialog 後 `POST /admin/members/:id/delete`
   - spacer
   - 閉じる Button ghost
   - 保存 Button primary（管理者メモ永続化 endpoint がある場合のみ enabled）

detail fetch は `useEffect(() => fetch(`/api/admin/members/${memberId}`), [memberId])` で取得。loading 中は skeleton。

### Step C-4: `MembersClientShell.tsx` rewrite

差分:
- drawer の open state を `selectedMemberId: string | null` で管理
- `MembersTable` の `onOpenRow={id => setSelected(id)}`
- `<MemberDrawer open={!!selected} memberId={selected} onClose={() => setSelected(null)} />`
- 公開 Switch 楽観更新後の `onSuccess` で `router.refresh()` を呼ぶ（既存 server-side fetch を再走させて整合）

URLSearchParams 同期は既存挙動を維持。

### Step C-5: `BulkActionBar.tsx`

primitive 化のみ。Button variant・toast 呼出を `<Toast>` の API に揃える。機能変更なし。

### Step C-6: page.tsx 軽微改修

`apps/web/app/(admin)/admin/members/page.tsx`:
- `AdminPageHeader` の `description` を `"回答データ・公開フラグ・タグ付けをここから操作します。"` に固定（result.ok でも同じ。件数表示はテーブル上部で別途）
- `eyebrow` prop が `AdminPageHeader` にあるなら `"ADMIN / MEMBERS"` を渡す。無い場合は AdminPageHeader を拡張（小規模・親 workflow と同期）

### Step C-7: DoD (Lane C)

- prototype DOM tree と視覚的に整合（Phase 11 で screenshot diff）
- 既存 mutation 経路（公開 toggle / 論理削除）が正常動作
- `pnpm typecheck` / `pnpm lint` green

---

## Lane D: Playwright visual baseline 追加

### Step D-1: spec 作成

ファイル: `apps/web/tests/playwright/admin-members-visual.spec.ts`

```ts
import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const SHOULD_RUN = process.env.RUN_VISUAL === "1";
test.skip(!SHOULD_RUN, "RUN_VISUAL=1 のときのみ実行");

for (const vp of VIEWPORTS) {
  test.describe(`admin-members @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("loaded", async ({ page }) => {
      await page.goto("/admin/members");
      await expect(page.getByRole("heading", { name: "メンバー管理" })).toBeVisible();
      await expect(page).toHaveScreenshot(`admin-members-loaded-${vp.name}.png`, { maxDiffPixels: 200 });
    });

    test("empty", async ({ page }) => {
      await page.goto("/admin/members?q=__no_match_xyz__");
      await expect(page.getByText("該当する会員はいません")).toBeVisible();
      await expect(page).toHaveScreenshot(`admin-members-empty-${vp.name}.png`, { maxDiffPixels: 200 });
    });

    test("error", async ({ page }) => {
      // network intercept で /api/admin/members を 500 にする
      await page.route("**/admin/members*", (route) => route.fulfill({ status: 500, body: "{}" }));
      await page.goto("/admin/members");
      await expect(page.getByText(/読み込みに失敗/)).toBeVisible();
      await expect(page).toHaveScreenshot(`admin-members-error-${vp.name}.png`, { maxDiffPixels: 200 });
    });

    test("drawer-open", async ({ page }) => {
      await page.goto("/admin/members");
      await page.getByTestId(/admin-members-row-/).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page).toHaveScreenshot(`admin-members-drawer-${vp.name}.png`, { maxDiffPixels: 200 });
    });
  });
}
```

### Step D-2: baseline 生成

```bash
RUN_VISUAL=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-visual --update-snapshots
```

生成された PNG (16 枚) を `outputs/phase-11/screenshots/` に複製して保存。

### Step D-3: DoD (Lane D)

- 16 PNG が生成されてリポジトリに add される（または env-gated で deploy 後に bot 生成）
- visual diff workflow を阻害しない

---

## 全 Lane 完了後の統合 DoD

| Check | コマンド |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` |
| unit | `mise exec -- pnpm --filter @ubm-hyogo/web test --run` |
| api regression | `mise exec -- pnpm --filter @ubm-hyogo/api test --run admin` |
| design tokens | `mise exec -- pnpm verify:design-tokens` |
| gate metadata | `mise exec -- pnpm gate-metadata:validate` |
| phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` |

すべて green でないと Phase 13 (PR) に進まない。
