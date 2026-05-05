# Phase 13: PR 作成 - 06c-C-admin-tags

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-C-admin-tags |
| phase | 13 / 13 |
| wave | 06c-fu |
| mode | serial-after-06c-B-and-07a |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

commit/push/PR はユーザー承認まで blocked。PR 本文素材のみ用意する。

## 正本境界

- /admin/tags の正式用途は未タグ会員への割当キュー。
- タグ確定 API は POST /admin/tags/queue/:queueId/resolve のみ。
- request body は packages/shared/src/schemas/admin/tag-queue-resolve.ts の tagQueueResolveBodySchema を正本にする。
- confirmed は tagCodes を必須にし、rejected は reason を必須にする。混在 body は 400。
- member_tags への直接編集 UI/API、タグ辞書・ルール編集の主画面化、新規 tag CRUD endpoint は作らない。
- apps/web は D1 を直接参照せず、admin proxy / client helper 経由で apps/api に委譲する。

## 実行タスク

1. 旧 CRUD 前提が残っていないことを確認する。完了条件: 対象 phase / outputs / artifacts に新規 CRUD endpoint や adminTags repository 前提がない。
2. /admin/tags queue resolve の UI/API/証跡境界を確認する。完了条件: Phase 13 の成果物が GET /admin/tags/queue と POST /admin/tags/queue/:queueId/resolve に限定される。
3. Phase 11 / 12 / 13 の gate を分離する。完了条件: runtime visual evidence と commit/PR がユーザー承認または後続 runtime task まで blocked と明記される。

## 参照資料

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- .claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md
- .claude/skills/aiworkflow-requirements/references/api-endpoints.md
- .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md

## PR 作成 詳細

| 観点 | 採用 | 不採用 |
| --- | --- | --- |
| UI | Queue list + review panel + tag picker | Tag dictionary editor / alias editor / direct assignment panel |
| API | GET /admin/tags/queue, POST /admin/tags/queue/:queueId/resolve | New /admin/tags CRUD family |
| Schema | existing tag_assignment_queue, tag_definitions, member_tags guarded write path | new migration for tag CRUD |
| Audit | admin.tag.queue_resolved, admin.tag.queue_rejected | seven CRUD-style audit actions |
| Evidence | focused tests + deferred visual smoke | unexecuted runtime PASS |

## 30種思考法 compact evidence

| カテゴリ | 適用した思考法 | 結論 |
| --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹 / 帰納 / アブダクション / 垂直思考 | 正本仕様から演繹すると、新規 CRUD は矛盾。既存 queue resolve への縮約が最小矛盾。 |
| 構造分解系 | 要素分解 / MECE / 2軸 / プロセス | UI、API、DB、audit、evidence を分けると queue resolve 以外は scope 外。 |
| メタ・抽象系 | メタ思考 / 抽象化 / ダブルループ | 「未完了だから追加する」前提を捨て、正本の禁止事項から目的を再定義。 |
| 発想・拡張系 | ブレスト / 水平 / 逆説 / 類推 / if / 素人思考 | 追加画面ではなく、既存キューの証跡と handoff を厚くする案が最も単純。 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | CRUD 追加は 07a、06c、11/12 specs、audit 語彙に波及し負債を増やす。 |
| 戦略・価値系 | トレードオン / プラスサム / 価値提案 / 戦略的思考 | 新規機能量を増やさず、正本準拠と後続 smoke 価値を同時に満たす。 |
| 問題解決系 | why / 改善 / 仮説 / 論点 / KJ法 | 根因は admin tags を辞書管理と誤読したこと。論点を queue resolve に束ねる。 |

## 4条件チェック

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 12-search-tags.md / 11-admin-management.md の queue-only 境界に一致。 |
| 漏れなし | PASS | Phase 1-13、artifacts、Phase 12 outputs、正本 index 同期対象を明示。 |
| 整合性あり | PASS | taskType / visualEvidence / status 語彙を artifacts と統一。 |
| 依存関係整合 | PASS | 06c-B + 07a 完了後、08b/09a runtime visual evidence へ渡す。 |

## サブタスク管理

- [x] 旧 CRUD 前提を破棄する
- [x] queue resolve 正本へ再構成する
- [x] outputs/phase-13/main.md を実体化する

## 成果物

- outputs/phase-13/main.md

## 完了条件

- [x] この Phase の必須セクションが埋まっている
- [x] 正本仕様と矛盾する新規 CRUD / direct member_tags 編集を要求していない
- [x] deploy、commit、push、PR を実行していない
