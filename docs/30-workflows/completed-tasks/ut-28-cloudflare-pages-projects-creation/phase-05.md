# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（前提確認 → OpenNext 判定 → production プロジェクト作成 → staging プロジェクト作成 → 設定確認 + 動作確認） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending（仕様化のみ完了 / 実 create / push は Phase 13 ユーザー承認後の別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

Phase 4 で固定した T1〜T7 を Green にするための **6 ステップ実装ランブック** を仕様化する。コマンド系列（`bash scripts/cf.sh pages project create` / `bash scripts/cf.sh pages project list` / dev push smoke / main push smoke / Git 連携 OFF 確認 / OpenNext 整合性確認）は本 Phase で **仕様レベルで定義** するが、**実行は禁止**。実 create / push は Phase 13 ユーザー承認後の別オペレーションでのみ走る（user_approval_required: true）。

> **重要**: 本 Phase 冒頭で **上流 2 件（01b / UT-05）completed の前提確認** を必須化する。1 件でも未完了の場合は実装着手不可（Phase 3 NO-GO 条件）。

## 上流 2 件完了の前提確認【実装着手前の必須ゲート】

実装担当者は **Step 1 に入る前に** 以下を確認する。1 件でも該当した場合は実装着手禁止 → Phase 3 NO-GO へ差し戻す。

```bash
# 上流 2 件完了確認（必須・GET / 文書確認のみ / 副作用なし）
bash scripts/cf.sh whoami                                                  # 01b: API Token 認証
op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token,account_id | jq 'keys'
gh pr list --search "UT-05" --state merged --json number,title             # UT-05 マージ確認
grep -nE "pages deploy|project-name|CLOUDFLARE_PAGES_PROJECT" .github/workflows/web-cd.yml
# 期待: dev/main 両分岐で `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}(-staging)` が参照される
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| 01b task `status` | `completed`（API Token 発行 / Account ID 取得 / 1Password Item 存在） | いずれか欠落 |
| `bash scripts/cf.sh whoami` | success（Token 認証 OK） | 401 / Token 期限切れ |
| UT-05 task `status` | `completed`（PR マージ済み） | `pending` / `in_progress` |
| `.github/workflows/web-cd.yml` の参照キー | `${{ vars.CLOUDFLARE_PAGES_PROJECT }}` + suffix `-staging` 連結 / dev/main 両分岐 | 別名 / 連結仕様の乖離 |
| Phase 13 ユーザー承認 | 取得済み | 未取得（Step 3 以降の `bash scripts/cf.sh pages project create` / `git push` 禁止） |
| OpenNext 切替判定の準備 | `apps/web/wrangler.toml` / `apps/web/open-next.config.ts` / `web-cd.yml` 3 ファイル静的解析済み（Step 2 ゲート） | 3 ファイル未読 / 判定 (A)/(B) の事前見立て無し |

**1 つでも NO-GO 条件に該当 → 実装着手禁止 → 本 Phase を pending に戻し 01b / UT-05 着手 へ。**

## 実行タスク

- タスク1: 上流 2 件完了ゲートを Step 0 として固定する。
- タスク2: OpenNext 静的判定 / production プロジェクト作成 / staging プロジェクト作成 / 設定確認 / 動作確認 を 6 ステップに分離する。
- タスク3: `production_branch` 環境別配線（main / dev）/ `compatibility_date = 2025-01-01` / `compatibility_flags = ["nodejs_compat"]` の整合を全 Step で徹底する。
- タスク4: API Token / Account ID / 秘匿 ID 値を一切 payload / runbook / Phase outputs / 検証コマンド出力に転記しない（`op://...` 参照のみ / 公開 URL は記録可）。
- タスク5: コマンド系列を `bash scripts/cf.sh ...` 経由で固定する（`wrangler` 直接実行禁止 / AC-14）。
- タスク6: 実 apply 前に `bash scripts/cf.sh pages project create --help` を確認し、`--compatibility-date` / `--compatibility-flags` が直接指定できるかを記録する。未対応なら Cloudflare API/PATCH fallback を Phase 13 user 承認後の別手順として記録し、未記録のまま実 apply しない。
- タスク7: 本 Phase で実 create / `git push` を実行しない境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-04.md | T1〜T7（Green 条件） |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | コマンド草案 / 設定一致表 / state ownership |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md §苦戦箇所・知見 | OpenNext / production_branch / compatibility / 命名 / Git 連携 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI 実行ルール） | `bash scripts/cf.sh` 思想 / `wrangler` 直接実行禁止 |
| 必須 | scripts/cf.sh | ラッパー実装の確認 |
| 必須 | .github/workflows/web-cd.yml | 配置先キー名（`${{ vars.CLOUDFLARE_PAGES_PROJECT }}` 連結仕様）の最終突合 |
| 必須 | apps/web/wrangler.toml / apps/web/open-next.config.ts | OpenNext 整合性の静的判定（Step 2） |
| 必須 | apps/api/wrangler.toml | Workers 側 `compatibility_date` / `compatibility_flags` の正本値 |
| 参考 | https://developers.cloudflare.com/pages/platform/branch-build-controls/ | `production_branch` 仕様 |
| 参考 | https://developers.cloudflare.com/workers/configuration/compatibility-dates/ | `compatibility_date` 仕様 |

