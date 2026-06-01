# Phase 2: スコープ定義（設計書）

## 1. スコープ内（4 タスク横断）

| Area | 含む変更 | 関連タスク |
|------|---------|-----------|
| apps/web admin UI | sync-status ページへの操作パネル追加（backfill / manual resync） | A, B |
| apps/web public/member UI | `/members`・`/profile` の反映タイミング表示 | C |
| apps/web shell nav | 外部リンク対応 + Form 回答一覧リンク + icon | D |
| apps/web 定数 | `constants/form.ts` への編集 URL 定数追加 | D |
| apps/api | （必要時のみ）最終同期時刻を返す read endpoint の最小拡張。既存 `forms-pipeline` snapshot に `lastSyncAt` が含まれない場合のみ | C |
| docs/specs | 反映フロー時系列 + SLA 追記 | C |
| tests | 各タスクの vitest（component / route contract）追加 | A, B, C, D |

## 2. スコープ外（明確に除外）

| 除外項目 | 理由 |
|---------|------|
| 新規 D1 migration | 既存 `member_status` / `sync_jobs` で充足（不変条件・AC-G2） |
| Google Form schema 変更 | 不変条件 #1 / #6 |
| cron 間隔変更 | free-tier 3 cron 制約（既存）。反映時間は「説明」で対応（C） |
| production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` の実切替 | 運用判断・user-gated（Phase 13） |
| backfill / sync / diagnostics endpoint の新規実装 | **すでに実装済み**。UI 導線のみ追加 |
| 認証・認可基盤の変更 | 既存 `requireSyncAdmin` / admin guard を踏襲 |

## 3. 不変条件（タスク共通制約）

| # | 制約 | 出典 |
|---|------|------|
| INV-1 | D1 直接アクセスは `apps/api` に閉じる | CLAUDE.md #5 |
| INV-2 | admin form input は `FormField` 経由（直接 `<input>` を増やさない） | CLAUDE.md #9 |
| INV-3 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | CLAUDE.md #10 |
| INV-4 | 色は OKLch トークン正本。HEX 直書き / `bg-[#xxx]` 禁止 | CLAUDE.md UI #2 |
| INV-5 | 外部リンクは `target="_blank" rel="noopener noreferrer"` | 既存 `RegisterCallout.tsx` パターン / 不変条件 #7 |
| INV-6 | Google Form URL は `constants/form.ts` 経由（hardcode 禁止） | 既存 `FORM_RESPONDER_URL` パターン |
| INV-7 | 新規 test は `*.spec.{ts,tsx}` のみ | CLAUDE.md #8 |
| INV-8 | consent キーは `publicConsent` / `rulesConsent` に統一 | CLAUDE.md #2 |

## 4. 依存関係

```
Task A ─┐
Task B ─┼─ admin/sync-status/page.tsx を共有（別パネルコンポーネントで分離）
Task C ── /members・/profile・specs（A/B から独立）
Task D ── shell nav + constants + icon（完全独立）
```

- A と B は同一ページに UI を足すため、**パネルを別ファイルへ分離**して並列実装時の競合を避ける。
- C/D は A/B と独立し並列実装可能。
