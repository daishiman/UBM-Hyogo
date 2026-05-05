# Phase 13: PR 作成 / ユーザー承認後 Pages プロジェクト作成実行（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 (ut-28-cloudflare-pages-projects-creation) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後 Pages プロジェクト作成実行 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / cloudflare_pages_projects_creation |
| **user_approval_required** | **true**（PR 作成承認 + 実 `wrangler pages project create` 承認 + 実 push smoke 承認 の 3 段独立） |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |
| GitHub Issue | #48 |

> **PR 作成・実 `bash scripts/cf.sh pages project create` / 実 dev push / 実 main push の実行は user の明示承認後のみ実施する。**
> 本 Phase 仕様書は (a) PR 草案、(b) commit / push / `gh pr create` 手順、(c) 実 Pages プロジェクト作成 runbook、(d) dev/main push smoke 実走 verification log を「予約」する目的で作成され、user の明示指示があるまで `git commit` / `git push` / `gh pr create` / `bash scripts/cf.sh pages project create` を一切実行しない。本ワークフロー成果物（仕様書・outputs）も Phase 13 完了時点では未コミット状態で待機する。

## 目的

Phase 1〜12 の成果物（Phase 1〜13 仕様書 + index.md + artifacts.json + outputs/artifacts.json + outputs/phase-{01..13}/）を 1 PR にまとめる。タスク分類は `implementation / NON_VISUAL / spec_created` であり、PR の差分ファイルが docs/spec 中心であることと taskType は分離する。user 明示承認後に：

1. PR を GitHub Issue #48 へリンクして提出（**spec PR**: repository 差分は Markdown / JSON 中心だが、タスク分類は implementation）
2. user 明示承認（実プロジェクト作成承認）後の **別オペレーション** として、`apply-runbook.md` に従い `bash scripts/cf.sh pages project create` で Pages プロジェクト 2 件を作成し、`verification-log.md` を確定させる
3. user 明示承認（実 push smoke 承認）後の **さらに別オペレーション** として、Phase 11 manual-smoke-log.md の 5 ステップを実走し、CD green / 公開 URL HTTP 200 / Git 連携 OFF / OpenNext 整合性を verify する

PR 草案は Phase 12 documentation-changelog を入力にする。実 Pages プロジェクト作成と実 push smoke は本 Phase 仕様書のコマンドに従い、user の三段承認後にのみ実行する。

## 成果物

| 種別 | パス | 生成タイミング |
| --- | --- | --- |
| Phase 13 index | `outputs/phase-13/main.md` | 本 workflow で作成済み |
| apply runbook | `outputs/phase-13/apply-runbook.md` | 本 workflow で作成（コマンド系列を spec として固定 / 実走時にログ追記） |
| verification log | `outputs/phase-13/verification-log.md` | 本 workflow で予約成果物を作成（user の実 push smoke 承認後にログ追記） |

