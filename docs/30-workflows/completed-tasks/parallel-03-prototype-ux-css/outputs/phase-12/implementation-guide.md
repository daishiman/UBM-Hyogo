# Implementation Guide — parallel-03-prototype-ux-css

## Part 1: 中学生レベル

### なぜ必要か

画面の見た目が同じだと、「いま何を選んでいるのか」「この情報は誰に見えるのか」が分かりにくくなります。これは、学校の掲示板で大事なお知らせも普通のお知らせも同じ紙に見える状態に近いです。今回の改善では、選んだものや公開範囲が目で分かるようにして、操作ミスや見間違いを減らします。

### 何をするか

1. タグのボタンは、選ぶと色がはっきり反転します。お店のメニューで選んだ料理にマーカーを引くようなものです。
2. 会員カードにマウスを重ねると、枠と影が変わります。本棚で手に取ろうとした本だけ少し目立つようなものです。
3. プロフィールのまとまりには、誰向けの情報か分かる印を付けます。掲示板の紙に「全員向け」「会員向け」「管理者向け」とラベルを貼るのと同じです。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| token | 色や余白の名前付きメモ |
| CSS | 見た目を決めるルール |
| selector | どの部品に見た目を当てるかを選ぶ目印 |
| attribute | 部品につける小さな名札 |
| screenshot | 画面の写真 |

## Part 2: 技術者レベル

### Scope

UI/CSS だけではなく、semantic/data 属性と `MemberDetailSections.tsx` 内の local type を含む implementation task とする。`apps/api`、D1 schema、public API response は変更しない。

### Type Contract

```ts
type SectionVisibility = "public" | "member" | "admin";

type Section = {
  key: string;
  title: string;
  visibility?: SectionVisibility;
};
```

### Markup Contract

```tsx
<button
  type="button"
  data-component="tag-pill"
  data-selected="true"
  aria-pressed={isSelected}
>
  #{tag}
</button>

<section
  data-component="profile-section"
  data-section={section.key}
  data-visibility={section.visibility ?? "public"}
>
  ...
</section>
```

`aria-pressed` を active tag 削除 pill の主契約とし、視覚 selector は `data-selected="true"` に寄せる。通常 button に `aria-selected` は付与しない。

### CSS Contract

```css
button[data-component="tag-pill"][aria-pressed="true"] { ... }
button[data-component="tag-pill"][data-selected="true"] { ... }
[data-component="member-card"]:hover,
[data-component="member-card"]:focus-within { ... }
[data-component="profile-section"][data-visibility] { ... }
[data-role="visibility"][data-visibility] { ... }
```

### Error Handling / Edge Cases

- `section.visibility` 未定義は `"public"` に fallback。
- `member` / `admin` visual は component fixture で証明する。production API が未提供のため runtime page だけで代替しない。
- 不明な visibility 値は TypeScript で拒否する。runtime data 由来で型外値が来る場合は `"public"` に正規化する。

### Commands

実行コマンドは `outputs/phase-11/evidence/command-contract.md` を正本とする。

### Visual Evidence

- `outputs/phase-11/screenshots/tag-pill-selected.png`
- `outputs/phase-11/screenshots/tag-pill-default.png`
- `outputs/phase-11/screenshots/member-card-hover.png`
- `outputs/phase-11/screenshots/member-card-focus.png`
- `outputs/phase-11/screenshots/profile-section-public.png`
- `outputs/phase-11/screenshots/profile-section-member.png`
- `outputs/phase-11/screenshots/profile-section-admin.png`
- `outputs/phase-11/screenshots/metadata.json`
- `outputs/phase-11/evidence/playwright-report/results.json`
