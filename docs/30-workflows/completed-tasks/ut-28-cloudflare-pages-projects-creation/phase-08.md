# Phase 8: 品質ゲート / NON_VISUAL governance

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 品質ゲート / NON_VISUAL governance |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (統合検証 / E2E) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |

## 目的

Phase 1〜7 で確定した「Pages プロジェクト 2 件 / `production_branch` 環境別配線 / `compatibility_date` Workers 同期 / OpenNext アップロード判定 / Pages Git 連携 OFF / 命名規則」要件に対して、**NON_VISUAL タスクとしての品質ゲート governance** を確定する。具体的には (1) `required_status_checks` と本タスクの整合（Pages 作成は CI ジョブを追加しないが、UT-05 web-cd.yml の `deploy-staging` / `deploy-production` job が `required_status_checks` 配下にあるか / 並走時に他ジョブと衝突しないか）、(2) `check-runs` 並走時の重複起動回避（Pages 自動 Git 連携 OFF / GitHub Actions 主導の単一経路保証）、(3) Cloudflare Pages プロジェクト設定の **drift 検知方針**（`production_branch` / `compatibility_date` / `compatibility_flags` / Git 連携状態 を `bash scripts/cf.sh pages project list` ベースで定期確認する手順）、(4) NON_VISUAL ゆえに UI スクショではなく **CLI 出力 / API レスポンス JSON を evidence として `outputs/phase-08/` に保存する evidence 規律**、(5) AC-13（API Token / Account ID 値の転記禁止）の機械検証手順、を確定する。本ワークフローは仕様書整備に閉じるため、実 `pages project list` 走査・実 `gh api` PUT は Phase 11 / 13 に委ねるが、本 Phase で **検証コマンド SSOT** と **drift 検知運用ルール** を明文化する。

## 実行タスク

1. `required_status_checks` × 本タスク（UT-28）境界の整合確認手順を確定する（完了条件: `gh api repos/{owner}/{repo}/branches/main/protection` / `.../dev/protection` の `required_status_checks.contexts` に web-cd.yml の `deploy-staging` / `deploy-production` job 名が登場しないことを確認する手順が記述。Pages 作成は CI/CD ステータスを追加せず、UT-05 側で job 名運用が確定済みであるため drift しないことを表明）。
2. `check-runs` 並走時の重複起動回避手順を確定する（完了条件: Pages 自動 Git 連携 OFF を `gh api` または Dashboard 目視で確認、GitHub Actions の `pages deploy` ステップが単一経路で起動することを `gh run list --workflow=web-cd.yml` 出力で確認する手順が記述）。
3. Cloudflare Pages プロジェクト設定の drift 検知方針を確定する（完了条件: `bash scripts/cf.sh pages project list` / `bash scripts/cf.sh pages project info <name>` の出力 JSON を `outputs/phase-08/pages-project-drift.json` に保存し、`production_branch` / `compatibility_date` / `compatibility_flags` / Git 連携状態 / 公開 URL の 5 列で diff を取る方針が記述）。
4. NON_VISUAL evidence 規律を確定する（完了条件: UI スクショを成果物としない / 代わりに `bash scripts/cf.sh pages project list` 出力 + `gh run view <run-id> --log` 抜粋 + `gh api` JSON レスポンス を `outputs/phase-08/` 配下に保存する規律が記述、API Token 値・Account ID 値はマスクする運用が AC-13 と整合）。
5. AC-13（API Token / Account ID / プロジェクト ID 値の転記禁止）の機械検証手順を確定する（完了条件: `grep -rE 'CLOUDFLARE_API_TOKEN[[:space:]]*=[[:space:]]*["'\'']?[a-zA-Z0-9_-]{40,}'` / `\b[a-f0-9]{32}\b` 等のパターンで `outputs/phase-08/` 配下と本ワークフロー全体を走査、検出 0 を期待する `verify_no_secret_leak()` を SSOT として定義）。
6. line budget / link 整合 / navigation drift 確認手順を `validate-phase-output.js` で機械検証する（完了条件: exit 0 を期待値として記述、pending 段階では NOT EXECUTED 許容）。
7. 対象内 / 対象外項目を明記する（完了条件: secret hygiene / drift 検知 / status checks 整合 / NON_VISUAL evidence 規律 が対象内、UI a11y / 無料枠課金 / Lighthouse は対象外として記述）。
8. outputs/phase-08/main.md に品質ゲートチェックリストを集約する（完了条件: 1 ファイルに評価軸・期待値・実走時のプレースホルダがすべて記述、pending のため NOT EXECUTED 表記可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-02.md | base case（lane 1〜5 / 設定一致表 / コマンド草案） |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-03.md | base case 最終判定（PASS with notes）|
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-07.md | AC マトリクス（pending） |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md §苦戦箇所・知見 | リスク源（§2 production_branch / §3 compatibility / §5 Git 連携二重起動） |
| 必須 | .github/workflows/web-cd.yml | Pages deploy job 名 / `required_status_checks` 連携対象 |
| 必須 | apps/web/wrangler.toml | `compatibility_date` / `compatibility_flags` の現状値 |
| 必須 | apps/api/wrangler.toml | Workers 側 `compatibility_date = "2025-01-01"` の正本 |
| 必須 | scripts/cf.sh | `wrangler` ラッパーの正規経路（drift 検知でも本ラッパー経由のみ） |
| 必須 | CLAUDE.md（Governance / branch protection 節）| `required_status_checks` / `lock_branch` / `enforce_admins` の正本ポリシー |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 機械検証スクリプト |
| 参考 | docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/phase-09.md | 同型 NON_VISUAL QA phase の構造参照 |

