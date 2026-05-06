# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-05 |
| 前 Phase | 2（設計 - Queue vs Cron / batch contract / remaining-scan model） |
| 次 Phase | 4（検証戦略） |
| 状態 | spec_created |
| 実装区分 | 実装仕様書 |
| タスク分類 | implementation（design review gate / 条件付き） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #361（CLOSED 維持） |

## 目的

Phase 1（要件定義）と Phase 2（設計）の出力を、4 観点（責務分離 / remaining-scan idempotent / Cloudflare binding drift 防止 / 着手 gate 客観性）と 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、MAJOR / MINOR / PASS の判定を確定する。MAJOR が 1 件でも検出されれば Phase 1 または Phase 2 に差し戻す。GO 判定の場合 Phase 4 へ進める。

CONST_005 骨格（変更対象ファイル / 関数シグネチャ / テスト方針 / DoD）を Phase 2 から引き継ぎ、レビューゲート観点で漏れがないことを確認する（深掘りは Phase 5 / 6 / 9）。

---

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 当該観点で base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念あり（ドキュメント追補で解消可能 / 後続 Phase で吸収可能） | base case 維持。Phase 4 / 5 で追補メモ化 |
| **MAJOR** | 不変条件違反 / 採択理由が代替案で覆る / idempotent 破綻 / binding drift 必発 / 着手 gate が主観判定 | **Phase 1 or Phase 2 に差し戻し**。当該設計を再起草 |

> **MAJOR が 1 件でも検出された場合、Phase 4 へ進まず Phase 2（設計）または Phase 1（要件定義）に戻す**。観点別に戻し先を明示する。

戻し先決定ルール:
- 「真の論点」「依存境界」「苦戦箇所」関連 → **Phase 1 戻し**
- 「設計判断」「代替案比較」「base case の妥当性」関連 → **Phase 2 戻し**

---

## レビュー観点

### 観点 1: 責務分離が確実か（route / workflow / queue or cron / repository の 4 層）

| 確認項目 | 期待状態 |
| --- | --- |
| route 層は alias 確定（Stage 1）+ enqueue + `confirmed:true` 即時返却に閉じる | back-fill 同期実行を含まない |
| workflow 層は Stage 1 関数 / `enqueueBackfill` / `runBackfillBatch` の 3 関数に分離 | 単一関数に責務集中していない |
| queue consumer / cron handler 層は `runBackfillBatch` を呼ぶだけの薄い shim | DB 直接アクセスを行わない（repository 経由） |
| repository 層は `dedupe_key` / `failed_items_json` / `retry_count` / remaining-scan SQL に閉じる | workflow がインライン SQL を持たない |

**判定方法**: Phase 2 の `binding-and-layer-design.md` 4 層図に各層の関数名と責務が明示されているか確認。境界違反（route が直接 D1 を叩く / workflow が KV を直接読む 等）が含まれていれば MAJOR。

### 観点 2: remaining-scan model が idempotent か

| 確認項目 | 期待状態 |
| --- | --- |
| 同一 batch を 2 回実行しても `response_fields.key` が二重置換されない | UPDATE WHERE 条件で `key = '__extra__:<questionId>'` のみ対象。確定後は対象外 |
| failed_items を skip しても remaining が単調減少する | failed_items は `retry_count` 上限到達で `failed_items_json` に退避され `key` は残るが remaining は再評価されるため処理続行 |
| `retry_count` 上限到達で `backfill_status='failed'` に遷移し、無限ループが発生しない | `retry_count >= 5` で enqueue 停止 |
| 並列 consumer が同一 batch を取得しても 2 度目は no-op | UPDATE 自体が冪等 + dedupe_key UNIQUE で enqueue 段階で抑止 |

**判定方法**: Phase 2 `batch-contract-design.md` の SQL pattern と idempotent 証明、`dedupe-and-failure-recovery.md` の retry counter 上限ルールを確認。証明が表形式で明示されていなければ MINOR、証明自体が誤っていれば MAJOR。

### 観点 3: Cloudflare binding drift 防止策が十分か

