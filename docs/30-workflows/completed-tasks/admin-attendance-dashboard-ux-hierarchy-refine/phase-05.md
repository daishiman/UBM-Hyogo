# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装 |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 4（テスト作成・Red 設計） |
| 下流 | Phase 6（テスト拡充） |
| 状態 | spec_created |

## 目的

Phase 4 で設計した TC-XX を Green にする、出席ダッシュボードの 3 層階層リファイン（PRIMARY / TREND / DETAIL）を実装する。具体的には (1) 新規 `AttendanceDetailTabs`（Segmented + internal state）でセッション別/会員別/TOP10 を排他タブ統合、(2) 新規純粋関数 `attendanceFollowLevel` と `data-attendance-follow` 属性で要フォロートーンを切替、(3) `KpiPanel` を出席率特大 hero + secondary に分離、(4) `AttendanceAbsenteeAlert` を PRIMARY 2 枚目 hero に格上げ、(5) `AttendanceAnalyticsPage` を 3 ゾーン分配へ統括組み替え、(6) `globals.css` に `.attendance-*` 3 層クラスを追加する。**API / D1 / Google Form / shared 型は一切変更しない（AC-7）。新規 primitive 追加ゼロ（AC-6）。HEX 直書きゼロ（AC-5）**。本 Phase の手順は後続実装者がそのまま着手できる粒度で `outputs/phase-05/runbook.md` に記述する。

## 実行タスク

1. **実装方針概要の確定**: `outputs/phase-05/main.md` に CONST_005（変更対象ファイル / signature / 入出力・副作用 / テスト方針 / 実行コマンド / DoD）を集約する。
2. **runbook 作成**: `outputs/phase-05/runbook.md` に「新規/編集ファイル一覧テーブル」「各ファイル Before/After 責務」「TypeScript シグネチャ + 実装スケルトン」「`attendanceFollowLevel` 純粋関数定義」「globals.css 追加クラス（全色 token・HEX ゼロ）」「MINOR M-1/M-2 解消手順」「挙動不変温存の確認手順」「ローカル検証コマンド」を書く。
3. **MINOR 解消の手順化**: M-1（route 二重 className）/ M-2（`attendanceFollowLevel` 命名分離）の解消を runbook に明記する。
4. **挙動不変温存の確認手順**: フィルタ / CSV / ドリルダウン modal / フッターが挙動不変であることの確認手順を runbook に書く。
5. **検証コマンドの確定**: typecheck / lint / vitest 対象限定 / next build --webpack / HEX grep gate を runbook に書く。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/component-map.md | Before/After 責務 / `AttendanceDetailTabs` signature / 新規修正ファイル一覧 |
| 必須 | outputs/phase-02/layout-blueprint.md | token 割当 / grid クラス / `data-attendance-follow` マッピング |
| 必須 | outputs/phase-04/test-plan.md | Green 化対象 TC-XX / 追加 spec パス |
| 必須 | outputs/phase-03/main.md | MINOR 3 件（M-1 route 二重 / M-2 属性名 / spec 追従） |
| 必須 | _shared-context.md | AC-1〜AC-10 / token 要点 / §9 検証コマンド |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX design principles | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 階層 / focal point / 余白リズムの実装原則 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | ダッシュボード 3 層情報設計の実装指針 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | Card/Badge/Stat/Segmented の再利用（新規 primitive 非追加） |
| UI/UX feature components | `.claude/skills/aiworkflow-requirements/references/ui-ux-feature-components-core.md` | feature 層 component（`AttendanceDetailTabs`）の実装パターン |
| 実装パターン | `.claude/skills/aiworkflow-requirements/references/architecture-implementation-patterns-core.md` | client/server component 境界・state 所有権 |

## 実行手順

### ステップ 1: 実装方針概要（main.md）

- `outputs/phase-05/main.md` に変更対象ファイル一覧・signature・入出力副作用・テスト方針・検証コマンド・DoD を集約する。

### ステップ 2: runbook（runbook.md）

- 新規/編集ファイルテーブル → 各ファイル Before/After → 新規 component スケルトン → 純粋関数 → globals.css → MINOR 解消 → 挙動不変温存 → 検証コマンド の順で書く。

### ステップ 3: 後続実装者の着手保証