## 上流 2 件完了確認再掲

> Phase 1 / 2 / 3 で 3 重明記済み。本 Phase は品質ゲート段階のため新規重複明記は行わないが、Phase 11 / 13 着手時に `bash scripts/cf.sh whoami` + `gh pr list --search "UT-05" --state merged` を再走することを runbook で求める。

## 品質ゲート観点 1: `required_status_checks` × UT-28 境界の整合

### 1.1 観点

- 本タスク（UT-28）は **CI ジョブを追加しない**。Pages プロジェクト 2 件の Cloudflare 側作成は GitHub Actions step ではなく `bash scripts/cf.sh pages project create ...` をローカル/承認後オペレーションで 1 回ずつ実行する性質のもの。
- したがって `required_status_checks.contexts` に新規 job 名は追加されない。
- 一方、UT-05 で `.github/workflows/web-cd.yml` に追加された `deploy-staging` / `deploy-production` job は、本タスクで Pages プロジェクトが作成されることで初めて green 化する。`required_status_checks` 配下に組み込むかどうかは UT-GOV-001 + UT-05 側の判断であり、本タスクは「組み込み済みであっても drift しないこと」を確認するに留める。

### 1.2 確認スクリプト（pending の擬似）

```bash
# main / dev branch protection の required_status_checks.contexts を取得
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts // []' \
  > outputs/phase-08/branch-protection-main.json

gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts // []' \
  > outputs/phase-08/branch-protection-dev.json

# UT-28 が job 名を追加していないことの逆向き確認（Pages 作成系の job 名が contexts に含まれない）
grep -E '"pages-project-create|pages-project-apply|cloudflare-pages-create"' \
  outputs/phase-08/branch-protection-*.json \
  && echo "NG: UT-28 が job 名を required_status_checks に紛れ込ませている" \
  || echo "OK: UT-28 は required_status_checks に新規 job を追加していない"
```

### 1.3 期待結果

- `branch-protection-main.json` / `branch-protection-dev.json` がそれぞれ JSON で保存され、API Token / Account ID 値を含まないこと。
- `pages-project-create` 系の job 名が `contexts` に含まれない（= UT-28 が status checks 設計に介入していない）。
- `deploy-staging` / `deploy-production` job 名が UT-05 側の運用と整合（含まれていれば PASS / 含まれていなくても本タスク的には NEUTRAL = UT-05 / UT-GOV-001 側の判断）。

## 品質ゲート観点 2: `check-runs` 並走時の重複起動回避

### 2.1 観点

