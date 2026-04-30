# 07a-parallel-tag-assignment-queue-resolve-workflow — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | tag-assignment-queue-resolve-workflow |
| ディレクトリ | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow |
| Wave | 7 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | app-admin-ops |
| 状態 | completed |
| Phase 13 | pending_user_approval |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`tag_assignment_queue` の状態遷移ロジック（candidate → confirmed → `member_tags` 反映、または rejected with reason）を確定し、06c の `/admin/tags` UI から呼ばれる `resolve` workflow を実装する。queue 状態遷移は unidirectional で audit log に残る。

## スコープ

### 含む
- `apps/api/src/workflows/tagQueueResolve.ts`（resolve handler、guarded update 成功後に member_tags 更新 + queue status 更新 + audit）
- queue 状態 alias: 仕様語 `candidate | confirmed | rejected`、DB/API 実装語 `queued | resolved | rejected`
- `POST /admin/tags/queue/:queueId/resolve` の handler 実装（04c 定義 endpoint と接続）
- candidate 自動生成ロジック（current_response 更新時に queue 投入）
- reject 時の `reason` 必須記録（zod validation）
- 状態遷移の audit log（action: `tag_queue.resolve.confirmed` / `tag_queue.resolve.rejected`）
- duplicate resolve の冪等性（既に resolved/rejected な queue を同じ action で再 resolve しても safe）
- `/admin/tags` UI からの fetch hook と error mapping

### 含まない
- schema_diff_queue workflow（07b）
- attendance workflow（07c）
- audit log の table 設計と repository（02c で実装済み、本タスクは利用のみ）
- tag_definitions の seed（01a）
- 自己申告タグの UI（不変条件 #13、不採用）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | endpoint 定義 |
| 上流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | UI 側の呼び出し契約 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | candidate 投入のトリガー |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | queue / member_tags repo |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | audit log repo |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | resolve workflow の contract / unit test |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | tags queue resolve E2E |
| 並列 | 07b, 07c | 同 Wave だが対象 queue が別 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | 運用ルール「タグ付与は管理者レビューを通す」 |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | queue panel 仕様、resolve API |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | tag_assignment_queue / member_tags / audit テーブル |
| 必須 | docs/30-workflows/completed-tasks/04c-parallel-admin-backoffice-api-endpoints/index.md | endpoint 契約 |
| 必須 | docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/phase-02.md | UI 側 component |
| 参考 | docs/00-getting-started-manual/gas-prototype/ | 操作叩き台（本番仕様にしない） |

## 受入条件 (AC)

- AC-1: `POST /admin/tags/queue/:queueId/resolve` で `action=confirmed, tagCodes=[...]` を送ると、guarded update 成功後に `member_tags` 行が追加され、queue status が `resolved` に更新される（不変条件 #13）
- AC-2: `action=rejected, reason="..."` を送ると、queue status が `rejected` に更新され、reason が記録される（reason 空文字は 400）
- AC-3: 既に `resolved` または `rejected` な queue に同じ action を送ると idempotent（200 + 既存状態）、別 action は 409
- AC-4: 状態遷移は unidirectional：`resolved → queued` や `rejected → resolved` を試みると 409
- AC-5: resolve 操作が `audit_log` に `actor=admin.userId, action=tag_queue.resolve.{confirmed|rejected}, target=queueId, payload={tagCodes,reason}` で記録される
- AC-6: `tagCodes` の各 code が `tag_definitions.code` に存在しない場合は 400
- AC-7: 削除済み会員（isDeleted=true）の queue を resolve しようとすると 404/409 系で fail closed
- AC-8: candidate 自動投入: `current_response_id` 更新時に member_tags が空かつ queue に未解決行が無ければ queued 行を 1 件作成
- AC-9: queue resolve 後、`/admin/tags` UI で再取得により queue リストから消える（UI 連携）
- AC-10: 認可境界：admin user 以外からの resolve 呼び出しは 401/403、resolve handler は admin gate 通過後のみ実行

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md / outputs/phase-02/tag-queue-state-machine.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md / outputs/phase-04/tag-queue-test-strategy.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md / outputs/phase-05/tag-queue-implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md / outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## Phase 12 成果物

| Task | ファイル | 状態 |
| --- | --- | --- |
| Phase 12 本体 | outputs/phase-12/main.md | completed |
| Task 1 実装ガイド | outputs/phase-12/implementation-guide.md | completed |
| Task 2 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | completed |
| Task 3 更新履歴 | outputs/phase-12/documentation-changelog.md | completed |
| Task 4 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | completed |
| Task 5 スキルフィードバック | outputs/phase-12/skill-feedback-report.md | completed |
| Task 6 準拠確認 | outputs/phase-12/phase12-task-spec-compliance-check.md | completed |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/tag-queue-state-machine.md | 状態遷移図 + audit |
| ドキュメント | outputs/phase-04/tag-queue-test-strategy.md | unit / contract / E2E |
| ドキュメント | outputs/phase-05/tag-queue-implementation-runbook.md | resolve handler 擬似コード |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 |
| メタ | artifacts.json | 機械可読サマリー |
| メタ | outputs/artifacts.json | root artifacts parity |
| 仕様書 | phase-01.md 〜 phase-13.md | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api Hono | 100k req/日 |
| Cloudflare D1 | tag_assignment_queue / member_tags / audit_log | 5GB / 500k reads / 100k writes |

## Secrets 一覧（このタスクで導入）

なし。AUTH_SECRET 等は 05a で確定済み。

## 触れる不変条件

- #5: apps/web から D1 直接アクセス禁止（resolve は apps/api workflow）
- #13: tag は admin queue → resolve 経由で member_tags に反映（直接編集禁止）

## 完了判定

- Phase 1〜12 の状態が artifacts.json と一致
- Phase 13 は user 承認待ちで commit / PR / push 未実行
- AC 10 件すべてが Phase 7 / 10 でトレース
- Phase 12 必須 7 成果物が `outputs/phase-12/` に存在
- root `artifacts.json` と `outputs/artifacts.json` が一致

## 関連リンク

- 上位 README: ../../02-application-implementation/README.md
- 共通テンプレ: ../../02-application-implementation/_templates/phase-template-app.md
- 上流 task: ../04c-parallel-admin-backoffice-api-endpoints/index.md, ../../02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/index.md
- 下流 task: ../../02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/index.md, ../../02-application-implementation/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/index.md
