# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 3（post-03a follow-up） |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | なし（task entry） |
| 次 Phase | 2（設計） |
| 状態 | spec_created |
| GitHub Issue | #191（CLOSED のまま運用） |

## 目的

Issue #191 の Acceptance Criteria（`schema_aliases` がローカル D1 と staging migration plan に存在 / 07b が historical な `schema_questions` を直接編集せず stableKey を解決可能 / 03a の次回 sync で当該 question の unresolved 行が減少）を達成するための要件を確定する。alias 正本テーブル `schema_aliases` を新規追加することで、03a / 07b の責務境界を保ったまま alias 解決経路を一本化する。

## true issue（真の論点）

03a は live schema を D1 に同期しつつ未解決 question を `schema_diff_queue` に積むが、07b が「解決済み alias」を書き込む正本が存在しない。現状の代替案（07b が `schema_questions.stable_key` を直接 UPDATE する）は、

- 03a 側の冪等性を破る（次回 sync 時に上書きされる可能性）
- alias の出自（誰がいつどの diff queue 行から確定したか）を記録できない
- 不変条件 #1（schema 固定禁止）を間接的に逸脱（コードに準じた強い結合を生む）

という構造問題を抱える。これを `schema_aliases` 正本テーブル + 03a 側 lookup fallback の組合せで分離する。

## 依存境界

| 境界 | 内容 |
| --- | --- |
| 上流（読む） | 03a が `schema_diff_queue` に投入した unresolved 行 / `schema_questions.question_id` |
| 下流（書く） | 07b が `schema_aliases` に alias 行を INSERT、03a が次回 sync 時 lookup（READ） |
| 触らない | `schema_questions` の DDL 変更は scope out（`stable_key` カラムは fallback 用に保持） |
| 触らない | apps/web から D1 直接アクセス禁止（不変条件 #5） |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 価値 | alias 出自の追跡可能性、03a 冪等性維持、07b 単独テスト可能性、不変条件 #1 / #14 への準拠 |
| コスト | D1 マイグレーション 1 本 + repository 1 つ + 07b/03a 配線変更（小規模） |
| リスク | 移行期間中は `schema_questions.stable_key` fallback と `schema_aliases` の二重 source。lookup 順序固定で吸収 |
| 無料枠影響 | テーブル追加のみで row 数は alias 件数（数十〜百オーダー）に留まる。D1 無料枠への影響無視可 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03a / 07b 双方の冪等性 / 出自追跡を成立させる |
| 実現性 | PASS | D1 DDL 1 本 + repository 追加で完了。既存 03a / 07b 改修も配線レベル |
| 整合性 | PASS | 不変条件 #1 / #5 / #14 に違反せず、03a の AC-3 を構造的に支える |
| 運用性 | PASS-MINOR | 移行期間中の二重 source は lookup 順序固定で運用上吸収可。ドキュメント化必須 |

## Schema・共有コード Ownership 宣言

| 対象 | Ownership | 備考 |
| --- | --- | --- |
| `schema_aliases` テーブル DDL | 本タスク（issue-191） | 新規追加 |
| `schemaAliasesRepository`（apps/api） | 本タスク（issue-191） | repository pattern 踏襲 |
| 03a 側 fallback lookup ロジック | 本タスク（読み取り経路の追加のみ） | 既存 03a 実装に minimal patch |
| 07b 側書き込み先切替 | 本タスク（書き込み先 path 変更のみ） | UI / workflow ロジックは変更しない |
| `schema_questions.stable_key` カラム | 03a 既存所有のまま | DDL 変更しない |

## artifacts.json.metadata.visualEvidence 確定

`NON_VISUAL`（DB マイグレーション + repository 配線のみ。UI 変更を伴わない）

## 実行タスク

1. 03a / 07b の既存 AC を読み、alias 解決経路の現状仕様を outputs/phase-01/main.md に書き出す
2. `schema_aliases` のカラム要件（id / stable_key / alias_question_id / alias_label / source / created_at / resolved_by / resolved_at）を Phase 2 設計の input として確定
3. 移行期間中の lookup 順序（`schema_aliases` → fallback `schema_questions.stable_key`）を文書化
4. AC-1〜AC-6 を quantitative に展開（件数・status 値・lint rule 名で表現）
5. 不変条件 #1 / #5 / #14 への適合性を明記

## AC ドラフト

- AC-1: `schema_aliases` の DDL マイグレーションファイルが `apps/api/migrations/` に存在し、`bash scripts/cf.sh d1 migrations apply <db> --local` で apply 成功する
- AC-2: staging 用 migration plan に当該 DDL が反映され、`bash scripts/cf.sh d1 migrations list <db> --env staging` で `not applied` として検出されること（apply 手順は runbook に記載）
- AC-3: `schemaAliasesRepository` の `lookup(aliasQuestionId)` / `insert(row)` / `update(id, patch)` 3 関数に対する契約テストが `apps/api/test/` 配下に存在し、`pnpm --filter @ubm/api test` で green
- AC-4: 07b の alias 解決ロジックが `schema_questions` への直接 UPDATE を含まず、`schema_aliases` への INSERT のみで完結する（リポジトリ全体への grep で `UPDATE schema_questions SET stable_key` が 0 件）
- AC-5: 03a の次回 sync 実行で対象 question の `schema_diff_queue.status` が `unresolved` → `resolved` に遷移し、unresolved 件数が事前比 1 件以上減少する（fixture E2E で計測）
- AC-6: `schema_aliases` に該当行が無い question では従来通り `schema_questions.stable_key` の値が利用される（fallback 動作テストで検証）

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- `outputs/phase-01/main.md`
- root `artifacts.json` と `outputs/artifacts.json` の parity

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] 主成果物 outputs/phase-01/main.md に true issue / scope / 4 条件 / AC が記載されている
- [ ] AC が quantitative（件数 / status 値 / コマンド出力）で表現されている
- [ ] 不変条件 #1 / #5 / #14 への適合性が明記
- [ ] 移行期間中の lookup 順序ルール（`schema_aliases` 優先 / `schema_questions` fallback）が文書化
- [ ] artifacts.json の phase 1 が `spec_created`

## 次 Phase への引き渡し

- 引き継ぎ事項: scope in/out / AC quantitative / `schema_aliases` カラム要件 / lookup 順序ルール / Ownership 宣言
- ブロック条件: AC が定性的、不変条件番号未引用、Ownership 表未記載
- open question: 移行期間の終端条件（`schema_questions.stable_key` fallback をいつ廃止するか）— Phase 2 設計で運用判断
