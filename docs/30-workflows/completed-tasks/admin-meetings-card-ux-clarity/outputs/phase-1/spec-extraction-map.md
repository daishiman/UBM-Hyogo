# Phase 1: spec-extraction-map

aiworkflow-requirements 正本と current code anchor の対応を固定する。

## route / state / view owner

| 系統 | owner | anchor（current code） | 本タスクでの扱い |
|---|---|---|---|
| route 定義（一覧/作成/更新/削除） | apps/api | `apps/api/src/routes/admin/meetings.ts` | **不変** |
| route 定義（出席追加/一括/削除） | apps/api | `apps/api/src/routes/admin/attendance.ts` | **不変** |
| page entry（SSR fetch） | apps/web | `apps/web/app/(admin)/admin/meetings/page.tsx` | 不変（fetch/hydration） |
| client state owner | apps/web | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`（`meetings` / `attended` / `selectedId` / `toast`） | 不変 |
| view: 一覧カード | apps/web | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | **F3 改修**（CSS class + wrapper） |
| view: 展開編集 | apps/web | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | **F2 改修**（section 化 + 行 chrome） |
| view: 一括追加 | apps/web | `BulkAttendanceChecklist.tsx` / `BulkAttendanceModal.tsx` | 不変（既存 `.bulk-attendance*` style 流用） |
| view: 作成フォーム | apps/web | `MeetingCreateForm.tsx` | 不変 |
| style 正本 | apps/web | `apps/web/src/styles/globals.css` / `tokens.css` | **F1 改修**（globals.css のみ。tokens.css 不変） |

## 表示 → 描画の lineage（真因の所在）

```
MeetingTimeline (ul.admin-timeline)            ← CSS 実体なし（gap-2 のみ）
  └ li.admin-timeline__row
      └ article.ui-card.ui-card--flat          ← .ui-card--flat 修飾 CSS なし
          ├ button.admin-timeline__heading     ← CSS 実体なし（素の button）
          │   ├ span.admin-timeline__date      ← CSS 実体なし
          │   ├ span.admin-timeline__title     ← CSS 実体なし
          │   └ span.ui-badge[data-attendance-level]  ← CSS あり（唯一）
          ├ p.admin-timeline__note             ← CSS 実体なし
          └ (selected 時) MeetingAttendanceDrawer
                └ div.admin-meeting-drawer      ← CSS 実体なし（flex gap-3 のみ）
                    ├ details > summary 編集     ← section 境界なし
                    ├ div[role=group] 出席追加    ← 見出しなし
                    ├ section.bulk-attendance    ← CSS あり
                    └ div 出席者 (ul li flex)     ← 行 chrome なし
```

→ CSS 実体が無い 7 BEM クラス + `.ui-card--flat` が「見にくさ」の SSOT 原因。F1 で実体化し、F2 で section 境界と行 chrome を与える。

## token 対応（新規追加なし・既存参照のみ）

| 用途 | 既存 token |
|---|---|
| カード境界 | `--ubm-color-border-default`（定義済）/ `--ubm-color-border-strong`（強調時） |
| 背景 | `--ubm-color-surface-panel` / `--ubm-color-surface-panel-2` / `--ubm-color-surface-bg` |
| 余白 | `--ubm-space-1`〜`--ubm-space-4` |
| 角丸 | `--ubm-radius-sm`（8px） |
| 影 | `--ubm-shadow-xs`（flat では none） |
| 文字 | `--ubm-color-text-secondary` / `--ubm-color-text-muted` / `--ubm-text-sm` |

新規 token / 新規 HEX は導入しない（AC-7）。
