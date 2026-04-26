# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装ランブック） |
| 状態 | pending |

## 目的

unit / contract / E2E / authorization の 4 区分で test を設計し、AC-1〜AC-8 を verify suite にマッピングする。test は実装前に骨子を Phase 4 で固定する。

## 実行タスク

1. unit test 対象モジュールを列挙（flatten / resolve-stable-key / schema-hash / diff-queue-writer / forms-schema-sync 本体）。
2. contract test 対象を列挙（`POST /admin/sync/schema` の response schema、`schema_versions` row 形）。
3. E2E test を Wave 8b に委譲する範囲を明示。
4. authorization test を `/admin/sync/schema` に対して書く（admin gate 不通過 → 403）。
5. test fixture（forms.get の mock JSON、31 項目入り）を準備する。
6. test matrix を outputs/phase-04/test-matrix.md に書き出す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/main.md | module 配置 |
| 必須 | outputs/phase-03/main.md | リスク登録 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目（fixture 元） |
| 参考 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | sync_jobs / cron |

## 実行手順

### ステップ 1: unit test 対象列挙
- `flatten.spec.ts`: forms.get 戻り値 → flat list 31 件、section 6 件であること
- `resolve-stable-key.spec.ts`: 既知 questionId → stableKey 解決、未知 → undefined
- `schema-hash.spec.ts`: 同一 items は同一 hash、順序差異も同一 hash（ソート保証）
- `diff-queue-writer.spec.ts`: unresolved を 1 件挿入、既存 open があれば INSERT しない
- `forms-schema-sync.spec.ts`: lock → fetch → write → release の流れ、失敗時に status=failed

### ステップ 2: contract test 対象
- `POST /admin/sync/schema` の response: `{ jobId: string, status: 'started' | 'conflict' }`
- `schema_versions` row: `{ revisionId, formId, schemaHash, fetchedAt, rawJson }`
- `schema_questions` row: `{ questionId, revisionId, sectionIndex, title, kind, options, stableKey, visibility, required }`
- `schema_diff_queue` row: `{ id, questionId, diffKind, detectedAt, status }`

### ステップ 3: E2E は 8b に委譲
- 本タスクは 08b に渡す test シナリオ案を outputs に残す。
- シナリオ: admin が `/admin/schema` を開く → 同期 → diff queue が 0 件追加 → 模擬的に新規 question を追加して再同期 → 1 件追加。

### ステップ 4: authorization test
- `/admin/sync/schema` 未ログイン → 401
- 一般会員 (admin_users 未登録) → 403
- admin → 200 / 409

### ステップ 5: fixture
- `apps/api/tests/fixtures/forms-get.json` に 31 項目入り mock を配置（formId / revisionId / items[] 完備）。

### ステップ 6: test matrix
- 後述「test matrix」を outputs/phase-04/test-matrix.md にも書く。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の sanity check に test 実行を組み込み |
| Phase 7 | AC matrix の test column を埋める |
| Wave 8a | 本 task の test を contract / repo / authz suite に組み込む |
| Wave 8b | E2E シナリオ案を引き渡す |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き禁止 | #1 | resolve-stable-key.spec.ts の coverage 設計で confirm |
| apps/api 限定 | #5 | sync test は apps/api/tests のみ |
| schema 集約 | #14 | diff queue 投入を contract test 対象 |
| 無料枠 | #10 | 同種 job 排他の test を必ず含める |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 列挙 | 4 | pending | 5 ファイル |
| 2 | contract test 列挙 | 4 | pending | endpoint + 3 row 形 |
| 3 | authz test 設計 | 4 | pending | 401 / 403 / 200 / 409 |
| 4 | fixture 設計 | 4 | pending | forms-get.json |
| 5 | test matrix 出力 | 4 | pending | outputs/phase-04/test-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | test 戦略サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | matrix（AC × test 種別） |
| メタ | artifacts.json | phase 4 を `completed` に更新 |

## 完了条件

- [ ] unit / contract / E2E / authz の 4 区分が網羅されている
- [ ] AC-1〜AC-8 がいずれかの test に対応付けられている
- [ ] fixture の所在と中身仕様が明記
- [ ] artifacts.json の phase 4 が `completed`

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] AC matrix が AC-1〜AC-8 全行を含む
- [ ] fixture が 31 項目 / 6 セクションを満たす
- [ ] 401 / 403 test がある
- [ ] 同種 job 排他 (409) の test がある

## 次 Phase

- 次: 5（実装ランブック）
- 引き継ぎ事項: test 一覧、fixture 仕様
- ブロック条件: AC-1〜AC-8 のいずれかが test 未対応

## verify suite（unit / contract / E2E / authz）

### unit

| 対象 | 検証 |
| --- | --- |
| flatten() | items[] → flat 31 件、sectionHeader 6 件 |
| resolveStableKey() | 既知 26 → stableKey, 未知 → undefined |
| schemaHash() | 順序差異でも同一 hash |
| diffQueueWriter.enqueue() | 同 questionId / open 行があれば INSERT スキップ |
| runSchemaSync() | 正常系 + 失敗系で status 遷移確認 |

### contract

| 対象 | 検証 |
| --- | --- |
| POST /admin/sync/schema | response が `{ jobId, status }`、admin only |
| schema_versions row | カラム full set、revisionId unique |
| schema_questions row | stableKey nullable、visibility 列挙値 |
| schema_diff_queue row | diffKind ∈ {added, changed, removed, unresolved}, status ∈ {open, resolved} |

### E2E（08b 委譲）

- /admin/schema 開く → 同期実行 → 一覧反映 → 新規 question を mock 追加 → 再同期で 1 件加算

### authorization

| ケース | 期待 |
| --- | --- |
| 未ログイン | 401 |
| 一般会員 | 403 |
| admin | 200 |
| admin + 同種 running | 409 |

## test matrix（AC × test）

| AC | unit | contract | authz | E2E | fixture |
| --- | --- | --- | --- | --- | --- |
| AC-1 31 項目・6 セクション保存 | flatten / runSchemaSync | schema_versions / schema_questions row | - | 08b 同期後一覧 | forms-get.json |
| AC-2 unresolved を queue 追加 | resolveStableKey + diffQueueWriter | schema_diff_queue row | - | 08b 新規 question 追加 | forms-get-unknown.json |
| AC-3 alias 解決後 stableKey 更新 | resolveStableKey alias 引き | schema_questions stableKey 列 | - | 07b workflow 経由 | aliases fixture |
| AC-4 同 revisionId 再実行 no-op | runSchemaSync | schema_versions count 不変 | - | - | - |
| AC-5 sync_jobs 遷移記録 | runSchemaSync | sync_jobs row | - | - | - |
| AC-6 同種 job 排他 | runSchemaSync | POST 409 response | admin + running | - | - |
| AC-7 stableKey 直書き禁止 | - | - | - | - | lint rule |
| AC-8 31 項目欠落なし | runSchemaSync | schema_questions count=31 | - | - | forms-get.json |

## fixture 設計

```
apps/api/tests/fixtures/
├── forms-get.json              # 31 項目 + 6 sectionHeader, revisionId='r1'
├── forms-get-unknown.json      # 上記 + 1 不明 question
├── forms-get-revision-bumped.json # revisionId='r2', items 同一
└── aliases.json                # questionId -> stableKey 32 行
```