## 実行手順

1. Step 0 で上流 2 件完了 / Phase 13 承認状態を確認し、NO-GO 条件を判定する。
2. Step 0.5 で `bash scripts/cf.sh pages project create --help` を確認し、planned flags の対応状況を記録する。
3. Step 1〜5 を lane 1〜5 順に実行する（**ただし Step 3 / 4 / 5 の `bash scripts/cf.sh pages project create` / `git push origin dev` / `git push origin main` は Phase 13 ユーザー承認後のみ**）。
4. Step 5 の動作確認結果は `outputs/phase-13/verification-log.md` / `outputs/phase-11/manual-smoke-log.md` に保全する。OpenNext 判定結果は `outputs/phase-02/main.md §opennext-judgement` を参照しつつ、判定 (B) 確定時は `outputs/phase-12/unassigned-task-detection.md` に UT-05 フィードバックを登録する。

## 統合テスト連携

T1〜T7（Phase 4）を各 Step の Green 条件として参照し、Phase 6 の異常系（T8〜T13）で fail path を追加検証する。Phase 11 smoke は Step 5 を実走、Phase 13 で apply-runbook.md / verification-log.md を最終証跡化する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック（NOT EXECUTED テンプレ） |
| 別オペ成果（参考） | outputs/phase-13/apply-runbook.md / outputs/phase-13/verification-log.md / outputs/phase-11/manual-smoke-log.md | 本ワークフローでは生成しない（Phase 13 ユーザー承認後に実走者が生成） |

## 実装手順（6 ステップ / 仕様レベル）

### Step 0: 前提確認（必須・実 create 禁止）

- 上記「上流 2 件完了の前提確認」を全項目クリア。
- Phase 13 ユーザー承認の取得状況を確認（未取得時は Step 3 以降の `bash scripts/cf.sh pages project create` / `git push origin dev` / `git push origin main` 禁止）。
- T1〜T7 が現在 Red であることを確認（Pages プロジェクト未作成 / dev push 後の CD が green になっていない）。

### Step 1: 上流確認 inventory（lane 1 / 副作用なし GET）

```bash
# `wrangler` 直接実行禁止 → 全て scripts/cf.sh 経由
bash scripts/cf.sh whoami                                              # API Token 認証 / Account ID 解決
op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token,account_id | jq 'keys'

# web-cd.yml 参照キーの最終突合（PUT ではないので Phase 13 承認前でも可）
grep -nE "pages deploy|project-name|CLOUDFLARE_PAGES_PROJECT" .github/workflows/web-cd.yml \
  > /tmp/ut-28-workflow-keys.txt

# Workers 側 compatibility 値の正本確認
grep -nE "compatibility_date|compatibility_flags" apps/api/wrangler.toml > /tmp/ut-28-workers-compat.txt
# 期待: compatibility_date = "2025-01-01" / compatibility_flags = ["nodejs_compat"]
```

- 確認: `web-cd.yml` の dev/main 両分岐に `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}(-staging) --branch=...` が出現 / Workers 側 `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` が確定。
- 結果は `outputs/phase-13/verification-log.md §upstream` に転記（**値ではなくキー存在のみ / 公開 URL は記録可 / Account ID は記録不可**）。

### Step 2: OpenNext アップロード判定（lane 2 / 副作用なし静的解析）

```bash
# 静的解析 3 ファイル
grep -nE "pages_build_output_dir|compatibility_date|compatibility_flags" apps/web/wrangler.toml
grep -nE "pages deploy" .github/workflows/web-cd.yml
grep -nE "defineCloudflareConfig|export default" apps/web/open-next.config.ts
```

