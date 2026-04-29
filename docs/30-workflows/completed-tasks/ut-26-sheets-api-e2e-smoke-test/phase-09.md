# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | specification-design（QA） |

## 目的

Phase 8 までで確定した命名・パス・型・エンドポイントを前提に、free-tier 余裕度（Cloudflare Workers / Google Sheets API / 1Password / Cloudflare Secrets）・secret hygiene・line budget・link 整合・mirror parity・NON_VISUAL governance pattern の 6 観点で品質保証チェックを行い、Phase 10 の GO/NO-GO 判定に必要な客観的根拠を揃える。本タスクは UI を持たないため a11y は対象外と明記する一方、NON_VISUAL タスクとしての governance pattern（CLI / curl / wrangler 出力ログによる証跡が verifier から検証可能であること）は別途チェックする。

## 実行タスク

1. free-tier 見積もりを別ファイル `outputs/phase-09/free-tier-estimation.md` に詳細化する（完了条件: Workers / Sheets API / 1Password / Cloudflare Secrets の 4 サービス × dev/staging 2 環境すべての試算が記述されている。production は対象外）。
2. secret hygiene チェックリストを作成し、`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` の 3 Secret について PR・コミットログ・ローカル `.env` に SA JSON 平文が残らないことを確認する（完了条件: 5 項目チェックすべてが PASS）。
3. line budget を確認する（完了条件: 各 phase-XX.md は原則 100-250 行、詳細テンプレを兼ねる Phase は 350 行以内、index.md は 250 行以内。超過時は Phase 12 で分割候補を記録）。
4. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-XX.md 間のリンク切れが 0）。
5. mirror parity を確認する（完了条件: 本タスクは N/A 判定であることが明記されている）。
6. a11y 対象外を明記し、代わりに NON_VISUAL governance pattern のチェックを行う（完了条件: 「UI を持たないため a11y 対象外」と「CLI/curl/wrangler ログによる証跡が verifier から検証可能」の両方が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-08.md | DRY 化済みの命名・path |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/index.md | Secrets / 関連サービス無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret hygiene 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers / wrangler / 無料枠 |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers 無料枠公式 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota 公式 |
| 参考 | https://developer.1password.com/docs/cli/ | 1Password CLI / Environments |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-09.md | QA 観点参照事例 |

## free-tier 見積もり（サマリー）

詳細は `outputs/phase-09/free-tier-estimation.md` を参照。本仕様書には主要数値のみ記載する。

### Cloudflare Workers（staging 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| smoke 想定実行頻度 | 手動 / 動作確認時のみ | Cron 起動なし |
| 1 日最大想定 | 50 req/day（想定上限） | 開発者の手動疎通確認 |
| 月間最大想定 | 約 1,500 req/month | |
| 無料枠 | 100,000 req/day | |
| 余裕度 | 0.05% | 極めて余裕 |

### Google Sheets API（staging 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 1 smoke あたり request | 2 req（OAuth token + values.get、token cache hit 時は 1 req） | |
| 1 日想定 | 50 smoke × 2 = 100 req（cache hit 時 50 req） | |
| 月間想定 | 約 3,000 req | |
| 無料枠 | 300 req/min/project | per-minute 制約 |
| 余裕度 | 1 分あたり最大 5 req 想定 → 1.7% | 十分 |

### 1Password Environments

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 参照頻度 | `op run --env-file=.env` 実行時のみ | scripts/with-env.sh 経由 |
| 月間 secret reference 解決 | 約 200 回（手動 smoke 時のみ） | |
| 無料枠 | 既存契約内（ユーザー単位課金） | |
| 余裕度 | 既存契約で十分 | |

### Cloudflare Secrets

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Secret 数 | staging に 2〜3 件（`GOOGLE_SHEETS_SA_JSON` / `SMOKE_ADMIN_TOKEN`、`SHEETS_SPREADSHEET_ID` は Variable でも可） | UT-25 で配置済み |
| 無料枠 | per Workers script に複数 Secret 無料 | |
| 余裕度 | 制約なし | |

### dev 環境（`wrangler dev` ローカル）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Workers req/day | 開発者次第（数十程度） | wrangler dev はカウント対象外（ローカル isolate） |
| Sheets API | staging と同 quota 対象（GCP プロジェクト共有） | per-minute 5 req 程度 |
| 対策 | dev 試行頻度を手動制御。token cache を活用し OAuth fetch を最小化 | Phase 5 ランブック参照 |

