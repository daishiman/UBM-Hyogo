# Phase 6: 異常系・エラーハンドリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・エラーハンドリング |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (受入条件マトリクス) |
| 状態 | spec_created |
| 推奨Wave | Wave 2 |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118（CLOSED） |

## 目的

Phase 5 実装ランブック Step 1〜8 で構築する D1 export → R2 保管 → 通知 → 復元の運用パイプラインに対し、運用上発生し得る異常系シナリオを **E1〜E7** として仕様レベルで網羅する。各 E について「トリガ条件 / 検出方法 / 通知 / 期待リカバリ / 復旧主体」を表化し、Phase 11 smoke / Phase 7 AC × E trace matrix の入力を確定させる。本 Phase は仕様化のみで、実走（実コード追加）は Phase 13 ユーザー承認後の別 PR に委ねる。

## 真の論点

- 「何が壊れるか」ではなく、**「壊れたときに sub-day で気付き、データロスゼロで復旧できる検出・通知・リカバリの三位一体」** を E1〜E7 で確定する。
- 副次論点: (1) UT-08 通知の誤検知抑制（一過性 vs 継続障害）、(2) 空 export を error と判定しない境界（AC-6）、(3) hash mismatch 検出を put 時 / 復元時のどちらで強制するか。

## 依存（Phase 5 ランブックと整合）

- Phase 5 Step 5 ラッパが備える failure handler の例外境界を本 Phase の起点とする。
- E1〜E7 は Step 5 の failure 経路の分岐網羅であり、Phase 4 T1〜T7（happy path + 観点別検証）と相補関係にある。
- UT-22 D1 migration 完了前提（重複明記）が満たされていない場合、E1（空 export false negative）が常時発生するため、本 Phase の異常系仕様は UT-22 完了後の運用フェーズに対して有効となる。

## 価値とコスト

- 価値: 運用障害の MTTD（Mean Time To Detect）を 5 分以内 / MTTR（Mean Time To Recover）を 60 分以内に抑える運用境界を確定。
- コスト: 異常系シナリオを 7 件に集約し、過剰な fallback 実装を回避（運用 SOP で対応する範囲を明示）。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | E1〜E7 の期待リカバリが Phase 5 ロールバック総括と整合 |
| 漏れなし | OK | 空 export / quota / cron 失敗 / rotation / 中断 / schema 不整合 / hash mismatch を被覆 |
| 整合性 | OK | UT-08 通知の閾値方針（一過性 / 継続障害）が E1 / E3 / E7 で一貫 |
| 依存関係整合 | OK | E2（quota）は UT-12 R2 / E3（cron 失敗）は UT-05-FU-003 に渡される |

## 既存命名規則の確認

- 異常系 ID: `E1〜E7`（FU-H と同じ E プレフィックス）
- 通知閾値: 「即時 / 5 分継続 / 24h 継続 / 対象外」の 4 区分

## 実行タスク

1. E1〜E7 を「観点 / トリガ条件 / 検出方法 / 通知 / 期待リカバリ / 復旧主体」の 6 列で表化（完了条件: 7 行 × 6 列が空セルなく埋まる）。
2. UT-08 通知対象列の閾値方針（即時 / 5 分継続 / 24h 継続 / 対象外）を各 E に付す（完了条件: 全 E に閾値記述）。
3. 復旧主体（developer / SRE / 自動回復 / 1Password owner）を各 E に明記（完了条件: 全 E に主体記述）。
4. 異常系サマリ表で HTTP 通知 payload `event` 名を一覧化（完了条件: 7 件記述）。
5. Phase 11 smoke 期待値テンプレ反映項目を抽出（完了条件: E1 / E3 / E7 を smoke 入力に）。
6. 多角的チェックで不変条件 #5 / 監視誤検知 / hash mismatch 強制を再確認（完了条件: 3 観点記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-04.md | T1〜T7（happy path + 観点別）|
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-05.md | Step 5 ラッパ failure handler |
| 必須 | CLAUDE.md §不変条件 #5 | apps/web からの D1 直接アクセス禁止 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | AC-1〜AC-9 / 苦戦箇所知見 |
| 参考 | https://developers.cloudflare.com/r2/platform/limits/ | R2 quota / object size 上限 |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers timeout / cron 制約 |

