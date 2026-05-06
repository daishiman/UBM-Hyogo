# Phase 3: 設計レビュー — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 2 で確定した設計（GitHub Actions 単独経路、TypeScript スクリプト、Slack API 副作用、secret 配置、Block Kit template）に対して、セキュリティ・単一責務・依存方向・テスト容易性・observability・CONST 準拠の各観点でレビューし、Phase 4 以降に持ち越す残課題を確定する。レビュー対象が実装される副作用（外部 API call / secret 取扱い / GitHub workflow）であるため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 3 / 13 |
| wave | 9c-fu |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| レビュー方式 | self-review by Claude Code（solo dev policy: 必須レビュアー数 0 のため代替として本 Phase で自動チェックリスト適用） |

## 目的

Phase 2 設計案を以下の観点でレビューし、PASS / WARN / FAIL を確定する。WARN / FAIL は Phase 4 以降の対応条件として明示する。

## レビュー観点と判定

### A. 単一責務 (SRP)

| # | 観点 | 結果 | 根拠 / 残課題 |
| --- | --- | --- | --- |
| A1 | `postIncidentRunbook` は「Slack に投稿し evidence を返す」単一責務か | PASS | template render は `renderTemplate`、permalink 生成は `buildRunbookPermalink`、evidence 永続化は `saveEvidence` に分離済み |
| A2 | CLI エントリーポイント (argv parse) と純関数が分離されているか | PASS | `slack-incident-runbook.ts` は CLI、`render-template.ts` / `save-slack-evidence.ts` は pure。テスト容易性確保 |
| A3 | `save-slack-evidence.ts` がディレクトリ作成と書き込みを両方持つ | WARN | 単機能だが「dir 作成 + write」を含む。Phase 6 実装時に内部で 1 関数を直列呼び出しに切る (`ensureDir` → `writeFile`) ことで論理的責務を保つ |

### B. 依存方向

| # | 観点 | 結果 | 根拠 |
| --- | --- | --- | --- |
| B1 | `apps/web` から D1 直接アクセス禁止 invariant に違反していないか | PASS | 本タスクは `scripts/` 配下のみ。apps/web 変更なし |
| B2 | `apps/api` の D1 binding を利用しないか | PASS | Slack 配信は GitHub Actions 上で Node プロセスとして完結。Workers binding 不使用 |
| B3 | スクリプトが `apps/*` を import していないか | PASS | `scripts/notify/*` は self-contained。`@slack/web-api` のみ依存 |

### C. テスト容易性

| # | 観点 | 結果 | 根拠 / 残課題 |
| --- | --- | --- | --- |
| C1 | `WebClient` が DI 可能か | WARN → 対応必要 | Phase 2 シグネチャでは `postIncidentRunbook` 内部で `new WebClient(token)`。Phase 6 で `webClient?: WebClient` を optional 引数に追加し、テストで stub を注入する |
| C2 | `git rev-parse HEAD` 実行が mock 可能か | PASS | `commitSha` を opts で override 可能。テストでは固定 SHA を渡す |
| C3 | template render が pure か | PASS | `renderTemplate` は副作用なし。snapshot test 容易 |
| C4 | evidence path がテスト隔離可能か | PASS | `saveEvidence(result, outputDir)` で出力先 inject 可能。tmpdir 利用可 |

### D. Observability

| # | 観点 | 結果 | 根拠 / 残課題 |
| --- | --- | --- | --- |
| D1 | 失敗時の exit code が区別されているか | PASS | 0/1/2/3 で区別。CI で原因切り分け容易 |
| D2 | evidence に `postedAt` (client clock) と `ts` (Slack server clock) の両方が含まれるか | PASS | 時計差分の検証可能 |
| D3 | dryrun / production の区別が evidence に明示されるか | PASS | `mode` フィールドで区別 |
| D4 | log redact が opt-out されない構造か | PASS | console.log/error をモジュール初期化時に置換するため漏れにくい。ただし `process.stdout.write` 直接呼び出しは redact 通らない → 規約として禁止する旨を Phase 5 ランブックに記載 |

### E. Secret hygiene

