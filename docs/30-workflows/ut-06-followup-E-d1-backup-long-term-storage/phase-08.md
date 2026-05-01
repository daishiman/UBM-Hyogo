# Phase 8: セキュリティ・コンプライアンス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 8 / 13 |
| Phase 名称 | セキュリティ・コンプライアンス |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (受入条件マトリクス) |
| 次 Phase | 9 (パフォーマンス・SLO) |
| 状態 | spec_created |
| 推奨Wave | Wave 2 |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118（CLOSED） |

## 目的

D1 export = 会員 PII を含み得る SQL 平文という前提のもと、Phase 1〜7 で確定した「R2 一次保管 + 1Password Environments 補助 + cron / GHA 採用ルート + UT-08 通知統合」の運用境界に対して、`/d1-backup` パイプラインのセキュリティ脅威モデル（S1〜S7）を固定し、各脅威に対する緩和策・運用責任分界・暗号化方式選定根拠・1Password / Cloudflare Secrets / R2 系 CLI のオペレーション境界を仕様レベルで確定する。Cloudflare 系 CLI は CLAUDE.md §シークレット管理に従い `scripts/cf.sh` 経由のみで操作する原則を再固定する。本 Phase は spec_created に閉じる（実コード未実装）。

## 真の論点 (true issue)

- 「バックアップ取得を秘密にする」ではなく、**「PII を含む可能性がある D1 export を、(a) 静止時暗号化、(b) 経路暗号化、(c) アクセス制御（private bucket + signed URL 短期発行）、(d) 監査ログの 4 軸で多層防御し、長期保管期間中に流出した場合の blast radius を最小化する境界」** の確立。
- 副次論点: (1) 機密性レベル別暗号化方式（SSE-S3 / SSE-C / KMS）の採用判断、(2) R2 access key の rotation 主体・頻度、(3) 1Password Environments 補助保管時のアクセス権、(4) 不変条件 #5（cron は wrangler 経由で `apps/web` から D1 直接アクセスではない）の grep 検査、(5) 監査トレース（Cloudflare Analytics / R2 access logs）。

## 依存境界

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Phase 5 R2 構築 / cron 採用ルート | 本 Phase の脅威モデルの起点 |
| 上流 | Phase 6 E2 / E4 / E7 | quota / rotation / hash mismatch の異常系入力 |
| 上流 | UT-06 Phase 9 outputs/phase-09/secret-hygiene-checklist.md | secret hygiene の既存 SSOT |
| 仕様 | CLAUDE.md §シークレット管理 / §不変条件 #5 / §Cloudflare 系 CLI 実行ルール | 既存原則と整合 |

## 価値とコスト

- 価値: PII 流出時の法的・信用リスクを多層防御で抑止し、復旧時にも blast radius を再評価できる構造を残す。
- コスト: SSE-C 採用時はクライアント側鍵管理が増えるため運用コスト増、SSE-S3 採用時は Cloudflare 管理鍵の信頼に依存（前提として許容）。本 Phase は SSE-S3 を base case とし、PII 含有が確認された段階で SSE-C / KMS への昇格を Phase 12 SOP で運用する。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | S1〜S7 の緩和策が Phase 5 / 6 / 7 と整合 |
| 漏れなし | OK | 静止 / 経路 / アクセス / 監査 / rotation / 不変条件 #5 / 補助保管を被覆 |
| 整合性 | OK | CLAUDE.md §シークレット管理 / §不変条件 #5 と完全整合 |
| 依存関係整合 | OK | UT-06 phase-09 secret-hygiene-checklist.md を継承 |

## 既存命名規則の確認

- 脅威 ID: `S1〜S7`（FU-H と同じ S プレフィックス）
- 暗号化方式表記: `SSE-S3` / `SSE-C` / `KMS`（AWS 慣用に合わせ R2 互換層でも採用）
- secret 配置: `op://UBM-Hyogo/cloudflare-d1-backup/<KEY>`

## 機密性レベル判定（前提）

