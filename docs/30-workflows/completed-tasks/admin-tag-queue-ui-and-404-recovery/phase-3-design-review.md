# Phase 3: Design Review — 変更ファイル俯瞰

## 変更対象ファイル一覧

| パス | 種別 | 主担当タスク | 変更概要 |
|------|------|--------------|---------|
| `apps/web/app/(admin)/admin/tags/page.tsx` | edit | task-A / task-B | `safeServerFetch` のエラーハンドリングは維持、`Breadcrumb` を `PageHead` に置換、`focusMemberId` 受け渡しは維持 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | edit | task-B | 大改修: page-head 削除（page.tsx に移譲）／ grid-2 ／ Card / Avatar / Chip / sticky 右ペイン ／ TAGGED 補足セクション |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | edit | task-B | 既存 8 ケース + 「sticky 構造 / Avatar role / TAGGED セクション表示」3 ケース追加 |
| `apps/web/src/components/admin/AdminSectionErrorClient.tsx`（または既存 `_shared`） | edit | task-A | `code` ごとの復旧ヒント文を分岐 |
| `apps/web/src/features/admin/components/_shared/index.ts` 等 export 経路 | edit | task-A | 変更があれば export を維持 |
| `apps/web/src/lib/admin/server-fetch.ts` | edit | task-A | 404 path で dev/staging に `console.warn` debug log を追加（host のみ、credentials なし） |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts` | new | task-C | staging 用 visual smoke 2 screen |
| `outputs/phase-11/admin-tags-empty.png` | new (evidence) | task-C | Playwright で生成 |
| `outputs/phase-11/admin-tags-items.png` | new (evidence) | task-C | Playwright で生成 |
| `outputs/phase-11/manual-test-result.md` | new | task-C | 実行ログ |
| `outputs/phase-12/implementation-guide.md` | new | task-A / B / C | PR 本文の元 |
| `apps/api/src/middleware/require-admin.ts` | (optional) | task-A | 不要なら触らない。touch する場合は 401/403 のレスポンス body に `reason: "no-token" / "verify-failed" / "not-admin"` を**任意追加**するのみ（既存 spec を壊さない範囲） |

## 既存 primitive の存在確認（実装着手前 grep 手順）

実装エージェントは以下を最初に実行し、ファイル存在を確認する:

```bash
ls apps/web/src/components/ui/Chip.tsx \
   apps/web/src/components/ui/Avatar.tsx \
   apps/web/src/components/ui/EmptyState.tsx \
   apps/web/src/components/ui/Icon.tsx \
   apps/web/src/components/ui/Card.tsx \
   apps/web/src/components/admin/PageHead.tsx 2>/dev/null

grep -rn "page-head\|h-page\|eyebrow\|grid-2\|card-pad-lg" apps/web/src/components/admin/ apps/web/src/styles/ | head -20
```

不足する primitive は **inline で最小実装**し、新規 primitive ファイルは作らない（不変条件: 既存 primitives 群を使用）。

## トークンの正本

- `apps/web/src/styles/tokens.css` の `--accent` / `--warn` / `--ok` / `--text-2` / `--text-3` のみ使用
- 既存 admin pages（`/admin/dashboard` 等）で使われている class 命名規約を踏襲

## 1 PR サイクル成立の根拠（CONST_007）

- task-A: server-fetch / page.tsx の error 分岐拡張 — 1 ファイル + spec 追加
- task-B: TagQueuePanel + page.tsx の DOM 構造刷新 — 2 ファイル + spec 追加
- task-C: visual spec 新規 + evidence 取得 — 1 ファイル + 2 PNG

合計 5 source 変更 + spec/visual 追加。**1 PR で完遂可能**。先送り対象なし。

## DoD（Phase 3 完了条件）

- 変更ファイル一覧が path 単位で確定している
- 不変条件 #1〜#6 と矛盾しない
- task-A / B / C の責任分離が明示されている
