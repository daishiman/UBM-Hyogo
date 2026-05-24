# Phase 11 staging runtime smoke の GitHub Actions post-deploy gate 化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | fix-admin-scr-err-stg-followup-003-staging-runtime-smoke-ci-gate                      |
| タスク名     | Phase 11 staging runtime smoke の GitHub Actions post-deploy gate 化                  |
| 分類         | 改善 / CI gate 強化                                                                   |
| 対象機能     | apps/web staging deploy 直後の `/admin` runtime regression 自動検出                   |
| 優先度       | 高                                                                                    |
| 見積もり規模 | 中規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | TASK-FIX-ADMIN-SCR-ERR-STG-001 close-out review                                       |
| 発見日       | 2026-05-23                                                                            |
| 親 workflow  | `docs/30-workflows/fix-admin-server-components-render-error-stg/`                     |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク TASK-FIX-ADMIN-SCR-ERR-STG-001 の Phase 11 は、Cloudflare Workers staging deploy 後の `/admin` 到達確認を「user-gated `runtime_pending`」として残した。これは spec_created phase 上の妥協であり、構造的には **staging deploy 直後の `/admin` `HTTP 200` 確認 + `wrangler tail` の `error.boundary.caught` (scope=admin) 不発火確認を CI gate 化**することで、同型 regression を自動検出できる。

task-18 で導入予定の `playwright-smoke / smoke (chromium)` および `verify-design-tokens` 等の required status check と同列に、`admin-runtime-smoke / post-deploy-staging` を新規追加する設計を想定する。

### 1.2 問題点・課題

- 現状は staging deploy 後の動作確認が完全に手動運用で、Server Components render error のような **build pass / type pass / lint pass / unit test pass を全て通過した上で runtime のみで発火するクラスのバグ**を deploy 前に検出できない
- digest=167275886 のような事故はユーザー操作（または親タスクのような事後 audit）まで発覚しない
- Phase 11 evidence が `runtime_pending` のまま「user-gated」として残るパターンが恒常化しており、evidence inventory の信頼性が低下

### 1.3 放置した場合の影響

- 同型 Server Components render error が production deploy 後に初めて顕在化するリスク
- followup-002 の alert policy が整備されても、それは「発生後の早期検知」止まりで、「deploy をブロックする防壁」にはならない
- Phase 11 `runtime_pending` の慢性化により workflow gate の品質が形骸化

---

## 2. スコープ

### 2.1 含むもの

- `.github/workflows/admin-runtime-smoke.yml`（または既存 deploy workflow 内 job 追加）の新規作成
- staging deploy 完了を依存条件として trigger（`workflow_run` または同一 workflow 内 `needs:`）
- `/admin` HTTP probe（authenticated session 込みで HTTP 200 検証）
- `wrangler tail` で deploy 直後 N 秒間（例: 60 秒）の log capture → `error.boundary.caught` (scope=admin) 不発火を grep gate
- 認証セッションは GitHub Actions secrets 経由で test admin (`manjumoto.daishi@senpai-lab.com`) の session cookie / Magic Link 経路を確立
- `dev` / `main` ブランチの required status check 候補として追加（CLAUDE.md ブランチ戦略セクションの task-18 列挙パターンに準拠）

### 2.2 含まないもの

- production deploy gate（本タスクは staging 限定。production gate は別 followup）
- 新規 API endpoint 追加 / D1 schema 変更
- visual regression（task-18 playwright-smoke の責務）
- public / member route の smoke（本タスクは admin scope 限定）

---

## 3. 実装ステップ概要

1. 既存 staging deploy workflow（`apps/web` 向け）の名称と trigger 条件を棚卸し
2. `admin-runtime-smoke` job を追加する形態を選択:
   - 既存 deploy workflow に `needs: deploy-staging` で append（推奨・依存が明確）
   - もしくは `workflow_run: deploy-staging` で別 workflow ファイル化
