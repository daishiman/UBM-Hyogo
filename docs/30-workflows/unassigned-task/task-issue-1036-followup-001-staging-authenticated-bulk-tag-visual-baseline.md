# Issue #1036 follow-up 001: staging authenticated bulk tag visual baseline

## メタ情報

```yaml
issue_number: 1077
task_id: task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline
task_name: Issue #1036 bulk tag UI の staging 認証付き visual baseline 取得
category: 改善
target_feature: apps/web /admin/members BulkActionBar tag bulk UI
priority: 中
scale: 小規模
status: 未実施
source_phase: issue-1036-bulk-member-tag-assign Phase 11/12 user-gated visual evidence
created_date: 2026-06-01
dependencies: [issue-1036-bulk-member-tag-assign]
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 実装ガイド | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md` |
| 分類 | follow-up / visual evidence |
| 優先度 | 中 |
| 規模 | 小規模 |

## 1. 概要

Issue #1036 では local fixture による `BulkActionBar` tag bulk UI の 4 baseline は取得済みだが、staging 認証付き `/admin/members` 実機 baseline は user-gated として残っている。本タスクは staging 環境で admin 認証を通した実 UI を開き、同じ canonical 4 状態の screenshot を保存して、`implemented_local_runtime_pending` を runtime visual evidence captured へ進める。

## 2. 目的

- `/admin/members` 実機 UI で tag picker / assign-unassign toggle / result summary が local fixture と同等に表示されることを証明する。
- staging の Auth.js cookie / Cloudflare Workers runtime / 実 D1 read endpoint 経由でも UI が破綻しないことを確認する。
- Phase 11 の canonical 名と screenshot metadata の drift を防ぐ。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | staging `/admin/members` で複数 member 選択後に tag picker が表示される |
| AC-2 | `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png` を実機 UI から取得して保存する |
| AC-3 | `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png` 相当の結果表示を staging で取得する |
| AC-4 | screenshot path / canonical 名が Phase 11 / implementation-guide / artifacts ledger と一致する |
| AC-5 | 実行ログに admin 認証、対象 URL、capture command、保存先を残す |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-060807-wt-11/apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts`
- 症状: 現行 screenshot は `page.setContent()` の local fixture で UI 状態を再現しており、staging の Auth.js session、Cloudflare Workers runtime、`GET /admin/tags` 実レスポンス、実 member selection state までは証明していない。
- 参照: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-11-manual-test.md`, `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| staging admin 認証 cookie が取得できず screenshot が撮れない | 中 | 既存 authenticated Playwright storageState / admin login fixture を再利用し、手動認証が必要な場合は user-gated evidence として明記する |
| staging D1 の実データに削除済み member が無く部分失敗状態を再現できない | 中 | read-only capture と mutation capture を分離し、必要なら staging 専用 `e2e_test_*` データを user 承認後に投入する |
| local fixture 名と staging 実機名が混在して ledger が drift する | 低 | `*-staging.png` suffix を使う場合は Phase 11 / implementation-guide / artifacts ledger を同一 wave で更新する |
| bulk assign 実行が実データへ副作用を残す | 高 | 操作対象は staging 専用 test member / test tag に限定し、cleanup 手順を command log に残す |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

期待: BulkActionBar の tag picker / mode toggle / result summary component spec が PASS。

### 統合検証

```bash
PLAYWRIGHT_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web playwright test playwright/tests/issue1036-bulk-member-tags.spec.ts --project=desktop-chromium
```

期待: staging admin session で 4 screenshot が保存され、保存先が Phase 11 ledger と一致する。実データ mutation が必要な場合は user 承認後のみ実行する。

## スコープ

### 含む

- staging 認証付き `/admin/members` の screenshot capture
- Phase 11 evidence ledger / implementation-guide の screenshot path 同期
- capture command / URL / auth method / cleanup 結果の記録

### 含まない

- Issue #1036 本体実装の変更
- production 環境での bulk tag mutation
- commit / push / PR 作成

## 参照

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-11-manual-test.md`
- `apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts`