## 承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 の状態 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜10 状態 | `pending`（本ワークフローは仕様書整備のみ） | 確認済 |
| Phase 11 必須 4 outputs | main.md / manual-smoke-log.md / manual-test-result.md / link-checklist.md が揃っている | 要確認 |
| Phase 12 必須 5+2 outputs | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check | 要確認 |
| Step 1-C 関連タスクリンク | 01b / UT-05 / UT-27 / UT-06 / UT-16 / UT-29 / UT-25 への双方向リンク更新 | **未完 / PR 前確認** |
| `web-cd.yml` 参照キー整合 | `${{ vars.CLOUDFLARE_PAGES_PROJECT }}` + `-staging` 連結が命名規則「`<base>` / `<base>-staging`」と整合 | **要確認（乖離なら実 PUT NO-GO）** |
| `compatibility_date` Workers 同期 | `apps/api/wrangler.toml` の `compatibility_date = "2025-01-01"` と Pages 側 `--compatibility-date=2025-01-01` が一致 | 要確認 |
| command help preflight | `bash scripts/cf.sh pages project create --help` で planned flags を確認。不足時は API/PATCH fallback を記録 | 要確認 |
| OpenNext GO 条件 | `.next` 例外理由または `.open-next` 形式修正が UT-05 / 正本仕様に記録済み | 要確認（未記録なら実 apply NO-GO） |
| API Token / Account ID / Project ID 値転記チェック | 0 件（Phase outputs / runbook / bash 例にも実値なし） | 要確認 |
| `wrangler` 直接実行混入チェック | 0 件（全コマンドが `bash scripts/cf.sh` 経由） | 要確認 |
| 計画系 wording 残存チェック | 0 件 | 要確認 |
| 上流 2 件（01b / UT-05）completed | 実 Pages プロジェクト作成の必須前提 | **要確認**（apply-runbook STEP 0） |
| user の明示承認（PR 作成） | user から「PR を作成してよい」の明示指示 | **承認待ち** |
| user の明示承認（実 Pages プロジェクト作成実行） | user から「実 `bash scripts/cf.sh pages project create` を実行してよい」の明示指示（PR 作成承認とは独立） | **承認待ち** |
| user の明示承認（実 push smoke 実行） | user から「実 dev push / 実 main push smoke を実行してよい」の明示指示（実 Pages プロジェクト作成承認とは独立） | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` / `bash scripts/cf.sh pages project create` を一切実行しない。**

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得）。
2. local-check（docs validator のみ。typecheck / lint / app test は本タスク無関係のため対象外）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. **user 明示承認後（PR 作成承認）**、ブランチ確認 → 必要なファイルを明示 add → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
6. **user 明示承認後（実 Pages プロジェクト作成承認 / PR マージ後の別オペレーション）**、`apply-runbook.md` の手順に従い：
   - `bash scripts/cf.sh whoami` / `op item get` / `gh pr list` で上流 2 件 completed 確認
   - command help preflight（`bash scripts/cf.sh pages project create --help`）で compatibility flags/date の指定可否確認
   - OpenNext アップロード判定（lane 2: `apps/web/wrangler.toml` / `apps/web/open-next.config.ts` / `web-cd.yml` 静的整合確認）。`.next` 例外理由または `.open-next` 形式修正が未記録なら実 apply NO-GO
   - `bash scripts/cf.sh pages project create ubm-hyogo-web --production-branch=main --compatibility-flags=nodejs_compat --compatibility-date=2025-01-01`（production）
   - `bash scripts/cf.sh pages project create ubm-hyogo-web-staging --production-branch=dev --compatibility-flags=nodejs_compat --compatibility-date=2025-01-01`（staging）
   - `bash scripts/cf.sh pages project list` で 2 件存在 + `production_branch` / 互換性 / Git 連携 OFF を確認
   - `verification-log.md` に作成日時 / マスク済みプロジェクト ID / `production_branch` / 互換性 / Git 連携状態を記録（Account ID / Project ID 等の秘匿値はマスク）
7. **user 明示承認後（実 push smoke 承認 / さらに別オペレーション）**、Phase 11 manual-smoke-log.md の STEP 2〜5 を実走し、`verification-log.md` に：
   - dev push commit SHA
   - `web-cd.yml` deploy-staging green run URL
   - `https://ubm-hyogo-web-staging.pages.dev` HTTP 200 応答
   - main push commit SHA / PR URL
   - `web-cd.yml` deploy-production green run URL
   - `https://ubm-hyogo-web.pages.dev` HTTP 200 応答
   - Pages Git 連携 OFF 確認結果
   - OpenNext 整合性確認結果（判定 (A) / (B)。(B) なら UT-05 へのフィードバックを Phase 12 unassigned-task-detection に登録済みであることを確認）

## local-check（spec file scope）

