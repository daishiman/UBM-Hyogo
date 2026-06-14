# Phase 4: テスト作成（TDD Red 設計）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（TDD Red 設計） |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 3（設計レビュー・総合判定 PASS） |
| 下流 | Phase 5（実装） |
| 状態 | completed |

## 目的

Phase 5 実装に先立ち、`/admin/requests` 承認導線の「変更前 → 変更後」公開状態 diff 表示の振る舞いを検証する **失敗するテスト（TDD Red）**を設計する。検証対象は AC-1〜AC-10 の振る舞い面であり、具体的には (a) `visibility_request`（V01: public→hidden / V02: hidden→public）の before/after span 描画、(b) `delete_request`（D01）の「在籍 → 退会（論理削除）」描画と公開状態 diff 非露出、(c) 純粋関数 `formatPublishStateLabel` の `public/member_only/hidden/unknown` → 日本語ラベル写像と未知値 fail-soft、(d) `buildPublishStateDiff` の note_type 別意味軸分岐、(e) 矢印 span の `aria-hidden="true"`、(f) `destructiveMessage` の note_type 別文言、(g) 既存 3 spec の追従、をテストケース（TC-XX 採番）として確定する。本 Phase はテストの設計（戦略 + ケース一覧 + 期待値 + 追加 spec ファイルパス + テストセレクタ）を文書化するのみで、実テストコードの commit は行わない（spec_created）。

## 実行タスク

