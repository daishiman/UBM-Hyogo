# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（cron 成功 log / 復元 drill / 失敗時アラート / 空 export / SHA-256 検証） |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| 推奨Wave | Wave 2 |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118（CLOSED） |
| artifact 注記 | Phase 4-13 は spec_created 骨格として作成、実コード（GHA workflow / Cloudflare cron triggers / R2 lifecycle / ラッパスクリプト）は Phase 13 ユーザー承認後の別 PR で行う |

## 目的（仕様化のみ）

UT-06-FU-E が掲げる AC-1〜AC-9 のうち、**実走可能なテスト命題（T1〜T7）** を本 Phase で固定する。本タスクは GitHub Actions workflow / Cloudflare cron triggers / R2 lifecycle policy / `bash scripts/cf.sh d1 export` ラッパスクリプト等が中心であり、実装物の多くが YAML / シェルである。そのため Vitest 等のユニットテストが書けない領域は **契約レベル検証テンプレ**（curl / aws s3 / sha256sum / Workers tail / R2 ListObjects 等のコマンド系列）として T1〜T7 に整理する。

> **本 Phase は docs-only / spec_created**。コマンドの実走は Phase 5 / 6 / 11 に委譲する。

## 真の論点 (true issue)

「日次バックアップが取れるか」ではなく、**「(a) 取得失敗を即検知できる契約レベル証拠、(b) R2 に保管された export が破損なく復元可能であることを定期的に証明する手段、(c) 初回 migration 前の空 export を false negative としない判定ロジック、(d) GHA / Cloudflare cron どちらの採用ルートでも同一の AC を満たすことが保証できる検証境界」** の確立。本 Phase はこの 4 点を T1〜T7 に落とし込む。

## 依存境界

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06 本番デプロイ完了 | 本番 D1 が存在することが前提 |
| 上流 | UT-12 R2 storage / UT-08 monitoring | R2 bucket / 通知 webhook の前提 |
| 関連 | UT-06 Phase 6 D-2 restore-empty.sql | 初回 migration 失敗時の復元雛形 |
| 仕様 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `wrangler` 直接禁止・`scripts/cf.sh` 経由 |
| 仕様 | CLAUDE.md §不変条件 #5 | cron は wrangler 経由・`apps/web` から D1 直接アクセスではない |

## 価値とコスト

- 価値: 本番 D1 喪失時の RPO（Recovery Point Objective）を「日次」に限定し、長期保管 30 日 + 月次スナップショットで RTO（Recovery Time Objective）を runbook ベースで担保。
- コスト: GHA 採用時は無料枠 2,000 分/月の圧迫リスク、Cloudflare cron 採用時は Workers の cron triggers 無料枠（月 5 cron まで）の枠管理。テスト実走は契約レベルに留めるため追加コスト最小。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | T1〜T7 の期待値が AC-1〜AC-9 と完全整合 |
| 漏れなし | OK | AC-1〜AC-9 すべてが T1〜T7 のいずれかに紐付く（後述 AC × T 表） |
| 整合性 | OK | GHA / Cloudflare cron の 2 採用ルートで同一テスト命題が適用可能 |
| 依存関係整合 | OK | UT-12 R2 / UT-08 通知が前提であることを T2 / T4 で再確認 |

## 既存命名規則の確認

- ファイル名: `phase-04.md`（FU-H と同じ命名規則）
- テスト ID: `T1〜T7`（happy path 寄り）/ Phase 6 で `E1〜E7` に展開
- AC 番号: `AC-1〜AC-9`（index.md / 原典 76 行スペック準拠）

## 実行タスク

1. T1〜T7 を「対象 / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分け / 実走 Phase」の 6 列で表化（完了条件: 7 行 × 6 列が空セル無く埋まる）。
2. AC-1〜AC-9 を T1〜T7 にトレースする AC × T 表を作成（完了条件: 9 AC すべてが少なくとも 1 件の T に紐付く）。
3. GHA 採用ルート / Cloudflare cron 採用ルート両方で適用可能な検証コマンドを記述（完了条件: T1 / T4 で 2 ルート分岐記述）。
4. 空 export 許容バリデーションを「初回 migration 前 / 適用後」の 2 ケースで T6 に固定（完了条件: 2 ケースの期待値分岐記述）。
5. SHA-256 ハッシュ検証を T7 で固定（完了条件: hash 生成・保管・照合フローが記述）。
6. 復元 drill（机上演習 vs 実 D1 への restore）を T5 で 2 段階で記述（完了条件: 机上 / 実復元の境界明示）。
7. docs-only 境界の再固定（完了条件: §目的 / §統合テスト連携 に明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | 原典スペック（76 行）/ AC-1〜AC-9 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-01.md | AC-1〜AC-9 の左軸 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-02.md | GHA / cron triggers アーキ案 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-03.md | base case 採用根拠 / open question |
| 必須 | CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 経由運用 |
| 参考 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 一次保管の現状 |
| 参考 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md | 復元演習の参考 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | cron triggers 仕様 |
| 参考 | https://developers.cloudflare.com/r2/buckets/object-lifecycles/ | R2 lifecycle policy |

