# issue-1198 監査ログカード化で未使用化した旧テーブル系 dead CSS の削除

> **[実装区分: 実装完了 / NON_VISUAL]** — issue 既定ラベルは `type:refactoring`（CSS 削除）だが、root cause（カード化移行で未参照化した旧テーブル系 dead CSS の残置 = SSOT/コード衛生違反）の根本解決にコード変更（`globals.css` の 3 ブロック削除）が必須のため、CONST_004 に従い同一サイクルで実装まで完了した（ラベルより実態優先）。commit / push / PR は user-gated。

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-1198-admin-audit-dead-table-css-cleanup |
| タスク名 | `/admin/audit` カード型タイムライン化で未参照化した旧テーブル系 dead CSS 3 ブロックを `globals.css` から削除 |
| 分類 | dead code cleanup（apps/web 表現層・CSS のみ） |
| 対象 | `apps/web/src/styles/globals.css`（3 ブロック削除のみ） |
| 優先度 | 低（`priority:low` / `type:followup`） |
| 見積もり規模 | 小規模（CSS 3 ブロック ≒ 17 行の純減・ロジック変更なし） |
| ステータス | implemented_local_evidence_captured（commit/PR は user-gated） |
| 実装区分 | 実装仕様書（NON_VISUAL） |
| implementation_mode | new |
| visualEvidence | NON_VISUAL（dead CSS は未適用＝視覚出力に影響なし・スクリーンショット不要） |
| GitHub Issue | [#1198](https://github.com/daishiman/UBM-Hyogo/issues/1198)（**CLOSED のまま**・reopen しない・`Refs #1198` のみ） |
| 発見元 | 親 workflow `admin-audit-log-ux-clarity-and-reduce-error-fix` Phase 8 OOS-4 の grep 誤判定 → unassigned-task formalize → 本セッションで canonical workflow root 後付け生成 |

## issue 既解決判定（CLOSED Issue 鮮度調査 §7.1）

> 本タスクは「別タスクで既に解決済みかどうか」を最初に調査した。結論: **未解決（削除タスクは依然必要）**。

| 確認対象 | 現コードベース実態（2026-06-13 実測） | 結論 |
| --- | --- | --- |
| `.admin-audit-filter` 定義 | `globals.css` から削除済み（grep 0 件） | 解決 |
| `.admin-audit-table-scroll` 定義 | `globals.css` から削除済み（grep 0 件） | 解決 |
| `.admin-audit-table` 定義 | `globals.css` から削除済み（grep 0 件） | 解決 |
| 上記 3 セレクタの `.tsx`/`.ts` 参照 | `grep -rn ... --include=*.tsx --include=*.ts` で **0 件**（唯一のヒットは Playwright スクショ名 `admin-audit-filtered.png` で CSS クラス参照ではない） | 未参照（dead 確定） |
| 置換クラス（カード系）の使用 | `AuditLogPanel.tsx:161` `.admin-audit-applied-filters` / `AuditLogCard.tsx:32` `.admin-audit-card` / `AuditLogPanel.tsx:189` `.admin-audit-timeline` 使用中 | 移行完了済み |
| 3 セレクタの削除差分 | 本サイクルで `globals.css` 18 行純減 | local 実装済み |

→ **issue は local 実装済み**。`/admin/audit` のカード化（#1202）で未参照化した 3 ブロックを、本サイクルで `globals.css` から削除した。

## issue 前提の訂正（最新コードへの最適化 §7.2）

| 観点 | 原典 Issue の想定 | 現コードベース実態（2026-06-13） | 採る方針 |
| --- | --- | --- | --- |
| 削除対象の位置 | `globals.css` 行 1602-1618 | 後続コミットでファイル伸長し **行 2023-2039** に移動 | 行番号はアンカーにせず **3 セレクタ名**で範囲確定する |
| 削除単位 | 3 ブロック（filter / table-scroll / table） | 同一（セレクタ名は不変・位置のみ移動） | セレクタ名で逐語特定して削除済み |
| 保持境界 | `.admin-audit-guide`（行 1620〜）以降は保持 | `.admin-audit-guide` は現行 `globals.css:2041〜` に存在・カード UI 使用中 | 削除範囲を `.admin-audit-table` 終端（行 2039 `}`）までに厳密限定 |

## 実装区分の判定根拠（CONST_004）

| 観点 | 判断 |
| --- | --- |
| issue 既定ラベル | `type:refactoring` + `type:followup`（CSS リファクタ） |
| ユーザー指示 | 「根本的な問題を解決すること」を明示 |
| root cause | カード化移行で未参照化した dead CSS の残置。doc 記載や grep 判定の訂正だけでは **dead code が残存し続ける** |
| dead CSS の実態 | `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table` の 3 件が `apps/web/src`・`apps/web/app` で **0 参照** |
| 結論 | **実装完了**。dead CSS 3 ブロックを削除して `/admin/audit` の CSS を現行カード UI に必要な定義のみへ縮約した |

## Phase 一覧

| Phase | 名称 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) | completed |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) | completed |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | completed |
| 4 | テスト作成 | [phase-4-test-plan.md](phase-4-test-plan.md) | completed |
| 5 | 実装 | [phase-5-implementation.md](phase-5-implementation.md) | completed |
| 6 | テスト拡充 | [phase-6-test-additions.md](phase-6-test-additions.md) | completed |
| 7 | カバレッジ確認 | [phase-7-coverage.md](phase-7-coverage.md) | completed |
| 8 | リファクタリング | [phase-8-refactor.md](phase-8-refactor.md) | completed |
| 9 | 品質保証 | [phase-9-qa.md](phase-9-qa.md) | completed |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) | completed |
| 11 | 手動テスト | [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) | completed |
| 12 | ドキュメント更新 | [outputs/phase-12/implementation-guide.md](outputs/phase-12/implementation-guide.md) | completed |
| 13 | PR作成 | [phase-13-pr.md](phase-13-pr.md) | blocked（user-gated） |

