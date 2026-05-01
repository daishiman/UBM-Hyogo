# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| Wave | 1 |
| 実行種別 | sequential（07b 完了済を前提に Wave 1 単独で進行） |
| 前 Phase | なし |
| 次 Phase | 2（設計 - DB 制約 + 再開可能 back-fill + retryable contract） |
| 状態 | spec_created |
| タスク分類 | implementation（migration / repository / workflow / route / test を更新） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #293（CLOSED 維持・参照のみ） |
| 親タスク | 07b-parallel-schema-diff-alias-assignment-workflow |

## 目的

07b 完了時点で残された 3 件の懸念（race condition への DB 物理制約欠如 / 大規模 back-fill 未実測 / CPU budget 超過時の retryable contract 未定義）を、Phase 2 が一意に設計を絞り込める粒度の論点・苦戦箇所・依存境界・AC として固定する。Phase 1 は決定そのものを行わず、設計分岐を一意化する入力を整える Phase として閉じる。

## 実行タスク

1. issue-191 / 07b / UT-07B の write target 前提を照合する。
2. `schema_aliases` 正本を上位前提として hardening 対象を再定義する。
3. NON_VISUAL / implementation / spec_created の分類を artifacts と同期する。
4. AC-1〜AC-10 と Phase 2 引き渡し論点を固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `schema_aliases` write target 正本 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-191 alias-first 方針 |
| 必須 | `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` | 起票元 |
| 必須 | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/` | 親タスク close-out evidence |

## 正本前提: schema_aliases write target

issue-191 以降の aiworkflow 正本では、`POST /admin/schema/aliases` の恒久 write target は `schema_questions.stable_key` direct update ではなく `schema_aliases` INSERT である。本タスクはこの正本を上位前提にし、DB 物理制約は `schema_aliases` の同一 revision / stableKey / question alias 一意性を中心に設計する。`schema_questions.stable_key` は fallback 期間の参照互換と既存 back-fill 入力としてのみ扱い、新規 hardening の主 write target にしない。

## 真の論点 (true issue)

「UNIQUE index を追加するだけ」「retry response を返すだけ」ではない。本タスクの本質は、**alias apply workflow が現状「単一 transaction で alias 確定 + 全件 back-fill を行う」設計を前提にしている**ことにある。この前提のままでは:

- DB UNIQUE 制約を追加しても、衝突が起きるのは **同一 transaction 内の race condition** ではなく **複数 transaction が並列に走った時の race**であり、pre-check + DB constraint の二段防御は alias 確定段階に対してのみ意味を持つ。back-fill 段階には別の責務がある。
- back-fill が CPU budget を超えた場合、現状は途中失敗で transaction が rollback され「alias は記録されたが response_fields は半分だけ書き換わった」中間状態を許してしまう（あるいは alias 確定すら巻き戻る）。
- retryable response を返すだけでは、再実行時の処理範囲（残件のみ vs 全件再実行）が決まらず idempotent にならない。

したがって本タスクの本質は **「alias 確定」と「back-fill 継続」を責務分離し、それぞれに適した防御（DB constraint / 再開可能 state / retryable contract）を独立に設計する** ことにある。「制約を足す」ではなく「workflow を二段化する」が真の論点。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 対象は admin API + DB 系。UI 追加なし。既存 admin schema UI の表示は影響を受けない範囲で運用 |
| 成果物の物理形態 | コード（migration / repository / workflow / route / test）+ Markdown 仕様 | `apps/api/**` 配下と `outputs/**` |
| 検証方法 | unit / route / workflow test + staging 実測 evidence（CLI 出力 / 数値ログ） | スクリーンショット不要。NON_VISUAL 縮約手順を Phase 11 で適用 |

artifacts.json の `metadata.visualEvidence` は `NON_VISUAL` で固定。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 07b-parallel-schema-diff-alias-assignment-workflow | base endpoint / workflow / tests / phase-12 implementation-guide | 強化対象の前提実装 |
| 上流 | 実 D1 schema (`apps/api/migrations/*.sql`) | `schema_questions` / `response_fields` / `schema_diff_queue` / `audit_log` の現スキーマ | UNIQUE index 追加可否判断と migration 起草入力 |
| 関連 | `aiworkflow-requirements` (`api-endpoints.md` / `database-schema.md`) | 現行 API contract と D1 schema 正本 | retryable failure 追加と UNIQUE index / `processed_offset` 等の同期更新 |
| 下流 | 運用（staging Workers / D1） | 10,000 行 fixture 投入手順 | Phase 11 evidence（batch 数 / CPU 時間 / retry 回数） |

## 既存差分の前提（Phase 2 入力）

| 軸 | 07b 完了状態 | 強化後ゴール | 出典 |
| --- | --- | --- | --- |
| 同一 revision stableKey collision 防御 | repository / workflow 層 pre-check のみ | pre-check + DB constraint（UNIQUE index または partial unique）の二段防御 | `apps/api/src/repository/schemaQuestions.ts`、07b phase-12 unassigned-task-detection |
| alias 確定 と back-fill の責務 | 単一 workflow 内で連続実行 | 状態分離。back-fill は再開可能 state を持つ | `apps/api/src/workflows/schemaAliasAssign.ts`、07b phase-12 implementation-guide |
| CPU budget 超過時の応答 | 例外 / 不明確な失敗 | `backfill_cpu_budget_exhausted` retryable response（HTTP status / body 確定） | 07b phase-12 skill-feedback-report |
| 大規模実測 | in-memory D1 + 250 行級テストのみ | staging D1 / Workers で 10,000 行以上の実測 evidence | 07b phase-12 skill-feedback-report |
| `response_fields` の questionId / is_deleted | カラム不在。`__extra__:<questionId>` + `deleted_members` join で吸収 | 同方針を維持し仕様書側に明記 | 07b phase-12 implementation-guide §「実 DB と仕様書の差分吸収」 |

## 苦戦箇所【記入必須】

起票仕様 §9 で言語化された 3 件を Phase 1 で再展開する。

### 1. response_fields に `questionId` / `is_deleted` カラムが存在しない

- **対象**: `apps/api/src/workflows/schemaAliasAssign.ts`
- **症状**: 仕様書では `response_fields.questionId` / `response_fields.is_deleted` を前提としていたが、実 DB スキーマには該当カラムがない。実装時は `__extra__:<questionId>` キー命名規約 + `deleted_members` table への JOIN による soft delete 判定で吸収した。
- **本タスクへの影響**: back-fill SQL は `__extra__:<questionId>` パターンでの UPDATE と `deleted_members` 除外 JOIN を継続使用する。Phase 2 設計で「カラム追加で正規化する案」と「現方針を維持する案」を比較し、現方針（追加しない）を base case として固定する（migration コスト + アクセスパターン整合性の観点）。
- **参照**: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md`

### 2. revision-scoped alias collision に対する DB UNIQUE index が未実装

- **対象**: planned `schema_aliases` table / fallback `schema_questions.stable_key`
- **症状**: issue-191 正本では alias write target が `schema_aliases` INSERT に差し替わる。したがって同一 revision collision の物理制約は `schema_aliases` 側を第一候補にし、fallback 期間だけ `schema_questions.stable_key` の衝突検出を読む必要がある。
- **本タスクへの影響**: `schema_aliases(revision_id, stable_key)` または `schema_aliases(revision_id, question_id)` の一意性を Phase 2 で write target decision として固定する。`schema_questions` partial unique は fallback retirement 前の互換制約として採用可否を明示し、正本 write target を上書きしない。
- **参照**: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/unassigned-task-detection.md`

### 3. 10,000 行以上の Workers CPU budget 実測が未完

- **対象**: `apps/api/src/workflows/schemaAliasAssign.ts`
- **症状**: in-memory D1 + 250 行級テストでは back-fill 挙動を固定できたが、10,000 行以上の Workers CPU budget 実測は未実施で、queue / cron 分割の必要性判断を先送りしている。
- **本タスクへの影響**: Phase 2 で 10,000 / 50,000 行の fixture 設計と staging 実測手順を確定し、Phase 11 で実測する。実測結果が CPU budget 内に収まれば「単発 retry で十分」、恒常的に超える場合は「queue / cron 分割を follow-up タスクで起票」の分岐判断を Phase 10 ゲートで最終決定する（本タスクで実装するかは Phase 11 結果次第）。
- **参照**: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/skill-feedback-report.md`

## 価値とコスト

- **価値**: 並列 apply 時の silent collision・back-fill 部分失敗による中間不整合・本番想定データ量での未検証リスクを同時に閉じる。schema diff alias workflow を運用に載せられる状態に昇格させる。
- **コスト**: migration 1〜2 本 + repository / workflow / route の局所更新 + test 追加 + staging 実測。中規模見積もり。本番データへの破壊的変更はなく、DB constraint 追加は 2 段階順序を守れば rollback 可能。
- **機会コスト**: 放置すると次の本番障害で「alias 適用後の集計値が他テナントと混線」「途中失敗で response_fields が半端になり手動復旧が必要」が現実化する。事前 evidence の不在は Phase 12 lessons learned で本タスクが二度目の検出になる可能性が高い。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DB 物理制約 + 責務分離 + retryable contract + 実測 evidence の 4 軸を一括で閉じ、運用昇格の前提が揃う |
| 実現性 | PASS | 既存 workflow / repository / route / migration を局所更新する範囲。staging D1 / Workers で 10,000 行 fixture 投入は scripts で可能 |
| 整合性 | PASS | 不変条件 #5（D1 アクセスは apps/api 限定）に整合。migration / repository / workflow すべて apps/api 内に閉じる |
| 運用性 | PASS | 2 段階 migration（衝突解消 → UNIQUE index 追加）と retryable response 仕様化により、本番投入時の失敗リスクが事前に閉じる |

## 受入条件（AC）

index.md と完全一致。

- [ ] AC-1: `schema_questions(revision_id, stable_key)` の同一 revision collision が DB constraint + repository pre-check の二段防御で保証される
- [ ] AC-2: 既存データ衝突検出 SQL と rollback 手順が Phase 5 runbook に記載され、UT-04 / 本 migration の適用順序が明示
- [ ] AC-3: alias 確定と back-fill 継続の状態が分離され、CPU budget 超過後の再実行で残件のみ処理される（idempotent）
- [ ] AC-4: `backfill_cpu_budget_exhausted` retryable failure が API contract（HTTP status / response body）として正本化され、route test で境界が固定
- [ ] AC-5: 10,000 行以上の `response_fields` fixture を staging D1 / Workers 実環境で実測し、batch 数 / CPU 時間 / retry 回数が Phase 11 evidence に残る
- [ ] AC-6: 実 DB schema（`response_fields` に `questionId` / `is_deleted` カラム不在）と仕様書差分の吸収方針が Phase 1 / Phase 5 implementation guide で明示
- [ ] AC-7: unit / route / workflow tests が collision / retryable failure / idempotent retry / CPU budget 超過を網羅
- [ ] AC-8: 不変条件 #5 違反ゼロ
- [ ] AC-9: 4 条件評価が全 PASS で根拠付き
- [ ] AC-10: Phase 12 で 7 必須成果物を確認

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence が `NON_VISUAL` で固定確認済み
- [ ] 真の論点が「制約追加」ではなく「alias 確定 / back-fill 継続の責務分離 + 各層に適した防御」に再定義されている
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 2 / 関連 1 / 下流 1 すべて前提と出力付きで記述
- [ ] 既存差分前提表（collision 防御 / 責務分離 / CPU budget / 実測 / カラム不在）が出典付き
- [ ] 苦戦箇所 3 件（カラム不在 / UNIQUE index 未実装 / 10,000 行未実測）が言語化
- [ ] AC-1〜AC-10 が index.md と完全一致
- [ ] 不変条件 #5 への影響方針が示されている

## 実行手順

### ステップ 1: 起票仕様の写経確認

- `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` を Read し、§1〜§9 と本 Phase 文書の論理一致を確認する。
- 起票仕様が source of truth。齟齬があれば本 Phase 仕様を起票仕様に合わせる。

### ステップ 2: 既存 07b 実装と D1 schema の照合

- `apps/api/migrations/*.sql` を Read し、`schema_questions` / `response_fields` / `schema_diff_queue` / `audit_log` の実カラム定義を抽出する。
- `apps/api/src/repository/schemaQuestions.ts` と `apps/api/src/workflows/schemaAliasAssign.ts` を Read し、現状の collision pre-check / back-fill / CPU budget 処理の実装パターンを `outputs/phase-01/main.md` に行番号付きで記録する。
- `__extra__:<questionId>` 命名と `deleted_members` JOIN の現方針を Phase 2 入力として明示する。

### ステップ 3: 4 層責務の言語化

- DB constraint 層 / repository pre-check 層 / workflow（alias 確定 / back-fill 継続）層 / route 層（retryable HTTP contract）の 4 層を `outputs/phase-01/main.md` で図表化し、Phase 2 の責務分離設計を一意化する。

### ステップ 4: 4 条件と AC のロック

- 4 条件すべて PASS で固定されていることを確認。
- AC-1〜AC-10 を index.md と完全一致で `outputs/phase-01/main.md` に列挙。

## 多角的チェック観点

- **不変条件 #5**: migration / repository / workflow / route すべて `apps/api/**` 配下に閉じている。`apps/web` から D1 binding を直接参照させる変更を含まない。
- **直交性**: 本 Phase が「設計判断」を含んでいないか（Phase 2 の責務を侵していないか）。Phase 1 は論点整理に徹する。
- **起票仕様一致**: 起票仕様の AC / リスク / スコープと一字一句の論理矛盾がないか。
- **苦戦箇所網羅**: 起票仕様 §9 の 3 件が漏れなく言語化されているか。
- **NON_VISUAL 適合**: スクリーンショット要求が混入していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | visualEvidence = NON_VISUAL の確定 | 1 | pending | artifacts.json と同期 |
| 2 | 真の論点を「責務分離 + 各層適切防御」に再定義 | 1 | pending | main.md 冒頭 |
| 3 | 依存境界（上流 2 / 関連 1 / 下流 1）の固定 | 1 | pending | UT-04 / aiworkflow-requirements への引き渡し interface |
| 4 | 既存差分前提表の固定（collision 防御 / 責務 / CPU / 実測 / カラム） | 1 | pending | 出典付き |
| 5 | 苦戦箇所 3 件の言語化 | 1 | pending | カラム不在 / UNIQUE 未実装 / 10,000 行未実測 |
| 6 | 4 条件 PASS 根拠の固定 | 1 | pending | 全件 PASS |
| 7 | AC-1〜AC-10 の確定 | 1 | pending | index.md と完全一致 |
| 8 | 不変条件 #5 への影響方針記述 | 1 | pending | apps/api 境界 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点 / 依存境界 / 苦戦箇所 3 件 / 4 条件評価 / AC） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created` へ遷移
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 3 件すべてが Phase 2 の決定論点に対応している
- artifacts.json の `phases[0].status` が `spec_created`
- artifacts.json の `metadata.visualEvidence` が `NON_VISUAL`
- 起票仕様 `unassigned-task/UT-07B-schema-alias-hardening-001.md` と AC / 背景 / スコープが一致

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - DB 制約 + 再開可能 back-fill + retryable contract）
- 引き継ぎ事項:
  - 真の論点 = alias 確定 / back-fill 継続の責務分離 + 各層に適した防御
  - 既存差分前提表（collision 防御 / 責務 / CPU budget / 実測 / カラム不在）
  - 苦戦箇所 3 件（response_fields カラム不在 / UNIQUE index 未実装 / 10,000 行未実測）
  - 既存実装の参照点（`apps/api/src/repository/schemaQuestions.ts` / `apps/api/src/workflows/schemaAliasAssign.ts` / `apps/api/migrations/*.sql`）
  - 不変条件 #5 を満たす設計上の制約
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-10 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - 起票仕様との論理矛盾

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
