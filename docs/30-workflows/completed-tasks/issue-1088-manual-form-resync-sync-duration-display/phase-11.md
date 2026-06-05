**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 11 — 手動テスト（VISUAL）

## VISUAL 宣言

| 項目 | 内容 |
|------|------|
| **タスク種別** | **VISUAL**（UI に視覚変更あり） |
| **視覚変更内容** | 管理パネル「フォーム回答の再取込」の結果 `<dl>`（`ManualFormResyncPanel.client.tsx:139〜`）に `durationMs` の `<dt>/<dd>` 行が 1 行追加される。既存の status / jobId / processedCount / writeCount / cursor 行に続いて、取込所要時間（ミリ秒）が表示される |
| **runtime user-gated 理由** | 実 PNG 取得には (1) durationMs 実装が landed していること (2) admin 認証済みブラウザ状態 (3) `SYNC_ADMIN_TOKEN` の runtime 構成（web proxy `apps/web/app/api/admin/[...path]/route.ts` の bearer 注入が機能する環境） (4) 実 resync の実行（成功結果に durationMs が乗る）がすべて必要なため。これらは副作用を伴う runtime 操作であり、ユーザー明示承認まで実行しない |
| **visualEvidence** | `VISUAL_ON_EXECUTION`（設計上の視覚変更は確定済み・実 PNG は実装サイクル後の user-gated capture で取得） |

## 11.1 主証跡（自動テスト）と対応表

runtime screenshot が user-gated・pending のため、本タスクの**主証跡は自動テスト**とする。durationMs の表示・欠落 fallback・backend 返却・契約整合をすべて自動テストで検証する。

| AC | 主証跡（自動テスト） | テストケース |
|----|---------------------|-------------|
| AC-1 | backend spec: `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（succeeded / failed / skipped 3 経路で durationMs 返却） | TC-D1〜D9 |
| AC-2 | schema spec: `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（`SyncResultSchema` の durationMs 受理・`.strict()` 維持・union 不変） | TC-S8〜S16 |
| AC-3 | panel spec: `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx`（durationMs 行表示 / undefined → `-` / 0 保持） | TC-B9 / TC-B14 / TC-B15 |
| AC-4 | schema spec TC-S1〜S7・panel spec TC-B1〜B8（既存回帰）/ 409 ハンドリング不変 | 既存 TC 群 |
| AC-5 | panel / schema spec 全件 green | focused vitest log |
| AC-6 | contract spec: `apps/api/src/routes/admin/responses-sync.contract.spec.ts`（durationMs 込み result 素通し） | contract TC |

### 自動テスト実行コマンド（実装サイクルで取得）

```bash
# frontend（panel + schema）
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts

# backend（job + contract）
mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  src/jobs/sync-forms-responses.contract.spec.ts \
  src/routes/admin/responses-sync.contract.spec.ts
```

取得ログは `outputs/phase-11/evidence/focused-vitest.log` / `typecheck.log` / `lint.log` に保存する（現時点 pending）。

## 11.2 runtime screenshot 取得手順（user-gated・pending）

### prerequisites

1. durationMs 実装（Phase 5）が landed していること。
2. ローカル or staging で web + api が起動し、admin 認証でログイン済みであること。
3. `SYNC_ADMIN_TOKEN` が runtime に構成され、web proxy（`apps/web/app/api/admin/[...path]/route.ts`）が bearer を注入できること。
4. Google Forms 回答 sync が実行可能な状態（実 resync で成功結果が返ること）。

### 手順

1. 管理画面 route `/admin/sync-status`（フォーム回答の再取込パネルが描画される画面）を開く。
2. 「差分 sync」ボタンを押し、resync を実行する。
3. 結果 `<dl>` に `durationMs` 行が表示され、実値（ミリ秒）が出ていることを確認する。
4. 成功結果に durationMs 行が出た状態を 1 枚キャプチャする。

### canonical screenshot 名（1 枚）

| canonical 名 | 状態 | 保存先 |
|-------------|------|--------|
| `manual-form-resync-panel-result-with-duration.png` | 差分 sync 成功結果に durationMs 行が表示された状態 | `outputs/phase-11/runtime/manual-form-resync-panel-result-with-duration.png` |

> screenshot 名は `screenshot-plan.json` / `phase11-capture-metadata.json` / `implementation-guide.md`（Phase 12）で同一 canonical 名に揃える（[FB-VISUAL-CAP-001] / [FB-LLM-MOD-05-001]）。TC 番号はメタデータ内の `tc` フィールドのみで管理し、ファイル名には含めない。

## 11.3 代替証跡（runtime 取得までの間）

runtime screenshot が取得できるまでの間、以下を視覚変更の代替証跡とする。

- **自動テスト**: panel spec の durationMs 行表示テスト（TC-B9）が DOM 上に `durationMs` の `<dt>` と実値 `<dd>` が描画されることを assert する。これにより「結果 `<dl>` に行が増える」視覚変更を runtime PNG なしで検証する。
- **静的 contract**: `SyncResultSchema`（schema spec）と `ResponseSyncResult`（backend spec）の型・契約により、UI に流れる durationMs の値域（非負整数）が保証される。

## 11.4 outputs/phase-11 のファイル群への参照

本手順書の証跡実体は `outputs/phase-11/` 配下に集約する（main.md / manual-test-result.md / screenshot-plan.json / phase11-capture-metadata.json は別 lane が作成済み）。

| ファイル | 役割 |
|---------|------|
| [outputs/phase-11/main.md](outputs/phase-11/main.md) | local evidence index（証跡一覧・状態） |
| [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) | 証跡メタ（主証跡ソース・VISUAL 宣言・runtime を作らない理由・自動テスト一覧） |
| [outputs/phase-11/screenshot-plan.json](outputs/phase-11/screenshot-plan.json) | screenshot 計画（canonical 名 `manual-form-resync-panel-result-with-duration.png`） |
| [outputs/phase-11/phase11-capture-metadata.json](outputs/phase-11/phase11-capture-metadata.json) | capture metadata（taskId / tc / canonical 名） |
| outputs/phase-11/evidence/ | focused-vitest.log / typecheck.log / lint.log（実装サイクルで生成） |
| outputs/phase-11/runtime/ | runtime screenshot 保存先（user-gated capture で生成） |

## 完了条件（Phase 11 DoD）

- [ ] VISUAL 宣言（種別 / 視覚変更内容 / runtime user-gated 理由）を記録した。
- [ ] AC ↔ 自動テスト主証跡の対応表を記録した。
- [ ] runtime screenshot 取得手順（route `/admin/sync-status`・prerequisites・canonical 名）を記録した。
- [ ] 代替証跡（自動テスト + 静的 contract）を記録した。
- [ ] `outputs/phase-11/` のファイル群への参照を記録した。
- [ ] runtime screenshot の実取得は user-gated・pending である旨を明記した。
