# 09d. アイコンカタログ

## 0. 概要

- prototype 由来の自前アイコン（`icons.jsx`）は Lucide スタイルを模した `<svg viewBox="0 0 24 24">` ベースの 51 種類。
- 実装方針: **lucide-react を採用**（task-10 決定済）。prototype 由来の独自名 → lucide-react エクスポート名へマッピングして利用する。
- 自前 SVG（lucide にないブランド固有アイコン等）は `apps/web/src/components/icons/` に配置する。
- 共通属性（prototype 既定）:
  - `viewBox="0 0 24 24"`
  - `fill="none"` / `stroke="currentColor"`
  - `stroke-width="1.75"` / `stroke-linecap="round"` / `stroke-linejoin="round"`
  - `aria-hidden="true"`（装飾用途）

## 1. アイコン一覧（表）

| prototype name | 用途 | lucide 対応 | size 既定 | stroke | viewBox | SVG path 全文 |
|---|---|---|---|---|---|---|
| `dot` | 区切り・状態点 | `Circle`（小） | sm(16) | 1.75 | 0 0 24 24 | `<circle cx="12" cy="12" r="2" />` |
| `home` | ホーム / トップ | `Home` | md(20) | 1.75 | 0 0 24 24 | `<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>` |
| `users` | 会員一覧・グループ | `Users` | md(20) | 1.75 | 0 0 24 24 | `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` |
| `user` | 単一ユーザー | `User` | md(20) | 1.75 | 0 0 24 24 | `<path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="8" r="5"/>` |
| `search` | 検索 | `Search` | md(20) | 1.75 | 0 0 24 24 | `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>` |
| `filter` | フィルタ | `Filter` | md(20) | 1.75 | 0 0 24 24 | `<path d="M3 6h18M6 12h12M10 18h4"/>` |
| `sliders` | 詳細フィルタ・調整 | `SlidersHorizontal` | md(20) | 1.75 | 0 0 24 24 | `<path d="M4 6h10"/><path d="M18 6h2"/><path d="M4 12h4"/><path d="M12 12h8"/><path d="M4 18h14"/><path d="M22 18h-4"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="20" cy="18" r="2"/>` |
| `shield` | 権限・管理者 | `Shield` | md(20) | 1.75 | 0 0 24 24 | `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>` |
| `calendar` | 日付・イベント | `Calendar` | md(20) | 1.75 | 0 0 24 24 | `<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>` |
| `settings` | 設定 | `Settings` | md(20) | 1.75 | 0 0 24 24 | `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>` |
| `eye` | 表示 / 公開 | `Eye` | md(20) | 1.75 | 0 0 24 24 | `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>` |
| `eyeOff` | 非表示 / 非公開 | `EyeOff` | md(20) | 1.75 | 0 0 24 24 | `<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a14.1 14.1 0 0 1-1.9 2.7"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>` |
| `edit` | 編集 | `Pencil` / `SquarePen` | md(20) | 1.75 | 0 0 24 24 | `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>` |
| `plus` | 追加 | `Plus` | md(20) | 1.75 | 0 0 24 24 | `<path d="M12 5v14M5 12h14"/>` |
| `check` | 完了・チェック | `Check` | md(20) | 1.75 | 0 0 24 24 | `<path d="M20 6L9 17l-5-5"/>` |
| `x` | 閉じる・削除 | `X` | md(20) | 1.75 | 0 0 24 24 | `<path d="M18 6L6 18M6 6l12 12"/>` |
| `external` | 外部リンク | `ExternalLink` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>` |
| `tag` | タグ | `Tag` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M20 13.5 12.5 21a2 2 0 0 1-2.8 0L3 14.3a2 2 0 0 1 0-2.8L10.5 4H17l3 3v6.5Z"/><circle cx="9" cy="9" r="1.5"/>` |
| `database` | DB / データ | `Database` | md(20) | 1.75 | 0 0 24 24 | `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>` |
| `refresh` | 更新 / 再読込 | `RefreshCw` | md(20) | 1.75 | 0 0 24 24 | `<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M8 16H3v5"/>` |
| `gitCompare` | 差分比較 | `GitCompare` | md(20) | 1.75 | 0 0 24 24 | `<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 6h5a2 2 0 0 1 2 2v8"/><path d="M12 18H7a2 2 0 0 1-2-2V8"/><path d="M15 9l-3-3 3-3"/><path d="M9 15l3 3-3 3"/>` |
| `bell` | 通知 | `Bell` | md(20) | 1.75 | 0 0 24 24 | `<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>` |
| `mapPin` | 所在地・地図 | `MapPin` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>` |
| `briefcase` | 職業・会社 | `Briefcase` | sm(16) | 1.75 | 0 0 24 24 | `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>` |
| `sparkle` | 強調 / NEW | `Sparkles` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M5 3v4M3 5h4"/><path d="M19 17v4M17 19h4"/>` |
| `arrowRight` | 進む | `ArrowRight` | md(20) | 1.75 | 0 0 24 24 | `<path d="M5 12h14M13 5l7 7-7 7"/>` |
| `arrowLeft` | 戻る | `ArrowLeft` | md(20) | 1.75 | 0 0 24 24 | `<path d="M19 12H5M12 19l-7-7 7-7"/>` |
| `chevronRight` | パンくず・展開 | `ChevronRight` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M9 18l6-6-6-6"/>` |
| `chevronDown` | アコーディオン展開 | `ChevronDown` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M6 9l6 6 6-6"/>` |
| `logOut` | サインアウト | `LogOut` | md(20) | 1.75 | 0 0 24 24 | `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>` |
| `link` | リンク共有 | `Link` / `Link2` | sm(16) | 1.75 | 0 0 24 24 | `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>` |
| `heart` | お気に入り | `Heart` | md(20) | 1.75 | 0 0 24 24 | `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>` |
| `mail` | メール | `Mail` | md(20) | 1.75 | 0 0 24 24 | `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>` |
| `google` | Google OAuth ボタン | （ブランドロゴ・自前 SVG として保持） | md(20) | 1.75 | 0 0 24 24 | `<path d="M21.35 11.1H12v3.2h5.35c-.45 2.2-2.45 3.8-5.35 3.8a6 6 0 1 1 0-12c1.57 0 2.95.56 4.05 1.46l2.42-2.42A9.5 9.5 0 0 0 12 2.5a9.5 9.5 0 0 0 0 19c5.5 0 9.5-3.85 9.5-9.5 0-.65-.05-1.25-.15-1.9z" fill="currentColor" stroke="none"/>` |
| `alertTriangle` | 警告 (Banner warning) | `AlertTriangle` | md(20) | 1.75 | 0 0 24 24 | `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h0"/>` |
| `info` | 情報 (Banner info) | `Info` | md(20) | 1.75 | 0 0 24 24 | `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h0"/>` |
| `checkCircle` | 成功 (Banner success) | `CheckCircle` / `CircleCheck` | md(20) | 1.75 | 0 0 24 24 | `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>` |
| `trash` | 削除 | `Trash2` | md(20) | 1.75 | 0 0 24 24 | `<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>` |
| `send` | 送信 | `Send` | md(20) | 1.75 | 0 0 24 24 | `<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>` |
| `key` | 認証鍵 / Magic Link | `Key` | md(20) | 1.75 | 0 0 24 24 | `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>` |
| `layers` | レイヤ / セクション | `Layers` | md(20) | 1.75 | 0 0 24 24 | `<path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>` |
| `bookmark` | ブックマーク | `Bookmark` | md(20) | 1.75 | 0 0 24 24 | `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>` |
| `moreH` | 補助メニュー | `MoreHorizontal` | sm(16) | 1.75 | 0 0 24 24 | `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>` |
| `clock` | 時刻 / 履歴 | `Clock` | sm(16) | 1.75 | 0 0 24 24 | `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>` |
| `inbox` | 受信箱 | `Inbox` | md(20) | 1.75 | 0 0 24 24 | `<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>` |
| `activity` | アクティビティ | `Activity` | md(20) | 1.75 | 0 0 24 24 | `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>` |
| `barChart` | グラフ / 統計 | `BarChart3` | md(20) | 1.75 | 0 0 24 24 | `<path d="M12 20V10M18 20V4M6 20v-6"/>` |
| `upload` | アップロード | `Upload` | md(20) | 1.75 | 0 0 24 24 | `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>` |
| `copy` | コピー | `Copy` | sm(16) | 1.75 | 0 0 24 24 | `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>` |
| `undo` | 取り消し | `Undo2` | md(20) | 1.75 | 0 0 24 24 | `<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>` |
| `camera` | 写真撮影 | `Camera` | md(20) | 1.75 | 0 0 24 24 | `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>` |
| `image` | 画像プレビュー | `Image` / `ImageIcon` | md(20) | 1.75 | 0 0 24 24 | `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>` |

