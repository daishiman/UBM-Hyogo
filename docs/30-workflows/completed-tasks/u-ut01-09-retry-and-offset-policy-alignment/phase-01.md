# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | U-UT01-09 retry 回数と offset resume 方針の統一 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | 1 |
| 実行種別 | serial（Phase 2 は本 Phase の真の論点確定なしには着手不可） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | docs-only（設計判断のみ。コード実装・migration 作成・PR は一切行わない） |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-01 (Sheets→D1 同期方式定義) |
| 関連タスク | UT-09 (Sheets→D1 同期ジョブ実装) / U-UT01-07 (`sync_log` ledger 整合) / U-UT01-08 (status / trigger enum 統一) |
| workflow_state | spec_created |

## 目的

UT-01 論理仕様（Phase 02 `sync-method-comparison.md` / `sync-log-schema.md`）が定める「retry 最大 3 回 + Exponential Backoff 1s〜32s + `processed_offset` による再開」と、既存実装（`apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` 環境変数 / `withRetry({ baseMs: 50 })`）および既存 migration（`apps/api/migrations/0002_sync_logs_locks.sql` に `processed_offset` カラム不在）との 3 軸差分を、UT-09 実装が単独判断不能にならない粒度で「真の論点」として要件定義に固定する。

本 Phase はコード変更・migration 作成・PR 作成を一切伴わず、Phase 2（設計）が canonical 採択候補を一意比較できる入力（4 つの苦戦箇所 / AC1-AC6 / 依存境界 / quota 算定前提）を確定する。

## current / stale 分類

| 区分 | 事実 | 本 Phase での扱い |
| --- | --- | --- |
| legacy input | UT-01 Sheets→D1 設計は `completed-tasks/ut-01-sheets-d1-sync-design` に移動済みで、retry 3 / backoff 1s〜32s / `processed_offset` を論理 base case として保持している | 比較入力として読む。current 実装正本とは呼ばない |
| current facts | aiworkflow-requirements の current facts では Forms API sync、split endpoint、hourly cron が正本化されている | 本 docs-only workflow では上書きしない。差分が実装に影響する場合は UT-09 追補 / legacy follow-up へ委譲 |
| stale candidate | 旧 Sheets API v4 / 単一 sync job / 6h cron 前提 | Phase 2 以降では「legacy baseline」と明示し、current facts と混同しない |

## 真の論点 (true issue)

- 「retry 回数を 3 にするか 5 にするか」「offset を採るか採らないか」の二択ではなく、**3 つの canonical 値（retry 最大回数 / Exponential Backoff curve / `processed_offset` schema 採否）を一意化し、UT-09 実装が単独で値判断を下す状態を解消すること**が本タスクの本質。
- 副次的論点として、3 つの値が独立に決まるのではなく、`retry 回数 × backoff curve × batch_size × cron 間隔` の積が Sheets API quota（500 req/100s/project）と Workers CPU 制限の双方を踏み抜かないことを前提に整合的に決まること。
- もう 1 つの副次的論点として、`processed_offset` を採用する場合の offset 単位（Sheets rowIndex / chunk index / 安定 ID 集合）を本タスク内で確定し、Sheets 側で行が削除されても意味が壊れない定義へ収束させること。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は Markdown 設計判断記録のみ。UI スクリーンショット・画面遷移なし |
| 成果物の物理形態 | テキスト（Markdown） | `outputs/phase-02/canonical-retry-offset-decision.md` / `outputs/phase-02/migration-impact-evaluation.md` |
| 検証方法 | 机上算定（quota 試算 / 1 tick 滞在時間試算 / migration 影響評価）と Phase 3 設計レビューゲート | 実機検証は UT-09 実装フェーズに委譲 |