- 苦戦箇所 §5: Pages 自動 Git 連携 ON だと、Cloudflare 側 build と GitHub Actions deploy が同一ブランチに対し並走し、`check-runs` が二重に張られる。これを Pages Git 連携 OFF 既定方針で防ぐ（Phase 2 R-5 / Phase 3 案 D 不採用）。
- 確認は (a) Cloudflare 側プロジェクト設定で Git 連携が無効、(b) `gh run list --workflow=web-cd.yml --branch=dev --limit=5` の最新 5 件で同一 SHA に対し 1 run しか走っていない、の 2 点。

### 2.2 確認スクリプト

```bash
# (a) Pages Git 連携 OFF 確認（プロジェクト設定の source 関連 field が空 / null）
bash scripts/cf.sh pages project info ubm-hyogo-web \
  > outputs/phase-08/project-info-prod.json
bash scripts/cf.sh pages project info ubm-hyogo-web-staging \
  > outputs/phase-08/project-info-staging.json

# Git 連携が OFF なら "source": null または "source.type": null を期待
jq -r '.source // null' outputs/phase-08/project-info-prod.json
jq -r '.source // null' outputs/phase-08/project-info-staging.json

# (b) GitHub Actions 単一起動確認（同一 SHA に対し web-cd.yml 1 run のみ）
gh run list --workflow=web-cd.yml --branch=dev --limit=10 \
  --json databaseId,headSha,conclusion,status \
  > outputs/phase-08/web-cd-runs-dev.json

# headSha 重複時に web-cd run が複数あれば NG
jq -r 'group_by(.headSha) | map(select(length > 1)) | length' \
  outputs/phase-08/web-cd-runs-dev.json
```

### 2.3 期待結果

- `project-info-*.json` で `source` が `null`（Git 連携 OFF）。
- 同一 SHA に対する `web-cd.yml` run が 1 件のみ（重複 0）。
- 1 件でも違反なら Phase 11 smoke で blocker 化、Phase 12 で UT-05 / 運用ドキュメントへフィードバック。

## 品質ゲート観点 3: Cloudflare Pages プロジェクト設定 drift 検知

### 3.1 観点

苦戦箇所 §2 / §3 / §5 由来の drift（Cloudflare Dashboard で誰かが手動編集した結果、`production_branch` / `compatibility_date` / `compatibility_flags` / Git 連携 が想定値から乖離する事故）を、`bash scripts/cf.sh` 経由の API レスポンス JSON で機械検出する。

### 3.2 drift 検知マトリクス

| 環境 | 項目 | 期待値 | 取得方法 |
| --- | --- | --- | --- |
| production | `production_branch` | `main` | `jq -r '.production_branch'` on `project-info-prod.json` |
| production | `compatibility_date` | `2025-01-01`（または以降の Workers 同期値） | `jq -r '.deployment_configs.production.compatibility_date'` |
| production | `compatibility_flags` | `["nodejs_compat"]` を含む | `jq -r '.deployment_configs.production.compatibility_flags'` |
| production | Git 連携 | `null`（OFF） | `jq -r '.source'` |
| staging | `production_branch` | `dev` | `jq -r '.production_branch'` on `project-info-staging.json` |
| staging | `compatibility_date` | production と同一 | 同上 staging |
| staging | `compatibility_flags` | production と同一 | 同上 staging |
| staging | Git 連携 | `null`（OFF） | 同上 staging |

### 3.3 検証スクリプト

