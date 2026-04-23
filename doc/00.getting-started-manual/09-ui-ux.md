# UI/UXデザイン方針

## デザイン哲学

Apple HIG の静かな情報設計を軸にする。目的は、**1人のメンバー情報を 3 秒で把握できること**。

---

## デザイン原則

| 原則 | 具体的な実装 |
|------|------------|
| 読みやすさ | 1画面1目的、1セクション1主張 |
| 静けさ | ニュートラルカラー中心、派手な装飾を排除 |
| 情報の強弱 | 名前、肩書き、UBM属性、タグを最上位に置く |
| 一貫性 | ボタン、入力、カード、ドロワーの見た目を統一 |
| 誤操作防止 | 管理操作は独立領域に隔離し、確認付きにする |
| 低認知負荷 | 本人用と管理者用の操作を混在させない |

---

## カラーパレット

```text
背景:        #fcfcf9 / #ffffff
本文:        #161616
補助文字:    #6b6b6b
枠線:        #e7e5e4
面:          #f5f5f4
主ボタン:    bg-stone-900 / text-white
副ボタン:    border-stone-300 / text-stone-700
情報色:      bg-slate-100 / text-slate-700
成功色:      bg-emerald-100 / text-emerald-800
警告色:      bg-amber-100 / text-amber-800
危険色:      bg-rose-100 / text-rose-800
```

---

## タイポグラフィ

| 要素 | フォント | サイズ |
|------|---------|--------|
| ベース | `Geist` + `Noto Sans JP` | - |
| ページタイトル | `font-semibold tracking-tight` | `text-3xl` |
| セクション見出し | `font-semibold` | `text-lg` |
| 本文 | `leading-7 text-[15px]` | - |
| 補助 | `text-sm text-stone-500` | - |

- 日本語は `Noto Sans JP`
- 英数字は `Geist`
- 角丸や余白で上品さを作り、装飾で誤魔化さない

---

## アイコン方針

無料で統一感のある `lucide-react` を使う。アイコンは意味補助に限定し、ラベルなしで機能を伝えない。

| 用途 | アイコン例 |
|------|-----------|
| 検索 | `Search` |
| 絞り込み | `SlidersHorizontal` |
| ユーザー | `UserRound` |
| 地域 | `MapPin` |
| 職業 | `BriefcaseBusiness` |
| タグ | `Tag` |
| 公開切り替え | `Eye` / `EyeOff` |
| 編集 | `PenLine` |
| 保存 | `Check` |
| 削除 | `Trash2` |
| 同期 | `RefreshCw` |
| 差分 | `GitCompareArrows` |

- アイコンは意味補助で使う
- SNS もアイコン単独ではなく、ラベル付きで出す

---

## 採用ライブラリ

```bash
pnpm add lucide-react sonner react-hook-form @hookform/resolvers zod cmdk date-fns clsx tailwind-merge
pnpm add tailwindcss @tailwindcss/typography
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input textarea badge dialog drawer sheet tabs switch checkbox skeleton separator
```

- `shadcn/ui` は free かつカスタマイズしやすいので採用する
- `cmdk` は検索とコマンドパレットに使う
- `sonner` は軽量トーストに使う
- `date-fns` は日付表示の整形に使う
- `clsx` + `tailwind-merge` でクラス結合を安定化する

---

## レイアウト

### コンテナ幅

```text
一覧ページ:  max-w-6xl mx-auto px-4 md:px-6
詳細ページ:  max-w-5xl mx-auto px-4 md:px-6
管理ページ:  max-w-6xl mx-auto px-4 md:px-6
```

### 詳細ページの構成

```text
上部:  Hero 要約
中段:  概要 / ビジネス / つながる / 人となり
右側:  公開状態、UBM属性、タグ、同期状態
下部:  連絡先・SNS・補足情報
```

### 管理画面の構成

```text
/admin/members
  上: 検索と表示状態フィルター
  中: メンバー一覧
  右ドロワー: 個別メンバー操作

/admin/schema
  上: 同期状態
  中: schema diff
  下: 未解決項目と stableKey 割当
```

---

## 1ユーザーのプロフィール画面で重視すること

### 見せ方

- 最上部に名前、肩書き、ひとことを置く
- その下に「何をしている人か」を 2〜3 行でまとめる
- 連絡先は SNS アイコンを並べるだけにせず、テキストラベルを併記する
- 詳細は折りたたまず、縦に読み進められる構成にする

### 情報の順番

1. 名前
2. 肩書き / 職業
3. ひとこと / 自己紹介
4. ビジネス概要
5. つながる手段
6. 人となり
7. タグと補足情報

### 禁止事項

- 管理操作の混在
- 画面上部に細かい表を置くこと
- カラフルなアイコン乱立
- 大きすぎるヒーロー画像

---

## コンポーネント仕様

### ボタン

```text
【プライマリ】
  背景: bg-stone-900
  文字: text-white
  角丸: rounded-xl
  パディング: px-4 py-2.5

【セカンダリ】
  背景: bg-white
  枠線: border border-stone-300
  文字: text-stone-700

【状態トグル】
  高さを十分に確保し、ON/OFF が一目で分かる配色にする
```

### カード

```text
背景: bg-white
枠線: border border-stone-200
角丸: rounded-2xl
パディング: p-5 md:p-6
影: shadow-[0_1px_2px_rgba(0,0,0,0.04)]
```

### 入力

- 1 行入力は 44px 以上の高さを確保する
- 必須項目はラベル側で明示する
- エラーはフォーム下に 1 行で出す

---

## アクセシビリティ

1. キーボードで全操作ができること
2. コントラスト比を落としすぎないこと
3. スクリーンリーダー向けのラベルを必ず付けること
4. モバイルでも 1 列で崩れず読めること
5. 44px 未満のタップ領域を作らないこと

---

## 実装メモ

- ローディングは `skeleton` と軽いフェードで見せる
- 成功/失敗は `sonner` で短く通知する
- 管理操作は `dialog` / `drawer` / `sheet` で分ける
- 検索は `cmdk` ベースの即時絞り込みにする