| レベル | 内容 | 暗号化方式（base case） | rotation 頻度 |
| --- | --- | --- | --- |
| L1 | schema only / public 情報のみ | SSE-S3（R2 default）| 12 ヶ月 |
| **L2** | **氏名 / メール / 一般会員属性（現運用想定）** | **SSE-S3 + private bucket + signed URL 短期** | **6 ヶ月** |
| L3 | 機微属性（健康情報・本人証明書スキャン等）| SSE-C または KMS（client-side key）+ private | 3 ヶ月 |

> 現状の D1 schema に L3 相当データはない想定。base case = L2 / SSE-S3 を採用し、Phase 12 SOP で月次 restore drill と同時に schema を再評価して L3 化が必要かを判断する。

## 脅威モデル（S1〜S7）

| # | 脅威 | 影響 | 主体 | 採用緩和策 |
| --- | --- | --- | --- | --- |
| S1 | R2 bucket public / signed URL 漏洩による外部からの export 取得 | PII 一括流出 | 外部攻撃者 / 設定ミス | private bucket（anonymous 403）+ signed URL は短期（≦ 1 時間）で発行・ログ残し。S3 互換 access key は op 参照で配布制限 |
| S2 | 静止データの平文保管（暗号化未設定）| 物理層 / 管理者侵入時の生 PII 露出 | 内部脅威 / 管理者ミス | SSE-S3（base case L2）。L3 昇格時は SSE-C or KMS。lifecycle で daily / monthly 双方に SSE 継承 |
| S3 | R2 access key の漏洩（リポジトリ commit / ログ流出 / 端末漏洩）| put / get 権限の奪取・全 export 流出 | 開発者ミス / supply chain | 1Password (`op://UBM-Hyogo/cloudflare-d1-backup/R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`) で管理。`.env` には op 参照のみ。注入は `bash scripts/cf.sh` 経由のみ |
| S4 | UT-08 通知 webhook URL の漏洩 / 偽装通知 | 通知 noise / 攻撃者誘導通知 | 外部攻撃者 / 開発者ミス | webhook URL を 1Password 管理、HTTPS のみ、UT-08 側で署名検証（既存 secret-hygiene-checklist.md 準拠） |
| S5 | 不変条件 #5 違反（`apps/web` から D1 直接アクセスや export ロジック混入）| アーキテクチャ境界破綻 | 開発者ミス / Phase 5 実装事故 | `apps/web/**` 配下に `D1Database` / `c.env.DB` / `prepare(` / `wrangler d1 export` / `[[d1_databases]]` が現れないことを Phase 5 / 9 / 11 で grep 検査（後述 §不変条件 #5 違反検知）|
| S6 | 1Password Environments 補助保管の権限管理不備 | 月次 export を非権限者が閲覧 | 内部脅威 | vault `UBM-Hyogo` の access を owner + SRE に限定。document 単位の audit log を月次レビュー |
| S7 | `/d1-backup` パイプライン呼び出しの監査トレース欠如 | 不正取得 / 異常 cron 実行を後追い不能 | - | (A) Workers Logs / Analytics で cron run / R2 put / 通知発火を記録、(B) R2 bucket access logs を有効化、(C) Cloudflare Audit Log で access key 操作を記録 |

## 緩和策表

| # | 脅威 | 緩和策 | 実装層 | 検証 Phase |
| --- | --- | --- | --- | --- |
| 1 | S1 | private bucket + signed URL 短期発行 + access key 配布制限 | Cloudflare R2 + scripts/cf.sh | Phase 5 Step 1 / Phase 11 |
| 2 | S2 | SSE-S3（base case L2）/ L3 昇格時 SSE-C / KMS | R2 bucket setting | Phase 5 Step 1 / Phase 12 SOP |
| 3 | S3 | 1Password op 参照 + `scripts/cf.sh` ラッパ + Cloudflare Secrets | 開発者運用 + CI | Phase 5 Step 2 / 8 |
| 4 | S4 | webhook URL 1Password 管理 + HTTPS + 署名検証 | UT-08 + scripts/cf.sh | Phase 5 Step 6 |
| 5 | S5 | `apps/web/**` D1 参照 grep 検査 | リポジトリ全体 | 本 Phase + Phase 9 / 11 |
| 6 | S6 | 1Password vault access の owner / SRE 限定 + 月次 audit | 1Password 運用 | Phase 12 SOP |
| 7 | S7 | Workers Logs / R2 access logs / Cloudflare Audit Log の有効化 | Cloudflare 側 | Phase 9 SLO / Phase 11 smoke |