## スコープ

### 含む
- T1〜T7 の表化と AC × T トレース
- GHA / Cloudflare cron 両ルートの契約レベル検証テンプレ
- 空 export 許容判定 / SHA-256 整合性検証 / 復元 drill 計画

### 含まない
- テストコード本体の実装（Vitest 等を書く対象が乏しいため契約レベルに留める）
- 実 cron のスケジュール設定 / R2 bucket 作成（Phase 5）
- 復元 drill の実走（Phase 11 / Phase 12 SOP）

## 実行手順

1. Phase 2 / 3 で確定したアーキ案（GHA or cron triggers + R2 + 1Password 補助）を入力として T1〜T7 を起こす。
2. T1〜T7 を表化し空セルを埋める。
3. AC × T 表で抜け漏れゼロを確認。
4. 実走 Phase（5 / 6 / 11）への委譲境界を明記する。
5. 本 Phase ではコマンドを実走しない旨を再確認する。

## テスト一覧（T1〜T7）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前）の現状値 / **実走 Phase** = 実コマンドを走らせる Phase

### T1: 日次 cron が成功 log を残しているか

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | GHA workflow run / Cloudflare Workers cron trigger 実行 log（AC-1） |
| 検証コマンド | (GHA) `gh run list --workflow=d1-backup.yml --limit 1 --json status,conclusion,createdAt` / (Cloudflare cron healthcheck) `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty` |
| 期待値 | (GHA) 直近 24h 以内に `conclusion: success` の run が 1 件以上 / (cron) `wrangler tail` 等価出力で `OK` log line が 1 件以上 |
| Red 状態 | workflow / cron triggers 未作成、または直近 24h で success run がゼロ |
| 失敗時切り分け | (a) cron schedule 未登録 / (b) `CLOUDFLARE_API_TOKEN` 等 secret 不足 / (c) `bash scripts/cf.sh d1 export` の引数誤り / (d) UT-22 D1 binding 未注入で `c.env.DB` undefined |
| 実走 Phase | Phase 5（local dry-run）+ Phase 11（staging / production smoke） |

### T2: R2 に export ファイルが保存されているか（直近 30 日 + 月次世代）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | R2 bucket `ubm-hyogo-d1-backup` 配下の object 件数 + LastModified（AC-2） |
| 検証コマンド | `bash scripts/cf.sh r2 object list ubm-hyogo-d1-backup --prefix daily/` および `--prefix monthly/`（具体ラッパは Phase 5 で確定） |
| 期待値 | `daily/` prefix 配下に直近 30 日分の object（≧ 28 件、月境界で ±2 許容）、`monthly/` 配下に当月含む過去スナップショット |
| Red 状態 | bucket が存在しない / 件数 0 / lifecycle policy 未適用で過剰世代蓄積 |
| 失敗時切り分け | (a) bucket 未作成 / (b) cron が export を put していない / (c) lifecycle rule 設定誤り / (d) IAM 設定で put 権限欠落 |
| 実走 Phase | Phase 5（初回 put 確認）+ Phase 11（30 日経過後の世代確認） |

### T3: SSE / KMS / ACL 設定確認

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | R2 bucket 暗号化方式 + ACL（AC-3 / AC-9） |
| 検証コマンド | `bash scripts/cf.sh r2 bucket info ubm-hyogo-d1-backup` で SSE / 公開設定を確認、加えて anonymous な curl で 403 が返ることを確認 |
| 期待値 | bucket は private（anonymous GET = 403）、SSE-S3 等価の暗号化が default で有効、または SSE-C で client side key 注入運用が確立 |
| Red 状態 | public bucket / SSE 未設定 / signed URL なしで access 可能 |
| 失敗時切り分け | (a) `Public Access` toggle が ON / (b) lifecycle で SSE 設定が継承されていない / (c) signed URL 発行ポリシー未確立 |
| 実走 Phase | Phase 5（bucket 作成直後）+ Phase 8（セキュリティ章で再確認） |