| 確認項目 | 期待状態 |
| --- | --- |
| `wrangler.toml` の Queues binding が staging / production 両方に複製 | drift ゼロ（同名 binding / 同名 queue） |
| Cron 採用時、`[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]` で schedule 一致または明示差分 | Free プラン上限 5 本以内 |
| CI variables（GitHub Actions secrets / variables）に Queue 名 / DLQ 名が登録されている | runbook（Phase 5）で同期手順記述 |
| migration（`dedupe_key` / `failed_items_json` / `retry_count`）が staging → production の順で適用される手順記載 | `scripts/cf.sh d1 migrations apply` の order 明示 |

**判定方法**: Phase 2 `binding-and-layer-design.md` + `migration-impact.md` を参照。drift 防止手順骨格が Phase 5 runbook へ引き継ぎされていれば PASS。staging だけ追加して production 未記載なら MAJOR。

### 観点 4: 着手 gate の判定基準が客観的か

| 確認項目 | 期待状態 |
| --- | --- |
| Phase 11 evidence の判定軸が定量化されている | 「持続再現の頻度」「retry 回数」「CPU 時間」など数値で表現 |
| Queue vs Cron の最終決定ルールが Phase 11 evidence で確定可能 | base case = Queue + 移譲ルール（1 日 100 件超 / 10 件未満 / 中間域）が明示 |
| gate 不成立時の close 手順が Phase 12 で明示される | 「実装不要」evidence と spec_created 据え置きの方針 |
| gate 成立時の Phase 5 以降の実行条件が明示 | 仕様書は spec_created のまま据え置きで再起動可能 |

**判定方法**: Phase 1 真の論点 + Phase 2 `queue-vs-cron-tradeoff.md` の Phase 11 移譲ルール + index.md 着手 gate 記述を確認。主観的な「再現したら着手」のみなら MAJOR、頻度数値が固定されていれば PASS。

---

## 代替案比較（最低 2 案以上）

### 軸 A: Stage 2 駆動主体

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **A-1: Cloudflare Queues（base case）** | producer/consumer + DLQ | 低 latency / 自動 retry / 可視性 | Workers Paid 推奨 / Free 100k msg/day 上限 | ✅ |
| A-2: Cron Trigger（追加 1 本） | `*/5 * * * *` 等の追加 schedule | Free プラン適合 / 既存運用ノウハウ | latency が cron interval に固定 | fallback |
| A-3: 単発 API request 内 client 駆動 retry（現状維持） | 現行 cursor 方式 | 実装変更ゼロ | UI 閉じると停止 / dedupe 不可 | - |
| A-4: 両方採用（hybrid） | 通常 Queue / 失敗時 Cron で残件 sweep | 二重防御 | 実装複雑度 2 倍 | - |

**判定**: A-1 PASS（base case）/ A-2 MINOR（fallback として準備）/ A-3 MAJOR（目的未達）/ A-4 MINOR（YAGNI）。

### 軸 B: duplicate enqueue 防止

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **B-1: `schema_diff_queue.dedupe_key` UNIQUE（base case）** | DB 単一 source of truth | atomic / re-enqueue が no-op | migration 1 本 | ✅ |
| B-2: KV `SYNC_ALERTS` in-flight marker | TTL 60s の SET | migration 不要 | KV eventual consistency すり抜け | - |
| B-3: 既存 `schema_diff_queue.status` 遷移で代替 | schema 変更なし | 追加なし | 並列 producer race | - |

**判定**: B-1 PASS / B-2 MINOR（KV race 懸念）/ B-3 MAJOR（race 残存）。

### 軸 C: response contract

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **C-1: `confirmed` + `backfill.status` 4 値 + HTTP 200/202/409（base case）** | semantic 明示 | 可観測性高 / FU-02 UI と相性良 | 既存 `retryable: true` との後方互換注意 | ✅ |
| C-2: 既存 `retryable: true` のみ維持 | response 構造変更なし | 後方互換完璧 | `confirmed` / `running` / `pending` の表現不可 | - |
| C-3: 全 200 + body の `state` フィールドのみ | HTTP semantic 弱化 | 構造均一 | 監視 / 自動 retry が difficult | - |

**判定**: C-1 PASS（後方互換は body の `code: backfill_cpu_budget_exhausted` 残置で吸収）/ C-2 MAJOR（要件未達）/ C-3 MINOR。

