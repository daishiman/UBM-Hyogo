# Phase 11: 手動 smoke / NON_VISUAL walkthrough

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke / NON_VISUAL walkthrough |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (ロールアウト・ロールバック・机上演習) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118 (CLOSED) |
| user_approval_required | false（本 Phase は仕様レベル定義と最小 NON_VISUAL placeholder 作成のみ。実走 evidence は Phase 13 ユーザー承認後の別 PR） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由: 本タスクは D1 export → R2 PUT という backend データパイプラインで、UI / Renderer / 画面遷移は一切発生しない。screenshot 不要。
- 代替 evidence は **コマンド出力 + R2 ListObjects 結果 + 暗号化 metadata + Cloudflare Analytics ダッシュボード snapshot ID** の 4 階層で構成する。
- `outputs/phase-11/screenshots/` ディレクトリは作成しない（NON_VISUAL 整合）。
- UI sanity は `outputs/phase-11/main.md` で「NON_VISUAL 宣言」として記録し、実 screenshot は作成しない。
- 本 Phase では実走しない。Phase 13 ユーザー明示承認後、別 PR / 別オペレーションで実走する。

## 目的

Phase 1〜10 で固定された設計（GHA schedule を D1 export 主経路、Cloudflare cron triggers を R2 latest healthcheck / UT-08 alert 補助経路 / R2 daily 30 日 + monthly 12 ヶ月世代 / SSE / KMS / ACL / gzip 圧縮 / 復元 SLO < 15 分 / 空 export 許容 / `bash scripts/cf.sh d1 export` 経由）に対し、以下を確定する。

1. S 系列 smoke 5 件（**S-03 / S-07 / S-11 / S-15 / S-19**）のコマンド系列・期待 stdout・失敗時切り分け・evidence 出力先を仕様レベルで固定
2. NON_VISUAL 4 階層代替 evidence（L1 コマンド出力 / L2 R2 ListObjects / L3 暗号化 metadata / L4 CF Analytics snapshot ID）の保管先と保存ルールを確定
3. 自動テスト + 既知制限リストを「実運用は本ワークフロー範囲外」の代替記録として残す方針を固定
4. すべての CLI 実行例が `bash scripts/cf.sh ...` 経由（AC-7）で記述されており、`wrangler` 直接実行が一切現れないこと

## smoke 仕様

> **共通**: S-03 / S-07 / S-11 / S-15 / S-19 はすべて Phase 13 ユーザー承認後に実走する。本 Phase ではコマンド系列・期待 stdout・失敗時切り分け・evidence 保管先の「仕様レベル固定」のみ（**NOT EXECUTED** ステータス）。

### S-03: dev 手動 export → R2 PUT 成功 + ListObjects 確認 + 暗号化 metadata 確認

| 項目 | 内容 |
| --- | --- |
| 観点 | R1（dev 手動 export 検証）の GO 条件入力。`bash scripts/cf.sh d1 export` → gzip → R2 PUT が手動で成功し、暗号化 metadata が適用されること |
| 前提 | dev D1 / dev R2 bucket / 暗号化（SSE）設定 |
| コマンド系列 | `bash scripts/cf.sh d1 export ubm-hyogo-db-dev --env dev --output /tmp/dev.sql` → `gzip /tmp/dev.sql` → `bash scripts/cf.sh r2 object put <bucket>/daily/<date>.sql.gz --file /tmp/dev.sql.gz --metadata 'encrypted=true'` → `bash scripts/cf.sh r2 object list <bucket>/daily/` |
| 期待 stdout | export exit 0 / R2 PUT 200 / ListObjects に当該 key 1 件追加 |
| 期待 metadata | `x-amz-meta-encrypted: true`（または Cloudflare R2 標準の SSE flag） |
| 失敗時切り分け | (a) export exit != 0 → D1 binding / migration 状態確認 / (b) R2 PUT 失敗 → token / bucket 名 / IAM / (c) metadata 欠落 → `--metadata` フラグ syntax / SSE 設定 |
| AC マッピング | AC-1 / AC-3 / AC-7 |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-03 区画（NOT EXECUTED） |

### S-07: staging cron 7 日連続成功 smoke

| 項目 | 内容 |
| --- | --- |
| 観点 | R2（staging cron 1 週間試運転）の GO 条件。Cloudflare cron triggers が daily で 7 日連続稼働 |
| 前提 | S-03 GREEN / staging deploy 完了 / cron triggers 有効 |
| コマンド系列 | 7 日間にわたり `bash scripts/cf.sh r2 object list <bucket>/daily/ --env staging` を日次実行し、件数が 1 件ずつ増加することを確認 |
| 期待 stdout | 7 日後に 7 件、各 key 名に日付 prefix が含まれる |
| 失敗時切り分け | (a) 0 件 → cron 未起動（`wrangler.toml` の `[triggers] crons` 確認）/ (b) 件数不整合 → cron 重複起動 or タイムゾーン drift |
| AC マッピング | AC-1 / AC-2 / AC-7 |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-07 区画 |

