# issue-295-tag-queue-resolve-race-smoke — タスク仕様書 index

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-295-tag-queue-resolve-race-smoke |
| ディレクトリ | docs/30-workflows/issue-295-tag-queue-resolve-race-smoke |
| Wave | 7 followup |
| 実行種別 | sequential |
| 作成日 | 2026-05-15 |
| 担当 | app-admin-ops |
| 状態 | implemented_local_evidence_captured |
| Phase 13 | pending_user_approval |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| Issue 番号 | 295 |
| 上流タスク | 07a-parallel-tag-assignment-queue-resolve-workflow / 02b-parallel-meeting-tag-queue-and-schema-diff-repository |
| workflow_state | implemented_local_evidence_captured |
| implementation_status | implementation_complete_pending_runtime_smoke_and_pr |

## 目的

07a で実装された tag queue resolve workflow の guarded UPDATE（`UPDATE ... WHERE status IN ('queued','reviewing')`、changes=0 → 409 `race_lost`）が、in-memory D1 では再現できない「真の同時 POST」の競合状況において、staging（実 D1）でも 1 件のみ成功・敗者は 409 `race_lost`・副作用なしを満たすことを smoke 経由で検証する。

## スコープ

### 含む（今サイクルで全て完了）

- `scripts/smoke/tag-queue-race.mjs` 新規作成（Node 24 ESM、標準 `fetch` で並行 POST、結果 JSON 保存）
- `scripts/smoke/__tests__/tag-queue-race.test.sh` 新規作成（引数 parse・analyzeResults を mock で検証）
- `scripts/smoke/README.md` 追記（存在しなければ新規）— `tag-queue-race.mjs` の使い方・staging 前提
- staging 上での実行手順（fixture queue 準備 + 実行 + evidence 保存）
- evidence 保存（script stdout JSON + D1 SELECT 結果）

### 含まない

- queue resolve SQL の再設計
- member_tags schema 変更（UT-07A-04 領域）
- 本番 D1 への apply

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 07a-parallel-tag-assignment-queue-resolve-workflow | resolve workflow / `race_lost` 分岐 |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | queue / member_tags repo |
| 下流 | なし | followup smoke のため後続なし |

## 受入条件 (AC)

- AC-1: 同一 `queueId` に対する並行 confirmed/rejected POST（concurrency >= 2、推奨 5）が staging で実行できる
- AC-2: 結果のうち成功は 1 件のみ（HTTP 200 + `{ok:true}`）
- AC-3: 敗者は全て HTTP 409 で `{ok:false, error:"race_lost"}` を返す
- AC-4: 副作用が成功 payload 分のみ：`member_tags` 増分 = 成功 payload 行数、`audit_log` 増分 = 成功 1 件
- AC-5: evidence（並行実行結果 JSON + 副作用確認 SQL 結果）が `outputs/phase-11/<timestamp>/` に保存される

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md / outputs/phase-02/script-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md / outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md / outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | runtime_pending | outputs/phase-11/main.md + result.json |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md ほか strict 7 |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/workflows/tagQueueResolve.ts | `race_lost` 分岐ロジック |
| 必須 | apps/api/src/routes/admin/tags-queue.ts | `ERROR_TO_STATUS` / route handler |
| 必須 | docs/30-workflows/unassigned-task/UT-07A-03-tag-queue-race-smoke.md | 既存簡易仕様 |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/ | 07a 全体仕様 |
| 参考 | scripts/smoke/provision-staging-secrets.sh | 既存 staging smoke 構造 |
| 参考 | scripts/smoke/__tests__/ | shell test 慣習 |

## 触れる不変条件

- #5: `apps/web` から D1 直接アクセス禁止 — smoke script も同様に HTTP `/admin/tags/queue/:queueId/resolve` 経由のみで D1 へ間接アクセスする

## 完了判定

- Phase 1〜12 が `outputs/` に成果物を持つ
- Phase 13 は user 承認待ちで commit / PR / push 未実行
- AC-1〜AC-5 すべてが Phase 07 マトリクスで実装/検証手段とトレース
- Phase 12 必須 6 成果物が `outputs/phase-12/` に存在

## 関連リンク

- 上流: ../completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/index.md
- 既存簡易仕様: ../unassigned-task/UT-07A-03-tag-queue-race-smoke.md
- Issue: https://github.com/daishiman/UBM-Hyogo/issues/295
