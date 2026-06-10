# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 5（実装）/ Phase 6（統合テスト） |
| 下流 | Phase 8（リファクタリング） |
| 状態 | spec_created |
| タスク種別 | implementation（VISUAL） |

## 目的

Phase 5 の実装と Phase 4/6 のテストに対し、**変更したファイル/ブロックに限定したカバレッジ**を測定し、AC-1〜AC-10 が漏れなくテストケース（TC-XX）と実装ファイルにトレースされていることを確認する。全体一律のカバレッジ閾値ではなく、**本タスクで新規追加・変更した attendance feature 配下のコード（特に新規純粋関数 `attendanceFollowLevel` と新規タブホスト `AttendanceDetailTabs`）の line/branch カバレッジ実測値を証跡に残す**ことを正本とする（[Feedback BEFORE-QUIT-002] / [Feedback 5]）。

## 実行タスク

1. **カバレッジ対象範囲の限定（[Feedback BEFORE-QUIT-002]）**: 計測対象を `apps/web/src/features/admin/attendance/` 配下の **本タスクで変更したファイルのみ**に限定する。全体一律 `--coverage` 指定はしない。
2. **新規 `attendanceFollowLevel` の branch 100% 確認（[Feedback 5]）**: 0 名（`none`）と 1 名以上（`warn`）の両分岐が TC で網羅され、branch カバレッジ 100% であることを実測値で残す。
3. **新規 `AttendanceDetailTabs` のタブ 3 状態確認**: `"session" | "member" | "top10"` の 3 状態すべてが TC で網羅され、排他表示・初期状態・タブ切替の各分岐が line/branch カバレッジに現れることを実測値で残す。
4. **AC × TC × 実装ファイルのトレーサビリティ表作成**: `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 を行、Phase 4 検証 TC・Phase 5 実装ファイルを列とする 1:1 対応表を作り、**未カバー AC が 0 件**であることを確認する。
5. **カバレッジ実測コマンドと期待値の確定**: `outputs/phase-07/main.md` にローカル計測コマンド（対象限定 `--coverage`）と、変更ブロックの line/branch 実測値の記録欄を定義する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 の正本 |
| 必須 | outputs/phase-02/component-map.md | `AttendanceDetailTabs` props/state signature |
| 必須 | outputs/phase-03/main.md | MINOR M-1/M-2/M-3 追跡 |
| 必須 | _shared-context.md §10 | Phase 1-3 裏取り確定（`attendanceFollowLevel`・既存 spec 5 本） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | カバレッジ範囲限定・変更ブロック実測の方針 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | primitive 非追加（AC-6）裏取り |

### 実コード anchor（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| 計測対象 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts`（`attendanceFollowLevel` 追加先） | branch 100% 対象 |
| 計測対象 | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`（新規） | タブ 3 状態対象 |
| 既存 spec | `apps/web/src/features/admin/attendance/__tests__/{KpiPanel,AttendanceTrendChart,AttendanceZoneDistributionChart}.spec.tsx` | 追従確認 |
| 既存 spec | `apps/web/src/features/admin/attendance/__tests__/{format-attendance,buildExportUrl}.spec.ts` | lib 既存カバレッジ |

## 実行手順

### ステップ 1: 対象限定カバレッジの計測（全体一律禁止）

- 計測は attendance feature 配下のみに限定する。リポジトリルートが vitest root のため、フルパス指定 + `--root .` を用いる（_shared-context §8 の既知の罠）。

```bash
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root . \
  --coverage \
  --coverage.include='apps/web/src/features/admin/attendance/**' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

- `--coverage.include` で attendance feature 配下に限定し、全体一律閾値を適用しない（[Feedback BEFORE-QUIT-002]）。

### ステップ 2: `attendanceFollowLevel` の branch 実測（[Feedback 5]）

- 0 名（`none`）/ 1 名以上（`warn`）の両分岐が TC で実行されることを確認し、branch カバレッジ **100%（2/2 分岐）** を実測値として `outputs/phase-07/main.md` の記録欄に転記する。
- 境界値 0 と 1 の両方が TC に存在することを確認する（off-by-one 防止）。

### ステップ 3: `AttendanceDetailTabs` のタブ 3 状態実測

