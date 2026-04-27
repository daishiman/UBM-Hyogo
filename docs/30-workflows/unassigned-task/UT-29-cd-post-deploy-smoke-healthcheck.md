# UT-29: CD デプロイ後スモーク／ヘルスチェック自動化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-29 |
| タスク名 | CD デプロイ後スモーク／ヘルスチェック自動化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync |

## 目的

`backend-ci.yml` / `web-cd.yml` の deploy ステップ直後に同期スモーク（HTTP ヘルスチェック）を追加し、`wrangler` の outcome が success でもアプリが 5xx / タイムアウト状態である場合に CD ジョブを失敗扱いにする。さらに Discord 通知のタイトル・色をスモーク結果まで含めた最終ステータスで送るように改修し、デプロイ完了 = 実稼働確認まで一気通貫で保証する。

## スコープ

### 含む
- `backend-ci.yml` の deploy ステップ直後に `/api/health` 相当エンドポイントへの GET スモークを追加
- `web-cd.yml` の deploy ステップ直後に Web トップページ（または `/healthz`）への GET スモークを追加
- リトライ＋バックオフ戦略の実装（Cloudflare の伝播遅延に耐えるため最大 30〜60 秒）
- スモーク失敗時に job を failure 化（Discord 通知の色・タイトルもこれに連動）
- Discord 通知ロジックを `MIGRATE_OUTCOME` / `DEPLOY_OUTCOME` / `SMOKE_OUTCOME` の 3 入力に拡張
- ブランチ別のスモーク対象 URL の組み立て（dev / main / production custom domain）

### 含まない
- 常設のアップタイムモニタリング（UT-08 のスコープ）
- Cloudflare Analytics / アラート連動（UT-17 のスコープ）
- ロールバック自動化（別タスク化）
- E2E テスト全体実行（playwright 系は別ジョブ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-05 (CI/CD パイプライン実装) | スモークを追加する CD ワークフローの骨格が確定していること |
| 上流 | UT-27 (Secrets / Variables 配置) | スモーク URL 組み立てに `CLOUDFLARE_PAGES_PROJECT` を再利用 |
| 上流 | UT-28 (Cloudflare Pages プロジェクト作成) | スモーク対象 URL が成立していること |
| 上流 | apps/api 側 `/api/health` 実装（`02-application-implementation` 配下のいずれか） | スモーク対象エンドポイントの存在 |
| 関連 | UT-08 / UT-17 | スコープ境界（CD 直後の同期スモーク vs 常設モニタリング）の責務分離 |
| 下流 | UT-06 (本番デプロイ実行) | 本番スモーク失敗時の判断基準として活用 |

## 苦戦箇所・知見

**Cloudflare のグローバル伝播遅延**: deploy 直後の即時 GET は 404 / 旧バージョン応答が混じることがある。Pages も Workers もエッジへの伝播に数秒〜数十秒かかる。リトライ（最低 5 回）＋指数バックオフ（1s / 2s / 4s / 8s / 16s）で最大 30〜60 秒程度許容する設計が現実的。最初の試行で落とすと CI が誤検知 fail する事故が頻発する。

**Pages の preview 用 alias URL の取り扱い**: Pages を `--branch=dev` で deploy すると `https://<branch>.<project>.pages.dev` 形式の alias URL が生成される。これは `steps.deploy.outputs.pages-deployment-alias-url` で取得できる。staging スモークではこの alias を使い、production では `<project>.pages.dev` または custom domain を使うため、ブランチに応じて URL 組み立てロジックを分岐させる必要がある。

**`/api/health` の depth 設計**: ヘルスチェックを HTTP-only にするか、D1 接続まで含めるかで「デプロイ失敗」の意味が変わる。本タスクでは「Workers が起動して HTTP を返せること」を最低限の判定基準とし、D1 接続障害は別レイヤ（UT-08 常設モニタリング）の責務とする。HTTP 200 を返すだけのシンプルな endpoint を `apps/api` に持つことを前提とする。

**Discord 通知ロジックの 3 入力化**: 既存 `backend-ci.yml` は `MIGRATE_OUTCOME` と `DEPLOY_OUTCOME` の 2 入力で成功/失敗を出し分けている。スモークを追加すると判定が「migrate AND deploy AND smoke が全部 success」に変わる。`SMOKE_OUTCOME` を env 経由で渡し、シェル側の if 条件を書き換える改修ポイントを明示する。`web-cd.yml` 側は migrate がないため `DEPLOY_OUTCOME` + `SMOKE_OUTCOME` の 2 入力。

**`continue-on-error` と job failure 化のバランス**: スモーク失敗を job failure にしたいが、Discord 通知ステップは `if: always()` で必ず通したい。スモークステップは `continue-on-error: false`（既定）で job 全体を失敗化し、通知ステップは `if: always()` で結果を拾うように構造化する。`continue-on-error: true` にしてしまうと job 自体は green のまま通知だけ赤になり、ブランチ保護で fail を捕捉できない事故になる。

**ローカル再現性**: スモーク失敗時のデバッグはランナーログのみで完結させづらい。`curl -v` の verbose 出力をジョブログに残し、応答ヘッダ（`cf-ray` / `cf-cache-status`）を観測できるようにすると、伝播遅延 vs 真の障害の切り分けが付きやすい。

## 実行概要

- `backend-ci.yml` / `web-cd.yml` に「smoke」ステップを追加。スクリプトは `bash` + `curl` ベースで、リトライ・バックオフを内製する
- ブランチ判定（`github.ref_name`）に応じてスモーク対象 URL を組み立て: staging は alias URL、production は確定 URL
- スモーク結果を `id: smoke` の outputs として通知ステップに引き渡す（`SMOKE_OUTCOME` env で参照）
- 既存通知ステップの shell ロジックを 3 入力対応に書き換える（タイトル・色・description の 3 系統）
- `dev` 上で 503 を意図的に返す PoC を一度実行し、CD job が失敗化することを確認する

## 完了条件

- [ ] `backend-ci.yml` の deploy 直後に `/api/health` スモークステップが追加されている
- [ ] `web-cd.yml` の deploy 直後に Web スモークステップが追加されている
- [ ] スモークはリトライ＋バックオフを実装し、最大 60 秒程度の伝播遅延を許容する
- [ ] スモーク失敗時に CD job 全体が failure になる
- [ ] Discord 通知が migrate / deploy / smoke の最終結果を反映する
- [ ] ブランチ別のスモーク対象 URL 組み立てが dev / main の両方で動作する
- [ ] 意図的に失敗を起こした検証が一度成功している
- [ ] UT-08 / UT-17 との責務分離が運用ドキュメントに明記されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/backend-ci.yml | スモーク追加の対象 |
| 必須 | .github/workflows/web-cd.yml | スモーク追加の対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | モニタリングとアラート / ヘルスチェックエンドポイント設計の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CD 設計原則の正本 |
| 参考 | docs/unassigned-task/UT-08-monitoring-alert-design.md | 常設モニタリングとの責務分離 |
| 参考 | docs/unassigned-task/UT-17-cloudflare-analytics-alerts.md | アラート連動との責務分離 |
| 参考 | docs/unassigned-task/UT-27-github-secrets-variables-deployment.md | スモーク URL 組み立てに使う Variable |
| 参考 | docs/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | スモーク対象プロジェクトの存在前提 |