## スコープ

### 含む
- E1〜E7 の 7 シナリオ仕様化
- UT-08 通知閾値 / 復旧主体の確定
- Phase 11 smoke 期待値テンプレ反映項目の抽出

### 含まない
- 実コード本体の追加（Phase 13 後の別 PR）
- E2 quota 自動増枠申請ロジック（運用 SOP に閉じる）

## 異常系シナリオ一覧（E1〜E7）

### E1: 空 export（初回 migration 前 / WHERE 条件 0 件マッチ）

| 項目 | 内容 |
| --- | --- |
| ID | E1 |
| 観点 | false negative 抑制 / AC-6 |
| トリガ条件 | `bash scripts/cf.sh d1 export` 出力が schema-only または size 50 byte 未満。原因: (a) 初回 migration 前 / (b) WHERE 条件で 0 件マッチ |
| 検出方法 | Step 5 ラッパで `[ "$size" -lt 50 ]` 判定 |
| 通知 | (a) `ALLOW_EMPTY=1` のとき: warning log のみ、UT-08 通知**対象外**（false positive 抑止）/ (b) `ALLOW_EMPTY=0` のとき: 即時通知 `event=D1_BACKUP_EMPTY_UNEXPECTED` |
| 期待リカバリ | (a) UT-22 migration 完了後の翌日 cron で自動回復 / (b) WHERE 条件の見直し |
| 復旧主体 | developer（migration 適用） |

### E2: R2 quota 超過 / 容量警告閾値

| 項目 | 内容 |
| --- | --- |
| ID | E2 |
| 観点 | 容量設計 / lifecycle 効果検証 |
| トリガ条件 | R2 free tier 10 GB を超える、または Class A operation 月 100 万回超過。lifecycle policy が機能せず古い世代が残留する場合も含む |
| 検出方法 | Cloudflare R2 Analytics + cron run 内で `bucket size` を fetch し閾値比較 |
| 通知 | 容量 80% 到達で warning（`event=D1_BACKUP_QUOTA_WARN`）、100% 到達で即時通知（`event=D1_BACKUP_QUOTA_EXCEEDED`）|
| 期待リカバリ | (1) lifecycle policy の rule を確認・修正 → (2) 不要世代の手動削除 → (3) 必要なら有償プランへ移行 |
| 復旧主体 | SRE / 1Password owner |

### E3: cron 失敗（Workers timeout / Cloudflare API rate limit / GHA runner 起動失敗）

| 項目 | 内容 |
| --- | --- |
| ID | E3 |
| 観点 | 一過性障害 / 監視誤検知抑制 |
| トリガ条件 | (ルート A) Workers の CPU time / wall clock 超過、`fetch` rate limit 429 / (ルート B) GHA runner 起動失敗 / D1 export step 中の network error |
| 検出方法 | (ルート A) `wrangler tail` 等価で error log / (ルート B) `gh run list --status failure` |
| 通知 | 単発失敗は warning、24h 連続失敗で即時通知（`event=D1_BACKUP_CRON_FAILED`）|
| 期待リカバリ | (1) 翌日 cron で自動回復 / (2) 24h 失敗継続時は手動 trigger（`bash scripts/cf.sh d1 export ... --output ... && put`）でその日の世代を補完 |
| 復旧主体 | SRE / 自動回復が基本 |

### E4: 暗号化キーローテーション失敗

| 項目 | 内容 |
| --- | --- |
| ID | E4 |
| 観点 | secret rotation の運用整合 / AC-9 |
| トリガ条件 | Phase 5 Step 8 rotation 中に新 access key で R2 put が 403 を返す、または旧 key を revoke した結果 cron が認証失敗 |
| 検出方法 | rotation 翌日 cron が 403 で fail、UT-08 通知で発覚 |
| 通知 | 即時通知（`event=D1_BACKUP_AUTH_FAILED`）|
| 期待リカバリ | (1) 旧 access key を即時 re-enable（dashboard）→ (2) 新 access key の権限 / 1Password entry を再検証 → (3) 24h 安定運転後に rotation 再開 |
| 復旧主体 | SRE / 1Password owner |

