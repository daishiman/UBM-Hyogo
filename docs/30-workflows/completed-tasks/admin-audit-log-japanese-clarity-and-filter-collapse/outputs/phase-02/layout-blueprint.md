# Phase 2 — layout-blueprint（フィルタ 2 層 + チップ + カード整列）

> 上流: `./main.md`。フィルタ段階開示・適用チップ・カード整列の ASCII レイアウトと token 割当を確定する。

## 1. フィルタフォーム 2 層（段階開示）

### Before（現状・8 項目フラット）

```
┌─ フィルタ ─────────────────────────────────────────────┐
│ [action] [actorEmail] [targetType] [targetId]          │
│ [from (JST)] [to (JST)] [batchId] [limit]              │  ← 8 項目フラット・英語キー名
│                              [検索] [リセット]          │
└────────────────────────────────────────────────────────┘
```

### After（常時 5 + details 3）

```
┌─ 絞り込み ─────────────────────────────────────────────┐
│ [操作の種類 ▾] [実行者（メール）] [期間（開始）]        │  ← 常時表示（よく使う 5 項目）
│ [期間（終了）] [表示件数 ▾]                             │
│                                                        │
│ ▸ 詳細な絞り込み（対象・一括処理ID）   ← <summary>      │  ← details（閉じている場合）
│   ▽ 詳細な絞り込み（対象・一括処理ID）  ← open 時       │
│   ┌──────────────────────────────────────────────┐    │
│   │ [対象の種類 ▾] [対象ID] [一括処理ID]          │    │  ← details body（値があれば open）
│   └──────────────────────────────────────────────┘    │
│                              [検索] [リセット]          │
└────────────────────────────────────────────────────────┘
```

- `<details className="admin-audit-filter-advanced" open={defaultOpen}>` / `<summary>詳細な絞り込み（対象・一括処理ID）</summary>`
- `defaultOpen = Boolean(filters.targetType || filters.targetId || filters.batchId)`
- 全 `FormField` の `label` = `describeAuditField(key)`。`<input name>` / datalist `id` は query param キー（英語）を維持。
- datalist placeholder は日本語例示（例: 操作の種類 = 「例: 出席を追加」）。

### token 割当（フィルタ）

| 要素 | プロパティ | token |
| --- | --- | --- |
| フォーム項目間 gap | `gap` | `var(--ubm-space-3)` |
| 常時行 と details の間隔 | `margin-block` | `var(--ubm-space-4)` |
| `<summary>` テキスト色 | `color` | `var(--ubm-color-text)` |
| `<summary>` フォーカスリング | `outline` | `var(--ubm-color-focus)`（既存 focus token） |
| details body 背景 | `background` | `var(--ubm-color-surface-subtle)`（不在時は `var(--ubm-color-bg)`） |
| details body 角丸 | `border-radius` | `var(--ubm-radius-md)` |

## 2. 適用フィルタチップ行（整列）

### Before（wrap 未指定・はみ出し）

```
[現在の絞り込み条件] action: attendance.add  actor: a@b.com  target type: meeting  batchId: xxxx  ← 1 行に詰めて改行/はみ出し
```

### After（flex-wrap で整列・日本語化）

```
現在の絞り込み条件
┌────────────┐ ┌──────────────┐ ┌────────────┐
│ 操作の種類：│ │ 実行者：     │ │ 対象の種類：│   ← .chip-row { display:flex; flex-wrap:wrap; gap }
│ 出席を追加  │ │ a@b.com      │ │ 開催日      │
└────────────┘ └──────────────┘ └────────────┘
┌──────────────┐                              ← 折り返しで次行へ整列
│ 一括処理ID： │
│ xxxx         │
└──────────────┘
```

- チップ label = `describeAuditField(key)`、value = action なら `describeAuditAction`、targetType なら `describeAuditTargetType`、それ以外は raw（メール・ID 等）。
- 適用フィルタコンテナの `aria-label="現在の絞り込み条件"` を維持（AC-11）。

### token 割当（チップ行）

| 要素 | プロパティ | token |
| --- | --- | --- |
| `.chip-row` レイアウト | `display:flex; flex-wrap:wrap` | — |
| チップ間 gap | `gap` | `var(--ubm-space-2)` |
| チップ背景 | `background` | `var(--ubm-color-surface-subtle)`（不在時 `var(--ubm-color-bg)`） |
| チップ文字 | `color` | `var(--ubm-color-text-muted)` / 値は `var(--ubm-color-text)` |

## 3. 用語集グリッド / カード meta（整列）

### 用語集グリッド `.admin-audit-glossary`

```
Before: grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));  ← 行ごとに高さ/幅不均等
After : minmax を整列が破綻しない値へ調整 + 各行 align-items 揃え（行高さ統一）
```

### カード meta `.admin-audit-card__meta`

```
┌─ 監査ログカード ──────────────────────────────────────┐
│ [出席を追加]  2026-06-11 12:34:56 (JST)               │  ← action 日本語（describeAuditAction）
│ ─────────────────────────────────────────────────────│
│ meta グリッド（minmax 整列・truncate 安全）:          │
│  実行者：a@b.com    対象の種類：開催日                 │  ← targetType 日本語（describeAuditTargetType）
│  ログID：xxxx        一括処理ID：yyyy                  │  ← auditId → 「ログID」（R-4 解消）
└────────────────────────────────────────────────────────┘
```

- `.admin-audit-card__meta` の `minmax(150px, 1fr)` を整列・truncate 安全な構成へ。
- カードの操作見出し = `describeAuditAction(item.action)`、対象種別 = `describeAuditTargetType(item.targetType)`。
- `auditId` ラベル = 「ログID」（日本語）。未登録 action/targetType は raw fallback。

### token 割当（カード）

| 要素 | プロパティ | token |
| --- | --- | --- |
| カード内 meta gap | `gap` | `var(--ubm-space-2)` |
| meta ラベル文字 | `color` | `var(--ubm-color-text-muted)` |
| meta 値文字 | `color` | `var(--ubm-color-text)` |
| カードサーフェス | `background` | `var(--ubm-color-surface)`（既存） |

## 4. レスポンシブ

| breakpoint | フィルタ常時行 | details body | チップ行 | カード meta |
| --- | --- | --- | --- | --- |
| mobile（〜640px） | 1col 縦積み | 1col 縦積み | flex-wrap（自然折り返し） | 1col |
| tablet 以上 | 多 col grid | 多 col grid | flex-wrap | 2col grid |

> 既存 grid utility / `.admin-audit-*` のレスポンシブ挙動を踏襲。新規 breakpoint は導入しない。全色 `var(--ubm-color-*)`・余白 `var(--ubm-space-*)` 経由で HEX ゼロ（AC-8）。

## 5. token 実在確認（Phase 5 着手時）

> 上記 token（`--ubm-color-surface-subtle` 等）は `apps/web/src/styles/tokens.css` の実在を Phase 5 着手時に grep 確認すること。不在 token は近接する実在 token（例: `--ubm-color-bg` / `--ubm-color-surface`）へ置換する。HEX 直書きは禁止（AC-8）。
