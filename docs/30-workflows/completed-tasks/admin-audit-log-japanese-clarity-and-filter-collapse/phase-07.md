[実装区分: 実装仕様書]

# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 5（実装）/ Phase 6（テスト拡充） |
| 下流 | Phase 8（リファクタリング） |
| 状態 | completed |
| タスク種別 | implementation（VISUAL） |

## 目的

Phase 5 の実装と Phase 4/6 のテストに対し、**変更したファイル / ブロックに限定したカバレッジ**を測定し（[Feedback BEFORE-QUIT-002]）、AC-1〜AC-12 が漏れなくテストケース（TC-XX / TC-E-XX）または grep gate にトレースされていることを確認する。全体一律のカバレッジ閾値ではなく、**本タスクで変更した監査ログ component 群（特に新規 helper `describeAuditAction` / `describeAuditTargetType` / `describeAuditField`）の line/branch カバレッジ実測値を証跡に残す**ことを正本とする。`describeAuditAction` / `describeAuditTargetType` は「登録済 → 日本語ラベル」「未登録 → 生コード fallback / null → 『—』」の両分岐を持つため branch 100% を必達とする。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | カバレッジ方針・範囲限定コマンド・変更ブロック line/branch 実測記録欄 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-12 × テスト/検証手段 1:1 トレーサビリティ表 |
| メタ | artifacts.json | Phase 7 を completed に維持 |

## 実行タスク

1. **カバレッジ対象範囲の限定（[Feedback BEFORE-QUIT-002]）**: 計測対象を `apps/web/src/components/admin/` 配下の **本タスクで変更したファイルのみ**（`auditGlossary.ts` / `AuditLogPanel.tsx` / `AuditLogCard.tsx` / `auditAppliedFilters.ts`）に限定する。全体一律 `--coverage` 指定はしない。
2. **describe helper の branch 100% 確認**: `describeAuditAction`（登録済 / 未登録）、`describeAuditTargetType`（登録済 / 未登録 / null）、`describeAuditField`（登録済 / 未登録）の各分岐が TC で網羅され、branch カバレッジ 100% であることを実測値で残す。
3. **2 層フィルタの open 分岐確認**: 詳細フィルタ全空（閉）/ 値あり（開）の両分岐が TC で網羅され、line/branch カバレッジに現れることを記録する。
4. **AC × テスト × 検証手段のトレーサビリティ表作成**: `outputs/phase-07/ac-matrix.md` に AC-1〜AC-12 を行、Phase 4/6 の TC・grep gate（`verify-design-tokens` / `git diff` ゼロ）を列とする 1:1 対応表を作り、**未カバー AC が 0 件**であることを確認する。各 AC が「テストで担保 / grep gate で担保」のどちらかを明示する。
5. **カバレッジ実測コマンドと期待値の確定**: `outputs/phase-07/main.md` にローカル計測コマンド（対象限定 `--coverage.include`）と、変更ブロックの line/branch 実測値の記録欄を定義する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md §5 | AC-1〜AC-12 の正本 |
| 必須 | outputs/phase-04/test-plan.md | 正常系 TC-XX |
| 必須 | outputs/phase-06/failure-cases.md | 異常系 TC-E-XX |
| 必須 | outputs/phase-05/runbook.md | helper 分岐 / details open 条件 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | カバレッジ範囲限定・変更ブロック実測の方針 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | primitive 非追加（AC-10）裏取り |

### 実コード anchor（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| 計測対象 | `apps/web/src/components/admin/auditGlossary.ts`（describe helper 追加先） | branch 100% 対象 |
| 計測対象 | `apps/web/src/components/admin/AuditLogPanel.tsx`（2 層 details） | open 分岐対象 |
| 計測対象 | `apps/web/src/components/admin/AuditLogCard.tsx` | action/targetType 表示 |
| 計測対象 | `apps/web/src/components/admin/auditAppliedFilters.ts` | チップ日本語化 |

## 実行手順

### ステップ 1: 対象限定カバレッジの計測（全体一律禁止）

- 計測は監査ログ component 配下の変更ファイルのみに限定する。リポジトリルートが vitest root のため、フルパス指定 + `--root=../..` を用いる（SSOT §9 / 既知の罠）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/components/admin/auditGlossary.ts' \
  --coverage.include='apps/web/src/components/admin/auditAppliedFilters.ts' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

