# Phase 9: 品質保証 - quota / SLA 算定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 - quota / SLA 算定 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (ドキュメント整流化) |
| 次 Phase | 10 (最終レビューゲート) |
| 状態 | spec_created |
| タスク分類 | specification-design（QA / 定量試算） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクの**肝となる定量検証 Phase**。AC2（canonical Exponential Backoff curve が batch_size 100 と cron 間隔 6h で 1 tick 内に収まることが机上証明されている）と AC5（Sheets API quota 500 req/100s/project 整合が worst case シナリオで成立することが算定済み）を、計算式と表で証明する。具体的には、Phase 6 で採択された canonical retry 回数 × backoff curve × batch_size 100 × cron 6h 間隔 の組み合わせから、**100s window 内に発生し得る最大 Sheets API request 数**を算定し、無料枠 500 req/100s 未満であることを示す。さらに、手動同期（`POST /admin/sync`）と cron 同期が同時刻に重なった場合の worst case 上振れを別途算定し、`sync_locks` による排他制御で抑止できる根拠を明示する。a11y は NON_VISUAL タスクのため対象外、mirror parity は本タスクで .claude/skills 更新がないため N/A であることも明記する。

## 実行タスク

1. canonical 値（retry 上限 / backoff curve base・上限・jitter / batch_size / cron 間隔）を Phase 6 から `outputs/phase-09/quota-worst-case-calculation.md` 冒頭の「前提値表」に転記する（完了条件: 前提値表が link 参照付きで作成済み）。
2. **1 batch worst case 算定**: 1 batch（100 行）が全 retry を消費した場合の API request 数と総待機時間を計算する（完了条件: 算定式と数値表が記述）。
3. **1 tick worst case 算定**: 1000 行 / batch_size 100 = 10 batches すべてが全 retry を消費した場合の累積 request 数 / 総時間 / Workers CPU budget 余裕度を計算する（完了条件: 100s window 内最大 request 数が 500 未満であることが式で示される）。
4. **cron 並走シナリオ**: 6h 間隔の cron が前回 tick の終了直後に次 tick を起動するケースで、100s window が 2 tick にまたがる場合の上振れを算定する（完了条件: 並走でも 500 req/100s 未満が維持される根拠が示される）。
5. **手動同期重畳シナリオ**: cron 実行中に `POST /admin/sync` が呼ばれた場合の worst case を算定し、`sync_locks` 排他で「重畳が起きない」ことを示す（完了条件: 排他なしの場合の理論最大値と、排他ありの実効値が表で対比されている）。
6. **AC2 / AC5 充足判定**: 上記 4 シナリオすべてが canonical 値で 500 req/100s 未満かつ 1 tick 内（cron 6h 間隔）に収まることを表で集約する（完了条件: AC2 / AC5 すべて PASS の判定）。
7. **`processed_offset` 採否影響評価**: Phase 6 で採択した offset 戦略（採用 / 不採用 / hybrid）ごとに、再開時の追加 quota 消費が worst case で 500 req/100s 未満を維持することを示す（完了条件: 3 ケース比較表が完成）。
8. **SLA 算定**: 1 batch 失敗から自動再試行で復旧するまでの時間（MTTR）と、次 cron tick まで failed が滞在する最大時間を算定し、SLA threshold（例: 24h 以内に少なくとも 1 回成功）と整合することを示す（完了条件: MTTR と滞在最大時間が数値で示される）。
9. line budget / link 整合 / mirror parity（N/A） / a11y（NON_VISUAL のため対象外）を確認する（完了条件: 4 観点それぞれで PASS / N/A / 対象外が明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 値（retry / backoff / offset 採否）の正本 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-08/main.md | 整流化済み用語・参照 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-07.md | AC マトリクス（AC1〜AC6） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | UT-01 仕様の retry / backoff 元値 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 原典・苦戦箇所 #3（backoff curve 差分が quota 上限を踏み抜く） / R3 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 実装側 retry / backoff の現状値 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | `sync_locks` 排他テーブル schema |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota 公式（500 req/100s/project） |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers CPU / 実行時間制限 |