## コンプライアンス対応（仕様レベル）

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| CLAUDE.md §シークレット管理 準拠 | PASS | R2 access key / webhook URL を 1Password 管理、`.env` op 参照のみ、`scripts/cf.sh` 経由 |
| CLAUDE.md §重要な不変条件 #5 準拠 | PASS | cron は Worker / GHA で実行、`apps/web` から D1 直接アクセスなし。後述 grep で 0 件確認 |
| Cloudflare 系 CLI ラッパ運用 | PASS | `wrangler` 直接実行禁止。`bash scripts/cf.sh d1 ...` / `bash scripts/cf.sh r2 ...` / `bash scripts/cf.sh deploy ...` 経由のみ |
| 平文 secret の commit 禁止 | PASS | R2 access key / webhook URL 値はリポジトリに残らない |
| OAuth トークンのローカル保持禁止 | PASS | `wrangler login` は使わず `.env` op 参照に一本化 |
| ログへの API Token 転記禁止 | PASS | 仕様書・ログ・ラッパ実装すべてで API Token / OAuth トークン値を出力しない |
| AC-9 暗号化方式記録 | PASS | 機密性レベル判定表（L1〜L3）+ base case L2 / SSE-S3 を本仕様で記述 |

## Cloudflare 系 CLI ラッパ (`scripts/cf.sh`) 経由の徹底

| 用途 | 推奨コマンド | 禁止 |
| --- | --- | --- |
| 認証確認 | `bash scripts/cf.sh whoami` | `wrangler whoami` 直接実行 |
| D1 export | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output /tmp/export.sql` | `wrangler d1 export` 直接実行 |
| R2 put / list | `bash scripts/cf.sh r2 object put` / `r2 object list` | `wrangler r2 ...` 直接実行 |
| Secret 注入 | `bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --config apps/api/wrangler.toml --env production` | `wrangler secret put` 直接実行 |
| Worker デプロイ | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | `wrangler deploy` 直接実行 |

> ラッパが (1) `op run --env-file=.env` 経由の `CLOUDFLARE_API_TOKEN` 動的注入、(2) `ESBUILD_BINARY_PATH` 自動解決、(3) `mise exec --` 経由の Node 24 / pnpm 10 保証、を一括で担う。Claude Code を含む全 AI エージェントに適用される禁止事項として、`.env` 中身の `cat` / `Read` / `grep` 表示・読取り、API Token 値の出力転記、`wrangler login` でのローカル OAuth トークン保持を本仕様書でも再固定する。

## 不変条件 #5 違反検知

`apps/web` 側に D1 参照や export 経路が混入していないかを以下の grep で検査する（Phase 9 / 11 の検証コマンド SSOT に転記）。

```bash
violations=$(grep -rnE 'D1Database|c\.env\.DB|prepare\(|\[\[d1_databases\]\]|wrangler d1 export' apps/web/ 2>/dev/null || true)
if [ -n "$violations" ]; then
  echo "INVARIANT #5 VIOLATION: apps/web 側に D1 / export 参照が混入しています"
  echo "$violations"
  exit 1