## スコープ

### 含む（実装仕様書）

- `apps/web/src/styles/globals.css` の旧 audit テーブル系 dead CSS 3 ブロック（`.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`）の削除。
- 削除前のゼロ参照証跡の取得（AC-1）。
- 削除後の typecheck / lint / verify:tokens / 監査ログ focused Vitest の緑確認（AC-4/AC-5）。
- 元 unassigned-task を consumed に更新する記録（Phase 12）。

### 含まない

- `.admin-audit-guide` 以降の新規カード系 CSS の変更（現行 UI 使用中）。
- `.tbl` 汎用ユーティリティ（現行ヒットなし）の変更（audit 専用ではない）。
- 監査ログ total 件数表示（baseline OOS-1: apps/api 変更必要・別 Issue）。
- 監査ログ CSV/JSON エクスポート（baseline OOS-2: 新規 endpoint・別 Issue）。
- `apps/api` / D1 / Google Form の変更。

## 不変条件

1. OKLch トークン正本化（`tokens.css` / `design-tokens.md`）維持。CSS は削除のみで追加なし＝HEX 直書き混入リスク 0。
2. 削除する 3 セレクタは **削除前に再度 grep で 0 参照を確認**してから削除する（AC-1）。
3. 監査ログ focused Vitest（AuditLogPanel.component / AuditLogCard）は dead CSS 非依存 → テスト変更不要。回帰確認のみ。
4. D1 直接アクセス禁止・既存 API surface のみ（CLAUDE.md UI prototype alignment 不変条件）。
5. 行番号ではなく **セレクタ名**で削除範囲を確定する（issue 記載の行 1602-1618 は stale）。

## CONST_007 スコープ確認

本タスクは単一ファイル `globals.css` の 3 ブロック削除に閉じる単一サイクルタスク。分割・先送りは不要。baseline OOS-1/OOS-2 は親 workflow が確定した独立 Issue 候補（API 変更・新規 endpoint 必須）であり、今サイクルで完了させると技術的に破綻するため別 Issue へ分離する（CONST_007 例外条件 1 に該当・実施場所を明記済み）。

## 参照

- 親 workflow: `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/`
- 元 unassigned-task: `docs/30-workflows/unassigned-task/task-admin-audit-dead-table-css-cleanup.md`（Phase 12 で consumed 化）
- 不変条件: `CLAUDE.md`「UI prototype alignment / MVP recovery」§不変条件 1（既存 API のみ）/ §不変条件 2（OKLch トークン正本化）
- closed issue recovery: `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