### T4: 失敗時 UT-08 通知基盤が dry-run でアラート発火

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | export 失敗時の UT-08 通知（AC-5） |
| 検証コマンド | (GHA) workflow に意図的な failing step を仕込み `gh workflow run d1-backup.yml -f mode=dryrun-fail` / (cron) Cloudflare Workers の test mode で `throw new Error("DRY-RUN-FAIL")` |
| 期待値 | UT-08 通知 webhook test channel に `D1_BACKUP_FAILED` event が 1 件着信 |
| Red 状態 | 失敗しても通知が飛ばない / 通知 channel 未設定 |
| 失敗時切り分け | (a) UT-08 webhook URL secret 未注入 / (b) workflow の `if: failure()` ステップ漏れ / (c) cron triggers の error handler 未実装 |
| 実走 Phase | Phase 6（異常系 dry-run）+ Phase 11（staging 統合）|

### T5: 復元 drill（机上 → 実 D1 への restore）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | export ファイルを別 D1（drill 専用）にロードし、行数と schema 一致を確認（AC-4） |
| 検証コマンド | (机上) `outputs/phase-XX/restore-walkthrough.md` のレビュー / (実 drill) `bash scripts/cf.sh d1 execute ubm-hyogo-db-drill --env drill --file <export.sql>` |
| 期待値 | (机上) runbook 全 step がチェックリスト化 / (実 drill) restore 後の `SELECT COUNT(*) FROM members` 等が export 直前の値と一致 |
| Red 状態 | runbook が存在しない / 実 drill で broken export を検出できない |
| 失敗時切り分け | (a) drill 用 D1 binding 未作成 / (b) export SQL に `BEGIN/COMMIT` 不足 / (c) schema migration 適用前の export を適用後 D1 に流して失敗 |
| 実走 Phase | Phase 11（机上演習）+ Phase 12（実 drill SOP 化） |

### T6: 空 export 許容バリデーション（初回 migration 前 / 適用後）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 対象 | `wrangler d1 export` の出力が「空 schema only」でも cron 全体は success 扱い（AC-6） |
| 検証コマンド | (a) 初回 migration 前: export が schema-only（CREATE TABLE 文 0 件）でも `exit 0` / (b) 適用後: export に少なくとも 1 件以上の `CREATE TABLE` を含むことを `grep -c '^CREATE TABLE' export.sql` で確認 |
| 期待値 | (a) success 扱い + warning log（`[backup] empty export accepted (pre-migration)`）/ (b) `CREATE TABLE` 件数 ≧ 1、行数 0 でも success |
| Red 状態 | (a) で error 終了し UT-08 false positive / (b) で migration 適用済みなのに warning が消えない |
| 失敗時切り分け | (a) ラッパスクリプトの validation ロジックが「行数 0 = error」と決め打ち / (b) 初回フラグ判定漏れ |
| 実走 Phase | Phase 5（ラッパスクリプト初回起動）+ Phase 6（異常系で boundary 確認） |

### T7: SHA-256 ハッシュ整合性検証（破損検出）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 対象 | export ファイルの SHA-256 を put 時 metadata に保存し、復元時に再計算して照合（AC-2 / AC-4 補強） |
| 検証コマンド | (put 時) `sha256sum export.sql > export.sql.sha256` を R2 に同梱 put / (復元時) `sha256sum -c export.sql.sha256` |
| 期待値 | put 時 hash と復元時 hash が完全一致（exit 0） |
| Red 状態 | hash file が同梱されていない / hash mismatch で破損検出（restore 中断ロジックが効いていない） |
| 失敗時切り分け | (a) put 時 hash 計算漏れ / (b) R2 transit で破損（multipart upload 設定誤り）/ (c) 復元側で hash check ステップ未実装 |
| 実走 Phase | Phase 5（ラッパ実装）+ Phase 11（drill での mismatch 強制テスト） |

## AC × T トレース表