## 2. アイコンサイズ規約

| トークン | px | 主な利用箇所 |
|---|---|---|
| `xs` | 12 | inline 補助記号、tag chip 内 |
| `sm` | 16 | Button leftIcon (size=sm/md)、表セル inline |
| `md` | 20 | Sidebar nav-item、Banner tone-icon、Card header |
| `lg` | 24 | Page header、Empty state |
| `xl` | 32 | Hero / 大型 Empty state / Onboarding |

stroke-width 既定値は CSS 変数で定義する（prototype 値 `1.75` を維持）:

```css
:root {
  --icon-stroke: 1.75;
  --icon-size-xs: 12px;
  --icon-size-sm: 16px;
  --icon-size-md: 20px;
  --icon-size-lg: 24px;
  --icon-size-xl: 32px;
}
```

lucide-react は `strokeWidth` prop で上書きできるため、共通ラッパーで `strokeWidth={1.75}` を既定にする。

## 3. lucide マッピング（prototype name → lucide 名）

| prototype | lucide-react import |
|---|---|
| `dot` | `Circle`（`size`を小さく / または自前 `Dot`） |
| `home` | `Home` |
| `users` | `Users` |
| `user` | `User` |
| `search` | `Search` |
| `filter` | `Filter` |
| `sliders` | `SlidersHorizontal` |
| `shield` | `Shield` |
| `calendar` | `Calendar` |
| `settings` | `Settings` |
| `eye` / `eyeOff` | `Eye` / `EyeOff` |
| `edit` | `Pencil`（または `SquarePen`） |
| `plus` / `check` / `x` | `Plus` / `Check` / `X` |
| `external` | `ExternalLink` |
| `tag` | `Tag` |
| `database` | `Database` |
| `refresh` | `RefreshCw` |
| `gitCompare` | `GitCompare` |
| `bell` | `Bell` |
| `mapPin` | `MapPin` |
| `briefcase` | `Briefcase` |
| `sparkle` | `Sparkles` |
| `arrowRight` / `arrowLeft` | `ArrowRight` / `ArrowLeft` |
| `chevronRight` / `chevronDown` | `ChevronRight` / `ChevronDown` |
| `logOut` | `LogOut` |
| `link` | `Link`（または `Link2`） |
| `heart` | `Heart` |
| `mail` | `Mail` |
| `alertTriangle` | `AlertTriangle` |
| `info` | `Info` |
| `checkCircle` | `CheckCircle`（v0.300+ は `CircleCheck`） |
| `trash` | `Trash2` |
| `send` | `Send` |
| `key` | `Key` |
| `layers` | `Layers` |
| `bookmark` | `Bookmark` |
| `moreH` | `MoreHorizontal` |
| `clock` | `Clock` |
| `inbox` | `Inbox` |
| `activity` | `Activity` |
| `barChart` | `BarChart3` |
| `upload` | `Upload` |
| `copy` | `Copy` |
| `undo` | `Undo2` |
| `camera` | `Camera` |
| `image` | `Image`（衝突回避のため `ImageIcon` で別名 import 推奨） |

