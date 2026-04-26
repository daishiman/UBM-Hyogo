# UI/UXデザイン方針

## 位置づけ

- 正式な UI 方針は `claude-design-prototype/` に合わせる
- `gas-prototype/` は画面叩き台として参照するが、認証・保存・同期の振る舞いは正本にしない
- 目的は、公開ユーザーには「誰がいるか」が分かり、会員には「自分の掲載状態」が分かり、管理者には「何を処理すべきか」が分かること
- 実装先は `apps/web` の画面群で、`apps/api` は状態更新と同期の裏側を担う

---

## 情報設計の基本原則

| 原則 | 方針 |
|------|------|
| 3レイヤ分離 | 公開、会員、管理で役割と操作を混在させない |
| 3秒理解 | 氏名、職業、UBM区画、参加ステータス、主タグを先頭で把握できるようにする |
| 最小操作 | 一覧は検索と絞り込み、会員は確認と更新導線、管理はレビューと承認に絞る |
| 明確な可視性 | `公開 / 会員限定 / 管理用` の区分を画面上で説明する |
| 更新導線の一貫性 | 本人更新は Google Form 再回答、管理更新は管理画面、フォーム構造変更は schema review に集約する |

---

## レイヤ別 UX

### 公開

- ランディングは `Hero / 統計カード / UBM区画説明 / 最近の支部会 / FAQ / 会員導線` の順で構成する
- 一覧はカードとリストの両方を許容し、`density` で切り替える
- 詳細は営業資料化しすぎず、プロフィールとして読みやすい縦導線を優先する

### 会員

- マイページでは自分の公開状態、公開範囲、現在の掲載内容、更新導線を一画面で確認できるようにする
- 更新操作はモーダルで再確認してから Google Form に遷移させる
- 会員画面に他人を管理する UI を置かない

### 管理

- 管理トップは KPI と未処理タスクの可視化を優先する
- メンバー管理は `テーブル/一覧 + ドロワー`
- タグ割当は `左キュー + 右レビュー`
- スキーマ差分は `差分一覧 + stableKey 割当`
- 開催日管理は `開催日追加 + 参加履歴更新`

---

## 一覧 UX

### 検索コントロール

- `q`: キーワード検索
- `zone`: UBM区画
- `status`: 参加ステータス
- `tag`: タグ複数選択
- `sort`: `最近の更新順 / 名前順`
- `density`: `ゆったり / 密 / リスト`

### 一覧カード

- 必須表示は `氏名 / 職業 / 所在地 / UBM区画 / 参加ステータス / 主タグ`
- `businessOverview` はカードでは2行程度に抑える
- 密度が高い表示では補助情報を減らし、クリックで詳細へ送る

### 空状態

- 条件に合うメンバーがいないことを明示する
- `絞り込みをクリア` を必ず出す

---

## 詳細 UX

### 公開詳細

- 先頭 Hero に `氏名 / ニックネーム / 職業 / UBM区画 / 参加ステータス / 所在地` を置く
- 本文は `ビジネス概要 / スキル / 提供できること / 人となり / 連絡先` の順で配置する
- SNS はアイコンのみで済ませず、ラベルか URL を併記する

### マイページ

- 先頭に `公開状態バナー` を置く
- 続けて `公開 / 会員限定 / 管理用` の件数サマリを置く
- 回答内容はセクションごとに読み直せるように一覧化する
- `情報を更新する` は Google Form 再回答モーダルを経由する

---

## 管理 UX

### 管理ダッシュボード

- KPI カードで `全会員 / 公開中 / 未タグ / スキーマ課題` を表示する
- 区画分布、参加ステータス分布、最近の開催日を同画面に置く
- `メンバー管理 / タグ割当 / スキーマ差分 / 開催日管理` へショートカットする

### メンバー管理

- 一覧では `氏名 / メール / 区画 / ステータス / タグ / 最終更新 / 公開状態` を出す
- 詳細操作は右ドロワーに寄せる
- 本人本文の直接編集 UI は出さない

### タグ割当

- 主目的は `未タグ会員の処理`
- 左側にキュー、右側に会員要約とタグ選択を配置する
- タグ辞書やルール設定の編集画面にはしない

### スキーマ差分

- `unresolved` を最優先で目立たせる
- `stableKey 未割当` をその場で解消できる UI にする

### 開催日/参加履歴

- 開催日の追加は単純なフォームで行う
- 参加履歴は会員軸でも開催日軸でも確認しやすくする

---

## コンポーネント方針

### ページ構成コンポーネント（ページ固有）

