# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase の成果物は `AdminSidebar.tsx` 編集設計・`MemberDrawer.tsx` 編集設計・Vitest + RTL + Playwright テスト戦略を含むコード設計。設計単独では完結せず Phase 5 以降で実コード変更を伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin ナビゲーション動線改善 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |
| visualEvidence | VISUAL |

## 目的

Phase 1 で確定した論点採用案（logo 表示形式 / drawer link 配置・onClose 制御 / encode 徹底）を、コード実装可能な粒度の設計に落とし込む。本 Phase は以下 3 成果物を出力する。

1. `outputs/phase-02/admin-sidebar-logo-design.md` — G1-1 Logo Link の JSX 構造 / props / token 化 CSS / a11y
2. `outputs/phase-02/member-drawer-tag-link-design.md` — G1-2 drawer 内 link の配置 / href 構成 / onClose 動作 / encode
3. `outputs/phase-02/test-strategy.md` — Vitest + RTL のコンポーネント test、Playwright admin smoke の 9 routes 回帰戦略

## 変更対象ファイル一覧

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 | `<nav>` 直下に `<Link href="/" aria-label="ホームに戻る">` を追加（sidebar 上部）|
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | drawer content 最下部に `border-t` 区切りの専用 section + `<Link>` 追加 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | 編集 | logo link href / aria-label / focus-visible assertion |
| `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | 新規 | drawer 内 link 存在 / href encode / link text / 特殊文字 memberId |
| `apps/web/playwright/tests/admin-pages.spec.ts`（既存） | 編集 | members → drawer → tags link クリック → page transition の assertion 追加 |
| `apps/web/app/(admin)/admin/tags/page.tsx` | 参照のみ | `focusMemberId` searchParam handling は既実装。改修なし |

> **既存 API endpoint / D1 / token 定義は不変**。新規 primitive も生やさない。

## 設計詳細

### 1. AdminSidebar logo link 設計

#### JSX 構造

```tsx
import Link from "next/link";

export function AdminSidebar() {
  return (
    <nav aria-label="管理メニュー" className="admin-sidebar">
      {/* G1-1: logo → / link（sidebar 上部） */}
      <Link
        href="/"
        aria-label="ホームに戻る"
        className="admin-sidebar__home flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--ubm-color-accent)] hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        {/* logo content: 既存ロゴアセット有無で文字列 or SVG */}
        UBM兵庫
      </Link>

      {/* 既存 nav items（不変） */}
      <ul>{/* ... */}</ul>
    </nav>
  );
}
```

#### Props 決定

- `href`: 固定 `"/"`
- `aria-label`: 固定 `"ホームに戻る"`
- `className`: OKLch CSS var のみで構成（`--ubm-color-accent`, `--ubm-color-accent`）
- 子要素: Phase 1 論点 1 で確定（既存ロゴアセットあれば SVG、なければ文字列 `UBM兵庫`）

#### CSS / token

- 色: `text-[var(--ubm-color-accent)]` のみ
- focus ring: `focus-visible:outline-[var(--ubm-color-accent)]` で keyboard accessibility 確保
- HEX 直書き禁止（CI gate `verify-design-tokens` 対象）

#### a11y 要件

- `aria-label="ホームに戻る"` で intent 明確化
- `focus-visible` outline で keyboard 操作可視化
- Tab → Enter で `/` への navigation 発火

### 2. MemberDrawer tag link 設計

#### JSX 構造

```tsx
import Link from "next/link";

export interface MemberDrawerProps {
  readonly memberId: string;
  readonly onClose: () => void;
}