```bash
# 必須 outputs ファイル存在確認
ls docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/  # 4 files
ls docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/  # 7 files (main + 5 + compliance)
ls docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-13/  # 3 md files (main/apply-runbook/verification-log)
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/artifacts.json
test -f docs/30-workflows/ut-28-cloudflare-pages-projects-creation/artifacts.json

# root と outputs の artifacts.json parity 確認
diff docs/30-workflows/ut-28-cloudflare-pages-projects-creation/artifacts.json \
     docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/artifacts.json \
  && echo "OK: parity" || echo "NG: drift"

# screenshots/ が無いこと
test ! -d docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/screenshots && echo "OK: NON_VISUAL 整合"

# 計画系 wording 混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/ \
  || echo "計画系 wording なし"

# API Token / Account ID / Project ID 値混入チェック
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|CLOUDFLARE_ACCOUNT_ID=[a-f0-9]{32}" \
  docs/30-workflows/ut-28-cloudflare-pages-projects-creation/ \
  || echo "Secret 値混入なし"

# wrangler 直接実行混入チェック
rg -nE "^\s*wrangler\s|`wrangler\s" docs/30-workflows/ut-28-cloudflare-pages-projects-creation/ \
  | rg -v "scripts/cf.sh|参考リンク|Cloudflare Workers" \
  && echo "NG: wrangler 直接実行混入の可能性" || echo "OK: scripts/cf.sh 経由のみ"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-28-cloudflare-pages-projects-creation
