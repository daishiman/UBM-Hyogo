# Phase 3 成果物: 設計レビュー（main.md）

> **ステータス**: completed
> 本ファイルを Phase 3 設計レビューの正本とする。仕様本体は `../../phase-03.md` を参照。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| レビュー対象 | Phase 2 成果物 3 点（sync-method-comparison / sync-flow-diagrams / sync-log-schema） |
| 判定 | **PASS**（base case B / Workers Cron Triggers 定期 pull） |
| 実行日 | 2026-04-29 |

## 2. 総合判定

base case B（Cloudflare Workers Cron Triggers による定期 pull）を **PASS** として確定する。無料枠完結 / 不変条件 #5 整合 / 冪等性確保（`sync_log` + `processed_offset` + `idempotency_key`）/ バックフィル設計の単純さ / Sheets API quota 適合性の 5 観点すべてで base case が他案を上回る。代替案 4 件（A/B/C/D）を比較し、A・C は MAJOR で却下、D は MINOR（将来オプション）として TECH-M-01 で追跡する。AC-1〜AC-10 の Phase 1〜3 担当分はすべて充足、UT-09 着手準備の open question は 0 件。

## 3. 評価マトリクス

| 観点 | A push | B pull (base) | C webhook | D hybrid |
| --- | --- | --- | --- | --- |
| 即時性 | 高 | 中 | 高 | 高 |
| 実装コスト | 中 | 低 | 高 | 高 |
| Workers CPU 適合 | 低 | 高 | 中 | 中 |
| Sheets quota 適合 | 低 | 高 | 中 | 中 |
| 冪等性確保 | 中 | 高 | 中 | 中 |
| 無料枠適合 | 中 | 高 | 不明 | 中 |
| 障害復旧単純さ | 低 | 高 | 低 | 中 |
| MVP 適合 | 中 | **PASS** | 低 | 低 |

## 4. PASS / MINOR / MAJOR 判定

| 案 | 判定 | 主な指摘 |
| --- | --- | --- |
| A push（Apps Script webhook） | **MAJOR** | Apps Script 認証境界の追加が不変条件 #5 の方向性に反し、Workers CPU 30ms バーストと Sheets API 応答 200ms〜1s の衝突。Apps Script SLA 不明。**却下** |
| B pull（Workers Cron Triggers） | **PASS** | 無料枠完結 / 冪等性 / バックフィル / quota 適合のすべてで合格。MVP 採択 |
| C webhook（Drive API push notifications） | **MAJOR** | Sheets 行レベル diff を直接通知する API がなく Drive API watch 経由が必要。channel 永続化に定期更新ジョブ必要で実装コスト過大。**却下** |
| D hybrid（webhook + cron fallback） | **MINOR** | MVP 過剰投資。base B 安定後の即時性要件発生時に検討する将来オプション。TECH-M-01 で追跡 |

## 5. リスクと対策

| # | リスク | 影響 | 確率 | 対策（Phase 配置） |
| --- | --- | --- | --- | --- |
| R-1 | 採択方式（Cron pull）の即時性不足で運用クレーム | 中 | 低 | Cron 間隔調整（6h → 1h → 最短 5 分）。Phase 2 で sync-method-comparison §確定パラメータに猶予を確保 |
| R-2 | Sheets API quota 超過 | 高 | 中 | バッチ 100 行 / Backoff 1〜32s / quota 例外時 100s 以上待機。Phase 2 で確定 |
| R-3 | D1 SQLITE_BUSY による sync 中断 | 中 | 中 | UT-02 方針継承（chunk 単位 retry / batch 100 行上限）。Phase 2 で確定 |
| R-4 | 冪等性破綻（行挿入で UPSERT 上書き） | 高 | 中 | 行ハッシュ + 固有 ID 戦略を UT-04 引き継ぎ事項として明文化。sync-log-schema §UT-04 引き継ぎ |
| R-5 | sync_log 論理設計の物理化困難（partial unique index） | 中 | 低 | Phase 4 / UT-04 で D1 サポート確認、未対応時は lock table / transaction 境界で代替 |
| R-6 | UT-09 着手時の open question 残存 | 高 | 中 | Phase 10 最終レビューで open question 0 件を再確認。本 Phase で 0 件達成を §9 で確認済 |
| R-7 | workflow_state 誤書換え（spec_created → completed） | 中 | 中 | UT-GOV-005 縮約テンプレ準拠で Phase 12 close-out で据え置き |

## 6. MINOR 追跡