### S-11: 復元 drill smoke（取得 export → 別 D1 dev DB に restore → 行数 / schema 整合）

| 項目 | 内容 |
| --- | --- |
| 観点 | 月次机上演習相当の smoke。Phase 9 C6 復元 SLO < 15 分 / Phase 10 runbook §1〜§5 の通し稼働確認 |
| 前提 | S-03 GREEN / 別 dev D1（`ubm-hyogo-db-dev-restore`）が空状態で存在 |
| コマンド系列 | `bash scripts/cf.sh r2 object get <bucket>/daily/<date>.sql.gz --output /tmp/restore.sql.gz` → `gunzip /tmp/restore.sql.gz` → `bash scripts/cf.sh d1 execute ubm-hyogo-db-dev-restore --file /tmp/restore.sql --env dev` → `bash scripts/cf.sh d1 execute ubm-hyogo-db-dev-restore --command 'SELECT COUNT(*) FROM members;' --env dev` |
| 期待 stdout | 全ステップ exit 0 / 行数が export 直前と一致 / 主要テーブル schema が dev と一致 |
| 期待 SLO | 5 ステップ合計 < 15 分（Phase 9 C6） |
| 失敗時切り分け | (a) gunzip 失敗 → 圧縮破損（C7 圧縮戦略の見直し）/ (b) d1 execute エラー → schema drift / migration 未適用 / (c) 行数 mismatch → export タイミング drift |
| AC マッピング | AC-4（復元 runbook 机上演習結果） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-11 区画 |

### S-15: 空 export 許容バリデーション smoke（AC-6）

| 項目 | 内容 |
| --- | --- |
| 観点 | 初回 migration 前 / 0 行 D1 に対する export が「失敗」ではなく「warning」として扱われ、UT-08 通知基盤に "info" レベルで通知されること |
| 前提 | 空状態の dev D1（`ubm-hyogo-db-dev-empty`）/ UT-08 test channel 接続済 |
| コマンド系列 | `bash scripts/cf.sh d1 export ubm-hyogo-db-dev-empty --env dev --output /tmp/empty.sql` → 行数チェック → R2 PUT |
| 期待 stdout | export exit 0 / `INSERT` 文 0 件 / R2 PUT 成功 / UT-08 test channel に "info: empty export accepted" 通知 |
| 失敗時切り分け | (a) exit != 0 → AC-6 違反、cron が真の失敗扱いになる / (b) UT-08 通知が "critical" → 通知レベル設定 drift |
| AC マッピング | AC-6 |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-15 区画 |

### S-19: production cron 失敗 → UT-08 alert smoke（AC-5）

| 項目 | 内容 |
| --- | --- |
| 観点 | 意図的に cron 失敗状態を作り（例: R2 token 無効化 / 一時的な bucket 名 typo）、UT-08 通知基盤に critical alert が届くこと。**破壊的 smoke**、isolated env でのみ実行 |
| 前提 | isolated staging（`staging-isolated`）/ UT-08 test channel |
| コマンド系列 | （isolated env のみで）R2 token を無効値に置換 → cron 待機 → UT-08 channel 確認 |
| 期待 stdout | UT-08 test channel に "critical: d1 backup failed (R2 PUT 403)" 通知 1 件以上 |
| 失敗時切り分け | (a) UT-08 通知なし → AC-5 違反 / 通知パイプライン断 / (b) production 環境に誤って適用 → 即時 R5 ロールバック |
| AC マッピング | AC-5 |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-19 区画 |
| 注意 | **破壊的・isolated env 専用**。後始末として token 復旧 deploy をペアで必ず実行 |

## 4 階層代替 evidence 設計

| 階層 | 種別 | 実走時の保管先 | 何を保証するか |
| --- | --- | --- | --- |
| **L1** | コマンド出力（`bash scripts/cf.sh d1 export` / `r2 object put` / `r2 object list` の stdout） | `outputs/phase-11/manual-smoke-log.md` の各 S 区画 | 実行コマンドと応答の完全再現性 |
| **L2** | R2 ListObjects 結果（key 名・size・last-modified） | `outputs/phase-11/r2-listing-{S-03,S-07,S-11}.txt` | 30 日 + 月次世代管理が機能 / 件数 drift 検知 |
| **L3** | 暗号化 metadata（`bash scripts/cf.sh r2 object get --metadata-only`）/ ACL 設定 | `outputs/phase-11/r2-metadata-{S-03,S-15}.json` | AC-3（SSE / KMS / ACL）/ AC-9（機密性別暗号化）保証 |
| **L4** | Cloudflare Analytics ダッシュボード snapshot ID（cron 実行回数 / R2 PUT 成功率 / UT-08 alert 件数） | `outputs/phase-11/cf-analytics-snapshot-ids.md` | 7 日連続稼働の時系列 evidence / S-19 alert 配信証跡 |

