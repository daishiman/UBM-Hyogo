# Phase 13: PR 作成 / ユーザー承認後 secret 配置実行（user 明示承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後 secret 配置実行 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |
| **user_approval_required** | **true**（PR 作成承認 + 実 secret 配置承認 + 実 dev push 承認 の 3 段独立） |
| 実行ステータス | **NOT EXECUTED — awaiting user approval** |
| GitHub Issue | #47 |

> **PR 作成・実 `gh secret set` / `gh variable set` / `gh api ... -X PUT` の実行は user の明示承認後のみ実施する。**
> 本 Phase 仕様書は (a) PR 草案、(b) commit / push / `gh pr create` 手順、(c) 実 secret 配置 runbook、(d) 1Password 同期 runbook、(e) dev push smoke 実走 verification log を「予約」する目的で作成され、user の明示指示があるまで `git commit` / `git push` / `gh pr create` / `gh secret set` / `gh variable set` / `gh api` を一切実行しない。本ワークフロー成果物（仕様書・outputs）も Phase 13 完了時点では未コミット状態で待機する。

## 目的

Phase 1〜12 の成果物（Phase 1〜13 仕様書 + index.md + artifacts.json + outputs/artifacts.json + outputs/phase-{01..13}/）を 1 PR にまとめ、user 明示承認後に：

1. PR を GitHub Issue #47 へリンクして提出（**docs-only PR**: 仕様書整備までの差分）
2. user 明示承認（実 secret 配置承認）後の **別オペレーション** として、`apply-runbook.md` に従い environment 作成 / secret 配置 / variable 配置 を実走し、`op-sync-runbook.md` / `verification-log.md` を確定させる
3. user 明示承認（実 dev push 承認）後の **さらに別オペレーション** として、Phase 11 manual-smoke-log.md の 4 ステップを実走し、CD green / Discord 通知到達 / 未設定耐性確認を verify する

PR 草案は Phase 12 documentation-changelog を入力にする。実 secret 配置と実 dev push は本 Phase 仕様書のコマンドに従い、user の三段承認後にのみ実行する。

## 成果物

| 種別 | パス | 生成タイミング |
| --- | --- | --- |
| Phase 13 index | `outputs/phase-13/main.md` | 本 workflow で作成済み |
| apply runbook | `outputs/phase-13/apply-runbook.md` | 本 workflow で作成（コマンド系列を spec として固定 / 実走時にログ追記） |
| op-sync runbook | `outputs/phase-13/op-sync-runbook.md` | 本 workflow で予約成果物を作成（user の実 secret 配置承認後にログ追記） |
| verification log | `outputs/phase-13/verification-log.md` | 本 workflow で予約成果物を作成（user の実 dev push 承認後にログ追記） |