export function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
  // 既存 fetch / state 構造は不変

  return (
    <Drawer open onClose={onClose} title="会員詳細">
      {/* 既存 sections（基本情報・連絡先・audit log 等）— 不変 */}

      {/* G1-2: tag 管理 link 専用 section（最下部） */}
      <div className="border-t border-[var(--ubm-color-border-default)] pt-4 mt-4">
        <Link
          href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
          className="inline-flex items-center text-sm font-medium text-[var(--ubm-color-accent)] hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
        >
          タグ管理へ
        </Link>
      </div>
    </Drawer>
  );
}
```

#### Props / 型シグネチャ

- `MemberDrawerProps` は不変（`memberId: string`, `onClose: () => void`）
- 内部 JSX に専用 section を追加するのみ

#### href 構成と encode 戦略

- 正規形: `` `/admin/tags?memberId=${encodeURIComponent(memberId)}` ``
- `memberId` が UUID/ULID 想定でも、将来的に Google Form responseId 等が混入した際の URL 破損を防止
- Vitest テストで `memberId = "abc@example/test 01"` のような特殊文字を含む case を必須化

#### onClose 制御の挙動

- Next.js `<Link>` クリック → page transition 発火 → `/admin/tags?memberId=...` へ navigate
- drawer は `/admin/members` page の state に紐づくため route 遷移で unmount → 明示 `onClose()` 呼び出し**不要**
- Phase 1 論点 2 で確定したとおり、明示 `onClose()` を呼ばない設計を Phase 2 で固定

#### CSS / token

- link 色: `text-[var(--ubm-color-accent)]`
- section 区切り: `border-[var(--ubm-color-border-default)]`
- focus ring: `focus-visible:outline-[var(--ubm-color-accent)]`

#### a11y 要件

- link text 「タグ管理へ」が明確な action label
- focus-visible で keyboard 操作可視化
- `<Link>` は Next.js が `<a>` を render するため screen reader 互換

### 3. テスト戦略

#### Vitest + RTL component test

**`AdminSidebar.component.spec.tsx`** （既存編集, `*.spec.tsx` suffix）

| ケース | assertion |
| --- | --- |
| T-A1 | logo link が `href="/"` を持つ |
| T-A2 | logo link が `aria-label="ホームに戻る"` を持つ |
| T-A3 | logo link が `focus-visible:outline` を含む class を持つ |
| T-A4 | Tab で focus 移動可能（first focusable element） |
| T-A5 | snapshot で layout integrity を維持 |

**`MemberDrawer.spec.tsx`** （新規, `*.spec.tsx` suffix 必須）

| ケース | assertion |
| --- | --- |
| T-D1 | drawer render 時に memberId="abc123" → link href="/admin/tags?memberId=abc123" |
| T-D2 | drawer render 時に memberId="abc@example/test 01" → link href="/admin/tags?memberId=abc%40example%2Ftest%2001" |
| T-D3 | link text が「タグ管理へ」 |
| T-D4 | link が `border-t` 区切り section 内に存在 |
| T-D5 | link が `focus-visible:outline` class を持つ |
| T-D6 | snapshot で drawer 構造を維持 |

#### Playwright admin smoke test

**`apps/web/playwright/tests/admin-pages.spec.ts`** （既存編集）

| ケース | assertion |
| --- | --- |
| T-S1 | admin 9 routes (`/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`, `+α`) 全 open 可能 |
| T-S2 | `/admin/members` → 会員行クリック → drawer open → 「タグ管理へ」link visible |
| T-S3 | 「タグ管理へ」link クリック → `/admin/tags?memberId=...` へ遷移 |
| T-S4 | `/admin/tags` で `focusMemberId` searchParam が consume されている（既実装の挙動回帰確認） |
| T-S5 | sidebar logo クリック → `/` へ遷移 |

#### モック方針

- Vitest: `next/link` は default mock（href / aria-label / children を確認可能）
- MemberDrawer test: `memberId` を props 直接注入。fetch は MSW or vi.mock で固定値
- Playwright: admin テストアカウント `manjumoto.daishi@senpai-lab.com` で login fixture を使用（CLAUDE.md MEMORY 参照）

#### 実行コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Vitest component test
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer

# Playwright smoke
mise exec -- pnpm --filter @ubm-hyogo/web e2e -- admin-smoke

# 開発サーバー（手動確認）
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

## 入出力・副作用

### G1-1 sidebar logo link

- **入力**: ユーザの click または keyboard (Enter/Space on focused link)
- **出力**: `/` への Next.js client-side navigation
- **副作用**: browser history push、admin layout → root layout の transition
- **D1 アクセスなし** / **API call なし**

### G1-2 drawer tag link

- **入力**: ユーザの click または keyboard (Enter/Space)
- **出力**: `/admin/tags?memberId={encoded_id}` への navigation、drawer は route 遷移で自動 unmount
- **副作用**: `/admin/tags` page mount → `focusMemberId` searchParam を consume → 既存 `TagQueuePanel` に伝播（既実装）
- **D1 アクセスなし**（UI 経由のみ。tags page 側で既存 fetch 経路を踏む）

## DoD（Phase 2 完了条件）

- [ ] 3 つの outputs/phase-02 ドキュメント全てが作成され、AC-1〜AC-5 にそれぞれ紐付いている
- [ ] JSX 構造 / props / 型シグネチャ / CSS class / a11y 要件が本 phase-02.md に明記されている
- [ ] 変更対象ファイル一覧が新規 / 編集 / 参照のみ区分付きで揃っている
- [ ] OKLch CSS var のみで色を表現し、HEX 直書きを含まないことが設計レベルで保証されている
- [ ] `encodeURIComponent` 徹底 + 特殊文字 test case が test-strategy.md に明記されている
- [ ] `*.spec.{ts,tsx}` のみ使用（test suffix 不変条件）が test-strategy.md に明記されている
- [ ] onClose 明示呼び出し不要の根拠（Next.js page transition による drawer unmount）が member-drawer-tag-link-design.md に記載されている
- [ ] 既存 `/admin/tags` page `focusMemberId` 改修不要が member-drawer-tag-link-design.md に明記されている
- [ ] 検証コマンドが `mise exec --` 経由で示されている
- [ ] Phase 1 CONDITIONAL 解消条件 2 件（token / a11y）が本 Phase で具体化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | Phase 1 確定事項 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 原典 spec |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | G1-1 編集対象 |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | G1-2 編集対象 |
| 必須 | apps/web/app/(admin)/admin/tags/page.tsx | `focusMemberId` 既実装（参照のみ） |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | design token 正本 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/ | プロトタイプ正本 |
| 必須 | CLAUDE.md | 不変条件 / test suffix |
| 参考 | https://nextjs.org/docs/app/api-reference/components/link | Next.js `<Link>` 仕様 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/admin-sidebar-logo-design.md | G1-1 設計（AC-1, AC-4, AC-5） |
| ドキュメント | outputs/phase-02/member-drawer-tag-link-design.md | G1-2 設計（AC-2, AC-3, AC-4, AC-5） |
| ドキュメント | outputs/phase-02/test-strategy.md | Vitest + RTL + Playwright 戦略（AC-3） |

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: Phase 2 成果物 3 件、変更対象ファイル一覧、Vitest テストケース T-A1〜T-A5 / T-D1〜T-D6、Playwright T-S1〜T-S5
- ブロック条件: outputs/phase-02 配下 3 ファイル未作成、または DoD 未充足の場合 Phase 3 へ進まない

---

**作成日**: 2026-05-15
