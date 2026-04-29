# Phase 13: PR 作成 / ユーザー承認後 secret 投入

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / ユーザー承認後 secret 投入 |
| 作成日 | 2026-04-29 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終 Phase） |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |
| user_approval_required | **true** |

## 重要: 実投入は本 Phase の Claude Code が行わない

- 本ワークフローは **タスク仕様書整備に閉じる**。実 `wrangler secret put` の production 実投入はユーザー承認後の別オペレーションで実施する。
- Claude Code が本 Phase で行うのは: (a) `deploy-runbook.md` / `rollback-runbook.md` の本格版整備、(b) `secret-list-evidence-{staging,production}.txt` のテンプレート配置、(c) PR 作成に必要な情報整理のみ。
- `wrangler secret put` / `secret list` の実走と `secret-list-evidence-*.txt` への実値（name のみ）貼付は **ユーザー承認後にユーザー本人** が `deploy-runbook.md` に従って実行する。

## 目的

Phase 12 までに確定した secret 配置仕様を、ユーザー承認後の実走に使える deploy / rollback runbook と evidence テンプレートへ集約する。コミット、push、PR 作成、Cloudflare への実投入は本タスクでは実行しない。

## 必須 outputs（5 点・artifacts.json で固定済み・追加改名禁止）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-13/main.md` | Phase 13 トップ index。ユーザー承認チェックリスト / 実投入の境界 / Phase 13 blocked 条件再掲 |
| `outputs/phase-13/deploy-runbook.md` | staging→production の実投入手順（Phase 11 staging smoke の延長で production まで実走する手順書） |
| `outputs/phase-13/rollback-runbook.md` | rollback 手順（`wrangler secret delete` + 旧 key 再投入の 2 段階）。緊急時の単独参照用 |
| `outputs/phase-13/secret-list-evidence-staging.txt` | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` の name 出力貼付プレースホルダ（実投入後にユーザーが置換） |
| `outputs/phase-13/secret-list-evidence-production.txt` | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` の name 出力貼付プレースホルダ（実投入後にユーザーが置換） |

> evidence ファイルは **テンプレートのみ**を Claude Code が配置する。実 `wrangler secret list` 出力（name 行のみ）への置換はユーザー本人が行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 主成果物 | `outputs/phase-13/main.md` | 承認チェックリスト / 実投入境界 / blocked 条件 |
| deploy | `outputs/phase-13/deploy-runbook.md` | staging → production のユーザー実走手順 |
| rollback | `outputs/phase-13/rollback-runbook.md` | delete + 旧 key 再投入の復旧手順 |
| evidence | `outputs/phase-13/secret-list-evidence-staging.txt` | staging name 確認テンプレート |
| evidence | `outputs/phase-13/secret-list-evidence-production.txt` | production name 確認テンプレート |

## ユーザー承認チェックリスト（main.md 冒頭に転記）

ユーザーは以下を満たしてから Claude Code に承認を伝える。

- [ ] Phase 3 NO-GO 条件すべて非該当（cf.sh ラッパー / staging-first / `.dev.vars` gitignore / rollback fail-fast / `wrangler secret list` name 確認手順あり）
- [ ] Phase 13 blocked 条件すべて非該当（UT-03 completed / SA JSON が 1Password に保管済 / staging+production Workers 作成済 / `.dev.vars` gitignore 確認済 / Phase 11 staging smoke がユーザー承認後に PASS）
- [ ] Phase 11 `manual-smoke-log.md` の rollback リハーサルが PASS
- [ ] Phase 12 `implementation-guide.md` を読み、UT-26 引き渡し条件を理解した
- [ ] Phase 12 `unassigned-task-detection.md` の派生タスクを別 issue として登録予定として認識した
- [ ] 1Password の SA JSON が最新（key rotation 直後でない / 失効していない）
- [ ] 実投入時の作業環境が `mise exec --` 経由で Node 24 / pnpm 10 を使う設定になっている

## 実行タスク

### Claude Code が行うタスク（仕様書整備に閉じる）