| # | 観点 | 結果 | 根拠 / 残課題 |
| --- | --- | --- | --- |
| E1 | token が `.env` に実値で書かれない構造か | PASS | `op://` 参照のみ。`scripts/with-env.sh` 経由で揮発注入 |
| E2 | GitHub Actions 上で token が log 出力されないか | PASS | `::add-mask::` を最初の step で付与する設計。`env:` 経由で渡す |
| E3 | bot OAuth scope が最小か | PASS | `chat:write`, `chat:write.public`, `links:read` のみ。`channels:read` / `users:read` は付与しない |
| E4 | 1Password vault item 名がドキュメントに記録されるが値は記録されないか | PASS | `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` の参照のみ |
| E5 | `WebAPICallError.data` 全文を log しないか | PASS | Phase 2 で redact 後 `{ code, error, response_metadata }` のみ log と明記 |

### F. 誤配信ガード

| # | 観点 | 結果 | 根拠 |
| --- | --- | --- | --- |
| F1 | dryrun mode で production channel id が使われないか | PASS | mode の switch を最上位に置き、変数も別経路 (`SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` vs `..._DRYRUN_CHANNEL_ID`) |
| F2 | production への直接実行を構造的に阻止できるか | PASS | GitHub Actions の `needs: dryrun` + `environment: production-slack-delivery` の二重 gate |
| F3 | mode 引数の不正値が即時拒否されるか | PASS | startup で fail-fast (exit 2) |
| F4 | local 開発者が production channel に誤投稿しないか | WARN | local 実行では env 経由で channel id を渡せばどちらにも post 可能。Phase 5 ランブックで「local からは `--mode dryrun` のみ許容」を運用ルール化し、`SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` を local `.env` に **置かない**ことを明記 |

### G. CONST 準拠（CLAUDE.md / プロジェクト不変条件）

| # | 観点 | 結果 | 根拠 |
| --- | --- | --- | --- |
| G1 | 平文 `.env` を commit しない | PASS | `.env` は `op://` 参照のみ |
| G2 | `apps/web` から D1 直接アクセス禁止 | PASS | apps/web 不変更 |
| G3 | `wrangler` 直接実行禁止（`scripts/cf.sh` 経由） | N/A | 本タスクは Cloudflare CLI 不使用 |
| G4 | aiworkflow-requirements indexes 整合 | 引き渡し | Phase 12 で `pnpm indexes:rebuild` を実行し drift 0 を保証 |
| G5 | CODEOWNERS パスへの追加 | PASS | `.github/workflows/**` は CODEOWNERS 対象。本ファイル追加で fallback `@daishiman` が適用される |
| G6 | 線形履歴・branch protection 違反なし | PASS | 通常 PR フローで対応 |

### H. 既存類似 workflow との整合性

| # | 観点 | 結果 | 根拠 |
| --- | --- | --- | --- |
| H1 | `scripts/with-env.sh` を再利用しているか | PASS | local / 手動経路で同 wrapper を利用 |
| H2 | aiworkflow-requirements の `deployment-secrets-management.md` への secret 反映パスが Phase 12 に組み込まれているか | PASS | Phase 1 で出力ファイルとして列挙済み |
| H3 | 09c production deploy 完了 hook を `workflow_run` で繋ぐ慣行と整合 | PASS | 09c 既存 workflow が Actions 上にあるため自然 |

## 代替案の検討（Phase 2 との対比）

| 代替案 | 採否 | 不採用理由 |
| --- | --- | --- |
| Cloudflare Workers Cron Trigger | 不採用 | 「deploy 直後」という event を Cron で表現できず、最大 1 分の遅延と空振りが不可避 |
| Slack Incoming Webhook | 不採用 | webhook URL は URL 自体が secret で rotation コストが高く、`chat.getPermalink` 等の post 後 API も使えない |
| Slack workflow builder | 不採用 | コード・テスト不可、PR レビュー対象にならず governance 上の追跡が困難 |
| 09c production deploy workflow に直接 step として組み込む | 不採用 | 09c の責務が膨らみ SRP 違反。失敗時の retry 粒度も荒くなる |