```bash
verify_pages_drift() {
  local rc=0
  local file="$1"
  local expected_branch="$2"

  local branch
  branch=$(jq -r '.production_branch' "$file")
  if [ "$branch" != "$expected_branch" ]; then
    echo "DRIFT: production_branch in $file = $branch (expected $expected_branch)"
    rc=1
  else
    echo "OK:    production_branch in $file = $branch"
  fi

  local compat_date
  compat_date=$(jq -r '.deployment_configs.production.compatibility_date // empty' "$file")
  case "$compat_date" in
    2025-01-01|2025-*|2026-*)
      echo "OK:    compatibility_date in $file = $compat_date"
      ;;
    *)
      echo "DRIFT: compatibility_date in $file = $compat_date (expected >= 2025-01-01)"
      rc=1
      ;;
  esac

  local flags
  flags=$(jq -r '.deployment_configs.production.compatibility_flags // [] | join(",")' "$file")
  case "$flags" in
    *nodejs_compat*)
      echo "OK:    compatibility_flags in $file contain nodejs_compat"
      ;;
    *)
      echo "DRIFT: compatibility_flags in $file = $flags (expected nodejs_compat)"
      rc=1
      ;;
  esac

  local source
  source=$(jq -r '.source // "null"' "$file")
  if [ "$source" != "null" ]; then
    echo "DRIFT: source in $file = $source (expected null = Git 連携 OFF)"
    rc=1
  else
    echo "OK:    source in $file = null (Git 連携 OFF)"
  fi

  return $rc
}

verify_pages_drift outputs/phase-08/project-info-prod.json    main
verify_pages_drift outputs/phase-08/project-info-staging.json dev
```

### 3.4 期待結果

- 2 ファイル × 4 項目 = 8 セルすべて `OK`。
- 1 件でも `DRIFT` があれば Phase 11 smoke で再現確認、Phase 13 着手前に必ず修正（`bash scripts/cf.sh pages project delete` → 再 create で復元）。
- pending 段階では Cloudflare 認証未確立 / プロジェクト未作成のため SKIP 扱い、Phase 11 dev push smoke 後 / Phase 13 本適用直後に必ず実走。

### 3.5 drift 検知の運用頻度

| タイミング | 実走者 | 目的 |
| --- | --- | --- |
| Phase 11 dev push smoke 直後 | Phase 11 担当 | リハーサル時点での設定整合確認 |
| Phase 13 本適用直後 | Phase 13 担当 | 本作成直後の確認 |
| 月次（運用化後） | 運用者 | 手動編集 drift の継続検知（Phase 12 ドキュメントに記載） |
| 案件発生時 | 運用者 | カスタムドメイン追加（UT-16）/ Workers 互換性更新時 |

## 品質ゲート観点 4: NON_VISUAL evidence 規律

### 4.1 観点

本タスクは **UI 変更を含まない**（Cloudflare Pages 公開 URL は HTTP 200 のみ確認、レイアウト確認はしない）。したがって UI スクリーンショット / Lighthouse / 視覚回帰テスト は不要。代わりに以下の CLI / API JSON を evidence として `outputs/phase-08/` 配下に保存する。

### 4.2 evidence 一覧

| evidence | 保存先 | 取得コマンド | マスク対象 |
| --- | --- | --- | --- |
| Pages プロジェクト一覧 | `outputs/phase-08/project-list.txt` | `bash scripts/cf.sh pages project list` | Account ID 部分（hex 32 桁） |
| Pages プロジェクト詳細（production） | `outputs/phase-08/project-info-prod.json` | `bash scripts/cf.sh pages project info ubm-hyogo-web` | Account ID / 内部 deployment ID |
| Pages プロジェクト詳細（staging） | `outputs/phase-08/project-info-staging.json` | `bash scripts/cf.sh pages project info ubm-hyogo-web-staging` | 同上 |
| branch protection（main） | `outputs/phase-08/branch-protection-main.json` | `gh api repos/.../branches/main/protection` | secret 値なし（公開可） |
| branch protection（dev） | `outputs/phase-08/branch-protection-dev.json` | 同上 dev | 同上 |
| web-cd.yml 直近 run（dev） | `outputs/phase-08/web-cd-runs-dev.json` | `gh run list --workflow=web-cd.yml --branch=dev --limit=10 --json ...` | 公開可 |
| drift 検知サマリー | `outputs/phase-08/drift-summary.md` | `verify_pages_drift` 出力 | OK/DRIFT 結果のみ |

### 4.3 マスク方針（AC-13 整合）

