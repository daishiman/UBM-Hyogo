# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| Wave | 2-plus（親 UT-06-FU-A-PROD-ROUTE-SECRET-001 のフォローアップ） |
| 実行種別 | serial（production deploy 承認の前段にある split-brain 検出仕様） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | docs-only / infrastructure-automation（script 設計のみ。実装は別 PR） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) |

## 目的

UT-06-FU-A-PROD-ROUTE-SECRET-001 の runbook で定義された Worker 名 split-brain 検証チェックリストのうち、**route / custom domain の対象 Worker 一致確認**が現状 Cloudflare ダッシュボード手順に依存しており、機械的に snapshot を取得・比較できない。本 Phase ではこの不足を埋めるための **read-only な production Worker route inventory script** の要件を、Phase 2 が一意に設計を書き起こせる粒度で固定する。

実装作業ではなく、**script の出力契約（JSON / Markdown 形式）・安全境界（read-only / secret 漏洩防止）・呼び出し境界（`bash scripts/cf.sh` 一本化）** を要件レベルで確定する。実装そのものは本タスクの範囲外であり、別 PR で扱う。

## 真の論点 (true issue)

- 「script を作る」ではなく、**「production deploy 承認の前に route → Worker target を機械的に snapshot して、旧 Worker と `ubm-hyogo-web-production` の split-brain を 0 にする出力契約を固定すること」** が本タスクの本質である。
- 副次的論点として、Cloudflare API token に書き込み権限を要求しないこと（read-only scope のみで完結すること）と、`wrangler` 直接実行を一切混入させないこと（CLAUDE.md `Cloudflare 系 CLI 実行ルール`）を保証する。
- 本タスクは script の **設計のみ** 行う。実装・実行・runbook 配線（親 runbook からの導線追加）はそれぞれ別 PR / 後続 Phase の責務であり、本タスクではコード生成を行わない。
- production deploy 自体・DNS 切替・旧 Worker 削除・route 付け替え実行は全て対象外。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は仕様書（Markdown）と script 出力契約のみ。UI スクリーンショット対象なし |
| 成果物の物理形態 | テキスト（Markdown） | `outputs/phase-XX/*.md` および将来的な script 出力例（JSON / Markdown 雛形） |
| 検証方法 | doc レビュー / API endpoint allowlist 表との突合 / `bash scripts/cf.sh whoami` による read-only 認証確認 | Phase 11 で NON_VISUAL evidence として手動 walk-through 相当を実施 |

artifacts.json の `metadata.visualEvidence` を `NON_VISUAL` で確定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) production preflight runbook | 親タスクで route / custom domain の **手動** 確認手順が確定済み（ダッシュボード参照を正本としている状態）/ production deploy が **未承認・未実行** であること | route inventory を機械化する出力契約（本タスク） |
| 上流 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `bash scripts/cf.sh` ラッパー一本化方針 / `wrangler` 直接実行禁止 / `.env` 実値の Read 禁止 | 全コマンド・全 API call の ラッパー経由統一 |
| 上流 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare デプロイ規約 | 整合性確認の参照点（mutation 禁止 / read-only allowlist の根拠） |
| 上流 | `apps/web/wrangler.toml` `[env.production].name = "ubm-hyogo-web-production"` | production Worker 名の正本 | inventory が突合対象とする `expectedWorker` 値 |
| 並列 | `scripts/cf.sh`（既存ラッパー） | op run / mise exec / ESBUILD_BINARY_PATH 解決済みの実行経路 | 本タスク script の唯一の実行入口 |
| 下流 | UT-06 production deploy 承認 | 本タスク仕様（Phase 11 まで完了）+ 別 PR の script 実装 | deploy 承認の前提となる route inventory snapshot 契約 |
| 下流 | 親 runbook `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md`（runbook 追記） | 本タスク script の出力フォーマットと呼び出し方法 | preflight 章への script 起動手順追記（本タスクでは追記実行は行わず、Phase 11 の引き渡し情報として残す） |

> **上流ブロッカー（重複明記 1/3）**: 親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) の production preflight runbook が完了し、route 検証の **手動経路** が確定していることが本タスク前提条件。これは Phase 2（設計の依存順序）と Phase 3（NO-GO 条件）でも重複明記する。

