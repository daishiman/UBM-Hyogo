# issue-770-profile-loading-skeleton

> Source issue: [#770](https://github.com/daishiman/UBM-Hyogo/issues/770)（OPEN のまま仕様書化）
> Parent spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
> Unassigned-task spec: `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md`
> 実装区分: **実装仕様書**
> taskType: implementation
> visualEvidence: VISUAL
> workflow_state: implemented_local_runtime_pending

## 概要

`apps/web/app/profile/loading.tsx` が `<p aria-live="polite">読み込み中…</p>` の簡素実装のみで parallel-07 spec §4.5 未達。CLS リスクと token 経由でない placeholder 不整合がある。
avatar + heading + 4 KV bars の OKLch skeleton に置換し、`role="status"` / `aria-busy="true"` / `aria-live="polite"` / `.sr-only` テキストを備えた a11y 準拠の loading boundary にする。

## 正本昇格理由

親 i07 spec は当初 in-place fix を想定していたが、Issue #770 として独立 tracking され、実コード・テスト・親 integration-fixes index・source unassigned task・aiworkflow ledgers の same-wave 同期が必要になったため、本ディレクトリを canonical workflow root に昇格した。`artifacts.json` を機械可読正本とし、Phase 12 strict 7 outputs で skill 準拠を検証する。

## 親 workflow / 関連

- parallel-07 DoD §4.5（`/profile` loading skeleton 未達） → 本タスクで消し込み
- integration-fixes index の i07 行の状態更新
- i05 (issue #768) / i06 と編集対象ファイル重複なし → 完全並列可

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル

- `apps/web/app/profile/loading.tsx`（修正 / 置換）
- `apps/web/app/profile/loading.spec.tsx`（新規）

## スコープ外（CONST_007 例外なし）

- profile page 本体 (`apps/web/app/profile/page.tsx`) の変更 → 対象外（loading boundary 単体タスク）
- avatar / KV pair component の新規実装 → skeleton 内は形状 div のみ
- `useAutoFocusOnMount` 等の hook 抽出 → i05/i06 完了後の refactor PR

すべて今サイクル内で完了するスコープ（先送りなし）。Authenticated browser screenshot / staging runtime visual evidence、commit、push、PR は user-gated。
