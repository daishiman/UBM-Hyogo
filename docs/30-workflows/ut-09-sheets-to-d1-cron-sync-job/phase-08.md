# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-27 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | specification-design（refactoring / dry） |

## 目的

Phase 1〜7 で確定した要件・設計・実装ランブック・AC マトリクスに対し、命名・型・パス・エンドポイントの一貫性を担保するための DRY 化を行い、Phase 9 の品質保証以降に「同じ概念に複数の表記が並ぶ」状態を持ち越さないこと。重複コードの抽出可否を判定し、navigation drift（doc / artifacts.json / outputs path の不整合）を解消する。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs path / artifacts.json を横断 grep し、命名揺れ（例: `sync_job_logs` vs `syncJobLogs`、`/admin/sync` vs `/admin/sync/run`）の有無を洗い出す（完了条件: 揺れ件数が表化されている）。
2. 共通型 `SheetsRow` / `MemberRow` / `SyncResult` の単一定義先（`apps/api/src/jobs/types.ts` を提案）を確定し、Phase 5 ランブック・Phase 4 テスト戦略の擬似コードと整合させる（完了条件: 型定義の重複が 0）。
3. retry-backoff util / write-queue serializer が他ジョブに転用可能な形で `apps/api/src/utils/` に切り出されているか確認する（完了条件: 転用可否の判定が記述されている）。
4. `/admin/sync` の URL / メソッド / 認可方式の表記を全 Phase で統一する（完了条件: `POST /admin/sync` + Bearer `SYNC_ADMIN_TOKEN` で全 Phase 一致）。
5. artifacts.json の outputs path と各 phase-XX.md の参照 path が一致するか確認する（完了条件: 不一致 0）。
6. doc 内リンク（`docs/30-workflows/.../phase-XX.md`、`docs/30-workflows/unassigned-task/...`）を全部辿り、リンク切れが無いか確認する（完了条件: navigation drift 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 用語・命名の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/*` 命名規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | テーブル名・カラム名規約 |
| 参考 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/phase-08.md | DRY 化観点の参照事例 |

## Before / After 比較テーブル

### 命名規則

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| sync log table | `syncJobLogs` / `sync_logs` 表記揺れ想定 | `sync_job_logs` に統一 | snake_case D1 規約、index.md 正本 |
| sync lock table | `syncLock` / `sync_lock` | `sync_locks`（複数形） | members / sync_job_logs と複数形で揃える |
| job entry 関数 | `runSync` / `executeSync` | `runSheetsToD1Sync` | scope を関数名に明記 |
| trigger 種別 | `cron` / `scheduled` 混在 | `'cron' \| 'admin'` の union | Phase 2 モジュール設計準拠 |

### 型定義

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Sheets 行 | 各モジュールで `string[]` 直書き | `SheetsRow = string[]` を `apps/api/src/jobs/types.ts` に集約 | 不変条件 #1 と整合（Sheets schema を mapper 層に閉じる） |
| D1 row | 各 mapper で local type 定義 | `MemberRow` を `apps/api/src/jobs/types.ts` に集約、UT-04 schema 由来の zod 型を再 export | 二重定義回避 |
| 同期結果 | `{ ok, count }` 等の散在 | `SyncResult { fetched, upserted, failed, durationMs, lockHeldMs }` 単一定義 | Phase 6 異常系・Phase 5 log と一致 |
| Env binding | adhoc `any` | `Env` interface 単一定義（D1 binding + 3 Secret） | Phase 9 secret hygiene 前提 |

### パス（utils ディレクトリ整理）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| retry util | `apps/api/src/jobs/retry.ts`（ジョブ内） | `apps/api/src/utils/with-retry.ts` | UT-10（エラーハンドリング標準化）で他ジョブ転用前提 |
| write queue | `apps/api/src/jobs/queue.ts` | `apps/api/src/utils/write-queue.ts` | 同上 |
| sheets fetcher | `apps/api/src/jobs/sheets.ts` | `apps/api/src/integrations/sheets-fetcher.ts` | UT-03 認証 client と integrations/ 配下で揃える |
| mapper | `apps/api/src/jobs/sheets-mapper.ts` | `apps/api/src/jobs/mappers/sheets-to-members.ts` | mapper サブディレクトリ化 |

### エンドポイント

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 手動同期 | `/admin/sync/run` / `/api/admin/sync` | `POST /admin/sync` | api-endpoints.md と Phase 2 設計に統一 |
| 認可方式 | header 名揺れ（`X-Admin-Token` 等） | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` | RFC 6750 準拠、UT-21 と整合 |
| バージョン | 未付与 / `/v1/admin/sync` | 未付与のまま v1 暗黙（admin route の API バージョニングは MVP では行わない） | 内部 admin のため OK、UT-21 と Phase 3 で合意 |

## 重複コードの抽出箇所

| # | 重複候補 | 抽出先 | 他ジョブ転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | retry-backoff（`SQLITE_BUSY` / 5xx 共通） | `apps/api/src/utils/with-retry.ts` | 可（UT-10 で formalize） | 引数で `isRetryable(err)` を受ける |
| 2 | write-queue serializer | `apps/api/src/utils/write-queue.ts` | 可 | 他のバッチ書き込みジョブから再利用 |
| 3 | admin auth middleware | `apps/api/src/middlewares/admin-auth.ts` | 可（UT-21 と共有） | Bearer 検証ロジックの集約 |
| 4 | structured logger（sync_job_logs 書き込み） | `apps/api/src/lib/sync-logger.ts` | 限定的（sync 系ジョブのみ） | UT-08 monitoring と連携 |
| 5 | Sheets pagination loop | `apps/api/src/integrations/sheets-fetcher.ts` の内部関数 | 限定的 | 他シート処理が出てきた時に再評価 |
| 6 | env validation（3 Secret 揃っているか） | `apps/api/src/lib/env.ts` | 可 | API 起動時 fail-fast |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 原典 unassigned-task への参照 | `docs/30-workflows/unassigned-task/UT-09-...` 実在確認 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/` | 実在 |

## 共通化パターン

- 命名: snake_case（DB） / camelCase（TS 変数） / PascalCase（型） / kebab-case（ファイル）の住み分けを徹底。
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- Cron 表記は cron 式のまま `'0 */6 * * *'` を文字列で記述（自然言語と併記）。
- AC ID は `AC-1`〜`AC-11` のハイフン区切りで全 Phase 統一。

