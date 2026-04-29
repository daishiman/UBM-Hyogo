# Phase 1 成果物 — 要件定義

## 1. 背景

UT-05（CI/CD パイプライン実装）で `backend-ci.yml` / `web-cd.yml` が整備され、`dev` push → staging deploy / `main` push → production deploy の経路が宣言的に定義された。しかし、これらのワークフローは `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID` / `secrets.DISCORD_WEBHOOK_URL` / `vars.CLOUDFLARE_PAGES_PROJECT` を参照しており、GitHub 側に値が無ければ `wrangler-action` が 401（認証情報未設定）/ Pages deploy が `--project-name=` の値展開失敗で 422 を起こすか、deploy ジョブ自体が早期 fail する。CD 配線が完成しても秘匿値・設定値が GitHub の Secrets / Variables に存在しなければ deploy ジョブ全体が空振りに終わるため、配置タスクを独立 PR として未タスク化する。本ワークフローは、Phase 1〜13 の **タスク仕様書整備** に閉じ、実 secret 配置（`gh secret set` / `gh variable set` / `gh api` の environment 作成）は Phase 13 ユーザー承認後の別オペレーションで実施する。

## 2. 課題（why this task）

| # | 課題 | 影響 |
| --- | --- | --- |
| C-1 | UT-05 で workflow 配線は完了したが GitHub 側に Secrets / Variables が空 | dev/main push で deploy ジョブが 401 / 422 / 早期 fail し続ける（CD 実稼働化が不能） |
| C-2 | repository-scoped と environment-scoped の混在事故が起きやすい（`environment:` 宣言ジョブで environment-scoped が優先解決される） | staging で意図せず production 値が参照される / 同名併存時にどちらが効くか曖昧化 |
| C-3 | `CLOUDFLARE_PAGES_PROJECT` を Secret 化すると `${{ vars.X }}-staging` の suffix 連結結果が CI ログで完全マスクされ、デバッグ性が著しく落ちる | suffix 変換ミス・命名ミスの原因究明が不能化 |
| C-4 | `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` が GitHub Actions では正しく評価されないことがあり、通知ステップが無音失敗する | 本来通知すべきタイミングで通知が落ち、CI 全体は緑のため気付けない |
| C-5 | 1Password Environments を正本としつつ GitHub Secrets を派生コピーする運用で、GitHub UI 直編集により 1Password 側が古くなる drift | ローテーション時に古い値で deploy が成功してしまい、後続でハマる |
| C-6 | `CLOUDFLARE_API_TOKEN` のスコープを Global API Key 流用 / 過剰スコープで発行すると漏洩時の影響範囲が拡大 | production Cloudflare 全体への侵害 |
| C-7 | secret 値を payload / runbook / Phase outputs / shell history に転記する事故 | secret 漏洩 |

## 3. AC（受入条件）

AC-1〜AC-15 は `index.md` §受入条件と同期。本 Phase で blocker は検出されず、Phase 2（設計）へ進行可能。要点を再掲：

- **AC-1〜AC-4**: Secret 3 件（CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / DISCORD_WEBHOOK_URL）+ Variable 1 件（CLOUDFLARE_PAGES_PROJECT）の配置手順仕様化
- **AC-5〜AC-6**: GitHub Environments（staging / production）作成 + repository vs environment 配置決定マトリクス
- **AC-7〜AC-9**: dev push smoke で backend-ci.yml / web-cd.yml の deploy-staging green / Discord 通知確認 / 未設定耐性
- **AC-10**: 1Password Environments → GitHub Secrets / Variables 同期手順の運用ドキュメント追記方針
- **AC-11**: 4 条件評価 全 PASS
- **AC-12**: 上流 3 件（UT-05 / UT-28 / 01b）完了確認 3 重明記
- **AC-13**: secret/token 値の payload / runbook / ログへの転記禁止
- **AC-14**: `if: secrets.X != ''` 評価不能の代替設計（env で受けてシェルで空文字判定）の動作確認項目化
- **AC-15**: Phase 1〜13 の状態整合（Phase 1〜3 = completed / Phase 4〜13 = pending）

