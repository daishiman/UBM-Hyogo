# ut-27-github-secrets-variables-deployment - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-27-github-secrets-variables-deployment |
| タスク名 | GitHub Secrets / Variables 配置実行 |
| ディレクトリ | docs/30-workflows/ut-27-github-secrets-variables-deployment |
| Wave | 1 |
| 実行種別 | serial（UT-05 / UT-28 / 01b 完了後の単独 PR） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL（GitHub governance / secrets 配置） |
| visualEvidence | NON_VISUAL |
| scope | github_secrets_variables_cd_enablement |
| implementation_mode | new |
| 親仕様 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md |
| GitHub Issue | #47 |

## 目的

`backend-ci.yml` / `web-cd.yml` の `deploy-staging` / `deploy-production` ジョブが参照する Cloudflare 認証情報（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）、Cloudflare Pages プロジェクト名（`CLOUDFLARE_PAGES_PROJECT`）、Discord Webhook URL（`DISCORD_WEBHOOK_URL`）を GitHub の Secrets / Variables に配置し、`dev` / `main` ブランチへの push をトリガーとした CD ワークフローを実稼働状態に移行する。CD 配線（UT-05）と Cloudflare Pages プロジェクト命名（UT-28）と API Token 発行（01b）が完成しても、GitHub 側に値が存在しなければ deploy ジョブ全体が空振りに終わるため、配置タスクを独立 PR として未タスク化する。本ワークフローは Phase 1〜13 のタスク仕様書整備に閉じ、実 secret 配置（`gh secret set` / `gh variable set` / `gh api` の environment 作成）は Phase 13 ユーザー承認後の別オペレーションで実施する。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase outputs 骨格（Phase 1〜13 の `outputs/phase-NN/main.md` と NON_VISUAL / Phase 12 必須補助成果物）作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- 上流タスク（UT-05 / UT-28 / 01b）完了確認 inventory の Phase 1 への記録
- repository-scoped vs environment-scoped 配置決定マトリクスの仕様化
- Secret 一覧（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL`）と最小スコープの明文化
- Variable 一覧（`CLOUDFLARE_PAGES_PROJECT`）と Variable 化理由の明文化
- 1Password Environments → GitHub Secrets / Variables 同期手順の運用ドキュメント化方針
- `gh` CLI コマンド草案（`gh secret set` / `gh variable set` / `gh api repos/.../environments/...`）の仕様レベル定義
- 動作確認手順（`dev` push → `backend-ci.yml` deploy-staging green / `web-cd.yml` deploy-staging green / Discord 通知）の仕様化
- API Token 最小スコープ方針（Pages Edit / Workers Scripts Edit / D1 Edit / Account Read のみ）
- secret 値の取り扱い禁止事項（payload・runbook・ログへの転記禁止）

### 含まない

- ワークフローファイル自体の編集（UT-05 のスコープ）
- Cloudflare 側の API Token 発行手順そのもの（01b / UT-05 で完了想定）
- Cloudflare Pages プロジェクト命名作業（UT-28 のスコープ）
- `apps/api` / `apps/web` のランタイムシークレット（Cloudflare Secrets 側）
- 本番デプロイの実行（UT-06 の責務）
- 実 `gh secret set` / `gh variable set` / `gh api` の実行（Phase 13 ユーザー承認後の別オペレーション）
- 1Password 側の Vault 構造変更（既存 1Password Environments を正本として利用）
- `op` サービスアカウント化（将来タスク。本タスクは方針言及のみ）
- 自動 commit / push / PR 発行

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-05（CI/CD パイプライン実装） | 参照される Secrets / Variables のキー名・スコープが workflow 側で確定していること |
| 上流（必須） | UT-28（Cloudflare Pages プロジェクト作成） | `CLOUDFLARE_PAGES_PROJECT` の値が UT-28 で命名確定する |
| 上流（必須） | 01b-parallel-cloudflare-base-bootstrap | API Token 発行 / Account ID 取得の前提作業 |
| 関連 | CLAUDE.md「シークレット管理」 | 1Password Environments を正本とする運用ポリシー |
| 関連 | UT-25（Cloudflare Secrets / Service Account JSON deploy） | Cloudflare Secrets 側との責務境界 |
| 下流 | UT-06（本番デプロイ実行） | Secrets が揃わないと本番 deploy 自体が走らない |
| 下流 | UT-29（CD 後スモーク） | スモーク URL の組み立てに `CLOUDFLARE_PAGES_PROJECT` を再利用する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | 親タスク仕様（写経元） |
| 必須 | .github/workflows/backend-ci.yml | 参照する Secrets / Variables キーの確認 |
| 必須 | .github/workflows/web-cd.yml | 参照する Secrets / Variables キーの確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CI/CD 仕様（Secrets 要件）の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 配置マトリクスの正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | ローカル正本（1Password）と GitHub の同期方針 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI 実行ルール） | 1Password 運用ポリシー / `scripts/cf.sh` 思想 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 参考 | docs/30-workflows/unassigned-task/UT-05-cicd-pipeline-implementation.md | CI/CD ワークフロー本体タスクとの境界確認 |
| 参考 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | `CLOUDFLARE_PAGES_PROJECT` の値確定タスク |
| 参考 | https://docs.github.com/en/rest/actions/secrets | GitHub Actions Secrets REST API |
| 参考 | https://docs.github.com/en/rest/actions/variables | GitHub Actions Variables REST API |
| 参考 | https://docs.github.com/en/rest/deployments/environments | GitHub Environments REST API |

## 受入条件 (AC)

- AC-1: `CLOUDFLARE_API_TOKEN` が必要スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）で配置される手順が仕様化されている。
- AC-2: `CLOUDFLARE_ACCOUNT_ID` の配置先（repository-scoped vs environment-scoped）と配置手順が仕様化されている。
- AC-3: `DISCORD_WEBHOOK_URL` の配置手順が仕様化され、運用判断で未設定の場合の取り扱い（CI が落ちないこと）が明記されている。
- AC-4: `CLOUDFLARE_PAGES_PROJECT` が **Variable**（Secret ではない）として配置される設計理由（CI ログでマスクされない / suffix 連結の可視性）が明文化されている。
- AC-5: GitHub Environments の `staging` / `production` を作成する手順が `gh api repos/.../environments/...` ベースで仕様化されている。
- AC-6: repository-scoped vs environment-scoped の配置決定マトリクスが Secret / Variable ごとに記述されている。
- AC-7: `dev` ブランチへの push で `backend-ci.yml` の `deploy-staging` が成功することを確認する手順が定義されている。
- AC-8: `dev` ブランチへの push で `web-cd.yml` の `deploy-staging` が成功することを確認する手順が定義されている。
- AC-9: Discord 通知が成功すること、または `DISCORD_WEBHOOK_URL` 未設定時に CI 全体が落ちないことを確認する手順が定義されている。
- AC-10: 1Password Environments と GitHub Secrets / Variables の同期手順（手動同期 + 将来の `op` サービスアカウント化方針）が運用ドキュメント追記方針として記述されている。
- AC-11: 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 の双方で PASS 確認されている。
- AC-12: 上流タスク（UT-05 / UT-28 / 01b）完了確認が Phase 1（前提）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記されている。
- AC-13: secret / token 値が一切 payload / runbook / ログ / Phase outputs に転記されない方針が明文化されている。
- AC-14: `if: ${{ always() && secrets.X != '' }}` の評価不能問題に対する代替設計（env で受けてシェルで空文字判定）が動作確認項目で扱われている。
- AC-15: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed` / Phase 4〜13 = `pending`。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック（gh CLI コマンド系列 / environment 作成） | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke test（dev push → CD green / Discord 通知 / 未設定耐性） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md |
| 13 | PR 作成 / ユーザー承認後 secret 配置実行 | phase-13.md | pending | outputs/phase-13/main.md / apply-runbook.md / op-sync-runbook.md / verification-log.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所 / NON_VISUAL 明記 / 上流 carry-over inventory） |
| 設計 | outputs/phase-02/main.md | 配置トポロジ / repository vs environment スコープ決定マトリクス / Secret 一覧 / Variable 一覧 / 1Password 同期手順 / `gh` CLI コマンド草案 / 動作確認手順 / API Token 最小スコープ |
| レビュー | outputs/phase-03/main.md | 代替案比較（gh CLI / GitHub UI / Terraform GitHub Provider）/ PASS/MINOR/MAJOR 判定 / 着手可否ゲート / 上流タスク完了確認チェックポイント / リスクと緩和策 |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| GitHub Actions Secrets / Variables | CD パイプラインへの値供給 | 無料枠 |
| GitHub Environments（staging / production） | environment-scoped 値の上書き / deployment ログ分離 | 無料枠 |
| `gh` CLI | secret / variable / environment 操作の正規経路 | 無料 |
| 1Password Environments | secret 値の正本（ローカル / CI 同期元） | 既存契約 |
| Cloudflare API Token | Pages Deploy / Workers Deploy / D1 マイグレーション | 無料枠（Cloudflare 側） |
| Discord Webhook | CI 結果通知 | 無料 |
| GitHub Issue #47 | 本タスクの追跡 | 無料 |