```

## 実行手順

1. 承認ゲートと local-check を user に提示する。
2. user の明示承認（PR 作成）を得た場合のみ、ブランチ確認、明示 add、commit、push、PR 作成へ進む。
3. PR マージ後、user の明示承認（実 Pages プロジェクト作成実行）を別途取得し、`apply-runbook.md` の手順を実走する。
4. 実 Pages プロジェクト作成完了後、user の明示承認（実 push smoke 実行）をさらに別途取得し、Phase 11 manual-smoke-log.md の STEP 2〜5 を実走する。
5. user 承認が無い場合は本 Phase を NOT EXECUTED のまま保持する。
6. branch protection（`required_status_checks` / `required_linear_history` / `required_conversation_resolution`）に整合する形で merge する。`--no-verify` 等の hook skip / `--no-gpg-sign` は **絶対に使わない**。

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| **title** | `docs(workflow): add UT-28 Cloudflare Pages projects creation Phase 11-13 task spec (Issue #48)` |
| base | `dev` |
| head | 現行 worktree branch（例: `feat/issue-48-ut-28-cloudflare-pages-projects-task-spec`） |
| labels | `area:docs` / `task:ut-28` / `wave:1` / `infrastructure` |
| linked issue | #48（`Refs #48`: 本 PR は仕様書整備までで、Issue #48 の本体クローズは実 Pages プロジェクト作成 + push smoke 完了後の別 PR で行う） |

### PR body テンプレ

```markdown
## 概要
GitHub Issue #48「UT-28: Cloudflare Pages プロジェクト（staging / production）作成」の Phase 11〜13 タスク仕様書を `docs/30-workflows/ut-28-cloudflare-pages-projects-creation/` 配下に固定する spec PR。repository 差分は Markdown / JSON 中心だが、タスク分類は `implementation / NON_VISUAL / spec_created`。Phase 1〜3（要件定義 / 設計 / 設計レビュー）は同 worktree で先行整備済。

実 `bash scripts/cf.sh pages project create` による Pages プロジェクト 2 件作成、および実 dev/main push による CD smoke は本 PR の **マージ後**、user の三段承認（PR 作成 + 実プロジェクト作成 + 実 push smoke）後の別オペレーションで実施する。

## 動機
- task-github-governance / unassigned-task UT-28 で検出された「`web-cd.yml` の `pages deploy` が 8000017 (Project not found) で空振りする」問題を実行可能な spec へ昇格
- Pages プロジェクト 2 件（production: `ubm-hyogo-web` / staging: `ubm-hyogo-web-staging`）の命名・`production_branch` 環境別配線・`compatibility_date` Workers 同期・Pages Git 連携 OFF 既定 を仕様書として固定
- 上流（01b / UT-05）完了後の単独 PR として、UT-27（GitHub Variable 値）/ UT-06（本番デプロイ）/ UT-16（カスタムドメイン）/ UT-29（CD 後スモーク）の前提を確定

## 変更内容（spec files）
- 新規: `docs/30-workflows/ut-28-cloudflare-pages-projects-creation/{index.md,artifacts.json,phase-{01..13}.md}`
- 新規: `outputs/artifacts.json`（root `artifacts.json` と同期）
- 新規: `outputs/phase-{01..10}/main.md`
- 新規: `outputs/phase-11/{main,manual-smoke-log,manual-test-result,link-checklist}.md`（NON_VISUAL 代替 evidence 4 点）
- 新規: `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`（Phase 12 必須 5 + index + compliance）
- 新規: `outputs/phase-13/{main.md,apply-runbook.md,verification-log.md}`（PR 手順 + 実プロジェクト作成 runbook + 実走時追記先の予約成果物 / NOT EXECUTED — user 承認待ち）
- 同期: `docs/30-workflows/LOGS.md` / `.claude/skills/aiworkflow-requirements/references/{deployment-core,deployment-gha}.md` / `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json}`（`pnpm indexes:rebuild` で再生成）
- 判定: `.claude/skills/task-specification-creator/LOGS.md` は実ファイルなしのため対象外。`CLAUDE.md` は追記不要
- 予約: `unassigned-task/{01b-...,UT-05,UT-27,UT-06,UT-16,UT-29}-*.md` への双方向リンクは Phase 13 PR 前確認で扱う

## 動作確認
- Phase 11 NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）適用済（spec walkthrough）
- 5 ステップ smoke（前提確認 / `pages project list` / dev push / main push / Git 連携 OFF + OpenNext 整合性）のコマンド系列は仕様レベルで固定（NOT EXECUTED — 実走は本 PR マージ後の別オペレーション）
- docs validator PASS（root `artifacts.json` / `outputs/artifacts.json` parity）

## リスク・後方互換性
- **本 PR 自体は破壊的変更なし**（markdown / JSON のみ追加）
- apps/ / packages/ / migration / wrangler 設定 / GitHub Secrets / Cloudflare Secret への影響なし
- 実 `bash scripts/cf.sh pages project create` は **本 PR では実行しない**（user の三段承認後の別オペレーション）
- API Token / Account ID / Project ID の実値は本 PR の差分に**一切含まれない**
- `wrangler` 直接実行は本 PR の差分のコマンド例に**一切含まれない**（全て `bash scripts/cf.sh` 経由）

## 関連
- Refs #48
- 親タスク: `docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md`
- 上流前提: 01b（Cloudflare base bootstrap） / UT-05（CI/CD パイプライン実装）
- 下流: UT-27（GitHub Variable `CLOUDFLARE_PAGES_PROJECT` 値） / UT-06（本番デプロイ実行） / UT-16（カスタムドメイン） / UT-29（CD 後スモーク）
- 関連: UT-25（Cloudflare Secrets / SA JSON deploy）

## 注意事項
- UT-28 の実 Pages プロジェクト作成は **01b / UT-05 完了が必須前提**。1 件でも未完了下で実 create を走らせると 401 / Token スコープ不足 / 命名と `web-cd.yml` 参照キー乖離が発生するため、Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記している。
- OpenNext アップロード判定（`.next` vs `.open-next/assets`）は dev push smoke の runtime 結果で確定する。red の場合は本タスク内で `apps/web/wrangler.toml` / `web-cd.yml` を編集せず、UT-05 にフィードバックする（Phase 12 unassigned-task-detection に登録）。
- Pages Git 連携 OFF 既定方針を運用ルールに固定（GitHub Actions 主導 deploy と二重起動しない）。
- `compatibility_date` は Workers 側 (`apps/api/wrangler.toml`) を正本として `2025-01-01` で同期する。
```

## PR 作成コマンド（user 承認後のみ実行）