## 4. 自前で残す SVG（lucide にない / ブランド固有）

### `google`（Google ブランドロゴ）

ブランドガイドラインの遵守と OAuth ボタンでの一貫性のため、lucide には対応がなく自前で保持する。配置先: `apps/web/src/components/icons/GoogleIcon.tsx`。

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M21.35 11.1H12v3.2h5.35c-.45 2.2-2.45 3.8-5.35 3.8a6 6 0 1 1 0-12c1.57 0 2.95.56 4.05 1.46l2.42-2.42A9.5 9.5 0 0 0 12 2.5a9.5 9.5 0 0 0 0 19c5.5 0 9.5-3.85 9.5-9.5 0-.65-.05-1.25-.15-1.9z" fill="currentColor"/>
</svg>
```

> 厳密な Google ブランド準拠（フルカラー版）が必要な OAuth 公式ボタンでは、Google の Identity ガイドラインに基づくマルチカラー SVG への差し替えを別途検討する。

その他、現時点で UBM 兵庫支部会のロゴ等のブランド固有アイコンは prototype 内に存在しない（必要になった時点で本セクションへ追加）。

## 5. 使用ガイド

### primitive ごとの推奨

| primitive | 用途 | 既定サイズ |
|---|---|---|
| `Button.leftIcon` / `rightIcon` | アクション補強 | sm(16) / size=lg のとき md(20) |
| `Sidebar nav-item` | ナビゲーション | md(20) |
| `Banner tone-icon` | tone=info → `info` / success → `checkCircle` / warning → `alertTriangle` / error → `x` または `alertTriangle` | md(20) |
| `Card header` | セクション識別 | md(20) |
| `Tag / Chip` | 補助記号（先頭） | xs(12) |
| `EmptyState` | 視覚的フォーカス | xl(32) |
| `Page header` | ページ名横 | lg(24) |

### a11y

- 装飾用途（テキストラベルが隣接する場合）: `aria-hidden="true"` を付与し、スクリーンリーダーから隠す（prototype 既定どおり）。
- 意味あるアイコン単体ボタン（例: 検索アイコンのみのボタン）: 親要素に `aria-label`（例: `aria-label="検索"`）を付与する。lucide-react の `<Icon />` 自体には付与しない（`aria-hidden` のまま）。
- 色だけで意味を伝えない: Banner では tone color と icon の二重符号化を必須とする。

### 実装スニペット

```tsx
import { Search, AlertTriangle } from 'lucide-react';

<button aria-label="検索"><Search size={20} strokeWidth={1.75} aria-hidden /></button>

<Banner tone="warning">
  <AlertTriangle size={20} strokeWidth={1.75} aria-hidden />
  <span>未保存の変更があります</span>
</Banner>
```

## 6. prototype 出典

- ファイル: `docs/00-getting-started-manual/claude-design-prototype/icons.jsx`
- 行範囲:
  - L1–L22: `Icon` コンポーネント定義（共通 svg 属性の正本）
  - L24–L77: `ICONS` マップ（51 種類の SVG path 定義）
  - L79: `window.Icon = Icon;`（prototype のグローバル登録）
- 採用方針: 上記 SVG path 群は本仕様で網羅引用済み。本番実装では lucide-react を主、自前 SVG（`google`）を従として `apps/web/src/components/icons/` に配置する。
