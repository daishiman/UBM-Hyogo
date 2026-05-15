# Phase 6: 実装手順（ステップバイステップ）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | PARALLEL-01-NAV |
| タスク名 | parallel-01-navigation — admin 動線（sidebar logo / members→tags drawer link） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | pending |
| 実装区分 | **実装仕様書** |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 判定根拠 | Phase 5 の関数シグネチャに従い、`AdminSidebar.tsx` / `MemberDrawer.tsx` の JSX 差分と `*.spec.tsx` 新規ファイルを **ステップ単位で再現可能** な粒度に確定する。実装行為そのものは coding phase で実施するが、本 Phase の手順書がそのまま再現可能となる実装仕様レベルまで詳細化する。 |

---

## 目的

Phase 5 で固定した変更対象 4 ファイルと関数シグネチャを、ファイル単位・ステップ単位の **実装手順書** に展開する。
成果物 `outputs/phase-06/implementation-steps.md` は、担当者（または LLM coding agent）が単体で着手できる粒度とする。

---

## 6-1. 実装ステップ概要

| ステップ | 対象 | 主な作業 |
| --- | --- | --- |
| S1 | `apps/web/src/components/layout/AdminSidebar.tsx` | `<nav>` 直下に Link を追加 |
| S2 | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`（編集） | href / aria-label / focus テスト |
| S3 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | drawer 末尾に Link を追加 |
| S4 | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx`（新規） | href / encode / link text テスト |
| S5 | ローカル smoke 手動確認 | logo→`/`、drawer→tags の双方向遷移を視認 |
| S6 | typecheck / lint / vitest 一括実行 | 全 PASS |

---

## 6-2. 各ステップの実装ポイント

### S1: `AdminSidebar.tsx` 差分

挿入位置: `<nav aria-label="管理メニュー">` の直下、既存 items `<ul>` の前。

```tsx
import Link from "next/link";

export function AdminSidebar() {
  return (
    <nav aria-label="管理メニュー" className="admin-sidebar">
      {/* G1-1: home 動線 — sidebar 上部のロゴ領域として配置 */}
      <Link
        href="/"
        aria-label="ホームに戻る"
        className={[
          "logo-link",
          "inline-flex items-center gap-2",
          "px-3 py-2",
          "text-[var(--ubm-color-fg-default)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-[var(--ubm-color-accent)]",
        ].join(" ")}
      >
        {/* ロゴ表現は prototype の primitive に合わせる（テキスト or SVG） */}
        <span className="font-semibold">UBM 兵庫</span>
      </Link>

      {/* 既存 items 群はそのまま */}
      <ul>{/* … */}</ul>
    </nav>
  );
}
```

注意事項:
- 色は `var(--ubm-color-fg-default)` / `var(--ubm-color-accent)` 経由（HEX 直書き / 任意値クラス禁止）。
- `aria-label="ホームに戻る"` を必ず付与（ロゴ画像のみの場合、視覚以外のユーザーに遷移先意図を伝える）。
- prototype の primitive を再利用し、ここで新規 primitive を生やさない。

### S2: `AdminSidebar.component.spec.tsx`

Testing Library + Vitest を前提に、最低 4 ケース。

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminSidebar } from "../AdminSidebar";