## 削除対象一覧

- Phase 5/6 等で残った仮命名（例: `temp_sync` テーブル、`debug_log` 等）。
- `wrangler.toml` 内の不要 binding コメントアウト（実装フェーズで cleanup）。
- 旧 GAS prototype に由来する命名（`syncSheetsToDb` 等）。

## 実行手順

### ステップ 1: 命名揺れの洗い出し
- `grep -rn 'sync_job\|syncJob\|sync_log' docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job` を実行。
- 表記揺れを表に整理。

### ステップ 2: Before / After 比較テーブルの作成
- 4 区分（命名 / 型 / path / endpoint）で記述。

### ステップ 3: 重複コード抽出箇所の特定
- 6 件以上の抽出候補を列挙し、他ジョブ転用可否を判定。

### ステップ 4: navigation drift 確認
- artifacts.json と各 phase-XX.md の path を照合。
- リンク切れ 0 を確認。

### ステップ 5: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み命名・path を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO の根拠に使用 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に反映 |
| UT-10 | retry-backoff util の formalize 候補として引き渡し |
| UT-21 | `/admin/sync` 命名・認可方式を audit hook と共有 |

## 多角的チェック観点

- 価値性: DRY 化により Phase 5 実装時の手戻り削減。
- 実現性: 既存 utils ディレクトリへの切り出しが Workers ビルドサイズ制約に抵触しないか。
- 整合性: 不変条件 #1（schema 固定回避）、#5（apps/api 内閉鎖）を維持。
- 運用性: 命名の一貫性で runbook / log 検索性が向上。
- 認可境界: `/admin/sync` の認可表記を全 Phase で統一済み。
- 無料枠: util 抽出により bundle 増加が無いことを確認。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名揺れ洗い出し | 8 | spec_created | grep 結果を表化 |
| 2 | 共通型の単一定義先確定 | 8 | spec_created | `apps/api/src/jobs/types.ts` |
| 3 | 重複コード抽出箇所特定 | 8 | spec_created | 6 件以上 |
| 4 | endpoint 表記統一 | 8 | spec_created | `POST /admin/sync` |
| 5 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・重複抽出・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] Before / After 比較テーブルが 4 区分（命名 / 型 / path / endpoint）すべてで埋まっている
- [ ] 重複コードの抽出箇所が 6 件以上列挙されている
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] 共通型の単一定義先が確定している
- [ ] `POST /admin/sync` + Bearer 認可で全 Phase 一致
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 4 区分で網羅
- 重複コード抽出 6 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済みの命名・path 表（Phase 9 free-tier 見積もりや secret hygiene の前提として参照）
  - 重複抽出 util の一覧（Phase 9 line budget 計算で考慮）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - 共通型の単一定義先が決まらない