## 前提値表（Phase 6 canonical-decision からの転記）

> 値は本仕様で transcribe せず Phase 6 link を正本とする。以下は本 Phase 算定で参照する変数名のみ列挙。

| 変数 | 説明 | Phase 6 anchor |
| --- | --- | --- |
| `canonical_max_retries` | 採択された最大再試行回数 | `#max-retries` |
| `canonical_backoff_base_ms` | 採択された backoff base（ミリ秒） | `#backoff-base` |
| `canonical_backoff_cap_s` | 採択された backoff 上限（秒） | `#backoff-cap` |
| `canonical_jitter_enabled` | jitter 採否 | `#jitter` |
| `canonical_batch_size` | 1 batch あたり行数 | `#batch-size` |
| `canonical_cron_interval_h` | cron 間隔（時間） | `#cron-interval` |
| `canonical_offset_strategy` | `processed_offset` 採否（採用 / 不採用 / hybrid） | `#offset-strategy` |
| `canonical_offset_unit` | offset 単位（行 / chunk index / 安定 ID） | `#offset-unit` |

## 算定式（worst case 計算ロジック）

### 1 batch worst case

```
1 batch が全 retry を消費する場合:
  request 数 = 1 + canonical_max_retries           # 初回 + retry 回数
  待機時間（jitter なし） = Σ_{k=0..canonical_max_retries-1} min(canonical_backoff_base_ms × 2^k, canonical_backoff_cap_s × 1000) ms
  待機時間（jitter あり、上限） = 上記 × 1.5（worst case factor）
```

### 1 tick worst case（10 batches すべて全 retry 消費）

```
1 tick の総 request 数 = (1 + canonical_max_retries) × (canonical_batch_size を消費する batch 数)
                      = (1 + canonical_max_retries) × ceil(想定行数 / canonical_batch_size)
1 tick の総時間 = 各 batch の最大待機時間 × batch 数 + 各 request の処理時間（仮定: 1 request あたり 200ms）
```

### 100s window 最大 request 数

```
window 内 request 数 = 連続する 100 秒に収まる batch × (1 + canonical_max_retries)
判定: window_max < 500
```

### cron 並走シナリオ

```
前回 tick 終端と次回 tick 先頭が 100s window に入る場合:
  window_max = 前回末尾 batch の retry 残 request + 次回先頭 batch の初回 request 群
判定: window_max < 500（sync_locks による排他で物理的に並走不可なので 0 上振れ）
```

### 手動同期重畳

```
排他なし: window_max = cron tick request + 手動 sync request（最悪同時 2 tick 分）
排他あり: 手動 sync は cron 実行中 sync_locks に阻まれ即座に reject → window 上振れ 0
```

## worst case 集約表（テンプレ）

> 数値は Phase 6 canonical 値を代入して `quota-worst-case-calculation.md` で算出する。本仕様書では構造のみ規定。

| シナリオ | 100s window 内最大 request 数 | 判定（< 500） | 1 tick 内収束（< cron 6h） | 判定 |
| --- | --- | --- | --- | --- |
| 1 batch 全 retry 消費 | 算定対象 | PASS / FAIL | 算定対象 | PASS / FAIL |
| 1 tick 10 batches 全 retry 消費 | 算定対象 | PASS / FAIL | 算定対象 | PASS / FAIL |
| cron 並走（次 tick 先頭重畳） | 算定対象 | PASS / FAIL | 算定対象 | PASS / FAIL |
| 手動同期重畳（排他なし理論値） | 算定対象 | 参考値 | 算定対象 | 参考値 |
| 手動同期重畳（`sync_locks` 排他あり実効値） | 算定対象 | PASS | 算定対象 | PASS |