artifacts.json の `metadata.visualEvidence` を `NON_VISUAL` で確定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-01 Phase 02 `sync-method-comparison.md` | retry 3 回 / backoff 1s〜32s / batch 100 の論理パラメータ | canonical 値の比較表に base case として入力 |
| 上流 | UT-01 Phase 02 `sync-log-schema.md` | `processed_offset` の論理定義（再開可能境界） | offset 採否判断の論理側 base case として入力 |
| 上流 | UT-01 Phase 12 `unassigned-task-detection.md` | U-9 検出文脈、U-7 / U-8 との直交関係 | 直交境界の確定根拠 |
| 直交 | U-UT01-07（ledger 物理整合） | `sync_log` ↔ `sync_job_logs` / `sync_locks` の名称・カラム整合 | 値ポリシーは本タスク、ledger 整合は U-UT01-07 と境界明示 |
| 直交 | U-UT01-08（status / trigger enum 統一） | enum 名前空間の統一決定 | 値・タイミング・再開ロジックは本タスク、enum 名前空間は U-UT01-08 と境界明示 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | canonical 確定後の retry / backoff / offset 値 | Phase 2 成果物（canonical-retry-offset-decision.md）を UT-09 受入条件へ申し送り |
| 下流 | UT-09 / U-UT01-07 migration 作業 | `processed_offset` 採否 + migration 影響評価 | Phase 2 成果物（migration-impact-evaluation.md）を申し送り |

## 苦戦箇所【記入必須】

### 苦戦箇所 1: retry 回数差分による失敗解釈の二重化

- 仕様（UT-01 Phase 02）は「3 回失敗で failed 確定」を前提に SLA / monitoring を組む。
- 実装（`apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES = 5`）は 5 回まで暗黙再試行する。
- 同一エラー事象でも仕様読者と実装ログ読者で「失敗した」と見なすタイミングがずれる → SRE オペレータが「3 回 retry 済」のログから手動介入を始めても実装はまだ自動再試行中、というレース状態が発生。
- 実装が 5 回試行する間に Sheets API quota（500 req/100s/project）を消費し、quota 耗尽時に手動同期が同時失敗する具体ケースを観測済み。

### 苦戦箇所 2: `processed_offset` 不在による部分失敗リカバリ不能

- 1000 行同期中に 600 行 upsert 完了 → batch 7（行 601-700）で 3 回連続失敗 → ジョブ全体 failed のシナリオ。
- 現行実装は次回 tick / 手動再実行時に行 0 から再取得 + 冪等 upsert に依存。
- Sheets API quota を毎回フル消費し、Workers CPU 制限（一定時間で打ち切り）に近接した行数では「永遠に最後の batch に到達できない」状態に陥る具体ケースが成立。
- `processed_offset` を持てば 600 行目から再開できるが、行の安定 ID 不在（UT-01 苦戦箇所 2）と組み合わせて offset 単位（行 / chunk index / Sheets rowIndex）の選定も canonical に決める必要がある。

### 苦戦箇所 3: backoff curve 差分が quota 上限を踏み抜く

- 仕様 curve: `1s / 2s / 4s / 8s / 16s / 32s`（合計待機 ~63s 上限、5 retry で約 3.5 req）。
- 実装 curve: `withRetry({ baseMs: 50 })` 起点で同じ指数なら `50 / 100 / 200 / 400 / 800ms` と 1 オーダー短い。
- batch_size 100 行 + 並走 cron で短い backoff のまま retry 5 回が走ると、100s ウィンドウ内に同一 project から burst が発生し quota 超過が他 batch にも波及。
- canonical curve を確定しないと UT-09 実装で「baseMs を秒オーダーに直す + retry 3 回」「baseMs を維持して retry 5 回」のどちらに収束させるかが判断不能。

### 苦戦箇所 4: failed log 30 日保持と offset の意味整合

- `sync-log-schema.md` は `processed_offset` を「再開可能な書き込み済境界」として論理定義するが、実装テーブル（`0002_sync_logs_locks.sql`）には列がない。
- failed ログの監査時に「どこまで進んでいたか」が SQL で復元不能。
- failed → in_progress 再開時に `started_at` を上書きしないという仕様も、offset が無いと再開判定の根拠が `retry_count` しかなくなり、「retry 上限超過後の手動再開」と「途中 batch 再開」を区別できない。

## リスクと対策

| # | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| R1 | retry 5→3 へ寄せた直後に過渡的に failed ログが増える | 監査ノイズ / アラート過剰発火 | Phase 2 canonical-retry-offset-decision.md に「適用直後 7 日は failed 件数しきい値を staging 実測ベースで再校正」を明記 |
| R2 | `processed_offset` 追加は migration を伴う | D1 prod に対する破壊的変更リスク | 本タスクは机上評価のみ。物理 migration は UT-09 / U-UT01-07 の責務へ明示移譲し、本タスクは「列追加 / 別経路採用 / 採用見送り」の 3 択判断のみ確定 |
| R3 | backoff curve を秒オーダーへ伸ばすと 1 tick 内に完了できない batch が増える | scheduled handler の打ち切りで failed が常態化 | tick 内に収まる「batch_size × max_retries × backoff 上限」の理論最大時間を Phase 2 で算定し、cron 間隔（既定 6h）と非衝突であることを証明 |
| R4 | `SYNC_MAX_RETRIES` 環境変数の既定値変更を忘れる | 値が変わっても挙動が旧値のまま | canonical 決定後の wrangler 設定 / .dev.vars の参照ポイントを Phase 2 appendix で列挙し、UT-09 受入条件に含めるよう申し送り |
| R5 | offset resume を採用しても Sheets 側で行が削除されると意味が変わる | 600 行目以降が誤った行を指す | offset 単位を「Sheets rowIndex」「chunk index」「chunk index + 安定 ID 集合」の 3 候補で Phase 2 比較し、行削除耐性を持つ単位を採択 |

## 受入条件（AC1-AC6）

| ID | 条件 |
| --- | --- |
| AC1 | canonical retry 最大回数（候補: 3 / 5 / 環境変数で可変）が Phase 2 比較表で評価され、採択値と採択理由が明文化されている |
| AC2 | canonical Exponential Backoff curve（base / 上限 / jitter 採否）が確定し、batch_size 100 と cron 間隔 6h で 1 tick 内に収まることが机上証明されている |
| AC3 | `processed_offset` schema 採否（追加 / 不採用 / hybrid chunk index + 安定 ID）が決定され、採択ケースの offset 単位（行 / chunk index / 安定 ID 集合）が定義されている |
| AC4 | D1 migration 影響（追加列・DEFAULT・既存行 backfill・rollback 手順）が机上で評価され、UT-09 / U-UT01-07 への申し送り内容が記載されている |
| AC5 | Sheets API quota（500 req/100s/project）整合が worst case シナリオ（cron + 手動同期同時刻 + retry 上限）で成立することが算定済みである |
| AC6 | `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値、`DEFAULT_MAX_RETRIES = 5` を canonical へ寄せる際の過渡期運用方針（R1 のしきい値再校正期間含む）が記載されている |

## スコープ

### 含む

- canonical retry 最大回数の決定（仕様 3 回 / 実装 5 回 / 環境可変案の比較評価と採択理由）
- canonical Exponential Backoff curve の決定（仕様 1s/2s/4s/8s/16s/32s / 実装 50ms 起点 / jitter 採用可否）
- `processed_offset` カラム追加可否の決定（追加 / 全範囲再取得 + 冪等 upsert / hybrid のいずれかを採択）
- 既存実装値（`DEFAULT_MAX_RETRIES = 5`）を 3 へ寄せる場合の影響評価（過渡期 quota / SLA / failed log 解釈）
- `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値方針
- D1 migration 影響範囲（カラム追加 / backfill / NOT NULL DEFAULT の選択）の机上評価
- Sheets API quota（500 req/100s/project）整合性の再検証

### 含まない