採用案（独立 workflow + `workflow_run` trigger）を Phase 2 のとおり継続。

## セキュリティレビュー サマリ

- **token redaction**: console 二重置換 + evidence 後段 redact + `::add-mask::` の三層で OK。
- **log マスキング**: `process.stdout.write` 直接呼びは規約で禁止（Phase 5 で明記）。
- **誤配信ガード**: 構造（mode switch + needs + environment）と動作（unit test）の両側で担保。
- **scope 最小化**: 3 scope のみ。`users:read` / `channels:read` 等は付与しない。
- **rotation 手順**: Phase 5 ランブックに記載（1Password rotate → Slack admin revoke → GitHub Secrets 更新の順序）。

## 残課題と Phase 4 への引き渡し

| 課題 | 引き渡し先 | 対応内容 |
| --- | --- | --- |
| `WebClient` の DI 化 | Phase 4 / Phase 6 | `postIncidentRunbook` に `webClient?: WebClient` optional を追加、Phase 4 テストで stub 注入 |
| `save-slack-evidence.ts` 内部分割 | Phase 6 実装時 | `ensureDir` / `writeJson` の 2 関数に内部分割 |
| local 経由での誤配信防止運用ルール | Phase 5 ランブック | `.env` に production channel id を置かない、`--mode production` を local で実行しない |
| `process.stdout.write` 直接呼び禁止 | Phase 5 ランブック | コーディング規約として明記 |
| permalink 取得失敗時の運用 | Phase 4 / Phase 11 | `permalink: null` で evidence を残し、Phase 11 で手動再取得手順を補完 |
| aiworkflow-requirements indexes 反映 | Phase 12 | `deployment-secrets-management.md` に secret 名追記 → `pnpm indexes:rebuild` |

## レビュー判定サマリ

| 観点群 | 件数 | PASS | WARN | FAIL |
| --- | --- | --- | --- | --- |
| A. SRP | 3 | 2 | 1 | 0 |
| B. 依存方向 | 3 | 3 | 0 | 0 |
| C. テスト容易性 | 4 | 3 | 1 | 0 |
| D. Observability | 4 | 4 | 0 | 0 |
| E. Secret hygiene | 5 | 5 | 0 | 0 |
| F. 誤配信ガード | 4 | 3 | 1 | 0 |
| G. CONST 準拠 | 6 | 5 | 0 | 0 (G4 は引き渡し) |
| H. 既存整合性 | 3 | 3 | 0 | 0 |
| **合計** | **32** | **28** | **3** | **0** |

FAIL 0 件のため Phase 4 へ進行可能。WARN 3 件は上記「残課題」表で明示的に Phase 4/5/6 に引き渡し済み。

## 参照資料

- `phase-01.md` / `phase-02.md`
- `index.md` / `artifacts.json`
- CLAUDE.md（不変条件・secret 管理・branch protection）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-03.md`（フォーマット参照）

## サブタスク管理

- [ ] 観点 A〜H すべての判定を埋める
- [ ] 残課題を Phase 4/5/6/12 に引き渡す
- [ ] `outputs/phase-03/main.md` 作成

## 成果物

- `outputs/phase-03/main.md`

## Definition of Done（Phase 3）

- [ ] 8 観点群 32 項目の判定が PASS / WARN / FAIL のいずれかで埋まっている
- [ ] FAIL 0 件である（FAIL ありの場合は Phase 4 進行不可）
- [ ] WARN 項目すべてに引き渡し先 Phase が記載されている
- [ ] 採用案 / 不採用案の表が更新されている
- [ ] セキュリティレビュー（token redaction / 誤配信 / scope）の結論が記載されている
- [ ] `outputs/phase-03/main.md` にサマリが保存されている

## 次 Phase への引き渡し

Phase 4 へ:
- WebClient DI 化を前提としたテスト戦略
- 誤配信ガード（mode switch / channel id 独立性）の unit test 必要項目
- evidence JSON schema を expected として再利用するテストケース
- permalink 取得失敗時の挙動（`permalink: null` と exit 0）の expected