1. `deploy-runbook.md` を作成する（Phase 11 staging smoke の手順を踏襲し、staging→production の順で実投入する手順を明記）。
2. `rollback-runbook.md` を作成する（delete + 再 put の 2 段階。緊急時に単独参照可能な自己完結ファイル）。
3. `secret-list-evidence-staging.txt` / `secret-list-evidence-production.txt` をテンプレートとして配置する（実値・name 出力は `<TBD: ユーザー承認後に実行ログ貼付>` プレースホルダ）。
4. `main.md` にユーザー承認チェックリスト・Phase 13 blocked 条件再掲・実投入境界を記録する。
5. PR 作成に必要なタイトル・本文案を整理する（実 PR 作成はユーザーの明示指示まで行わない）。

### Claude Code が行わないタスク（ユーザー承認後の別オペレーション）

- 実 `bash scripts/cf.sh secret put` の staging / production 実投入
- `wrangler secret list` の実 name 出力を `secret-list-evidence-*.txt` に貼付
- aiworkflow-requirements 正本（`deployment-secrets-management.md` / `environment-variables.md`）の実反映 PR
- UT-26 への引き渡し（Sheets API E2E 疎通テスト）
- commit / push / PR 作成（ユーザーの明示指示があるまで禁止）

## 実行手順

1. `deploy-runbook.md` と `rollback-runbook.md` が Phase 8 SSOT / Phase 12 実装ガイドと矛盾しないことを確認する。
2. `secret-list-evidence-staging.txt` / `secret-list-evidence-production.txt` がテンプレート状態で、実 name 出力を含まないことを確認する。
3. `main.md` にユーザー承認チェックリストと実投入境界を同期する。
4. PR タイトル・本文案を整理し、実 PR 作成はユーザーの明示指示まで保留する。

## staging→production deploy コマンド系列（deploy-runbook.md に展開する元ネタ）

> 本 Phase では実走しない。`deploy-runbook.md` に手順書として記録し、ユーザー承認後にユーザー本人が実走する。

```bash
# === STEP 0: 履歴汚染防止（実走前に必ず）===
set +o history
HISTFILE=/dev/null
export HISTFILE

# === STEP 1: staging（先に実走）===
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  > docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-staging.txt

# === STEP 2: staging name 確認後に production ===
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production \
  > docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-production.txt

# === STEP 3: 履歴汚染チェック ===
history | grep -E "BEGIN PRIVATE KEY|private_key" || echo "OK: no leak"
```

## rollback コマンド系列（rollback-runbook.md に展開する元ネタ）

```bash
# === 緊急 rollback: delete + 旧 key 再投入 ===
set +o history
HISTFILE=/dev/null

# 1. 誤値の即時除去
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env <staging|production>

# 2. 旧 key を 1Password から再投入
op read "op://<Vault>/<Item>/<Field-OLD>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env <staging|production>

# 3. name 確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <staging|production>
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-11/manual-smoke-log.md | staging smoke 記録テンプレート（ユーザー承認後に実走結果を記録） |
| 必須 | outputs/phase-12/implementation-guide.md | UT-26 引き渡し条件 / 中学生レベル説明 |
| 必須 | outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements 反映結果 |
| 必須 | outputs/phase-03/main.md | Phase 13 blocked 条件 / NO-GO 条件 |
| 必須 | scripts/cf.sh | wrangler ラッパー実装 |
| 必須 | apps/api/wrangler.toml | `--env staging` / `--env production` の宣言 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI） | wrangler 直接禁止 / op 経由注入 / 平文 .env 禁止 |

## セキュリティ最優先

- **実 secret 値は文書に絶対書かない**。`secret-list-evidence-*.txt` は name 行のみ貼付（`wrangler secret list` 出力をそのまま貼ってよいのは name 列のみ）。
- 1Password 参照は `op://Vault/Item/Field` のテンプレ表記。実 vault path / item 名は UT-03 runbook を正本とする。
- PR 本文 / コミットメッセージに実値・JSON 内容・OAuth トークンを書かない。
- `wrangler login` でローカル OAuth トークンを保持しない（CLAUDE.md 明記）。

## 完了条件

