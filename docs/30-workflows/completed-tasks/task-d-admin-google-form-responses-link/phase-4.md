# Phase 4: テスト作成（TDD Red フェーズ）

> **Phase 種別**: テスト作成（実装前のテスト定義）
> **対象タスク**: Task D admin サイドバー nav に Google Form 回答編集画面への外部リンクを追加
> **workflow_state**: `implemented_local_evidence_captured`（実装は dev へ landed 済み: PR #1064 / commit 745c95115）
> **前提**: Phase 1-3 完了（要件・設計・設計レビュー PASS）
> **次フェーズ**: Phase 5（実装）でこれらのテストを green にする

---

## 4.1 このフェーズのゴール

admin サイドバーの nav 末尾に「Form回答」項目を 1 件追加し、クリックで Google Form の編集 URL（`FORM_RESPONSES_EDIT_URL`）を**別タブで開く外部リンク**として描画する機能を実装する前に、期待する振る舞いをテストとして先に定義する（TDD の Red フェーズ）。

このフェーズで定義するテストは、本来は実装前なので失敗する（Red）はずのものである。
ただし**本タスクは verify_existing（landed 実装の正本記述）であり、対応する 3 spec ファイルは既に dev に landed 済みで現状すべて green である**。したがって本 Phase は「実装前に定義されるべき振る舞い」を文書として確定し、landed 済み spec がその振る舞いを過不足なく検証していることを保証する役割を持つ。新規 apps 差分は発生させない。

本タスクの核心は次の 4 点を機械的に検知できる形に落とすことである。

- 外部リンクは `target="_blank"` + `rel="noopener noreferrer"` で開く（AC-D1 / AC-D2・不変条件 #7 のタブナビング防止）。
- href は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止・AC-D3）。
- 外部リンクは active 判定対象外（`data-active` / `aria-current` を出さない・AC-D4）。
- 内部リンクの active 挙動は従来どおり維持される（回帰防止）。

---

## 4.2 実コードの事実（テスト基盤・取り違え防止）

実コードを読んだ結果、テスト基盤について以下を正とする。

### コンポーネントの責務分離

- `shell-config.ts` は**純関数**（`buildNavForRole(role, ctx?)` / `isNavItemActive(href, pathname)`）。role 判定や session 取得は行わない。external 項目の有無は `buildNavForRole("admin")` の admin グループ items を直接 assert すればよく、DOM render を要しない。
- `SidebarNavItem.tsx` は `"use client"` コンポーネント。active 判定は `usePathname()`（`next/navigation`）を正本とし、`activePath` を SSR fallback とする。`item.external` のとき `<a>` を、それ以外は `<Link>`（next/link）を描画する分岐を持つ。
- `icons.tsx` の `PATHS: Record<ShellNavItemId, string>` は**網羅型**。`ShellNavItemId` union に `"form-responses"` を追加した時点で `PATHS["form-responses"]` の欠落は型エラーになる（テストではなく `pnpm typecheck` が検知する）。

### jsdom render の手段（取り違え防止）

- `SidebarNavItem` は client component だが `next/navigation` の `usePathname` のみに依存する。spec は `vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/admin/members") }))` で固定する。
- `<SidebarNavItem>` は `<li>` を返すため、render では `<ul>` でラップする（`render(<ul><SidebarNavItem .../></ul>)`）。
- anchor / link の属性は `container.querySelector("a")?.getAttribute(...)` で取得する。`next/link` の `<Link>` も最終的に `<a>` に解決されるため、両分岐とも `a` セレクタで取れる。外部分岐と内部分岐は `target` / `data-active` / `aria-current` の有無で区別する。

### 引き当て（混同禁止）

- **external 判定 = `item.external === true`**（`shell-config` の `form-responses` 項目のみ true）。
- **active 判定 = `isNavItemActive(item.href, pathname)`**（内部リンク専用。external 分岐では呼ばれても DOM へ反映しない）。

---

## 4.3 変更対象ファイル一覧と種別（CONST_005）

