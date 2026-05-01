# Phase 10: ロールアウト・ロールバック・机上演習

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 10 / 13 |
| Phase 名称 | ロールアウト・ロールバック・机上演習 |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (パフォーマンス・コスト・無料枠運用) |
| 次 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 状態 | spec_created |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118 (CLOSED) |

## 目的

Phase 1〜9 で確定した設計（GHA schedule を D1 export 主経路、Cloudflare cron triggers を R2 latest healthcheck / UT-08 alert 補助経路 / R2 第一保管 / daily 30 日 + monthly 12 ヶ月世代管理 / SSE / KMS / ACL / 復元 SLO < 15 分 / gzip 圧縮 / 空 export 許容 / `bash scripts/cf.sh d1 export` 経由徹底）を、本番環境へ安全に展開・撤退させるためのロールアウト 5 段階（R1〜R5）、ロールバック手順、月次机上演習計画を仕様レベルで固定する。実コード適用 / 実 cron 有効化 / 実演習は Phase 13 ユーザー承認後の別 PR / 別オペレーションに委ねる。

## 真の論点 (true issue)

- 「日次バックアップを動かす」ではなく、**「3 日連続失敗 / R2 容量警告 / 暗号化未適用 のいずれかを検知したら世代管理を破綻させずに前世代スナップショットへ後退できる運用境界の確立」と「月次机上演習で復元 SLO < 15 分が drift していないことを継続的に裏取りする運用 SOP の固定」** が本 Phase の本質。
- 副次論点:
  1. CLAUDE.md §Cloudflare 系 CLI 実行ルール（`scripts/cf.sh` 徹底 / `wrangler` 直接禁止）の徹底（AC-7）
  2. 段階的 rollout で dev（手動 export）→ staging（cron 1 週間試運転）→ production の安全な昇格境界
  3. 既存 UT-06 Phase 6 `rollback-rehearsal-result.md` の拡張ポイントと本 Phase の机上演習の関係
  4. UT-08 通知基盤との連携（cron 失敗 alert / 容量警告 alert）

## ロールアウト計画（R1〜R5）

> **大前提**: 全 Cloudflare CLI 操作は `bash scripts/cf.sh` ラッパー経由で実行する（CLAUDE.md §Cloudflare 系 CLI 実行ルール / AC-7）。`wrangler` 直接実行は禁止。

### R1: dev 手動 export 検証

| 項目 | 内容 |
| --- | --- |
| 目的 | `bash scripts/cf.sh d1 export ubm-hyogo-db-dev --env dev --output backup.sql` が成功し、R2 PUT + 暗号化 metadata 適用までが手動で通ることを確認 |
| 前提 | dev D1 / R2 bucket / 暗号化設定（SSE）が存在 / `HEALTH_DB_TOKEN` 不要（本タスクでは認証 endpoint なし）|
| 実行（仕様レベル） | `bash scripts/cf.sh d1 export ubm-hyogo-db-dev --env dev --output /tmp/dev.sql` → `gzip /tmp/dev.sql` → `bash scripts/cf.sh r2 object put <bucket>/dev/<date>.sql.gz --file /tmp/dev.sql.gz` |
| 検証 | Phase 11 §S-03（dev export → R2 PUT 成功 + ListObjects 確認 + 暗号化 metadata） |
| GO 条件 | S-03 GREEN / 空 export warning が UT-08 test channel に届く |

### R2: staging で cron 1 週間試運転

