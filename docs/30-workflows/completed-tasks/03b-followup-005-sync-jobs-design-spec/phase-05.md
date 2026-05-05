# Phase 5: 既存定義棚卸し（DEFAULT_LOCK_TTL_MS / SyncJobKind / cursor-store の差分一覧）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 既存定義棚卸し |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 4 (verify suite 設計) |
| 次 Phase | 6 (`_shared/sync-jobs-schema.ts` 実装 + テスト + `_design/` 注記追加) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

既存コード・既存ドキュメントに散在する `job_type` enum / lock TTL / metrics_json schema 定義を grep で抽出し、Phase 7 の差し替え対象一覧と「触らないが参照だけする」箇所の境界を確定する。

## 実行タスク

1. `DEFAULT_LOCK_TTL_MS` の出現箇所を全リポジトリで grep
2. `SyncJobKind` の定義 / import 箇所を grep
3. `'response_sync'` / `'schema_sync'` リテラル文字列を grep
4. `JSON.parse` を伴う metrics_json 読み取り箇所を抽出
5. lock TTL 値（`10 * 60 * 1000` / `600000` / `600_000`）の grep
6. 03a / 03b spec から `_design/sync-jobs-spec.md` への参照リンク有無を grep

## 棚卸しコマンド集

```bash
# lock TTL リテラル（今回の置換対象は Forms response sync。legacy Sheets sync の同名定数は別責務）
rg -n "DEFAULT_LOCK_TTL_MS|10 \* 60 \* 1000|600_000|600000" apps/api/src/jobs/sync-forms-responses.ts

# SyncJobKind
rg -n "SyncJobKind" apps/api/src

# job_type 文字列リテラル
rg -n "'response_sync'|\"response_sync\"|'schema_sync'|\"schema_sync\"" apps/api/src

# metrics_json JSON.parse 任意キャスト
rg -n "JSON\.parse.*as \{" apps/api/src

# _design 参照
rg -n "_design/sync-jobs-spec" docs/30-workflows .claude/skills/aiworkflow-requirements
```

## 期待される grep 結果（事前要約・Phase 5 で再確認）

| キー | ファイル:行 | 状態 | アクション |
| --- | --- | --- | --- |
| `DEFAULT_LOCK_TTL_MS` | apps/api/src/jobs/sync-forms-responses.ts:80 | リテラル定義 | Phase 7 で削除 |
| `SyncJobKind` | apps/api/src/repository/syncJobs.ts:6 | ローカル定義 | Phase 7 で re-export 化 |
| `SyncJobKind` import | （後続 grep で確認） | call site | 互換維持で編集不要 |
| `'response_sync'` | apps/api/src/jobs/cursor-store.ts:19 | 文字列リテラル | Phase 7 で共有定数置換 |
| `'response_sync'` | apps/api/src/jobs/sync-forms-responses.ts | start() 引数 | Phase 7 で `RESPONSE_SYNC` 定数化 |
| `JSON.parse(...) as { cursor?: string }` | apps/api/src/jobs/cursor-store.ts | 任意キャスト | Phase 7 で `parseMetricsJson` 置換 |

## 03a/03b spec 参照確認

- `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/` 配下
- `docs/30-workflows/03a-*` 配下（取り込み済みの場合）

各 spec の関連ファイル末尾に `_design/sync-jobs-spec.md` リンクが既に張られていれば現状維持、無ければ Phase 8 で追加。

## 既存テストの参照箇所

- `sync-forms-responses.test.ts` で `DEFAULT_LOCK_TTL_MS` / `SyncJobKind` を import している場合は、Phase 7 編集時に import 元の差し替えが必要
- `sync-sheets-to-d1.test.ts` の `JSON.parse` 期待値は `parseMetricsJson` 経由でも同一結果になることを Phase 7 で確認

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | grep 結果一覧 / 差し替え対象表 / 参照確認結果 |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 統合テスト連携

- 棚卸しで「想定外の DEFAULT_LOCK_TTL_MS 利用」が見つかった場合、Phase 7 のスコープを拡張
- 想定外の見落としが多い場合、Phase 9 typecheck で検出可能

## 完了条件

- [ ] `DEFAULT_LOCK_TTL_MS` の全出現箇所が記録されている
- [ ] `SyncJobKind` の定義 / import 箇所が一覧化されている
- [ ] `'response_sync'` / `'schema_sync'` リテラルの全箇所が記録されている
- [ ] metrics_json `JSON.parse` 箇所が全て抽出されている
- [ ] 03a / 03b spec の `_design/` 参照状況が把握されている

## 次 Phase

- 次: 6（`_shared/sync-jobs-schema.ts` 実装 + テスト + `_design/` 注記追加）
- 引き継ぎ事項: 棚卸し結果一覧 / 差し替え対象表
- ブロック条件: 想定外の TTL リテラル / `SyncJobKind` 定義が他に発見され、スコープ拡張判定が必要
