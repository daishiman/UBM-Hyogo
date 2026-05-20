# Implementation Guide

## Part 1: 中学生レベル

マイページを開いている間、画面がすぐに全部そろわないことがある。何もない白い画面や短い文字だけだと、利用者は「止まったのかな」と感じやすい。

そこで、料理中に「ここにお皿、ここにコップ」と先に場所を並べておくように、丸いアイコンの場所と4つの情報の場所を薄い形で見せる。文字そのものはまだ出さず、読み上げが必要な人には「マイページを読み込み中」と伝える。

| 用語 | 日常語での説明 |
| --- | --- |
| skeleton | 中身が入る前の影絵 |
| token utility | サイト共通の色を使うための名前 |
| aria | 読み上げ機械へ伝える目印 |
| reduced motion | 動きを少なくしたい設定 |
| test | 期待どおりか確かめる約束 |

## Part 2: 技術者レベル

`apps/web/app/profile/loading.tsx` は引数なしの pure render function として `ReactElement` を返す。

```ts
export default function ProfileLoading(): ReactElement;
```

Root は `role="status"`, `aria-busy="true"`, `aria-live="polite"`, `data-page="profile-loading"` を持つ。視覚 skeleton は `bg-surface-2 motion-safe:animate-pulse` のみを使い、component-level HEX / arbitrary color を置かない。

検証は `apps/web/app/profile/loading.spec.tsx` の4ケースで行う。

| Case | Contract |
| --- | --- |
| TC-01 | status role / aria-busy / aria-live / data-page |
| TC-02 | sr-only text |
| TC-03 | avatar skeleton shape |
| TC-04 | KV row skeleton 4 items |

Visual evidence は `outputs/phase-11/screenshots/profile-loading-skeleton.png` に保存する。dev-only visual harness `/visual-harness/profile-loading` で `ProfileLoading` を単体描画し、avatar circle / heading bar / 4 KV bars を確認する。

Edge cases: `loading.tsx` は Next.js App Router の fallback なので error handling は持たない。reduced-motion 環境では `motion-safe:` により pulse animation が抑制される。
