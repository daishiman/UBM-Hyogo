# Phase 7: カバレッジ確認 — issue-1198 admin-audit dead table CSS cleanup

## 1. coverage 対象範囲の明示 [Feedback BEFORE-QUIT-002]

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `apps/web/src/styles/globals.css` のみ |
| 変更種別 | CSS 3 ブロックの削除（純減・ロジック変更なし） |
| Vitest line coverage 計測 | **非該当**。変更対象は CSS（`.css`）であり、Vitest の line/branch coverage は TS/TSX の実行行を計測する仕組みのため、CSS ファイルは coverage 計測の対象外 |
| coverage 担保手段 | (a) focused Vitest 2 本の PASS（描画契約の回帰確認）+ (b) 削除後 grep gate（構造検証） |

→ 本タスクは「CSS 削除のみ」のため、Vitest の数値カバレッジ（line %）を新規に上げる/満たす対象が存在しない。カバレッジは**実行行カバレッジではなく、描画契約の回帰確認と構造 grep gate**で担保する。

## 2. focused Vitest 2 本が担保する内容

| テスト | 担保内容 |
| --- | --- |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | フィルタ適用パネル / タイムライン構造の描画契約が dead CSS 削除後も不変 |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 監査ログカード（`.admin-audit-card`）の描画契約が dead CSS 削除後も不変 |

実行コマンド（shared-context §4・AC-5）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

- 期待: **全 PASS**。この 2 本が削除後も GREEN であることで、「カード UI コンポーネントの描画契約が dead CSS 削除後も不変」を担保する。
- 削除対象 3 セレクタはカード UI から 0 参照（AC-1 で証跡化）のため、これらの PASS は dead CSS への非依存を裏取りする。

## 3. 変更ブロック以外を対象外と明記

- カバレッジ評価対象は `globals.css` の削除 3 ブロック（`.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`）に限る。
- 以下は本タスクの**対象外**（変更しないため coverage 評価の対象にしない）:
  - `.admin-audit-guide` 以降の新規カード系 CSS（現行 UI 使用中・無変更）
  - `.tbl` 汎用ユーティリティ（現行ヒットなし）（他画面使用・無変更）
  - `apps/api` / D1 / Google Form / TS / TSX（不可侵）

## 4. 最終確認（AC との対応）

| AC | 確認手段 | 本 Phase での扱い |
| --- | --- | --- |
| AC-4 | typecheck / lint / verify:tokens 全 PASS | 静的検証で担保（line coverage 非該当） |
| AC-5 | focused Vitest 2 本 全 PASS | 描画契約の回帰確認 = 本 Phase のカバレッジ担保の中核 |
| AC-2/AC-3 | 削除後 grep gate | 構造検証で coverage を補完 |

## 完了条件

- [ ] coverage 対象範囲（globals.css のみ・CSS は Vitest line coverage 非該当）を明示した [BEFORE-QUIT-002]
- [ ] focused Vitest 2 本の PASS が「カード UI の描画契約が dead CSS 削除後も不変」を担保する旨を記述した
- [ ] 変更ブロック以外（カード系 CSS / `.tbl` / apps/api / D1）を対象外と明記した