| AC | 内容 | 紐付く T |
| --- | --- | --- |
| AC-1 | 日次 cron 稼働 + 成功 log | T1 |
| AC-2 | R2 直近 30 日 + 月次世代 | T2 / T7 |
| AC-3 | SSE / KMS / ACL 設定 | T3 |
| AC-4 | 復元 runbook + 机上演習結果 | T5 / T7 |
| AC-5 | 失敗時 UT-08 通知 | T4 |
| AC-6 | 空 export 許容バリデーション | T6 |
| AC-7 | `bash scripts/cf.sh d1 export` 経由 | T1（コマンド形）/ Phase 5 ランブック |
| AC-8 | GHA 採用時 UT-05-FU-003 監視 / cron 採用時無料枠不圧迫 | T1（2 ルート分岐）/ Phase 9 |
| AC-9 | 機密性レベル別暗号化方式記録 | T3 / Phase 8 |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| cron 成功証跡 | T1 で GHA / cron triggers 両ルート被覆 |
| R2 世代管理 | T2 で daily / monthly 両 prefix 被覆 |
| 暗号化 / ACL | T3 で private + SSE 被覆 |
| 失敗通知 | T4 で UT-08 dry-run channel 被覆 |
| 復元 drill | T5 で机上 + 実 drill 両モード被覆 |
| 空 export | T6 で pre/post migration 両ケース被覆 |
| 整合性 | T7 で put 時 + 復元時 両端 hash 照合 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | T1 / T2 / T3 / T6 / T7 をランブック step の Green 条件として参照 |
| Phase 6 | T4 / T6 を異常系 E1〜E7 に展開（cron 失敗 / 空 export false positive 等）|
| Phase 7 | AC × T 表を AC matrix の左軸に流用 |
| Phase 8 | T3 を SSE / KMS / signed URL のセキュリティ章エビデンスへ |
| Phase 11 | T1 / T2 / T5 を staging / production smoke で再走 |

> **本 Phase は実走しない**。T1〜T7 は仕様化のみで Phase 5 へ進み、実走は Phase 5 / 6 / 11 が担う。

## 多角的チェック観点

- **不変条件 #5 違反**: T1〜T7 のいずれの検証も `apps/web` 経由で D1 を叩く形になっていないか。export は `bash scripts/cf.sh d1 export` ラッパ経由で完結し、`apps/web` を通らない。
- **`wrangler` 直接実行禁止**: T1 / T2 / T3 の検証コマンドが `bash scripts/cf.sh ...` 経由に統一されているか。
- **GHA / cron 二重ルート**: T1 / T4 で両ルートの検証パスが書き分けられているか。
- **空 export false negative**: T6 で初回 migration 前を「success」と判定するロジックが Red→Green 境界として明示されているか。
- **hash 整合性**: T7 で put 時 + 復元時 hash が必ず両端で計算される設計か。
- **無料枠監視**: AC-8 を T1 経由で UT-05-FU-003（GHA 監視）/ Phase 9（cron 無料枠監視）に渡しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | T1〜T7 の表化 | 4 | spec_created | 7 件すべて記述 |
| 2 | AC × T トレース表 | 4 | spec_created | AC-1〜AC-9 |
| 3 | GHA / cron 2 ルート分岐記述 | 4 | spec_created | T1 / T4 |
| 4 | 空 export 許容判定 | 4 | spec_created | T6 |
| 5 | SHA-256 hash 検証 | 4 | spec_created | T7 |
| 6 | 復元 drill 2 段階 | 4 | spec_created | T5 |
| 7 | docs-only 境界明示 | 4 | spec_created | §目的 / §統合テスト連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-04.md | 本ファイル（Phase 4 タスク仕様書） |

> **outputs 境界**: Phase 4-13 の `outputs/phase-NN/` は docs validator 用の最小テンプレート実体として本 wave で作成済み。実測 evidence は実コード実装を伴う別 PR で追記する。

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] T1〜T7 の 7 件すべてが対象 / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分け / 実走 Phase の 6 列を埋めている
- [ ] AC × T トレース表で AC-1〜AC-9 が抜け漏れなく T へ紐付いている
- [ ] T1 / T4 が GHA 採用ルート / Cloudflare cron 採用ルート両方の検証パスを記述している
- [ ] T6 が「初回 migration 前 / 適用後」の 2 ケースで期待値分岐を明示している
- [ ] T7 が put 時 + 復元時 hash 照合の両端設計になっている
- [ ] `wrangler` 直接実行が一切混入していない（`bash scripts/cf.sh ...` 経由のみ）
- [ ] 不変条件 #5 が多角的チェック観点に含まれている
- [ ] 本 Phase が docs-only / spec_created であり実走しない旨が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- T1〜T7 の表に空セルなし
- 本 Phase の状態が `spec_created`、`outputs` 配下にファイルを作成していない
- artifacts.json の `phases[3].status` が `spec_created`、`phases[3].outputs` が `[]`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T7 を Phase 5 ランブック step の Green 条件として参照
  - T4 / T6 を Phase 6 異常系 E1〜E7 の起点に
  - AC × T トレース表を Phase 7 AC matrix へ
  - T3 を Phase 8 セキュリティ章のエビデンスへ
- ブロック条件:
  - T1〜T7 のいずれかに期待値・検証コマンド欠落
  - GHA / cron 2 ルート分岐の片方が欠落
  - `wrangler` 直接実行が検証コマンドに混入
  - 不変条件 #5 を侵害する検証パスが含まれている