fi
echo "OK: apps/web 配下に D1 / export 参照なし"
```

| 検査対象 | 期待 |
| --- | --- |
| `apps/web/**` 配下の `D1Database` 出現 | 0 件 |
| `apps/web/**` 配下の `c.env.DB` 出現 | 0 件 |
| `apps/web/**` 配下の `.prepare(` 出現 | 0 件 |
| `apps/web/**` 配下の `[[d1_databases]]` 出現 | 0 件 |
| `apps/web/**` 配下の `wrangler d1 export` 出現 | 0 件 |

## 監査トレース構成

| 軸 | データソース | 検証 Phase |
| --- | --- | --- |
| cron run | Workers Logs / GHA workflow run history | Phase 9 SLO / Phase 11 smoke |
| R2 put / get | R2 bucket access logs（有効化） | Phase 9 / 11 |
| access key 操作 | Cloudflare Audit Log | Phase 12 月次レビュー |
| 1Password vault 閲覧 | 1Password audit log | Phase 12 月次レビュー |
| UT-08 通知 | UT-08 channel 履歴 | Phase 11 smoke |

## 実行タスク

1. 機密性レベル判定表（L1〜L3）と base case L2 / SSE-S3 を確定（完了条件: §機密性レベル判定 表記述）。
2. S1〜S7 の脅威モデルを固定（完了条件: 全脅威に影響・主体・緩和策がある）。
3. 緩和策表を 7 行で実装層と検証 Phase に紐付け（完了条件: 7 行記述）。
4. `scripts/cf.sh` 経由のみの Cloudflare 操作境界を再固定（完了条件: wrangler 直接実行禁止）。
5. 不変条件 #5 違反検知を grep コマンドで定義（完了条件: SSOT 化）。
6. 監査トレース 5 軸を確定（完了条件: §監査トレース構成 表）。
7. AC-9 暗号化方式記録の根拠を本 Phase に固定（完了条件: コンプライアンス表 PASS）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-01.md | 真の論点 / AC / 4 条件 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-05.md | R2 構築 / rotation 手順 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-06.md | E2 / E4 / E7 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md | UT-06 既存 secret hygiene SSOT |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web から D1 直接アクセス禁止 |
| 必須 | CLAUDE.md §シークレット管理 | 1Password / `.env` op 参照 / `scripts/cf.sh` 経由 |
| 必須 | scripts/cf.sh | Cloudflare 系 CLI ラッパ正本 |
| 参考 | https://developers.cloudflare.com/r2/buckets/data-security/ | R2 SSE / private 設定 |
| 参考 | https://developers.cloudflare.com/r2/api/s3/presigned-urls/ | signed URL 仕様 |
| 参考 | https://developers.cloudflare.com/fundamentals/account/account-security/audit-logs/ | Audit Log |

## スコープ

### 含む
- 機密性レベル判定（L1〜L3）+ 暗号化方式選定
- 脅威モデル S1〜S7 / 緩和策表
- コンプライアンス対応宣言 / `scripts/cf.sh` 徹底
- 不変条件 #5 grep / 監査トレース構成

### 含まない
- L3 用 SSE-C / KMS の実装（必要時に Phase 12 SOP で発動）
- 暗号化鍵の物理 rotation 実走（Phase 5 Step 8）

## 実行手順

### ステップ 1: 機密性レベル判定の固定
- L1 / L2 / L3 を表化、base case = L2 / SSE-S3 を確定する。

### ステップ 2: 脅威モデル S1〜S7 の固定
- 7 脅威を表化、影響・主体・採用緩和策を 1 行ずつ確定する。

### ステップ 3: 緩和策表の作成
- 各脅威に対する実装層と検証 Phase を割り当てる。

### ステップ 4: コンプライアンス対応の宣言
- CLAUDE.md §シークレット管理 / §不変条件 #5 / `scripts/cf.sh` 経由原則の遵守状態を表化。

### ステップ 5: Cloudflare 系 CLI ラッパ徹底の再固定
- `wrangler` 直接実行禁止、`bash scripts/cf.sh ...` 経由のみを再固定。

### ステップ 6: 不変条件 #5 違反検知 grep の SSOT 化
- `apps/web/**` 配下への D1 / export 参照混入を検出する grep を Phase 9 / 11 に渡す形で固定。

### ステップ 7: 監査トレース連携の固定
- Workers Logs / R2 access logs / Cloudflare Audit Log / 1Password audit / UT-08 履歴の 5 軸を Phase 9 SLO と Phase 12 月次レビューに接続。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | S7（監査トレース）/ S5（不変条件 #5 grep）を SLO 監視 + 違反検知に接続 |
| Phase 11 | smoke で S1（private bucket + signed URL）/ S2（SSE 有効）/ S5（grep 0 件）を実測確認 |
| Phase 12 | rotation SOP（S3 / S6）/ 暗号化方式昇格 SOP（L2 → L3 / SSE-C 切替）/ 月次 audit を implementation-guide.md に転記 |
| Phase 13 | user_approval ゲートで CLAUDE.md §シークレット管理 / `scripts/cf.sh` 経由原則の遵守を最終確認 |

## 多角的チェック観点

- **不変条件 #5 違反**: `apps/web/**` に D1 / export 参照シンボルが混入していないか。本 Phase で grep SSOT 化、Phase 9 / 11 で実走。
- **静止データ暗号化**: SSE-S3（base case L2）が R2 default で有効か、lifecycle で daily / monthly 双方に継承されるか。
- **アクセス制御**: bucket private + signed URL 短期発行が運用ポリシーとして固定されているか。
- **secret hygiene**: R2 access key / webhook URL が 1Password op 参照経由でのみ注入され、リポジトリ・ログ・仕様書に値が残っていないか。
- **rotation 主体**: S3 / S6 の rotation 手順が Phase 12 SOP に渡されており、緊急時に即実行可能か。
- **CLI ラッパ徹底**: `wrangler` 直接実行が仕様書・ランブック・runbook で残っていないか。`bash scripts/cf.sh ...` 経由に統一されているか。
- **監査トレース**: 5 軸（cron / R2 / Audit Log / 1Password / UT-08）が Phase 9 SLO / Phase 12 月次レビューに渡されているか。
- **機密性レベル昇格**: L2 → L3 への昇格条件（schema 変更で機微属性が追加された場合）が Phase 12 SOP で trigger 化されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 機密性レベル判定（L1〜L3）固定 | 8 | spec_created | base case L2 / SSE-S3 |
| 2 | 脅威モデル S1〜S7 固定 | 8 | spec_created | 7 脅威 |
| 3 | 緩和策表作成 | 8 | spec_created | 検証 Phase 割当 |
| 4 | コンプライアンス対応宣言 | 8 | spec_created | CLAUDE.md 整合 |
| 5 | `scripts/cf.sh` 経由徹底再固定 | 8 | spec_created | wrangler 直接禁止 |
| 6 | 不変条件 #5 違反検知 grep | 8 | spec_created | apps/web 配下 0 件期待 |
| 7 | 監査トレース 5 軸 | 8 | spec_created | Phase 9 / 12 接続 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-08.md | 本仕様書（機密性レベル / 脅威モデル / 緩和策 / コンプライアンス / CLI ラッパ徹底 / 不変条件 #5 grep / 監査トレース）|
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 機密性レベル判定（L1〜L3）が表化され、base case = L2 / SSE-S3 が確定している
- [ ] 脅威モデル S1〜S7 が 7 件すべて表化されている
- [ ] 緩和策表が 7 件すべての脅威に対応している
- [ ] コンプライアンス対応で CLAUDE.md §シークレット管理 / §不変条件 #5 が PASS と明記
- [ ] `scripts/cf.sh` 経由徹底（wrangler 直接実行禁止）が再固定されている
- [ ] 不変条件 #5 違反検知 grep が SSOT として記述されている
- [ ] 監査トレース 5 軸（cron / R2 / Audit Log / 1Password / UT-08）が Phase 9 SLO / Phase 12 月次レビューに接続されている
- [ ] AC-9 暗号化方式記録が本 Phase で根拠付けされている
- [ ] R2 access key / webhook URL の 1Password 経由注入ルールが CLAUDE.md と整合している

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 不変条件 #5 grep コマンドが本仕様書に記述
- Cloudflare 系 CLI ラッパ経由原則が再固定
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (パフォーマンス・SLO)
- 引き継ぎ事項:
  - S7（監査トレース 5 軸）を SLO 監視と接続する設計
  - 不変条件 #5 違反検知 grep を Phase 9 検証コマンド SSOT に転記
  - L2 → L3 昇格条件と暗号化方式切替 trigger を Phase 12 SOP へ
  - rotation SOP（S3 / S6）/ 月次 audit（S6）を Phase 12 documentation へ
  - WAF / signed URL の動作確認手順を Phase 11 smoke に渡す
- ブロック条件:
  - 脅威モデル S1〜S7 が未確定
  - 不変条件 #5 違反検知 grep が記述されていない
  - `wrangler` 直接実行を許容する記述が残っている
  - R2 access key / webhook URL の管理経路が CLAUDE.md と乖離
  - AC-9 暗号化方式記録の根拠が欠落