### E5: export 中断（ネットワーク断 / D1 ロック競合）

| 項目 | 内容 |
| --- | --- |
| ID | E5 |
| 観点 | partial output の R2 put 防止 |
| トリガ条件 | `wrangler d1 export` 中に network が切れる、または D1 が他 migration を実行中で SQLITE_BUSY |
| 検出方法 | Step 5 ラッパで `cf.sh d1 export` の exit code を厳密にチェック。non-zero なら R2 put せず early exit |
| 通知 | warning（`event=D1_BACKUP_EXPORT_INTERRUPTED`）+ 翌日 cron で自動 retry |
| 期待リカバリ | (1) 翌日 cron で自動回復 / (2) 中断中の partial file は R2 に**putされない**（contract: put は exit 0 後のみ）|
| 復旧主体 | 自動回復 |

### E6: 復元時の schema 不整合（migration 適用前後の export 取り違え）

| 項目 | 内容 |
| --- | --- |
| ID | E6 |
| 観点 | 復元 drill 時の人為事故 |
| トリガ条件 | Phase 5 Step 5 で put された daily/monthly object を復元時に間違って選択。例えば migration v3 適用前の export を v5 適用済み D1 に restore |
| 検出方法 | restore 直後の `pragma user_version` または `SELECT ... FROM schema_migrations` の照合（runbook checklist に必須化）|
| 通知 | restore 担当者が runbook に従って手動検証。自動通知**対象外**（restore は手動オペ）|
| 期待リカバリ | (1) restore を rollback / (2) 正しい世代の export を再選択 / (3) drill SOP で世代選択チェックリストを徹底 |
| 復旧主体 | SRE（restore 担当者）|

### E7: SHA-256 hash mismatch（put 時 / 復元時）

| 項目 | 内容 |
| --- | --- |
| ID | E7 |
| 観点 | 整合性検証 / AC-2 補強 |
| トリガ条件 | (a) put 時: ラッパが計算した hash と R2 put 後の object hash が一致しない / (b) 復元時: `sha256sum -c export.sql.sha256` が fail |
| 検出方法 | (a) Step 5 ラッパが put 後 GET し再計算 / (b) restore runbook 必須 step |
| 通知 | (a) 即時通知（`event=D1_BACKUP_HASH_MISMATCH`）/ (b) restore 担当者が手動で abort |
| 期待リカバリ | (a) 当該 object を再 put → 再 hash 検証 → 失敗継続なら R2 障害として escalate / (b) 別世代の export を選択し再 restore |
| 復旧主体 | (a) SRE + 自動 retry / (b) SRE（restore 担当者）|

## 異常系 × 通知サマリ

| ID | event 名 | 通知タイミング | 復旧主体 | 自動回復 |
| --- | --- | --- | --- | --- |
| E1(a) | （通知なし）| - | developer | 翌日 cron |
| E1(b) | D1_BACKUP_EMPTY_UNEXPECTED | 即時 | developer | × |
| E2 | D1_BACKUP_QUOTA_WARN / EXCEEDED | 80% warn / 100% 即時 | SRE | × |
| E3 | D1_BACKUP_CRON_FAILED | 24h 継続 | SRE | 翌日 cron |
| E4 | D1_BACKUP_AUTH_FAILED | 即時 | SRE / owner | × |
| E5 | D1_BACKUP_EXPORT_INTERRUPTED | warning（単発）| 自動 | 翌日 cron |
| E6 | （通知なし / 手動運用）| - | SRE | × |
| E7(a) | D1_BACKUP_HASH_MISMATCH | 即時 | SRE | retry |
| E7(b) | （手動運用）| - | SRE | × |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | E1〜E7 を AC × E trace matrix の右軸として渡す |
| Phase 8 | E2 / E4 / E7 をセキュリティ章 S1〜S7 と接続（quota / 認証 / 整合性）|
| Phase 9 | E3 を SLO（cron 24h 連続失敗）監視へ |
| Phase 11 | smoke で E1（空 export 許容）/ E3（cron failure dry-run）/ E7（hash mismatch 強制）を期待値テンプレに |
| Phase 12 | E6 復元 drill SOP / E4 rotation SOP をドキュメント化 |