### 軸 D: partial failure recovery

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **D-1: `failed_items_json` + `retry_count <= 5`（base case）** | 失敗 id を退避 + 上限 | 無限ループ防止 / 残件単調減少 | カラム 2 本追加 | ✅ |
| D-2: 失敗 batch 全体をやり直し | 実装単純 | 残件単調減少しない / 同じ失敗で永久 retry | - | - |
| D-3: 失敗 id を audit_log のみに記録、retry なし | 実装最小 | 1 件失敗で全体停止 | 運用復旧 difficult | - |

**判定**: D-1 PASS / D-2 MAJOR（無限 retry リスク）/ D-3 MAJOR（停止リスク）。

---

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 着手 gate 客観化 + 責務分離 + dedupe + partial failure recovery + response 拡張を一括で閉じ、CPU budget 超過再発時に即着手可能な状態を作る |
| 実現性 | PASS | Queues / Cron / dedupe_key / failed_items_json いずれも既存スタックで実装可能。`scripts/cf.sh` 経由で staging 投入可 |
| 整合性 | PASS | 不変条件 #5 を侵さない。aiworkflow-requirements 3 ファイル同期で正本一貫性維持 |
| 運用性 | PASS | binding drift 防止手順骨格が Phase 5 runbook 移譲。Phase 11 evidence で着手 gate 客観判定 |

---

## 観点別判定

| 観点 | 判定 | 根拠・残課題 |
| --- | --- | --- |
| 観点 1: 責務分離（route / workflow / queue・cron / repository） | PASS | 4 層責務図で関数 5 個（apply / enqueueBackfill / runBackfillBatch / queue handler / cron handler）の境界が明示 |
| 観点 2: remaining-scan idempotent | PASS | UPDATE WHERE 条件 + retry_count 上限で二重 UPDATE 不発生 + 単調減少が証明 |
| 観点 3: Cloudflare binding drift 防止 | PASS（追補要） | staging / production 同期手順 + CI variables 登録は Phase 5 runbook で実装。骨格は Phase 2 で固定 |
| 観点 4: 着手 gate 客観性 | PASS | Phase 11 evidence の数値判定（持続頻度 / retry 回数 / CPU 時間）+ Queue vs Cron 最終決定ルール（1 日 100 件超 / 10 件未満 / 中間域）が明示 |
| 不変条件 #5（D1 アクセスは apps/api 限定） | PASS | queue consumer / cron handler / migration / repository / workflow / route すべて apps/api 配下 |
| migration 順序（親タスク列 → 本タスク dedupe / failed / retry） | PASS | `migration-impact.md` で順序固定 |
| Free プラン適合性 | PASS（追補要） | Queues 100k msg/day 上限の運用判断を Phase 5 runbook で明示 |
| 後方互換（`retryable: true` / `code: backfill_cpu_budget_exhausted`） | PASS | response body に併存維持。`backfill.status='exhausted'` で意味論吸収 |
| YAGNI / scope creep | PASS | 着手 gate を Phase 11 に置き、不要時は close 手順あり |

---

## 着手可否ゲート

- すべての軸（A / B / C / D）と観点が **PASS or MINOR**: Phase 4 へ GO。
- **MAJOR が 1 件以上**: NO-GO。戻し先決定ルールに従い Phase 1 or Phase 2 に差し戻す。

**現時点判定**: 4 条件 + 9 観点 + 4 軸すべてで MAJOR ゼロ → **GO**（Phase 4 へ進める）。Phase 5 runbook で追補要点（binding drift / Free プラン適合 / CI variables 同期）を吸収する。

### Phase 1 戻し条件

- 真の論点が「Queue を入れるか / Cron に分けるか」の二択に縮約されている（着手 gate 客観化が抜けている）
- 苦戦箇所 3 件（staging 実測未完 / Queue vs Cron evidence 待ち / dedupe & partial failure 境界）に漏れがある
- AC-1〜AC-11 が index.md と乖離

### Phase 2 戻し条件

