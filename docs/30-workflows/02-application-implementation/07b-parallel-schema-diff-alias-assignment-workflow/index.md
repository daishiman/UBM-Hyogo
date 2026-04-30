# 07b-parallel-schema-diff-alias-assignment-workflow — タスク仕様書 index

> Supersession note（2026-04-30 / issue-191）:
> `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` が 07b の書き込み先を上書きする。
> `POST /admin/schema/aliases` の endpoint は維持するが、実装時は `schema_questions.stableKey` を直接更新せず、
> `schema_aliases` に alias 行を INSERT し、`schema_diff_queue` を resolved に進める。
> 旧記述の「stableKey 更新」は stale contract として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | schema-diff-alias-assignment-workflow |
| ディレクトリ | doc/02-application-implementation/07b-parallel-schema-diff-alias-assignment-workflow |
| Wave | 7 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | app-admin-ops |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

`schema_diff_queue` の alias 候補提案・admin による alias 確定・`schema_questions.stableKey` 更新・過去 response への back-fill（dry-run + apply）を行う workflow を確定する。alias 重複は DB constraint で阻止し、Form 構造変更は `/admin/schema` 専用画面に集約する不変条件 #14 を担保する。

## スコープ

### 含む
- `apps/api/src/workflows/schemaAliasAssign.ts`（alias 確定 + `schema_aliases` 書き込み + queue resolved）
- alias 候補提案ロジック（既存 stableKey との文字列類似 + section / index 一致による recommend）
- `POST /admin/schema/aliases` の handler 実装（04c 定義）
- `POST /admin/schema/aliases?dryRun=true` の dry-run mode（既存 response への影響件数を返すのみ、書き込みなし）
- `schema_questions.stableKey` の UNIQUE constraint 維持（同 schema_version 内 alias 重複 → 422）
- 過去 response の `response_fields.stableKey` を更新する back-fill batch
- alias 確定操作の audit log（action: `schema_diff.alias_assigned`）
- diff queue の状態遷移（unresolved → assigned）

### 含まない
- `/admin/schema` UI 本体（06c）
- `forms.get` 同期 job（03a）
- tag queue workflow（07a）
- attendance / audit log の table 設計（02c で実装済み、利用のみ）
- alias 自動推論 ML（手動承認のみ）
- schema_versions の作成（03a）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | endpoint 定義 |
| 上流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | UI 側の呼び出し契約 |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | schema_diff_queue 投入 |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | schema_questions / schema_diff_queue / response_fields repo |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | audit_log repo |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | workflow contract / unit test |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | schema 画面 alias 割当 E2E |
| 並列 | 07a, 07c | 同 Wave |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey と alias の関係 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | `/admin/schema` 集約原則 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | schema テーブル定義 |
| 必須 | doc/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | upstream sync |
| 必須 | doc/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | endpoint 契約 |
| 必須 | doc/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/phase-02.md | UI 連携 |

## 受入条件 (AC)

- AC-1: `POST /admin/schema/aliases` で `{ questionId, stableKey, dryRun: false }` を送ると、tx 内で `schema_aliases` に alias 行が INSERT され、`schema_diff_queue` の status が `resolved` に更新される（不変条件 #14 / issue-191）
- AC-2: `dryRun: true` で送ると、書き込みなしに `{ affectedResponseFields: N, currentStableKeyCount: M }` を返す
- AC-3: 同 schema_version 内で同一 stableKey を別 questionId に割り当てようとすると 422（DB UNIQUE constraint or pre-check）
- AC-4: alias 確定後、過去の `response_fields.questionId` が一致する行の `stableKey` が更新される（back-fill apply mode）
- AC-5: back-fill が batch（D1 統計上 100 行/batch）で実行され、Workers 30s 制限内で完了
- AC-6: alias 確定操作が `audit_log` に `actor=admin.userId, action=schema_diff.alias_assigned, target=questionId, payload={oldStableKey,newStableKey,affectedFields}` で記録される
- AC-7: alias 候補提案: `GET /admin/schema/diff` の response に `recommendedStableKeys: string[]` が含まれ、既存 stableKey との Levenshtein distance か section/index 一致でスコア順に提示される
- AC-8: 不変条件 #1 担保: stableKey は `schema_questions` でのみ管理、コードに固定の質問 ID を埋め込まない（grep で string literal の questionId 検出 0 件）
- AC-9: 削除済み response（is_deleted=true）の back-fill は skip
- AC-10: 認可境界：admin user 以外は 401/403、handler は admin gate 通過後のみ実行

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/schema-alias-workflow-design.md | 状態遷移 + back-fill 設計 |
| ドキュメント | outputs/phase-04/schema-alias-test-strategy.md | dry-run / apply / back-fill test |
| ドキュメント | outputs/phase-05/schema-alias-implementation-runbook.md | 擬似コード |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-01.md 〜 phase-13.md | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api Hono | 100k req/日、CPU 30s |
| Cloudflare D1 | schema_diff_queue / schema_questions / response_fields / audit_log | 5GB / 500k reads / 100k writes |

## Secrets 一覧（このタスクで導入）

なし。

## 触れる不変条件

- #1: 実フォーム schema をコードに固定しすぎない（stableKey 経由のみ）
- #14: schema 変更は `/admin/schema` に集約

## 完了判定

- Phase 1〜13 状態 = artifacts.json
- AC 10 件すべてが Phase 7 / 10 でトレース
- 4 条件 PASS
- Phase 13 PR が user 承認後

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- 上流 task: ../04c-parallel-admin-backoffice-api-endpoints/index.md, ../06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/index.md, ../03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md
- 下流 task: ../08a-parallel-api-contract-repository-and-authorization-tests/index.md, ../08b-parallel-playwright-e2e-and-ui-acceptance-smoke/index.md