- 実装変更（コード修正 / migration 追加 / wrangler 設定変更）
- UT-09 ジョブのコード変更
- 新規テーブル作成や `sync_job_logs` のリネーム（→ U-UT01-07）
- enum リネーム（→ U-UT01-08）
- 本番データの再同期実施
- PR 作成・コミット

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 実装が単独で値判断を下す状態を解消し、retry / offset / backoff の 3 軸を canonical 化することで監査・SLA・quota の整合を一意化 |
| 実現性 | PASS | docs-only タスクであり、Markdown 2 ファイルの机上評価で完結。canonical 候補は既存仕様・既存実装・追加案の比較で網羅可能 |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #5（D1 アクセスは apps/api 限定）に違反しない。U-UT01-07 / U-UT01-08 と直交を保つ |
| 運用性 | PASS | canonical 決定後、UT-09 受入条件への申し送りで実装側の参照経路が一意化される |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | canonical 入力（本タスクの正本） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | `processed_offset` / retry_count / failed → in_progress 再開の論理定義 |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | retry 最大 3 回 / backoff 1s〜32s / batch 100 の確定パラメータ |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md | U-9 検出文脈と U-7 / U-8 との直交関係 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` / `withRetry({ maxRetries, baseMs: 50 })` の宣言箇所 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | `processed_offset` カラム不在 / `retry_count` のみ存在の事実 |
| 必須 | docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md | 親タスク仕様（フォーマット模倣元） |

### aiworkflow-requirements 連携

| 種別 | パス | 用途 |
| --- | --- | --- |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset 関連の正本仕様への索引 |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | retry / backoff / offset トピックの一覧 |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` / `sync_log` 物理 schema 規約 |
| 参考 | .claude/skills/task-specification-creator/SKILL.md | docs-only / NON_VISUAL 縮約テンプレ準拠ルール |

## 実行タスク

1. `artifacts.json.metadata.visualEvidence` を `NON_VISUAL` として確定し、docs-only / spec_created の境界を記録する。
2. UT-01 上流仕様、既存実装、既存 migration の 3 軸差分を読み、retry / backoff / `processed_offset` の論点を抽出する。
3. 真の論点を「3 つの canonical 値の一意化」として定義し、二択判断へ矮小化しない。
4. 苦戦箇所 4 件と R1-R5 を、Phase 2 の比較表・Phase 3 のレビューゲートへ渡せる粒度に整理する。
5. AC1-AC6 を起票元 unassigned task と照合し、欠落や表現 drift がないことを確認する。
6. UT-09 / U-UT01-07 / U-UT01-08 との依存境界を、受け取る前提と渡す出力の形で固定する。
7. Sheets API quota と Workers 実行時間の算定前提を Phase 2 へ引き渡す。
8. 実コード変更・migration 作成・PR 作成が本 Phase の範囲外であることを完了条件へ反映する。

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence が `NON_VISUAL` で確定
- [ ] 真の論点が「3 つの canonical 値（retry / backoff / offset）の一意化 + UT-09 単独判断不能の解消」に再定義
- [ ] 4条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 3 / 直交 2 / 下流 2 すべて前提と出力付きで記述
- [ ] 苦戦箇所 4 件すべてが具体ケース付きで記述
- [ ] AC1-AC6 が canonical 入力と完全一致
- [ ] R1-R5 の対策が Phase 2 / Phase 3 のいずれかに割当済
- [ ] 不変条件 #1 / #5 のいずれにも違反しない要件定義

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | AC1-AC6、苦戦箇所 1〜4、R1-R5、quota 算定前提を canonical 比較表へ渡す |
| Phase 3 | 真の論点と依存境界を設計レビューゲートの MAJOR / MINOR 判定軸にする |
| Phase 4 | retry / offset / quota / migration の 4 検証軸をテスト戦略 V1〜V4 へ展開する |
| Phase 5 | UT-09 へ渡す実装反映対象と canUseTool 境界の入力にする |
| Phase 12 | docs-only / NON_VISUAL / spec_created の扱いを Phase 12 compliance check の前提にする |

## 完了条件（コマンド）

```bash
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment \
  --phase 1 \
  --artifacts docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-01.md
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-01.md | 要件定義（本ファイル）。真の論点・苦戦箇所 4 件・AC1-AC6・依存境界 |
| メタ | artifacts.json | Phase 1 状態の更新 + visualEvidence 確定 |

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 3 つの canonical 値（retry / backoff / offset）の一意化
  - 苦戦箇所 4 件と AC1-AC6 を canonical 比較表の評価軸として再利用
  - 依存境界（UT-01 上流 / UT-09 下流 / U-UT01-07 / U-UT01-08 直交）を維持
  - quota 算定前提（500 req/100s/project / batch_size 100 / cron 間隔 6h）を Phase 2 で固定値として使用
- ブロック条件:
  - 真の論点が二択（3 vs 5 / 採用 vs 不採用）に矮小化されたまま
  - 4条件のいずれかが MINOR / MAJOR
  - AC1-AC6 が canonical 入力（U-UT01-09 の受入条件）と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