| ID | 内容 | 解決 Phase |
| --- | --- | --- |
| TECH-M-01 | hybrid（D 案）の将来オプションを Phase 12 unassigned-task-detection で記録 | Phase 12 |
| TECH-M-02 | Cron 間隔（6h / 1h / 5min）の最終確定は UT-09 staging で測定 | UT-09 |
| TECH-M-03 | partial unique index（WHERE 句付き）の D1 サポート確認 | Phase 4 / UT-04 |
| TECH-M-04 | sync_log 保持期間（completed=7d / failed=30d）の運用調整余地（UT-08 監視と連動） | Phase 12 / UT-08 |

## 7. 4 条件再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 が本仕様書のみで実装着手可能になり、設計手戻り（方式差し戻し / sync_log カラム不足 / quota 後付け）を未然防止 |
| 実現性 | PASS | docs のみ。CI / runtime / Cloudflare bindings へ副作用なし。Phase 2 成果物 3 点はすべて作成済 |
| 整合性 | PASS | 不変条件 #1/#4/#5 と整合、UT-04 / UT-09 への引き継ぎ事項が明文化済 |
| 運用性 | PASS（with notes） | Cron 間隔の最終調整は UT-09 staging で実施。MINOR-M-02 で追跡。無料枠完結 |

## 8. 着手可否ゲート

| 項目 | 状態 |
| --- | --- |
| Phase 4 着手 | **PASS** |
| 上流 3 タスク完了確認 | 完了済（02-monorepo / 01b-cloudflare / 01c-google-workspace） |
| Phase 2 成果物 3 点 | 作成済（sync-method-comparison / sync-flow-diagrams / sync-log-schema） |
| Phase 13 blocked 条件 | AC-1〜AC-10 の Phase 9/10 FAIL / AC-9 不達 / `workflow_state` 誤書換え |

### NO-GO 条件（該当なし）

- 上流タスク未完で D1 binding / Sheets ID が宙に浮く → 該当なし（completed-tasks 配下に存在）
- Sheets API quota 仕様が想定と乖離 → 該当なし（500 req/100s/project は公式仕様で確定）
- Cloudflare Workers Cron Triggers が無料枠から外れる仕様変更 → 該当なし

## 9. UT-09 着手準備チェック（AC-9 担保）

| 確認項目 | Phase 2 で確定済か | 参照箇所 |
| --- | --- | --- |
| 同期方式の採択 | YES | sync-method-comparison §3（B: Workers Cron Triggers 定期 pull） |
| Cron スケジュール初期値 | YES | sync-method-comparison §5（`0 */6 * * *`、staging で短縮可） |
| 手動同期 endpoint | YES | sync-flow-diagrams §2（`POST /admin/sync`） |
| バックフィル endpoint | YES | sync-flow-diagrams §4（`POST /admin/sync?full=true`） |
| バッチサイズ | YES | sync-method-comparison §5（100 行） |
| Backoff 戦略 | YES | sync-method-comparison §5 + sync-flow-diagrams §2 エラーパス（1s→32s 上限、quota は 100s 以上） |
| retry 上限 | YES | 最大 3 回 |
| 冪等性キー | YES | sync-log-schema §6（active lock / idempotency_key / offset monotonicity） |
| 行ハッシュ / 固有 ID 戦略 | YES（UT-04 引き継ぎ） | sync-log-schema §7 |
| sync_log 13 カラム | YES | sync-log-schema §2 |
| 状態遷移 | YES | sync-log-schema §3 |
| 索引候補 | YES | sync-log-schema §4 |
| 保持期間 | YES | sync-log-schema §5（completed=7d / failed=30d / in_progress=1h で stale） |
| ロールバック判断 | YES | sync-flow-diagrams §6（Sheets / D1 / 双方破損のフローチャート） |
| Source-of-truth | YES | sync-method-comparison §5（Sheets 優先 / D1 反映先） |
| Open question | **0 件** | staging 値調整は方式未決ではなく実測タスク（TECH-M-02） |

**結論**: AC-9（UT-09 が本仕様書のみで着手可能）を満たす。

## 10. 次 Phase 引き継ぎ

- 採択方式 B（Workers Cron Triggers 定期 pull）を Phase 4 以降のテスト戦略 / 実装ランブック / 異常系検証の前提として固定
- MINOR 4 件（TECH-M-01〜04）を Phase 12 / UT-04 / UT-08 / UT-09 へ振り分け。Phase 8/9 追加分を含む MINOR 6 件は Phase 10/12 で全量転記
- リスク R-1〜R-7 を Phase 4（テスト戦略）/ Phase 6（異常系検証）の入力に
- AC-9 達成状況（open question 0 件）を Phase 10 最終レビューで再確認
- `workflow_state = spec_created` を Phase 12 で据え置く方針を引き継ぎ
- 4 条件すべて PASS を Phase 9 品質保証で再評価
