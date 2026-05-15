# Phase 13: PR・振り返り

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化 + drift 検知 (ut-17-followup-004) |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | pending_user_approval |
| GitHub Issue | #636（CLOSED — Refs として参照、本 PR でも close しない） |
| タスク種別 | improvement / infrastructure / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 1〜12 で完成した `infra/cloudflare-alerts/` + `scripts/cf.sh alerts` + CI drift gate + 既存 docs 切替 + skill 同期を 1 PR に集約し、`dev` にマージ可能な状態にする最終 Phase |

---

## 目的

Phase 1〜12 の全成果物（**インフラ宣言 + スクリプト拡張 + CI workflow + runbook 切替 + 親 implementation-guide 参照追加 + skill 同期 + CLAUDE.md 追記**）を 1 PR に集約し、`dev` ブランチへのマージ準備を完了させる。

> ⚠️ **承認ゲート**: Phase 12 完了後、ユーザーから「Phase 13 を実行してよいですか？」の明示承認を得てから実行する。
> ただし、CLAUDE.md「PR作成の完全自律フロー」が適用される依頼（「PR作成」「PR出して」「diff-to-pr」等）の場合は確認質問を挟まず実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(ut-17-followup-004): Cloudflare Notification Policy IaC + drift detection` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/ut-17-followup-004-cloudflare-alerts-iac` |
| PR 種別 | feature（infra 宣言 + script + CI workflow + docs） |
| 関連 Issue | `#636`（CLOSED — `Refs` として参照、`Closes` は使わない / 本 PR でも close しない） |

---

## 13-2. 実行手順

### ステップ 1: ローカルチェック

```bash
# 全体型チェック / Lint（apps/web / apps/api 共通）
mise exec -- pnpm typecheck \
  | tee outputs/phase-13/local-check-result.typecheck.log
mise exec -- pnpm lint \
  | tee outputs/phase-13/local-check-result.lint.log

# infra JSON parse
for f in infra/cloudflare-alerts/policies/*.json infra/cloudflare-alerts/webhooks/*.json infra/cloudflare-alerts/quota-base.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('OK $f')"
done

# alerts diff（drift 検証 / 実適用後）
bash scripts/cf.sh alerts diff \
  | tee outputs/phase-13/local-check-result.alerts-diff.log
# 期待: exit 0 + "no drift"

# alerts apply 冪等性（2 回連続）
bash scripts/cf.sh alerts apply
bash scripts/cf.sh alerts apply
bash scripts/cf.sh alerts diff   # 期待: exit 0

# CI workflow lint
actionlint .github/workflows/cloudflare-alerts-drift.yml

# artifacts.json validity
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/artifacts.json','utf8'))" \
  && echo "artifacts.json: PASS"

# 機密値スキャン（Webhook URL / API Token / cf-webhook-auth secret）
git grep -nE "(hooks\.slack\.com/services/[A-Z0-9/]+|CF_API_TOKEN=[a-zA-Z0-9_-]{20,}|cf-webhook-auth_SECRET=[a-zA-Z0-9+/=]{20,}|cloudflare\.com/api/v4[^\s]*token=)" \
  -- ':!.dev.vars.example' ':!docs/**'
# 期待: 0 件

# webhook destination ID 直書き禁止 grep
git grep -nE '"id":\s*"[a-f0-9]{32}"' -- 'infra/cloudflare-alerts/policies/**'
# 期待: 0 件（name 参照のみ）

# wrangler 直接呼び出し禁止 grep
git grep -nE '(^|\s)wrangler\s' -- ':!scripts/cf.sh' ':!docs/**' ':!CLAUDE.md'
# 期待: 0 件

# mirror parity
diff -r .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements 2>/dev/null | head
```

### ステップ 2: 変更ファイル確認

```bash
git status
git diff dev...HEAD --name-only > outputs/phase-13/change-summary.files.txt
```

確認:
- `infra/cloudflare-alerts/` 配下が新規
- `scripts/cf.sh` の alerts サブコマンド差分
- `.github/workflows/cloudflare-alerts-drift.yml` 新規
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` 経路差替
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md` Part 5 参照追加（本文書換なし）
- `CLAUDE.md` Cloudflare CLI 実行ルール追記
- `.claude/skills/` LOGS / indexes 更新
- `apps/web` / `apps/api` に変更がない
- 機密値が含まれていない

### ステップ 3: コミット整理（マージ前 rebase）

最終的なコミット構成（例）:

