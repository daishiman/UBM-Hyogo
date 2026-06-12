# Phase 7: カバレッジ

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [shared-context.md](shared-context.md)（SSOT）/ [phase-4-test-plan.md](phase-4-test-plan.md) / [phase-6-test-additions.md](phase-6-test-additions.md)
- 本 Phase の責務: 本タスクで**変更したファイル/ブロックに絞った**カバレッジ目標を定義する。全ファイル一律の数値目標は置かず、変更範囲を明示する（Feedback BEFORE-QUIT-002）。

## カバレッジ方針

1. **変更範囲限定**: 純関数（`formatJstDateTimeWithSeconds` / `formatBooleanJa`）と用語集定数、各コンポーネントの変更行のみを対象とする。既存の無変更コード（既存 `formatJstDateTime`・送信日時描画・監査ログ・fetch ロジック等）は本タスクのカバレッジ目標の対象外。
2. **純関数は line/branch 100% を目標**: 分岐が単純で全経路をテストで網羅できるため。
3. **コンポーネントは変更行の表示分岐を網羅**: ラベル日本語化・真偽値分岐・見出し差し替えの描画経路を DOM テストでカバー。新規 fetch 分岐は追加しないため、既存の error/status 分岐は対象外（無変更）。

## ファイル別カバレッジ目標

| 対象 | 範囲 | line 目標 | branch 目標 | 担保 TC |
| --- | --- | --- | --- | --- |
| `datetime.ts` の `formatJstDateTimeWithSeconds` | 関数全体（`Number.isNaN` 分岐含む） | **100%** | **100%**（正常パス + fail-soft の 2 分岐） | TC-DT-01〜12 |
| `datetime.ts` の `JST_PARTS_FORMATTER` | formatter 初期化（実行で踏む） | 100% | n/a | TC-DT-01 で踏む |
| `datetime.ts` の既存 `formatJstDateTime` / `JST_FORMATTER` | **無変更** | 対象外 | 対象外 | （任意スモークのみ・目標非対象） |
| `memberSystemFieldGlossary.ts` の `formatBooleanJa` | 関数全体（三項の両分岐） | **100%** | **100%**（true / false） | TC-GL-12, TC-GL-13 |
| `memberSystemFieldGlossary.ts` の定数群 | export 定数（評価でカバー） | **100%** | n/a（分岐なし） | TC-GL-01〜11 |
| `MembersTable.tsx` の最終更新列（161-163 行相当） | 変更 `<td>` の描画行 | **変更行 100%** | 列描画に分岐なし（fail-soft は helper 側） | TC-MT-LM-01〜03 |
| `MemberDrawer.tsx` の IDENTITY（229-254 行） | 見出し + 4 行のラベル/併記/真偽値描画 | **変更行 100%** | 真偽値 2 箇所の true/false 経路（TC で両値） | TC-MD-01〜10 |
| `MemberDiagnosticsPanel.tsx` の DIAGNOSTICS（11/50-80 行） | 見出し + 5 ラベル/併記 + 真偽値 3 箇所（`formatBooleanJa` 化） | **変更行 100%** | 真偽値 3 箇所の true/false 経路（TC-DG-08/09 で全 true / 全 false） | TC-DG-01〜10 |

## 対象外（明示・無変更コード）

| 対象外 | 理由 |
| --- | --- |
| 既存 `formatJstDateTime` / `JST_FORMATTER` | 本タスクで変更しない（他所利用保護）。カバレッジは既存テストの範疇 |
| `MemberDrawer.tsx` の送信日時（201-205）/ 退会済み（257-272）/ 監査ログ（274-299） | 本タスク非接触（SSOT §6 F4・OOS-1/2） |
| `MemberDiagnosticsPanel.tsx` の `useEffect` fetch / `role="alert"` / `role="status"` 分岐 | fetch ロジック・error/status 文言は無変更。表示テキスト差し替えのみが本タスク対象。error 分岐は Phase 4/6 の任意スモークで触れるが**目標非対象** |
| `MembersTable.tsx` の他列・選択・ページネーション | 本タスク非接触（既存 TC が担保） |
| `apps/api` / `packages/shared` / D1 / Form | AC-10 により非変更。カバレッジ対象外 |

## 計測方法（任意・参考）

カバレッジ数値の機械計測は本タスクの必須 gate ではない（focused vitest の PASS が DoD・SSOT §8）。数値を確認する場合のみ:

```bash
mise exec -- pnpm exec vitest run --coverage \
  --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
```

> 上記は変更ファイルに限定した focused 計測。`datetime.ts` と `memberSystemFieldGlossary.ts` の純関数で 100% を確認できれば本タスクのカバレッジ目標達成と判断する。コンポーネントは「変更行が TC で踏まれていること」を担保すれば十分とし、ファイル全体の数値ノルマは課さない（BEFORE-QUIT-002: 変更範囲外を無理にカバーしない）。

## カバレッジ ↔ AC 対応

| AC | カバレッジ担保 |
| --- | --- |
| AC-2（fail-soft） | `formatJstDateTimeWithSeconds` の `Number.isNaN` 分岐 100% |
| AC-4 / AC-6（真偽値両分岐） | `formatBooleanJa` branch 100% + 各コンポーネント真偽値描画行 |
| AC-7（SSOT 集約） | glossary 定数 line 100% |
| AC-1 / AC-3 / AC-5 / AC-8（日本語化描画） | 各コンポーネント変更行 100% |

## 完了条件（Phase 7）

- 純関数 2 つ（`formatJstDateTimeWithSeconds` / `formatBooleanJa`）に line/branch 100% 目標を設定した。
- 各コンポーネントの変更行に限定したカバレッジ目標を設定した。
- 無変更コード・apps/api 等の対象外を明示した（全ファイル一律目標を置かない）。
- 計測方法（任意）と AC 対応を記録した。
