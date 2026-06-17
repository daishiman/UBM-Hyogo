# Phase 10 — 最終レビュー

## 目的

Phase 1 の AC-1〜13 に対する充足判定を行い、ブロッカーの有無を確定する。本ワークフローは **implemented_local_evidence_captured（実装はまだ）** のため、各 AC は「仕様として充足・実装は後続」を意味する `implemented_local_evidence_captured` を suffix する。MINOR（M-1 / M-2）を未タスク baseline 化する旨を記録し Phase 12 へ引き継ぐ。

## 成果物

- AC-1〜13 充足判定テーブル（implemented_local_evidence_captured suffix）。
- MINOR baseline 引き継ぎ記録。
- 最終判定（ブロッカー無し → PASS）。

## AC 充足判定（[phase-1 受入条件](./phase-1-requirements.md) 参照）

| AC | 内容（要約） | 判定 | 根拠（仕様の所在） |
| --- | --- | --- | --- |
| AC-1 | サイドバー `開催日`→`開催・出席管理`（id/href/icon 不変） | implemented_local_evidence_captured | [§5.1](./shared-context.md) / [phase-4-5 手順] |
| AC-2 | サイドバー `Identity重複`→`会員の重複確認`（id/href/icon 不変） | implemented_local_evidence_captured | [§5.1](./shared-context.md) |
| AC-3 | page の eyebrow/title/description/empty/card/breadcrumb/aria-label を日本語化 | implemented_local_evidence_captured | [§5.2](./shared-context.md) |
| AC-4 | Row の英語/技術用語を平易日本語化・`matchedFields` は glossary 経由 | implemented_local_evidence_captured | [§5.3](./shared-context.md) / [phase-6 B](./phase-6-test-additions.md) |
| AC-5 | ページ冒頭に `IdentityConflictGuide`（3 点説明） | implemented_local_evidence_captured | [§5.4](./shared-context.md) / [phase-6 C](./phase-6-test-additions.md) |
| AC-6 | `identityConflictGlossary.ts`（未登録 fallback・throw しない）＋単体テスト | implemented_local_evidence_captured | [§5.5](./shared-context.md) / [phase-6 A](./phase-6-test-additions.md) / [phase-7](./phase-7-coverage.md) |
| AC-7 | アナウンス文言の日本語化（aria-live 維持） | implemented_local_evidence_captured | [§5.6](./shared-context.md) |
| AC-8 | API/型 非変更（`git diff` 4 path 空） | implemented_local_evidence_captured | [§3](./shared-context.md) / [phase-9 Q7](./phase-9-qa.md) |
| AC-9 | seed gen で SQL 2 本生成・contract（drift/idempotent/行数）緑 | implemented_local_evidence_captured | [§6](./shared-context.md) / [phase-6 D](./phase-6-test-additions.md) |
| AC-10 | seed 適用後**ちょうど 5 組**・各組が異なるパターン | implemented_local_evidence_captured | [§6.3](./shared-context.md) / [phase-6 D](./phase-6-test-additions.md) |
| AC-11 | `seed-identity-conflicts.sh` は local/staging 限定・scoped cleanup | implemented_local_evidence_captured | [§6.5 / §6.6](./shared-context.md) |
| AC-12 | 色は `var(--ubm-color-*)` のみ（`verify:tokens` 緑） | implemented_local_evidence_captured | [§3](./shared-context.md) / [phase-9 Q3/Q8](./phase-9-qa.md) |
| AC-13 | typecheck/lint 緑・focused vitest（5 spec）緑 | implemented_local_evidence_captured | [phase-9](./phase-9-qa.md) |

> 全 AC は仕様として整合（13/13 implemented_local_evidence_captured）。実装・テスト緑化は後続実装フェーズ（user-gated）で確定する。

## MINOR baseline 引き継ぎ（[phase-3 MINOR](./phase-3-design-review.md)）

| ID | 内容 | 扱い |
| --- | --- | --- |
| M-1 | 内部 member_id（TEST-MEM-xx）は非エンジニアに無意味。本タスクはラベル日本語化で一部対応するが、完全な ID 隠蔽（`<details>` 化等）は別タスク候補 | Phase 12 未タスク検出レポートに baseline 記録（CONST_007 例外：独立スコープ） |
| M-2 | `/admin/meetings` ページ本体（カード/フォーム）の UX 改善は範囲外（本タスクはサイドバー命名のみ） | Phase 12 未タスク検出レポートに baseline 記録（API/D1 や独立 UX スコープを伴うため分離） |

> M-1/M-2 は「本サイクルで完了すると破綻する明確な理由（独立スコープ・別画面）」に該当するため、未タスク baseline として Phase 12 へ引き継ぐ（[shared-context §9](./shared-context.md)）。

## スコープ外の再確認（[shared-context §9](./shared-context.md)）

- 重複検出ロジック拡張（電話/住所一致）→ API/D1 変更を伴うため対象外。
- 3 件以上の一括統合 UI → 現行 2 件ずつ。需要あれば別タスク。

## 最終判定

- ブロッカー: **無し**。
- AC 整合: 13/13 implemented_local_evidence_captured。
- 不変条件（API/D1/型/トークン）の遵守方針: 確定済。
- **判定: PASS** — 後続実装フェーズ（Phase 11-13 ドキュメント / 実装は user-gated）へ進行可能。

## 完了条件

- [ ] AC-1〜13 を implemented_local_evidence_captured suffix 付きで充足判定した。
- [ ] M-1 / M-2 を Phase 12 未タスク baseline 化する旨を記録した。
- [ ] ブロッカー無し → PASS を確定した。
