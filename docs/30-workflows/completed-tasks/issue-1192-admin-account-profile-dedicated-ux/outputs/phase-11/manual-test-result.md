# Phase 11: 手動テスト結果（implemented_local_evidence_captured / local evidence present）

## タスク種別

| 項目 | 値 |
| --- | --- |
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| taskType | implementation |
| implementation_mode | new（管理者分岐 UI の新設） |
| visualEvidence | **VISUAL_ON_EXECUTION** |
| workflow_state | `implemented_local_evidence_captured` |
| 実施 wave | **implemented_local_evidence_captured（local Vitest 実行済み。screenshot は user-gated/pending）** |

> **visualEvidence = VISUAL_ON_EXECUTION 宣言**: 本タスクは `/profile` 認証成功描画への `AdminAccessNotice` 新設による視覚差分を伴う。必須の local evidence は component/page Vitest・typecheck・lint で取得済み。PNG 実体は 0 枚（`screenshots/.gitkeep` のみ）で、staging `/profile` の管理者アカウント認証 runtime screenshot は認証必須ルートのため **user-gated pending**（Claude Code は staging 認証ログインして取得しない）。

## 証跡の主ソース（計画 inventory）

| 主ソース | 内容 | 状態 |
|---------|------|------|
| 自動テスト（tier1 一次証跡） | focused Vitest 6 件（T-C1〜T-C3 / T-P1〜T-P3）+ typecheck / lint | **PASS（local Vitest 実行済み）** |
| 視覚証跡（tier1） | ローカル静的 UI contract screenshot 3 枚（`screenshot-plan.json` 参照） | optional / not captured（必須 gate は component/page tests で代替） |
| 視覚証跡（tier2 二次証跡） | staging `/profile` 管理者アカウント認証 runtime screenshot + `/admin` 遷移確認 | **user-gated pending** |

## 自動テスト結果（T-C1〜T-P3・PASS）

> local Vitest で自動テストは実行済み。staging runtime screenshot は user-gated pending。

| ID | 対象 | テストファイル（予定） | 予定内容 | 期待結果 |
| --- | --- | --- | --- | --- |
| T-C1 | `AdminAccessNotice` 描画 | `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | 見出し「管理者メニュー」と本文（管理者アカウントでログインしています…）が描画される | PASS（local Vitest） |
| T-C2 | `/admin` 導線 | 同上 | リンクが `href="/admin"`・accessible name「管理画面を開く」を持つ | PASS（local Vitest） |
| T-C3 | testid + member データ非含有 | 同上 | `data-testid="profile-admin-access-notice"` が存在し、`memberId` / email 等の member データ文字列を描画しない（不変条件 #11） | PASS（local Vitest） |
| T-P1 | isAdmin=true 成功パス | `apps/web/app/(member)/profile/page.spec.tsx` | 認証成功描画で notice が present | PASS（local Vitest） |
| T-P2 | isAdmin=false | 同上 | notice の query 結果が null（非描画） | PASS（local Vitest） |
| T-P3 | degrade 分岐 | 同上 | `/me/profile` 失敗 degrade では isAdmin=true でも notice なし | PASS（local Vitest） |

## 計画された screenshot（全 pending）

| Screenshot | variant / viewport | 状態 |
| --- | --- | --- |
| `screenshots/profile-admin-desktop.png` | 管理者（isAdmin=true）/ desktop 1280x800 | pending（staging/user-gated or local screenshot未取得） |
| `screenshots/profile-admin-mobile.png` | 管理者（isAdmin=true）/ mobile 375x812 | pending（staging/user-gated or local screenshot未取得） |
| `screenshots/profile-member-desktop.png` | 非管理者（isAdmin=false）/ desktop 1280x800 | pending（staging/user-gated or local screenshot未取得） |
| staging 管理者 runtime screenshot | staging `/profile` 実機（認証必須） | **user-gated pending**（ユーザー明示承認後のみ） |

## 手動確認手順の実結果（全 pending）

| MT | 内容 | 実結果 |
| --- | --- | --- |
| MT-1 | 管理者アカウントで `/profile` → 管理者メニューカード表示 | **PASS（local Vitest T-P1 + component tests） / staging は user-gated** |
| MT-2 | 「管理画面を開く」→ `/admin` 遷移 | **PASS（component test で href=/admin を検証） / staging は user-gated** |
| MT-3 | 非管理者で `/profile` → カード非表示 | **PASS（local Vitest T-P2） / staging は user-gated** |
| MT-4 | degrade 分岐で notice なし（jsdom T-P3 を正とする補助確認） | **PASS（local Vitest T-P3）** |

## 発見・修正

| ID | 内容 | 対応 |
| --- | --- | --- |
| local Vitest 実施済み。staging screenshot は user-gated pending。 | | |

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル・計画 inventory）
- `outputs/phase-11/screenshots/.gitkeep`（PNG 実体は 0 枚（staging 認証 screenshot は user-gated）・全て pending）
- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/phase11-capture-metadata.json`

## 参照資料

- `phase-11-manual-test.md`（two-tier evidence 設計・MT-1..MT-4 の手順正本）
- `phase-1-requirements.md`（AC-1..AC-9）
- `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md`（two-tier / user-gated pending の書式正本）

## 統合テスト連携

tier1（focused/local Vitest + typecheck/lint）の取得結果を本ファイルへ反映済み。tier2（staging 認証 runtime screenshot）は user-gated 承認後に取得し `outputs/phase-11/screenshots/` へ配置する。承認が無い間は user-gated pending のまま Phase 13 PR 本文に明記する。
