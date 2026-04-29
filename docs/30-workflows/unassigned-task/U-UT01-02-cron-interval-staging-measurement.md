# U-UT01-02: Cron 間隔の staging 測定タスク

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-UT01-02 |
| タスク名 | Cron 間隔 staging 測定（6h / 1h / 5min 実測） |
| 親タスク | UT-01（Sheets→D1 同期方式定義） |
| 関連タスク | UT-09（Sheets→D1 同期ジョブ実装） / UT-08（監視・アラート） / UT-03（Sheets API 認証） |
| 優先度 | MEDIUM |
| 起票元 | UT-01 phase-12 unassigned-task-detection.md（U-2） |
| 起票日 | 2026-04-29 |
| 状態 | unassigned |
| workflow_state | spec_pending |
| visualEvidence | NON_VISUAL |
| taskType | docs-only-or-investigation |
| 既存タスク組み込み | UT-09 内で吸収可（独立化はオプション） |
| 組み込み先候補 | UT-09 Phase 5 / Phase 11 staging 検証 |

## 目的

UT-01 Phase 2 で確定した既定 Cron 間隔 `0 */6 * * *`（6 時間ごと）を **staging で 6h / 1h / 5min の 3 段階で実測**し、
以下の観点から最適粒度を確定する設計判断タスクである。

- Sheets API quota（500 req/100s/project）消費率
- Cloudflare Workers Cron 実行回数（無料枠 / 有料枠の境界）
- D1 への書き込み量・row read / write 単価との適合
- 同期遅延 SLA（運用上の "鮮度" 要求）と quota コストのトレードオフ
- `sync_log` テーブル増加速度と保持期間（U-4 と連動）

採択値が UT-09 実装の `wrangler.toml` `[triggers].crons` に直接反映されるため、
本タスク完了をもって **canonical な Cron 間隔の確定** とする。

## スコープ

### 含む

- staging 環境（`apps/api` Worker）に対して 6h / 1h / 5min の 3 つの cron 設定を順次適用する手順の文書化
- 各間隔における **24h 連続観測**結果の表化（quota 消費 / 実行成功率 / 平均実行時間 / D1 書込量）
- `sync_log` 増加レートの計測と、保持期間 7d / 30d / 90d ごとの推定容量算出
- 採択間隔の決定とその根拠（quota / SLA / 容量）を記載した ADR ライクな決定文書
- UT-09 の `wrangler.toml` `[env.staging.triggers]` / `[env.production.triggers]` への反映指示書

### 含まない

- 同期ジョブ本体の実装（→ UT-09）
- 監視・アラート閾値の本実装（→ UT-08 / 連携検討は本タスクで input 提供のみ）
- production 環境への直接適用（staging 結果に基づく PR を別タスクとして起票）
- D1 物理スキーマ変更（→ UT-04）

## UT-09 内吸収では不足する場合の独立化条件

以下のいずれかに該当した場合、本タスクを **独立タスクとして切り出す**こと:

1. UT-09 staging 反映時点で `0 */6 * * *` 以外の間隔が候補に上がり、quota / SLA トレードオフ評価に
   24h 以上の観測データを要する場合（UT-09 の Phase 期間を逸脱するため）
2. UT-08（監視・アラート）の閾値定義が cron 間隔依存となり、両タスクの完了同期が必要になった場合
3. Sheets API quota が他用途（管理画面の手動同期 / バックフィル）と競合し、配分設計（U-6 と連動）が
   必要になった場合
4. `sync_log` 保持期間（U-4）と cron 間隔の積で D1 容量見積が無料枠境界に接近した場合

UT-09 の Phase 5 / Phase 11 内で 1 回の staging 観測（6h 既定値の検証のみ）で完結する場合は、
本タスクは UT-09 に吸収して独立化しない。

## 受入条件（AC）

- [ ] **AC-1**: staging 環境で 6h / 1h / 5min の 3 間隔それぞれを 24h 以上稼働させた観測ログが
  `docs/30-workflows/U-UT01-02-cron-interval-staging-measurement/outputs/phase-N/measurement-log.md` に存在する
