# Phase 4: テスト作成（TDD Red 設計）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（TDD Red 設計） |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 3（設計レビュー・総合判定 PASS） |
| 下流 | Phase 5（実装） |
| 状態 | spec_created |

## 目的

Phase 5 実装に先立ち、3 層階層リファイン（PRIMARY / TREND / DETAIL）の振る舞いを検証する **失敗するテスト（TDD Red）**を設計する。検証対象は AC-1〜AC-10 の振る舞い面である。具体的には (a) PRIMARY ヒーローの描画、(b) 要フォロー判定の純粋関数 `attendanceFollowLevel` とトーン属性 `data-attendance-follow`、(c) DETAIL の `Segmented` タブによる 3 表の排他表示、(d) SafeResult error 時のゾーン/タブ単位 degrade、(e) レスポンシブ grid クラスの DOM 存在、(f) 既存 5 spec の再構成追従、をテストケース（TC-XX 採番）として確定する。本 Phase ではテストの設計（戦略 + ケース一覧 + 期待値 + 追加 spec ファイルパス）を文書化するのみで、実テストコードの commit は行わない。

## 実行タスク

1. **テスト戦略の文書化**: `outputs/phase-04/main.md` にテスト戦略概要を書く。Segmented タブのモード管理が internal state（`useState`）であること（[VSCPKR-03]）を明記し、テスト操作は `fireEvent.click`（`vi.stubGlobal` を使わない [FB-VSCPKR-02]）で行うことを宣言する。
2. **既存 5 spec の追従方針**: component spec 3 本（`KpiPanel` / `AttendanceTrendChart` / `AttendanceZoneDistributionChart`）+ lib spec 2 本（`format-attendance` / `buildExportUrl`）の追従範囲を明記する。`KpiPanel` は hero 化により testid 構成が変わるため追従が必要。Trend / Zone は描画内容不変だが配置ゾーン変更のため testid 維持確認のみ。lib spec 2 本は不変。
3. **テストケース一覧の採番**: `outputs/phase-04/test-plan.md` に TC-XX を採番し、各 TC の対象・操作・期待値・追加 spec ファイルパスを書く。
4. **新規 spec ファイルパスの確定**: `AttendanceDetailTabs.spec.tsx` / `attendanceFollowLevel.spec.ts` / `AttendancePrimaryHero.spec.tsx`（KpiPanel hero 化の検証）を確定する。
5. **vitest 実行コマンドの注意記載**: repo ルートが root のため対象限定指定（`_shared-context.md` §9 のコマンド）が必要である点を明記する。
6. **Red 状態の宣言**: 本 Phase 時点では実装が無いため全 TC が fail することが正常（Red）である旨を記録する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md | AC-1〜AC-10 / 既存 5 spec 内訳 / §9 vitest コマンド / Phase 10 確定表 |
| 必須 | outputs/phase-02/component-map.md | `AttendanceDetailTabs` props/state signature / Before-After 責務 |
| 必須 | outputs/phase-02/layout-blueprint.md | `data-attendance-follow` マッピング / token 割当 / grid クラス |
| 必須 | outputs/phase-03/main.md | PASS 判定 / MINOR 3 件（route 二重 / 属性名 / spec 追従） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-core.md` | testing-library + happy-dom の component spec 書式 |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | `fireEvent` / internal state 検証パターン |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | `role="radiogroup"` / 見出し階層 / aria 検証 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | ダッシュボード階層・焦点の検証観点 |
| UI/UX design principles | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 階層 / focal point の妥当性 |

## 実行手順

### ステップ 1: テスト戦略概要の作成

- `outputs/phase-04/main.md` に以下を書く。
  - テスト分類: (A) 純粋関数 unit（`attendanceFollowLevel`）、(B) component spec（PRIMARY hero / DETAIL タブ / 要フォロー hero）、(C) 既存 spec 追従。
  - Segmented タブ = internal state（`useState<DetailTabKey>`）。テスト操作は `fireEvent.click(screen.getByRole("radio", { name: "会員別" }))` で行い、`vi.stubGlobal` を用いない（[FB-VSCPKR-02]）。
  - 既存書式踏襲: `import { cleanup, render, screen } from "@testing-library/react"` + `afterEach(() => cleanup())` + happy-dom。
  - vitest 実行は repo ルートが root のため対象限定（`_shared-context.md` §9）。

### ステップ 2: テストケース一覧の作成

- `outputs/phase-04/test-plan.md` に TC-01 以降を採番し、各 TC に対象 / 操作 / 期待値 / 追加 spec ファイルパスを書く。
- 最低限カバー: (a) PRIMARY hero 描画、(b) `attendanceFollowLevel` 0→none / 1+→warn、(c) Segmented 切替の排他表示、(d) SafeResult error のゾーン/タブ単位 degrade、(e) grid クラス DOM 存在、(f) 既存 5 spec 追従。

### ステップ 3: Red 宣言

- 全 TC が現時点で fail（実装未着手）であることを記録し、Phase 5 で Green 化する旨を main.md に書く。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の TC を Green にする実装を行う。新規 spec ファイルパスを runbook に反映 |
| Phase 6 | fail path / 境界値テスト（TC-E-XX）を追加し Red の周辺を拡充 |
| Phase 9 | typecheck / lint / vitest 対象限定実行で全 TC Green を確認 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | TC 対象コンポーネント、`data-attendance-follow`、grid 構造の期待値を導出 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| internal state テスト | [VSCPKR-03] | Segmented タブ操作が `fireEvent.click` で検証され、外部 props 制御を仮定しない |
| stubGlobal 不使用 | [FB-VSCPKR-02] | `window.api` モックが必要な場合も `vi.stubGlobal` を使わず `Object.defineProperty(window, ...)` を使う（本タスクでは server fetch を直接呼ばない component を対象にするため window.api モックは不要） |
| 純粋関数の例外なし | [WEEKGRD-02] | `attendanceFollowLevel` は throw せず値返却。負数・0・正数の境界を unit でカバー |
| degrade 検証 | AC-10 | SafeResult error 時に該当ゾーン/タブのみ degrade し他は描画継続することを assert |
| a11y 検証 | AC-9 | Segmented が `role="radiogroup"` / 各 option `role="radio"`、見出し階層 h2>h3 を assert |
| HEX 直書きゼロ | AC-5 | テストでは色値を直接アサートせず token クラス/属性で検証（CSS は Phase 5 + verify-design-tokens で保証） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | テスト戦略概要 | 4 | spec_created | main.md / internal state 明記 |
| 2 | 既存 5 spec 追従方針 | 4 | spec_created | KpiPanel 追従 / lib 2 本不変 |
| 3 | TC-XX 採番 + 期待値 | 4 | spec_created | test-plan.md |
| 4 | 新規 spec ファイルパス確定 | 4 | spec_created | 3 ファイル |
| 5 | vitest 対象限定コマンド注意 | 4 | spec_created | §9 |
| 6 | Red 宣言 | 4 | spec_created | 全 TC fail が正常 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略概要 / internal state / 既存 5 spec 追従 / vitest コマンド注意 |
| ドキュメント | outputs/phase-04/test-plan.md | TC-XX 一覧（対象 / 操作 / 期待値 / 追加 spec パス） |
| メタ | artifacts.json | Phase 4 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-04/main.md` にテスト戦略概要が記載され、Segmented タブが internal state（`useState`）である点が明記されている
- [ ] テスト操作が `fireEvent.click` であり `vi.stubGlobal` を使わない方針（[FB-VSCPKR-02]）が明記されている
- [ ] 既存 5 spec（component 3 / lib 2）の追従範囲が `outputs/phase-04/main.md` に記載されている
- [ ] `outputs/phase-04/test-plan.md` に TC-XX が採番され、各 TC に対象 / 操作 / 期待値 / 追加 spec ファイルパスが明記されている
- [ ] (a) PRIMARY hero 描画、(b) `attendanceFollowLevel` 0/1+ トーン、(c) Segmented 排他表示、(d) SafeResult degrade、(e) grid クラス DOM 存在、(f) 既存 spec 追従の 6 観点が TC でカバーされている
- [ ] 新規 spec ファイルパス（`AttendanceDetailTabs.spec.tsx` / `attendanceFollowLevel.spec.ts` / `AttendancePrimaryHero.spec.tsx`）が確定している
- [ ] vitest 対象限定実行コマンド（`_shared-context.md` §9）の注意が記載されている
- [ ] 全 TC が現時点で fail（Red）である旨が記録されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-04/{main,test-plan}.md` が配置済み
- [ ] CONST_005（テスト方針 = 追加 spec ファイル + ケース）が満たされている
- [ ] 全 TC が AC-1〜AC-10 のいずれかにマップされている
- [ ] テスト書式が既存（happy-dom + testing-library + `afterEach(cleanup)`）を踏襲している
- [ ] artifacts.json の Phase 4 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 5（実装）
- 引き継ぎ事項: TC-XX 一覧 / 新規 spec ファイルパス / Segmented internal state / 全 TC を Green にする実装手順は runbook へ
- ブロック条件: TC が AC にマップできない場合は Phase 1（AC 定義）に戻る