| ファイル | 種別 | 本 Phase での扱い |
|---------|------|-------------------|
| `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | 新規（landed） | `FORM_RESPONSES_EDIT_URL` が canonical URL と一致（1 test） |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 新規（landed） | external / 内部 active / collapsed sr-only の 3 test |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 編集（landed） | admin グループに `form-responses` external 項目が含まれることを既存 spec に追加 |
| `apps/web/src/lib/constants/form.ts` | 編集（Phase 5） | `FORM_RESPONSES_EDIT_URL` 追加（テスト対象・本 Phase では Red 想定） |
| `apps/web/src/components/shell/shell-config.ts` | 編集（Phase 5） | union / interface / admin items に external 項目（テスト対象） |
| `apps/web/src/components/shell/icons.tsx` | 編集（Phase 5） | 網羅型 PATHS に `form-responses` icon（typecheck 対象） |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集（Phase 5） | external 分岐の描画（テスト対象） |

> 本 Phase で**新規・編集するテストコードは上 3 つの spec のみ**。実コード（form.ts / shell-config.ts / icons.tsx / SidebarNavItem.tsx）は Phase 5。
> テストファイル名は全て `*.spec.{ts,tsx}`（不変条件 #8。`*.test.*` は lefthook `block-test-suffix` / CI `verify-test-suffix` が reject する）。

---

## 4.4 テストケース一覧

| TC | 対象 spec | 内容 | 期待結果 |
|----|-----------|------|---------|
| TC-1 | form-responses | `FORM_RESPONSES_EDIT_URL` が canonical URL に一致 | `= "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit"` |
| TC-2 | SidebarNavItem | external item は `target="_blank"` + `rel="noopener noreferrer"` 付き anchor で描画し、active 扱いにしない | href=定数 / target=`_blank` / rel=`noopener noreferrer` / aria-current=null / data-active=null / textContent に "Form回答" |
| TC-3 | SidebarNavItem | 内部 item は pathname 一致時に active を出す（回帰防止） | target=null / data-active=`true` / aria-current=`page` |
| TC-4 | SidebarNavItem | collapsed のとき label span は `sr-only` になる | label span の className に `sr-only` |
| TC-5 | shell-config | `buildNavForRole("admin")` の admin グループ items に `form-responses` external 項目が含まれる | `matchObject({ href: FORM_RESPONSES_EDIT_URL, external: true, label: "Form回答" })` |

### AC マッピング

| AC | 検証 TC |
|----|---------|
| AC-D1 クリックで別タブで Form 編集 URL を開く | TC-2（`target="_blank"` で別タブ）, TC-5（href=定数） |
| AC-D2 `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7） | TC-2 |
| AC-D3 href は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止） | TC-1, TC-2, TC-5 |
| AC-D4 外部リンク判別（↗ + sr-only）かつ active 判定対象外 | TC-2（active を出さない）, TC-4（sr-only ラベル） |

---

## 4.5 テストコード（landed・3 spec）

### 4.5.1 `lib/constants/__tests__/form-responses.spec.ts`（新規・TC-1）

```typescript
import { describe, expect, it } from "vitest";

import { FORM_RESPONSES_EDIT_URL } from "../form";

describe("FORM_RESPONSES_EDIT_URL", () => {
  it("points to the canonical Google Form edit URL", () => {
    expect(FORM_RESPONSES_EDIT_URL).toBe(
      "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit",
    );
  });
});
```

> ハードコード禁止（AC-D3）の最終証跡。定数値が CLAUDE.md フォーム固定値の formId と一致することを保証する。

### 4.5.2 `components/shell/__tests__/SidebarNavItem.spec.tsx`（新規・TC-2/TC-3/TC-4）

`@testing-library/react` + jsdom で render する。`next/navigation` は `vi.mock` で固定し、`afterEach(() => cleanup())` で DOM をリセットする。

```typescript
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/members"),
}));

import { FORM_RESPONSES_EDIT_URL } from "../../../lib/constants/form";
import { SidebarNavItem } from "../SidebarNavItem";
import type { ShellNavItem } from "../shell-config";

afterEach(() => cleanup());

describe("SidebarNavItem", () => {
  it("external item は target/rel 付き anchor で描画し active 扱いにしない", () => {
    const item: ShellNavItem = {
      id: "form-responses",
      href: FORM_RESPONSES_EDIT_URL,
      label: "Form回答",
      icon: "form-responses",
      external: true,
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed={false} activePath="/admin" />
      </ul>,
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe(FORM_RESPONSES_EDIT_URL);
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link?.getAttribute("aria-current")).toBeNull();
    expect(link?.getAttribute("data-active")).toBeNull();
    expect(link?.textContent).toContain("Form回答");
  });

  it("内部 item は pathname 一致時に active（aria-current/data-active）を出す", () => {
    const item: ShellNavItem = {
      id: "members",
      href: "/admin/members",
      label: "メンバー",
      icon: "members",
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed={false} activePath="/admin" />
      </ul>,
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("target")).toBeNull();
    expect(link?.getAttribute("data-active")).toBe("true");
    expect(link?.getAttribute("aria-current")).toBe("page");
  });

  it("collapsed のとき label は sr-only になる", () => {
    const item: ShellNavItem = {
      id: "members",
      href: "/admin/members",
      label: "メンバー",
      icon: "members",
    };
    const { container } = render(
      <ul>
        <SidebarNavItem item={item} collapsed activePath="/admin" />
      </ul>,
    );
    const labelSpan = Array.from(container.querySelectorAll("span")).find((s) =>
      s.textContent?.includes("メンバー"),
    );
    expect(labelSpan?.className).toContain("sr-only");
  });
});
```

> - TC-2 は `usePathname` を `/admin/members` 固定にしているが、external 項目の href は外部 URL のため `isNavItemActive` は false を返し、かつ external 分岐は `data-active` / `aria-current` を**そもそも DOM に出さない**ため両者が null になる（AC-D4）。
> - TC-3 は内部項目 `/admin/members` が固定 pathname と一致するため active を出すことを検証する（回帰防止）。
> - TC-4 は collapsed のとき label span に `sr-only` が付く（icon のみ表示）ことを検証する。