| 項目 | 内容 |
| --- | --- |
| 目的 | Cloudflare cron triggers (`crons = ["0 18 * * *"]`) を staging で有効化し、7 日連続成功を確認 |
| 前提 | R1 GO / staging R2 bucket / staging D1 migration 適用済 / UT-08 通知基盤 staging 連携済 |
| 実行 | `gh workflow run d1-backup.yml --ref dev` + `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（healthcheck cron triggers 込み） |
| 検証 | 7 日連続で R2 ListObjects が日次 1 件ずつ増加 / Phase 11 §S-07（staging cron smoke） |
| GO 条件 | 7 日 GREEN / 復元 drill smoke（S-11）も同期間に最低 1 回 PASS / UT-08 false alert なし |

### R3: production rollout

| 項目 | 内容 |
| --- | --- |
| 目的 | 本番 cron triggers 有効化 |
| 前提 | R2 GO / production R2 bucket / 暗号化（SSE / KMS）/ ACL 設定済 / UT-08 production 連携 |
| 実行 | `gh workflow run d1-backup.yml --ref main` + `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` |
| 検証 | 翌日の cron 実行で R2 production prefix に export が 1 件追加 / Phase 11 §S-15（production cron smoke） |
| GO 条件 | S-15 GREEN / 暗号化 metadata 適用確認 / UT-08 production false alert なし |

### R4: 月次スナップショット世代管理の組込み

| 項目 | 内容 |
| --- | --- |
| 目的 | 月初 1 日の cron で「30 日ローリング」とは別に「月次保管 prefix」へ複製 |
| 実装方針 | cron handler 内で `new Date().getDate() === 1` の場合に `monthly/<YYYY-MM>.sql.gz` へ追加 PUT |
| 検証 | 翌月初に monthly/ prefix に 1 件追加 / 30 日 prefix からの cleanup（31 日前のオブジェクト削除）が機能 |
| GO 条件 | 累積容量が C2 試算（≤ 50 MB）と drift しない |

### R5: ロールバック条件と再開条件

| ロールバック trigger | 対応 |
| --- | --- |
| **3 日連続 cron 失敗** | (1) UT-08 alert で検知 → (2) cron 一時停止（`wrangler.toml` の `crons = []` で deploy）→ (3) 直前世代の export を「最新」として明示 marker file 配置 → (4) 失敗原因切分（D1 接続 / R2 PUT / 暗号化）→ (5) 修正後 R1 から再 rollout |
| **R2 容量警告（8 GB 超 = 無料枠 80%）** | (1) 月次 prefix の最古 12 ヶ月超を削除 → (2) 30 日 prefix の cleanup ロジック検証 → (3) C1 サイズ試算の drift 確認（圧縮率悪化 / D1 行数急増） |
| **暗号化未適用検出** | (1) cron 即時停止 → (2) 暗号化未適用 export を private prefix に隔離 → (3) `bash scripts/cf.sh r2 object put` の `--metadata` 設定見直し → (4) 修正後 R1 から再 rollout |

| 再開条件 | 確認方法 |
| --- | --- |
| R1 dev 手動 export が再 GREEN | Phase 11 §S-03 |
| R2 staging cron が 3 日連続成功 | R2 ListObjects |
| 暗号化 metadata が全 export に適用 | `bash scripts/cf.sh r2 object get --metadata-only` |
| UT-08 false alert なし | UT-08 dashboard 24h observation |
| 復元 drill smoke（S-11）が直近 1 ヶ月以内に PASS | Phase 11 §S-11 |
| 月次机上演習の最新結果が < 15 分 SLO 充足 | `outputs/phase-10/restore-rehearsal-result.md` |

→ 上記 6 条件すべて GREEN で「再開可能」。1 件でも未充足なら NO-GO。

## 月次机上演習計画

> 仕様レベル定義のみ。実演習は本ワークフロー範囲外（別オペレーション）。本 Phase は「演習が満たすべき手順 / 合格基準 / 記録形式」を固定する。

| 項目 | 仕様 |
| --- | --- |
| 頻度 | 月次 1 回（毎月第 1 営業日） |
| 演習結果保管先 | `outputs/phase-10/restore-rehearsal-result.md`（spec_created で雛形のみ。実演習で append-only に追記） |
| 合格基準 | 復元 SLO < 15 分（Phase 9 C6） / 復元後の D1 行数が export 直前の本番行数と一致 / 主要テーブル smoke 全件 PASS |
| 失敗時の扱い | 即時 R5 ロールバック条件「3 日連続 cron 失敗」と同等扱い + 演習失敗を UT-08 critical alert |
| 既存 UT-06 Phase 6 との関係 | UT-06 Phase 6 `rollback-rehearsal-result.md` は「migration rollback 演習」、本 Phase 10 月次演習は「D1 全データ復元演習」。**目的・手順が異なるため別ファイルで管理**（拡張ではなく並列） |

## 復元 runbook 章立て（Phase 9 C6 と 1:1）

```
§1 前提確認（R2 アクセス権 / D1 access / migration 状態）       — 5 分
§2 R2 から最新 export 取得（cf.sh r2 object get + gunzip）      — 1 分
§3 schema 適用（必要時のみ）                                      — 2 分
§4 SQL import（cf.sh d1 execute --file）                          — 5 分
§5 smoke（行数 / 主要テーブル SELECT）                            — 2 分
   合計 < 15 分 SLO
