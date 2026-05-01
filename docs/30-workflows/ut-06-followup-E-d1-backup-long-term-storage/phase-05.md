# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（cron 採用ルート 2 系統 / R2 構築 / lifecycle / SSE / ラッパ / UT-08 統合 / 1Password 補助 / rotation） |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系・エラーハンドリング) |
| 状態 | spec_created |
| 推奨Wave | Wave 2 |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118（CLOSED） |
| artifact 注記 | Phase 4-13 は spec_created 骨格として作成、実コード（GHA workflow / Cloudflare cron triggers / R2 lifecycle / ラッパスクリプト）は Phase 13 ユーザー承認後の別 PR で行う |

## 目的

Phase 4 で固定した T1〜T7 を Green にするための **実装手順を仕様レベルで手順書化** する。本ランブックは (a) Cloudflare cron triggers 採用ルート、(b) GitHub Actions 採用ルートの 2 系統に分岐し、いずれを採用しても AC-1〜AC-9 を満たすよう手順を二重化する。本 Phase の成果物は実装担当者（人間 / Claude Code / 別 PR 担当者）が **別 PR で逐次実行するためのランブック**であり、本ワークフローは仕様化までで完了（spec_created）。実コード適用・コミット作成・デプロイは本 PR では一切行わない。

> **重要**: 本 Phase は手順書（runbook）の正本化であり、`.github/workflows/d1-backup.yml` や `apps/api/wrangler.toml` への実編集は行わない。Step 1〜8 は **Phase 13 ユーザー承認後の別 PR** で実走される位置づけ。

## 真の論点

- 「cron をどう書くか」ではなく、**「2 採用ルートで同一の AC を満たし、いつでも切替可能に保つランブック構造」**。
- 副次論点: (1) `bash scripts/cf.sh d1 export` ラッパの仕様レベル設計（コード本体は書かない）、(2) lifecycle policy（30 日以降 monthly archive へ移動・60 日経過月次以外を削除）の表現、(3) `HEALTH_DB_TOKEN` 等の secret rotation を `scripts/cf.sh secret put` 経由で行う SOP。

## 依存境界

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06 本番デプロイ完了 | 本番 D1 が存在する前提 |
| 上流 | UT-12 R2 storage 整備 | R2 bucket / lifecycle policy の前提 |
| 上流 | UT-08 通知基盤 | 失敗時 webhook の前提 |
| 仕様 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `wrangler` 直接禁止 |

## 価値とコスト

- 価値: いずれの採用ルートでも 30 分以内に initial setup が完了し、その後は無人運用に移行できる手順書を残すこと。
- コスト: cron triggers 採用時は Workers の cron 無料枠 5 schedule/account を 1 件消費。GHA 採用時は private repo で月 2,000 分のうち 1 日 2 分 × 30 = 60 分/月程度を消費。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | 2 採用ルートで AC-1〜AC-9 が同一に満たされる |
| 漏れなし | OK | Step 1〜8 が R2 構築 / cron / lifecycle / SSE / ラッパ / 通知 / 1Password / rotation を被覆 |
| 整合性 | OK | CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール と完全整合 |
| 依存関係整合 | OK | UT-12 / UT-08 が上流で前提化 |

## 既存命名規則の確認

- bucket 名: `ubm-hyogo-d1-backup`（推奨）
- prefix: `daily/<YYYY-MM-DD>/<env>.sql` / `monthly/<YYYY-MM>/<env>.sql`
- secret: `D1_BACKUP_R2_ACCESS_KEY` / `UT08_NOTIFY_WEBHOOK_URL`（1Password vault `UBM-Hyogo/cloudflare-d1-backup`）
- workflow file: `.github/workflows/d1-backup.yml` (GHA export 主経路) / `apps/api/wrangler.toml` (Cloudflare cron healthcheck)

## 実装委譲先