- API Token 値: 出力に含まれないことが期待値（`bash scripts/cf.sh` 経由で op 動的注入のみ、ファイル保存物には残らない）。万が一含まれていたら即時削除 + token ローテーション。
- Account ID（hex 32 桁）: 公開 evidence として保存する場合は `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` 形式に置換（`sed -E 's/[a-f0-9]{32}/xxxxxxxx/g'`）。ただし本タスク内部の `outputs/phase-08/` には raw のまま保存し、Phase 12 ドキュメント転記時にマスクする運用も可（運用判断は Phase 13 で確定）。
- Deployment ID / project_id（UUID 等）: マスク不要（公開 URL から推測可能）。
- 公開 URL（`https://ubm-hyogo-web.pages.dev` 等）: 公開可。

## 品質ゲート観点 5: AC-13 機械検証（API Token / Account ID 転記禁止）

### 5.1 検出パターン

| 種別 | 正規表現 | 期待ヒット数 |
| --- | --- | --- |
| Cloudflare API Token | `CLOUDFLARE_API_TOKEN[[:space:]]*=[[:space:]]*["'\'']?[a-zA-Z0-9_-]{40,}` | 0 |
| Cloudflare Account ID（コンテキスト付き） | `CLOUDFLARE_ACCOUNT_ID[[:space:]]*=[[:space:]]*["'\'']?[a-f0-9]{32}` | 0 |
| OAuth トークン様 | `Bearer\s+[A-Za-z0-9_.-]{40,}` | 0 |
| op run 出力混入（誤実行起源） | `^export\s+CLOUDFLARE_API_TOKEN=` | 0 |
| プレーン Account ID（hex 32 桁裸） | `\b[a-f0-9]{32}\b`（コンテキスト確認後に判定） | 注意確認 |

### 5.2 検証スクリプト

```bash
verify_no_secret_leak() {
  local rc=0
  local target="docs/30-workflows/ut-28-cloudflare-pages-projects-creation/"

  # CF API Token
  if grep -rnE 'CLOUDFLARE_API_TOKEN[[:space:]]*=[[:space:]]*["'\'']?[a-zA-Z0-9_-]{40,}' "$target"; then
    echo "NG: CLOUDFLARE_API_TOKEN value leaked"
    rc=1
  fi

  # Account ID コンテキスト付き
  if grep -rnE 'CLOUDFLARE_ACCOUNT_ID[[:space:]]*=[[:space:]]*["'\'']?[a-f0-9]{32}' "$target"; then
    echo "NG: CLOUDFLARE_ACCOUNT_ID value leaked"
    rc=1
  fi

  # Bearer
  if grep -rnE 'Bearer\s+[A-Za-z0-9_.-]{40,}' "$target"; then
    echo "NG: Bearer token leaked"
    rc=1
  fi

  # op run export 混入
  if grep -rnE '^export\s+CLOUDFLARE_API_TOKEN=' "$target"; then
    echo "NG: op run export line leaked into outputs"
    rc=1
  fi

  [ $rc -eq 0 ] && echo "OK: no secret leaks detected"
  return $rc
}
verify_no_secret_leak
```

### 5.3 期待結果

- すべて 0 ヒット。
- 1 件でも検出されたら即時 Phase 11 / 13 ともに blocker 化、対象 phase / outputs を直ちに修正、必要に応じて token ローテーション。

## 品質ゲート観点 6: line budget / link 整合 / navigation drift

| チェック | 方法 | 期待 |
| --- | --- | --- |
| line budget (phase-NN.md) | `wc -l docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-*.md` | 各 200〜500 行 |
| line budget (index.md) | 同上 | 250 行以内 |
| line budget (outputs/main.md) | 同上 | 50〜400 行 |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| Phase 13 outputs 3 ファイル | main + apply-runbook + verification-log | 一致 |
| 相対参照リンク切れ | `grep -rn '](\.\./'` + ls 突合 | 0 |
| `validate-phase-output.js` | 実走 | exit 0 |

