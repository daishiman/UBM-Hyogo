# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証 - quota / SLA 算定) |
| 次 Phase | 11 (手動 smoke / 代替 evidence) |
| 状態 | spec_created |
| タスク分類 | specification-design（final review gate） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| **user_approval_required** | **true** |

## 目的

Phase 1〜9 で確定した canonical 値（retry 上限 / backoff curve / `processed_offset` 採否 / offset 単位 / `SYNC_MAX_RETRIES` 既定値方針）と、Phase 9 で証明した quota / SLA 試算を横断レビューし、AC1〜AC6 すべての達成状態と 4条件最終判定（PASS / MINOR / MAJOR）を確定する。本タスクは設計判断記録であり、実装変更は UT-09 追補で行うため、Phase 10 では「**spec_created 段階の canonical 確定** + **UT-09 への申し送り計画**」が GO 条件となる。**user_approval_required: true** を明示し、ユーザー（または task owner）の明示的承認なしには次 Phase へ進めない。MAJOR は Phase 2 戻り（canonical 値の再選定）、MINOR は Phase 8 戻り（ドキュメント整流化の追加対応）の判定フローを必ず通す。

## 実行タスク

1. AC1〜AC6 の達成状態を spec_created 視点で評価する（完了条件: 全件に「仕様確定」「未確定」のいずれかが付与され、根拠 path が明示）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を確定する（完了条件: PASS / MINOR / MAJOR が一意に決定）。
3. **MAJOR / MINOR 判定フロー**を確定する（完了条件: MAJOR → Phase 2 戻り、MINOR → Phase 8 戻り、PASS → Phase 11 進行 のフローチャート明文化）。
4. blocker 一覧（着手前提）を作成する（完了条件: UT-09 / U-UT01-07 / U-UT01-08 との直交関係確認 + canonical 値の Phase 6 確定 + Phase 9 quota 算定 PASS が含まれる）。
5. UT-09 / U-UT01-07 / U-UT01-08 への申し送り計画を明文化する（完了条件: 各タスクへ引き渡す canonical 値 / 改訂ポイントが表で列挙）。
6. **user_approval_required: true** の運用ルールを明記する（完了条件: 承認待ち状態 / 承認後の状態遷移 / 承認なしでの強行禁止 が記述）。
7. GO/NO-GO 判定を確定し、Phase 11 へ進めるかを決定する（完了条件: `outputs/phase-10/go-no-go.md` に GO / NO-GO（戻り先 Phase 付き） が記述）。
8. open question を Phase 11/12 へ送り出す（完了条件: 残課題の受け皿 Phase が指定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-07.md | AC × 検証 × 実装トレース |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-08.md | ドキュメント整流化結果 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-09.md | quota / SLA 算定（AC2 / AC5 充足判定） |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 値の正本 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md | quota worst case 計算結果 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md | AC / 不変条件 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 原典・AC1〜AC6 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ | 合流タスク（実装反映先） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-and-job-logs-locks-alignment.md | 直交タスク（ledger 整合） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-status-trigger-enum-alignment.md | 直交タスク（enum 統一） |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-10.md | 最終レビュー参照事例 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: 本タスクは docs-only / spec_created の設計確定タスクであり、「canonical 値が Phase 6 で確定し、Phase 9 で定量的に裏付けられているか」「UT-09 / U-UT01-07 / U-UT01-08 への申し送り計画が確定しているか」で判定する。実装反映は UT-09 追補で行う。