> **重要**: 本タスクは Cron 起動なしの手動 smoke のため、無料枠超過リスクは事実上ゼロ。production 環境では smoke route が runtime 404 を返すのため production 側は試算対象外。

## secret hygiene チェックリスト

| # | 項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | SA JSON が Cloudflare Secrets / 1Password 経由で注入される | `apps/api/src/routes/admin/smoke-sheets.ts` で `env.GOOGLE_SHEETS_SA_JSON` 参照のみ | コード / .env / git に平文存在 0 |
| 2 | PR description / コミットログに SA JSON / token 平文が残っていない | `git log --all -p \| grep -E 'BEGIN PRIVATE KEY\|service_account'` | 一致行 0 |
| 3 | ローカル `.env` に SA JSON 平文が記述されていない | `.env` を `op://Vault/Item/Field` 参照のみで構成（CLAUDE.md 規約） | 平文値 0 |
| 4 | `wrangler secret list --env staging` で 2 Secret 登録済み | `bash scripts/cf.sh secret list --env staging` | `GOOGLE_SHEETS_SA_JSON` `SMOKE_ADMIN_TOKEN` が並ぶ |
| 5 | `SMOKE_ADMIN_TOKEN` rotation 手順が runbook に記載 | Phase 5 implementation-runbook.md / Phase 12 implementation-guide.md | rotation 手順（generate → put → 1Password 更新 → 旧 token 失効）が 4 ステップで記述 |

### rotation 手順（runbook 抜粋）

```
1. 新トークン生成: openssl rand -hex 32
2. Cloudflare に登録: bash scripts/cf.sh secret put SMOKE_ADMIN_TOKEN --env staging
3. 1Password 更新: UBM-Hyogo / staging vault の SMOKE_ADMIN_TOKEN を新値に更新
4. 旧トークン失効確認: 旧 token で /admin/smoke/sheets を叩き 401 が返ること
```

### Service Account JSON の取り扱い特記事項

- `wrangler secret put` の入力は **対話的に貼り付け**、stdin 経由でのリダイレクトはコマンド履歴に残るため避ける（または `op read` 経由で揮発的に渡す）。
- ログ出力に SA JSON のフィールド（`private_key` / `client_email`）を絶対に含めない。Phase 6 異常系での error log でも `client_email` の domain 部分（`@*.iam.gserviceaccount.com`）程度に留める。
- 改行コード（`\n`）が `wrangler secret put` 経由で破壊されないよう、JSON は 1 行化せず元のまま貼り付ける（または `op` で参照する）。

## a11y 対象外の明記と NON_VISUAL governance pattern

### a11y 対象外

- 本タスクは `apps/api` の admin 限定 smoke route（JSON 入出力）と CLI script のみで構成され、UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は **対象外**。
- 関連の a11y 確認は UI を含むタスク（admin dashboard 系の別 UT）で行う。

### NON_VISUAL governance pattern チェック

artifacts.json `metadata.visualEvidence = NON_VISUAL` のため、視覚的証跡（screenshot 等）の代わりに以下を成立させる。