> いずれかの主要シナリオが FAIL の場合、Phase 10 で MAJOR 判定として Phase 2 戻り（canonical 値の再選定）となる。

## offset 戦略別の追加 quota 影響

| 戦略 | failed 後の再開時 quota 消費（worst case） | window 上振れ | 判定 |
| --- | --- | --- | --- |
| 採用（`processed_offset` 追加） | 残行数 / batch_size × (1 + canonical_max_retries) | 既存試算と同一 | PASS（追加なし） |
| 不採用（全範囲再取得 + 冪等 upsert） | 想定行数 / batch_size × (1 + canonical_max_retries) | 行数比例で増加 | 採択時は worst case で 500 req/100s 未満を要証明 |
| hybrid（chunk index + 安定 ID 重複排除） | 採用ケースとほぼ同等 | 同上 | PASS（追加なし） |

> Phase 6 で採択された戦略の行のみ AC5 充足判定の対象。他戦略は比較参考値。

## SLA 算定

| 指標 | 算定 | 目標 | 判定 |
| --- | --- | --- | --- |
| MTTR（自動再試行による回復時間） | 1 batch retry 待機合計（jitter 込み） | < 5 分 | 算定後 PASS / FAIL |
| failed 滞在最大時間（次 cron tick まで） | `canonical_cron_interval_h` × 60 分 | < 24h | PASS（6h < 24h） |
| 1 日に少なくとも 1 回成功する確率 | 6h × 4 tick × 個別失敗率（仮定 1%） | > 99.99% | 算定後 PASS / FAIL |

## a11y / mirror parity / line budget / link 検証

### a11y 対象外の明記

- 本タスクは設計確定タスク（docs-only）であり UI を持たない。
- 本タスクは NON_VISUAL であり screenshot 対象なし。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。

### mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の reference を **参照** するのみ）。
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスクは N/A**。

### line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 200 行 | 250 行以内 | PASS 想定 |
| phase-01.md 〜 phase-13.md | 各 100-300 行 | 100-300 行 | 全 PASS 想定 |
| outputs/phase-09/quota-worst-case-calculation.md | 200-400 行を目安 | 個別 | 個別チェック |

### link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| Phase 2 canonical anchor link | `outputs/phase-02/canonical-retry-offset-decision.md#<anchor>` 8 件すべて辿る | リンク切れ 0 |
| 実装 path | `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` | 実在 |
| 原典 unassigned-task 参照 | `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` | 実在 |
| Sheets API / Workers 公式 link | URL 200 OK 想定 | OK |

## 実行手順

### ステップ 1: 前提値表の作成
- Phase 6 canonical 8 変数を anchor link 付きで列挙。

### ステップ 2: 算定式の確定
- 1 batch / 1 tick / 100s window / cron 並走 / 手動重畳 の 5 式を `quota-worst-case-calculation.md` に明記。

### ステップ 3: worst case 集約表の作成
- 5 シナリオすべてで「< 500 req/100s」「< cron 6h」を判定。

### ステップ 4: offset 戦略別の追加 quota 表
- 採用 / 不採用 / hybrid の 3 戦略を比較。

### ステップ 5: SLA 算定
- MTTR / failed 滞在最大時間 / 1 日成功確率 の 3 指標。

### ステップ 6: a11y / mirror / line budget / link 検証
- それぞれで PASS / N/A / 対象外を明記。

### ステップ 7: outputs/phase-09/quota-worst-case-calculation.md に集約
- 算定式 + 表 + 判定を 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | quota / SLA 算定結果を AC2 / AC5 の GO/NO-GO 判定根拠に使用 |
| Phase 12 | quota 算定モデルを implementation-guide に転記し、UT-09 受入条件で再確認 |
| UT-09 | 採択値での実装後、staging で実測し本仕様の worst case 試算と整合確認 |

## 多角的チェック観点

