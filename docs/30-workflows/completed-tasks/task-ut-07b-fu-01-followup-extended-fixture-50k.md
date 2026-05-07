# UT-07B-FU-01-FOLLOWUP extended fixture 50k row - タスク指示書

## メタ情報

```yaml
issue_number: 504
task_id: UT-07B-FU-01-FOLLOWUP-extended-fixture-50k
task_name: schema alias back-fill 用 50,000 行 extended fixture と staging stress trial
category: type:test
target_feature: schema alias back-fill batch / Queue split
priority: low
scale: small
status: 未実施
source_phase: docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-06
dependencies:
  - UT-07B-FU-01-schema-alias-backfill-queue-cron-split
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-FU-01-FOLLOWUP-extended-fixture-50k |
| タスク名 | schema alias back-fill 用 50,000 行 extended fixture と staging stress trial |
| 分類 | test / runtime evidence |
| 対象機能 | schema alias back-fill batch / Queue split |
| 優先度 | low |
| 見積もり規模 | small |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-06 |
| issue_number | #504 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-07B-FU-01 は Queue / Cron 分割の判定基準を「10,000 行で persistent CPU 枯渇 ≥ 3 / 10 trials」と定義した。Phase 11 gate は 10,000 行を first proof として優先し、50,000 行クラスの extended fixture は「10,000 行で持続性が証明されてから扱う」とした。この前提のため、extended fixture は本タスクで未着手のまま残っている。

### 1.2 問題点・課題

- 50,000 行クラスでの batch 失敗・retry 増加・DLQ 投入の実測が無いため、Queue 分割の効果上限が不明
- cursor semantics 採用判断（別 follow-up）の比較条件が 10,000 行に偏ったまま結論される懸念
- 本番運用で 50,000 行級の back-fill が発生した場合の挙動が事前確認されない

### 1.3 放置した場合の影響

- Queue split の効果が大規模ケースで保証されない
- cursor semantics の採用判断が不完全
- 本番初回実行で予測不能な CPU budget exhausted ループが発生するリスク

---

## 2. 何を達成するか（What）

### 2.1 目的

50,000 行以上の extended fixture を staging で安全に流し、retry_count / failed_items / CPU 時間 / Queue / DLQ 滞留を観測して runtime evidence を補強する。

### 2.2 最終ゴール

- 50,000 行 extended fixture の生成スクリプト / D1 投入手順が記録されている
- staging stress trial の結果（10 trials の retry_count / CPU 時間 / DLQ 数）が evidence として記録されている
- cursor semantics 採用判断の補助 input として参照可能になっている

### 2.3 スコープ

#### 含む

- 50,000 行 fixture 生成スクリプト
- staging stress trial 実行と numerical evidence 記録
- DLQ / retry_count 観察

#### 含まない

- 本番投入
- API contract 変更
- cursor 実装そのもの（別 follow-up）
- Cloudflare Queue / DLQ の作成（user 承認イベント前提）
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-07B-FU-01 が runtime PASS していること、または少なくとも 10,000 行 staging trial が完了していること
- staging 用 D1 と Cloudflare Queue / DLQ が利用可能であること（user 承認後）
- redaction 方針（PII / secret を含めない fixture 生成）が確認されていること

### 3.2 推奨アプローチ

1. 既存 fixture 生成パターンに沿って 50,000 行 fixture を合成する（実 PII を使わず synthetic data）
2. `scripts/` 配下に投入スクリプト（D1 経由 INSERT）を追加する
3. staging で 10 trials を実行し、retry_count / failed_items_json / CPU 時間 / Queue 滞留を記録する
4. evidence を `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/` の補足、または別 evidence ファイルに追加する

---

## 4. 実行手順

### Phase 1: fixture 設計

1. PII を含まない synthetic な 50,000 行を作る（schema_diff_queue 投入対象の row 構造に合わせる）
2. dedupe_key の重複が起きない採番ルールを決める

### Phase 2: 投入スクリプト

1. `scripts/` に bulk INSERT スクリプトを追加（read-only ではない点に注意）
2. staging のみに作用するよう `--env staging` で固定し、production には誤投入できないガードを設ける

### Phase 3: trial 実行

1. staging に fixture 投入
2. back-fill を発火し、10 trials 分の retry_count / CPU 時間 / Queue 投入数 / DLQ 数 / `backfill.status` を記録
3. evidence は redaction（実 ID / token / PII を含めない）を確認したうえで保存

### Phase 4: 結果評価

1. retry_count や DLQ 件数のしきい値を超えたかどうかを判定
2. 超えた場合は cursor semantics 採用判断 follow-up に input として連携

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 50,000 行 fixture が staging に投入できた
- [ ] 10 trials の数値 evidence が記録されている
- [ ] DLQ / retry_count の状況が観測されている

### 品質要件

- [ ] fixture / 投入スクリプトが production を誤更新しない
- [ ] PII / token / 実 ID が evidence に含まれていない
- [ ] 既存 0014 migration / repository を改変していない

### ドキュメント要件

- [ ] evidence が `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` 配下に redaction 済みで残っている
- [ ] cursor semantics 採用判断 follow-up からこの evidence を参照できる

---

## 6. 検証方法

### 投入スクリプト動作確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --command "SELECT COUNT(*) FROM schema_diff_queue"
```

期待: 50,000 行が staging D1 に存在する。

### back-fill 観測

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --command "SELECT backfill_status, COUNT(*) FROM schema_diff_queue GROUP BY backfill_status"
```

期待: `pending` → `running` → `completed` / `exhausted` への遷移が観測できる。

### redaction チェック

```bash
rg "@gmail|@senpai-lab|token|secret" docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/
```

期待: 一致無し。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| production に誤投入 | 高 | スクリプトを `--env staging` 固定、production env では即時 abort |
| evidence に PII / token 混入 | 高 | synthetic data のみ使用、redaction CI grep |
| staging D1 の write quota 圧迫 | 中 | trial 後に fixture を削除する cleanup を含める |
| cursor 採用判断と切り離されたまま evidence が陳腐化 | 中 | cursor follow-up と相互参照する |

---

## 8. 参照情報

- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`

---

## 9. 備考

Phase 11 gate は 10,000 行を first proof として明示し、50,000 行は after that として記録された。本タスクはその after that を formal task に昇格する。

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md`
- 症状: 50,000 行クラスの fixture が runtime evidence に存在しないため、Queue split の効果上限と cursor semantics 採用判断の前提が 10,000 行に閉じている。staging stress evidence が無いと、本番初回実行で 50,000 行級が出現したときの挙動が予測できない。
- 参照: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