## 対象内 / 対象外項目（明記）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| secret hygiene（AC-13 機械検証 / API Token 転記禁止 / Account ID マスク） | **対象内（主目的の一部）** | 本タスクの中核責務 |
| `required_status_checks` × UT-28 境界整合 | 対象内 | UT-GOV-001 / UT-05 と本タスクの責務分離確認 |
| `check-runs` 並走重複検出（Pages Git 連携 OFF） | 対象内 | 苦戦箇所 §5 直接対応 |
| Cloudflare Pages プロジェクト設定 drift 検知 | 対象内 | 苦戦箇所 §2 / §3 由来 |
| NON_VISUAL evidence 規律（CLI 出力 / JSON 保存） | 対象内 | UI スクショ不要を明文化、AC-13 マスク方針と整合 |
| line budget / link 整合 / drift | 対象内 | 仕様書品質の最低保証 |
| UI a11y（WCAG 2.1） | 対象外 | UI を触らない（Cloudflare Pages 公開 URL の可用性のみ確認） |
| Lighthouse / 視覚回帰 | 対象外 | NON_VISUAL のため不要 |
| 無料枠課金見積 | 対象外 | Cloudflare Pages 無料枠内で完結、Workers / D1 不関与 |
| Workers 側 deployment ロールバック手順 | 対象外 | UT-06 / 別タスクのスコープ |
| カスタムドメイン HTTPS 確認 | 対象外 | UT-16 のスコープ |

## 検証コマンド SSOT

> 各関数の本体は §1 / §2 / §3 / §5 を参照。本セクションは呼び出し順のみ。

```bash
# 0. evidence ディレクトリ準備
mkdir -p docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-08

# 1. branch protection 取得（§1.2）
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts // []' > outputs/phase-08/branch-protection-main.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts // []' > outputs/phase-08/branch-protection-dev.json

# 2. Pages プロジェクト情報取得（§2.2 / §3.3）
bash scripts/cf.sh pages project list > outputs/phase-08/project-list.txt
bash scripts/cf.sh pages project info ubm-hyogo-web         > outputs/phase-08/project-info-prod.json
bash scripts/cf.sh pages project info ubm-hyogo-web-staging > outputs/phase-08/project-info-staging.json

# 3. 重複起動チェック（§2.2）
gh run list --workflow=web-cd.yml --branch=dev --limit=10 \
  --json databaseId,headSha,conclusion,status > outputs/phase-08/web-cd-runs-dev.json

# 4. drift 検知（§3.3 verify_pages_drift）
# 5. AC-13 機械検証（§5.2 verify_no_secret_leak）
# 6. line budget
wc -l docs/30-workflows/ut-28-cloudflare-pages-projects-creation/phase-*.md \
      docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-*/main.md
# 7. validate-phase-output.js
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/ut-28-cloudflare-pages-projects-creation
```

## 品質ゲートチェックリスト（サマリー）

> 詳細は `outputs/phase-08/main.md`。本仕様書には観点のみ記載。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | `required_status_checks` × UT-28 境界整合 | UT-28 が job 名を追加していない | pending（実走可） |
| 2 | `check-runs` 並走重複（Pages Git 連携 OFF） | 同一 SHA 重複 run 0 / source = null | pending（Phase 11 後） |
| 3 | Pages プロジェクト drift 検知（2 環境 × 4 項目） | 8 セルすべて OK | pending（Phase 11 / 13 後） |
| 4 | NON_VISUAL evidence 規律 | 7 種 evidence が outputs/phase-08/ 配下に揃う | pending（実走可） |
| 5 | AC-13 機械検証（5 種パターン） | 0 ヒット | pending（実走可） |
| 6 | line budget | 範囲内 | pending（実走可） |
| 7 | navigation drift | 0 | pending（実走可） |
| 8 | secret hygiene | 対象内・全 PASS | pending |
| 9 | UI a11y / Lighthouse / 無料枠 | 対象外 | NON_VISUAL のため不要 |
| 10 | validate-phase-output.js | exit 0 | pending（実走可） |

## 実行手順

### ステップ 1: `required_status_checks` × UT-28 境界整合手順の固定

- `gh api` で main / dev branch protection を取得し、UT-28 が contexts に新規 job を追加していないことを確認する手順を確定。

### ステップ 2: `check-runs` 並走重複検出手順の固定

- `bash scripts/cf.sh pages project info` で Git 連携 OFF を JSON 確認 / `gh run list` で同一 SHA 重複 0 を確認する手順を確定。

