# production admin runtime smoke gate（staging gate の production 層展開） - タスク指示書

## メタ情報

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | issue-864-followup-001-production-admin-runtime-smoke-gate                                  |
| タスク名     | authenticated `/admin` runtime smoke gate の production（main）層展開                       |
| 分類         | 改善 / CI gate 強化                                                                         |
| 対象機能     | apps/web production deploy 直後の `/admin` runtime regression 自動検出                      |
| 優先度       | 低（LOW）                                                                                  |
| 見積もり規模 | 小〜中規模                                                                                  |
| ステータス   | 未実施                                                                                      |
| 発見元       | TASK-ISSUE-864-ADMIN-STAGING-RUNTIME-SMOKE-CI-GATE-001 Phase 12 unassigned-task-detection（UT-CANDIDATE-1） |
| 発見日       | 2026-05-24                                                                                  |
| 親 workflow  | `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/`         |
| 関連 issue   | #864（staging gate。CLOSED）                                                                |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク（issue-864）で、staging deploy 直後に authenticated `/admin` を実トラフィックで叩き、Server Components render error（digest=`167275886` / `error.boundary.caught` scope=admin）の再発を CI で自動検出する gate を `.github/workflows/web-cd.yml` の `needs: deploy-staging` job として確立した。

親タスクは初回スコープを **staging に限定**した（render error は staging で報告された事象であり、production への展開は段階的に行う方針）。staging gate が安定運用に入ったあと、同型 gate を `deploy-production` 後にも展開することで、production deploy 直後の同型 runtime regression も自動検出できるようになる。

### 1.2 問題点・課題

- 現状 production deploy 後の `/admin` runtime 健全性確認は staging gate でしか守られておらず、production 固有の env / secret / binding 差異に起因する render error が deploy 直後に検出されない
- staging で pass しても production の `[env.production.vars]` / Cloudflare Secrets / D1 binding の差異で初めて顕在化するクラスのバグ（build/type/lint/unit を全て通過）は、staging gate だけでは捕捉できない
- 親タスクの runner（`runtime-admin-web.sh`）・mint helper（`mint-staging-session-cookie.mts`）・`cf.sh tail` は staging 向けに実装済みであり、production 展開は **既存資産の再利用で低コストに実現できる**（初回層の重い部品＝Auth.js 互換 cookie mint は解決済み）

### 1.3 放置した場合の影響

- staging で検出されなかった production 固有 render error が、エンドユーザー（管理者）操作まで発覚しない
- staging gate の価値が「staging 限定の防壁」に留まり、production deploy の最終防壁が手動運用のまま残る
- 親タスクのスコープ外項目が積み残しのまま evidence inventory の追跡対象から漏れる

---

## 2. スコープ

### 2.1 含むもの

- `.github/workflows/web-cd.yml` に `needs: deploy-production` の `admin-runtime-smoke-production`（仮称）job を追加（既存 staging job を構造テンプレートとして再利用）
- production target host（`apps/web/wrangler.toml` の `[env.production]` で確定する Workers ドメイン）を `STAGING_WEB_HOST_ALLOW_REGEX` 相当の production allowlist へ追加
- production 用 session cookie mint：`PRODUCTION_AUTH_SECRET`（GitHub Secrets / Cloudflare Secrets 経由）で `mint-staging-session-cookie.mts` を production env 向けに呼び出す（必要なら helper を env 非依存に一般化）
- production probe 結果の evidence artifact upload + redaction grep gate（JWT / Cookie / token 非 leak）
- `PRODUCTION_AUTH_SECRET` 未設定環境では graceful skip（親タスク AC-8 と同方針）

### 2.2 含まないもの

- 新規 API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更（CLAUDE.md 不変条件）
- staging gate 自体の挙動変更（親タスクで確立済み・本タスクは production 層の追加のみ）
- visual regression（task-18 playwright-smoke の責務）
- public / member route の smoke（本タスクは admin scope 限定）
- render error 自体の root-cause 修正（#877 / #862 / #863 で完了済み）

---

## 3. 実装ステップ概要

1. 親タスクで追加された `web-cd.yml` の `admin-runtime-smoke`（staging）job 定義を棚卸しし、production 展開時の差分（host / secret 名 / env flag）を確定する
2. `mint-staging-session-cookie.mts` が `authSecret` を引数で受け取る設計か確認し、production env 向けに `PRODUCTION_AUTH_SECRET` を注入できるよう（必要なら）env 非依存化する
3. `runtime-admin-web.sh` の target host / allowlist を production ドメインでも通るよう一般化する（staging hard-code を避ける）
4. `web-cd.yml` に `needs: deploy-production` の gate job を追加し、production push 時のみ発火させる
5. `PRODUCTION_AUTH_SECRET` 未設定時の graceful skip を実装（dev/main push をブロックしない）
6. 意図的 throw の regression 検証で gate が fail することを 1 回 evidence 取得
7. `main` の `required_status_checks` への追加は **user 明示承認後**に `gh api -X PUT` で適用（CLAUDE.md ブランチ戦略準拠。read-only before JSON は事前取得可）

