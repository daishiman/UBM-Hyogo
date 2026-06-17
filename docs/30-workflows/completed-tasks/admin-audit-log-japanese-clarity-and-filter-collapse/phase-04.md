# Phase 4: テスト作成（TDD Red 設計）

[実装区分: 実装仕様書]（VISUAL / コード変更を伴う）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（TDD Red 設計） |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 3（設計レビュー・総合判定 PASS） |
| 下流 | Phase 5（実装） |
| 状態 | completed |

## 目的

Phase 5 実装に先立ち、C1（日本語化 + 用語集 SSOT）/ C2（フィルタ段階開示）/ C3（カードブロック整列）の振る舞いを検証する **失敗するテスト（TDD Red）**を設計する。検証対象は AC-1〜AC-12 の振る舞い面である。具体的には (a) describe helper の正常系 + 未登録 raw fallback、(b) 適用フィルタチップの日本語化・英語キー名ゼロ、(c) フォームラベルの日本語表示・details 段階開示（値ありで open）・`<input name>` 英語維持、(d) カードの action/targetType 日本語表示・未登録 raw fallback、をテストケース（TC-XX 採番）として確定する。本 Phase ではテストの設計（戦略 + ケース一覧 + 期待値 + 追加 spec パス）を文書化するのみで、実テストコードの commit は行わない。

## 実行タスク

1. **テスト戦略の文書化**: `outputs/phase-04/main.md` にテスト戦略概要を書く。details の `open` が **internal state ではなく DOM 属性（`<details open>`）**であること（[VSCPKR-03]）、ラベルは render 出力で検証することを明記する。テスト操作は `render` + `screen` の query で行い、`vi.stubGlobal` を使わない（[FB-VSCPKR-02]）。
2. **テスト対象の internal/external 区分明記（[VSCPKR-03]）**: details open は **DOM 属性**（`element.open` / `[open]` セレクタで検証）、日本語ラベルは **render 出力**（`screen.getByText` / `getByLabelText`）で検証することを区別して記載する。
3. **テストケース一覧の採番**: `outputs/phase-04/test-plan.md` に TC-XX を採番し、各 TC の対象・操作・期待値・対応 AC・追加 spec パスを書く。
4. **新規/追従 spec ファイルパスの確定**: `__tests__/auditGlossary.spec.ts`（新規）/ `__tests__/auditAppliedFilters.spec.ts`（新規/追従）/ `__tests__/AuditLogPanel.component.spec.tsx`（新規/追従）/ `__tests__/AuditLogCard.spec.tsx`（新規/追従）を確定する。新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。
5. **screenshot 命名参照（[FB-VISUAL-CAP-001]）**: VISUAL のため Phase 11 screenshot 命名は canonical 名（`audit-page-full` 等、screenshot-plan.json と一致）を参照する旨を記載する。
6. **vitest 実行コマンドの注意記載**: repo ルートが root のため `_shared-context.md` §9 の対象限定指定が必要である点を明記する。
7. **Red 状態の宣言**: 本 Phase 時点では実装が無いため新規 TC が fail することが正常（Red）である旨を記録する。

## テスト分類と internal/external 区分