- 判定 (A): `apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` / `web-cd.yml` の `pages deploy .next` / `apps/web/open-next.config.ts` で `defineCloudflareConfig()` を export → 3 ファイル整合 → `.next` 継続で進める（dev push smoke で実走確認）。
- 判定 (B): 不整合があり `_worker.js` 不在による SSR / API ルート 500 が見込まれる → 本タスクではプロジェクト作成のみ実施し、`apps/web/wrangler.toml` の `pages_build_output_dir` と `web-cd.yml` の `pages deploy .next` を `.open-next/assets` 系に切り替える PR を **UT-05 にフィードバック**（Phase 12 unassigned-task-detection.md に登録）。
- 判定タイミング: 本 Step で静的判定 → Step 5.4 dev push smoke で実走確認 → red 時に判定 (B) 確定。
- 結果は `outputs/phase-02/main.md §opennext-judgement` 参照 / `outputs/phase-12/unassigned-task-detection.md` への登録要否を判定。

### Step 3: production プロジェクト作成（lane 3 / **Phase 13 ユーザー承認後のみ実行**）

> ⚠️ **本 Phase ではコマンドを記述するが実行は禁止**。実 create は Phase 13 ユーザー承認後の別オペレーションで実走。`wrangler` を直接呼ばない（CLAUDE.md / AC-14）。

```bash
# 既存衝突チェック（R-7）
bash scripts/cf.sh pages project list | jq -r '.[].name' | sort | rg "^ubm-hyogo-web$"
# => 出力空（既存なし）なら create 可 / 出力ありなら命名再検討

# production プロジェクト作成（必須引数 3 つを必ず付与）
bash scripts/cf.sh pages project create ubm-hyogo-web \
  --production-branch=main \
  --compatibility-flags=nodejs_compat \
  --compatibility-date=2025-01-01

# 直後の確認（T1 / T2 / T3）
bash scripts/cf.sh pages project list \
  | jq -r '.[] | select(.name == "ubm-hyogo-web") | {name, production_branch, compatibility_date, compatibility_flags}'
# 期待: name=ubm-hyogo-web / production_branch=main / compatibility_date=2025-01-01 / compatibility_flags に nodejs_compat
```

- 確認: T1（プロジェクト存在）/ T2（`production_branch=main`）/ T3（`compatibility_date=2025-01-01` / `nodejs_compat`）が Green。
- 失敗時:
  - 401 → `bash scripts/cf.sh whoami` で Token 認証確認。01b で Token 再発行が必要なら 01b に戻る（R-6）。
  - 409 → 同名衝突。命名再検討（R-7）。Variable `CLOUDFLARE_PAGES_PROJECT` 値も同期更新が必要なら UT-27 へフィードバック。
  - `--production-branch` 未指定で create → 既定 `main` で作成されるが意図不明確。delete → 再 create で明示。
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで `outputs/phase-13/apply-runbook.md §production` に手順追記する形でコミット 1）。

### Step 4: staging プロジェクト作成（lane 4 / **Phase 13 ユーザー承認後のみ実行**）

```bash
# 既存衝突チェック
bash scripts/cf.sh pages project list | jq -r '.[].name' | sort | rg "^ubm-hyogo-web-staging$"

# staging プロジェクト作成（production_branch=dev に注意）
bash scripts/cf.sh pages project create ubm-hyogo-web-staging \
  --production-branch=dev \
  --compatibility-flags=nodejs_compat \
  --compatibility-date=2025-01-01

# 直後の確認（T1 / T2 / T3）
bash scripts/cf.sh pages project list \
  | jq -r '.[] | select(.name == "ubm-hyogo-web-staging") | {name, production_branch, compatibility_date, compatibility_flags}'
# 期待: name=ubm-hyogo-web-staging / production_branch=dev / compatibility_date=2025-01-01 / compatibility_flags に nodejs_compat
```

- 確認: T1 / T2（`production_branch=dev`）/ T3 が Green。
- 失敗時: Step 3 と同様。特に `--production-branch=dev` の渡し忘れに注意（R-2 / 苦戦箇所 §2）。既定の `main` で作成されると staging が production scope で main 追従して preview 化する事故になり得る。
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで `outputs/phase-13/apply-runbook.md §staging` に手順追記する形でコミット 2）。

### Step 5: 設定確認 + 動作確認（lane 5 / **Phase 13 ユーザー承認後のみ実行**）

