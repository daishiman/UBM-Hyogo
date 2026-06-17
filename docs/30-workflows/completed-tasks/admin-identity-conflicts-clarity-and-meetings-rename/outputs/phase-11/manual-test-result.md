# Phase 11 — 手動テスト結果

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

本タスクは **VISUAL かつ implemented_local_evidence_captured**（実コード反映済み）。focused test は取得済みで、runtime screenshot は user-gated のため未取得。本ファイルは取得済み証跡と残る user-gated 証跡を分離して記録する。

> 計画の正本は [phase-11-manual-test.md](../../phase-11-manual-test.md)、文言・seed 仕様は [shared-context.md](../../shared-context.md)。

## NON_VISUAL 部分（実装済みのため取得する機械検証証跡）

| 検証 | 主ソース（予定の focused vitest / コマンド） | 期待 |
| --- | --- | --- |
| サイドバー命名 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | meeting=`開催・出席管理` / identity=`会員の重複確認`、id/href/icon 不変 |
| 行コンポーネント文言 | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | merge/source/target/email/matched/name/affiliation/canonical/PII/redaction の日本語置換、glossary 経由 badge（氏名/職業） |
| ガイド描画 | `apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx` | 3 点の平易説明が描画 |
| 用語集 | `apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts` | `matchedFieldLabel("name")="氏名"` / `("affiliation")="職業"` / 未登録は原文 fallback（throw しない） |
| seed contract | `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts` | 生成 SQL の drift 0 / idempotent（INSERT OR REPLACE）/ 行数 contract |
| トークン | `mise exec -- pnpm verify:tokens` | HEX/任意色直書きなし（`var(--ubm-color-*)` のみ） |
| 型 / lint | `mise exec -- pnpm typecheck` / `pnpm lint` | 緑 |
| seed 機能検証 | `identity-conflict-seed.contract.spec.ts` 内の in-memory D1 contract | ちょうど 5 組（既存 TEST-MEM-01..10 と非衝突） |

取得済み結果: focused Vitest **5 files / 42 tests PASS**。

## VISUAL 部分（screenshot — 未取得 / pending_implementation）

| canonical 名 | state | 撮影観点 |
| --- | --- | --- |
| `sidebar-meetings-label-renamed.png` | pending | サイドバー新ラベル反映 |
| `identity-conflicts-empty-jp.png` | pending | empty 文言・ガイド |
| `identity-conflicts-list-jp.png` | pending | 5 組のカード・日本語ラベル |
| `identity-conflicts-merge-confirm-jp.png` | pending | 統合 2 段階確認 |
| `identity-conflicts-dismiss-jp.png` | pending | 別人として確定モーダル |

機械可読 metadata は [phase11-capture-metadata.json](./phase11-capture-metadata.json)（status=pending_implementation）。

## screenshot を今作らない理由（Feedback 4）

runtime screenshot は user-gated のため、このサイクルでは撮影しない。staging seed apply / authenticated runtime / visual capture は外部操作を伴うため、ユーザー承認後に実施する。したがって:

- screenshot はコード landed 後の local/staging build で取得可能だが、撮影操作は user-gated（Phase 13）として分離する。
- staging seed apply / authenticated staging 撮影はユーザー承認後に実施する。
- 現時点の証跡の主ソースは上記 NON_VISUAL の focused vitest。

## 結論

- implemented_local_evidence_captured のため screenshot は **未取得（pending_implementation）**。
- 実装済みのため NON_VISUAL 証跡（focused vitest 群）→ VISUAL 証跡（screenshot 5 枚）の順で取得する。
- gate 上は §4 inventory で screenshot 行を Status=pending とし、物理 file 存在検査の対象外とする（present の行のみ検査される）。
