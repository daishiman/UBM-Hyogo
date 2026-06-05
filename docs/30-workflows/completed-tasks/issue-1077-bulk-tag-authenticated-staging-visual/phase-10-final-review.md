# Phase 10: 最終レビュー

> **実装区分: 実装仕様書** — acceptance criteria の充足見込み判定・blocker 判定・未タスク化候補を確定する。

## 10.0 レビュー対象

- workflow: `issue-1077-bulk-tag-authenticated-staging-visual`
- 唯一の実装物（本 wave で追加）: 新規 Playwright spec
  `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
- 本タスクの成果（このサイクル）: **implemented_local_runtime_pending**（Phase 1〜12 仕様完成）。runtime / commit は user-gated。

## 10.1 受け入れ基準の充足見込み判定

| ID | 受け入れ基準 | 充足手段（Phase 参照） | 見込み |
| --- | --- | --- | --- |
| AC-1 | 認証付き `/admin/members` で複数選択 → bulk region + tag section 表示 | SC-AUTH/SC-SELECT（P7）+ `prepareBulkRegion`（P8）+ region/section visible assert | ✅ 充足見込み |
| AC-2 | assign baseline `bulk-tag-picker-assign-mode.png` | region scope `toHaveScreenshot`（P6/P8） | ✅ 充足見込み |
| AC-3 | `解除` トグル後 unassign baseline `bulk-tag-picker-unassign-mode.png` | `setTagMode` client 切替 + `aria-pressed` 確認 + 撮影（P6/P8） | ✅ 充足見込み |
| AC-4 | canonical 名が phase-11 / implementation-guide / artifacts と一致 | `SNAP` const 集約 + ledger 照合（P8/P9） | ✅ 充足見込み |
| AC-5 | 実行ログに storageState 経路 / URL / command / 保存先 | Phase 11 manual-test-result に記録（runtime_pending） | ⏳ runtime 時に確定 |
| AC-6 | mutation 一切実行しない | `bulk-tag-result` count 0 assert + apply 非 click（P6） | ✅ 構造的に充足 |
| AC-7 | apps/api・apps/web ソース・D1・Form 非変更（テスト追加のみ） | git diff スコープ = 新 spec 1 ファイルのみ（P9） | ✅ 充足見込み |

## 10.2 blocker 判定

| 候補 | 判定 |
| --- | --- |
| 認証基盤の不在 | **blocker でない**（`mint-staging-storage-state.ts` / `staging-visual-authenticated` project / `playwright-staging-visual-authenticated.yml` landed 済み・`admin-dashboard-authenticated.spec.ts` で実証済み） |
| セレクタ不在 | **blocker でない**（全 locator を apps/web 実コードで確認済み: `aria-label="一括操作"` / `"タグ一括付与・解除"` / `"付与モード"` / `aria-label="{fullName} を選択"` / `data-testid="admin-members-row-{id}"` / `data-testid="bulk-tag-result"`） |
| staging seed 不足 | **潜在リスク（blocker でない）**。FP-01..03 guard が明示 fail で検出するため、未達なら baseline 生成段階で安全に止まる |

→ **blocker なし**。spec は実装可能な状態で完成している。

## 10.3 MINOR 指摘 → 未タスク化候補

`outputs/phase-12/unassigned-task-detection.md` に記録する候補:

| ID | 指摘 | 区分 | 推奨対応 |
| --- | --- | --- | --- |
| MINOR-01 | result 2 状態（`bulk-tag-result-all-success` / `bulk-tag-result-partial-failure`）の staging 実機 baseline は本タスク非取得 | スコープ外（CONST_005 例外・index.md §0 で承認済み） | 別タスク化。実 `POST .../tags/bulk` mutation が必須で staging 共有 D1 副作用を伴うため、隔離 seed / cleanup 設計を伴う独立タスクとして起票候補。現状は component spec TC-BAB-TAG-03 + 親 local fixture baseline で担保 |
| MINOR-02 | viewport を desktop 1 種に限定（mobile / tablet picker baseline 未取得） | improvement / low | レスポンシブ picker の visual 退行が問題化した時点で別タスク化。本タスクは既存 authenticated project の既定 viewport（desktop）に揃える |

いずれも **本タスクの GO を妨げない**（スコープ外として明示済み）。

## 10.4 最終判定

| 項目 | 判定 |
| --- | --- |
| spec 完成度 | Phase 1〜12 仕様完成・実装可能・blocker なし |
| AC 充足見込み | AC-1..4, 6, 7 = 充足見込み / AC-5 = runtime 時確定 |
| **最終判定** | **GO（implemented_local_runtime_pending 完成）** |
| runtime / commit / staging baseline 生成 / PR | **user-gated**（承認後実施） |
| GitHub issue #1077 | **CLOSED 維持**（reopen しない） |

> 本タスクのこのサイクルの成果は「実装仕様書と新規 Playwright spec の追加、および local verification PASS」。認証付き staging Playwright 実行・baseline snapshot 生成 / commit・PR 作成は user 承認後に委ねる。

## 10.5 完了条件（Phase 10）

- AC-1..7 の充足見込みが個別判定されている
- blocker なしが根拠付きで判定されている
- MINOR-01/02 が未タスク化候補として記録方針付きで明記されている
- 最終判定 = GO（spec 完成 / runtime user-gated）が確定している
