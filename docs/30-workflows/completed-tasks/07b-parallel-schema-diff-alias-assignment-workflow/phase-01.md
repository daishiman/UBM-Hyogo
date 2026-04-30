# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`schema_diff_queue` の状態モデル（`queued | resolved`）と、`schema_questions.stableKey` 更新 / 過去 `response_fields.stableKey` の back-fill / dry-run と apply の境界 / alias 重複阻止 / audit log を満たす alias 確定 workflow の責務範囲を確定する。不変条件 #1（schema をコードに固定しない）と #14（schema 変更は `/admin/schema` 集約）の workflow 側の担保を Phase 2 以降へ handoff する。

## 実行タスク

1. schema_diff_queue / schema_questions / schema_versions / response_fields / audit_log の columns 確認（02b repo 経由）
2. alias 確定の入力 / 出力 / status code 確定（dryRun 切替含む）
3. 状態遷移と禁止遷移の表化
4. AC 10 件の quantitative 化（dryRun 件数 / back-fill 件数 / status code）
5. true issue 抽出（dry-run / apply 境界、alias collision の pre-check / DB constraint、back-fill batch サイズ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey + alias の関係 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | `/admin/schema` 集約 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | schema テーブル定義 |
| 必須 | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/index.md | endpoint 契約 |
| 必須 | docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/phase-02.md | UI 連携 |
| 必須 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | upstream sync |
| 必須 | CLAUDE.md | 不変条件 #1, #14 |

## 実行手順

### ステップ 1: scope 確定

- 入力: `POST /admin/schema/aliases` body `{ questionId, stableKey, dryRun?: boolean }`
- 出力 (apply): 200 + `{ questionId, oldStableKey, newStableKey, affectedResponseFields, queueStatus: 'resolved' }`
- 出力 (dryRun): 200 + `{ questionId, currentStableKey, proposedStableKey, affectedResponseFields, currentStableKeyCount, conflictExists: boolean }`
- error: 400 (zod), 401, 403, 404 (questionId), 409 (queue 既 resolved), 422 (stableKey 重複)

### ステップ 2: 状態遷移表

| from | to | 条件 |
| --- | --- | --- |
| (none) | queued | 03a sync hook で diff 検出時自動投入 |
| queued | queued | dryRun 実行（書き込みなし、状態維持） |
| queued | resolved | apply 実行成功（stableKey 更新 + back-fill 完了） |
| resolved | resolved | idempotent（同一 stableKey の再 apply は no-op） |
| resolved | queued | 禁止（unidirectional） |
| queued | (削除) | manual 削除のみ（API 経由なし） |

### ステップ 3: AC quantitative

- AC ごとに「http status / DB の事後状態 / 影響行数 / audit_log entry の有無」を測定指標化
- back-fill batch のサイズ（100 行/batch）は CPU 30s 内に収まる前提で計測

### ステップ 4: true issue

- dry-run mode は GET にすべきか POST + flag にすべきか
- alias collision を pre-check (SELECT) で阻止するか DB UNIQUE constraint に任せるか
- back-fill が 30s に収まらない場合 cron に分割するか

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 状態遷移を state machine 図に |
| Phase 4 | AC × 検証手段 |
| Phase 7 | AC マトリクスのトレース元 |
| Phase 10 | gate 判定根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #1 | stableKey は schema_questions のみで管理、コード側に固定 questionId 記述なし | grep で string literal 0 件 |
| #5 | workflow は apps/api 内、apps/web から D1 直接アクセスなし | data access boundary |
| #14 | `/admin/schema` UI 経由の resolve のみが stableKey を更新する | endpoint 定義 |
| 認可境界 | admin user 以外からの呼び出しは 401/403 | admin gate |
| 無料枠 | 1 apply = 1 UPDATE (queue) + 1 UPDATE (schema_questions) + N UPDATE (response_fields) + 1 INSERT (audit) | 100k writes/日 |
| audit | 全 apply（dryRun 除く）が audit_log に残る | 操作トレース |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | column 確認 | 1 | pending | 02b repo |
| 2 | alias 確定契約 | 1 | pending | input/output/error |
| 3 | 状態遷移表 | 1 | pending | from/to |
| 4 | AC quantitative | 1 | pending | http+DB+audit |
| 5 | true issue | 1 | pending | dryRun / collision / batch |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope + 状態遷移表 + AC + true issue |
| メタ | artifacts.json | Phase 1 を completed |

## 完了条件

- [ ] 状態遷移表が 6 行以上
- [ ] AC 10 件すべてに測定指標
- [ ] true issue 3 件以上
- [ ] 不変条件 #1, #14 に対する workflow 側の担保案

## タスク100%実行確認

- 全実行タスクが completed
- artifacts.json で phase 1 を completed

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ: 状態遷移表を state machine 図化
- ブロック条件: AC 未定義なら次へ進めない

## 真の論点

1. dry-run mode の表現方法 → POST + `dryRun=true` query にする（apply と endpoint を統合し UI から切り替えやすく）
2. alias collision 阻止 → DB UNIQUE constraint を一次防御、pre-check は UX のため二次防御として SELECT
3. back-fill batch → 100 行/batch を D1 batch でループ、CPU 30s 制限内なら最大 N 万行は単一 request で完了。超える可能性が見えたら cron 分割を Phase 3 で評価

## 依存境界

- 上流: 04c endpoint, 06c UI 呼び出し, 03a sync (diff 投入), 02b/02c repo
- 下流: 08a/b の test
- responsibility: workflow logic は apps/api 内、UI 側は呼び出しのみ、stableKey 確定は本 workflow のみ

## 価値とコスト

- 価値: schema 変更を `/admin/schema` に集約しつつ、過去 response への影響を back-fill で吸収できる
- コスト: 1 apply = 100 fields の back-fill 想定で約 102 D1 writes / 月 200 件 = 20400 writes/月（無料枠の 0.7%）

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | schema 変更追跡と back-fill が両立するか | TBD |
| 実現性 | D1 batch + Workers 30s 内で完了するか | TBD |
| 整合性 | 不変条件 #1, #14 を破らないか | TBD |
| 運用性 | dryRun → apply のオペレーションが現実的か | TBD |
