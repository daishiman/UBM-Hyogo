# 実装ガイド: 会員詳細ドロワー「送信日時」秒精度統一

> 本未タスクは Phase 1 を正本とする。本ガイドはフォーマット準拠のための
> Part 1（中学生レベル概念説明）/ Part 2（技術者向け詳細）の 2 部構成。
> 実装着手時は `index.md` の AC と §8 知見を正本とする。

---

## Part 1: 中学生にもわかる説明（概念）

### なぜ必要なの？（先に理由）

時計の表示を思い浮かべてください。教室の壁の時計が「19時34分」までしか出さないのに、
スマホの時計が「19時34分19秒」と秒まで出していたら、同じ時刻でも「あれ、別の時間かな？」と
一瞬まよいますよね。

会員管理の画面でも、同じことが起きています。
**会員の一覧（リスト）** では時刻を「秒まで」表示するように、前回の作業で直しました。
でも、会員を 1 人クリックして開く **詳細パネル**（ドロワー）の「送信日時」だけは、
昔のまま「分まで」しか出していません。

同じ画面なのに、見る場所によって時刻の細かさがバラバラ。これは見る人を少し混乱させます。

### 何をするの？

詳細パネルの「送信日時」も、一覧と同じ「秒まで」の表示に揃えます。
ちょうど、壁の時計とスマホの時計を「どちらも秒まで出す」設定に合わせるイメージです。

幸い、「秒まで出す部品」（プログラムの道具）はもう作ってあります。
だから今回は、詳細パネルが使う道具を「分までの古い道具」から「秒までの新しい道具」に
**取り替えるだけ**。ネジを 1 本だけ付け替えるくらいの小さな作業です。

データそのもの（サーバーが持っている時刻の中身）は一切いじりません。
あくまで「画面にどう見せるか」だけを揃えます。

---

## Part 2: 技術者向け詳細

### 変更概要

詳細ドロワーの「送信日時」を分精度 `formatJstDateTime` から
秒精度 `formatJstDateTimeWithSeconds` に差し替え、一覧「最終更新」列
（`MembersTable.tsx:163` で既に秒精度採用済み）と書式を統一する。

真因は apps/web 表現層の精度 drift のみ。API/D1/Form は非変更。

### 利用するヘルパー（既存・追加なし）

```ts
// apps/web/src/lib/format/datetime.ts:37
// 例: "2026年6月9日 19:34:19" / 不正値・空文字は元入力を返す（fail-soft・例外なし）
export function formatJstDateTimeWithSeconds(iso: string): string
```

### 変更ポイント

```tsx
// apps/web/src/features/admin/components/_members/MemberDrawer.tsx

// :13 import を秒精度版へ（または併記）
import { formatJstDateTimeWithSeconds } from "../../../../lib/format/datetime";

// :205-209 「送信日時」value
{
  key: "送信日時",
  value: profile.lastSubmittedAt
    ? formatJstDateTimeWithSeconds(profile.lastSubmittedAt)  // was: formatJstDateTime
    : "—",
}
```

> `MemberDrawer.tsx:306` の `a.occurredAt` は本タスクのスコープ外（§9 OOS-1）。
> import を差し替える場合、`:306` がまだ `formatJstDateTime` を使うなら **両 import を残す** か、
> `:306` も同時統一するかを着手時に判断する（後者にする場合はスコープ拡大として明記）。

### エラーハンドリング / エッジケース

| 入力 | 挙動 |
| ---- | ---- |
| 正常 ISO 文字列 | `2026年6月9日 19:34:19` 形式で秒まで表示 |
| 不正な日時文字列 | `formatJstDateTimeWithSeconds` が元入力をそのまま返す（fail-soft） |
| `null` / `undefined` | ドロワー側の三項演算子で従来どおり `—` を表示 |

### 視覚証跡

VISUAL タスク。実装着手時の Phase 11 で
「会員詳細ドロワーの送信日時が秒まで表示されている」screenshot を取得する
（canonical 名例: `member-drawer-submitted-at-seconds.png`）。
本未タスク段階ではコード未実装のため screenshot は未取得。

### 回帰テスト方針（AC-3）

`_members/__tests__/MemberDrawer.identityLabels.spec.tsx`（または同等 spec）に、
`lastSubmittedAt` を与えたとき「送信日時」セルが秒付き（`:` が 2 つ・`年月日`）で
描画されることを assert するケースを追加する。`datetime.spec.ts` の fail-soft ケースは既存を踏襲。