3. authenticated session 取得 step を実装:
   - 1Password / GitHub Secrets から test admin の Magic Link token もしくは session cookie を取得
   - cookie を `cookies.txt` に書き出し
4. HTTP probe step:
   - `curl -sS -o /dev/null -w "%{http_code}" -b cookies.txt https://<staging-domain>/admin` が `200` を返すこと
5. `wrangler tail` step:
   - `bash scripts/cf.sh tail --env staging --format=json` を 60 秒 background 起動
   - probe step と並行して log capture
   - 終了後、`error.boundary.caught` かつ `scope=admin` の event が 0 件であることを grep gate
6. failure 時は staging rollback 推奨 step を log に出力（手動 rollback は別運用）
7. `dev` / `main` の `required_status_checks` に `admin-runtime-smoke / post-deploy-staging` 追加を user 明示承認後に `gh api -X PUT` で適用（CLAUDE.md ブランチ戦略の運用方針に準拠）

---

## 4. 受け入れ条件（DoD）

- **AC-1**: `.github/workflows/` 配下に admin runtime smoke job が定義済み
- **AC-2**: staging deploy 完了を依存条件として自動 trigger される
- **AC-3**: `/admin` HTTP 200 probe step が pass
- **AC-4**: `wrangler tail` ベースの `error.boundary.caught` (scope=admin) 不発火検証が pass
- **AC-5**: 意図的に admin route で throw を発生させた regression PR で gate が fail することを 1 回 evidence 取得
- **AC-6**: `dev` / `main` の required status check 候補として登録準備完了（実 PUT は user 明示承認後）
- **AC-7**: `scripts/cf.sh` 経由で wrangler を実行し、直接 `wrangler` 呼び出しは無い

---

## 5. 苦戦箇所メモ

`/admin` は admin gate で保護されているため、smoke job が **GitHub Actions runner から authenticated session を確立する必要がある**。Magic Link 経路だと dev SMTP からの token 抽出が必要で CI 化が困難。現実的には:

- 専用の long-lived test session token を発行して GitHub Secrets に格納し、`Set-Cookie` を直接 inject する
- もしくは Auth.js の `signIn` callback を test 専用 bypass path で叩く（要 staging 限定の feature flag）

のいずれかを選択する。前者の方が侵襲が少ないが secret rotation 運用が要る。

`wrangler tail` は ephemeral process で、CI 上で `--format=json` の stream を timeout 付きで close する制御が必要。SIGTERM を送って flush するパターンが安全。`scripts/cf.sh tail` 実装が無い場合は本タスクで追加する（`scripts/cf.sh` の責務に整合）。

cold start で deploy 直後の最初の request が遅延（数秒）するため、HTTP probe 前に 5-10 秒 sleep を入れる。`wrangler tail` の event capture window はこれを含めて余裕を持って 60 秒以上取る。

task-18 の `playwright-smoke / smoke (chromium)` / `playwright-smoke / visual (chromium, 4 screens)` / `verify-design-tokens` と同列の required status check 追加になるので、追加 PUT 操作は user 明示承認後にのみ実行する（CLAUDE.md ブランチ戦略セクション準拠）。

---

## 6. 関連リソース

- `.github/workflows/`（既存 deploy workflow を確認）
- `apps/web/wrangler.toml`（staging env 設定）
- `scripts/cf.sh`（Cloudflare CLI ラッパー正本）
- `apps/web/src/app/error.tsx`（scope ラベル emit 連携、followup-002 と共有）
- `apps/web/src/auth.ts`（session 確立経路、followup-001 と関連）
- `docs/30-workflows/fix-admin-server-components-render-error-stg/`（親 workflow / Phase 11 `runtime_pending` 経緯）
- 関連 PR: #849
- CLAUDE.md「ブランチ戦略」セクション（required status check 追加運用方針）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 経由必須）
- MEMORY.md「UBM-Hyogo テストアカウント」（admin: `manjumoto.daishi@senpai-lab.com`）
- task-18 関連 workflow（playwright-smoke / verify-design-tokens の同列 gate 設計参考）