## 4. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev/main push → CD green の経路が成立し、UT-06（本番デプロイ）/ UT-29（CD 後スモーク）の前提が確定。UT-05 で構築した CD 配線が初めて実稼働化する |
| 実現性 | PASS | `gh` CLI + 1Password 手動同期は既存運用範囲。Environments 作成も `gh api repos/.../environments/...` で対応可能。追加依存ゼロ |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与）。CLAUDE.md「1Password Environments 正本」「`.env` に実値を書かない」「API Token 値を出力やドキュメントに転記しない」と完全整合 |
| 運用性 | PASS | 1Password を正本として明記、Environments 既定方針で混在事故を回避、API Token 最小スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）で漏洩影響限定、Token 名に環境・発行日を含めローテーション履歴を追跡可能 |

## 5. スコープ

### 含む（spec scope）

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- 上流 3 件（UT-05 / UT-28 / 01b）完了必須前提の 3 重明記（Phase 1 / 2 / 3）
- repository-scoped vs environment-scoped 配置決定マトリクスの仕様化
- Secret 一覧（3 件）+ Variable 一覧（1 件）の固定
- 1Password Environments → GitHub Secrets / Variables 同期手順の運用ドキュメント追記方針
- API Token 最小スコープ方針（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）
- `gh` CLI コマンド草案の仕様レベル定義
- 動作確認手順（dev push → CD green / Discord 通知 / 未設定耐性）の仕様化
- secret 値転記禁止方針の AC 化

### 含まない

- 実 `gh secret set` / `gh variable set` / `gh api` の実行（Phase 13 ユーザー承認後の別オペレーション）
- ワークフローファイル自体の編集（UT-05）
- Cloudflare 側 API Token 発行作業（01b）
- Cloudflare Pages プロジェクト命名作業（UT-28）
- Cloudflare Secrets 配置（UT-25）
- 本番デプロイ実行（UT-06）
- 1Password Vault 構造変更
- `op` サービスアカウント化（将来タスク。本タスクは方針言及のみ）
- Terraform GitHub Provider 化（将来 IaC 化フェーズ）
- 自動 commit / push / PR 発行

## 6. タスク種別の固定

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| scope | github_secrets_variables_cd_enablement |
| implementation_mode | new |
| apply_method | gh-cli-direct + 1password-manual-sync (MVP) |

`artifacts.json.metadata` と完全一致。

## 7. NON_VISUAL タスク分類

- **NON_VISUAL** を明示。UI 変更ゼロ。
- スクリーンショット / 視覚的 evidence 成果物は Phase 11 / 12 で要求しない。
- evidence は以下に集約:
  - `gh secret list` / `gh secret list --env staging` / `gh secret list --env production`（値はマスク）
  - `gh variable list`
  - `gh api repos/.../environments/{staging,production}` の存在確認
  - CD ワークフロー run URL（`backend-ci.yml` / `web-cd.yml` deploy-staging green）
  - Discord 通知到達ログ
  - 1Password Item Notes の Last-Updated メモ更新

## 8. 上流タスク完了確認 inventory（carry-over）

| タスク | 期待状態 | 本タスクが受け取る成果物 | 確認手段 |
| --- | --- | --- | --- |
| UT-05 (CI/CD パイプライン実装) | completed / 該当 PR merged | `.github/workflows/{backend-ci,web-cd}.yml` の secret/variable 参照キー確定（CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / DISCORD_WEBHOOK_URL / CLOUDFLARE_PAGES_PROJECT 計 4 件） | `grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml` |
| UT-28 (Cloudflare Pages プロジェクト作成) | completed | Cloudflare Pages プロジェクト名（例: `ubm-hyogo-web`） | `bash scripts/cf.sh pages project list` |
| 01b (Cloudflare base bootstrap) | completed | Cloudflare API Token（最小スコープ）/ Cloudflare Account ID / 1Password Environments エントリ存在 | `op item get "Cloudflare" --vault UBM-Hyogo` |

