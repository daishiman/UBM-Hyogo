# Phase 11: 手動テスト計画 + 証跡

## タスク種別

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| implementation_mode | new（既存コードへの編集 + 新規テスト追加） |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |
| 主証跡ソース（NON_VISUAL: Lane A） | 実装後の focused Vitest（`viewmodel.spec.ts` / `builder.repository.spec.ts`）の名前と件数 |
| 主証跡ソース（VISUAL: Lane B） | 実装後の jsdom render（`MemberDrawer.spec.tsx`）+ staging 認証 runtime screenshot（user-gated） |

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施 wave | implemented_local_evidence_captured（local code implementation・focused Vitest・typecheck は完了。screenshot 撮影・commit・PR は user-gated） |
| ブランチ | `fix/admin-member-detail-500-and-drawer-resilience` |
| 起点 | `origin/dev` (2644fcaf2) |
| 対象環境（将来の VISUAL 検証） | staging（`/(admin)/admin/members` ドロワー・認証必須） |

## 仕様判断根拠（FB-4: 証跡メタを厚くする）

- workflow_state は `implemented_local_evidence_captured`。本 wave では local 実装と focused Vitest は完了し、staging screenshot のみ未実施であり、本ファイルは「実装後の手動テスト計画」と「撮影計画」を確定する位置づけである。
- Lane B のエラー回復 UI（`MemberDrawer` の error 分岐に追加する「再試行」ボタン）の staging runtime screenshot は、`/(admin)/admin/members` が**管理者認証必須ルート**であり、ドロワーは認証セッション下でのみ開けるため **user-gated** である。Claude Code が staging に管理者ログインして screenshot を取得することはできない。
- そのため本 wave では `screenshots/` に実 PNG を**置かない**（PNG 0 件）。`screenshot-plan.json` と `phase11-capture-metadata.json` の各 capture の `status` を `staging_visual_pending_user_gate` とし、実装後に staging で撮影する計画として記述する。`screenshots/.gitkeep` は validator error 回避のため**作らない**。
- 実装後の証跡の主ソースは focused Vitest（Lane A の純関数 / builder 回帰 2 spec と、Lane B の `MemberDrawer.spec.tsx`）であり、staging runtime screenshot は二次証跡として user-gated 承認後に取得する。空メタでは reviewer が「なぜ PNG が無いか」を読み取れないため、本節で二段境界（implemented_local_evidence_captured により未撮影 / staging 認証により user-gated）を明記する。

## 撮影計画（実装後・staging・user-gated）

下記 3 カットを実装後に staging で取得する。本 wave では計画のみで、`status` は全て `staging_visual_pending_user_gate`。

| ID | 対象 | 種別 | 期待内容 | status |
| --- | --- | --- | --- | --- |
| SC-01 | 修正前相当の error + retry 表示（詳細 fetch 失敗時の error 分岐に「再試行」ボタンが出る） | staging runtime | `role="alert"` の「読み込み失敗」文言と `data-testid="member-detail-retry"` の再試行ボタンが並ぶ | staging_visual_pending_user_gate |
| SC-02 | retry 押下 → 詳細ドロワー正常表示（TEST-MEM-09・seed source タグ表示） | staging runtime | 再試行ボタン押下で再 fetch が成功し、`source='seed'` タグ保有メンバー（TEST-MEM-09）の詳細・タグが表示される | staging_visual_pending_user_gate |
| SC-03 | 詳細 API 200 の network | staging runtime（DevTools Network） | `GET /api/admin/members/TEST-MEM-09` が 200 を返す（500 解消の確認） | staging_visual_pending_user_gate |

## 実行記録（local verification 実行済み / staging screenshot user-gated）

本 wave で local verification を実行済み。staging screenshot のみ user-gated。