---

## 4. 受け入れ条件（DoD）

- **AC-1**: `.github/workflows/web-cd.yml` に `needs: deploy-production` の admin runtime smoke job が定義済み
- **AC-2**: production deploy 完了を依存条件として自動 trigger される（main push 時のみ）
- **AC-3**: production `/admin` HTTP 200 probe step が pass（authenticated session 込み）
- **AC-4**: `cf.sh tail` ベースの `error.boundary.caught`（scope=admin）/ digest=`167275886` 不発火検証が pass
- **AC-5**: 意図的に admin route で throw を発生させた regression で gate が fail することを 1 回 evidence 取得
- **AC-6**: `PRODUCTION_AUTH_SECRET` 等未設定環境では gate を fail させず graceful skip する
- **AC-7**: smoke evidence（`summary.json` / `runtime-smoke.log`）が artifact upload され、redaction grep gate を通過する
- **AC-8**: `wrangler` 直叩きが無く、`scripts/cf.sh` 経由で実行される
- **AC-9**: `main` の required status check 追加準備が完了（実 PUT は user 明示承認後）

---

## 5. 苦戦箇所メモ（将来の課題解決に役立つ知見）

### 5.1 staging gate で既に解決済みの難所（再利用できる）

親タスク（issue-864）で最大コストだった「Auth.js 互換 session cookie の mint」は `mint-staging-session-cookie.mts`（`__Secure-authjs.session-token`, TTL 600s）で解決済み。production 展開ではこの helper を **env 非依存に再利用**できるため、初回層の重い部品は再発しない。`cf.sh tail`（`CF_TAIL_SECONDS` で stream timeout 打ち切り）も実装済み。

### 5.2 production 固有の新規難所

- **secret 分離**: staging の `STAGING_AUTH_SECRET` と production の `PRODUCTION_AUTH_SECRET` は別物。同じ test admin session を production に流用すると本番 session を CI runner が握ることになるため、production では **短命 TTL（600s 以下）を厳守**し、専用の test admin（`manjumoto.daishi@senpai-lab.com`）に限定する。secret rotation 運用は staging より厳格にする。
- **production への侵襲性**: probe は read-only GET（`/admin` 表示確認）に限定し、mutation を伴う操作は絶対に行わない。production D1 / KV に副作用を残さない。
- **rollback 連動**: production gate が fail した場合の自動 rollback は本タスクのスコープ外（手動 rollback 運用）だが、fail 時に `bash scripts/cf.sh rollback <VERSION_ID>` の推奨手順を log 出力すると運用が早い。
- **cold start 遅延**: production deploy 直後の最初の request は cold start で数秒遅延しうる。probe 前に 5-10 秒 sleep を入れ、tail capture window は余裕を持って取る（staging gate の `CF_TAIL_SECONDS` 既定をそのまま流用可）。
- **host hard-code 回避**: `runtime-admin-web.sh` の `STAGING_WEB_HOST_ALLOW_REGEX` に production ドメインを焼き込むのではなく、env 変数で allowlist を切り替える設計にしないと、staging/production で runner が分岐し責務が二重化する。

### 5.3 required status check 追加の運用注意

`main` の `required_status_checks` への追加は CLAUDE.md ブランチ戦略セクション準拠で、実 `gh api -X PUT` は **user 明示承認後のみ**。read-only before JSON（`gh api repos/{owner}/{repo}/branches/main/protection`）は事前 evidence として取得可能。staging gate が `dev` で安定 green を継続していることを確認してから production 層を追加する（段階展開）。

---

## 6. 関連リソース

- `.github/workflows/web-cd.yml`（親タスクで追加した staging gate job を production 展開の構造テンプレートとする）
- `scripts/smoke/runtime-admin-web.sh`（親タスク実装。production host へ一般化）
- `scripts/smoke/mint-staging-session-cookie.mts`（親タスク実装。production secret 注入へ一般化）
- `scripts/cf.sh`（`tail` subcommand 含む Cloudflare CLI ラッパー正本）
- `apps/web/wrangler.toml`（`[env.production]` ドメイン / vars 設定）
- `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/`（親 workflow / staging gate の Phase 1-13）
- CLAUDE.md「ブランチ戦略」セクション（required status check 追加運用方針）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 経由必須）
- MEMORY.md「UBM-Hyogo テストアカウント」（admin: `manjumoto.daishi@senpai-lab.com`）
- エラー digest: `167275886`（再発検出対象）