### 4.5.3 `components/shell/__tests__/shell-config.spec.ts`（編集・TC-5）

既存の `buildNavForRole` spec（viewer / member / admin / schema badge）に、external 項目検証ケースを 1 件追加する。

```typescript
import { FORM_RESPONSES_EDIT_URL } from "../../../lib/constants/form";
import { buildNavForRole, isNavItemActive } from "../shell-config";

// ...既存ケース（viewer / member / admin 3 グループ / schema badge）...

it("admin は Google Form 回答 external link を持つ", () => {
  const groups = buildNavForRole("admin");
  const item = groups
    .find((g) => g.id === "admin")
    ?.items.find((i) => i.id === "form-responses");
  expect(item).toMatchObject({
    href: FORM_RESPONSES_EDIT_URL,
    external: true,
    label: "Form回答",
  });
});
```

> 既存の admin グループ item 数 assert は `toHaveLength(10)` に更新済み（audit までの 9 項目 + form-responses で 10 項目）。viewer / member ロールには admin グループ自体が含まれないため、`form-responses` 項目も含まれない（Phase 6 の role 境界回帰で明示）。

---

## 4.6 入出力・副作用

- **入力**: `ShellNavItem`（`external?: boolean` を含む）、`buildNavForRole` の role 引数（`"admin"`）、`usePathname()` のモック値。
- **出力**: render された DOM（`<a>` の属性集合）、`buildNavForRole("admin")` の admin グループ items 配列。
- **副作用**: `vi.mock("next/navigation")` の module mock。`afterEach(() => cleanup())` で jsdom DOM を破棄。ネットワーク / D1 アクセス無し（external href のクリックは jsdom では発火させない＝属性検証のみ）。

---

## 4.7 ローカル実行コマンド（CONST_005）

apps/web の vitest は**リポジトリルート設定（`--root=../..`）**で動くため、`pnpm --filter @ubm-hyogo/web test` 経由で実行する（個別 spec はパス指定で絞る）。

```bash
# 3 spec を個別実行
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/constants/__tests__/form-responses.spec.ts \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts

# web 全 spec
mise exec -- pnpm --filter @ubm-hyogo/web test

# 型網羅（icons.tsx PATHS の form-responses 欠落検知を含む）
mise exec -- pnpm typecheck
```

---

## 4.8 期待される結果（Red / verify_existing では green）

実装前（純粋な TDD Red を想定した場合）の失敗想定:

- `FORM_RESPONSES_EDIT_URL` が `form.ts` に未定義 → TC-1 の import が**型エラー / 実行エラー**。
- `ShellNavItemId` に `"form-responses"` が無い → TC-2 / TC-5 の item リテラルが**型エラー**、`ShellNavItem.external` も未定義。
- `SidebarNavItem` に external 分岐が無い → external item でも `<Link>` が描画され `data-active` を出すため TC-2 が**失敗**。
- `buildAdminGroup` に form-responses 項目が無い → TC-5 の `matchObject` が**失敗**、admin items 数 assert も不一致。

**verify_existing の実態**: 上記 4 ファイルは既に landed 済みのため、本 Phase の TC-1〜TC-5 は**すべて green**。Red は「実装が無ければ落ちる」ことの設計上の保証として記述する。

---

## 4.9 DoD（Definition of Done）

- [ ] `form-responses.spec.ts` に TC-1（canonical URL 一致）を定義
- [ ] `SidebarNavItem.spec.tsx` に TC-2（external anchor target/rel/active-none）/ TC-3（内部 active）/ TC-4（collapsed sr-only）を定義し、`vi.mock("next/navigation")` + `<ul>` ラップ + `afterEach(cleanup)` を踏襲
- [ ] `shell-config.spec.ts` に TC-5（admin external 項目 matchObject）を追加し、admin items 数を 10 に更新
- [ ] external 判別が `item.external`、active 判別が `isNavItemActive` であることを明示
- [ ] テストファイル名が全て `*.spec.{ts,tsx}`（不変条件 #8）
- [ ] AC-D1〜AC-D4 を網羅
- [ ] 上記コマンドで 3 spec が green（verify_existing。Red は実装欠落時の設計保証として記述）
- [ ] `git status apps/web/` を確認（本仕様書作成タスクでは新規 apps 差分を発生させない＝クリーン）

---

## 完了条件

完了条件は次のすべてを満たすことである。

1. TC-1〜TC-5 が AC-D1〜AC-D4 を漏れなく写像し、3 spec ファイル（`form-responses.spec.ts` / `SidebarNavItem.spec.tsx` / `shell-config.spec.ts`）に定義されていること。
2. external 分岐の検証手段（`target` / `rel` / `aria-current` / `data-active` の getAttribute）と、active 回帰の検証手段（内部 item の `data-active="true"`）が本書に明記されていること。
3. テストファイル名が全て `*.spec.{ts,tsx}` であること（不変条件 #8）。
4. landed 済み 3 spec が現状 green であることを `pnpm --filter @ubm-hyogo/web test` で確認でき、`git status apps/web/` がクリーン（新規 apps 差分ゼロ）であること。