- 価値性: AC2 / AC5 という本タスクの最重要 AC を定量的に証明する Phase。
- 実現性: 計算は静的（実測ではなく机上）であり本タスク制約（コード実装禁止）と整合。
- 整合性: 苦戦箇所 #3（backoff curve 差分が quota を踏み抜く）/ R3（tick 内収束） / R1（quota 過渡期）を直接カバー。
- 運用性: worst case 算定式は staging 実測値との照合フォーマットとして UT-09 で再利用可能。
- 認可境界: `sync_locks` による排他で手動同期と cron の重畳が物理的に発生しないことを quota 文脈で再確認。
- 無料枠: Sheets API 500 req/100s/project の無料枠余裕度を定量化。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 前提値表作成 | 9 | spec_created | Phase 6 anchor link 8 件 |
| 2 | 1 batch worst case 算定 | 9 | spec_created | 算定式 + 数値 |
| 3 | 1 tick worst case 算定 | 9 | spec_created | 100s window < 500 req 証明 |
| 4 | cron 並走シナリオ | 9 | spec_created | sync_locks で 0 上振れ |
| 5 | 手動同期重畳シナリオ | 9 | spec_created | 排他あり / なし対比 |
| 6 | offset 戦略別 quota 影響 | 9 | spec_created | 3 戦略比較 |
| 7 | SLA 算定（MTTR / 滞在 / 成功確率） | 9 | spec_created | 3 指標 |
| 8 | AC2 / AC5 充足判定集約 | 9 | spec_created | 全 PASS が条件 |
| 9 | a11y / mirror / line budget / link 検証 | 9 | spec_created | N/A / 対象外明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quota-worst-case-calculation.md | 算定式 + 5 シナリオ worst case 表 + offset 戦略別 + SLA + AC2/AC5 判定 |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（quota / SLA / a11y / mirror / line budget / link 観点） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] 前提値表が Phase 6 anchor link 付きで作成済み
- [ ] 1 batch / 1 tick / 100s window / cron 並走 / 手動重畳 の 5 算定式すべてが明文化
- [ ] worst case 集約表で 5 シナリオすべてが「< 500 req/100s」かつ「< cron 6h」で PASS
- [ ] offset 戦略別の追加 quota 表が 3 戦略で比較済み、採択戦略が PASS
- [ ] SLA 算定（MTTR / failed 滞在最大時間 / 1 日成功確率）3 指標すべて算定済み
- [ ] AC2 / AC5 充足判定がすべて PASS
- [ ] a11y 対象外（NON_VISUAL）/ mirror parity N/A / line budget PASS / link 切れ 0 が明記
- [ ] outputs/phase-09/quota-worst-case-calculation.md および main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- worst case 算定式が 5 シナリオすべてで明示
- AC2 / AC5 が定量的に PASS
- a11y / mirror / line budget / link 4 観点が網羅
- artifacts.json の `phases[8].status` が `spec_created`

## Phase 完了スクリプト呼出例

```bash
# 成果物の存在確認
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/main.md

# Phase 6 canonical-decision の参照確認（Phase 9 算定の前提）
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md

# Phase 完了マーク
# bash scripts/phase-complete.sh u-ut01-09-retry-and-offset-policy-alignment 9
```

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビューゲート)
- 引き継ぎ事項:
  - quota worst case 算定結果（AC2 / AC5 PASS）
  - SLA 算定結果（MTTR / 滞在最大時間 / 1 日成功確率）
  - offset 戦略別 quota 影響表（採択戦略の充足根拠）
  - a11y 対象外 / mirror parity N/A / line budget PASS / link 切れ 0 状態
- ブロック条件:
  - worst case のいずれかが 500 req/100s 以上
  - 1 tick が cron 6h 内に収束しない
  - SLA 指標が目標未達
  - canonical 値が Phase 6 で未確定（その場合は Phase 2 戻り）
