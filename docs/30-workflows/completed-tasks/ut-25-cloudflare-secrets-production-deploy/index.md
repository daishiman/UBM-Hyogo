# ut-25-cloudflare-secrets-production-deploy - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-25-cloudflare-secrets-production-deploy |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON） |
| ディレクトリ | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy |
| Wave | 1（HIGH） |
| 実行種別 | serial（手動 secret 配置オペレーション） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL（手動 secret 配置オペレーション） |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_secrets_deployment |
| 親タスク | UT-25 |
| 親仕様 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md |
| GitHub Issue | #40 (CLOSED — ユーザー指示によりクローズドのまま仕様書作成) |

## 目的

UT-03 で実装済みの `apps/api/src/jobs/sheets-fetcher.ts` が参照する Cloudflare Workers 環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON`（Google Service Account JSON key）を、staging / production の両 Workers 環境に `wrangler secret put` 経由で配置する。1Password に保管済みの SA JSON key を、シェル履歴汚染と JSON 改行破壊を回避した安全な経路で投入し、`wrangler secret list` で名前確認・UT-26 疎通テストへ引き渡せる状態にする。本ワークフローは Phase 1〜13 のタスク仕様書整備を範囲とし、実 secret 配置は Phase 13 ユーザー承認後の別オペレーションで実施する。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase outputs 骨格（Phase 1〜13 の `outputs/phase-NN/main.md` と Phase 12 必須補助成果物）作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- staging → production の順序固定（staging-first ポリシー）
- `bash scripts/cf.sh` ラッパー経由の固定（`wrangler` 直接実行禁止）
- JSON 改行（`private_key` の `\n`）を破壊しない投入経路の仕様化（`cat sa.json | wrangler secret put` 系）
- シェル履歴汚染防止（`HISTFILE=/dev/null` / `set +o history` / 1Password 参照）
- ローカル開発用 `apps/api/.dev.vars` 設定と `.gitignore` 除外確認
- rollback 経路（`wrangler secret delete` + 旧 key 再投入）の仕様化
- staging / production の `--env` 切替仕様の固定
- 配置完了後の UT-03 runbook 反映ルートの定義

### 含まない

- 実 `wrangler secret put` 投入（Phase 13 ユーザー承認後の別オペレーション）
- Sheets API E2E 疎通確認（UT-26 に分離）
- Sheets→D1 同期ジョブ実装（UT-09 に分離）
- SA JSON key の発行・ローテーション（01c-parallel-google-workspace-bootstrap で完了済み）
- Workers 環境本体の作成（01b-parallel-cloudflare-base-bootstrap で完了済み）
- 平文 `.env` への実値書き込み（CLAUDE.md ローカル `.env` 運用ルールにより禁止）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-03（sheets-auth.ts 実装） | secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` が確定しており、参照側のコードが存在する |
| 上流（必須） | 01c-parallel-google-workspace-bootstrap | SA JSON key が 1Password に保管済み |
| 上流（必須） | 01b-parallel-cloudflare-base-bootstrap | apps/api Workers の staging / production 環境が作成済み |
| 下流 | UT-26（Sheets API E2E 疎通確認） | 配置済み secret を使った疎通検証 |
| 下流 | UT-09（Sheets → D1 同期ジョブ） | secret 配置後に着手可能 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 親タスク仕様（unassigned-task 版） |
| 必須 | apps/api/src/jobs/sheets-fetcher.ts | secret 参照側の実装（UT-03） |
| 必須 | apps/api/wrangler.toml | `--env staging` / `--env production` の宣言 |
| 必須 | scripts/cf.sh | secret injection ラッパー（wrangler 直接実行禁止） |
| 必須 | CLAUDE.md（Cloudflare 系 CLI 実行ルール / シークレット管理） | wrangler ラッパー経由必須・op 経由 secret 注入 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜13 共通骨格 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#secret | wrangler secret コマンドリファレンス |

## 受入条件 (AC)

