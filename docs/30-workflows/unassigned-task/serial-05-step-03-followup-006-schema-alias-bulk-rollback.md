# serial-05 step-03 schema alias bulk rollback - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | serial-05-step-03-followup-006-schema-alias-bulk-rollback |
| タスク名 | Schema alias の複数一括 rollback |
| 分類 | follow-up / admin bulk operation |
| 対象機能 | `/admin/schema` rollback |
| 優先度 | 低 |
| ステータス | pending |
| 発見元 | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| 発見日 | 2026-05-19 |

## なぜこのタスクが必要か

Issue #778 の本体は単一 alias の rollback / undo に限定する。複数 alias を一括で取り消す場合、部分成功、version mismatch、並列 resolve、audit log 粒度、UI confirmation の設計が単体 rollback より大きくなる。

本タスクは単体 rollback の運用が安定したあと、bulk 操作として独立設計する。

## スコープ

### 含む

- 複数 alias rollback request / response contract
- per-alias 楽観ロックと部分失敗時の表示
- audit log の per-alias 記録または batch parent-child 記録方式
- admin UI の bulk selection / confirm modal

### 含まない

- 単体 rollback / undo 本体
- 集計再実行
- notification

## 受入条件

- 1 件でも version mismatch がある場合の transaction 方針が明示されている
- audit log から各 alias の rollback 結果を追跡できる
- UI が部分成功 / 全失敗 / 全成功を区別して表示する

## 参照

- `docs/30-workflows/issue-778-schema-alias-rollback-undo/`
- `docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md`

## 苦戦箇所【記入必須】

- transaction 境界の設計: per-alias で独立 commit するか、全件 atomic にするかで部分失敗時の UX と整合性方針が変わる。
- 各 alias の楽観ロック衝突が batch 内で累積する場合の応答 shape 定義（per-alias の version mismatch を集約して返す形式）。
- audit log の粒度: per-alias 単独 record と、batch parent + per-alias child の親子構造のどちらを正本にするか。
- 大量件数の long-running batch における Workers runtime の timeout 制約と進捗表示。
- bulk selection UI における誤操作防止（全選択時の confirm modal、件数閾値での追加確認）。

## リスクと対策

- リスク: 部分失敗による中途半端な state → 対策: per-alias 独立 commit + 部分失敗を必ず UI / audit で明示し、未完了分の再実行経路を提供。
- リスク: long-running batch の Workers timeout → 対策: batch 上限件数を contract で明示し、超過は分割実行を強制。
- リスク: audit log の大量挿入による cost / 可読性低下 → 対策: parent-child 構造で batch サマリと per-alias 詳細を分離し、検索性を確保。
- リスク: 並列 resolve との衝突が一括で発生 → 対策: per-alias version を request に明示させ、mismatch は skip + 集計レポート化。

## 検証方法

- unit: 部分失敗（version mismatch / not found）混在時の response shape spec。
- contract: 上限件数超過時に明確な error code を返すこと。
- integration: fault-injection で半数を mismatch にし、成功分のみ commit、失敗分は audit log に skip 記録される。
- E2E (staging): bulk selection → confirm modal → 部分成功表示 → audit log 追跡の通し動作を runtime evidence で確認。
- regression: 単体 rollback の挙動が bulk 経路導入後も変化しないことを既存 spec で担保。