## Secrets 一覧

| 種別 | 名前 | 用途 | スコープ案 | 管理場所 |
| --- | --- | --- | --- | --- |
| Cloudflare API Token | `CLOUDFLARE_API_TOKEN` | Pages / Workers / D1 のデプロイ | environment-scoped（staging / production 別 token 推奨） | 1Password Environments → GitHub Secrets（手動同期） |
| Cloudflare Account ID | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare API のアカウント識別 | repository-scoped（staging / production 同一アカウントのため） | 1Password Environments → GitHub Secrets |
| Discord Webhook URL | `DISCORD_WEBHOOK_URL` | CI 結果通知 | repository-scoped（チャンネル分離が必要なら environment-scoped） | 1Password Environments → GitHub Secrets |
| GitHub Token | `GH_TOKEN`（または `gh auth login` の OAuth トークン） | secret / variable / environment の PUT に必要な `actions:write` / `administration:write` | 実行者ローカル | `gh auth login`（リポジトリには記録しない） |

> 本タスクで導入する**新規 Secret は 3 件**（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL`）。値は payload / runbook / Phase outputs に**一切転記しない**。

## Variables 一覧

| 名前 | 用途 | スコープ案 | 値の確定元 |
| --- | --- | --- | --- |
| `CLOUDFLARE_PAGES_PROJECT` | `web-cd.yml` の `--project-name=${{ vars.X }}-staging` / `${{ vars.X }}` suffix 連結 | repository-scoped（staging suffix で派生）または environment-scoped（projects 別命名なら） | UT-28 で確定したプロジェクト名 |

> Secret ではなく Variable とする理由: 機密情報ではない / CI ログでマスクされず suffix 連結結果を視認できる / デバッグ性が高い（親仕様 §「`CLOUDFLARE_PAGES_PROJECT` を Secret ではなく Variable にする理由」）。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | D1 を触らない（CD 配線への secret 配置のみ）。違反なし |
| - | CLAUDE.md「ローカル `.env` には実値を絶対に書かない」 | secret 値は payload / runbook / Phase outputs に転記しない方針で整合 |
| - | CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」 | 本タスクは GitHub 側操作（`gh` CLI）であり対象外。Cloudflare 側操作は別タスク（UT-25 等）へ分離 |
| - | CLAUDE.md「API Token 値・OAuth トークン値を出力やドキュメントに転記しない」 | AC-13 として明文化 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）
- AC-1〜AC-15 が Phase 1〜3 で全件カバー
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 上流タスク（UT-05 / UT-28 / 01b）完了確認が必須前提として 3 箇所（Phase 1 / 2 / 3）で重複明記
- 本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実 secret 配置は Phase 13 ユーザー承認後の別オペレーションで実施する旨を明文化

## 苦戦箇所・知見（親仕様 §「苦戦箇所・知見」写経）

**1. Environments スコープと repository スコープの違い**
`backend-ci.yml` の `deploy-staging` ジョブは `environment: name: staging` を宣言しており、environment-scoped secret/variable が同名 repository-scoped を上書きする。staging だけ別 Cloudflare Account にしたい場合に repository-scoped に値を入れていると意図せず production 値が staging で参照される事故が起きる。**Environments 側に明示配置を既定**とすることで事故が減る。

**2. `CLOUDFLARE_PAGES_PROJECT` を Secret ではなく Variable にする理由**
機密ではないプロジェクト名で、`web-cd.yml` の中で `${{ vars.X }}-staging` のように suffix 連結に使用される。Secret 化すると CI ログがマスクされて運用ログから値を追えなくなり、デバッグ性が著しく落ちる。Variable は repository / environment / organization の 3 層を持つため、environment-scoped variable に置く案も含めて配置層を最初に決め切る。

**3. `if: secrets.X != ''` が GitHub では評価できない問題**
既存 `backend-ci.yml` / `web-cd.yml` の通知ステップは `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` と書かれているが、GitHub Actions は job-level の `secrets` コンテキストを `if` で直接条件評価できないことがあり意図通りに動かないケースがある。実装上は **「常に通知ステップに入って env で受け、シェル側で空文字判定して early-return」**に逃がす。本タスクでは Webhook URL 未設定時に CI が無音失敗しないことを動作確認項目に加える。

**4. 1Password Environments を正本にする運用**
ローカル開発者は 1Password Environments を引いて使うのが正本フローだが、GitHub Actions ランナーから 1Password を引くには `op` サービスアカウント or `1password/load-secrets-action` の導入が必要。MVP 段階では「1Password が正本・GitHub Secrets は手動同期コピー」を許容し、将来的に `op` 化する旨を運用ルールに残す。**「同期されたか」の検証手段（ハッシュ照合 or Last-Updated メモ）**を運用ドキュメントに残しておくと、値ローテーション時の事故を防げる。

**5. `CLOUDFLARE_API_TOKEN` のスコープ最小化**
User API Token を発行する際に Global API Key を流用するのは厳禁。最低限必要なスコープは `Account.Cloudflare Pages.Edit` / `Account.Workers Scripts.Edit` / `Account.D1.Edit` / `Account.Account Settings.Read` 程度。スコープを広げ過ぎると漏洩時の影響範囲が拡大する。Token 名にも用途・発行日を含め、ローテーション履歴を追えるようにする。

**6. secret 値の二重正本リスク（1Password vs GitHub Secrets）**
1Password が正本で GitHub Secrets はコピーである旨を明記しないと、GitHub UI 側の値が事実上の正本化して 1Password 側が古くなる drift が起きる。**「正本は 1Password、GitHub Secrets は派生コピー」**と運用ドキュメントに明記し、ローテーション時は必ず 1Password から書き戻す手順に固定する。

## 関連リンク

- 上位 README: ../README.md
- 親タスク仕様: ../unassigned-task/UT-27-github-secrets-variables-deployment.md
- 関連タスク仕様（unassigned-task 配下）:
  - ../unassigned-task/UT-05-cicd-pipeline-implementation.md（仮）
  - ../unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md
  - ../unassigned-task/UT-28-cloudflare-pages-projects-creation.md（仮）
  - ../unassigned-task/UT-29-post-cd-smoke.md（仮）
  - ../unassigned-task/UT-06-production-deployment.md（仮）
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/47
- 参照 workflow:
  - ../../../.github/workflows/backend-ci.yml
  - ../../../.github/workflows/web-cd.yml