describe("AdminSidebar — home wayfinding (G1-1)", () => {
  it("renders a link to '/' with the home aria-label", () => {
    render(<AdminSidebar />);
    const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("home link is reachable via keyboard focus order", () => {
    render(<AdminSidebar />);
    const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
    homeLink.focus();
    expect(homeLink).toHaveFocus();
  });

  it("does not use raw HEX color in className", () => {
    render(<AdminSidebar />);
    const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
    expect(homeLink.className).not.toMatch(/\[#[0-9a-fA-F]{3,8}\]/);
  });

  it("has visible label or text inside the link", () => {
    render(<AdminSidebar />);
    const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
    expect(homeLink.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
```

> `it.todo` / `test.todo` は使わない（task-specification-creator §7.3）。

### S3: `MemberDrawer.tsx` 差分

挿入位置: 既存 sections 群の末尾。`onClose` は明示呼び出ししない（next/link の page transition で drawer は自動 unmount）。

```tsx
import Link from "next/link";

export function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
  // … 既存 sections …

  return (
    <Drawer open onClose={onClose} title="会員詳細">
      {/* … 既存セクション … */}

      {/* G1-2: tags 管理画面へのナビゲーション */}
      <div
        className={[
          "border-t border-[var(--ubm-color-border-default)]",
          "pt-4 mt-4",
        ].join(" ")}
      >
        <Link
          href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
          className={[
            "inline-flex items-center gap-1",
            "text-sm font-medium",
            "text-[var(--ubm-color-accent)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:outline-[var(--ubm-color-accent)]",
          ].join(" ")}
        >
          タグ管理へ
        </Link>
      </div>
    </Drawer>
  );
}
```

注意事項:
- `encodeURIComponent()` を必ず通す（`@`, `/`, `#`, 空白 などの special char 対応）。
- `onClose` を link クリック側から呼ばない（page transition の unmount に統一）。
- 色は `var(--ubm-color-accent)` / `var(--ubm-color-border-default)` / `var(--ubm-color-accent)` 経由。

### S4: `MemberDrawer.spec.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemberDrawer } from "../MemberDrawer";

describe("MemberDrawer — tags wayfinding (G1-2)", () => {
  it("renders a link to /admin/tags with memberId query", () => {
    render(<MemberDrawer memberId="abc123" onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: /タグ管理へ/ });
    expect(link).toHaveAttribute("href", "/admin/tags?memberId=abc123");
  });

  it("encodes special characters in memberId", () => {
    render(<MemberDrawer memberId="a@b/c#d" onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: /タグ管理へ/ });
    expect(link).toHaveAttribute(
      "href",
      `/admin/tags?memberId=${encodeURIComponent("a@b/c#d")}`,
    );
  });

  it("does not call onClose just by rendering or by user focusing the link", () => {
    const onClose = vi.fn();
    render(<MemberDrawer memberId="abc123" onClose={onClose} />);
    const link = screen.getByRole("link", { name: /タグ管理へ/ });
    link.focus();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses OKLch token for link color (no raw HEX in className)", () => {
    render(<MemberDrawer memberId="abc123" onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: /タグ管理へ/ });
    expect(link.className).not.toMatch(/\[#[0-9a-fA-F]{3,8}\]/);
  });
});
```

### S5: ローカル smoke 手動確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev

# 1) http://localhost:3000/admin にアクセス
#    → sidebar 上部の「ホームに戻る」ロゴリンクを click → / に遷移
# 2) http://localhost:3000/admin/members にアクセス
#    → 任意の会員行を click → drawer open
#    → drawer 末尾の「タグ管理へ」を click
#    → /admin/tags?memberId=<id> に遷移し、focusMemberId が反映される
```

### S6: 一括検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer
```

---

## 6-3. 不変条件チェック（実装中に守るべき）

- [ ] `apps/api/` 配下のファイルを変更していない
- [ ] D1 schema 変更 / 新規 endpoint 追加を行っていない
- [ ] `bg-[#xxx]` / `text-[#xxx]` などの HEX 直書きを行っていない
- [ ] `127.0.0.1:8888` 等のローカル限定エンドポイントを焼き込んでいない
- [ ] 新規 test ファイルは `*.spec.tsx` で命名している
- [ ] `it.todo` / `test.todo` を残していない
- [ ] `onClose` を link クリック側から明示呼び出ししていない

---

## 6-4. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/parallel-01-navigation-admin-wayfinding/phase-05.md | 関数シグネチャ・着手順序 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | §4.1 / §4.2 の JSX イメージ |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | 編集対象 |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | 編集対象 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本 |

---

## 6-5. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | S1〜S6 のステップバイステップ実装手順 |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 6-6. 完了条件

- [ ] S1〜S6 が、ファイル単位で再現可能な粒度に展開されている
- [ ] 各ステップに「対象ファイル」「挿入箇所」「コード snippet」が含まれている
- [ ] 不変条件 7 項目が手順内チェックリストとして埋め込まれている
- [ ] ローカル実行コマンド（typecheck / lint / vitest）が記載されている
- [ ] `it.todo` / `test.todo` を含むコード snippet が存在しない

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（テスト計画）
- 引き継ぎ事項:
  - S2 / S4 のテストケース 4 本ずつ を Phase 7 で詳細化（特に encodeURIComponent special char ケース）
  - S5 手動 smoke を Phase 7 で E2E 拡張案として固定化
- ブロック条件: S1 / S3 の JSX が Phase 5 のシグネチャから乖離する設計（新規 prop 追加・onClose 再配線等）を含む場合

---

作成日: 2026-05-15