## 多角的チェック観点

- **不変条件 #5**: E1〜E7 のいずれにおいても `apps/web` 経由で D1 を叩く形が混入していないか。すべての検出 / 復旧経路は `scripts/cf.sh` 経由 + Worker / GHA に閉じる。
- **監視誤検知（UT-08 暴走）**: E1(a) / E5 が即時通知にならず、warning 止まりかつ翌日 cron で自然回復する閾値方針が明示されているか。
- **hash mismatch 強制**: E7 が put 時 + 復元時 両端で必ず計算される設計になっているか。
- **空 export 境界**: E1 が `ALLOW_EMPTY` フラグ経路で false positive 化しない設計か。
- **rotation 安全性**: E4 で旧 key を 24h 並走させる手順が Phase 5 Step 8 と整合しているか。
- **schema 不整合**: E6 で restore checklist 必須化が Phase 12 SOP に渡されているか。
- **`wrangler` 直接実行禁止**: 全 E の検出・復旧コマンドが `bash scripts/cf.sh ...` 経由か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | E1〜E7 の表化（6 列）| 6 | spec_created | 7 行 × 6 列 |
| 2 | UT-08 通知閾値方針 | 6 | spec_created | 即時 / 5 分 / 24h / 対象外 |
| 3 | 復旧主体の明記 | 6 | spec_created | developer / SRE / 自動 / owner |
| 4 | 異常系 × 通知サマリ | 6 | spec_created | event 名一覧 |
| 5 | Phase 11 smoke 反映項目抽出 | 6 | spec_created | E1 / E3 / E7 |
| 6 | 多角的チェック | 6 | spec_created | 不変条件 #5 / 誤検知 / hash mismatch |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-06.md | E1〜E7 の異常系シナリオ表 / 通知方針 / 復旧主体 |

> 本 Phase の成果物は本ファイル（phase-06.md）のみ。`outputs/phase-06/main.md` は本ワークフローでは作成せず、artifacts.json `phases[5].outputs` は空配列。

## 完了条件

- [ ] E1〜E7 が「観点 / トリガ条件 / 検出方法 / 通知 / 期待リカバリ / 復旧主体」の 6 列で空セルなく表化されている
- [ ] UT-08 通知対象列に「即時 / 5 分継続 / 24h 継続 / 対象外」のいずれかが各 E に記述されている
- [ ] E1 が `ALLOW_EMPTY=1` 経路で false positive を起こさない設計と明記されている
- [ ] E7 が put 時 + 復元時 両端で hash 計算される設計と明記されている
- [ ] 異常系 × 通知サマリ表が 7 件で event 名を含む
- [ ] 多角的チェックで不変条件 #5 / 監視誤検知 / hash mismatch 強制 の 3 観点が記述されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- E1〜E7 の 7 シナリオが本ファイルに表化済み
- 不変条件 #5 / 監視誤検知 / hash mismatch が多角的チェックに記述
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7 (受入条件マトリクス)
- 引き継ぎ事項:
  - E1〜E7 を AC × T/E trace matrix の右軸として使用
  - E1 / E3 / E7 を Phase 11 smoke 期待値テンプレ更新の入力に
  - E2 / E4 / E7 を Phase 8 セキュリティ章 S1〜S7 へ
  - UT-08 通知閾値（即時 / 24h 継続）を Phase 12 SOP 化候補に登録
- ブロック条件:
  - E1〜E7 のいずれかで通知閾値・復旧主体が欠落
  - E1 が `ALLOW_EMPTY` 経路を備えていない
  - 不変条件 #5 違反（apps/web 経由の D1 access が異常系仕様に混入）
  - `wrangler` 直接実行が混入
