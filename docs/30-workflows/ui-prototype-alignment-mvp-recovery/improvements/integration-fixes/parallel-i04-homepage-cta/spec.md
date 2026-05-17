# parallel-i04-homepage-cta: HomePage に FOR MEMBERS CallToActionCTA を実装

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-06-public-pages` spec section 2.1 (line 76-100) で宣言された
`CallToActionCTA` component および HomePage への統合が**未実装**。

- `apps/web/src/components/public/CallToActionCTA.tsx`: 存在せず
- `apps/web/app/page.tsx`: 該当 import / mount なし

p-06 DoD 未達。Prototype `claude-design-prototype/pages-public.jsx:136-149` の
"FOR MEMBERS" ダーク variant セクションを実装する。

## スコープ

### 含む
- `CallToActionCTA` component の新規作成（dark variant、external link）
- `apps/web/app/page.tsx` への mount（MemberGrid section 後）
- responderUrl の供給経路の確定（CLAUDE.md `responderUrl` 固定値を使用）
- 関連 component spec の追加

### 含まない
- prototype CSS の token 化変更（既存 OKLch token のみ使用）
- 新 API endpoint の追加
- `/register` 側 `RegisterCallout` の共通化（spec で「検討」とあるが、本タスクでは別 component として実装）

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/src/components/public/CallToActionCTA.tsx` | create | dark variant CTA component |
| `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | create | snapshot + external link a11y 検証 |
| `apps/web/app/page.tsx` | modify | import + MemberGrid section 後に mount |

`responderUrl` 定数の置き場所:
- 既存 `apps/web/src/lib/constants/` 配下を `Read` で確認し、Form 関連定数の置き場所があればそれを利用
- なければ `apps/web/src/lib/constants/form.ts` を新規作成（最小ファイル 1 行）

## 設計

### CallToActionCTA.tsx

```tsx
import type { ReactElement } from "react";

export interface CallToActionCTAProps {
  readonly responderUrl: string;
  readonly heading?: string;
  readonly body?: string;
  readonly ctaLabel?: string;
}

export function CallToActionCTA({
  responderUrl,
  heading = "メンバー情報の掲載をお願いします",
  body = "Google Form にご回答いただくことで、UBM 兵庫支部会の公開ディレクトリに掲載されます。",
  ctaLabel = "回答フォームを開く",
}: CallToActionCTAProps): ReactElement {
  return (
    <section data-component="call-to-action-cta" data-variant="dark">
      <div>
        <h2>{heading}</h2>
        <p>{body}</p>
        <a
          href={responderUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-component="cta-button"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
```

class 名は `@layer components` の既存 token（parallel-03 で定義された dark variant utility）に合わせる。`data-component` selectors を持ち、styling は globals.css 側で完結させる（HEX 直書き禁止）。

### HomePage への mount (`apps/web/app/page.tsx`)

```tsx
import { CallToActionCTA } from "../src/components/public/CallToActionCTA";
import { FORM_RESPONDER_URL } from "../src/lib/constants/form";

// ... existing return ...
<main data-page="home">
  ...
  {members.items.length > 0 ? (
    <section data-component="featured-members">...</section>
  ) : null}
  <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
</main>
```

### responderUrl 定数

`apps/web/src/lib/constants/form.ts`:
```ts
// CLAUDE.md 固定値（不変条件）
export const FORM_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";
```

既存に同等定数があれば再利用し、本ファイルは作成しない。

## 関数シグネチャ

```ts
export function CallToActionCTA(props: CallToActionCTAProps): ReactElement;

export interface CallToActionCTAProps {
  readonly responderUrl: string;
  readonly heading?: string;
  readonly body?: string;
  readonly ctaLabel?: string;
}
```

## 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `responderUrl` (Google Form responder URL) |
| 出力 | dark variant section 1 つ |
| 副作用 | 外部 link click で新タブ遷移（`target="_blank"` + `rel="noopener noreferrer"`） |

## テスト方針

### `CallToActionCTA.component.spec.tsx`

1. デフォルト props で render → heading / body / cta が DOM 上に存在
2. `responderUrl` が anchor の `href` に bound されている
3. anchor の `target` / `rel` 属性が正しく設定されている (`noopener noreferrer`)
4. `data-component="call-to-action-cta"` selector が root 要素に存在

### HomePage の test

既存 HomePage spec があれば、`data-component="call-to-action-cta"` が render 結果に含まれることを追加検証。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run CallToActionCTA
mise exec -- pnpm -F "@ubm-hyogo/web" dev
# -> http://localhost:3000 で FOR MEMBERS section が dark variant で表示されることを目視
```

`verify-design-tokens` CI gate が HEX 直書きを検知するため、新規 CSS / inline style に HEX を含めないこと。

## DoD

- [ ] `CallToActionCTA.tsx` 作成、dark variant で render
- [ ] `apps/web/app/page.tsx` で MemberGrid section 後に mount
- [ ] external link が `target="_blank"` + `rel="noopener noreferrer"` を持つ
- [ ] component spec で props / a11y 属性 PASS
- [ ] `responderUrl` が CLAUDE.md 固定値と一致（hardcode 禁止のため constants 経由）
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] `verify-design-tokens` 相当の HEX 直書きなし
- [ ] dev で section render を目視確認
- [ ] p-06 spec section 2.1 DoD 達成

## リスク

| リスク | 対策 |
|--------|------|
| dark variant の class / token が parallel-03 で未定義 | 既存 `globals.css @layer components` を `Read` で確認。なければ最小限の class を追加（HEX 禁止、OKLch token 利用） |
| `responderUrl` 定数の置き場所が既存と重複 | 実装前に `grep -r "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ" apps/web/src` で重複確認 |
| HomePage の section 順序が prototype と不一致 | prototype line 136-149 を再確認し、MemberGrid 後に配置 |

## 並列性

- 独立: i01, i02, i03, i05 と編集対象ファイル重複なし
- 依存: なし（parallel-03 で globals.css の dark variant utility が完成していれば即時利用可。なければ最小限の class を本 spec 内で追加）

## スコープ確定ノート

このタスクは canonical workflow root へ昇格するか、in-place fix で完結するかをここで明示する。

- **status**: pending
- **canonical_workflow**: null（in-place fix で完結予定）
- **判断**: 新規 component 1 ファイル + HomePage mount + 定数追加程度で、prototype 既存設計を踏襲するだけのため Phase 1-13 のフル昇格は不要。本 spec.md を発注書として in-place fix で完結させる。dark variant token 設計が p-03 と干渉する場合のみ canonical workflow root へ昇格させ `artifacts.json` を更新する。