```

## ロールバック共通手順

```bash
# 0. 直前世代の確認
bash scripts/cf.sh r2 object list <bucket>/daily/ --env <env>

# 1. cron 一時停止（wrangler.toml の crons を空配列で deploy）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>

# 2. 直前世代を「最新」とマーク（marker file PUT）
bash scripts/cf.sh r2 object put <bucket>/latest-pointer.txt --file /tmp/pointer.txt

# 3. 復元演習で SLO < 15 分を再確認
```

> `wrangler` 直接実行は禁止。すべて `bash scripts/cf.sh ...` 経由（AC-7）。

## 失敗時のフォールバック（前世代スナップショットへ後退）

| 障害 | フォールバック先 |
| --- | --- |
| 当日 export 破損 | 前日 export（30 日 prefix の N-1） |
| 当週 export すべて破損 | 月次 prefix の前月分 |
| 月次 prefix 破損 | 前々月の月次 prefix（12 ヶ月分の冗長性で担保） |

## 依存

| 種別 | 対象 | 受け取る前提 |
| --- | --- | --- |
| 上流 | Phase 8 セキュリティ | SSE / KMS / ACL 設定 / 機密性レベル別暗号化（AC-9） |
| 上流 | Phase 9 SLO | C4 cron 基盤 / C6 復元 SLO / C7 gzip 圧縮 |
| 上流（必須） | UT-12 R2 storage / UT-08 monitoring | 保管先 / 通知基盤 |
| 関連 | UT-06 Phase 6 rollback-rehearsal | 並列管理（拡張ではない） |
| 下流 | Phase 11 smoke | R1 / R2 / R3 GO 判定根拠 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | AC-1〜AC-9 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-09.md | C4 / C6 / C7 |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 徹底（AC-7） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md | 並列管理対象（拡張ではない） |
| 必須 | scripts/cf.sh | rollout / rollback の唯一の実行経路 |
| 参考 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/phase-10.md | フォーマットリファレンス |

## 実行タスク

1. R1〜R5 の rollout 手順を固定する（完了条件: dev / staging / production / 月次組込み / rollback がある）。
2. 月次机上演習の仕様（頻度 / 合格基準 / 記録形式）を固定する（完了条件: 既存 UT-06 Phase 6 との並列管理が明示）。
3. 復元 runbook 章立てを Phase 9 C6 と 1:1 対応させる（完了条件: §1〜§5 が < 15 分 SLO に内訳合計する）。
4. ロールバック共通手順を `scripts/cf.sh` 経由で固定する（完了条件: `wrangler` 直接実行が一切現れない）。
5. R5 再開条件 6 件を定義する（完了条件: 全 GREEN で再開可、1 件でも NO-GO）。
6. 失敗時フォールバック（前世代後退）を定義する（完了条件: 当日 / 当週 / 月次の 3 階層）。
7. UT-08 通知連携を rollout 各段階で明示する（完了条件: cron 失敗 / 容量警告 / 暗号化未適用 alert）。

## 実行手順

### ステップ 1: R1〜R5 の手順確定
- 5 段階それぞれを「目的 / 前提 / 実行 / 検証 / GO 条件」の 5 軸で記述。

### ステップ 2: 月次机上演習計画の確定
- 頻度 / 保管先 / 合格基準 / UT-06 Phase 6 並列管理の関係を表化。

### ステップ 3: ロールバック共通手順固定
- `bash scripts/cf.sh ...` 経由のみ。`wrangler` 直接実行ゼロ。

### ステップ 4: 失敗時フォールバック表作成
- 当日 / 当週 / 月次の 3 階層後退経路。

### ステップ 5: artifacts.json への登録予約
- Phase 10 状態を `spec_created`。実 rollout / 実演習は Phase 13 承認後の別オペレーション。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | R1 / R2 / R3 の GO 判定根拠として S-03 / S-07 / S-11 / S-15 を引き渡す |
| Phase 12 | apply-runbook / rollback-runbook / 月次机上演習雛形を ledger 化 |
| Phase 13 | ユーザー承認ゲート前チェックリストに R1〜R5 / 月次演習計画を反映 |
| UT-08 | cron 失敗 / 容量警告 / 暗号化未適用 / 演習失敗の 4 alert 連携 |

## 多角的チェック観点

- **AC-7（wrangler 直接禁止）**: 本 Phase の全コマンド例が `bash scripts/cf.sh ...` 経由か。
- **AC-8（GHA 無料枠）**: Cloudflare cron triggers 採用前提が R2 で明示され、GHA 採用時は UT-05-FU-003 監視対象になる旨が R5 切替条件で参照されているか。
- **AC-9（機密性別暗号化）**: R3 / R5 で暗号化 metadata 適用確認が必須 gate になっているか。
- **既存 UT-06 Phase 6 との衝突回避**: 月次机上演習が「拡張」ではなく「並列」として扱われ、ファイル名が drift しないか。
- **世代管理破綻リスク**: R5 ロールバック中に 30 日 prefix の cleanup が暴走して直近 export を消さないか。前世代後退表で 3 階層冗長性が担保されているか。
- **R2 容量警告閾値**: 8 GB（無料枠 80%）で警告 → 月次 prefix の 12 ヶ月超削除 → C2 試算（≤ 50 MB）への自動回帰が論理的に成立するか。
- **復元 SLO drift**: 月次演習で < 15 分が連続 drift した場合の差し戻し経路（Phase 9 C6 再評価）が記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | R1 (dev 手動 export) 仕様確定 | 10 | spec_created | `bash scripts/cf.sh d1 export` |
| 2 | R2 (staging cron 1 週間試運転) 仕様確定 | 10 | spec_created | 7 日連続 GREEN |
| 3 | R3 (production rollout) 仕様確定 | 10 | spec_created | 暗号化 metadata gate |
| 4 | R4 (月次スナップショット組込み) 仕様確定 | 10 | spec_created | `getDate() === 1` 分岐 |
| 5 | R5 (ロールバック条件 + 再開条件 6 件) 確定 | 10 | spec_created | 3 連続失敗 / 容量警告 / 暗号化未適用 |
| 6 | 月次机上演習計画 | 10 | spec_created | UT-06 Phase 6 と並列管理 |
| 7 | 失敗時フォールバック（3 階層後退）| 10 | spec_created | 当日 / 当週 / 月次 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-10.md | 本ファイル |
| メタ | artifacts.json | Phase 10 状態の更新（spec_created） |

> 本 Phase では `phase-10.md` と docs validator 用の `outputs/phase-10/main.md` / `restore-rehearsal-result.md` テンプレート実体を作成済み。実測値を含む restore rehearsal record は Phase 13 ユーザー承認後の実走時に追記する。

## 完了条件

- [ ] R1 / R2 / R3 / R4 / R5 の 5 段階すべて手順 / 検証 / GO 条件が記述
- [ ] 月次机上演習の仕様（頻度 / 合格基準 / UT-06 Phase 6 との並列関係）が記述
- [ ] 復元 runbook 章立てが Phase 9 C6 と 1:1 対応（< 15 分 SLO 内訳合計）
- [ ] ロールバック共通手順が `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行ゼロ）
- [ ] R5 再開条件 6 件が記述
- [ ] 失敗時フォールバック 3 階層（当日 / 当週 / 月次）が記述
- [ ] AC-7 / AC-8 / AC-9 が多角的チェックに含まれる

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- `wrangler` 直接実行が文中に存在しない
- AC-7 / AC-8 / AC-9 が記述されている
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke / NON_VISUAL walkthrough)
- 引き継ぎ事項:
  - R1 GO 条件 = S-03 GREEN
  - R2 GO 条件 = 7 日連続 GREEN（S-07）
  - R3 GO 条件 = S-15 GREEN + 暗号化 metadata gate
  - 月次机上演習合格基準 = 復元 SLO < 15 分
  - `scripts/cf.sh` 経由徹底ルール
- ブロック条件:
  - `wrangler` 直接実行が記述に残っている
  - 既存 UT-06 Phase 6 ファイルを「拡張」として上書き指示している
  - R5 再開条件が 6 件未満
  - 暗号化 metadata gate が R3 / R5 に欠落