| コンポーネント | 用途 |
|-------------|------|
| `Hero` | ランディングと詳細の要約表示 |
| `StatCard` | 件数や同期状態の即時把握 |
| `FilterBar` | `q / zone / status / tag / sort / density` の集約操作 |
| `MemberCard` | 一覧用の公開プロフィール要約 |
| `ProfileHero` | 詳細とマイページの冒頭要約 |
| `VisibilitySummary` | 公開範囲の件数サマリ |
| `QueuePanel` | 未タグ会員や未解決差分の処理順提示 |
| `Timeline` | 最近の支部会の表示 |
| `SyncBadge` | Forms 同期状態やレビュー必要状態の表示 |

### UIプリミティブ（`primitives.jsx` 由来、共通基盤）

実装先: `apps/web/src/components/ui/`

| プリミティブ | props（主要） | 用途 |
|------------|--------------|------|
| `Chip` | `tone`, `outline`, `children` | ゾーン・ステータス・タグのバッジ表示。`tone` は `zoneTone()` / `statusTone()` ヘルパーから生成する |
| `Avatar` | `memberId`, `name`, `size`, `photoUrl`, `editable` | アバター画像。MVP は表示専用。`editable=true` は将来の管理者向けアップロード API 用で、ローカル保存はしない |
| `Button` | `variant`, `size`, `icon`, `iconRight`, `as` | variant: `primary / accent / ghost / soft / danger`。`as` で `<a>` 等に変形できる |
| `Switch` | `checked`, `onChange`, `label` | 公開/非公開トグルに使用する |
| `Segmented` | `options`, `value`, `onChange` | density 切替（ゆったり/密/リスト）など排他選択に使用する |
| `Field` | `label`, `required`, `hint`, `error`, `children` | フォームフィールドのラッパー。バリデーションエラー表示を含む |
| `Input` | `...HTMLInputProps` | `<Field>` 内で使うテキスト入力 |
| `Textarea` | `...HTMLTextareaProps` | `<Field>` 内で使う複数行入力 |
| `Select` | `options`, `...HTMLSelectProps` | `<Field>` 内で使うセレクトボックス |
| `Search` | `value`, `onChange`, `placeholder` | 検索バー。虫眼鏡アイコン付き |
| `Drawer` | `open`, `onClose`, `title`, `children` | 右サイドパネル。Escape キーで閉じる。管理画面のメンバー詳細操作に使う |
| `Modal` | `open`, `onClose`, `title`, `children` | 中央ダイアログ。破壊的操作の確認・Google Form 再回答の案内に使う |
| `Toast` | `useToast()` hook 経由 | API 成功/失敗の通知。`ToastProvider` をアプリルートに配置する |
| `KVList` | `items: { label, value }[]` | プロフィールの回答内容を key-value 形式で表示する |
| `LinkPills` | `links: { label, url, icon }[]` | SNS・連絡先リンクをアイコン付きピルで表示する |

### カラーヘルパー

```ts
zoneTone(zone: string): ChipTone   // UBM区画 → Chip color
statusTone(status: string): ChipTone  // 参加ステータス → Chip color
```

`ChipTone`: `"stone" | "warm" | "cool" | "green" | "amber" | "red"`

---

## 不採用と注意事項

- `/no-access` の独立画面は採用しない
- `/profile/edit` の独立編集画面は採用しない
- `gas-prototype/` の `localStorage` 保存や認証なし動作は本番仕様に持ち込まない
- プロトタイプの `theme / nav / detailLayout` 切替はデモ検証用であり、正式ユーザー機能要件ではない

---

## 実装時の UI 移植基準

prototype の視覚品質を正式 UI の下限とする。ただし、本番では次を守る。

1. URL、session、server data を UI state より優先する
2. 操作成功 toast は API 成功後にだけ出す
3. 破壊的操作は Dialog で確認する
4. 一覧や toolbar は mobile で横はみ出ししない
5. 管理画面は情報密度を高くし、landing の装飾表現を持ち込まない
6. public / member / admin で同じ情報を表示する場合も visibility に応じて field を削る

### 画面検証

実装後は最低限、次を Playwright で確認する。

| 画面 | viewport | 確認 |
|------|----------|------|
| `/` | desktop / mobile | Hero、統計、CTA、最近の支部会が重ならない |
| `/members` | desktop / mobile | filter、density、empty state が機能する |
| `/members/[id]` | desktop / mobile | public field だけ表示される |
| `/login` | desktop / mobile | input/sent/gate state が崩れない |
| `/profile` | desktop / mobile | visibility summary と更新導線が見える |
| `/admin` | desktop | KPI と未処理 alert が見える |
| `/admin/members` | desktop | drawer と公開 switch が動く |
| `/admin/tags` | desktop | queue と review panel が並ぶ |
| `/admin/schema` | desktop | unresolved item と stableKey 操作が見える |
| `/admin/meetings` | desktop | 開催日追加と参加付与/解除ができる |