```bash
# 現在ブランチ確認
git status
git branch --show-current

# 必要なファイルを明示 add（git add . / -A は禁止）
git add docs/30-workflows/ut-28-cloudflare-pages-projects-creation/ \
        docs/30-workflows/LOGS.md \
        .claude/skills/aiworkflow-requirements/references/deployment-core.md \
        .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md

# コミット
git commit -m "$(cat <<'EOF'
docs(workflow): add UT-28 Cloudflare Pages projects creation Phase 11-13 task spec (Issue #48)

- ut-28-cloudflare-pages-projects-creation ワークフローの Phase 11/12/13 仕様書 + outputs を新規作成
- 5 ステップ smoke（前提確認 / `pages project list` / dev push / main push / Git 連携 OFF + OpenNext 整合性）のコマンド系列を仕様レベル固定
- 命名規則「production = `<base>` / staging = `<base>-staging`」 / `production_branch` 環境別配線（main / dev） / `compatibility_date = 2025-01-01` Workers 同期 / `compatibility_flags = ["nodejs_compat"]` / Pages Git 連携 OFF 既定 / API Token 最小スコープ / rollback 経路 を Phase 12 implementation-guide に固定
- `bash scripts/cf.sh pages project create` 経由のコマンド草案で `wrangler` 直接実行を排除（CLAUDE.md / AC-14 整合）
- 上流 2 件（01b / UT-05）完了必須前提を Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記
- 実 `bash scripts/cf.sh pages project create` および実 dev/main push は本 PR マージ後、user 三段明示承認後の別オペレーションで実施

Refs #48

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# push
git push -u origin <現行ブランチ名>

# PR 作成
gh pr create \
  --title "docs(workflow): add UT-28 Cloudflare Pages projects creation Phase 11-13 task spec (Issue #48)" \
  --base dev \
  --body "$(cat <<'EOF'
（上記 PR body テンプレを貼付）
EOF
)"
```

## 実 Pages プロジェクト作成コマンド（PR マージ後 / user 三段承認後のみ実行）

> 詳細は `outputs/phase-13/apply-runbook.md` を参照。本セクションは spec レベルの再掲のみ。

```bash
# === user の明示承認（実 Pages プロジェクト作成）取得確認 ===
# 本セクションは PR マージ後 + user の二段目承認後にのみ実行する

# === STEP 0: 上流 2 件 completed 確認 / 認証確認 ===
gh pr list --search "01b parallel cloudflare base bootstrap" --state merged
gh pr list --search "UT-05" --state merged
op item get "Cloudflare" --vault UBM-Hyogo > /dev/null  # 01b の API Token / Account ID 存在確認
bash scripts/cf.sh whoami                                 # API Token 認証 + 最小スコープ確認

# === STEP 1: OpenNext 静的整合確認（lane 2） ===
grep -E "pages_build_output_dir|compatibility" apps/web/wrangler.toml
grep -E "defineCloudflareConfig" apps/web/open-next.config.ts
grep -nE "pages deploy|project-name" .github/workflows/web-cd.yml
# 判定: (A) `.next` 継続 / (B) `.open-next/assets` 切替（B なら本タスクではプロジェクトのみ作成し、UT-05 にフィードバック）

# === STEP 2: production プロジェクト作成（lane 3） ===
bash scripts/cf.sh pages project create ubm-hyogo-web \
  --production-branch=main \
  --compatibility-flags=nodejs_compat \
  --compatibility-date=2025-01-01

# === STEP 3: staging プロジェクト作成（lane 4） ===
bash scripts/cf.sh pages project create ubm-hyogo-web-staging \
  --production-branch=dev \
  --compatibility-flags=nodejs_compat \
  --compatibility-date=2025-01-01

# === STEP 4: 設定確認（lane 5） ===
bash scripts/cf.sh pages project list   # 2 件存在 + production_branch / 互換性 / Git 連携 OFF 確認

# Cloudflare Dashboard で各プロジェクトの Settings → Builds & deployments を確認
# "Connect to Git" が OFF（または未接続）であることを目視。ON なら OFF に切り替え

# verification-log.md に記録（Account ID / Project ID は不可、`production_branch` / 互換性 / Git 連携状態は記録可）

# === STEP 5: dev push smoke / main push smoke は user 三段目承認後 ===
# Phase 11 manual-smoke-log.md の STEP 2〜5 を実走
# verification-log.md に commit SHA / run URL / 公開 URL HTTP 応答 / Git 連携 OFF / OpenNext 整合性結果を記録
```

