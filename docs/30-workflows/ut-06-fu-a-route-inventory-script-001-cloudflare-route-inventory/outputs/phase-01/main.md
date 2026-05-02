# Phase 1 要約: 要件定義

タスク: UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 / production Worker route inventory script
分類: docs-only / infrastructure-automation / NON_VISUAL / GitHub Issue #328
親タスク: UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246)

## 目的

UT-06-FU-A-PROD-ROUTE-SECRET-001 の runbook で定義された Worker 名 split-brain 検証チェックリストのうち、route / custom domain の対象 Worker 一致確認が現状 Cloudflare ダッシュボード手順に依存しており、機械的に snapshot を取得・比較できない。本 Phase ではこの不足を埋めるための **read-only な production Worker route inventory script** の要件を、Phase 2 が一意に設計を書き起こせる粒度で固定する。

実装作業ではなく、script の出力契約 (JSON / Markdown 形式)・安全境界 (read-only / secret 漏洩防止)・呼び出し境界 (`bash scripts/cf.sh` 一本化) を要件レベルで確定する。実装そのものは本タスクの範囲外。

## 真の論点

- 「script を作る」ではなく **「production deploy 承認の前に route → Worker target を機械的に snapshot して、旧 Worker と `ubm-hyogo-web-production` の split-brain を 0 にする出力契約を固定すること」** が本質。
- 副次論点: Cloudflare API token に書き込み権限を要求しない (read-only scope のみ)、`wrangler` 直接実行を一切混入させない (CLAUDE.md `Cloudflare 系 CLI 実行ルール`)。
- 本タスクは設計のみ。実装・実行・runbook 配線は別 PR / 後続 Phase 責務。production deploy / DNS 切替 / 旧 Worker 削除 / route 付け替えは全て対象外。

## 受入基準 AC-1〜AC-5

- **AC-1**: route / custom domain inventory が JSON と Markdown 両形式で出力され、各 entry に `route pattern` / `target worker name` / `zone` / `source` (`api` または `dashboard-fallback`) を含む。
- **AC-2**: `expectedWorker = "ubm-hyogo-web-production"` を指さない route / custom domain は `mismatches` 配列として entries 本体と分離される。`mismatches` が 0 件であることが production deploy 承認の前提となる契約を仕様書に明記する。
- **AC-3**: secret 値・Cloudflare API Token・OAuth Token が、出力ファイル (JSON / Markdown)・stdout / stderr・コミット対象のいずれにも一切現れない。検証は grep gate (Phase 3 NO-GO 条件) で固定する。
- **AC-4**: script は完全に read-only であり、Cloudflare API の mutation endpoint (`POST` / `PUT` / `PATCH` / `DELETE`) を一切呼ばない。検証はコードレビューと **API endpoint allowlist** (Phase 2 §2) で行う。
- **AC-5**: script 実行は `bash scripts/cf.sh` ラッパー経由でのみ完結し、`wrangler` 直接呼び出し・`wrangler login`・`.env` 実値の Read を一切含まない。grep gate で検証する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) preflight runbook | route / custom domain の手動確認手順が確定済み / production deploy 未承認・未実行 | route inventory を機械化する出力契約 |
| 上流 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `bash scripts/cf.sh` 一本化 / `wrangler` 直接実行禁止 / `.env` 実値 Read 禁止 | 全コマンド・全 API call の ラッパー経由統一 |
| 上流 | aiworkflow-requirements `deployment-cloudflare.md` | Cloudflare デプロイ規約 | mutation 禁止 / read-only allowlist の根拠 |
| 上流 | `apps/web/wrangler.toml` `[env.production].name` | production Worker 名 `ubm-hyogo-web-production` | `expectedWorker` 値 |
| 並列 | `scripts/cf.sh` 既存ラッパー | op run / mise exec / ESBUILD_BINARY_PATH 解決済み実行経路 | 唯一の実行入口 |
| 下流 | UT-06 production deploy 承認 | 本仕様 + 別 PR の script 実装 | route inventory snapshot 契約 |
| 下流 | 親 runbook preflight 章 | script 出力フォーマットと呼び出し方法 | preflight 章への script 起動手順追記 (本タスクでは実施せず引き渡しのみ) |