| 役割 | 担当 |
| --- | --- |
| 本 Phase（仕様化） | 本ワークフロー — Phase 5 ランブック整備のみ |
| **実コード実装** | **Phase 13 ユーザー承認後の別 PR 担当者** が Step 1〜8 を順次実走 |
| デプロイ（staging / production） | 別 PR 担当者（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>`） |

## 実行タスク

1. 採用ルート分岐（A: Cloudflare cron triggers / B: GitHub Actions）を §採用ルート分岐 で固定（完了条件: 2 ルートの選定基準と切替条件記述）。
2. Step 1〜8 を「目的 / 編集対象 / 検証コマンド / ロールバック / 想定所要時間」の 5 列で表化（完了条件: 8 ステップ × 5 列が空セルなく埋まる）。
3. R2 lifecycle policy（30 日後 monthly archive へ移動・60 日経過月次以外を削除）を Step 3 で固定（完了条件: rule が表化）。
4. `bash scripts/cf.sh d1 export` ラッパ仕様（hash 計算 / 空 export 判定 / R2 put / 通知）を Step 5 で記述（完了条件: 仕様レベル擬似コード）。
5. UT-08 統合 / 1Password 補助 / rotation を Step 6 / 7 / 8 で記述（完了条件: 各 step に 1Password vault path 明記）。
6. 実コード適用は Phase 13 後の別 PR と 3 箇所以上で明記（完了条件: §目的 / §実装委譲先 / §成果物 / §タスク100%実行確認）。
7. `wrangler` 直接実行禁止と `scripts/cf.sh` 経由徹底を多角的チェックに含める（完了条件: §多角的チェック観点）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-02.md | アーキ案（GHA / cron triggers）|
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-03.md | base case 採用根拠 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-04.md | T1〜T7（Green 条件） |
| 必須 | scripts/cf.sh | Cloudflare 系 CLI ラッパ正本 |
| 必須 | CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール | 1Password / op 参照 / wrangler 直接禁止 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | cron triggers 仕様 |
| 参考 | https://developers.cloudflare.com/r2/buckets/object-lifecycles/ | R2 lifecycle |
| 参考 | https://developers.cloudflare.com/r2/api/s3/api/ | R2 S3 互換 API |

## スコープ

### 含む
- 2 採用ルート（cron triggers / GHA）の Step 1〜8 ランブック
- R2 bucket / lifecycle / SSE / signed URL の仕様レベル手順
- ラッパスクリプト仕様 / UT-08 統合 / 1Password 補助 / rotation SOP

### 含まない
- 実コード本体（YAML / TS / shell）の作成
- 本番 R2 bucket の実作成（Phase 13 後の別 PR）
- 月次世代 60 日経過後の物理削除実走

## 採用ルート分岐

| 観点 | ルート A: Cloudflare cron triggers | ルート B: GitHub Actions |
| --- | --- | --- |
| トリガ | Workers `crons = ["0 18 * * *"]` (UTC、JST 03:00) | `schedule: cron: '0 18 * * *'` |
| ランタイム | Cloudflare Workers（`bash scripts/cf.sh` 経由不可、Worker 内で D1 export を S3 互換 API で R2 put）| ubuntu-latest + `bash scripts/cf.sh d1 export` |
| 無料枠 | Workers cron 5/account の 1 件消費 | private 月 2,000 分のうち約 60 分/月消費 |
| 監視 | Workers Logs / Analytics + UT-08 webhook | UT-05-FU-003 監視対象（GHA workflow run 失敗を検知） |
| 採用優先度 | **第一候補**（無料枠圧迫が小、不変条件 #5 違反リスクなし）| 補助候補 |
| 切替条件 | cron triggers が 2 件以上必要になり 5 件枠を圧迫する場合 | 切替先（一時的に B 経由で運用しつつ A へ戻す）|

> 本ランブックは **ルート A を base case** とし、ルート B は §補助手順 として併記する。Phase 3 で確定した base case を継承。

## 実行手順

### Step 1: R2 bucket の作成

| 項目 | 内容 |
| --- | --- |
| 目的 | `ubm-hyogo-d1-backup` bucket を private + SSE 有効で作成（AC-2 / AC-3） |
| 編集対象 | bucket 作成は CLI 1 発（リポジトリ編集なし）。Cloudflare R2 dashboard 補助 |
| 検証コマンド | `bash scripts/cf.sh r2 bucket create ubm-hyogo-d1-backup`（具体引数は別 PR 時に確定） / `bash scripts/cf.sh r2 bucket info ubm-hyogo-d1-backup` で private 確認 |
| ロールバック | `bash scripts/cf.sh r2 bucket delete ubm-hyogo-d1-backup`（中身が空のときのみ）|
| 想定所要時間 | 10 分 |

### Step 2: bucket access key 発行 + 1Password 保管

| 項目 | 内容 |
| --- | --- |
| 目的 | ルート B（GHA）で R2 put に必要な S3 互換 access key を発行し、1Password に保管（AC-3 / AC-9） |
| 編集対象 | Cloudflare dashboard で R2 access key 作成 → 値を 1Password `op://UBM-Hyogo/cloudflare-d1-backup/R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` へ保管 |
| 検証コマンド | `op read op://UBM-Hyogo/cloudflare-d1-backup/R2_ACCESS_KEY_ID` で reference が解決 |
| ロールバック | dashboard で access key を revoke + 1Password entry 削除 |
| 想定所要時間 | 10 分 |