## rollback 経路（apply-runbook §rollback の正本）

| # | rollback 経路 | コマンド | 適用ケース |
| --- | --- | --- | --- |
| 1 | プロジェクト delete + 再 create | `bash scripts/cf.sh pages project delete <name>` → 再 create | `production_branch` / 互換性 / 命名 を取り違えた直後 |
| 2 | API Token 失効・再発行 | Cloudflare Dashboard → My Profile → API Tokens で該当 token を Revoke → 01b 経由で再発行 → 1Password 更新 | API Token 漏洩疑い / スコープ不足発覚時 |
| 3 | Variable 値同時更新 | UT-27 側で `gh variable set CLOUDFLARE_PAGES_PROJECT --body <new-base>` を再実行 | 命名変更が必要になった場合（production = `<new-base>` / staging = `<new-base>-staging`） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/main.md | Phase 12 統合記録 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/implementation-guide.md | 実 Pages プロジェクト作成手順の正本（Part 2） |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/manual-smoke-log.md | 5 ステップ smoke 正本 |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/outputs/phase-13/apply-runbook.md | 実 Pages プロジェクト作成 runbook |
| 必須 | docs/30-workflows/ut-28-cloudflare-pages-projects-creation/index.md | PR タイトル / 説明根拠 |
| 必須 | scripts/cf.sh | `wrangler` ラッパーの正規経路 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI 実行ルール / ブランチ戦略） | 1Password 正本 / `scripts/cf.sh` 経由 / dev → main 戦略 |
| 必須 | apps/api/wrangler.toml | Workers 側 `compatibility_date = "2025-01-01"` 整合確認 |
| 必須 | apps/web/wrangler.toml | Pages 側設定整合確認 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-13.md | PR Phase 構造リファレンス |
| 参考 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-13.md（同型） | NON_VISUAL Phase 13 構造リファレンス |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user の三段明示承認を含む）
- [ ] local-check（docs validator）が PASS
- [ ] root と outputs の `artifacts.json` parity 確認 PASS
- [ ] API Token / Account ID / Project ID 値転記 / 計画系 wording / `wrangler` 直接実行 が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #48 にリンク（`Refs #48`）
- [ ] CI（`gh pr checks`）が green
- [ ] PR マージ後、user 明示承認（実 Pages プロジェクト作成）を取得
- [ ] 実 Pages プロジェクト作成実行後、`outputs/phase-13/verification-log.md` が確定（作成日時 / `production_branch` / 互換性 / Git 連携 OFF を記録、秘匿 ID はマスク）
- [ ] さらに user 明示承認（実 dev/main push smoke）を取得後、`outputs/phase-13/verification-log.md` に commit SHA / run URL / 公開 URL HTTP 応答 / Git 連携 OFF / OpenNext 整合性結果が記録
- [ ] `bash scripts/cf.sh pages project list` で 2 件存在 + 命名 + `production_branch` 配線 + 互換性 + Git 連携 OFF を最終確認
- [ ] artifacts.json の Phase 13 が `completed` に更新される（user マージ後 + 実 Pages プロジェクト作成 + 実 push smoke 完了後の別 PR で）
- [ ] branch protection ルール（`required_status_checks` / `required_linear_history` / `required_conversation_resolution`）と整合する merge 操作

## 苦戦防止メモ