- 各軸（Queue vs Cron / dedupe / response contract / partial failure）の代替案比較が 2 案未満
- remaining-scan idempotent 証明が誤っている / 表で示されていない
- migration 順序が親タスク列と矛盾
- 4 層責務図に境界違反（route が直接 D1 / workflow が KV 直接）が含まれる
- 後方互換（`retryable: true`）戦略が欠如

---

## 残課題（open question）

| # | 内容 | 委譲先 |
| --- | --- | --- |
| 1 | Workers Paid 切替 / Free プラン Queues 100k 上限の運用判断 | Phase 5 runbook + 運用エスカレーション |
| 2 | admin UI 側の `confirmed` / `backfill.status` polling 表示 | UT-07B-FU-02（管理画面側 UI 改修） |
| 3 | aiworkflow-requirements 3 ファイル（api-endpoints / database-schema / task-workflow-active）同期更新 | 本タスク Phase 12 |
| 4 | 監視アラート（`backfill_status='failed'` 検知）の閾値設計 | UT-07B-FU-03 / 別タスク（監視ダッシュボード） |
| 5 | staging credentials なし環境での Phase 11 実行手順最終確定 | Phase 5 runbook + Phase 11 spec |
| 6 | DLQ binding 採用時の dead-letter 処理ポリシー（再 enqueue / 手動復旧 / `backfill_status='failed'` 連動） | Phase 6 異常系 |

---

## 完了条件チェックリスト

- [ ] 軸 A / B / C / D それぞれで最低 2 案の代替案比較が記述
- [ ] 4 条件評価マトリクスに空セルゼロ
- [ ] 観点別判定 9 件（4 主観点 + 不変条件 #5 + migration 順序 + Free プラン + 後方互換 + YAGNI）すべてに判定
- [ ] PASS / MINOR / MAJOR の判定基準が文書化
- [ ] 着手可否ゲート（GO / NO-GO）が明示
- [ ] MAJOR 検出時の Phase 1 / Phase 2 戻しトリガが定義
- [ ] 残課題が委譲先付きで列挙（最低 4 件）
- [ ] 不変条件 #5 違反ゼロ
- [ ] 着手 gate 判定基準が定量的（数値判定）

---

## 実行タスク

1. 軸 A / B / C / D それぞれで最低 2 案の代替案比較表を `outputs/phase-03/main.md` に記述する（完了条件: 各軸 2 案以上 + base case フラグ + 利点 / 欠点）。
2. 4 条件 PASS / MINOR / MAJOR 判定を根拠付きで記述する（完了条件: 4 セルすべてに判定 + 根拠）。
3. 観点別判定（9 件）を表化する（完了条件: 全件に判定 + 根拠）。
4. 着手可否ゲート判定を実施し、GO / NO-GO を明示する（完了条件: 判定結果が文書化）。
5. 残課題を別タスク・別 Phase に振り分ける（完了条件: open question 表で委譲先明示）。
6. MAJOR 検出時の Phase 1 / Phase 2 戻しトリガを定義する（完了条件: 戻し先決定ルール記述）。
7. CONST_005 骨格（Phase 2 引き継ぎ）が Phase 4 / 5 / 6 / 9 で深掘りされる方針を確認。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-01.md` | レビュー対象（要件定義） |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-02.md` | レビュー対象（設計） |
| 必須 | `outputs/phase-02/queue-vs-cron-tradeoff.md` | base case の Queues 採用 + Phase 11 移譲ルール |
| 必須 | `outputs/phase-02/batch-contract-design.md` | base case の remaining-scan SQL + idempotent 証明 |
| 必須 | `outputs/phase-02/response-contract-design.md` | base case の `confirmed` / `backfill.status` |
| 必須 | `outputs/phase-02/dedupe-and-failure-recovery.md` | base case の dedupe_key + failed_items_json |
| 必須 | `outputs/phase-02/binding-and-layer-design.md` | base case の 4 層責務図 + wrangler 追加項目 |
| 必須 | `outputs/phase-02/migration-impact.md` | migration 1 本の順序 |
| 必須 | Issue #361 body | 起票仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | apps/api 境界制約 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 規約 |

---

## 多角的チェック観点