## 承認ゲート（最優先 / 必須）

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜3 の状態 | `artifacts.json` で `completed` | 確認済 |
| Phase 4〜10 状態 | `pending`（本ワークフローは仕様書整備のみ） | 確認済 |
| Phase 11 必須 4 outputs | main.md / manual-smoke-log.md / manual-test-result.md / link-checklist.md が揃っている | 要確認 |
| Phase 12 必須 6+1 outputs | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check | 要確認 |
| Step 1-C 関連タスクリンク | UT-05 / UT-28 / 01b / UT-06 / UT-29 / UT-25 への実リンク更新 | **未完 / PR 前確認** |
| B-07 workflow 旧条件 | `if: secrets.DISCORD_WEBHOOK_URL != ''` が workflow から除去済み | **要確認（残存なら実 PUT NO-GO）** |
| secret 値転記チェック | 0 件（Phase outputs / runbook / bash 例にも実値なし） | 要確認 |
| 計画系 wording 残存チェック | 0 件 | 要確認 |
| 上流 3 件（UT-05 / UT-28 / 01b）completed | 実 secret 配置の必須前提 | **要確認**（apply-runbook STEP 0） |
| user の明示承認（PR 作成） | user から「PR を作成してよい」の明示指示 | **承認待ち** |
| user の明示承認（実 secret 配置実行） | user から「実 `gh secret set` / `gh variable set` / `gh api` PUT を実行してよい」の明示指示（PR 作成承認とは独立） | **承認待ち** |
| user の明示承認（実 dev push 実行） | user から「実 dev push smoke を実行してよい」の明示指示（実 secret 配置承認とは独立） | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` / `gh secret set` / `gh variable set` / `gh api ... -X PUT` を一切実行しない。**

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得）。
2. local-check（docs validator のみ。typecheck / lint / app test は本タスク無関係のため対象外）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. **user 明示承認後（PR 作成承認）**、ブランチ確認 → 必要なファイルを明示 add → commit → push → PR 作成を実行する。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。
6. **user 明示承認後（実 secret 配置承認 / PR マージ後の別オペレーション）**、`apply-runbook.md` の手順に従い：
   - `gh api repos/.../environments/{staging,production} -X PUT`（environment 作成）
   - `op read` + `gh secret set` で 3 件の Secret を配置
   - `gh variable set CLOUDFLARE_PAGES_PROJECT --body ...`（Variable 配置）
   - `op-sync-runbook.md` に同期日時を記録、1Password Item Notes Last-Updated メモ更新
7. **user 明示承認後（実 dev push 承認 / さらに別オペレーション）**、Phase 11 manual-smoke-log.md の 4 ステップを実走し、`verification-log.md` に：
   - dev push commit SHA
   - `backend-ci.yml` deploy-staging green run URL
   - `web-cd.yml` deploy-staging green run URL
   - Discord 通知到達タイムスタンプ
   - 未設定耐性確認結果

## local-check（docs-only スコープ）

```bash
# 必須 outputs ファイル存在確認
ls docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/  # 4 files
ls docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/  # 7 files (main + 6)
ls docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-13/  # 4 md files + .gitkeep (main/apply-runbook/op-sync-runbook/verification-log)
test -f docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/artifacts.json

# screenshots/ が無いこと
test ! -d docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/screenshots && echo "OK: NON_VISUAL 整合"

# 計画系 wording 混入チェック
rg -n "仕様策定のみ|実行予定|保留として記録" docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/ \
  || echo "計画系 wording なし"

# secret 値混入チェック（payload / runbook / outputs / bash 例）
rg -nE "ya29\.|-----BEGIN PRIVATE|CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|gho_|ghp_|discord\.com/api/webhooks/[0-9]+/" \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/ \
  || echo "Secret 値混入なし"