1. **テスト戦略の文書化**: `outputs/phase-04/main.md` にテスト分類（純粋関数 unit / component spec / 既存 spec 追従）と書式（happy-dom + `@testing-library/react` + `afterEach(cleanup)`）を書く。テスト操作は server fetch を直接呼ばない component を対象とするため `vi.stubGlobal` を使わず、props 注入 + `fireEvent` で行う方針を明記する。
2. **テストセレクタの確定**: Phase 2 で確定した `data-diff-side="before|after"` / `data-diff-kind="visibility|delete"` 属性をテストセレクタとして用いる方針を明記する。矢印は `aria-hidden="true"` を assert する。
3. **テストケース一覧の採番**: `outputs/phase-04/test-plan.md` に TC-01 以降を採番し、各 TC に「ID / 対象 / 入力 fixture / 期待 / 配置 spec ファイルパス」をテーブルで書く。
4. **既存 3 spec の追従方針**: `RequestQueueDetail.spec.tsx`（137 行）/ `RequestConfirmDialog.spec.tsx`（194 行）/ `RequestQueuePanel.component.spec.tsx`（141 行）の追従範囲を明記する。`RequestConfirmDialog.spec.tsx` は 92 行表示条件緩和（`destructiveMessage` 単独表示）に追従。
5. **fixture 入力の確定**: `TEST-NOTE-V01`（visibility / public→hidden）/ `V02`（visibility / hidden→public）/ `D01`（delete）を test 入力として確定する。
6. **vitest 対象限定コマンドの注意記載**: repo ルートが vitest root のため、対象限定指定（`_shared-context.md` §9）が必要である点を明記する。
7. **Red 状態の宣言**: 本 Phase 時点では diff 表示・helper が未実装のため全 TC が fail することが正常（Red）であり、Phase 5 で Green 化する旨を記録する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | AC-1〜AC-10 / fixture（V01/V02/D01）/ §8 テスト方針 / §9 vitest コマンド |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/phase-02.md | `formatPublishStateLabel`/`buildPublishStateDiff` シグネチャ・DOM 設計・`data-diff-*` セレクタ |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/phase-03.md | ダイアログ 92 行表示条件緩和 / 申請内容 dd 統合の決定 |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-02/diff-design.md | DOM / 純粋関数 / CSS の詳細設計 |

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-core.md` | testing-library + happy-dom の component spec 書式 |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | `fireEvent` / props 注入による検証パターン |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | `aria-hidden` / dl 構造 / 連続読み上げの検証 |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | HEX 禁止ルール（テストでは色値直 assert しない裏取り） |
| 参照 | apps/api/src/testing/test-accounts/catalog.ts | fixture（V01/V02/D01）の payload 構造確認 |

## 実行手順

### ステップ 1: テスト戦略概要の作成

`outputs/phase-04/main.md` に以下を書く。

- テスト分類: (A) 純粋関数 unit（`formatPublishStateLabel` / `buildPublishStateDiff`）、(B) component spec（`RequestQueueDetail` の diff 行描画 / a11y）、(C) component spec（`RequestQueuePanel` の `destructiveMessage` 文言 + `RequestConfirmDialog` 表示）、(D) 既存 3 spec 追従。
- 書式踏襲: `import { cleanup, render, screen } from "@testing-library/react"` + `afterEach(() => cleanup())` + happy-dom。
- 操作方針: server fetch を直接呼ばない component を対象とするため `vi.stubGlobal` 不使用。props 注入 + 必要なら `fireEvent.click`。
- セレクタ: `container.querySelector('[data-diff-side="before"]')` / `[data-diff-side="after"]` / `[data-diff-kind="visibility"]` / `[data-diff-kind="delete"]` と、矢印の `[aria-hidden="true"]` を用いる。色値（OKLch / HEX）はテストで直接 assert しない（CSS は verify-design-tokens で保証）。
- vitest 実行は repo ルートが root のため対象限定（`_shared-context.md` §9）。

### ステップ 2: テストケース一覧の作成

`outputs/phase-04/test-plan.md` に TC-01 以降を採番し、各 TC に「ID / 対象 / 入力 fixture / 期待 / 配置 spec パス」をテーブルで書く。最低限カバーする観点:

- (a) `visibility_request` V01（public→hidden）で `data-diff-side="before"`=「公開」/ `after`=「非公開」/ `data-diff-kind="visibility"` が描画される。
- (b) `visibility_request` V02（hidden→public）で before=「非公開」/ after=「公開」が描画される。
- (c) `delete_request` D01 で `data-diff-kind="delete"` / before=「在籍」/ after=「退会（論理削除）」が描画され、公開状態 diff（`data-diff-kind="visibility"`）が出ない。
- (d) `formatPublishStateLabel`: `public`→「公開」/ `member_only`→「会員限定」/ `hidden`→「非公開」/ 未知値（例 `""`, `"foo"`）→「不明」へ fail-soft（throw しない）。
- (e) `buildPublishStateDiff`: visibility / delete / 対象外 note_type or null → `null`。`desiredState` 取得不能時 after=「不明」。
- (f) 矢印 span に `aria-hidden="true"` が付き、before/after はテキストで意味担保（AC-9）。
- (g) `destructiveMessage`: `visibility_request` で具体遷移文言（「公開状態を『公開』から『非公開』へ変更します。会員へ即時反映されます。」）、`delete_request` で既存退会文言を返す（AC-8）。
- (h) 既存 3 spec の green 維持 + 追従 assertion（`RequestConfirmDialog` 92 行緩和に伴う表示確認）。

### ステップ 3: 既存 spec 追従の確定

`RequestQueueDetail.spec.tsx` は diff 行 assertion 追加、`RequestQueuePanel.component.spec.tsx` は `destructiveMessage` 具体化 assertion 追加、`RequestConfirmDialog.spec.tsx` は 92 行表示条件緩和（`destructiveMessage` 単独表示）の追従 assertion を追加する旨を記録する。

### ステップ 4: Red 宣言

全 TC が現時点で fail（diff 表示・helper 未実装）であることを記録し、Phase 5 で Green 化する旨を `outputs/phase-04/main.md` に書く。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略概要 / セレクタ方針 / 既存 3 spec 追従 / vitest コマンド注意 / Red 宣言 |
| ドキュメント | outputs/phase-04/test-plan.md | TC-XX 一覧テーブル（ID / 対象 / 入力 fixture / 期待 / 配置 spec パス） |
| メタ | artifacts.json | Phase 4 を completed に同期 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の TC を Green にする実装を行う。追加 spec ファイルパスを runbook に反映 |
| Phase 6 | fail path / 境界値（未知 publishState / 空 payload / desiredState 欠落）の TC-E-XX を追加し Red 周辺を拡充 |
| Phase 7 | TC-XX を AC-1〜AC-10 と 1:1 トレースし未カバー 0 件を確認 |
| Phase 9 | typecheck / lint / vitest 対象限定実行で全 TC Green を確認 |
| Phase 11 | VISUAL の screenshot（V01/V02/D01 の 3 ケース）取得計画の入力 |

## 完了条件

- [ ] `outputs/phase-04/main.md` にテスト戦略概要が記載され、`vi.stubGlobal` 不使用・props 注入 + `fireEvent` 方針が明記されている。
- [ ] テストセレクタとして `data-diff-side` / `data-diff-kind` / 矢印 `aria-hidden="true"` を用いる方針が明記されている。
- [ ] `outputs/phase-04/test-plan.md` に TC-XX が採番され、各 TC に ID / 対象 / 入力 fixture / 期待 / 配置 spec ファイルパスが明記されている。
- [ ] (a) V01 / (b) V02 / (c) D01 / (d) `formatPublishStateLabel` 写像・fail-soft / (e) `buildPublishStateDiff` 分岐 / (f) 矢印 aria-hidden / (g) `destructiveMessage` note_type 別 / (h) 既存 3 spec 追従 の 8 観点が TC でカバーされている。
- [ ] fixture（V01 public→hidden / V02 hidden→public / D01 delete）が各 TC の入力に対応づけられている。
- [ ] 既存 3 spec（`RequestQueueDetail` / `RequestConfirmDialog` / `RequestQueuePanel.component`）の追従範囲が記載されている。
- [ ] vitest 対象限定実行コマンド（`_shared-context.md` §9）の注意が記載されている。
- [ ] 全 TC が現時点で fail（Red）である旨が記録されている。
- [ ] 各 TC が AC-1〜AC-10 のいずれかにマップされている。
- [ ] artifacts.json の Phase 4 ステータスが completed に整合している。