#### 5.1 プロジェクト 2 件存在確認（T1）

```bash
bash scripts/cf.sh pages project list \
  | jq -r '[.[] | {name, production_branch, compatibility_date, compatibility_flags}] | sort_by(.name)'
# 期待: 2 件並ぶ
#   - ubm-hyogo-web         / production_branch=main / 2025-01-01 / [nodejs_compat]
#   - ubm-hyogo-web-staging / production_branch=dev  / 2025-01-01 / [nodejs_compat]
```

#### 5.2 Pages Git 連携 OFF 確認（T6 / 苦戦箇所 §5）

1. Cloudflare Dashboard → Pages → `ubm-hyogo-web` → Settings → Builds & deployments を開く。
2. "Connect to Git" / "Git Integration" が OFF（または未接続）であることを目視確認。
3. ON になっている場合は OFF に切り替える（既存ブランチへの自動 deploy を即停止）。
4. `ubm-hyogo-web-staging` でも同様に OFF を確認。
5. 補助確認: `bash scripts/cf.sh pages project list` の出力に `source` フィールドがある場合、`null` / `direct_upload` であることを `jq` で確認。

#### 5.3 dev push staging deploy smoke（T4）

```bash
git checkout dev
git pull --ff-only origin dev
git commit --allow-empty -m "chore(cd): trigger staging deploy smoke [UT-28]"
git push origin dev

# CD 結果観測
gh run watch
gh run list --workflow web-cd.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
# => success

# 公開 URL 動作確認（公開 URL は記録可）
curl -sS -o /dev/null -w "staging top: %{http_code}\n" https://ubm-hyogo-web-staging.pages.dev
# => 200

# Cloudflare 側 deploy 履歴（preview alias でないこと / Git 連携由来の重複なし）
bash scripts/cf.sh pages deployment list --project-name=ubm-hyogo-web-staging \
  | jq -r '.[0] | {environment, source, branch}'
# 期待: environment=production / source=GitHub Actions 由来 / branch=dev
```

- 確認: T4（dev push → staging deploy green）が Green。Variable `CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web` の suffix 連結結果が `ubm-hyogo-web-staging` と一致して `pages deploy` が 200。
- 失敗時:
  - 8000017 (Project not found) → Step 4 完了済みか / Variable 値（UT-27 側）が `ubm-hyogo-web` か確認（R-4）。
  - 401 → Step 0 / Step 1 で Token 認証再確認（R-6）。
  - `_worker.js` 不在で SSR / API ルート 500 → Step 2 判定 (B) 確定 → Phase 12 で UT-05 にフィードバック登録（R-1）。
  - preview alias `<commit>.<project>.pages.dev` 化 → Step 4 で `--production-branch=dev` 未指定（R-2）。delete → 再 create。

#### 5.4 main push production deploy smoke（T5）

```bash
# dev → main の PR を経由して main を進める（通常運用）
# 例: gh pr create --base main --head dev / gh pr merge --merge

# CD 結果観測
gh run watch
gh run list --workflow web-cd.yml --branch main --limit 1 --json conclusion --jq '.[0].conclusion'
# => success

curl -sS -o /dev/null -w "production top: %{http_code}\n" https://ubm-hyogo-web.pages.dev
# => 200

bash scripts/cf.sh pages deployment list --project-name=ubm-hyogo-web \
  | jq -r '.[0] | {environment, source, branch}'
# 期待: environment=production / branch=main
```

- 確認: T5（main push → production deploy green）が Green。
- 失敗時: T4 と同様の切り分け（命名 / Token / OpenNext / production_branch）。本番影響があるため Phase 11 smoke 段階で要点検。

#### 5.5 OpenNext アップロード整合性確認（T7）

```bash
# T4 / T5 deploy 後に SSR / API ルートが 5xx / 404 にならないこと
curl -sS -o /dev/null -w "staging api: %{http_code}\n" https://ubm-hyogo-web-staging.pages.dev/api/health/db
curl -sS -o /dev/null -w "production api: %{http_code}\n" https://ubm-hyogo-web.pages.dev/api/health/db
```

- Cloudflare Dashboard → Pages → 各プロジェクト → 最新 deploy → Functions タブで `_worker.js` 登録を目視。
- 不在 → 判定 (B) 確定 → Phase 12 で UT-05 にフィードバック登録（R-1）。
- 結果は `outputs/phase-11/manual-smoke-log.md` / `outputs/phase-13/verification-log.md` に記録（**Account ID / 秘匿 ID は記録しない / 公開 URL とプロジェクト名のみ**）。
- コミット粒度: **本ワークフローではコミットしない**（Phase 13 別オペで verification-log.md にコミット 3）。