- [ ] **AC-2**: 各間隔の Sheets API 呼出数 / Workers cron 実行回数 / D1 row write 数 / `sync_log` 行数増分が
  表で整理され、無料枠 / 有料枠の境界からの距離が明示されている
- [ ] **AC-3**: 採択 cron 間隔とその根拠（quota / SLA / 容量 / 復旧容易性の重み付け）が
  ADR 形式で記載され、UT-09 の `wrangler.toml` 反映指示が含まれる
- [ ] **AC-4**: U-4（sync_log 保持期間）／ UT-08（監視）／ U-6（GCP quota 配分）との連動ポイントが
  明示され、後続タスクへの申し送り事項が箇条書きで列挙されている
- [ ] **AC-5**: 採択値を production に反映する PR 起票テンプレ（branch 名 / タイトル / 本文骨子 / 影響範囲）が
  添付されている

## 苦戦箇所【記入必須】

- 対象: `apps/api/wrangler.toml` の `[triggers].crons` および `[env.staging.triggers].crons`
- 症状候補:
  1. staging で `*/5 * * * *` を設定すると Sheets API quota（500 req/100s/project）を他経路（管理画面手動同期など）と
     共有した場合に 429 が発生する可能性がある。Exponential Backoff（1s, 2s, 4s, 8s, 16s, 32s 上限）の発火頻度を
     `sync_log.retry_count` で実測する必要がある
  2. Cloudflare Workers の Cron Triggers は **設定後の最初の 1 tick まで最大 1 分**遅延することがあり、
     5min 間隔の実測初回は基準点として除外する判断が必要
  3. `wrangler.toml` の `[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]` で
     **cron 配列が継承されない仕様**のため、3 箇所すべてに明示記載が必要（既存知見: deployment-cloudflare.md L161-172）
  4. staging→production 移行時に cron 間隔差分があると、本番初動で Sheets API quota スパイクが発生する。
     production 反映前に warm-up 期間（1h 間隔で 6h 稼働など）を設ける判断が必要になる
- 参照:
  - `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md` §5 確定パラメータ
  - `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` U-2 行
  - `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` L161-172（API Worker cron / Forms response sync）

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| staging で 5min 間隔稼働中に Sheets API quota を他用途と共有して 429 多発 | 高 | 観測前に U-6（GCP quota 配分）の現況を確認。専用 Service Account の quota 単独使用が望ましい |
| Workers Cron の最大 30s 実行時間制限内に同期が完了せず途中で打ち切られる | 中 | batch size 100 行・`processed_offset` 再開設計（UT-01 Phase 2 確定）に準拠。observation で実行時間 p95 を収集 |
| `sync_log` 行数が 5min 間隔で爆発し D1 row read 制限に接近 | 中 | 保持期間 7d を初期値に観測。U-4（保持期間設計）と並走で容量予測表を作成 |
| staging 結果を production に直接適用し本番 quota スパイク | 高 | production 反映前に "1h warm-up 6h" のステージング段階を採択値の決定文書に明記 |
| 観測期間が短く quota 消費の時間帯依存（業務時間 vs 深夜）が見えない | 中 | 各間隔最低 24h、可能なら 7d 観測を推奨。最小要件は 24h で AC-1 を満たす |
| `wrangler.toml` に `[triggers]` のみ記載し env-scoped triggers を忘れる | 中 | 3 箇所（root / staging / production）すべての cron 配列を明示する PR チェックリストを採択値決定文書に同梱 |

## 検証方法

### 単体検証（観測手順の妥当性）

```bash
# staging cron が登録されているかを確認
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run

# 直近 24h の cron 実行ログを確認
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format=json \
  | jq 'select(.event == "cron.sync.start" or .event == "cron.sync.end")'
```

期待:
- `dry-run` で `[env.staging.triggers].crons` が `["*/5 * * * *"]` 等の設定値で表示される
- `cron.sync.start` / `cron.sync.end` イベントが想定間隔（±1 分許容）で出現する

### 統合検証（観測データ集計）