| コマンド（予定） | 実行状況 |
| --- | --- |
| `pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts` | PASS（2 files / 30 tests） |
| `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/builder.repository.spec.ts` | PASS（1 file / 35 tests） |
| `pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | PASS（1 file / 5 tests） |
| `pnpm --filter @ubm-hyogo/shared typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm verify:no-inline-style` | PASS |
| `pnpm verify:phase12-compliance` | PASS（script 検出対象 root は `profile-reload-session-404-fix`） |
| staging runtime screenshot（SC-01/02/03） | pending_user_gate（認証必須） |

### NON_VISUAL パート（Lane A）— 自動テスト主証跡（実装後）

| ID | 対象 | テストファイル（予定） | 予定テスト名 | 期待結果 |
| --- | --- | --- | --- | --- |
| MT-01 | `normalizeTagSource` 恒等 | `packages/shared/src/zod/viewmodel.spec.ts` | `'rule' / 'ai' / 'manual' を恒等に返す` | PASS |
| MT-02 | `normalizeTagSource` フォールバック | `packages/shared/src/zod/viewmodel.spec.ts` | `'seed' / 未知 / 空文字 / null / undefined を 'manual' へ正規化し例外を投げない` | PASS |
| MT-03 | `TagSourceZ` 最終防壁 | `packages/shared/src/zod/viewmodel.spec.ts` | `TagSourceZ.safeParse('seed') が success かつ data='manual'、正規値は恒等` | PASS |
| MT-04 | builder 回帰（admin 詳細） | `apps/api/src/repository/__tests__/builder.repository.spec.ts` | `seed source タグ保有メンバーで buildAdminMemberDetailView が AdminMemberDetailViewZ.safeParse を通る` | PASS |
| MT-05 | builder 回帰（マイページ） | `apps/api/src/repository/__tests__/builder.repository.spec.ts` | `buildMemberProfile も seed source で safeParse を通る` | PASS |

### VISUAL パート（Lane B）— jsdom render 主証跡 + screenshot 二次証跡（実装後）

| ID | 対象 | 証跡 | 予定内容 | 期待結果 |
| --- | --- | --- | --- | --- |
| MT-06 | 初回 fetch 500 → error + 再試行ボタン表示 | jsdom render（`MemberDrawer.spec.tsx`） | 初回 fetch を 500 にモックすると `role="alert"` の error 文言と `data-testid="member-detail-retry"` の再試行ボタンが描画される | PASS |
| MT-07 | 再試行押下 → 回復 | jsdom render（`MemberDrawer.spec.tsx`） | 再試行ボタン押下で `reloadKey` が進み 2 回目 fetch（200 モック）が走り、詳細表示へ回復する | PASS |
| SC-01 | error + retry 外観 | staging runtime screenshot | 再試行ボタンの視覚契約 | staging_visual_pending_user_gate |
| SC-02 | retry 後の詳細ドロワー | staging runtime screenshot | TEST-MEM-09 の詳細・seed タグ表示 | staging_visual_pending_user_gate |
| SC-03 | 詳細 API 200 | staging runtime（Network） | `GET /api/admin/members/TEST-MEM-09` 200 | staging_visual_pending_user_gate |

## 完了条件

- [x] タスク種別・実施情報・仕様判断根拠・撮影計画・実行記録（予定）を記録
- [x] NON_VISUAL（Lane A）の主証跡を実装後の自動テスト名・件数として記録
- [x] VISUAL（Lane B）の主証跡を実装後の jsdom render と定義し、staging runtime screenshot を user-gated（`staging_visual_pending_user_gate`）として分離
- [x] `screenshots/` に実 PNG を置かず（PNG 0 件）、`screenshot-plan.json` / `phase11-capture-metadata.json` の status を `staging_visual_pending_user_gate` とする
- [x] `screenshots/.gitkeep` を作らない（PNG 0 件のディレクトリを残さない）

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル）
- `outputs/phase-11/screenshots/screenshot-plan.json`（撮影計画・status=staging_visual_pending_user_gate）
- `outputs/phase-11/screenshots/phase11-capture-metadata.json`（capture metadata・status=staging_visual_pending_user_gate）
- `outputs/phase-11/screenshot-coverage.md`（カバレッジ）

## 参照資料

- `_shared-context.md` §8（Phase 11/12 の扱い・implemented_local_evidence_captured × VISUAL）
- `outputs/phase-1/phase-1.md`（AC-1〜AC-7）
- `outputs/phase-2/phase-2.md`（Lane A / Lane B 修正方針）
- `outputs/phase-5/task-01..02-*.md`（実装仕様書本体）

## 統合テスト連携

Lane A / Lane B の focused Vitest は実行済み。本記録は実測値へ更新済みである。staging runtime screenshot（SC-01/02/03）は user-gated 承認後に取得し `outputs/phase-11/screenshots/` へ配置する。