| 分類 | 対象 | 検証手段 | internal/external（[VSCPKR-03]） |
| --- | --- | --- | --- |
| (A) 純関数 unit | `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` | 直接 import して戻り値 assert | — （純関数・state なし） |
| (B) 純関数 unit | `auditAppliedFilters`（チップ生成） | 直接 import して chips 配列 assert | — （derived・純関数） |
| (C) component spec | `AuditLogPanel`（フォームラベル / details / name 属性） | `render` + `getByLabelText` / `[open]` 属性 | **details open = DOM 属性**（external prop でも internal state でもなく `defaultOpen` 算出の DOM 反映）/ ラベル = render 出力 |
| (D) component spec | `AuditLogCard`（action/targetType 日本語表示） | `render` + `getByText` | ラベル = render 出力（describe helper 経由） |

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | _shared-context.md | AC-1〜AC-12 / §4 用語集具体値 / §9 vitest コマンド |
| 必須 | outputs/phase-02/component-map.md | C1 helper signature / details defaultOpen 算出 |
| 必須 | outputs/phase-02/layout-blueprint.md | フィルタ 2 層 / チップ整列の期待構造 |
| 必須 | outputs/phase-03/main.md | PASS 判定 / MINOR 3 件 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-core.md` | testing-library + happy-dom の component spec 書式 |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | DOM 属性 / render 出力検証パターン |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | `getByLabelText` / `<details>`/`<summary>` / aria 検証 |
| UI/UX design principles | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 段階開示の妥当性 |

## 実行手順

### ステップ 1: テスト戦略概要の作成

- `outputs/phase-04/main.md` に以下を書く。
  - テスト分類: (A)(B) 純関数 unit、(C)(D) component spec。
  - details open = DOM 属性（`<details open>` / `element.open`）で検証し、`vi.stubGlobal` を用いない（[FB-VSCPKR-02]）。
  - 日本語ラベルは render 出力（`getByText` / `getByLabelText`）で検証。
  - `<input name>`（query param キー）が英語のまま不変であることを `getByLabelText("操作の種類")` で取得した要素の `name` 属性 assert で確認（AC-1/AC-9）。
  - 既存書式踏襲: `import { cleanup, render, screen } from "@testing-library/react"` + `afterEach(() => cleanup())` + happy-dom。
  - vitest 実行は repo ルートが root のため対象限定（`_shared-context.md` §9）。

### ステップ 2: テストケース一覧の作成

- `outputs/phase-04/test-plan.md` に TC-01 以降を採番し、各 TC に対象 / 操作 / 期待値 / 対応 AC / 追加 spec パスを書く。
- 最低限カバー: (a) describe helper 正常系 + 未登録 raw fallback、(b) チップ日本語化・英語キー名ゼロ、(c) フォームラベル日本語 + details open（値あり）+ name 属性英語維持、(d) カード action/targetType 日本語 + 未登録 raw fallback。

### ステップ 3: Red 宣言と screenshot 命名参照

- 新規 TC が現時点で fail（実装未着手）であることを記録し、Phase 5 で Green 化する旨を main.md に書く。
- [FB-VISUAL-CAP-001]: Phase 11 screenshot 命名は canonical 名（`audit-page-full` 等、screenshot-plan.json と一致）を参照する旨を main.md に明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の TC を Green にする実装を行う。新規 spec パスを runbook に反映 |
| Phase 6 | fail path / 境界値テスト（TC-E-XX：未登録コード / null targetType / 空文字フィルタ）を追加し Red の周辺を拡充 |
| Phase 9 | typecheck / lint / vitest 対象限定実行で全 TC Green を確認 |
| Phase 11 | VISUAL screenshot 命名（canonical）を screenshot-plan.json に反映（[FB-VISUAL-CAP-001]） |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | TC 対象（helper signature / details defaultOpen / チップ構造）の期待値を導出 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| internal/external 区分 | [VSCPKR-03] | details open は DOM 属性（`element.open`）、ラベルは render 出力で検証し、外部 props / 内部 state を仮定しない |
| stubGlobal 不使用 | [FB-VSCPKR-02] | `vi.stubGlobal` を使わない。本タスクは server fetch を直接呼ばない component を対象にするため window モック不要 |
| 純関数の例外なし | [WEEKGRD-02] | describe helper は throw せず raw fallback を返す。未登録コード・null を unit でカバー |
| name 属性英語維持 | AC-1 / AC-9 | `getByLabelText("操作の種類")` の `name` が `"action"` であることを assert（ラベル日本語・name 英語） |
| 英語キー名ゼロ | AC-4 | チップ spec で英語キー名（`action` / `actor` / `target type` 等）が描画されないことを `queryByText(...).toBeNull()` で assert |
| a11y 検証 | AC-11 | `getByLabelText` で label 関連付け、`<summary>` がキーボードフォーカス可能、適用フィルタ `aria-label="現在の絞り込み条件"` を assert |
| HEX 直書きゼロ | AC-8 | テストでは色値を直接アサートせず token クラス/属性で検証（CSS は Phase 5 + verify-design-tokens で保証） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | テスト戦略概要 | 4 | completed | main.md / DOM 属性 vs render 出力明記 |
| 2 | internal/external 区分明記 | 4 | completed | [VSCPKR-03] |
| 3 | TC-XX 採番 + 期待値 + 対応 AC | 4 | completed | test-plan.md |
| 4 | 新規/追従 spec パス確定 | 4 | completed | 4 ファイル（`*.spec.{ts,tsx}`） |
| 5 | screenshot canonical 命名参照 | 4 | completed | [FB-VISUAL-CAP-001] |
| 6 | vitest 対象限定コマンド注意 | 4 | completed | §9 |
| 7 | Red 宣言 | 4 | completed | 新規 TC fail が正常 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略概要 / internal-external 区分 / 4 spec 追従 / screenshot 命名 / vitest コマンド注意 |
| ドキュメント | outputs/phase-04/test-plan.md | TC-XX 一覧（対象 / 操作 / 期待値 / 対応 AC / 追加 spec パス） |
| メタ | artifacts.json | Phase 4 を completed に維持 |

## 完了条件

- [ ] `outputs/phase-04/main.md` にテスト戦略概要が記載され、details open が DOM 属性であり internal state でない点が明記されている（[VSCPKR-03]）
- [ ] テスト操作が `render` + `screen` query であり `vi.stubGlobal` を使わない方針（[FB-VSCPKR-02]）が明記されている
- [ ] 4 spec（`auditGlossary` / `auditAppliedFilters` / `AuditLogPanel` / `AuditLogCard`）の対象範囲が `outputs/phase-04/main.md` に記載されている
- [ ] `outputs/phase-04/test-plan.md` に TC-XX が採番され、各 TC に対象 / 操作 / 期待値 / 対応 AC / 追加 spec パスが明記されている
- [ ] (a) describe helper 正常系 + raw fallback、(b) チップ日本語化 + 英語キー名ゼロ、(c) フォームラベル日本語 + details open（値あり）+ name 英語維持、(d) カード action/targetType 日本語 + raw fallback の 4 観点が TC でカバーされている
- [ ] 新規/追従 spec パス（4 ファイル・`*.spec.{ts,tsx}`）が確定している
- [ ] Phase 11 screenshot 命名が canonical 名参照である旨が記載されている（[FB-VISUAL-CAP-001]）
- [ ] vitest 対象限定実行コマンド（`_shared-context.md` §9）の注意が記載されている
- [ ] 新規 TC が現時点で fail（Red）である旨が記録されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-04/{main,test-plan}.md` が配置済み
- [ ] CONST_005（テスト方針 = 追加 spec ファイル + ケース）が満たされている
- [ ] 全 TC が AC-1〜AC-12 のいずれかにマップされている
- [ ] テスト書式が既存（happy-dom + testing-library + `afterEach(cleanup)`）を踏襲している
- [ ] 新規 test が `*.spec.{ts,tsx}` のみである（不変条件 #8）
- [ ] artifacts.json の Phase 4 ステータスが completed に整合している

## 次Phase

- 次: Phase 5（実装）
- 引き継ぎ事項: TC-XX 一覧 / 新規・追従 spec パス / details open は DOM 属性 / name 属性英語維持 / 全 TC を Green にする実装手順は runbook へ
- ブロック条件: TC が AC にマップできない場合は Phase 1（AC 定義）に戻る