## 受入基準（AC-1〜AC-5）

- **AC-1**: route / custom domain inventory が JSON ファイルと Markdown ファイルの両形式で出力され、各 entry に最低限以下 4 フィールドを含む。
  - `route pattern`（例: `members.example.com/*`）
  - `target worker name`（例: `ubm-hyogo-web-production`）
  - `zone`（zone 名または zone ID）
  - `source`（取得経路。`api` または `dashboard-fallback` のいずれか）
- **AC-2**: `expectedWorker = "ubm-hyogo-web-production"` を指さない route / custom domain は、出力の `mismatches` 配列として entries 本体とは分離して出力される。`mismatches` が 0 件であることが production deploy 承認の前提となる契約を仕様書に明記する。
- **AC-3**: secret 値・Cloudflare API Token・OAuth Token が、script 出力ファイル（JSON / Markdown）・標準出力・標準エラー・コミット対象のいずれにも一切現れない。検証は `grep` gate（output ファイルおよびログに対して既知 token prefix / 値パターンが含まれないこと）で行う仕様を Phase 3 NO-GO 条件として固定する。
- **AC-4**: script は完全に read-only であり、Cloudflare API の mutation endpoint（`POST` / `PUT` / `PATCH` / `DELETE`）を一切呼ばない。検証はコードレビューと **API endpoint allowlist**（Phase 2 §2 で表化）で行う。
- **AC-5**: script 実行は `bash scripts/cf.sh` ラッパー経由でのみ完結し、`wrangler` 直接呼び出し・`wrangler login`・`.env` 実値の Read を一切含まない。検証はコードレビューと grep gate（`wrangler ` の直接呼び出しが script ソースに存在しないこと）で行う。

## 実行タスク

1. 真の論点（split-brain 検出のための機械的 snapshot 出力契約の固定）と visualEvidence (NON_VISUAL) を確定する。
2. 受入基準 AC-1〜AC-5 を Phase 2 設計と Phase 3 テスト計画が一意に展開できる粒度に固定する（出力フィールド・mismatch 分離・secret hygiene・read-only 境界・wrapper 一本化）。
3. 本タスクで実行しない範囲（script 実装コード生成・実行・runbook 追記実行・production deploy・DNS 切替・旧 Worker 削除）を明示し、依存境界に分離する。
4. Phase 2 以降へ引き渡す依存境界・スコープ境界・上流ブロッカーを記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | AC-1〜AC-5 を設計入力にし、API endpoint allowlist / data shape / output writer / secret mask の 4 concern に分解する |
| Phase 3 | NO-GO 条件として mutation endpoint 検出 / secret 値検出 / `wrangler` 直接呼び出しの 3 軸を固定 |
| Phase 4 | docs-only でも残す type 定義 / contract test（出力 JSON schema 検証）の観点設計 |
| Phase 7 | API endpoint allowlist と実 script 実装の突合（別 PR の実装側で実行） |
| Phase 11 | NON_VISUAL evidence として `bash scripts/cf.sh whoami` 実行ログ（アカウント名のみ）と script 出力例（mock JSON / Markdown）を記録 |
| Phase 12 | 親 runbook への script 起動手順追記タスクを unassigned-task として検出 |

## 多角的チェック観点

- **不変条件 #5**: 本タスクは route / Worker 取得のみ扱い、D1 へのアクセスを `apps/web` 側に開くことを要求しない。
- **CLAUDE.md ルール**: 全コマンドが `bash scripts/cf.sh` 経由か。`wrangler` 直接実行が仕様書サンプルに混入していないか。`.env` 実値の Read を要求していないか。
- **read-only 境界**: 仕様書サンプル / 設計 API allowlist のいずれにも mutation endpoint が含まれていないか。
- **secret 漏洩防止**: 出力ファイル / ログに値が含まれない設計か。grep gate が Phase 3 で固定されているか。
- **AI 学習混入防止**: secret 実値・OAuth トークンを仕様書 / 出力例に転記しない原則が反映されているか。
- **rollback 余地**: 旧 Worker の処遇判断は親タスク責務であり、本タスクは検出（snapshot）のみで実行を伴わないか。
- **スコープ境界**: production deploy 実行 / DNS 切替 / 旧 Worker 削除 / route 付け替え実行を **含まない** 旨が明示されているか。