- runbook 単体で「どのファイルをどう変えるか」が自明であること（import 含むスケルトン / 既存 shared 型のみ使用 / 新規型ゼロ）を確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-XX を Green 化する実装単位を runbook の各ファイルにマップ |
| Phase 6 | fail path（TC-E-XX）/ 回帰 guard（verify-design-tokens / playwright visual smoke）の前提を提供 |
| Phase 9 | typecheck / lint / vitest / next build / HEX grep を実行 |
| Phase 11 | VISUAL タスクの screenshot 取得（3 層レイアウト） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| API/D1/shared 不変 | AC-7 / invariant #5 | `apps/api/**` / `packages/shared/**` / `fetch-attendance.ts` の diff がゼロ。新規型ゼロ |
| 新規 primitive ゼロ | AC-6 / invariant #3 | `components/ui/` への追加なし。`AttendanceDetailTabs` は feature 層 |
| HEX ゼロ | AC-5 / invariant #2 | `globals.css` 追加分が全て `var(--ubm-color-*)`。HEX / `bg-[#xxx]` / `text-[#xxx]` なし |
| internal state | [VSCPKR-03] | タブ選択が `useState`。親制御しない |
| 純粋関数 例外なし | [WEEKGRD-02] | `attendanceFollowLevel` は throw せず値返却 |
| 挙動不変温存 | AC-10 | フィルタ / CSV / modal / フッター / degrade が不変 |
| MINOR 解消 | M-1 / M-2 | route 二重 className 整理 / `data-attendance-follow` 命名分離 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装方針概要 + CONST_005 | 5 | spec_created | main.md |
| 2 | 新規/編集ファイルテーブル | 5 | spec_created | runbook |
| 3 | `AttendanceDetailTabs` スケルトン | 5 | spec_created | Segmented + useState |
| 4 | `attendanceFollowLevel` 純粋関数 | 5 | spec_created | none/warn |
| 5 | globals.css 3 層クラス（HEX ゼロ） | 5 | spec_created | token のみ |
| 6 | MINOR M-1/M-2 解消手順 | 5 | spec_created | runbook |
| 7 | 挙動不変温存 + 検証コマンド | 5 | spec_created | runbook |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 実装方針概要 + CONST_005 集約 |
| ドキュメント | outputs/phase-05/runbook.md | 後続実装者向け実装手順書（ファイル一覧 / スケルトン / CSS / MINOR / 検証） |
| メタ | artifacts.json | Phase 5 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-05/main.md` に CONST_005（変更対象ファイル / signature / 入出力副作用 / テスト方針 / 実行コマンド / DoD）が集約されている
- [ ] `outputs/phase-05/runbook.md` に「新規/編集ファイル一覧テーブル」（パス + 新規/編集/削除）が記載されている
- [ ] 各ファイルの Before/After 責務 + 変更方針が記載されている
- [ ] `AttendanceDetailTabs` の TypeScript シグネチャ（props/state/戻り値）と実装スケルトン（import 含む・既存 shared 型のみ）が記載されている
- [ ] `attendanceFollowLevel(count: number): "none" | "warn"` の純粋関数定義（例外 throw せず値返却）が記載されている
- [ ] `globals.css` の `.attendance-*` 追加クラスが全て `var(--ubm-color-*)` で記述され、HEX 直書きゼロである（AC-5）
- [ ] MINOR M-1（route 二重 className）/ M-2（命名分離）の解消手順が記載されている
- [ ] 挙動不変温存（フィルタ / CSV / modal / フッター / degrade）の確認手順が記載されている
- [ ] ローカル検証コマンド（typecheck / lint / vitest 対象限定 / next build --webpack / HEX grep gate）が記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-05/{main,runbook}.md` が配置済み
- [ ] runbook が後続実装者の着手保証粒度（import 込みスケルトン / 新規型ゼロ）を満たしている
- [ ] AC-5 / AC-6 / AC-7 が runbook 上で機械検証可能（HEX grep / primitive 追加なし / shared diff ゼロ）になっている
- [ ] Phase 4 の全 TC-XX が runbook のどのファイル変更で Green になるか対応づけられている
- [ ] artifacts.json の Phase 5 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 6（テスト拡充）
- 引き継ぎ事項: runbook の変更ファイル / `data-attendance-follow` 属性名 / `AttendanceDetailTabs` の degrade 分岐 / 検証コマンド
- ブロック条件: AC-5/6/7 のいずれかが runbook で保証できない場合は Phase 2（設計）に戻る