| AC | 内容 | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC1 | canonical retry 最大回数（3 / 5 / その他）が比較表とともに採択され、採択理由が明文化されている | 仕様確定 | Phase 2 比較 + Phase 6 採択 | PASS |
| AC2 | canonical Exponential Backoff curve（base / 上限 / jitter 採否）が確定し、batch_size 100 と cron 間隔 6h で 1 tick 内に収まることが机上証明されている | 仕様確定 | Phase 6 採択 + Phase 9 worst case 算定 | PASS（Phase 9 で定量証明） |
| AC3 | `processed_offset` schema 採否（追加 / 不採用 / hybrid）が決定され、採択ケースの offset 単位（行 / chunk index / 安定 ID）が定義されている | 仕様確定 | Phase 6 採択 | PASS |
| AC4 | D1 migration 影響（追加列・DEFAULT・既存行 backfill・rollback）が机上で評価され、UT-09 / U-UT01-07 への申し送り内容が記載されている | 仕様確定 | Phase 5 / Phase 6 + 本 Phase 申し送り計画 | PASS |
| AC5 | Sheets API quota（500 req/100s/project）整合が worst case シナリオで成立することが算定済みである | 仕様確定 | Phase 9 worst case 集約表 | PASS（Phase 9 で定量証明） |
| AC6 | `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値、`DEFAULT_MAX_RETRIES = 5` を canonical へ寄せる際の過渡期運用方針が記載されている | 仕様確定 | Phase 6 appendix | PASS |

> 1 件でも「仕様未確定 / FAIL」がある場合は NO-GO（戻り先 Phase は判定区分による）。

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | retry 回数 / backoff curve / offset 採否 の canonical 統一により、苦戦箇所 #1（失敗解釈の二重化）/ #2（部分失敗リカバリ不能）/ #3（quota 踏み抜き）/ #4（offset 不在による監査不能） すべてに canonical な解を提示。Phase 1 真の論点と整合。 |
| 実現性 | PASS | 本タスクは docs-only でコード変更を伴わず、UT-09 追補で実装反映する経路が確定。Phase 9 worst case 算定で Sheets API quota / Workers CPU / cron 6h 間隔のいずれにも収まる canonical 値を採択済み。 |
| 整合性 | PASS | 直交関係（U-UT01-07 ledger 整合 / U-UT01-08 enum 統一）と独立し、値ポリシー（retry / backoff / offset）に閉じる。不変条件 #1（schema 固定回避） / #5（D1 access 閉鎖） に影響なし。Phase 8 で用語・参照 path 統一済み。 |
| 運用性 | PASS | canonical 値 single-source（Phase 6 canonical-decision.md）化、UT-01 申し送り表（Phase 8）/ UT-09 申し送り計画（本 Phase）/ quota 試算モデル（Phase 9）が後続実装の検証フォーマットとして再利用可能。 |

**最終判定: GO（PASS） — ただし user_approval_required: true により承認待ち**

## 判定フロー（MAJOR / MINOR / PASS）

```
[Phase 10 レビュー実施]
        │
        ▼
  AC1〜AC6 全 PASS ?
        │
   No ──┴── Yes
   │         │
   ▼         ▼
[戻り判定]   4条件全 PASS ?
   │              │
   │         No ──┴── Yes
   │         │         │
   │         ▼         ▼
   │    [戻り判定]  user_approval_required = true
   │         │              │
   │         │              ▼
   │         │         承認待機（task owner 確認）
   │         │              │
   │         │         No ──┴── Yes（承認）
   │         │         │              │
   │         │         ▼              ▼
   │         │    GO 保留        Phase 11 進行
   │         │
   ▼         ▼
[戻り判定マトリクス]
  - MAJOR（quota 試算未収束 / canonical 値合意未取得 / AC2・AC5 算定 FAIL） → Phase 2 戻り（canonical 値再選定 + 比較表更新）
  - MINOR（用語ゆれ残り / link 切れ / canonical single-source 違反 / 申し送り表不足） → Phase 8 戻り（ドキュメント整流化追加対応）
  - その他（AC1/3/4/6 仕様未確定）→ Phase 6 戻り（canonical 採択の見直し）
```

| 判定区分 | 戻り先 Phase | トリガー条件 |
| --- | --- | --- |
| **MAJOR** | Phase 2 | quota 試算が 500 req/100s を超過 / 1 tick が cron 6h 内に収束しない / canonical 値（retry / backoff / offset）の合意が Phase 6 で取得できていない / AC2 または AC5 が FAIL |
| **MINOR** | Phase 8 | 用語ゆれ残存 / canonical 値の transcribe 重複 / navigation drift / UT-01 申し送り表不足 |
| **PASS** | Phase 11 進行 | AC1〜AC6 全 PASS かつ 4条件全 PASS かつ user_approval 取得済み |

## blocker 一覧（着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | Phase 2 canonical-retry-offset-decision.md 確定 | 上流 Phase | retry / backoff / offset 採否すべて合意済み | `outputs/phase-02/canonical-retry-offset-decision.md` 実在 + 全 anchor 解決 |
| B-02 | Phase 9 quota worst case 算定 PASS | 上流 Phase | 5 シナリオすべて < 500 req/100s | `outputs/phase-09/quota-worst-case-calculation.md` の判定表 |
| B-03 | Phase 8 ドキュメント整流化完了 | 上流 Phase | 用語辞書確定 + UT-01 申し送り表 + navigation drift 0 | `outputs/phase-08/main.md` |
| B-04 | U-UT01-07（ledger 整合）と直交保持 | 直交タスク | テーブル/カラム ledger 論点に踏み込んでいない | 本 Phase 申し送り計画で確認 |
| B-05 | U-UT01-08（enum 統一）と直交保持 | 直交タスク | enum 名前空間に踏み込んでいない | 同上 |
| B-06 | UT-09 への申し送り計画確定 | 下流タスク準備 | canonical 値 / 改訂ポイントが表で列挙 | 本 Phase の申し送り表 |
| B-07 | user_approval 取得 | レビュー必須 | task owner が GO に明示同意 | レビュー記録（GitHub Issue / PR コメント等） |

> B-01〜B-03 のいずれかが未充足の場合、Phase 11 進行は **NO-GO** となる。B-07 が未取得の場合は GO 判定保留。

## UT-09 / U-UT01-07 / U-UT01-08 への申し送り計画

| 引き渡し先 | 引き渡し項目 | canonical 値（Phase 6 anchor） | UT-09 / 直交タスク側の対応 |
| --- | --- | --- | --- |
| UT-09 | retry 上限（実装反映） | `#max-retries` | `DEFAULT_MAX_RETRIES` を canonical 値に同期 |
| UT-09 | backoff curve（実装反映） | `#backoff-base` / `#backoff-cap` / `#jitter` | `withRetry({ baseMs, maxRetries, jitter })` 引数を canonical に同期 |
| UT-09 | `processed_offset` 採否 | `#offset-strategy` / `#offset-unit` | 採用なら migration 追加 + mapper 改修、不採用なら冪等 upsert 維持、hybrid なら chunk index + 安定 ID 実装 |
| UT-09 | `SYNC_MAX_RETRIES` 既定値 | Phase 6 appendix | wrangler.toml / .dev.vars / production secret の既定値を canonical に同期 |
| UT-09 | quota 実測との照合 | Phase 9 worst case 表 | staging で実測し本仕様と整合確認 |
| U-UT01-07 | ledger 整合との不衝突 | 値ポリシー閉鎖 | 本タスクは値のみ、テーブル/カラム名 ledger は U-UT01-07 が決定 |
| U-UT01-08 | enum 統一との不衝突 | 値ポリシー閉鎖 | 本タスクは数値・タイミング・再開ロジックのみ、enum は U-UT01-08 が決定 |
| UT-01 phase-02（仕様改訂） | retry / backoff / processed_offset の上書き | Phase 8 申し送り表 | 別タスク（spec_updated）で UT-01 改訂 |