| # | コミットメッセージ |
| --- | --- |
| 1 | `feat(ut-17-followup-004): declare Cloudflare Notification Policy 4 + webhook destination as IaC` |
| 2 | `feat(ut-17-followup-004): extend scripts/cf.sh with alerts apply/diff/list subcommands` |
| 3 | `feat(ut-17-followup-004): add CI drift gate workflow with read-only token` |
| 4 | `docs(ut-17-followup-004): switch monthly healthcheck runbook to scripts/cf.sh alerts diff` |
| 5 | `docs(ut-17-followup-004): finalize phase 12 source-of-truth sync and skill updates` |

### ステップ 4: push と PR 作成

```bash
git push -u origin feat/ut-17-followup-004-cloudflare-alerts-iac

gh pr create --base dev \
  --title "feat(ut-17-followup-004): Cloudflare Notification Policy IaC + drift detection" \
  --body "$(cat <<'EOF'
## Summary

- Cloudflare Notification Policy 4カテゴリ / 5 policy（Workers Requests / D1 Read / D1 Write / Pages Build / R2 Class A）+ webhook destination 1 件を `infra/cloudflare-alerts/` に JSON 宣言化
- `scripts/cf.sh alerts {apply,diff,list}` で冪等適用 + drift 検知。`wrangler` 直接呼び出しは引き続き禁止
- `.github/workflows/cloudflare-alerts-drift.yml` で毎日 + PR 時に drift gate を実行（read-only token `CLOUDFLARE_ALERTS_TOKEN_READ`）
- API Token を「apply（書込み）」「diff（CI / read-only）」「deploy（既存）」の 3 系統に分離して権限最小化
- monthly healthcheck runbook を Dashboard 目視 → `scripts/cf.sh alerts diff` に切替、UT-17 親 implementation-guide Part 5 から IaC 経路への参照リンクを追加

## 変更点

### インフラ宣言（infra/cloudflare-alerts/）
- 新規: `policies/{workers-requests,d1-read,d1-write,pages-build,r2-class-a-b}.json`
- 新規: `destinations/ut-17-relay.json`
- 新規: `quota-base.json`（無料枠 base 値 SSOT、閾値は `quotaBase * 0.8` の computed 値で生成）
- 新規: `README.md`（apply / diff / token rotate 手順）

### スクリプト / CI
- 編集: `scripts/cf.sh`（`alerts apply` / `alerts diff` / `alerts list --normalize` / `alerts diff --ci` を追加）
- 新規: `.github/workflows/cloudflare-alerts-drift.yml`（schedule + pull_request 発火、`CLOUDFLARE_ALERTS_TOKEN_READ` のみ参照）
- 編集: `.dev.vars.example`（`op://Vault/UBM-Hyogo Alerts Apply Token/credential` 参照追加）