# spec validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-27-github-secrets-variables-deployment
```

## 実行手順

1. 承認ゲートと local-check を user に提示する。
2. user の明示承認（PR 作成）を得た場合のみ、ブランチ確認、明示 add、commit、push、PR 作成へ進む。
3. PR マージ後、user の明示承認（実 secret 配置実行）を別途取得し、`apply-runbook.md` の手順を実走する。
4. 実 secret 配置完了後、user の明示承認（実 dev push 実行）をさらに別途取得し、Phase 11 manual-smoke-log.md の 4 ステップを実走する。
5. user 承認が無い場合は本 Phase を NOT EXECUTED のまま保持する。

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| **title** | `docs(workflow): add UT-27 GitHub Secrets/Variables deployment Phase 11-13 task spec (Issue #47)` |
| base | `dev` |
| head | 現行 worktree branch（`feat/issue-47-ut-27-github-secrets-variables-task-spec`） |
| labels | `area:docs` / `task:ut-27` / `wave:1` / `governance` |
| linked issue | #47（`Refs #47`: 本 PR は仕様書整備までで、Issue #47 の本体クローズは実 secret 配置 + dev push smoke 完了後の別 PR で行う） |

### PR body テンプレ

```markdown
## 概要
GitHub Issue #47「UT-27: GitHub Secrets / Variables 配置実行」の Phase 11〜13 タスク仕様書を `docs/30-workflows/ut-27-github-secrets-variables-deployment/` 配下に固定する docs-only PR。Phase 1〜3（要件定義 / 設計 / 設計レビュー）は同 worktree で先行整備済。

実 `gh secret set` / `gh variable set` / `gh api ... -X PUT` による environment 作成 + Secret/Variable 配置、および実 dev push による CD smoke は本 PR の **マージ後**、user の三段承認（PR 作成 + 実 secret 配置 + 実 dev push）後の別オペレーションで実施する。

## 動機
- task-github-governance / unassigned-task UT-27 で検出された「`backend-ci.yml` / `web-cd.yml` の deploy-staging / deploy-production が空振りする」問題を実行可能な spec へ昇格
- 1Password Environments 正本 + GitHub Secrets 派生 + Last-Updated メモ運用を仕様書として固定
- 上流（UT-05 / UT-28 / 01b）完了後の単独 PR として CD 実稼働化の最後の仕上げ

## 変更内容（docs-only）
- 新規: `docs/30-workflows/ut-27-github-secrets-variables-deployment/{index.md,artifacts.json,phase-{01..13}.md}`
- 新規: `outputs/artifacts.json`（root `artifacts.json` と同期）
- 新規: `outputs/phase-{01..10}/main.md`
- 新規: `outputs/phase-11/{main,manual-smoke-log,manual-test-result,link-checklist}.md`（NON_VISUAL 代替 evidence 4 点）
- 新規: `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`（Phase 12 必須 6 + index）
- 新規: `outputs/phase-13/{main.md,apply-runbook.md,op-sync-runbook.md,verification-log.md}`（PR 手順 + 実 secret 配置 runbook + 実走時追記先の予約成果物 / NOT EXECUTED — user 承認待ち）
- 同期: `docs/30-workflows/LOGS.md` / `.claude/skills/aiworkflow-requirements/references/{deployment-gha,deployment-secrets-management,environment-variables}.md` / `.claude/skills/aiworkflow-requirements/indexes/{topic-map,keywords}.md`
- 判定: `.claude/skills/task-specification-creator/LOGS.md` は実ファイルなしのため対象外。`CLAUDE.md` は追記不要
- 予約: `unassigned-task/UT-{05,28,06,29,25}-*.md` / `01b-*.md` への双方向リンクは Phase 13 PR 前確認で扱う

## 動作確認
- Phase 11 NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）適用済（spec walkthrough）
- dev push smoke 4 ステップのコマンド系列は仕様レベルで固定（NOT EXECUTED — 実走は本 PR マージ後の別オペレーション）
- docs validator PASS（`outputs/artifacts.json` を含む root / outputs parity）

## リスク・後方互換性
- **本 PR 自体は破壊的変更なし**（markdown / JSON のみ追加）
- apps/ / packages/ / migration / wrangler 設定 / Cloudflare Secret への影響なし
- 実 `gh secret set` / `gh variable set` / `gh api ... -X PUT` は **本 PR では実行しない**（user の三段承認後の別オペレーション）
- secret / token / Webhook URL の実値は本 PR の差分に**一切含まれない**

## 関連
- Refs #47
- 親タスク: `docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md`
- 上流前提: UT-05（CI/CD パイプライン実装） / UT-28（Cloudflare Pages プロジェクト作成） / 01b（Cloudflare base bootstrap）
- 下流: UT-06（本番デプロイ実行） / UT-29（CD 後スモーク）
- 関連: UT-25（Cloudflare Secrets / SA JSON deploy）

## 注意事項
- UT-27 の実 secret 配置は **UT-05 / UT-28 / 01b 完了が必須前提**。1 件でも未完了下で実 PUT を走らせると 401 / 404 / 値ミスマッチで CI 連鎖 red 化が発生するため、Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記している。
- `if: secrets.X != ''` の評価不能問題（親仕様 §3）は Phase 11 smoke で確認し、未対応なら UT-05 へのフィードバックとして Phase 12 unassigned-task-detection に登録する。
- 同名併存禁止（repository-scoped と environment-scoped に同名 Secret を併存させない）を運用ルールに固定。
```

## PR 作成コマンド（user 承認後のみ実行）

```bash
# 現在ブランチ確認
git status
git branch --show-current

# 必要なファイルを明示 add（git add . / -A は禁止）
git add docs/30-workflows/ut-27-github-secrets-variables-deployment/ \
        docs/30-workflows/LOGS.md \
        .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
        .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
        .claude/skills/aiworkflow-requirements/references/environment-variables.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md

# コミット
git commit -m "$(cat <<'EOF'
docs(workflow): add UT-27 GitHub Secrets/Variables deployment Phase 11-13 task spec (Issue #47)

- ut-27-github-secrets-variables-deployment ワークフローの Phase 11/12/13 仕様書 + outputs を新規作成
- dev push smoke 4 ステップ（前提確認 / 空コミット push / `gh run watch` / Discord 未設定耐性）のコマンド系列を仕様レベル固定
- 1Password 一時環境変数 + unset パターン / 同名併存禁止 / API Token 最小スコープ / rollback 3 経路を Phase 12 implementation-guide に固定
- 上流 3 件（UT-05 / UT-28 / 01b）完了必須前提を Phase 1 / 2 / 3 / Phase 11 STEP 0 / Phase 12 Step 1-C で 5 重明記
- 実 gh secret set / gh variable set / gh api PUT および実 dev push は本 PR マージ後、user 三段明示承認後の別オペレーションで実施

Refs #47

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# push
git push -u origin feat/issue-47-ut-27-github-secrets-variables-task-spec

# PR 作成
gh pr create \
  --title "docs(workflow): add UT-27 GitHub Secrets/Variables deployment Phase 11-13 task spec (Issue #47)" \
  --base dev \
  --body "$(cat <<'EOF'
（上記 PR body テンプレを貼付）
EOF
)"
```

## 実 secret 配置コマンド（PR マージ後 / user 三段承認後のみ実行）

> 詳細は `outputs/phase-13/apply-runbook.md` を参照。本セクションは spec レベルの再掲のみ。

```bash
# === user の明示承認（実 secret 配置）取得確認 ===
# 本セクションは PR マージ後 + user の二段目承認後にのみ実行する

# === STEP 0: 前提確認 ===
gh auth status                                   # actions:write / administration:write スコープ確認
# UT-05 / UT-28 / 01b completed か確認（未完了なら NO-GO）
gh pr list --search "UT-05" --state merged
bash scripts/cf.sh pages project list             # UT-28
op item get "Cloudflare" --vault UBM-Hyogo > /dev/null  # 01b

# === STEP 1: environment 作成 ===
gh api repos/daishiman/UBM-Hyogo/environments/staging    -X PUT --silent
gh api repos/daishiman/UBM-Hyogo/environments/production -X PUT --silent

# === STEP 2: secret 配置（1Password 一時環境変数 + unset パターン） ===
export TMP_CF_TOKEN_STG=$(op read "op://UBM-Hyogo/Cloudflare/api_token_staging")
export TMP_CF_TOKEN_PRD=$(op read "op://UBM-Hyogo/Cloudflare/api_token_production")
export TMP_CF_ACCT=$(op read "op://UBM-Hyogo/Cloudflare/account_id")
export TMP_DISCORD=$(op read "op://UBM-Hyogo/Discord/webhook_url")

gh secret set CLOUDFLARE_API_TOKEN  --env staging    --body "$TMP_CF_TOKEN_STG"
gh secret set CLOUDFLARE_API_TOKEN  --env production --body "$TMP_CF_TOKEN_PRD"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$TMP_CF_ACCT"
gh secret set DISCORD_WEBHOOK_URL   --body "$TMP_DISCORD"

unset TMP_CF_TOKEN_STG TMP_CF_TOKEN_PRD TMP_CF_ACCT TMP_DISCORD

# === STEP 3: variable 配置 ===
export CF_PAGES_PROJECT="$(op read 'op://UBM-Hyogo/Cloudflare/pages_project_name')"
gh variable set CLOUDFLARE_PAGES_PROJECT --body "$CF_PAGES_PROJECT"
unset CF_PAGES_PROJECT

# === STEP 4: 同期検証 ===
gh secret list                  # 値はマスク
gh secret list --env staging
gh secret list --env production
gh variable list

# 1Password Item Notes に Last-Updated 日時追記（値ハッシュは記載しない）
# op-sync-runbook.md にも同期日時記録

# === STEP 5: dev push smoke は user 三段目承認後 ===
# Phase 11 manual-smoke-log.md の STEP 1〜4 を実走
# verification-log.md に commit SHA / run URL / 通知到達 / 未設定耐性結果を記録
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/main.md | Phase 12 統合記録 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-12/implementation-guide.md | 実 secret 配置手順の正本（Part 2） |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/manual-smoke-log.md | dev push smoke 4 ステップ正本 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-13/apply-runbook.md | 実 secret 配置 runbook |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md（シークレット管理 / ブランチ戦略 / Cloudflare 系 CLI 実行ルール） | 1Password 正本 / dev → main 戦略 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-13.md | PR Phase 構造リファレンス |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user の三段明示承認を含む）
- [ ] local-check（docs validator）が PASS
- [ ] secret 値転記 / 計画系 wording / Webhook URL 直書き が 0 件
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #47 にリンク（`Refs #47`）
- [ ] CI（`gh pr checks`）が green
- [ ] PR マージ後、user 明示承認（実 secret 配置）を取得
- [ ] 実 secret 配置実行後、`outputs/phase-13/op-sync-runbook.md` が確定（同期日時記録 + Last-Updated メモ更新）
- [ ] さらに user 明示承認（実 dev push）を取得後、`outputs/phase-13/verification-log.md` に commit SHA / run URL / Discord 通知到達 / 未設定耐性結果が記録
- [ ] `gh secret list` / `gh secret list --env X` で同名併存なし確認
- [ ] artifacts.json の Phase 13 が `completed` に更新される（user マージ後 + 実 secret 配置 + 実 dev push 完了後）

## 苦戦防止メモ

1. **`Refs #47` を維持**: 本 PR は仕様書整備までであり、Issue #47 の本体クローズは実 secret 配置 + dev push smoke 完了後の別 PR で行う。Issue を誤クローズしない。
2. **`git add .` / `git add -A` 禁止**: 他 worktree や無関係ファイルが混入する事故を防ぐため、必ずパス明示で add する。
3. **base = `dev`**: feature → dev → main のブランチ戦略を厳守。直接 main へは PR しない。
4. **user 三段承認の独立性**: 「PR 作成承認」「実 secret 配置承認」「実 dev push 承認」は独立。PR 作成だけで自動的に実 secret 配置に進まない。実 secret 配置完了後も自動で dev push smoke に進まない。
5. **本タスクは Cloudflare 側 secret 非関与**: `scripts/cf.sh` 経由の Cloudflare Secrets 配置（UT-25）は触らない。本タスクは GitHub 側のみ。
6. **secret 値の transcript 残存禁止**: `op read` の出力を直接 echo しない / `gh secret list` の値マスクを前提に運用 / 実値を含む shell history を `unset` 後に `history -c` する運用検討。
7. **同名併存禁止の post-deploy 確認**: 実 secret 配置直後に `gh secret list` と `gh secret list --env X` を照合し、CLOUDFLARE_API_TOKEN が repository-scoped に残っていないことを確認する。
8. **1Password Last-Updated メモは値ハッシュを記載しない**: 値の内容を間接推測されるリスクを避ける。日時のみ記載。
9. **upstream completion drift 検出**: 実 secret 配置直前に再度 UT-05 / UT-28 / 01b completed を確認（PR 作成時から実 secret 配置までに遅延がある場合の drift 検出）。
10. **rollback 経路の事前確認**: 実 secret 配置中に問題発生時、(a) `gh secret delete` + 1Password から再注入、(b) Cloudflare Dashboard で API Token 失効・再発行、(c) `gh api ... -X DELETE` で environment 削除、の 3 経路を `apply-runbook.md` に明記。

## 次 Phase

- 次: なし（タスク完了）
- マージ後フォロー:
  - artifacts.json の Phase 13 を `completed` に更新（実 secret 配置 + 実 dev push smoke 完了後）
  - `outputs/phase-13/op-sync-runbook.md` / `verification-log.md` を後追い PR で commit
  - GitHub Issue #47 へ「spec 完了 + 実 secret 配置 + dev push smoke 完了」コメント追加 + クローズ
  - UT-06（本番デプロイ実行）/ UT-29（CD 後スモーク）への引き渡し
- ブロック条件:
  - user 承認（PR 作成 / 実 secret 配置 / 実 dev push のいずれか）が無い場合は該当オペレーションを一切実行しない
  - local-check（docs validator）が FAIL（→ Phase 12 へ差し戻し）
  - 計画系 wording / secret 値混入 が 1 件以上検出（→ 即時停止 / Phase 12 再実施）
  - 上流 3 件（UT-05 / UT-28 / 01b）のいずれかが実 secret 配置時点で未完了（→ 上流完了待機）