1. **`Refs #48` を維持**: 本 PR は仕様書整備までであり、Issue #48 の本体クローズは実 Pages プロジェクト作成 + push smoke 完了後の別 PR で行う。Issue を誤クローズしない。
2. **`git add .` / `git add -A` 禁止**: 他 worktree や無関係ファイルが混入する事故を防ぐため、必ずパス明示で add する。
3. **base = `dev`**: feature → dev → main のブランチ戦略を厳守。直接 main へは PR しない。
4. **user 三段承認の独立性**: 「PR 作成承認」「実 Pages プロジェクト作成承認」「実 push smoke 承認」は独立。PR 作成だけで自動的に実 create に進まない。実 create 完了後も自動で push smoke に進まない。
5. **`wrangler` 直接実行絶対禁止**: PR body / コミットメッセージ / コマンド例 / runbook / verification-log のいずれにも `wrangler ...` 単独実行を書かない。CLAUDE.md / AC-14 / `bash scripts/cf.sh` 経由必須。grep で検査する。
6. **API Token / Account ID / Project ID 値の transcript 残存禁止**: `op read` の出力を直接 echo しない / `pages project list` の Account ID / Project ID 部分はマスクする運用 / 実値を含む shell history を `unset` 後に `history -c` する運用検討。
7. **OpenNext 切替フィードバックは UT-05 へ**: dev push smoke が red の場合でも、本タスク内で `apps/web/wrangler.toml` / `web-cd.yml` を編集しない。Phase 12 unassigned-task-detection に登録した UT-05 フィードバック経路を辿る。
8. **Pages Git 連携 OFF 確認の 2 タイミング**: (a) create 直後の既定状態（連携なし）の確認、(b) deploy 後の Dashboard 目視確認。両方を verification-log に記録。
9. **`compatibility_date` Workers 同期の post-create drift 検出**: `bash scripts/cf.sh pages project list` 出力の `compatibility_date` が `apps/api/wrangler.toml` の `2025-01-01` と一致するか毎回照合。
10. **upstream completion drift 検出**: 実 Pages プロジェクト作成直前に再度 01b / UT-05 completed を確認（PR 作成時から実 create までに遅延がある場合の drift 検出）。
11. **rollback 経路の事前確認**: 実 create 中に問題発生時、(a) `bash scripts/cf.sh pages project delete <name>` + 再 create、(b) Cloudflare Dashboard で API Token 失効・再発行、(c) UT-27 側 Variable 値の同時更新 の 3 経路を `apply-runbook.md` に明記。
12. **`--no-verify` / `--no-gpg-sign` 禁止**: branch protection / lefthook の hook を skip しない。hook が fail した場合は根本原因を修正してから再 commit する（amend ではなく新規 commit）。

## 次 Phase

- 次: なし（タスク完了）
- マージ後フォロー:
  - artifacts.json の Phase 13 を `completed` に更新（実 Pages プロジェクト作成 + 実 push smoke 完了後の別 PR で）
  - `outputs/phase-13/verification-log.md` を後追い PR で commit
  - GitHub Issue #48 へ「spec 完了 + 実 Pages プロジェクト作成 + push smoke 完了」コメント追加 + クローズ
  - UT-27（GitHub Variable `CLOUDFLARE_PAGES_PROJECT = ubm-hyogo-web`）/ UT-06（本番デプロイ）/ UT-16（カスタムドメイン）/ UT-29（CD 後スモーク）への引き渡し
- ブロック条件:
  - user 承認（PR 作成 / 実 Pages プロジェクト作成 / 実 push smoke のいずれか）が無い場合は該当オペレーションを一切実行しない
  - local-check（docs validator）が FAIL（→ Phase 12 へ差し戻し）
  - 計画系 wording / API Token / Account ID / Project ID 値混入 / `wrangler` 直接実行混入 が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
  - 上流 2 件（01b / UT-05）のいずれかが実 Pages プロジェクト作成時点で未完了（→ 上流完了待機）
  - root と outputs の `artifacts.json` に drift（→ Phase 12 で同期再実施）
