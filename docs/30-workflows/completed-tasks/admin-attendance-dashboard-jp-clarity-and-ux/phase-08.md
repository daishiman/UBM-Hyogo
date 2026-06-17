# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 7（カバレッジ確認 / AC マトリクス） |
| 下流 | Phase 9（品質保証） |
| 状態 | spec_created |

## 目的

Phase 7 で「未カバー AC ゼロ・既存 spec 追従済み」を確認した状態を前提に、**挙動・DOM 構造を一切変えずに**、文字列リネーム（R/S/J/U）に伴って発生し得る**重複文言のドリフトと命名の不一致を除去**する。本タスクは新規ロジックを作らない文字列置換中心のため、リファクタの焦点は「(1) 同じ概念を指す日本語が画面内で 1 表現に統一されているか（『開催回』『出席の移り変わり』などの単一化）、(2) リネーム後に Before 文字列を参照したまま残骸化したコメント/定数/テスト名がないか、(3) 軽微 CSS（U-03）が `var(--ubm-*)` 経由で重複ルールを生んでいないか」に置く。各リファクタ行は `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブル（[Feedback RT-03]）で記録する。

## 実行タスク

1. **重複文言の単一化（concept→1 表現）**: 同一概念を指す日本語が複数表現に分岐していないかを確認し、用語リネーム正本表（§2）の After を唯一の正として統一する。特に「開催回」（S 系・複数ファイル）/「出席の移り変わり」（R-03 と J-01 の aria-label）/「出席回数べつ」（R-06 と J-09）の 3 概念で表記揺れが起きやすいため、ファイル横断で一致させる。
2. **Before 文字列の残骸除去**: リネーム対象の Before 文字列（`PRIMARY` / `セッション` / `区画` / `pt` 等）が、画面表示以外の箇所（コメント・定数名の補足文・テスト記述名・`aria-label`）に残骸として残っていないかを `grep` で洗い出し、意味が誤解されない範囲で After 系に揃える（定数キー名・型名・testid は変更しない＝AC-8）。
3. **命名一貫性の確認（識別子は不変）**: コンポーネント PascalCase / 関数 camelCase / CSS `.attendance-*` BEM 風という current 規則は維持し、**新規識別子を一切増やさない**（[FB-SDK-07-4] = 命名ドリフト発生源を持たない）。`DETAIL_OPTIONS` / `PERIOD_PRESETS` 等の定数キーは英語のまま、`label` 値のみ日本語化されていることを確認する。
4. **軽微 CSS（U-03）の重複ルール削減**: 文言長変更に伴い追加し得る `white-space` / `gap` 調整が、既存 `.attendance-*` ルールと重複しないよう集約し、全プロパティが `var(--ubm-*)` 経由であることを確認する。新規クラスは原則作らず、既存セレクタへの property 追加に留める。
5. **挙動不変の確認方法添付**: 各リファクタ行に「Phase 7 の focused vitest 全 PASS」「testid/role/aria キー維持を grep で確認」「Phase 11 screenshot 差分は意図した文言変化のみ」等の確認手段を添える。

## 実行手順

### ステップ 1: before-after テーブルの作成

- `outputs/phase-08/before-after.md` に `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブルを作る（[Feedback RT-03]）。
- 最低限の 4 行（開催回の単一化 / 「出席の移り変わり」aria-label とh2の一致 / Before 文字列の残骸除去 / globals.css 軽微調整の集約）を必ず含める。
- 本タスクは**構造リファクタではなく文言の単一化**が主であることを冒頭注記する（DOM ツリーは Before/After で不変＝AC-4/AC-8）。

### ステップ 2: 単一化方針の確定（main.md）

- `outputs/phase-08/main.md` に「重複文言の単一化方針」と「navigation/命名ドリフトを生まない方針」を書く。
- 単一化対象の 3 概念（開催回 / 出席の移り変わり / 出席回数べつ）について、影響ファイルと統一後の正表記を表で固定する。
- 「識別子（定数キー・型名・testid・href・role・aria キー）は不変」を明記し、変更は表示文字列・aria-label の**値**・軽微 CSS に限ると宣言する（AC-7/AC-8）。

### ステップ 3: Before 文字列残骸の機械洗い出し

```bash
# 画面表示以外（コメント/定数補足/テスト名/aria-label 値）に Before 文字列が残骸化していないか
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|セッション|ユニーク|トレンド|区画|出席回数帯|CSVエクスポート" \
  apps/web/src/features/admin/attendance \
  apps/web/app/\(admin\)/admin/dashboard/attendance
```

- ヒットした各行を「画面表示（=リネーム済み）／コメント・テスト名（=残骸候補）／定数キー（=不変で正）」に分類し、残骸候補のみ After 系へ揃える。