### docs / runbook（既存ドキュメント）
- 編集: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（Dashboard 目視 → `scripts/cf.sh alerts diff` 経路差替）
- 編集: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md`（Part 5 末尾に IaC 経路への参照リンク追加、本文書換なし）
- 編集: `CLAUDE.md`（「Cloudflare 系 CLI 実行ルール」に `alerts` サブコマンド項を追記）

### docs / workflow（新規）
- 新規: `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/`（phase-11.md / phase-12.md / phase-13.md + outputs/phase-{11,12,13}/）

### skill 同期（.claude/skills/）
- 更新: `task-specification-creator/LOGS`（ut-17-followup-004 完了行）
- 更新: `aiworkflow-requirements/LOGS`（IaC + drift gate 実装完了記録）
- 更新（存在時）: `aiworkflow-requirements/indexes/keywords.json`（4 キーワード追加）/ `indexes/topic-map.md`（monitoring / IaC セクション）/ `task-specification-creator/references/resource-map.md`

## Test plan / 動作確認

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `infra/cloudflare-alerts/*.json` parse PASS
- [x] `bash scripts/cf.sh alerts apply` 2 回連続後、`alerts diff` が exit 0 + "no drift"（冪等性確認）
- [x] `actionlint .github/workflows/cloudflare-alerts-drift.yml` PASS
- [x] `artifacts.json` JSON parse PASS
- [x] 機密値 grep PASS（Webhook URL / API Token / cf-webhook-auth secret 0 件）
- [x] webhook destination ID 直書き grep PASS（0 件）
- [x] `wrangler` 直接呼び出し grep PASS（0 件、`scripts/cf.sh` 経由のみ）
- [x] CI drift gate を意図的に drift を作成して fire 確認（job が exit 1 で fail することを確認後、復旧）

## Evidence

- `outputs/phase-11/evidence/typecheck.log` / `lint.log`
- `outputs/phase-11/evidence/json-validate.log`
- `outputs/phase-11/evidence/alerts-apply-idempotent.log` / `alerts-diff.log`
- `outputs/phase-11/evidence/grep-secret-scan.log`
- `outputs/phase-11/evidence/cloudflare-api-list.normalized.json`
- `outputs/phase-11/evidence/ci-workflow-lint.log`
- `outputs/phase-11/visual-verification-skip.md`
- `outputs/phase-12/implementation-guide.md`（Part 1 / Part 2）

## 不変条件チェック

- [x] D1 直接アクセスを追加していない（本タスクは D1 アクセスなし）
- [x] Secret は 1Password → Cloudflare Secrets / GitHub Secrets 経由のみ（`.env` に実値なし）
- [x] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ（`wrangler` 直接実行なし）
- [x] `apps/web` / `apps/api` ランタイムに変更なし
- [x] UT-17 親 implementation-guide Part 5 は参照リンク追加のみ（本文書換なし）
- [x] CONST_007 先送りなし（apply / diff / CI gate を本サイクル内で完了）
- [x] webhook destination は name 参照のみ（ID 直書き禁止 lint PASS）
- [x] Issue #636 は `Refs` 表記、`Closes` 不使用（CLOSED 状態を維持）

## 関連 Issue

Refs #636

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-3. PR チェックリストテンプレ（`outputs/phase-13/pr-checklist.md`）

```markdown
# ut-17-followup-004 PR チェックリスト

## 基本情報
| 項目 | 値 |
| --- | --- |
| PR タイトル | feat(ut-17-followup-004): Cloudflare Notification Policy IaC + drift detection |
| ベース | dev |
| 作業ブランチ | feat/ut-17-followup-004-cloudflare-alerts-iac |
| 関連 Issue | #636（Refs / CLOSED 維持） |

## ローカルチェック
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `infra/cloudflare-alerts/*.json` parse PASS
- [ ] `scripts/cf.sh alerts apply` 冪等性確認（2 回目 diff が exit 0）
- [ ] `scripts/cf.sh alerts diff` exit 0
- [ ] `actionlint` PASS
- [ ] artifacts.json validity PASS
- [ ] 機密値 grep 0 件
- [ ] webhook destination ID 直書き grep 0 件
- [ ] `wrangler` 直接呼び出し grep 0 件
- [ ] mirror parity 同期済み

## 不変条件
- [ ] D1 直接アクセスを追加していない
- [ ] `wrangler` 直接実行していない
- [ ] `.env` に実値を書いていない
- [ ] `apps/web` / `apps/api` ランタイムを変更していない
- [ ] UT-17 親 implementation-guide Part 5 の本文を書換えていない（参照追加のみ）
- [ ] Issue #636 を `Closes` で書いていない（`Refs` のみ）
- [ ] CONST_007 先送りなし（apply / diff / CI gate がすべて本 PR に含まれる）

## evidence 確認
- [ ] AC-1〜AC-9 の evidence ファイルが揃っている
- [ ] `outputs/phase-11/visual-verification-skip.md` が記載済み
- [ ] `outputs/phase-12/` strict 7 outputs が揃っている

## PR URL
（gh pr create 実行後にここに記載）
```

---

## 13-4. post-merge アクション

PR が dev にマージされた後に実施:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | monthly healthcheck runbook の新手順（`scripts/cf.sh alerts diff`）を翌月第 1 営業日に初回実施 | プロジェクトオーナー |
| 2 | UT-17 親 implementation-guide Part 5 の「外部操作残（T9 / T10）」を「IaC 経路へ完全移行済み」に更新するか判断（別 PR） | delivery |
| 3 | `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/` を `docs/30-workflows/completed-tasks/` 配下へ移動 | post-merge スクリプト or 手動 |
| 4 | `docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md` を削除（completed 化に伴う） | 手動 |
| 5 | `artifacts.json` 全 Phase の状態が `completed` / `pending` のいずれかであることを再確認 | 手動 |
| 6 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |
| 7 | CI drift gate の初回 schedule fire を確認し、Slack 通知（任意 / 将来拡張）が動作しているかチェック | 手動 |

---

## 13-5. 振り返りチェック（`outputs/phase-13/retrospective.md` の元データ）

| 観点 | 内容 | 入力 task spec 6.1〜6.5 との対応 |
| --- | --- | --- |
| 6.1 API Token scope 不足 | 専用 `UBM-Hyogo Alerts Apply Token` Item を 1Password に新設 + `CLOUDFLARE_ALERTS_TOKEN_READ` を GitHub Secrets に登録することで、deploy token に scope を後付けせず責務分離できたか | 実装後の評価 |
| 6.2 webhook destination と policy の順序依存 | apply スクリプトが「destination 作成 → ID 解決 → policy 作成」順序を守り、policy JSON は name 参照のみで ID 直書きを lint で禁止できたか | grep gate 評価 |
| 6.3 閾値表現の不統一 | `quota-base.json` を SSOT にし、`threshold = quotaBase * 0.8` の computed 値で生成する build step が機能したか。monthly runbook に「Cloudflare 公式 free tier 値の差分確認」が追加されたか | runbook 差分確認 |
| 6.4 Terraform 採用判断 | YAGNI 適用で API + `scripts/cf.sh` 方式を採用、Terraform は派生未タスクとして `unassigned-task-detection.md` に切り出せたか | unassigned-task-detection.md 評価 |
| 6.5 CI 上での drift 検知の secret 取り回し | `scripts/cf.sh alerts diff --ci` で `op run` を skip して `CLOUDFLARE_ALERTS_TOKEN_READ` を直接読む経路が動いたか。read-only scope で apply 権限流出を防げたか | CI workflow 動作確認 |

| 観点 | 内容 |
| --- | --- |
| 計画精度 | 入力 task spec の「中規模」見積もりに対する実工数の差分 |
| 不変条件 | `wrangler` 直接禁止 / D1 直接禁止 / Secret 1Password 経由 が PR 自己レビューで維持されたか |
| Lessons Learned | Phase 12 skill-feedback-report.md の 5 カテゴリが skill / spec へ反映されたか |
| 後続タスク | UT-17 親 Part 5 / UT-18 / Terraform 化 への明示的引継ぎが備考に記録されたか |
| 月次運用 | monthly healthcheck runbook が `scripts/cf.sh alerts diff` 経路で運用可能な粒度になっているか |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| UT-17 親 implementation-guide Part 5 | 「外部操作残」項の最終クローズ判断 | post-merge アクション #2 |
| UT-18 / UT-14 / UT-08-IMPL | 影響なし or 備考更新のみ（Phase 12 で完了） | — |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-12/documentation-changelog.md | PR 本文「変更点」の元データ |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-12/unassigned-task-detection.md | PR 本文「Summary」の元データ |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-11/visual-verification-skip.md | Evidence / NON_VISUAL skip 根拠 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-13.md | 親 Phase 13 構造の参照元 |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」「Cloudflare 系 CLI 実行ルール」「シークレット管理」 | dev base 運用 + 不変条件 |
| 参考 | .claude/commands/ai/diff-to-pr.md | PR 本文 Phase 13 仕様 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-checklist.md | PR チェックリスト + URL 記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | ローカルチェック実行結果（typecheck / lint / alerts-diff / actionlint / secret-scan の合議） |
| ドキュメント | outputs/phase-13/change-summary.md | PR 本文へ転記する変更サマリー（Phase 12 changelog から派生） |
| ドキュメント | outputs/phase-13/retrospective.md | 13-5 振り返りチェック結果（6.1〜6.5 の解消状況含む） |
| PR | GitHub Pull Request | レビュー（solo dev のため 0 reviewer） / マージ |
| メタ | artifacts.json | 全 Phase を `completed` / `pending` のいずれかに更新 |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS（typecheck / lint / JSON parse / alerts-diff / actionlint / 機密値 grep / ID 直書き grep / wrangler grep）
- [ ] `outputs/phase-13/pr-checklist.md` の全項目が [x]
- [ ] PR が GitHub 上に作成され URL が `pr-checklist.md` に記録されている
- [ ] PR base が `dev` である
- [ ] PR 本文に `Refs #636` が記載され、`Closes #636` を**使っていない**（Issue は既に CLOSED）
- [ ] 機密値（Webhook URL / API Token / cf-webhook-auth secret）が PR 本文 / コミット / コード / evidence に含まれていない
- [ ] `apps/web` / `apps/api` ランタイムに変更がない
- [ ] UT-17 親 implementation-guide Part 5 が参照リンク追加のみ（本文書換なし）
- [ ] CONST_007 先送りなし（apply / diff / CI gate が本 PR に同梱）
- [ ] artifacts.json の全 Phase が `completed` / `pending` のいずれか
- [ ] 振り返り（`retrospective.md`）が記録され、6.1〜6.5 の解消状況が明示されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが `completed` / `runtime_pending` / `completed` のいずれか
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の全 Phase を `completed` / `pending` のいずれかに更新
- [ ] PR URL を `pr-checklist.md` に記録

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-4 の 7 アクションを実施
- ブロック条件:
  - ローカルチェック FAIL
  - 機密値混入
  - `apps/web` / `apps/api` 変更混入
  - `wrangler` 直接実行履歴混入
  - UT-17 親 implementation-guide Part 5 の本文を書換えてしまった
  - Issue #636 を `Closes` で記述してしまった
  - webhook destination ID 直書きが残存