## コミット粒度（Phase 13 別オペ側で実施）

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `docs(infra): record UT-28 production pages project creation runbook` | apply-runbook.md §production | `--production-branch=main` / `--compatibility-date=2025-01-01` / `--compatibility-flags=nodejs_compat` 必須引数の付与 / 値転記なし |
| 2 | `docs(infra): record UT-28 staging pages project creation runbook` | apply-runbook.md §staging | `--production-branch=dev` の付与 / 命名 `<base>-staging` / 値転記なし |
| 3 | `docs(infra): record UT-28 verification log (project list / dev push staging / main push production / git off / opennext)` | verification-log.md / manual-smoke-log.md | T1〜T7 の結果（Account ID なし / 公開 URL のみ） / OpenNext 判定 (A)/(B) 結論 |

> **3 コミット粒度を分離する理由**: 配置領域（production / staging / 検証）ごとに 1 コミットに保ち、片方向の revert で部分復元可能にする。API Token / Account ID / 秘匿 ID を含むコマンド出力をコミット差分に含めない境界を明示する。

## `bash scripts/cf.sh` ラッパーパターン（`wrangler` 直接実行禁止）

| パターン | 例 | 理由 |
| --- | --- | --- |
| `bash scripts/cf.sh ...`（推奨 / 必須） | `bash scripts/cf.sh pages project create ubm-hyogo-web --production-branch=main ...` | `op run --env-file=.env` で API Token を 1Password から動的注入 / `mise exec` で Node 24 / `ESBUILD_BINARY_PATH` でグローバル esbuild 不整合を解決 |
| ❌ `wrangler` 直接実行 | `wrangler pages project create ...` | CLAUDE.md 違反 / Token を別経路で渡す必要が出る / Node バージョン揺れ / esbuild 不整合 / **AC-14 違反** |
| ❌ `npx wrangler` | `npx wrangler pages project create ...` | 同上。スクリプト実行で Token 注入経路が分散する |
| ❌ Cloudflare Dashboard 手動操作 | GUI でプロジェクト作成 | 案 B（Phase 3 で不採用）。再現性ゼロ / タイポリスク / `production_branch` / 互換性入力ミスが検出されにくい |
| ❌ Token 値直書き | `bash scripts/cf.sh ... --token "actual-token"` | shell history・スクリーンレコーディング・スクショ残存。**禁止**（AC-13） |

## 検証コマンド（実装担当者向け / NOT EXECUTED）

```bash
# Step 1 完了後
test -s /tmp/ut-28-workflow-keys.txt && rg -c "CLOUDFLARE_PAGES_PROJECT|pages deploy" /tmp/ut-28-workflow-keys.txt
# => 1 以上

# Step 2 完了後
grep -E "pages_build_output_dir" apps/web/wrangler.toml
# 判定 (A) or (B) を outputs/phase-02/main.md §opennext-judgement に記録

# Step 3 完了後（Phase 13 承認後）
bash scripts/cf.sh pages project list \
  | jq -r '[.[] | select(.name == "ubm-hyogo-web") | {name, production_branch, compatibility_date}]'
# => [{ "name": "ubm-hyogo-web", "production_branch": "main", "compatibility_date": "2025-01-01" }]

# Step 4 完了後（T1 / T2 / T3）
bash scripts/cf.sh pages project list \
  | jq -r '[.[] | select(.name == "ubm-hyogo-web-staging") | {name, production_branch, compatibility_date}]'
# => [{ "name": "ubm-hyogo-web-staging", "production_branch": "dev", "compatibility_date": "2025-01-01" }]

# Step 5 完了後（T4 / T5 / T6 / T7 / Phase 13 承認後）
gh run list --workflow web-cd.yml --branch dev  --limit 1 --json conclusion --jq '.[0].conclusion'
gh run list --workflow web-cd.yml --branch main --limit 1 --json conclusion --jq '.[0].conclusion'
curl -sS -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web-staging.pages.dev
curl -sS -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-web.pages.dev
```

## 完了条件