- `"session" | "member" | "top10"` の初期表示 + 各切替後の排他表示が TC で網羅されることを確認し、該当行の line カバレッジと分岐カバレッジを記録欄に転記する。

### ステップ 4: AC マトリクスの作成と未カバー 0 件確認

- `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 × TC-XX × 実装ファイルの 1:1 対応表を作る。
- **未カバー AC が 0 件**であることを最終行で宣言する。AC ごとに「テストで担保 / 機械検証（gate）で担保」を区別する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-XX 定義をカバレッジトレースの起点として参照する |
| Phase 6 | 統合テスト（degrade・レスポンシブ DOM アサーション）の実行結果をカバレッジに合算 |
| Phase 8 | 未カバー 0 件・既存 spec 追従済みを前提にリファクタへ進む |
| Phase 9 | カバレッジ証跡を品質保証の入力にする |
| Phase 10 | GO/NO-GO 判定の根拠（AC 全カバー） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / Feedback | 確認内容 |
| --- | --- | --- |
| カバレッジ範囲限定 | [Feedback BEFORE-QUIT-002] | 計測が attendance feature 配下のみに限定され、全体一律指定でないこと |
| 変更ブロック実測証跡 | [Feedback 5] | 変更した関数/ブロックの line/branch 実測値が記録欄に残ること |
| branch 100%（`attendanceFollowLevel`） | AC-4 | 0 名 / 1+ 名の両分岐が TC で網羅され branch 2/2 であること |
| タブ 3 状態 | AC-3 | `AttendanceDetailTabs` の 3 状態すべてが TC で網羅されること |
| 既存 spec 追従（M-3） | AC-10 | `KpiPanel.spec.tsx` 等が hero 化後の DOM に追従し testid を維持していること |
| 未カバー AC ゼロ | AC-1〜AC-10 | ac-matrix.md で全 AC が TC または gate にマップされ、空セルが無いこと |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | カバレッジ範囲限定計測 | 7 | spec_created | attendance feature 配下のみ |
| 2 | `attendanceFollowLevel` branch 100% 実測 | 7 | spec_created | 0/1+ 両分岐 |
| 3 | `AttendanceDetailTabs` タブ 3 状態実測 | 7 | spec_created | session/member/top10 |
| 4 | AC × TC × 実装ファイル マトリクス | 7 | spec_created | ac-matrix.md |
| 5 | 未カバー AC 0 件確認 | 7 | spec_created | main.md 最終宣言 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | カバレッジ方針・範囲限定コマンド・変更ブロック line/branch 実測記録欄 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-10 × TC-XX × 実装ファイル 1:1 トレーサビリティ表 |
| メタ | artifacts.json | Phase 7 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-07/main.md` にカバレッジ範囲限定方針（attendance feature 配下のみ）が書かれている
- [ ] カバレッジ計測コマンドが `--coverage.include` で対象限定されており、全体一律指定でない
- [ ] `attendanceFollowLevel` の branch 100%（0 名 / 1+ 名 両分岐）の実測記録欄がある
- [ ] `AttendanceDetailTabs` のタブ 3 状態（session/member/top10）の line/branch 実測記録欄がある
- [ ] `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 × TC-XX × 実装ファイルの 1:1 対応表が完成している
- [ ] ac-matrix.md で未カバー AC が 0 件であることが宣言されている
- [ ] 既存 spec 5 本（KpiPanel / TrendChart / ZoneDistribution / format-attendance / buildExportUrl）の追従状況が記録されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-07/{main,ac-matrix}.md` が配置済み
- [ ] カバレッジ対象が変更ファイルに限定され、全体一律指定でない（[Feedback BEFORE-QUIT-002]）
- [ ] 変更ブロックの line/branch 実測値が証跡として残る方針になっている（[Feedback 5]）
- [ ] AC-1〜AC-10 すべてが TC または gate にマップされ、未カバーが 0 件である
- [ ] artifacts.json の Phase 7 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 8（リファクタリング）
- 引き継ぎ事項: AC マトリクス（全 AC カバー）/ 変更ブロックカバレッジ実測値 / 既存 spec 追従済み
- ブロック条件: 未カバー AC が 1 件でも残る、または `attendanceFollowLevel` の branch が 100% 未満の場合は Phase 4/5 に戻る