> **secret 混入防止**: L1 / L2 / L3 / L4 のいずれにも R2 token / API key / private key 実値を転記しない。`op://...` は参照名としてのみ許可し、値は記録しない（CLAUDE.md §シークレット管理）。

## 自動テスト + 既知制限リスト（代替記録）

| 項目 | 仕様 |
| --- | --- |
| 自動テストの位置付け | 本タスクは backend データパイプラインで、`apps/api` のユニットテストでは export の I/O 完結を検証しきれない |
| 代替記録 | `outputs/phase-11/automated-test-and-known-limits.md`（spec_created で雛形のみ） |
| 記録内容 | (a) cron handler の unit test 範囲 / (b) 実 R2 / 実 D1 を伴う E2E は本ワークフロー範囲外 / (c) 既知制限（Workers 30 秒 CPU 制限 / R2 1 リクエスト 5 GB 上限 / D1 export 仕様の Cloudflare 側 drift リスク） |
| 注記 | 「実運用は本ワークフロースコープ外、月次机上演習で継続裏取りする」旨を明記 |

## 期待値テンプレ更新方針（drift 防止）

- **更新対象**: `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md`（一次保管の現状）
- **更新理由**: 既存は手動 export の一次記録であり、本タスクで cron 自動化 + 長期保管を追加する形になるため、「手動 export → 自動 cron + R2 長期保管へ昇格」の trace を残す必要がある
- **更新内容（仕様レベル）**: 既存記録は append-only で残し、新規セクション「UT-06-FU-E 自動化への昇格」を追記する形
- **本 Phase の扱い**: 実ファイル更新は実施しない。Phase 13 ユーザー承認後の別 PR で行う
- **drift 検知手順**: Phase 13 実走時に「手動 / 自動」両方の evidence パスが記録されているか jq で突合

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-09.md | C1 / C5 / C6 SLO drift 検知基準 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-10.md | R1 / R2 / R3 GO 条件 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 既存一次保管記録（drift 防止対象） |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 徹底（AC-7） |
| 必須 | scripts/cf.sh / scripts/with-env.sh | Cloudflare CLI / 1Password 注入の唯一の経路 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 4 階層 evidence プレイブック |
| 参考 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/phase-11.md | NON_VISUAL Phase 11 構造リファレンス |

## 実行タスク

1. S-03 / S-07 / S-11 / S-15 / S-19 の smoke 仕様を固定する（完了条件: 各 smoke に観点・前提・コマンド・期待 stdout・evidence 出力先がある）。
2. NON_VISUAL 4 階層 evidence（L1〜L4）を定義する（完了条件: 保存先がある）。
3. 自動テスト + 既知制限リストを代替記録として固定する（完了条件: `automated-test-and-known-limits.md` 雛形仕様がある）。
4. screenshots を作成しない方針を明記する（完了条件: `outputs/phase-11/main.md` に NON_VISUAL 宣言を置く）。
5. 空 export 許容バリデーション smoke ケース（S-15）を定義する（完了条件: AC-6 と紐付け）。
6. UT-08 critical alert smoke（S-19）を破壊的 smoke として定義する（完了条件: isolated env 専用 + 後始末ペア）。
7. 期待値テンプレ更新方針（drift 防止）を明文化する（完了条件: 実ファイル更新は Phase 13 別 PR）。

## 実行手順

### ステップ 1: S 系列 smoke 5 件の仕様確定
- S-03 / S-07 / S-11 / S-15 / S-19 を 8 軸（観点 / 前提 / コマンド / 期待 stdout / 期待 metadata / 失敗時切り分け / AC マッピング / evidence 出力先）で記述。

### ステップ 2: 4 階層代替 evidence 設計の固定
- L1〜L4 の保管先・保証範囲・secret 混入防止ルールを表化。

### ステップ 3: 自動テスト + 既知制限の代替記録雛形
- 「実運用は本ワークフロー範囲外」の境界を明記。

