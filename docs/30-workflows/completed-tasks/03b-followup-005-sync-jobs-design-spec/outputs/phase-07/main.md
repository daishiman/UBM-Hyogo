# Phase 7: 03a / 03b task spec の参照差し替え

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 03a / 03b task spec の参照差し替え |
| 作成日 | 2026-05-02 |
| 前 Phase | 6 (`_design/sync-jobs-spec.md` 初版作成) |
| 次 Phase | 8 (database-schema.md の参照更新) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #198（CLOSED, クローズドのまま docs 整備） |

## 目的

03a（schema sync）/ 03b（response sync）の各 task spec から `job_type` enum / `metrics_json` schema / lock TTL の **重複定義を削除** し、Phase 6 で作成した `docs/30-workflows/_design/sync-jobs-spec.md` への片側参照リンクに置き換える。

## 実行タスク

1. 差し替え対象ファイルの確定（completed-tasks 配下含む）
2. 03b 関連 task spec の重複定義を削除
3. 03a 側 schema sync 系 task spec の重複定義を削除
4. 各 spec に `> 正本: docs/30-workflows/_design/sync-jobs-spec.md` のリンクを追加
5. 差し替え結果の grep 検証

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | 正本（Phase 6 で作成済み） |
| 必須 | outputs/phase-05/inventory-matrix.md | 削除対象セルの根拠 |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/ | 03b followup 系 |
| 必須 | docs/30-workflows/completed-tasks/ | 03a / 03b 親タスク所在 |

## 実行手順（ステップ別）

### ステップ 1: 差し替え対象ファイルの確定

Phase 5 の grep 結果から対象を抽出し、`outputs/phase-07/target-files.md` に固定する。最低限以下を確認:

- 03b 親 task spec 配下の `job_type` / `metrics_json` / lock TTL 重複箇所
- 03b followup 系（`03b-followup-005-sync-jobs-design-spec.md` 自体は本タスク起票元なので除外）
- 03a 親 task spec 配下の同種の重複箇所

### ステップ 2: 03b 関連 task spec の編集

各対象 spec に対し:

1. `job_type` enum 表 / 列挙を削除
2. `metrics_json` の zod / JSON Schema 定義を削除
3. lock TTL の数値記述を削除
4. 削除箇所に下記の参照ブロックを 1 つだけ挿入:

   ```markdown
   > 正本: [docs/30-workflows/_design/sync-jobs-spec.md](../../_design/sync-jobs-spec.md)
   ```

### ステップ 3: 03a 側の編集

03a schema sync 系 task spec（completed-tasks 配下）にも同手順を適用する。

### ステップ 4: 参照リンクの追加

各 spec の冒頭近く（メタ情報直後を推奨）に `_design/sync-jobs-spec.md` への参照を 1 行で追加し、本文中の重複定義削除箇所にも個別参照を残す。

### ステップ 5: 差し替え結果の検証

```bash
rg -n "job_type|metrics_json|lock_acquired_at" \
   docs/30-workflows --glob '!docs/30-workflows/_design/**' \
   --glob '!docs/30-workflows/03b-followup-005-sync-jobs-design-spec/**'
```

期待: 上記出力に「定義」が残らず、参照リンクと文章説明のみが残る。結果を `outputs/phase-07/post-replacement-grep.txt` に保存。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | 差し替え総括 |
| ドキュメント | outputs/phase-07/target-files.md | 差し替え対象一覧 |
| データ | outputs/phase-07/post-replacement-grep.txt | 検証 grep 結果 |
| 編集差分 | docs/30-workflows/.../*.md（複数） | 03a / 03b の参照差し替え結果 |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] 差し替え対象ファイルが `target-files.md` に列挙されている
- [ ] 03a / 03b 双方の重複定義が削除されている
- [ ] 各 spec から `_design/sync-jobs-spec.md` への参照が 1 つ以上張られている
- [ ] 検証 grep に `定義` が残っていない（参照と説明のみ）
- [ ] 削除に伴うリンク切れが発生していない

## DoD（implementation / NON_VISUAL）

- 差し替え後の各 spec ファイルが正常に読める（壊れた表 / 半端な見出しが残らない）
- 全参照リンクが解決可能（相対パス整合）
- indexes drift なし（`docs/30-workflows/` 配下は indexes 対象外）

## 次 Phase

- 次: 8 (database-schema.md の参照更新 + indexes drift 解消)
- 引き継ぎ事項: 03a / 03b 側で参照に置き換え済みの状態 / `_design/sync-jobs-spec.md` 安定パス
- ブロック条件: 重複定義が残っている / 参照リンク切れ / target-files.md 不完全