### ステップ 3: Pages drift 検知マトリクスの固定

- 2 環境 × 4 項目（`production_branch` / `compatibility_date` / `compatibility_flags` / Git 連携）の期待値表を確定、`verify_pages_drift` 擬似コードを SSOT 化。

### ステップ 4: NON_VISUAL evidence 規律の固定

- 7 種 evidence の保存先・取得コマンド・マスク方針を確定。UI スクショ不要を明文化。

### ステップ 5: AC-13 機械検証手順の固定

- 4 種の検出パターン（CF API Token / Account ID コンテキスト付き / Bearer / op run export 混入）と `verify_no_secret_leak` 擬似コードを確定。

### ステップ 6: line budget / link 整合 / drift 確認手順の固定

- `wc -l` / `grep` / `validate-phase-output.js` の 3 ツール。

### ステップ 7: 対象外項目の理由付き明記

- a11y / Lighthouse / 無料枠 / Workers 側 / カスタムドメイン を対象外として理由付き記述。

### ステップ 8: outputs/phase-08/main.md 集約

- 品質ゲート 10 項目を 1 ファイルに集約（pending プレースホルダ可）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | drift 検知出力を E2E 入力に渡す（dev push → staging deploy 後の project-info JSON 比較） |
| Phase 10 | 品質ゲート 10 項目の判定結果を最終 GO/NO-GO 根拠に渡す |
| Phase 11 | drift 検知 / 重複起動チェックを smoke 実走で再確認 |
| Phase 12 | implementation-guide.md に drift 検知運用ルール（月次走査）を転記、helper 化候補があれば unassigned-task-detection.md に登録 |
| Phase 13 | PR description に品質ゲート結果サマリーを転記、本適用直後に AC-13 機械検証 + drift 検知を再実走 |

## 多角的チェック観点

- 価値性: drift 検知 / `check-runs` 並走防止 / status checks 整合の 3 観点で苦戦箇所 §2 / §3 / §5 を Phase 13 着手前に機械検出可能。
- 実現性: `gh api` / `bash scripts/cf.sh pages project list / info` / `jq` / 既存 validate-phase-output.js で完結、新規依存なし。
- 整合性: 不変条件 #5 を侵害しない / CLAUDE.md「`wrangler` 直接実行禁止」「API Token / Account ID 値転記禁止」と完全整合 / Workers 正本（`apps/api/wrangler.toml`）/ Pages 派生 の境界を drift 検知で保証。
- 運用性: 検証コマンド SSOT 化 / 月次走査運用ルール / NON_VISUAL evidence 規律で再現可能。
- 認可境界: `bash scripts/cf.sh` の op 動的注入経由のみ / Token 値は evidence に転記しない。
- NON_VISUAL: UI スクショ不要を明文化、CLI 出力 / JSON レスポンス で代替する規律を確定。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `required_status_checks` × UT-28 境界整合手順 | 8 | pending | 2 branch × 1 観点 |
| 2 | `check-runs` 並走重複検出手順 | 8 | pending | Pages Git 連携 OFF / 同一 SHA 重複 0 |
| 3 | Pages drift 検知マトリクス | 8 | pending | 2 環境 × 4 項目 |
| 4 | NON_VISUAL evidence 規律 | 8 | pending | 7 種 evidence + マスク方針 |
| 5 | AC-13 機械検証手順 | 8 | pending | 4 種パターン |
| 6 | line budget / link / drift 手順 | 8 | pending | validate-phase-output.js |
| 7 | 対象外項目の理由付き明記 | 8 | pending | a11y / Lighthouse / 無料枠 / Workers / カスタムドメイン |
| 8 | outputs/phase-08/main.md 集約 | 8 | pending | 品質ゲート 10 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 品質ゲート 10 項目の評価軸と期待値、pending プレースホルダ |
| evidence | outputs/phase-08/branch-protection-main.json | main branch protection の `required_status_checks.contexts` |
| evidence | outputs/phase-08/branch-protection-dev.json | dev 同上 |
| evidence | outputs/phase-08/project-list.txt | `bash scripts/cf.sh pages project list` 出力 |
| evidence | outputs/phase-08/project-info-prod.json | production プロジェクト詳細 JSON |
| evidence | outputs/phase-08/project-info-staging.json | staging プロジェクト詳細 JSON |
| evidence | outputs/phase-08/web-cd-runs-dev.json | `gh run list --workflow=web-cd.yml --branch=dev --limit=10` |
| evidence | outputs/phase-08/drift-summary.md | drift 検知 OK/DRIFT サマリー |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] `required_status_checks` × UT-28 境界整合手順が記述（main / dev × UT-28 が contexts に追加していない確認）
- [ ] `check-runs` 並走重複検出手順が記述（Pages Git 連携 OFF / 同一 SHA 重複 0）
- [ ] Pages drift 検知マトリクスが 2 環境 × 4 項目 = 8 セルで記述
- [ ] `verify_pages_drift` 擬似コードが SSOT として定義されている
- [ ] NON_VISUAL evidence 規律が 7 種 evidence + マスク方針で記述
- [ ] AC-13 機械検証が 4 種パターンで記述、`verify_no_secret_leak` 擬似コードが SSOT として定義されている
- [ ] 対象内 / 対象外項目が理由付きで明記（NON_VISUAL のため UI a11y / Lighthouse / 無料枠 が対象外）
- [ ] line budget / link 切れ / navigation drift 確認手順が記述
- [ ] validate-phase-output.js の期待値（exit 0）が記述
- [ ] outputs/phase-08/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `pending`
- 成果物 `outputs/phase-08/main.md` 配置予定
- secret hygiene が対象内、UI a11y / Lighthouse / 無料枠 が対象外として明記
- 検証コマンド SSOT が 1 箇所に集約
- artifacts.json の `phases[7].status` が `pending`