> 上流ブロッカー: 親タスク #246 preflight runbook 完了が前提。Phase 2 / Phase 3 で重複明記する。

## スコープ

### 含むもの
- 要件定義 / 設計 / テスト計画 の Markdown 仕様書作成
- Cloudflare API endpoint の read-only allowlist 確定
- 出力 data shape (TypeScript 型仮設計) と出力ファイル (JSON + Markdown) 契約の確定
- `bash scripts/cf.sh` 経由の実行境界の固定
- secret / OAuth token 漏洩防止の出力規約

### 含まないもの
- script の実装コード生成 (別 PR 責務)
- script の実行 (read-only でも本タスクでは実行しない)
- 親 runbook への追記実施 (引き渡し情報として記録するに留める)
- production deploy 実行 / DNS 切替 / custom domain 付け替え
- 旧 Worker の物理削除 / 無効化 / route 付け替え実行
- secret の新規発行 / 再注入

## 制約 C-1〜C-6

| # | 制約 | 出典 | 順守方法 |
| --- | --- | --- | --- |
| C-1 | `wrangler` 直接実行禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | 仕様書サンプルは全て `bash scripts/cf.sh` 経由。Phase 3 NO-GO grep gate で固定 |
| C-2 | `.env` 実値・OAuth トークンを出力に残さない | CLAUDE.md「禁止事項」 | 出力には key 名・route pattern・target worker name のみ。値は含めない |
| C-3 | `wrangler login` のローカル OAuth 保持禁止 | CLAUDE.md | `op run --env-file=.env` 経由の API Token 注入のみ |
| C-4 | mutation endpoint 呼び出し禁止 (read-only のみ) | AC-4 / 親タスクスコープ境界 | Phase 2 で API endpoint allowlist 表化、`POST` / `PUT` / `PATCH` / `DELETE` は 0 件 |
| C-5 | コード実装を行わない (docs-only) | 本タスク taskType | 成果物は markdown のみ。`scripts/` / `apps/` への変更禁止 |
| C-6 | 親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) preflight runbook 完了が前提 | 親タスク依存 | parent runbook の手動経路を機械化する位置付け。Phase 2 / Phase 3 で重複明記 |

## リスク

| リスク | 対策 |
| --- | --- |
| Cloudflare API token に書き込み権限を要求してしまう | Phase 2 で read-only allowlist 確定し mutation endpoint を仕様書サンプルから完全排除 |
| route の domain 名を仕様書 / 出力に過剰露出する | production public domain 範囲に限定。host 部分マスクオプションを Phase 2 §3 で設計 |
| dashboard 表示と API 表示の粒度が異なる | 出力 entry の `source` フィールド (`api` / `dashboard-fallback`) で取得経路を明示 |
| `wrangler` 直接実行が仕様書 / 将来実装に混入する | `bash scripts/cf.sh` または repository script に統一。Phase 3 NO-GO grep gate で固定 |
| secret 実値 / API Token が出力ファイルに紛れ込む | 出力 schema を「key 名・route 名・worker 名のみ」に固定。Phase 3 NO-GO で grep gate 明記 |
| 親タスク #246 runbook 内容変更で本タスク仕様が乖離 | 依存境界に親タスク GitHub Issue 番号と runbook パスを固定 |

## 不変条件 / 多角的観点

- 不変条件 #5: route / Worker 取得のみ扱い、D1 直接アクセスは `apps/web` 側に開かない。
- AI 学習混入防止: secret 実値・OAuth トークンを仕様書 / 出力例に転記しない。
- rollback 余地: 旧 Worker 処遇判断は親タスク責務。本タスクは検出 (snapshot) のみで実行を伴わない。