## user_approval_required の運用ルール

| 状態 | 説明 | 遷移条件 |
| --- | --- | --- |
| `awaiting_approval` | Phase 10 レビュー完了、task owner 承認待ち | Phase 10 が AC1〜AC6 / 4条件すべて PASS で完了 |
| `approved` | task owner が GO に明示同意 | レビュー記録（PR コメント / Issue コメント / 専用 review log）に承認文言が記載 |
| `rejected_major` | task owner が MAJOR 戻りを指示 | レビューで quota / canonical 値の再検討が要求 |
| `rejected_minor` | task owner が MINOR 戻りを指示 | レビューで用語 / リンク / 整流化の追加が要求 |

> **強行禁止ルール**: `awaiting_approval` 状態で Phase 11 へ進むことを禁止する。承認なしでの強行は本タスクの「設計判断記録」としての価値を毀損するため、必ず承認待ちとする。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | UT-01 phase-02 仕様の改訂タイミング | Phase 12 / 別 spec_updated タスク | unassigned-task 候補 |
| 2 | jitter の具体的乱数生成法（crypto / Math.random / cloudflare workers） | UT-09 実装時 | UT-09 で決定 |
| 3 | offset 採用時の migration 適用順序（U-UT01-07 ledger 整合との依存関係） | U-UT01-07 / UT-09 | 依存関係調整 |
| 4 | staging 実測値と本 Phase 9 worst case 試算の照合方法 | UT-09 受入条件 | UT-09 で運用化 |
| 5 | failed → in_progress 再開時の `started_at` 上書き挙動の最終仕様 | UT-01 改訂タスク | 仕様改訂で確定 |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC1〜AC6 すべて PASS
- [ ] 4条件最終判定が PASS
- [ ] blocker B-01〜B-06 がすべて充足
- [ ] B-07（user_approval）取得済み
- [ ] MAJOR が一つもない
- [ ] MINOR が一つもない（あれば Phase 8 戻り）
- [ ] open question すべてに受け皿 Phase が指定済み
- [ ] UT-09 / U-UT01-07 / U-UT01-08 への申し送り計画が確定

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る → **Phase 2 戻り**
- AC2 / AC5 が定量的に PASS でない → **Phase 2 戻り**
- 用語ゆれ / link 切れ / canonical transcribe 重複が残る → **Phase 8 戻り**
- canonical 値が Phase 6 で未確定 → **Phase 6 戻り**
- user_approval が未取得 → 承認待機（GO 保留）
- UT-09 / 直交タスクとの直交関係が崩れている → 当該 Phase 戻り

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に、AC1〜AC6 を spec_created 視点で評価。

### ステップ 2: 4条件最終判定
- Phase 1 真の論点 + Phase 9 quota / SLA 算定で再確認。

### ステップ 3: MAJOR / MINOR 判定フロー確定
- 戻り先 Phase 付きフローチャートを記述。