## サブタスク管理

本タスクは設計のみ（docs-only）のため、サブタスクは以下 1 階層に閉じる:

| # | サブタスク | 所属 Phase | 完了条件 |
| --- | --- | --- | --- |
| ST-1 | AC-1〜AC-5 の文言確定 | Phase 1 | 5 件すべて Phase 2 / Phase 3 が一意に参照可能 |
| ST-2 | API endpoint allowlist 表化（read-only のみ） | Phase 2 | 3 endpoint が確定し mutation 0 件 |
| ST-3 | data shape 型定義（TypeScript 仮型） | Phase 2 | `RouteInventoryEntry` / `InventoryReport` 型が記載 |
| ST-4 | output writer / secret mask 設計 | Phase 2 | JSON / Markdown 出力先と grep gate 条件が記載 |
| ST-5 | NO-GO 条件確定 | Phase 3 | mutation 検出 / secret 検出 / wrangler 検出 の 3 軸 |

## スコープ

### 含むもの

- production Worker route inventory script の **要件定義 / 設計 / テスト計画** の Markdown 仕様書作成
- Cloudflare API endpoint の read-only allowlist 確定
- 出力データ shape（TypeScript 型仮設計）と出力ファイル（JSON + Markdown）契約の確定
- `bash scripts/cf.sh` 経由の実行境界の固定
- secret / OAuth token 漏洩防止の出力規約

### 含まないもの

- script の **実装コード生成**（別 PR 責務）
- script の **実行**（read-only であっても本タスクでは実行しない）
- 親 runbook への **追記実施**（Phase 11 で引き渡し情報として記録するに留める）
- production deploy 実行
- DNS 切替 / custom domain の付け替え
- 旧 Worker の物理削除 / 無効化
- route の付け替え実行
- secret の新規発行 / 再注入

## 制約

| # | 制約 | 出典 | 順守方法 |
| --- | --- | --- | --- |
| C-1 | `wrangler` 直接実行禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | 仕様書内サンプルコマンドはすべて `bash scripts/cf.sh` 経由。Phase 3 NO-GO 条件に grep gate を固定 |
| C-2 | `.env` 実値・OAuth トークンを出力に残さない | CLAUDE.md「禁止事項」 | 出力 JSON / Markdown には key 名・route pattern・target worker name のみ。値は含めない設計 |
| C-3 | `wrangler login` のローカル OAuth 保持禁止 | CLAUDE.md `Cloudflare 系 CLI 実行ルール` | `op run --env-file=.env` 経由の API Token 注入のみを使用（`scripts/cf.sh` の責務） |
| C-4 | mutation endpoint 呼び出し禁止（read-only のみ） | 本タスク AC-4 / 親タスクスコープ境界 | Phase 2 で API endpoint allowlist を表化し、`POST` / `PUT` / `PATCH` / `DELETE` を 0 件とする |
| C-5 | コード実装を行わない（docs-only） | 本タスク taskType | 成果物は markdown のみ。`scripts/` / `apps/` への変更禁止 |
| C-6 | 親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) の preflight runbook 完了が前提 | 親タスク依存 | 本タスクは parent runbook の手動経路を機械化する位置付け。Phase 2 / Phase 3 で重複明記 |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Cloudflare API token に書き込み権限を要求してしまう | Phase 2 で read-only allowlist を確定し、mutation endpoint を仕様書サンプルから完全排除する |
| route の domain 名を仕様書 / 出力に過剰露出する | production public domain として既知の範囲に限定し、必要なら host 部分マスクオプションを Phase 2 §3 で設計する |
| dashboard 表示と API 表示の粒度が異なる | 出力 entry の `source` フィールド（`api` / `dashboard-fallback`）で取得経路を明示する |
| `wrangler` 直接実行が仕様書 / 将来実装に混入する | すべて `bash scripts/cf.sh` または repository script 経由に統一し、Phase 3 NO-GO 条件で grep gate を固定 |
| secret 実値 / API Token が出力ファイルに紛れ込む | 出力 schema を「key 名・route 名・worker 名のみ」に固定し、Phase 3 で grep gate を NO-GO 条件として明記 |
| 親タスク #246 の runbook 内容が後日変更され、本タスク仕様が乖離する | 依存境界に親タスク GitHub Issue 番号と runbook パスを固定し、Phase 2 §設計範囲で参照点を明示 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 主成果物 | `outputs/phase-01/requirements.md` | 真の論点 / AC-1〜AC-5 / スコープ / 制約 / リスク baseline |
| 主成果物 | `outputs/phase-01/spec-extraction-map.md` | 原典 unassigned-task spec → 本 Phase 1 セクションへの抽出マッピング |
| 主成果物 | `outputs/phase-01/acceptance-criteria.md` | AC-1〜AC-5 を Phase 2 / Phase 3 が独立に参照できる単票形式に展開 |
| メタ | artifacts.json | Phase 1 状態の更新（`status: spec_created`、`metadata.visualEvidence: NON_VISUAL`、`metadata.taskType: docs-only`） |

