# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 7（カバレッジ確認） |
| 下流 | Phase 9（品質保証） |
| 状態 | spec_created |
| タスク種別 | implementation（VISUAL） |

## 目的

Phase 7 で「未カバー AC ゼロ・既存 spec 追従済み」を確認した状態を前提に、**挙動を一切変えずに**コードの重複（duplicate）と navigation drift を削減する。具体的には (1) MINOR M-1 の route 二重 className/testid の一元化、(2) `KpiPanel` から PRIMARY hero への責務分離、(3) 8 セクション flat → 3 層構造の DOM ツリー整理、(4) `globals.css` の `.attendance-*` クラス重複/未使用の削減 を `対象/Before/After/理由` テーブル（[Feedback RT-03]）で記録し、各行に「挙動不変であること」の確認方法を添える。

## 実行タスク

1. **M-1 二重 className/testid の一元化**: `page.tsx` と `AttendanceAnalyticsPage` が共に持つ `attendance-analytics-page` 系 class/testid を、3 層ラッパー名（`attendance-zones` 等）へ分離し testid 衝突を解消する。
2. **`KpiPanel` → PRIMARY hero への責務分離**: 5 枚均等 KPI を、PRIMARY hero（出席率特大 + 要フォロー）と secondary stat に責務分離した前後を記録する。
3. **8 セクション flat → 3 層構造の DOM ツリー Before/After**: フラット縦積みの DOM ツリーと、PRIMARY/TREND/DETAIL の 3 層ネスト DOM ツリーを Before/After で示す。
4. **`globals.css` `.attendance-*` クラス整理**: 重複・未使用クラスを削減し、3 層用クラスへ集約した前後を記録する。
5. **挙動不変の確認方法添付**: 各リファクタ行に「Phase 7 の TC 再実行で PASS」「testid 維持」「screenshot 差分なし（Phase 11）」等の確認手段を添える。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-03/main.md §5 | MINOR M-1/M-2/M-3 追跡 |
| 必須 | outputs/phase-02/component-map.md | Before/After 責務（KpiPanel hero 化） |
| 必須 | outputs/phase-02/layout-blueprint.md | 3 層クラス・token 割当 |
| 必須 | outputs/phase-07/ac-matrix.md | 挙動不変担保 TC の特定 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | リファクタの挙動不変担保パターン |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 既存 primitive 集約・新規 primitive 禁止（AC-6） |

### 実コード anchor（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| 対象 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | M-1 二重 className 元 1 |
| 対象 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | M-1 二重 className 元 2 / 3 層統括 |
| 対象 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | hero 責務分離 |
| 対象 | `apps/web/src/styles/globals.css`（`.attendance-*` 系） | クラス重複/未使用削減 |

## 実行手順

### ステップ 1: before-after テーブルの作成

- `outputs/phase-08/before-after.md` に `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブルを作る（[Feedback RT-03]）。
- 最低限の 4 行（M-1 一元化 / KpiPanel→hero 責務分離 / flat→3 層 DOM ツリー / globals.css クラス整理）を必ず含める。

### ステップ 2: リファクタ方針の確定

- `outputs/phase-08/main.md` に「duplicate（M-1）と navigation drift の削減方針」を書く。
- navigation drift = 3 層化に伴いゾーン見出し（h2）とラッパー命名が散らばるリスク。命名規約（`attendance-zone-{primary,trend,detail}`）で集約する方針を記す。

### ステップ 3: 挙動不変の機械確認

- Phase 7 の TC を再実行し、全 PASS を確認する（リファクタで失敗が出れば挙動が変わった証拠）。

```bash
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .
```

- testid が維持されていることを grep で確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | リファクタ前の TC 全 PASS を不変基準として参照 |
| Phase 9 | クラス整理後の `globals.css` を token-audit（HEX ゼロ）の対象にする |
| Phase 11 | screenshot 差分なし（挙動不変）を visual で確認 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | Before/After の責務境界と 3 層 DOM 構造を照合 |
| Phase 5 | `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` | 実装後の対象ファイルと手順をリファクタ対象へ接続 |
| Phase 6 | `outputs/phase-06/main.md` / `outputs/phase-06/failure-cases.md` | 境界値・degrade ケースを挙動不変確認に接続 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / MINOR | 確認内容 |
| --- | --- | --- |
| 二重 className 解消 | M-1 / AC-10 | `page.tsx` と `AttendanceAnalyticsPage` の testid 衝突が解消され、既存 spec が依存する testid は維持される |
| 責務分離の純化 | AC-1 | `KpiPanel` が hero と secondary に責務分離され、両者が同一 component に混在しない |
| DOM 階層の論理性 | AC-2 / AC-9 | flat → 3 層で h1>h2>h3 が崩れない |
| クラス重複削減 | AC-5 | `globals.css` の `.attendance-*` 未使用/重複が削減され、HEX が増えない |
| 挙動不変 | AC-10 | 全リファクタ行に確認方法が添えられ、TC 全 PASS で挙動不変が担保される |
| 新規 primitive 非増加 | AC-6 | クラス整理で `components/ui/` に新規追加が発生しない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | M-1 二重 className/testid 一元化 | 8 | spec_created | before-after.md 行 1 |
| 2 | KpiPanel → hero 責務分離 | 8 | spec_created | before-after.md 行 2 |
| 3 | flat → 3 層 DOM ツリー | 8 | spec_created | before-after.md 行 3 |
| 4 | globals.css クラス整理 | 8 | spec_created | before-after.md 行 4 |
| 5 | 挙動不変の確認方法添付 | 8 | spec_created | 各行に確認手段 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタ方針（duplicate / navigation drift 削減） |
| ドキュメント | outputs/phase-08/before-after.md | 対象/Before/After/理由/挙動不変確認 の 5 列テーブル |
| メタ | artifacts.json | Phase 8 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-08/main.md` に duplicate（M-1）と navigation drift の削減方針が書かれている
- [ ] `outputs/phase-08/before-after.md` が `対象/Before/After/理由` テーブル形式である（[Feedback RT-03]）
- [ ] テーブルに最低 4 行（M-1 一元化 / KpiPanel→hero 責務分離 / flat→3 層 DOM / globals.css 整理）が含まれる
- [ ] 各行に「挙動不変であること」の確認方法が添えられている
- [ ] リファクタ後も Phase 7 の TC が全 PASS する方針が記されている
- [ ] 新規 primitive 追加ゼロ・HEX 非増加（AC-5/AC-6）がリファクタで維持される

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-08/{main,before-after}.md` が配置済み
- [ ] before-after テーブルの全行に挙動不変の確認方法がある（AC-10）
- [ ] M-1 の testid 衝突解消で既存 spec が依存する testid を破壊しない
- [ ] リファクタが表現層に閉じ、API/D1/shared 型に触れない（AC-7）
- [ ] artifacts.json の Phase 8 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 9（品質保証）
- 引き継ぎ事項: before-after テーブル / クラス整理後の globals.css / 挙動不変 TC 全 PASS
- ブロック条件: リファクタで Phase 7 の TC が 1 件でも FAIL する場合は挙動が変わったため差し戻す