- AC-1: `bash scripts/cf.sh` ラッパー経由でのみ wrangler を呼び出す経路が仕様化されている（直接 `wrangler` 呼び出し禁止）。
- AC-2: secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` が staging / production の両環境に投入される手順が定義されている（staging-first 順序固定）。
- AC-3: SA JSON 内の `private_key` 改行を壊さずに投入する経路（`cat sa.json | wrangler secret put` または stdin 注入）が仕様化されている。
- AC-4: シェル履歴汚染防止（`HISTFILE=/dev/null` / `set +o history` / 1Password 経由直接 stdin 注入）が手順に組み込まれている。
- AC-5: 投入後 `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で `GOOGLE_SERVICE_ACCOUNT_JSON` の存在が staging / production それぞれで確認される（値は読み取り不可、名前確認のみ）。
- AC-6: ローカル開発用 `apps/api/.dev.vars` の設定手順と `.gitignore` 除外確認が定義されている。
- AC-7: rollback 経路（`bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env <env>` + 旧 key 再投入）が runbook に明記されている。
- AC-8: 配置完了後、UT-03 runbook（または該当 docs）への配置完了記録の反映ルートが定義されている。
- AC-9: 本ワークフローはタスク仕様書整備に閉じ、実 secret 投入は Phase 13 ユーザー承認後の別オペレーションで実施する旨がスコープに明記されている。
- AC-10: 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 で全 PASS 確定している。
- AC-11: Phase 1〜13 の状態が `artifacts.json` の `phases[]` と完全一致している（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック（投入手順スクリプト化） | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke test（staging 投入確認・name 確認） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新（UT-03 runbook 反映） | phase-12.md | pending | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md |
| 13 | PR 作成 / ユーザー承認後 secret 投入 | phase-13.md | pending | outputs/phase-13/main.md / deploy-runbook.md / secret-list-evidence-{staging,production}.txt / rollback-runbook.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所） |
| 設計 | outputs/phase-02/main.md | 投入手順トポロジ / staging→production 順序 / JSON 改行保全経路 / .dev.vars 取扱 / rollback 経路 / wrangler.toml env 切替仕様 |
| レビュー | outputs/phase-03/main.md | 代替案比較（cf.sh vs 直接 wrangler / staging-first vs production-first / .dev.vars vs Cloudflare 単独）と PASS/MINOR/MAJOR 判定 |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api ランタイム / secret 保持 | 無料枠 |
| `wrangler` (via scripts/cf.sh) | secret put / list / delete | 無料 |
| 1Password CLI (`op`) | SA JSON key の安全な取り出し | 既存契約 |
| Google Service Account | Sheets API 認証 | 無料 |

## Secrets 一覧

| 種別 | 名前 | 用途 | 管理場所 |
| --- | --- | --- | --- |
| Cloudflare Workers Secret | `GOOGLE_SERVICE_ACCOUNT_JSON` | apps/api が Sheets API へ署名する Service Account JSON key | Cloudflare Workers Secrets（staging / production）+ 1Password 正本 |
| ローカル | `apps/api/.dev.vars` の `GOOGLE_SERVICE_ACCOUNT_JSON` | ローカル wrangler dev 用 | `.gitignore` 除外確認必須 |

> 値そのものを payload / runbook / log に転記しない。`wrangler secret list` の出力（name のみ）を evidence として保存する。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | secret は `apps/api` 配下のみ。違反なし |
| - | wrangler 直接実行禁止（CLAUDE.md） | `bash scripts/cf.sh` ラッパー経由のみ |
| - | 平文 `.env` 禁止（CLAUDE.md） | `.env` は op 参照のみ。実値は転記しない |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）
- AC-1〜AC-11 が Phase 1〜3 で全件カバー
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 本ワークフローはタスク仕様書整備に閉じ、実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーションで実施する旨を明文化

## 苦戦箇所・知見（親仕様 §苦戦箇所より写経）

**1. インタラクティブ入力 / シェル履歴汚染**
`wrangler secret put` はインタラクティブ or stdin 必要。シェル履歴に値が残ると secret leak。`HISTFILE=/dev/null` / `set +o history` / `op read` からの直接 stdin 注入で対処。

**2. `--env` 切替**
staging / production で `--env staging` / `--env production` を切替えて 2 回投入する。`apps/api/wrangler.toml` の env 宣言を確認し、ラッパー経由で固定する。

**3. JSON `private_key` 改行保全**
JSON key の `private_key` 内には `\n` 改行が含まれる。コピペや echo で投入すると壊れる。`cat sa.json | wrangler secret put` で stdin 経由で投入することで保全する。

**4. 配置後の値読み取り不可**
`wrangler secret list` は name のみ表示し値は読み取れない。機能確認は UT-26 の Sheets API 疎通テストで行う。

**5. `apps/api/.dev.vars` の `.gitignore` 確認**
ローカル開発で `.dev.vars` に SA JSON を置く場合、`.gitignore` 除外を必ず確認。誤コミットすると secret leak。

## 関連リンク

- 上位 README: ../README.md
- 親タスク仕様: ../unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/40
- 連携タスク: UT-03（sheets-auth.ts 実装）/ UT-26（Sheets API E2E）/ UT-09（Sheets→D1 同期）