- [ ] Step 0〜5 が `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] 上流 2 件完了確認が Step 0 ゲートとして明記されている
- [ ] 3 コミット粒度（production / staging / verification-log）が Phase 13 別オペ側の分離設計として明記されている
- [ ] `bash scripts/cf.sh ...` 経由ラッパーパターンが Step 3 / 4 / 5 で徹底されている（`wrangler` 直接実行なし）
- [ ] `--production-branch=main` / `--production-branch=dev` の環境別配線が Step 3 / Step 4 で明示されている（R-2）
- [ ] `--compatibility-date=2025-01-01` / `--compatibility-flags=nodejs_compat` が Step 3 / Step 4 必須引数として記述されている（R-3）
- [ ] OpenNext 判定 (A)/(B) と UT-05 フィードバック条件が Step 2 / Step 5.5 で明記されている（R-1）
- [ ] Pages Git 連携 OFF 確認が Step 5.2 にある（R-5）
- [ ] dev push smoke（T4）/ main push smoke（T5）が Step 5.3 / Step 5.4 にある
- [ ] 本ワークフローで実 `bash scripts/cf.sh pages project create` / `git push origin dev` / `git push origin main` を実行しない旨が明示されている
- [ ] API Token / Account ID / 秘匿 ID 値が Step 例 / 検証コマンド / コミット粒度説明に直書きされていない（公開 URL `*.pages.dev` のみ記載可 / AC-13）

## 苦戦防止メモ

1. **上流 2 件未完了で着手しない**: 値ミスマッチで CD 401 / 8000017 事故。Step 0 ゲートで block。
2. **`production_branch` 環境別配線（R-2）**: production=main / staging=dev を `--production-branch=` で必ず明示。staging で渡し忘れると preview alias 化で公開 URL が `<commit>.<project>.pages.dev` になる事故。Step 3 / 4 で必須引数固定 + 直後の `pages project list` で確認。
3. **`compatibility_date` Workers 同期（R-3）**: `apps/api/wrangler.toml` を正本として `2025-01-01` / `["nodejs_compat"]` を Step 3 / 4 で揃える。Workers 側更新時の同期運用は Phase 12 でドキュメント化。
4. **OpenNext 判定 (B) は workflow を本タスクで触らない**: `apps/web/wrangler.toml` / `web-cd.yml` の修正は UT-05 スコープ。本タスクではプロジェクト作成のみ実施し、Phase 12 で UT-05 にフィードバック登録（R-1）。
5. **`wrangler` 直接実行禁止**: 全コマンド系列を `bash scripts/cf.sh ...` 経由に固定（CLAUDE.md / AC-14）。`npx wrangler` も禁止。
6. **API Token / Account ID 値を一切転記しない**: payload / runbook / Phase outputs / 検証コマンド出力。公開 URL `https://*.pages.dev` のみ記録可（AC-13）。
7. **本 Phase 自身は実 create / push しない**: 仕様化のみ。Step 3〜5 の実走は Phase 13 ユーザー承認後の別オペレーション。
8. **Pages Git 連携 OFF を Dashboard 目視で確認**: `pages project list` の JSON だけでは判別しづらい場合があるため Step 5.2 で GUI 確認を併記（R-5）。
9. **命名衝突（R-7）**: create 前に `pages project list` で同名チェック。衝突時は命名再検討 + UT-27 への Variable 値同期更新フィードバック。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 3 コミット粒度の分離が異常系（401 / 8000017 / `production_branch` 取り違え / `compatibility_date` drift / 命名衝突 / Git 連携 ON 復活 / OpenNext `_worker.js` 不在）の前提
  - Step 1 の上流確認 inventory が Phase 6 異常系の入力
  - Step 3〜5 の実 create / push は Phase 13 ユーザー承認後（user_approval_required: true）
  - OpenNext 判定 (B) 確定時の workflow 修正フィードバックは UT-05 スコープ → Phase 12 unassigned-task-detection.md に登録
- ブロック条件:
  - 上流 2 件完了確認ゲートが Step 0 から欠落
  - `--production-branch=main` / `--production-branch=dev` の環境別配線が Step 3 / Step 4 から欠落
  - `--compatibility-date=2025-01-01` / `--compatibility-flags=nodejs_compat` が Step 3 / Step 4 から欠落
  - `bash scripts/cf.sh ...` 経由ラッパーが守られていない（`wrangler` 直接実行混入）
  - Pages Git 連携 OFF 確認が Step 5.2 から欠落
  - API Token / Account ID 値が Step 例 / 検証コマンド / コミット粒度説明に直書きされている
