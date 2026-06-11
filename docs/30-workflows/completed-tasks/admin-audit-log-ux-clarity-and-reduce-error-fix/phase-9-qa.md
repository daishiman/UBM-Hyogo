# Phase 9 — QA

> 正本: [shared-context.md](./shared-context.md)。本書は実装ターンで満たすべき品質ゲートと PASS 基準を確定する。
> 実装・コマンド実行は行わない（基準の記述のみ）。

---

## 1. ファイル削除の PASS 基準 [FB-UI-02-1]

本タスクで「削除」が発生しうるのは OOS-4 の旧 `.admin-audit-table*` CSS のみ（Phase 8 §2 判定で削除と決まった場合）。削除を行う場合の PASS 基準:

- **PASS 条件（いずれか）**:
  1. **git delete**: globals.css の当該 CSS ブロックを物理削除し、`git diff` に削除が出る。**かつ** live import（参照）ゼロ。
  2. **stub 化は不可**（CSS ブロックは stub の概念がないため delete のみ）。コンポーネント/モジュールを削除する場合は git delete OR 空 re-export stub のいずれかで、**live import ゼロ**を必須とする。
- **live import ゼロの確認**:
  ```bash
  grep -rn 'admin-audit-table' apps/web/src apps/web/app   # 0 件
  ```
  → 0 件であること（カード化後）。1 件でも残れば削除しない（残置し OOS-4 を未タスクへ）。
- 削除しない判定（参照あり）の場合は本基準を適用せず、Phase 8 §2-3 のルール3に従い残置理由を記録。

> 本タスクではコンポーネント/モジュールの削除は予定なし（新規追加 + 既存編集が中心）。`AuditRow`（内部関数）は `AuditLogCard` へ置換され消えるが、これは exported でない内部実装の入れ替えであり、上記「ファイル削除」基準の対象外（同一ファイル内リファクタ）。

---

## 2. 品質チェックリスト（実装ターンで全 PASS 必須）

| # | チェック | コマンド / 基準 | PASS 条件 |
|---|---------|----------------|-----------|
| QA-1 | typecheck | `mise exec -- pnpm typecheck` | エラー 0 |
| QA-2 | lint | `mise exec -- pnpm lint`（必要に応じ `--fix`） | エラー 0 |
| QA-3 | design token gate | `mise exec -- pnpm verify:tokens` | HEX 直書き 0 / `bg-[#xxx]` `text-[#xxx]` 0（AC-9） |
| QA-4 | 対象 vitest | shared-context §8 の6 spec を対象指定実行 | 全 PASS（RED→GREEN 完了） |
| QA-5 | apps/api 非変更 | `git diff --name-only -- apps/api` | **空**（AC-8） |
| QA-6 | HEX ゼロ（手動 grep 二重確認） | `grep -rnE '#[0-9a-fA-F]{3,8}\b\|bg-\[#\|text-\[#' apps/web/src/styles/globals.css apps/web/src/components/admin/AuditLogCard.tsx apps/web/src/components/admin/AuditPurposeGuide.tsx` | 新規追記分に HEX 0 件 |
| QA-7 | 既存 spec 回帰 | `AuditLogPanel.component.spec.tsx` 全 PASS | mask/href/empty/404/batchId/before-after の意図保持（AC-7） |
| QA-8 | reduce 根絶 | `TagCatalogPanel.reduce-guard.spec.tsx` | undefined/null/{} 全パターンで `not.toThrow`（AC-6） |
| QA-9 | 純関数 coverage | Phase 7 §1 コマンド | `auditAppliedFilters` / `auditErrorMessage` line/branch 100% |

> coverage（QA-9）は **対象ファイル限定**（Phase 7 §1）。全体一律閾値を CI gate に追加しない。

---

## 3. アクセシビリティ確認

| # | 観点 | 確認方法 | 基準 |
|---|------|---------|------|
| A11Y-1 | タイムラインの意味構造 | `AuditLogCard.spec` / DOM 確認 | 一覧は `<ol aria-label="監査ログ一覧">`、各カードは `<li>`。順序リストとして読める |
| A11Y-2 | guide ランドマーク | `AuditPurposeGuide.spec` | `<section aria-label="この画面の説明">` 相当。スクリーンリーダーで説明セクションへ到達可 |
| A11Y-3 | aria-label 維持 | 既存 spec | `data-component="admin-audit"` セクションの `aria-label="監査ログ"` / form の `aria-label="監査ログフィルター"` 維持 |
| A11Y-4 | Chip がテキスト依存（色のみ非依存） | `AuditLogCard.spec` / 目視 | action バッジ Chip は色だけでなく**テキスト（action 名）**を持つ。appliedFilters チップ・状態チップも同様。色覚非依存（[Phase2 §9]） |
| A11Y-5 | details 折りたたみのキーボード操作 | 目視（Phase 11） | 「変更内容を表示」`<details>`/`<summary>` がネイティブ要素でキーボード開閉可 |
| A11Y-6 | コピーボタンの aria-label | 既存 spec | `BatchIdCopyButton` の `aria-label="batchId <id> をコピー"` 維持 |
| A11Y-7 | 用語の plain/technical 併記 | `AuditPurposeGuide.spec` | やさしい日本語（plain）を主、技術名（technical）を併記。技術用語のみに依存しない |

---

## 4. 仕様書 gate（本タスクの implemented_local_evidence_captured 段階で確認）

| gate | コマンド | 基準 |
|------|---------|------|
| Phase12 compliance | `pnpm verify:phase12-compliance` | `ok:true`。canonical 9 セクション準拠 |
| gate-metadata | `pnpm gate-metadata:validate --require-gates-for-changed <artifacts.json 2本>` | ERROR 0。pending gate に `passed_at:null` 明示 |
| indexes drift | `mise exec -- pnpm indexes:rebuild` | drift なし（冪等） |

> Phase 11 evidence の status 語彙は `present` / `pending` / `n/a` のみ。`implemented_local_evidence_captured` ゆえ screenshot は `pending`（capture runtime_pending）。close-out（completed-tasks 移動）はしない。

---

## 5. 最終 QA 判定基準

実装ターンで以下を全て満たして QA PASS とする:

1. §2 QA-1〜QA-9 全 PASS。
2. §3 A11Y-1〜A11Y-7 全確認。
3. §1 ファイル削除基準（OOS-4 で削除した場合のみ）を満たす。
4. AC-1〜AC-10（shared-context §6）の各検証方法が緑。
5. user-gated 境界（commit/PR/push/deploy/screenshot 実撮影）は実装承認後に別途実施。本 QA は実装ローカル検証までを対象とする。