## 完了条件チェックリスト

- [ ] artifacts.json の `metadata.visualEvidence` が `NON_VISUAL` で確定している
- [ ] artifacts.json の `metadata.taskType` が `docs-only`、`docsOnly: true` で確定している
- [ ] 真の論点が「script を作る」ではなく「split-brain を 0 にする出力契約の固定」に再定義されている
- [ ] 依存境界表に上流 4 / 並列 1 / 下流 2 がすべて前提と出力付きで記述されている
- [ ] AC-1〜AC-5 が原典 unassigned-task spec の検証方法・完了条件と整合している
- [ ] スコープ（含む / 含まない）が原典 §2.3 相当の境界と一致している
- [ ] 制約 C-1〜C-6 に CLAUDE.md `Cloudflare 系 CLI 実行ルール` が反映されている
- [ ] 上流ブロッカー（親タスク #246 preflight 完了）が前提条件として明記されている
- [ ] リスク表にトークン権限・domain 露出・dashboard/API 粒度差・wrangler 混入・secret 漏洩の 5 件が含まれる
- [ ] 不変条件 #5（D1 直接アクセスは apps/api に閉じる）に違反する設計を要求していない

## タスク100%実行確認チェックリスト

- [ ] メタ情報表が完備（タスク名 / Phase 番号 / 状態 / タスク分類 / visualEvidence / GitHub Issue / 作成日）
- [ ] 真の論点が 1 行で要約可能な粒度に絞られている
- [ ] visualEvidence の確定表に「項目 / 値 / 根拠」3 列が揃っている
- [ ] 依存境界 / 受入基準 AC-1〜AC-5 / 実行タスク 1〜4 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / 次 Phase 引き継ぎ がすべて記述されている
- [ ] aiworkflow-requirements との整合（`bash scripts/cf.sh` 強制 / read-only / secret 漏洩防止）が本 Phase で重複明記されている
- [ ] 上流ブロッカーが Phase 1 前提条件として記述され、Phase 2 / Phase 3 でも再記述する旨が明記されている

## 次 Phase への引き継ぎ事項

- 真の論点 = production deploy 承認前に route → Worker target を機械的に snapshot し、旧/新 Worker split-brain を 0 にする出力契約を固定する
- AC-1〜AC-5 を Phase 2 設計の入力とし、4 concern（Cloudflare API call layer / Inventory data shape / Output writer / Safety boundary）に分解する
- 全 Cloudflare API call は `bash scripts/cf.sh` ラッパー経由。`wrangler` 直接呼び出し禁止
- Phase 2 では API endpoint allowlist（read-only のみ・3 endpoint 想定）を表化する
- Phase 3 では NO-GO 条件として mutation 検出 / secret 検出 / `wrangler` 検出 の 3 軸を固定する
- 上流ブロッカー（親タスク #246 preflight 完了）を Phase 2 依存順序 / Phase 3 NO-GO 条件で重複明記する
- ブロック条件:
  - taskType が `docs-only` 以外で誤記載
  - visualEvidence が `NON_VISUAL` 以外で誤確定
  - AC-1〜AC-5 が原典 unassigned-task spec から乖離
  - `wrangler` 直接実行が仕様書サンプルに混入
  - mutation endpoint が allowlist に含まれる設計