```bash
# sync_log の集計（staging）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT trigger_type, status, COUNT(*) AS cnt, AVG(duration_ms) AS avg_ms \
             FROM sync_log \
             WHERE created_at >= datetime('now', '-24 hours') \
             GROUP BY trigger_type, status;"

# Sheets API 呼出数（GCP Console / Cloud Logging から CSV 取得後 jq で集計）
# 期待 KPI:
#   - 6h: ~4 calls/day, quota 利用率 < 1%
#   - 1h: ~24 calls/day, quota 利用率 < 5%
#   - 5min: ~288 calls/day, quota 利用率 < 30%（他用途と共有時の安全マージン）
```

期待:
- 各間隔の `status='completed'` 比率が 95% 以上
- `status='failed'` で `retry_count >= 3` のレコードが 0 件、または quota 起因の場合は backoff 後に completed
- 採択値決定文書（ADR）に観測 KPI 表が掲載されている

### ドキュメント検証

```bash
# 必須セクションが揃っているか
grep -c "^## 苦戦箇所" docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md
grep -c "^## リスクと対策" docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md
grep -c "^## 検証方法" docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md
grep -c "^## スコープ" docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md
```

期待: いずれも 1 以上

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-01（Sheets→D1 同期方式定義） | Cron 既定値 `0 */6 * * *` および sync_log 設計が確定している必要がある |
| 上流 | UT-09（Sheets→D1 同期ジョブ実装） | staging で実稼働する同期ジョブが存在しないと観測できない |
| 上流 | UT-03（Sheets API 認証方式設定） | Service Account による staging 接続が確立している必要がある |
| 連携 | UT-04（D1 物理スキーマ） | `sync_log` 物理スキーマが確定している必要がある |
| 連携 | UT-08（監視・アラート） | cron 実行失敗・quota 接近の閾値定義の input になる |
| 連携 | U-4（sync_log 保持期間） | 容量見積で保持期間と cron 間隔の積を扱う |
| 連携 | U-6（GCP quota 配分） | 他用途との quota 共有状況の確認が前提条件 |
| 下流 | production cron 反映 PR | 採択値決定文書を input に PR 起票 |

## 関連リンク

- 親仕様: [docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md](./UT-01-sheets-d1-sync-design.md)
- 親仕様 outputs: [docs/30-workflows/ut-01-sheets-d1-sync-design/index.md](../ut-01-sheets-d1-sync-design/index.md)
- 起票元（back-link）: [docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md](../ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md) §U-2
- 採択 cron 値根拠: [docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md](../ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md) §5
- Phase-12 main: [docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/main.md](../ut-01-sheets-d1-sync-design/outputs/phase-12/main.md)
- 連携先タスク: [UT-09 (U-04-sheets-to-d1-sync-implementation.md)](./U-04-sheets-to-d1-sync-implementation.md)
- システム仕様: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` §API Worker cron / Forms response sync（L161-172, L497）
- システム仕様: `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` §D1 / API route 設計方針

## システム仕様（aiworkflow-requirements）から反映する不変条件

| 項目 | 値 / 規約 | 出典 |
| --- | --- | --- |
| Cron 設定箇所 | `wrangler.toml` の `[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]` の **3 箇所すべてに明示** | deployment-cloudflare.md L161-172 |
| 観測イベント | `cron.sync.start` / `cron.sync.end` を主要イベントとして tail / log 集計対象に含める | deployment-cloudflare.md L497 |
| D1 アクセス境界 | 観測クエリも含めて `apps/api` 経由のみ（直接アクセス禁止） | CLAUDE.md 不変条件 §5 |
| Cloudflare CLI 実行 | すべて `bash scripts/cf.sh` ラッパー経由（`wrangler` 直叩き禁止） | CLAUDE.md / MEMORY.md |

## 注意事項

- 本ファイルは **仕様書のみ**。実装コード（cron 設定変更・SQL 追加など）は本タスクに含めない
- staging 観測中は `apps/api` の他用途（手動同期 endpoint）の利用を最小化し、quota 競合を抑える
- 採択値の最終決定は本タスクの ADR にて行うが、production 反映 PR は別タスクとして起票する