### ステップ 4: blocker 一覧作成
- 上流 Phase 3 件 + 直交タスク 2 件 + 下流準備 1 件 + レビュー 1 件 = 7 件。

### ステップ 5: 申し送り計画作成
- UT-09 / U-UT01-07 / U-UT01-08 / UT-01 への引き渡し項目を表で列挙。

### ステップ 6: user_approval 運用ルール明記
- 4 状態 + 強行禁止ルール。

### ステップ 7: GO/NO-GO 確定
- `outputs/phase-10/go-no-go.md` に判定 + 戻り先 Phase（NO-GO の場合） を記述。

### ステップ 8: open question を次 Phase へ送出
- 5 件すべてに受け皿 Phase 指定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 + 承認取得を入力に手動 smoke / 代替 evidence を実施 |
| Phase 12 | 申し送り計画を unassigned-task-detection / system-spec-update-summary に転記 |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| UT-09 | canonical 値で実装反映、staging 実測で Phase 9 試算と整合確認 |
| U-UT01-07 / U-UT01-08 | 直交関係維持の確認（テーブル/カラム / enum に踏み込まない） |

## 多角的チェック観点

- 価値性: 苦戦箇所 4 件すべてに canonical な解が提示され、設計判断が記録として残置される。
- 実現性: docs-only で実装変更を伴わず、UT-09 追補で実装反映する経路が明示。
- 整合性: 不変条件 #1〜#5 すべて satisfied、直交タスク（U-UT01-07 / U-UT01-08）と独立。
- 運用性: canonical single-source / quota 試算モデル / 申し送り表が後続検証で再利用可能。
- 認可境界: 値ポリシーのみで認可境界に影響なし、`sync_locks` 排他は U-UT01-07 責務。
- 無料枠: Sheets API quota / D1 / Workers すべて無料枠余裕度確認済み。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC1〜AC6 達成状態評価 | 10 | spec_created | 6 件 |
| 2 | 4条件最終判定 | 10 | spec_created | PASS |
| 3 | MAJOR / MINOR 判定フロー | 10 | spec_created | 戻り先 Phase 明示 |
| 4 | blocker 一覧作成 | 10 | spec_created | 7 件 |
| 5 | 申し送り計画 | 10 | spec_created | UT-09 / 直交 / UT-01 |
| 6 | user_approval 運用ルール | 10 | spec_created | 4 状態 + 強行禁止 |
| 7 | GO/NO-GO 判定 | 10 | spec_created | GO（承認待機） |
| 8 | open question 送出 | 10 | spec_created | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・判定フロー・blocker・申し送り計画・user_approval |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC1〜AC6 全件に達成状態が付与され、根拠 path が明示
- [ ] 4条件最終判定が PASS
- [ ] MAJOR / MINOR / PASS 判定フローと戻り先 Phase が明文化
- [ ] blocker 一覧に 7 件以上が記述
- [ ] UT-09 / U-UT01-07 / U-UT01-08 / UT-01 への申し送り計画が表で列挙
- [ ] user_approval_required: true の運用ルール（4 状態 + 強行禁止）が明記
- [ ] GO/NO-GO 判定が確定（GO の場合は承認待機状態を明示、NO-GO の場合は戻り先 Phase を明示）
- [ ] open question 5 件すべてに受け皿 Phase が指定
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4条件 × 判定フロー × blocker × 申し送り × user_approval × GO/NO-GO × open question の 8 観点すべて記述
- user_approval_required: true が明示
- artifacts.json の `phases[9].status` が `spec_created`

## Phase 完了スクリプト呼出例

```bash
# 成果物の存在確認
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-10/go-no-go.md

# 上流 Phase 成果物の確認
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-08/main.md
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md

# user_approval 状態の確認（手動レビュー記録）
# 例: gh issue view <issue-number> または PR コメントで確認

# Phase 完了マーク（承認取得後のみ）
# bash scripts/phase-complete.sh u-ut01-09-retry-and-offset-policy-alignment 10
```

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke / 代替 evidence — NON_VISUAL のため screenshot ではなく代替 evidence を採用)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階） + user_approval 取得記録
  - canonical 値（Phase 6 anchor 経由で参照）
  - quota worst case 算定結果（Phase 9）
  - UT-09 / U-UT01-07 / U-UT01-08 / UT-01 への申し送り計画
  - open question 5 件を Phase 11/12 で消化
  - NON_VISUAL タスクであり Phase 11 では screenshot ではなく代替 evidence（grep 結果 / 計算式再検証 / link 整合スナップショット）を採用
- ブロック条件:
  - 4条件のいずれかが MAJOR → Phase 2 戻り
  - 用語ゆれ / link 切れ → Phase 8 戻り
  - user_approval 未取得 → 承認待機（強行禁止）
  - 申し送り計画が空
