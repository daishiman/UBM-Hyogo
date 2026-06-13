# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 6 / 13（テスト拡充） |
| タスク種別 | UI task（VISUAL / implemented_local_evidence_captured） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

Phase 4 の基本テストに、失敗パスと回帰ガードを追加して恒久的な不変条件を機械検証する。旧英語表記の残存検知、生 revisionId 非表示の回帰、href / testid の不変回帰、`formatJstDate` の境界値を加え、将来の改修で用語が英語へ戻る・内部識別子が変わる事故を CI で塞ぐ。

## 実行タスク

1. **旧英語表記の grep gate**: `grep -rn 'CURRENT REVISION\|FORM SCHEMA GUIDE\|DIFF ITEMS\|Bulk Resolve\|Bulk Rollback\|ALIAS HISTORY' apps/web/src apps/web/app` が用語集ファイル（schemaGlossary.ts / schemaReviewTerms.ts / schemaHistoryGlossary.ts）を除外して 0 件であることを検証する手順を定義する（[shared-context.md §6](../../shared-context.md) DoD 最終行）。
2. **revisionId 非表示の回帰テスト**: T1 のフィクスチャ sentinel revisionId（`"000000aaaa"`）と hash 生値が、描画結果に出ないことを CurrentRevisionCard / RevisionAndAliasHistory の両方で回帰 assert する。
3. **href 不変の回帰**: サイドバー nav item の href `/admin/schema` が文言変更後も不変であることを T2/T4 で回帰 assert する。
4. **testid 不変の回帰**: ダッシュボード KPI の testid `admin-kpi-card-schema` が label 変更後も不変であることを KpiGrid spec で回帰 assert する。
5. **`formatJstDate` 境界値の追加**: Phase 4 の 7 ケースに加え、空文字 `""`・スペースのみ `"   "`・不正フォーマット `"2026/13/40"` の異常系で空文字を返し throw しないことを検証する。
6. **fail-soft 分岐の回帰**: `capturedAt` が null/無効のとき「取得:」行が描画されず、有効のとき日本語日付が出る両分岐を T1-f の回帰として固定する。
7. **旧文言非存在の網羅**: SchemaDiffPanel / モーダル / ダッシュボードで、§2 の各旧英語表記（`resolve 履歴`・`questionId`・`stableKey` の画面表示・`backfill` 生語）が画面本文に残っていないことを assert する（用語集カード内併記は除外）。

## 参照資料

- [shared-context.md](../../shared-context.md) — §2 リネーム正本 / §6 DoD（grep gate）
- [phase-4.md](../phase-4/phase-4.md) — 基本テストケース・AC 対応表
- [phase-5.md](../phase-5/phase-5.md) — 実装 Before/After
- `apps/web/src/lib/format/datetime.spec.ts` — `formatJstDate` 境界値追加対象

## 成果物

- 失敗パス / 回帰ガードのテストケース一覧
- 旧英語表記 grep gate の検証手順
- `formatJstDate` 境界値ケース表

### 失敗パス / 回帰ガード一覧

| ID | 種別 | 内容 |
|----|------|------|
| R-1 | grep gate | 旧英語 6 表記が用語集ファイル除外で 0 件 |
| R-2 | 回帰 | sentinel revisionId `000000aaaa` が非描画（Current / Revisions 両方） |
| R-3 | 回帰 | hash 生値が非描画 |
| R-4 | 回帰 | href `/admin/schema` 不変 |
| R-5 | 回帰 | testid `admin-kpi-card-schema` 不変 |
| R-6 | fail-soft | `capturedAt` null → 取得行非描画 / 有効 → 日本語日付描画 |
| R-7 | 旧文言非存在 | `resolve 履歴` / 画面表示の `questionId`・`stableKey` / `backfill` 生語が本文に無い |

### `formatJstDate` 境界値ケース表

| 入力 | 期待出力 | 観点 |
|------|---------|------|
| `""` | `""` | 空文字 fail-soft |
| `"   "` | `""` | スペースのみ（Date parse 失敗→NaN→空） |
| `"2026/13/40"` | `""` | 不正フォーマット |
| `"abc"` | `""` | 非日付文字列 |
| `null` | `""` | null ガード |
| `undefined` | `""` | undefined ガード |
| `"2026-06-09T19:34:19+09:00"` | `"2026年6月9日"` | 正常系（回帰固定） |

### grep gate 検証手順

```bash
grep -rn 'CURRENT REVISION\|FORM SCHEMA GUIDE\|DIFF ITEMS\|Bulk Resolve\|Bulk Rollback\|ALIAS HISTORY' \
  apps/web/src apps/web/app \
  | grep -v 'schemaGlossary.ts' \
  | grep -v 'schemaReviewTerms.ts' \
  | grep -v 'schemaHistoryGlossary.ts'
# 期待: 出力 0 行
```

## 統合テスト連携

- R-1 grep gate は CI / pre-flight でも実行でき、用語の英語回帰を恒久的にブロックする。
- R-2〜R-7 は focused vitest（Phase 4 と同コマンド）で実行し、回帰時に Red になる。
- `formatJstDate` 境界値は純粋関数テストとして高速実行され、line/branch カバレッジを Phase 7 へ供給する。

## 完了条件

- [ ] 旧英語 6 表記の grep gate 手順（用語集ファイル除外）が定義されている
- [ ] 生 revisionId / hash 非表示の回帰テスト（R-2/R-3）が定義されている
- [ ] href `/admin/schema` 不変の回帰（R-4）が定義されている
- [ ] testid `admin-kpi-card-schema` 不変の回帰（R-5）が定義されている
- [ ] `formatJstDate` の境界値（空文字 / スペースのみ / 不正フォーマット）が追加されている
- [ ] fail-soft 両分岐（R-6）が回帰として固定されている