> ルート A（cron triggers）採用時は Worker 内 binding で R2 にアクセスするため access key 不要。Step 2 はルート B のみ実走。

### Step 3: lifecycle policy 設定（30 日 → monthly archive 移動・60 日経過月次以外削除）

| 項目 | 内容 |
| --- | --- |
| 目的 | 直近 30 日 + 月次世代の自動世代管理（AC-2） |
| 編集対象 | R2 bucket lifecycle JSON / TOML（仕様: rule 1 = `daily/` 30 日後 `monthly/` prefix へ move + delete original / rule 2 = `monthly/` 60 日経過 object のうち月初日でないものを delete） |
| 検証コマンド | `bash scripts/cf.sh r2 bucket lifecycle get ubm-hyogo-d1-backup` で 2 rule が反映されている |
| ロールバック | `bash scripts/cf.sh r2 bucket lifecycle clear ubm-hyogo-d1-backup` |
| 想定所要時間 | 20 分（rule の expression 検証含む） |

### Step 4: cron schedule 設定

| 項目 | 内容（ルート A: Cloudflare cron healthcheck） |
| --- | --- |
| 目的 | 日次 18:00 UTC（JST 03:00）に Worker を起動し、R2 latest object の存在を確認する（AC-1） |
| 編集対象 | `apps/api/wrangler.toml` に R2 latest healthcheck 用 cron trigger を追加（export 主経路は `.github/workflows/d1-backup.yml`） |
| 検証コマンド | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` 後、dashboard `Cron Triggers` で next run 確認 |
| ロールバック | `crons` 配列を空にして再 deploy |
| 想定所要時間 | 15 分 |

| 項目 | 内容（ルート B: GHA schedule 主経路） |
| --- | --- |
| 目的 | `bash scripts/cf.sh d1 export` を実行し、R2 upload と UT-08 alert を担う主経路（AC-1） |
| 編集対象 | `.github/workflows/d1-backup.yml` `on.schedule.cron: '0 18 * * *'` |
| 検証コマンド | `gh workflow view d1-backup.yml` で schedule 確認、`gh workflow run d1-backup.yml` で手動 trigger 検証 |
| ロールバック | workflow file を削除 / disable |
| 想定所要時間 | 15 分 |

### Step 5: `bash scripts/cf.sh d1 export` ラッパスクリプト仕様（コード本体は別 PR）

| 項目 | 内容 |
| --- | --- |
| 目的 | export 取得 → 空判定 → SHA-256 計算 → R2 put → 失敗時通知の一連を 1 コマンドで実行（AC-1 / AC-6 / AC-7） |
| 編集対象（仕様のみ） | `scripts/d1-backup.sh`（仮）。手順: (1) `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output /tmp/export.sql` / (2) `[ -s /tmp/export.sql ] || warn_empty` / (3) `sha256sum /tmp/export.sql > /tmp/export.sql.sha256` / (4) R2 へ `daily/<date>/production.sql` + `.sha256` を put / (5) 失敗時 `curl -X POST $UT08_NOTIFY_WEBHOOK_URL -d '{"event":"D1_BACKUP_FAILED",...}'` |
| 検証コマンド | dry-run: `D1_BACKUP_DRY_RUN=1 bash scripts/d1-backup.sh` で R2 put をスキップしつつ手順実行 |
| ロールバック | スクリプト削除のみ。bucket / cron は別 step でロールバック |
| 想定所要時間 | 30 分 |
| 擬似コード | `cf.sh d1 export ... -o /tmp/export.sql; size=$(stat -f%z /tmp/export.sql); if [ "$size" -lt 50 ]; then if [ "$ALLOW_EMPTY" = "1" ]; then echo "warn: empty export accepted"; else fail; fi; fi; sha256sum /tmp/export.sql > /tmp/export.sql.sha256; cf.sh r2 object put ubm-hyogo-d1-backup/daily/$(date -u +%F)/production.sql --file /tmp/export.sql; cf.sh r2 object put ubm-hyogo-d1-backup/daily/$(date -u +%F)/production.sql.sha256 --file /tmp/export.sql.sha256` |

### Step 6: UT-08 通知統合

| 項目 | 内容 |
| --- | --- |
| 目的 | export 失敗 / 空 export 異常 / hash mismatch を UT-08 webhook に通知（AC-5） |
| 編集対象 | Step 5 ラッパの failure handler（ルート A は Worker 内で `fetch(UT08_NOTIFY_WEBHOOK_URL, ...)`、ルート B は `if: failure()` step で `curl`） |
| 検証コマンド | T4 dry-run（`D1_BACKUP_FORCE_FAIL=1` でラッパが意図的に fail し、test channel で着信確認） |
| ロールバック | failure handler を削除 |
| 想定所要時間 | 20 分 |

### Step 7: 1Password Environments への補助保管手順

| 項目 | 内容 |
| --- | --- |
| 目的 | R2 とは別経路で月次 export を 1Password Document に補助保管（AC-2 補強・冗長化） |
| 編集対象（手順のみ） | 月初日の R2 monthly object を `op document create --vault UBM-Hyogo --title "d1-monthly-<YYYY-MM>" /tmp/monthly.sql` で 1Password に push する月次運用 SOP |
| 検証コマンド | `op document list --vault UBM-Hyogo | grep d1-monthly-` で 1 件以上 |
| ロールバック | 1Password 側で document 削除 |
| 想定所要時間 | 月 5 分（運用） |

### Step 8: Secret rotation 手順

| 項目 | 内容 |
| --- | --- |
| 目的 | R2 access key / UT-08 webhook URL の定期 rotation（AC-9） |
| 編集対象（手順のみ） | (1) Cloudflare dashboard で旧 access key を keep + 新 access key 発行 → (2) 1Password の `R2_ACCESS_KEY_ID` 更新 → (3) `bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --config apps/api/wrangler.toml --env production` で再注入 → (4) 24h 経過 + 成功 run 確認後、旧 key revoke |
| 検証コマンド | rotation 直後の cron run が success（T1）|
| ロールバック | 旧 key を revoke せず再 export 再投入 |
| 想定所要時間 | 30 分 |

## ロールバック総括

| シナリオ | 手順 |
| --- | --- |
| cron / workflow のみ撤去（bucket と過去世代は残す） | Step 4 の crons 空化 / workflow disable |
| ラッパのみ撤去 | Step 5 の `scripts/d1-backup.sh` 削除 |
| 全撤去 | Step 4 → 5 → 6 → 3 → 1 の順で逆実行（bucket 削除は最後）|
| Secret 漏洩時 | Step 8 を緊急実行（24h 経過待たずに旧 key 即時 revoke） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | T1〜T7 を Step 1〜8 の Green 条件として参照 |
| Phase 6 | Step 5 ラッパの異常系（空 export / hash mismatch / quota 超過 / 通知失敗）を E1〜E7 に展開 |
| Phase 8 | Step 1〜3 の SSE / private bucket / signed URL を脅威モデル S1〜S7 に再利用 |
| Phase 11 | Step 4 / 5 のスケジュール実走を staging smoke で確認 |
| Phase 12 | Step 7 / 8 の 1Password 補助 / rotation を SOP として記述 |
| Phase 13 | 本ランブックを別 PR 担当者へ受け渡し、ユーザー承認後に実走 |

## 多角的チェック観点

- **不変条件 #5**: ルート A / B いずれの実装も `apps/web` に変更を加えないか。Cloudflare cron healthcheck は `apps/api` Worker に閉じる。
- **`wrangler` 直接実行禁止**: 全 step で `bash scripts/cf.sh ...` 経由のみ。`wrangler` 直接呼び出しがないか。
- **空 export 許容**: Step 5 ラッパ仕様で `ALLOW_EMPTY=1` 経路が初回 migration 前ケース用に存在するか。
- **hash 整合**: Step 5 で `sha256sum` を put 時に必ず生成する設計か。
- **無料枠**: ルート A 採用時 cron 5 件枠を圧迫しないか、ルート B 採用時 60 分/月程度に抑えられているか。
- **secret hygiene**: Step 2 / 7 / 8 すべてで実値が仕様書・コミット・ログに残らない（op 参照のみ）か。
- **lifecycle 設計**: Step 3 で「30 日後 monthly 移動 + 60 日経過月次以外削除」の 2 rule が記述されているか。
- **docs-only 境界**: 実コード適用が本 Phase でゼロ件か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 採用ルート分岐表 | 5 | spec_created | A / B 比較 |
| 2 | Step 1〜8 の表化 | 5 | spec_created | 8 ステップ × 5 列 |
| 3 | R2 lifecycle 2 rule 設計 | 5 | spec_created | Step 3 |
| 4 | ラッパスクリプト仕様 | 5 | spec_created | Step 5（コード本体は別 PR）|
| 5 | UT-08 統合 / 1Password / rotation | 5 | spec_created | Step 6 / 7 / 8 |
| 6 | docs-only / spec_created 明示 | 5 | spec_created | 3 箇所以上 |
| 7 | 不変条件 #5 / wrangler 禁止 多角的チェック | 5 | spec_created | §多角的チェック |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書（手順書） | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-05.md | 本ファイル（Phase 5 実装ランブック仕様）|
| 別 PR 成果（参考 / 本ワークフローでは生成しない） | `.github/workflows/d1-backup.yml` / `apps/api/wrangler.toml` healthcheck cron / `scripts/d1-backup.sh` / lifecycle policy json | **Phase 13 ユーザー承認後の別 PR** で生成 |

> **outputs なし**: Phase 4-13 は spec_created 骨格として `phase-NN.md` のみ作成。

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 採用ルート分岐（A: cron triggers / B: GHA）が表化され、base case = ルート A と明示されている
- [ ] Step 1〜8 が「目的 / 編集対象 / 検証コマンド / ロールバック / 想定所要時間」の 5 列で空セルなく表化されている
- [ ] R2 lifecycle が「30 日後 monthly 移動 + 60 日経過月次以外削除」の 2 rule で Step 3 に記述されている
- [ ] Step 5 ラッパ仕様に空 export 判定（ALLOW_EMPTY 経路）+ SHA-256 生成 + R2 put + 通知が含まれる
- [ ] Step 8 rotation に `bash scripts/cf.sh secret put` 経由が明記されている
- [ ] `wrangler` 直接実行が一切混入していない
- [ ] 不変条件 #5 が多角的チェックに含まれている
- [ ] 本 Phase が docs-only / spec_created であり実コード適用は Phase 13 後の別 PR で行う旨が 3 箇所以上で明記されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- Step 1〜8 の表に空セルなし
- 本 Phase の状態が `spec_created`、`outputs` 配下にファイルを作成していない
- 実コード（`workers/`, `.github/workflows/`, `scripts/d1-backup.sh`）への編集を一切行っていない
- artifacts.json の `phases[4].status` が `spec_created`、`phases[4].outputs` が `[]`

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系・エラーハンドリング)
- 引き継ぎ事項:
  - Step 5 ラッパの failure 経路を Phase 6 異常系 E1〜E7 の起点に
  - Step 1〜3 の R2 設定を Phase 8 セキュリティ章 S1〜S7 へ
  - Step 7 / 8 を Phase 12 SOP に
  - Step 4 / 5 を Phase 11 staging smoke 期待値テンプレへ
- ブロック条件:
  - 採用ルート分岐の片方が記述漏れ
  - lifecycle 2 rule のうちいずれかが欠落
  - `wrangler` 直接実行が Step に混入
  - ラッパ仕様で空 export 経路が欠落
  - 実コード適用が本 Phase で実施された形跡（hard rule 違反）