### ステップ 4: `scripts/cf.sh` 徹底の確認
- 全コマンド例が `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行ゼロ）。

### ステップ 5: 「実走 / 実ファイル更新は Phase 13 ユーザー承認後」の 3 重明記
- 冒頭・成果物節・完了条件で 3 重明記。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | S-03 GREEN = R1 GO / S-07 GREEN = R2 GO / S-15 = AC-6 / S-19 = AC-5 |
| Phase 12 | manual-smoke-log.md / r2-metadata-*.json テンプレ更新を実 PR として ledger 化 |
| Phase 13 | ユーザー承認ゲート前チェックリストに S-03 / S-07 / S-11 / S-15 / S-19 を反映 |
| UT-08 | S-15 (info) / S-19 (critical) で通知レベル分離が機能するかを別途検証 |

## 多角的チェック観点

- **AC-7 整合（wrangler 直接禁止）**: smoke 全 CLI が `bash scripts/cf.sh ...` 経由か。
- **smoke drift**: S-03 / S-07 / S-11 期待値テンプレが既存 d1-backup-evidence.md と矛盾なく drift 防止されているか。
- **AC-6 空 export**: S-15 で「成功扱い + info 通知」が明確に AC-6 と紐付くか。
- **AC-5 通知**: S-19 で UT-08 critical alert が isolated env 専用かつ後始末ペアで担保されるか。
- **AC-9 暗号化**: L3 metadata evidence が機密性別暗号化方式を保証するか。
- **secret 混入防止**: L1〜L4 evidence に R2 token / API key / private key 実値が転記されていないか。`op://...` 参照名だけは許可する。
- **破壊的 smoke 安全性**: S-19 が production に誤って適用されない isolated env 設計になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-03 (dev 手動 export → R2 PUT) 仕様確定 | 11 | spec_created | AC-1 / AC-3 / AC-7 |
| 2 | S-07 (staging cron 7 日連続) 仕様確定 | 11 | spec_created | AC-1 / AC-2 |
| 3 | S-11 (復元 drill smoke) 仕様確定 | 11 | spec_created | AC-4 / 復元 SLO < 15 分 |
| 4 | S-15 (空 export 許容) 仕様確定 | 11 | spec_created | AC-6 |
| 5 | S-19 (UT-08 critical alert) 仕様確定 | 11 | spec_created | AC-5 / 破壊的 / isolated env |
| 6 | 4 階層代替 evidence (L1〜L4) 設計確定 | 11 | spec_created | コマンド / ListObjects / metadata / dashboard |
| 7 | 自動テスト + 既知制限リスト雛形 | 11 | spec_created | 実運用は範囲外 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-11.md | 本ファイル |
| メタ | artifacts.json | Phase 11 状態の更新（spec_created） |

> 本 Phase では docs validator 用の最小成果物として `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` を作成済み。実測 evidence は `r2-listing-S-07.txt`、`r2-metadata-S-03.json`、`r2-metadata-S-15.json`、`cf-analytics-snapshot-ids.md` として **Phase 13 ユーザー承認後の実走時にのみ生成** する。`screenshots/` ディレクトリは作成しない（NON_VISUAL 整合）。

## 完了条件

- [ ] S-03 / S-07 / S-11 / S-15 / S-19 の 5 件すべてが 8 軸で記述
- [ ] 4 階層代替 evidence (L1〜L4) の保管先と保証範囲が表化
- [ ] 自動テスト + 既知制限リスト雛形が代替記録として記述
- [ ] 全コマンド例が `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行ゼロ）
- [ ] `outputs/phase-11/screenshots/` を作成しない方針が明記
- [ ] `outputs/phase-11/main.md` に「NON_VISUAL 宣言」を記録
- [ ] 「実走 / 実ファイル更新は Phase 13 ユーザー承認後」が冒頭・成果物・完了条件で 3 重明記
- [ ] AC-5 / AC-6 / AC-7 / AC-9 が多角的チェックに含まれる

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- `wrangler` 直接実行が文中に存在しない
- artifacts.json の `phases[10].status` が `spec_created`

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定。
2. **「実走した」と書かない**: 本 Phase は仕様レベル定義のみ。manual-smoke-log.md は Phase 13 実走時に NOT EXECUTED → EXECUTED へ移行。
3. **既存 d1-backup-evidence.md を本 Phase で書き換えない**: drift 防止方針の「定義」のみ。実書き換えは Phase 13 別 PR。
4. **S-19 は破壊的**: isolated env 以外で実行しない。後始末（token 復旧 deploy）をペアで必ず実行。
5. **secret 混入防止**: L1〜L4 evidence に R2 token / API key / private key 実値を転記しない。`op://...` 参照名だけは許可する。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - S-03 / S-07 / S-11 / S-15 / S-19 のコマンド系列（implementation-guide.md / runbook 化候補）
  - 4 階層代替 evidence (L1〜L4) の保管先テンプレ
  - `d1-backup-evidence.md` への append-only 更新方針を Phase 13 別 PR タスクとして登録
- ブロック条件:
  - `wrangler` 直接実行が記述に残っている
  - S 系列 5 件のいずれかが 8 軸を満たしていない
  - `screenshots/` を作成している
  - 既存 d1-backup-evidence.md を本 Phase で実書き換えしている