## 苦戦防止メモ

- `bash scripts/cf.sh pages project info` の出力 JSON には Account ID（hex 32 桁）が含まれる。`outputs/phase-08/` に raw 保存することは AC-13 の精神（API Token のみ厳禁・Account ID は内部リポジトリ可）と整合させ、Phase 12 ドキュメント転記時にマスクする運用で良い。判定が割れる場合は Phase 13 着手前にユーザー判断を仰ぐ。
- `gh api .../branches/{name}/protection` は Token に repo admin 相当のスコープが必要。CI ではなくローカルから実行する想定。pending 段階では SKIP 可。
- Pages Git 連携 OFF は **Cloudflare 側 default**（`wrangler pages project create` で作成した直後）。万が一 Dashboard で誤って ON にされた場合、`source` field が non-null になるので drift 検知で必ず引っかかる。
- `verify_pages_drift` の `compatibility_date` 比較で `2025-01-01` を完全一致にせず `2025-* | 2026-*` 許容にしているのは、Workers 側を将来更新した際に Pages 側へ追従更新する運用を想定しているため。Workers 側を変更したら必ず Pages 側も `bash scripts/cf.sh pages project ...` で同期する手順を Phase 12 ドキュメントに記載する。
- `gh run list` の同一 SHA 重複検出は Pages Git 連携 ON 状態の検出に有効だが、CI 内 retry で重複が出ることもあるため、検出時は Cloudflare 側 build run の存在を二重確認すること。

## 次 Phase への引き渡し

- 次 Phase: 9 (統合検証 / E2E)
- 引き継ぎ事項:
  - 品質ゲート 10 項目の判定結果（pending プレースホルダ）
  - drift 検知マトリクス（2 環境 × 4 項目）と `verify_pages_drift` 擬似コード
  - NON_VISUAL evidence 7 種の保存先・取得コマンド・マスク方針
  - AC-13 機械検証パターン 4 種と `verify_no_secret_leak` 擬似コード
  - 対象外項目（UI a11y / Lighthouse / 無料枠 / Workers / カスタムドメイン）
- ブロック条件:
  - drift 検知マトリクスに空セルが残る
  - NON_VISUAL evidence 規律で UI スクショ要件が混入
  - AC-13 検出パターンが 4 種未満
  - `bash scripts/cf.sh` 経由でない `wrangler` 直接実行が混入
  - 対象内 / 対象外の判定理由が欠落