- **代替案網羅性**: A-3（現状維持）/ B-3（status 遷移代替）/ C-2（`retryable: true` のみ）/ D-2（全 batch やり直し）/ D-3（retry なし）の各リスクが本 Phase で **明示的に却下されている** こと（暗黙却下は不可）。
- **不変条件 #5**: 設計が apps/api 内に閉じ、`apps/web` から D1 binding を直接参照させる経路が含まれていないか。
- **migration 可逆性**: `dedupe_key` / `failed_items_json` / `retry_count` カラム追加の rollback 手順（DROP COLUMN / DROP INDEX）が `migration-impact.md` または Phase 5 runbook で記述されているか。
- **idempotent 性破綻シナリオ**: `retry_count` がカウントアップしないループ条件（同 batch で 0 件 UPDATE が続く）が Phase 6 異常系へ引き継がれているか。
- **HTTP semantic ねじれ**: 200 と 202 の境界（`backfill.status='completed'` のみ 200）が一意か。
- **着手 gate 客観性**: 「持続再現したら着手」の主観表現を排除し、数値（1 日 N 件 / retry M 回 / CPU T ms）で固定できているか。
- **後方互換**: 既存 admin UI / cron / 他クライアントが `retryable: true` を見て自動 retry するコードに対し、`backfill.status='exhausted'` で互換動作するか。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 軸 A 代替案比較（Queues / Cron / 単発 / hybrid） | 3 | pending | A-1 採択 |
| 2 | 軸 B 代替案比較（dedupe_key / KV marker / status 遷移） | 3 | pending | B-1 採択 |
| 3 | 軸 C 代替案比較（confirmed+status / retryable のみ / 全 200） | 3 | pending | C-1 採択 |
| 4 | 軸 D 代替案比較（failed_items+retry_count / 全 batch やり直し / retry なし） | 3 | pending | D-1 採択 |
| 5 | 4 条件再評価 | 3 | pending | 全 PASS |
| 6 | 観点別判定（9 件） | 3 | pending | 全 PASS or MINOR |
| 7 | 着手可否ゲート判定 | 3 | pending | GO / NO-GO 明示 |
| 8 | 残課題の委譲先確定（最低 6 件） | 3 | pending | Phase 5 / 6 / 12 / FU-02 / FU-03 / 監視 |
| 9 | Phase 1 / Phase 2 戻しトリガ定義 | 3 | pending | 戻し先決定ルール |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビューゲート結果（代替案比較 / 4 条件 / 観点別判定 9 件 / GO-NO-GO / 残課題 / 戻しトリガ） |
| メタ | artifacts.json | Phase 3 状態の更新 |

---

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）と全サブタスク（9 件）が `spec_created` へ遷移
- 軸 A / B / C / D の代替案比較がすべて 2 案以上
- 4 条件評価が全 PASS
- 観点別判定 9 件が全件評価済み
- MAJOR ゼロ（MINOR は許容）
- `artifacts.json` の `phases[2].status` が `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略）
- 引き継ぎ事項:
  - 軸 A / B / C / D の base case 確定（Queues + dedupe_key + confirmed/status + failed_items+retry_count）
  - 4 条件評価 全 PASS
  - 観点別判定 9 件（責務分離 / idempotent / drift 防止 / 着手 gate 客観性 / 不変条件 #5 / migration 順序 / Free プラン / 後方互換 / YAGNI）
  - 残課題（Workers Paid / FU-02 UI / aiworkflow-requirements 同期 / 監視 / Phase 11 staging / DLQ ポリシー）
  - Phase 1 / Phase 2 戻しトリガと戻し先決定ルール
  - 着手 gate 判定基準（数値定量化）
- ブロック条件:
  - MAJOR 検出時 → Phase 1 or Phase 2 戻し
  - 4 条件いずれかが MAJOR
  - 観点別判定で不変条件違反 / idempotent 破綻 / migration 順序逆転
  - 代替案比較が 2 案未満
  - 着手 gate が主観判定のまま

---

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow / queue consumer / cron handler integration test に接続する。
- `dedupe_key` UNIQUE / `failed_items_json` / `retry_count`、remaining-scan idempotent、`confirmed` / `backfill.status` response 契約、Queue producer/consumer / Cron handler、staging 10,000+ rows evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
