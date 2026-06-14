# Phase 11: 手動テスト証跡 — issue-1198 admin-audit dead table CSS cleanup

> **[実装区分: 実装完了 / NON_VISUAL / implemented_local_evidence_captured]**

## NON_VISUAL 宣言 [Feedback BEFORE-QUIT-001 / Feedback 4 / WEEKGRD-03]

- **タスク種別**: NON_VISUAL
- **非視覚的理由**: 削除対象の 3 ブロック（`.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`）は `/admin/audit` のカード化（#1202）で参照ゼロになった **未適用の dead CSS** である。未適用 CSS の削除は描画ツリーに 1px も影響しない（before/after が同一）。よってスクリーンショットは証跡価値を持たず、視覚回帰は撮らない。
- **代替証跡（主ソース）**: ① 削除後の grep gate（旧 3 クラスが `.tsx`/`.ts` と `globals.css` 自身で 0 件 / 新規カード系・`.tbl` 現行 0 件維持）+ ② 監査ログ focused Vitest 2 本（`AuditLogPanel.component.spec.tsx` / `AuditLogCard.spec.tsx`）の回帰 PASS + ③ `typecheck` / `lint` / `verify:tokens` の静的検証。
- **スクリーンショットを作らない理由 [Feedback 4]**: 主ソースは上記 grep gate と focused Vitest であり、UI 描画は不変であるため。dead CSS 削除という性質上、視覚回帰スクリーンショットは before/after 同一で証跡として無意味になる。

> 本タスクは **implemented_local_evidence_captured（local実装完了・commit/PR は user-gated）** である。以下の検証項目は本サイクルで取得済みの実測証跡として記録する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-1198-admin-audit-dead-table-css-cleanup |
| タスク種別 | NON_VISUAL（実装仕様書 / implementation_mode: new） |
| ステータス | implemented_local_evidence_captured（commit/PR は user-gated） |
| 想定環境 | ローカル（Node 24.15.0 / pnpm 10.33.2・`mise exec` 経由） |
| 変更ファイル | `apps/web/src/styles/globals.css`（3 ブロック削除・純減のみ） |

## 証跡の主ソース [Feedback 4]

- **grep gate（主ソース 1）**: 削除前ゼロ参照証跡（AC-1）+ 削除後の定義消失・保持確認（AC-2/AC-3）。
- **自動テスト（主ソース 2）**: `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` / `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx`（focused 2 本・回帰確認のみ・テスト変更なし）。
- **静的検証（補助）**: `typecheck` / `lint` / `verify:tokens`。
- これらを併せて、視覚証跡（スクリーンショット）の代替とする。スクショは作らない（描画不変のため）。

## 検証項目チェックリスト（取得済み・TC-ID 形式）

> 各 TC は実装後に実行済み。状態列は **completed** で固定する。

| TC-ID | 検証内容 | 期待値 | 主ソース | 状態 |
| --- | --- | --- | --- | --- |
| TC-01 | 削除前のコンポーネント参照 grep（AC-1） | `grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"` が **0 件**（唯一の既知ヒット `admin-audit-filtered.png` は Playwright スクショ名で CSS 参照ではない） | grep | completed |
| TC-02 | 削除後の旧 3 セレクタ定義消失（AC-2） | `grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css` が **0 件** | grep | completed |
| TC-03 | 新規カード系 CSS のヒット維持（AC-2 保持境界） | `grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" apps/web/src/styles/globals.css` が **ヒット維持** | grep | completed |
| TC-04 | `.tbl` 汎用ユーティリティ（現行ヒットなし）の無変更（AC-3） | `rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"` が 0 件（現行ベースライン維持） | grep | completed |
| TC-05 | typecheck green（AC-4） | `mise exec -- pnpm typecheck` exit 0 | typecheck | completed |
| TC-06 | lint green（AC-4） | `mise exec -- pnpm lint` exit 0 | lint | completed |
| TC-07 | verify:tokens in sync（AC-4） | `mise exec -- pnpm verify:tokens` HEX 0 違反 / in sync | verify:tokens | completed |
| TC-08 | 監査ログ focused Vitest 回帰（AC-5） | `vitest run ... AuditLogPanel.component.spec.tsx AuditLogCard.spec.tsx` 全 PASS（regression なし） | Vitest | completed |
| TC-09 | diff 純減のみ（AC-6） | `git diff --stat apps/web/src/styles/globals.css` が削除行のみ・追加 0・apps/api / D1 / Form 無変更 | git diff | completed |

## source-level PASS と環境ブロッカーの分離 [WEEKGRD-01]

- **source-level（仕様確定）**: TC-08 の focused Vitest 2 本は **dead CSS に非依存**（CSS 削除はテスト import 経路に影響しない）。Phase 4 で「テスト変更不要・回帰確認のみ」を確定済み。TC-01〜TC-04 の grep は静的事実の確認であり、削除後に決定論的に成立する設計（参照 0 / 定義消失 / 保持維持）。よって source-level の合格見込みは設計上確立済み。
- **環境ブロッカー**: 想定なし。リスクは Vitest / esbuild runtime（arch / worktree isolation / esbuild version）のみで、本タスク固有の欠陥ではない。発生時は `pnpm verify:vitest-runtime` で切り分け、環境要因として分離記録する。

## 結論

NON_VISUAL タスクとして、視覚証跡の代替に grep gate（AC-1/AC-2/AC-3）+ 監査ログ focused Vitest 2 本（AC-5）+ typecheck / lint / verify:tokens（AC-4）を主ソースとする。本仕様書は **implemented_local_evidence_captured** 段階であり、TC-01〜TC-09 は実測 PASS を取得済み。スクリーンショットは描画不変のため作成しない。
