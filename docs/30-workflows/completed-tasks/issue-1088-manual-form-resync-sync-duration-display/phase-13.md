**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 13 — PR作成

## 重要原則（user-gated）

**PR 作成は自動実行しない。commit / push / PR 作成はすべてユーザーの明示承認後のみ実行する。** Phase 1〜12 が完了し、ユーザーが「PR を作成して」と明示指示した時点で初めて本 Phase を実行する。

| 操作 | 実行可否 |
|------|---------|
| spec / 実装コードの作成・編集 | Phase 5〜12 で実行 |
| `git add` / `git commit` | **user 明示承認後のみ** |
| `git push` | **user 明示承認後のみ** |
| `gh pr create` | **user 明示承認後のみ** |
| staging deploy / runtime screenshot 取得 | **user 明示承認後のみ**（副作用あり） |

## 13.1 PR 基本情報

| 項目 | 値 |
|------|-----|
| base ブランチ | **`dev`**（開発統合ブランチ・既定） |
| head ブランチ | 実装サイクルで作成する `feat/issue-1088-sync-duration-display`（または既存 spec ブランチ `docs/issue-1088-sync-duration-display-spec` を実装拡張） |
| issue | [#1088](https://github.com/daishiman/UBM-Hyogo/issues/1088) |
| タスク種別 | implementation（backend + frontend 両輪・VISUAL） |

## 13.2 PR に含めるファイル（両輪 + workflow docs）

### backend（`apps/api`）

| ファイル | 変更 |
|---------|------|
| `apps/api/src/jobs/sync-forms-responses.ts` | `ResponseSyncResult` に `readonly durationMs: number;` 追加・`runResponseSync` 冒頭に `const startedAt = now().getTime();`・3 return（skipped/failed/succeeded）に `durationMs: now().getTime() - startedAt` 付与 |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | durationMs 3 経路返却テスト（TC-D1〜D9） |
| `apps/api/src/routes/admin/responses-sync.contract.spec.ts` | durationMs 込み result 素通しテスト（contract TC） |

> `apps/api/src/routes/admin/responses-sync.ts` は **変更しない**（result 素通しのため）。

### frontend（`apps/web`）

| ファイル | 変更 |
|---------|------|
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncResultSchema` に `durationMs: z.number().int().nonnegative().optional()` 追加（`.strict()` 維持・union 不変） |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | `resultRows()` に `["durationMs", result.durationMs ?? "-"]` 行追加 |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | durationMs 受理・strict 維持テスト（TC-S8〜S16） |
| `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | durationMs 行表示 / 欠落 fallback / 0 保持テスト（TC-B9 / B14 / B15） |

### workflow docs

| ファイル | 内容 |
|---------|------|
| `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/**` | Phase 1〜13 仕様書・`outputs/phase-11/**`・`outputs/phase-12/**`・`artifacts.json` |

> Phase 11 runtime screenshot（`manual-form-resync-panel-result-with-duration.png`）が user-gated capture で取得済みなら `outputs/phase-11/runtime/` も含める。未取得なら PR 本文の screenshot セクションには「runtime capture は user-gated・pending」を明記し、自動テスト主証跡を代替として記載する。

## 13.3 事前検証（PR 作成前・user 承認後に実行）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

加えて本タスク固有の focused テスト（Phase 11 §11.1 のコマンド）が green であることを確認する。

## 13.4 PR 本文骨子

```markdown
## 概要
管理パネル「フォーム回答の再取込」結果テーブルに取込所要時間 durationMs 行を追加（issue #1088）。
backend で runResponseSync の所要時間を計測し ResponseSyncResult.durationMs として返却、
frontend schema に optional 追加・結果 <dl> に表示行追加。backend + frontend を 1 サイクルで実装。

## 変更内容
### backend（apps/api）
- ResponseSyncResult に durationMs: number 追加
- runResponseSync 冒頭で startedAt を計測し、succeeded / failed / skipped の 3 return で durationMs を返却（既存 now() 注入を再利用）
- route（responses-sync.ts）は result 素通しのため変更なし

### frontend（apps/web）
- SyncResultSchema に durationMs を optional 追加（.strict() / union 維持）
- resultRows に durationMs 行追加（欠落時 "-" fallback）

## 受入条件
- AC-1: 3 経路で durationMs（非負整数ミリ秒）返却 ✅
- AC-2: schema optional 追加・.strict() 維持 ✅
- AC-3: resultRows に行・欠落時 "-"・実値表示 ✅
- AC-4: 既存表示 / 409 / .strict() / union 退化なし ✅
- AC-5: panel / schema spec 回帰 green ✅
- AC-6: contract spec durationMs 込み green ✅

## 不変条件
- D1 アクセスは apps/api 限定（計時は apps/api 閉包・web は表示のみ）
- HEX 直書きなし（既存トークンクラス継承）
- 新規テストは *.spec.{ts,tsx} のみ

## 視覚証跡（VISUAL）
- 結果 <dl> に durationMs 行が追加される UI 変更
- runtime screenshot: manual-form-resync-panel-result-with-duration.png（user-gated・取得済みなら参照 / 未取得なら pending）
- 主証跡: 自動テスト（panel / schema / backend / contract spec）

## scope-out（別タスク）
- durationMs 以外のメトリクス（writeRate 等）
- sync/manual.ts:87 の durationMs:0 ハードコード修正
- sync 系 / resync 系の計時 helper 統一
- MINOR-1: monotonic clock クランプ（Math.max(0, ...)）
```

## 13.5 PR 作成コマンド（user 承認後のみ）

```bash
gh pr create --base dev \
  --title "feat(admin): フォーム回答再取込の所要時間 durationMs を結果に表示 (#1088)" \
  --body-file <PR本文>
```

## 完了条件（Phase 13 DoD）

- [ ] ユーザーの明示承認を得た（commit / push / PR / staging / screenshot すべて）。
- [ ] base = `dev` で PR を作成した。
- [ ] PR に backend（job + contract spec）・frontend（schema + panel + 各 spec）・workflow docs を漏れなく含めた。
- [ ] `responses-sync.ts` を変更していない（route 素通し維持）。
- [ ] PR 本文に AC-1〜AC-6・不変条件・視覚証跡・scope-out を記載した。
- [ ] runtime screenshot は取得済みなら参照、未取得なら pending と明記した。