> 上流 3 件のうち 1 件でも未完了の場合、Phase 5 への移行は NO-GO（Phase 3 で再ゲート）。

## 9. 苦戦箇所サマリ（親仕様 §「苦戦箇所・知見」写経）

1. **Environments スコープと repository スコープの違い（§1）**: `environment:` 宣言ジョブから environment-scoped が優先解決される性質。同名併存時の事故防止のため Environments 既定方針を採る。受け皿: Phase 2 配置決定マトリクス。
2. **`CLOUDFLARE_PAGES_PROJECT` を Variable にする（§2）**: 機密ではない suffix 連結対象。Secret 化するとログマスクでデバッグ困難。受け皿: Phase 2 Variables 一覧 + Variable 化理由。
3. **`if: secrets.X != ''` 評価不能（§3）**: 通知ステップが無音失敗するリスク。env で受けてシェルで空文字判定する代替設計を Phase 11 smoke で確認。受け皿: Phase 2 動作確認手順 + Phase 11 smoke。
4. **1Password ↔ GitHub 二重正本 drift（§4）**: 1Password 正本 / GitHub 派生 を state ownership で明記。GitHub UI 直編集を禁止し、1Password Item Notes に Last-Updated メモを保持。受け皿: Phase 2 同期手順 + Phase 12 運用ドキュメント。
5. **`CLOUDFLARE_API_TOKEN` 最小スコープ（§5）**: Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read のみ。Token 名は `ubm-hyogo-cd-{env}-{yyyymmdd}` で履歴追跡。受け皿: Phase 2 Secrets 表「最小スコープ」列 + 命名規則。
6. **secret 値転記禁止（§6）**: payload / runbook / Phase outputs / shell history への転記事故防止。一時環境変数 + `unset` パターン、`gh secret list` の値マスク前提を全段で再確認。受け皿: AC-13 として全 Phase 反映。

## 10. 命名規則チェックリスト

- Secret 名: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL`（既存 workflow 参照と完全一致 / UPPER_SNAKE_CASE）
- Variable 名: `CLOUDFLARE_PAGES_PROJECT`
- Environment 名: `staging` / `production`（lowercase / 既存 `environment: name:` と一致）
- 1Password 参照形式: `op://Vault/Item/Field`（CLAUDE.md ルール準拠）
- CLI 経路: `gh secret set NAME --body "$TMP_VAR"` / `gh variable set NAME --body "value"` / `gh api repos/{owner}/{repo}/environments/{name} -X PUT`
- API Token 名（Cloudflare 側）: `ubm-hyogo-cd-{env}-{yyyymmdd}`
- commit メッセージ（Phase 13 承認後）: `chore(cd): deploy github secrets and variables [UT-27]`

## 11. 引き渡し

Phase 2（設計）へ：
- 真の論点 = (a) repository / environment 混在事故 / (b) Variable / Secret 判定 / (c) `if: secrets.X != ''` 無音失敗 / (d) 1Password 正本 drift / (e) API Token 過剰スコープ を 5 同時封じ
- Secret 3 件 + Variable 1 件の最低限内訳
- repository vs environment 配置決定マトリクスの埋めるべき軸
- 1Password 正本 / GitHub 派生 の境界
- API Token 最小スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read）+ Token 命名規則
- `gh` CLI コマンド草案の必要セット（environment / secret / variable / 動作確認 / 同期検証）
- 4 条件 PASS の根拠
- NON_VISUAL タスク分類
- スコープ境界（仕様書整備に閉じる / 実 secret 配置は Phase 13 後）
- 上流 3 件 carry-over inventory
