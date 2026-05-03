# Phase 5: 既存定義棚卸し（03a / 03b / 実装 3 面差分抽出）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 既存定義棚卸し |
| 作成日 | 2026-05-02 |
| 前 Phase | 4 (verify suite 設計) |
| 次 Phase | 6 (`_design/sync-jobs-spec.md` 初版作成) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #198（CLOSED, クローズドのまま docs 整備） |

## 目的

`_design/sync-jobs-spec.md` を中立な正本にするため、03a（schema sync）/ 03b（response sync）/ 実装（`apps/api/src/jobs/sync-forms-responses.ts`）の 3 面における `job_type` enum / `metrics_json` key / lock TTL の現行値を全件抽出し、差分マトリクスとして固定する。

## 実行タスク

1. `rg` で `sync_jobs` 参照箇所を全件抽出
2. 実装側（`apps/api/src/jobs/sync-forms-responses.ts`）から現行値を抽出
3. 03a 側 task spec の想定値を抽出
4. 03b 側 task spec / 関連 follow-up の現行値を抽出
5. 差分マトリクスを `outputs/phase-05/inventory-matrix.md` に保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 実装値（lock TTL / cursor / metrics 書き込み形） |
| 必須 | apps/api/src/jobs/sync-lock.ts | lock 取得仕様 |
| 必須 | apps/api/src/jobs/cursor-store.ts | cursor 永続化仕様 |
| 必須 | docs/30-workflows/completed-tasks/ | 03a / 03b の sync 系 task spec を全件検索 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節 L58 cursor high-water mark |

## 実行手順（ステップ別）

### ステップ 1: 参照箇所の全件抽出

```bash
rg -n "sync_jobs" docs/30-workflows .claude/skills apps/api > outputs/phase-05/grep-references.txt
```

### ステップ 2: 実装側の値抽出

`apps/api/src/jobs/sync-forms-responses.ts` から下記を抽出して `outputs/phase-05/impl-values.md` に記録する:

- `job_type` の文字列リテラル（例: `"response_sync"`）
- `metrics_json` に書き込む key 一覧（`cursor` / `processed_count` / `error_count` 等）
- lock TTL（10 分）の根拠箇所（行番号付き）
- `cursor` の high-water mark 形式（`submittedAt|responseId`）

### ステップ 3: 03a 側 task spec の想定値抽出

`docs/30-workflows/completed-tasks/` 配下から `schema_sync` / 03a 系 sync 仕様を grep し、想定 `job_type` / `metrics_json.write_count` 等を `outputs/phase-05/03a-spec-values.md` に記録する。

### ステップ 4: 03b 側 task spec の値抽出

`docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/` および 03b 親タスク配下から、`metrics_json.cursor` 中心の現行記述を `outputs/phase-05/03b-spec-values.md` に記録する。

### ステップ 5: 差分マトリクス作成

`outputs/phase-05/inventory-matrix.md` に下記の 3×3 マトリクスを作成する:

| 観点 | 03a spec | 03b spec | 実装 (`sync-forms-responses.ts`) |
| --- | --- | --- | --- |
| `job_type` enum | ... | ... | ... |
| `metrics_json` 必須 key | ... | ... | ... |
| `metrics_json` job_type 別 key | ... | ... | ... |
| lock TTL | ... | ... | 10 分 |
| `lock_acquired_at` 運用 | ... | ... | ... |
| PII 取り扱い方針 | ... | ... | ... |

各セルに「定義箇所のパス + 行番号」を必ず付与する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 棚卸し総括 |
| ドキュメント | outputs/phase-05/inventory-matrix.md | 3 面差分マトリクス |
| ドキュメント | outputs/phase-05/impl-values.md | 実装側の値抽出結果 |
| ドキュメント | outputs/phase-05/03a-spec-values.md | 03a 側想定値 |
| ドキュメント | outputs/phase-05/03b-spec-values.md | 03b 側現行値 |
| データ | outputs/phase-05/grep-references.txt | rg 結果スナップショット |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] `sync_jobs` 参照箇所が rg で全件抽出されている
- [ ] 実装側の `job_type` / `metrics_json` / lock TTL が行番号付きで抽出されている
- [ ] 03a 想定値 / 03b 現行値が抽出されている
- [ ] 3 面の差分マトリクスが `inventory-matrix.md` に固定されている
- [ ] 差分のうち Phase 6 で「中立化が必要」な項目が明示されている

## DoD（implementation / NON_VISUAL）

- 5 ファイル（main.md / inventory-matrix.md / impl-values.md / 03a-spec-values.md / 03b-spec-values.md）+ grep-references.txt が存在
- 各セルに参照パス + 行番号が紐付いている
- indexes drift なし（本 Phase でも `.claude/skills/...` の編集は発生しない）

## 次 Phase

- 次: 6 (`_design/sync-jobs-spec.md` 初版作成)
- 引き継ぎ事項: 3 面差分マトリクス / 中立化が必要な項目一覧
- ブロック条件: 差分マトリクスが空白セルを残している / 実装値が行番号未取得