- [ ] `outputs/phase-13/main.md` / `deploy-runbook.md` / `rollback-runbook.md` / `secret-list-evidence-staging.txt` / `secret-list-evidence-production.txt` の 5 ファイルが artifacts.json と完全一致
- [ ] `secret-list-evidence-*.txt` がテンプレート状態（`<TBD: ユーザー承認後に実行ログ貼付>` プレースホルダのみ）
- [ ] `deploy-runbook.md` が staging→production の順序で記述（production-first を含まない）
- [ ] `rollback-runbook.md` が delete + 再 put の 2 段階（上書き put 単独でない）
- [ ] `main.md` にユーザー承認チェックリスト・Phase 13 blocked 条件再掲・実投入境界が明記
- [ ] PR タイトル・本文案が整理され、実 PR 作成はユーザーの明示指示まで保留されている
- [ ] secret 値・JSON 内容・OAuth トークンが文書に一切含まれない
- [ ] 実 `wrangler secret put` を Claude Code が実行していない（log / git history で検証可能）

## 検証コマンド

```bash
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/
# main.md / deploy-runbook.md / rollback-runbook.md /
# secret-list-evidence-staging.txt / secret-list-evidence-production.txt の 5 件のみ

# evidence がテンプレート状態であること（実値が貼られていないこと）
grep -E "<TBD: ユーザー承認後に実行ログ貼付>" \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-staging.txt \
  && echo "OK: staging is template"
grep -E "<TBD: ユーザー承認後に実行ログ貼付>" \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/secret-list-evidence-production.txt \
  && echo "OK: production is template"

# secret 値転記が無いこと
! grep -E "BEGIN (PRIVATE|RSA PRIVATE) KEY" \
    docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/* \
  && echo OK

# staging-first が deploy-runbook.md で守られていること（production が先に出てこない）
python3 - <<'PY'
import re
p = "docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/deploy-runbook.md"
text = open(p).read()
i_stg = text.find("--env staging")
i_prd = text.find("--env production")
assert 0 <= i_stg < i_prd, "staging must precede production"
print("OK: staging-first")
PY
```

## 苦戦防止メモ

1. **Claude Code は実 PUT を実行しない**: 本 Phase の Claude Code は仕様整備のみ。`bash scripts/cf.sh secret put` を Bash tool で実行してはならない。
2. **evidence ファイルはテンプレート**: `<TBD: ユーザー承認後に実行ログ貼付>` プレースホルダのみ。実 name 行を Claude Code が貼ると user_approval_required の境界違反。
3. **PR 本文に承認チェックリスト**: ユーザーが PR レビュー時に gate を踏み忘れない仕掛けとして必須。
4. **deploy / rollback を 1 ファイルに merge しない**: 緊急時の参照性を下げないため別ファイル維持（Phase 3 §簡素化検討で結論済み）。
5. **production-first の手順が混入しないこと**: STEP 1 staging → STEP 2 production の順序が文中で逆転していないか目視確認。
6. **実 vault path を書かない**: `op://<Vault>/<Item>/<Field>` のプレースホルダのみ。実 path は UT-03 runbook を正本参照。

## 次 Phase への引き渡し（ワークフロー外）

- 次オペレーション（ユーザー承認後・本ワークフロー外）:
  1. ユーザーが `deploy-runbook.md` STEP 1 を実走（staging）
  2. `secret-list-evidence-staging.txt` のプレースホルダを実 `wrangler secret list` の name 出力に置換
  3. ユーザーが STEP 2 を実走（production）
  4. `secret-list-evidence-production.txt` のプレースホルダを置換
  5. UT-26 へ引き渡し（Sheets API E2E 疎通）
  6. aiworkflow-requirements 正本反映結果（Phase 12 review で同一 wave 反映済み）
  7. `unassigned-task-detection.md` の派生タスクを `docs/30-workflows/unassigned-task/` に登録

- ブロック条件:
  - ユーザー承認チェックリストのいずれかが未充足
  - Phase 13 blocked 条件のいずれかに該当
  - Phase 11 staging smoke が PASS していない
  - Claude Code が実 `wrangler secret put` を実行してしまった