### ステップ 4: 挙動不変の機械確認

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
```

- リファクタ後も focused vitest が全 PASS であることを確認する（FAIL が出れば挙動が変わった証拠＝差し戻し）。
- testid / role / aria キーが維持されていることを grep で確認する（AC-8）。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md §2（R/S/J/U 正本表） | 単一化の After 正表記 |
| 必須 | outputs/phase-02/change-map.md | ファイル別変更マップ（残骸洗い出しの起点） |
| 必須 | outputs/phase-07/ac-matrix.md | 挙動不変担保 TC の特定 |
| 必須 | outputs/phase-05/runbook.md | 実装後の対象ファイルとリネーム適用結果 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | リファクタの挙動不変担保パターン |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 既存 primitive 集約・新規 primitive 禁止（AC-6） |

### 実コード anchor（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| 対象 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | h2/h3/intro と aria-label の表記一致 |
| 対象 | `apps/web/src/features/admin/attendance/components/AttendanceTrendChart.tsx` | 「出席の移り変わり」aria-label（J-01）と R-03 の一致 |
| 対象 | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 「出席回数べつの人数」aria-label（J-09）と R-06 の一致 |
| 対象 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | `DETAIL_OPTIONS`/`PERIOD_PRESETS` キー不変・label 値のみ日本語 |
| 対象 | `apps/web/src/styles/globals.css`（`.attendance-*` 系） | U-03 軽微調整の重複削減 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | リファクタ前の focused vitest 全 PASS を不変基準として参照 |
| Phase 9 | 単一化後の `globals.css` を token-audit（HEX ゼロ）の対象にする |
| Phase 11 | screenshot 差分が「意図した文言変化のみ」（挙動不変）であることを visual で確認 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/main.md` / `outputs/phase-02/change-map.md` | ファイル別変更マップを残骸洗い出しの起点にする |
| Phase 5 | `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` | 実装でリネーム適用済みの対象ファイルをリファクタ対象へ接続 |
| Phase 6 | `outputs/phase-06/main.md` / `outputs/phase-06/regression-cases.md` | After 文言固定の回帰ケースを挙動不変確認に接続 |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | 挙動不変担保 TC を特定 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 文言の単一化 | AC-1 / AC-2 / AC-3 | 同一概念（開催回 / 出席の移り変わり / 出席回数べつ）がファイル横断で 1 表現に統一されている |
| 残骸ゼロ | AC-1 / AC-2 | Before 文字列がコメント・テスト名・aria-label 値に残骸化していない（定数キーは不変で正） |
| 識別子不変 | AC-7 / AC-8 | 定数キー・型名・testid・href・role・aria キーを変更していない（変更は表示文字列と aria-label 値のみ） |
| 新規識別子ゼロ | AC-6 | 新規 component / primitive / hook / util / CSS クラスを増やさない |
| CSS 重複削減 | AC-5 | U-03 の軽微調整が既存ルールと重複せず全プロパティ `var(--ubm-*)` 経由・HEX 非増加 |
| 挙動不変 | AC-10 | 全リファクタ行に確認方法が添えられ、focused vitest 全 PASS で挙動不変が担保される |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複文言の単一化（3 概念） | 8 | spec_created | before-after.md 行 1 |
| 2 | aria-label と h2 の表記一致 | 8 | spec_created | before-after.md 行 2 |
| 3 | Before 文字列の残骸除去 | 8 | spec_created | before-after.md 行 3 |
| 4 | globals.css 軽微調整の集約 | 8 | spec_created | before-after.md 行 4 |
| 5 | 挙動不変の確認方法添付 | 8 | spec_created | 各行に確認手段 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 重複文言の単一化方針・命名ドリフト非発生方針 |
| ドキュメント | outputs/phase-08/before-after.md | 対象/Before/After/理由/挙動不変確認 の 5 列テーブル |
| メタ | artifacts.json | Phase 8 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-08/main.md` に重複文言の単一化方針（開催回 / 出席の移り変わり / 出席回数べつ）が書かれている
- [ ] `outputs/phase-08/before-after.md` が `対象/Before/After/理由` テーブル形式である（[Feedback RT-03]）
- [ ] テーブルに最低 4 行（開催回単一化 / aria-label と h2 一致 / Before 残骸除去 / globals.css 集約）が含まれる
- [ ] 各行に「挙動不変であること」の確認方法が添えられている
- [ ] リファクタ後も Phase 7 の focused vitest が全 PASS する方針が記されている
- [ ] 新規 component/primitive/識別子 追加ゼロ・HEX 非増加（AC-5/AC-6）がリファクタで維持される

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-08/{main,before-after}.md` が配置済み
- [ ] before-after テーブルの全行に挙動不変の確認方法がある（AC-10）
- [ ] 定数キー・型名・testid・href・role・aria キーを変更しない（AC-7/AC-8）方針が明記されている
- [ ] リファクタが表現層に閉じ、API/D1/shared 型に触れない（AC-7）
- [ ] artifacts.json の Phase 8 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 9（品質保証）
- 引き継ぎ事項: before-after テーブル / 単一化後の globals.css / 挙動不変 focused vitest 全 PASS
- ブロック条件: リファクタで Phase 7 の focused vitest が 1 件でも FAIL する場合は挙動が変わったため差し戻す