| # | 項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 証跡が CLI / curl / wrangler ログで取得可能 | Phase 11 manual-smoke-log.md が `curl -i` / `wrangler tail` 出力を貼付 | テキスト証跡が verifier から再検証可能 |
| 2 | 証跡から個人情報・SA JSON が除去 | sample 行は formId 紐付き Sheets の先頭 1〜2 行のサマリー（氏名等は伏字） | PII / Secret 漏洩 0 |
| 3 | 成功時のステータスコード・latency が記録 | 200 OK / latency_ms / sheetTitle / rowCount を `SmokeResult` で出力 | Phase 11 ログに 4 項目すべて存在 |
| 4 | 失敗時の `SmokeErrorKind` が記録 | 401/403/429 のいずれかと階層化された原因仮説（Phase 6 由来） | Phase 11 ログに kind 列が存在 |
| 5 | 再現手順が runbook 化 | Phase 11 troubleshooting-runbook.md に 403 切り分け手順 | 4 段階以上で記述 |

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 191 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 原則 100-250 行 / 詳細テンプレ兼用 Phase は 350 行以内 | 100-350 行 | 全 PASS |
| outputs/phase-XX/*.md | 個別判定（main.md は 200-400 行を目安） | 個別 | 個別チェック |

> 仕様書（phase-XX.md）が 100 行未満の場合は内容不足、250 行超の場合は分割を Phase 10 で検討する。

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/*.md` | 実在確認 |
| 原典 unassigned-task 参照 | `docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/41`（CLOSED） | 200 OK |

## mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の reference を **参照** するのみ）。
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスクは N/A**。
- 仮に Phase 12 documentation 更新時に skill reference を改訂した場合のみ mirror sync 義務が発生する。

## 実行手順

### ステップ 1: free-tier-estimation.md 作成
- 4 サービス × 2 環境（dev / staging）のすべてを表化。production は対象外と明記。

### ステップ 2: secret hygiene 5 項目を outputs/phase-09/main.md に記述
- rotation 手順を 4 ステップで記述。
- PR / commit log / `.env` / wrangler secret list / runbook の 5 項目それぞれの確認方法を固定。

### ステップ 3: line budget 計測
- 各 phase-XX.md の `wc -l` を取り、原則 100-250 行、詳細テンプレ兼用 Phase は 350 行以内を確認する。

### ステップ 4: link 検証
- artifacts.json / index.md / phase-XX.md の path 整合。
- リンク切れ 0 を確認。

### ステップ 5: mirror parity 判定
- 本タスクは N/A と明記。

### ステップ 6: a11y 対象外 + NON_VISUAL governance 記述
- 「UI を持たないため a11y 対象外」を記述。
- 5 項目の NON_VISUAL チェックリストを記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠余裕度・secret hygiene 結果を GO/NO-GO の根拠に使用 |
| Phase 11 | 手動 smoke test 時の secret 確認手順 / NON_VISUAL 証跡要件として再利用 |
| Phase 12 | implementation-guide.md の運用パートに rotation 手順を転記 |
| UT-09 | Sheets quota 試算を同期ジョブの quota 計画に引き渡し |
| UT-10 | `SmokeErrorKind` を error mapping の標準化候補として渡す |

## 多角的チェック観点

- 価値性: free-tier を超えない範囲で疎通確認の再現性を担保できるか。
- 実現性: dev / staging 双方で wrangler / curl による検証が成立するか。
- 整合性: 不変条件 #1（schema 固定回避）/ #5（apps/api 内閉鎖）と Phase 8 DRY 化結果の維持。
- 運用性: rotation 手順が runbook に存在し、誰でも実行できるか。
- 認可境界: 3 Secret すべて Cloudflare Secrets / 1Password で管理され、production 露出なし。
- 無料枠: 4 サービスすべてで月間試算しても余裕があるか。
- Secret hygiene: SA JSON 平文が PR / commit / `.env` / log のいずれにも残らないこと。
- NON_VISUAL governance: 視覚証跡なしでも verifier が再検証可能なテキスト証跡が成立。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | free-tier-estimation.md 作成 | 9 | spec_created | 4 サービス × 2 環境 |
| 2 | secret hygiene 5 項目チェック | 9 | spec_created | 3 Secret + PR/commit/.env |
| 3 | rotation 手順記述 | 9 | spec_created | 4 ステップ |
| 4 | line budget 計測 | 9 | spec_created | 原則 100-250 行 / 詳細テンプレ兼用 Phase は 350 行以内 |
| 5 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 6 | mirror parity 判定 | 9 | spec_created | N/A |
| 7 | a11y 対象外 + NON_VISUAL governance 明記 | 9 | spec_created | 5 項目チェック |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（6 観点） |
| ドキュメント | outputs/phase-09/free-tier-estimation.md | 4 サービス × 2 環境の詳細試算 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] free-tier-estimation.md に 4 サービス × 2 環境（dev / staging）の試算が記載
- [ ] secret hygiene 5 項目すべてが PASS（PR・commit log・`.env` に SA JSON 平文 0）
- [ ] rotation 手順が 4 ステップで記述
- [ ] line budget が全 phase で原則 100-250 行、詳細テンプレ兼用 Phase は 350 行以内
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity が N/A と明記
- [ ] a11y 対象外と NON_VISUAL governance pattern 5 項目が両方明記
- [ ] production 環境への smoke route 露出禁止が再確認

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- free-tier 余裕度が定量化されている
- secret hygiene 5 項目すべてチェック済み
- a11y 対象外 + NON_VISUAL governance が両方明記
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - free-tier 余裕度（Workers 0.05% / Sheets 1.7% / 1Password 既存契約内 / Cloudflare Secrets 制約なし）
  - secret hygiene PASS 結果（特に PR / commit log / `.env` の平文 0）
  - line budget / link 整合 / mirror parity（N/A）
  - a11y 対象外 + NON_VISUAL governance 5 項目 PASS
  - production 露出禁止の最終再確認結果
- ブロック条件:
  - secret hygiene 5 項目に NG が残る
  - link 切れが残る
  - NON_VISUAL governance チェックで証跡再検証性が満たせない