- `--coverage.include` で変更ファイルに限定し、全体一律閾値を適用しない（[Feedback BEFORE-QUIT-002]）。

### ステップ 2: describe helper の branch 実測

- `describeAuditAction`（登録済 / 未登録）、`describeAuditTargetType`（登録済 / 未登録 / null）、`describeAuditField`（登録済 / 未登録）の各分岐が TC で実行されることを確認し、branch カバレッジ **100%** を実測値として `outputs/phase-07/main.md` の記録欄に転記する。

### ステップ 3: AC マトリクスの作成と未カバー 0 件確認

- `outputs/phase-07/ac-matrix.md` に AC-1〜AC-12 × TC（または gate）の 1:1 対応表を作る。**未カバー AC が 0 件**であることを最終行で宣言する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 正常系 TC-XX をカバレッジトレースの起点として参照 |
| Phase 6 | 異常系 TC-E-XX をカバレッジに合算 |
| Phase 8 | 未カバー 0 件・既存 spec 追従済みを前提にリファクタへ進む |
| Phase 9 | カバレッジ証跡を品質保証の入力にする |
| Phase 10 | GO/NO-GO 判定の根拠（AC 全カバー） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / Feedback | 確認内容 |
| --- | --- | --- |
| カバレッジ範囲限定 | [Feedback BEFORE-QUIT-002] | 計測が変更ファイル配下のみに限定され、全体一律指定でないこと |
| 変更ブロック実測証跡 | [Feedback 5] | 変更した helper / ブロックの line/branch 実測値が記録欄に残ること |
| branch 100%（describe helper） | AC-3 / AC-4 | 登録済 / 未登録 / null の全分岐が TC で網羅され branch 100% であること |
| details open 分岐 | AC-2 | 全空（閉）/ 値あり（開）の両分岐が TC で網羅されること |
| 英語キー名ゼロ | AC-4 | チップ・ラベルに英語キー名が出ないことが grep で担保されること |
| 未カバー AC ゼロ | AC-1〜AC-12 | ac-matrix.md で全 AC が TC または gate にマップされ、空セルが無いこと |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | カバレッジ範囲限定計測 | 7 | completed | 変更ファイル配下のみ |
| 2 | describe helper branch 100% 実測 | 7 | completed | 登録済/未登録/null |
| 3 | details open 分岐実測 | 7 | completed | 全空/値あり |
| 4 | AC × テスト × gate マトリクス | 7 | completed | ac-matrix.md |
| 5 | 未カバー AC 0 件確認 | 7 | completed | main.md 最終宣言 |

## 完了条件

- [ ] `outputs/phase-07/main.md` にカバレッジ範囲限定方針（変更ファイル配下のみ）が書かれている
- [ ] カバレッジ計測コマンドが `--coverage.include` で対象限定されており、全体一律指定でない（[Feedback BEFORE-QUIT-002]）
- [ ] describe helper の branch 100%（登録済 / 未登録 / null 全分岐）の実測記録欄がある
- [ ] 2 層フィルタの open 分岐（全空 / 値あり）の line/branch 実測記録欄がある
- [ ] `outputs/phase-07/ac-matrix.md` に AC-1〜AC-12 × TC（または gate）の 1:1 対応表が完成している
- [ ] ac-matrix.md で未カバー AC が 0 件であることが宣言されている
- [ ] 各 AC が「テストで担保 / grep gate で担保」のどちらかで区別されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-07/{main,ac-matrix}.md` が配置済み
- [ ] カバレッジ対象が変更ファイルに限定され、全体一律指定でない（[Feedback BEFORE-QUIT-002]）
- [ ] 変更ブロックの line/branch 実測値が証跡として残る方針になっている（[Feedback 5]）
- [ ] AC-1〜AC-12 すべてが TC または gate にマップされ、未カバーが 0 件である
- [ ] artifacts.json の Phase 7 ステータスが completed に整合している

## 次Phase

- 次: Phase 8（リファクタリング）
- 引き継ぎ事項: AC マトリクス（全 AC カバー）/ 変更ブロックカバレッジ実測値 / 既存 spec 追従済み
- ブロック条件: 未カバー AC が 1 件でも残る、または describe helper の branch が 100% 未満の場合は Phase 4/5 に戻る
