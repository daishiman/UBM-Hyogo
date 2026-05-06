# Phase 13: PR 作成 — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: 本タスクで作成される PR は 2 種類（仕様書 PR / 実装 PR）あり、いずれも repo へ commit・push される副作用を持つ。さらに `gh pr create` の実行・CI gate 待機・cutover 段階の approval gate G1〜G4 の運用を伴うため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 13 / 13 |
| upstream issue | #405 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

本タスクで生成される 2 種類の PR の作成手順・本文テンプレ・CI gate 待機方針・approval gate G1〜G4 との整合を確定する。仕様書 PR は本ブランチで作成し、実装 PR は契約のみ規定し別タスク・別ブランチで作成する。

## 前提条件

- Phase 12 完了（strict 7 output files + aiworkflow-requirements 正本更新済）
- 仕様書 PR は `RUNTIME_PENDING` のまま作成可能。実装 PR は Phase 11 runtime evidence が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 以上の状態
  - PASS: 全 13 evidence + 長命 Token 失効済 → 通常 merge 可
  - PASS_BOUNDARY_SYNCED_RUNTIME_PENDING: 24h 並行運用中 / 失効未完了 → PR 本文に runtime pending 項目を明記して merge 後に追跡
- secret スキャン pass（`grep -RE '(Bearer ...)' docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` が 0 hit）

## 本タスクで扱う PR は 2 種類

1. **仕様書 PR（本ブランチ `docs/u-fix-cf-acct-01-deriv-01-task-spec` 等で出す PR）**
   - 内容: 仕様書 13 phase ファイル + outputs 13 main.md + Phase 11 NON_VISUAL 補助 2 ファイル + Phase 12 strict 7 ファイル
   - 範囲: deploy / cutover / token revoke は **行わない**
2. **実装 PR（別タスク・別ブランチ `feat/u-fix-cf-acct-01-deriv-01-github-oidc` で出す PR）**
   - 内容: workflow YAML 変更 / cf.sh 改修 / runbook 追記 / aiworkflow-requirements 正本更新 / Phase 11 で取得した 13 evidence
   - 本仕様書では **契約のみ** 規定する

> **CONST_002 / 本仕様書作成タスクでは PR 作成・push を実行しない**。仕様書 PR の作成は別の `/diff-to-pr` 起動セッションで実施する。

## Multi-stage approval gate G1〜G4 の対応関係

本タスクの cutover は 4 段で構成される。実装 PR の merge タイミングと evidence 取得・gate 取得の関係を以下に固定する:

| 段階 | 対応 gate | 実施タイミング | PR / merge との関係 |
| --- | --- | --- | --- |
| (a) trust policy / IdP 構成 | G1 | 実装 PR merge 前 | OIDC subject / audience / environment を最小化 |
| (b) staging cutover | G2 | 実装 PR merge 前に staging branch で先行検証（または draft PR で merge せず CI のみ green 確認） | staging green 確認後、実装 PR を ready for review に昇格 |
| (c) production cutover | G3 | 実装 PR merge 後 / production environment トリガ時 | environment required reviewers が gate を兼ねる |
| (d) 長命 Token revoke | G4 | production cutover 後 24h 並行運用 → revoke | 別 PR or 手動運用（YAML には影響なし） |

> Forms / D1 への直接副作用はないため Forms / D1 専用 gate は不要（09a-A の G2 / G3 とは別カテゴリ）。

## 1. 仕様書 PR の手順

### 1-A. 事前確認

```bash
git branch --show-current  # docs/u-fix-cf-acct-01-deriv-01-task-spec 系であること
git status --porcelain     # 仕様書ファイル以外の変更がないこと
git fetch origin main
git log --oneline origin/main..HEAD
```

CLAUDE.md「PR作成の完全自律フロー」に準拠:
1. `git fetch origin main` → ローカル `main` を ff
2. 作業ブランチで `git merge main` → コンフリクトは CLAUDE.md 既定方針で解消
3. `mise exec -- pnpm install --force` → `pnpm typecheck` → `pnpm lint`
4. 失敗時は最大 3 回まで自動修復
5. `git status --porcelain` 空 / `git diff main...HEAD --name-only` で PR 含有ファイル一覧確定

### 1-B. PR タイトル例（70 字以内）

```
docs(u-fix-cf-acct-01-deriv-01): GitHub OIDC 短命 credential 移行 仕様書 13 phase
```

### 1-C. PR 本文テンプレ（HEREDOC）

```
## Summary
- U-FIX-CF-ACCT-01-DERIV-01（GitHub OIDC → Cloudflare 短命 credential 移行）の Phase 1-13 実装仕様書を整備
- approval gate G1〜G4（trust policy / staging cutover / production cutover / 長命 Token revoke）の運用契約を明記
- 13 evidence（workflow run URL / token verify / lifetime / scope / 24h audit log / revoke 確認 / fork PR 漏洩試験 / secret hygiene / approval-gates）の保存先と命名規則を確定
- 後続 DERIV-02 / DERIV-03 / DERIV-04 への scope 境界を文書化

## 含まれる変更
- docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-{01..13}.md
- docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-{01..13}/main.md
- aiworkflow-requirements 正本（deployment-gha.md / deployment-secrets-management.md）への OIDC 章追記契約

## Test plan
- [ ] `mise exec -- pnpm typecheck` が成功
- [ ] `mise exec -- pnpm lint` が成功
- [ ] `pnpm indexes:rebuild` で diff 0
- [ ] `grep -RnE '(Bearer [A-Za-z0-9._-]{20,}|CLOUDFLARE_API_TOKEN=[A-Za-z0-9._-]{20,})' docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` が 0 hit
- [ ] CLAUDE.md「PR作成の完全自律フロー」のチェックリストを満たす

## Evidence
- 仕様書段階のため runtime evidence は含まない（実装 PR で別途添付）
- 仕様書 PR の状態: `spec_created`

## Rollback
- 仕様書のみのため revert で完結

## 関連 Issue / 後続タスク
- 上流 Issue: #405
- 上流 task: U-FIX-CF-ACCT-01（Phase 11 verified が前提）
- 後続: feat/u-fix-cf-acct-01-deriv-01-github-oidc（実装 PR）
- 後続: U-FIX-CF-ACCT-01-DERIV-02 / DERIV-03 / DERIV-04
- 関連: UT-25-DERIV-04 / UT-GOV-002

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 1-D. `gh pr create` コマンド例

```bash
gh pr create --base main --head docs/u-fix-cf-acct-01-deriv-01-task-spec \
  --title "docs(u-fix-cf-acct-01-deriv-01): GitHub OIDC 短命 credential 移行 仕様書 13 phase" \
  --body "$(cat <<'EOF'
## Summary
... (上記テンプレ全文)
EOF
)"
```

### 1-E. CI gate 待機方針

```bash
gh pr checks <PR_NUMBER> --watch
```

`required_status_checks`（typecheck / lint / verify-indexes-up-to-date 等）が green になるまで待機。失敗時は CLAUDE.md「品質検証失敗時の自動修復」に従い、最大 3 回まで修復コミットを追加。

## 2. 実装 PR の契約（後続タスクが従うべき仕様）

### 2-A. branch 命名

`feat/u-fix-cf-acct-01-deriv-01-github-oidc`

### 2-B. PR タイトル例

```
feat(u-fix-cf-acct-01-deriv-01): GitHub OIDC 短命 credential 移行 (long-lived token 廃止)
```

### 2-C. PR 本文テンプレ

```
## Summary
- 長命 secrets.CLOUDFLARE_API_TOKEN を deploy workflow から廃止
- GitHub Actions OIDC → intermediate IdP (AWS STS / 1Password Connect) → 短命 Cloudflare API token (lifetime ≤ 1h) 経路に置換
- 最小 4 scope 継承 (Workers Scripts:Edit / D1:Edit / Cloudflare Pages:Edit / Account Settings:Read)
- staging-first → 7 日 green → production cutover → 24h 並行運用 → 長命 token 失効

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint`
- [ ] secret hygiene grep が 0 hit
- [ ] artifacts.json の evidence 配列長が 11
- [ ] `grep -n 'CLOUDFLARE_API_TOKEN' .github/workflows/` が 0 hit

## Evidence (Phase 11 取得済)
1. workflow-run/staging-run-url.txt
2. workflow-run/production-run-url.txt
3. token-verify/verify-{staging,production}.json (redacted)
4. lifetime/lifetime-check.log (≤ 3600s)
5. scope/scope-check.log (4 scope のみ)
6. audit-log/audit-24h-old-token.json (last_used_on 不更新)
7. token-revoke/tokens-list-after-revoke.json (旧 ID 不在)
8. rollback-dry-run/rollback-dryrun.log
9. fork-pr-leak/fork-pr-test.log
10. secret-hygiene/grep-zero-match.log
11. secret-hygiene/grep-zero-match.log
12. fork-pr-leak/fork-pr-test.log
13. approval-gates.log (G1〜G4 取得記録)

## Approval gate 取得記録
- G1 (trust policy / IdP): approved at <ISO> by <user>
- G2 (staging cutover): approved at <ISO> by <user>
- G3 (production cutover): approved at <ISO> by <user>
- G4 (long-lived token revoke): approved at <ISO> by <user>

## Rollback
1. workflow YAML を 1 commit revert（OIDC step 削除 / 旧 token 参照復活）
2. 旧長命 Token を 24h 限定で再発行し GitHub Secrets に再注入
3. 24h 以内に OIDC 経路を修復し再 cutover、または rollback を恒久化

## Visual Evidence
NON_VISUAL（CI 認証経路変更のため画面なし）

## 関連
- 上流 Issue: #405
- 仕様書 PR: <link>
- 上流 task: U-FIX-CF-ACCT-01

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 2-D. 実装 PR の前提条件

- 仕様書 PR がマージ済（main に Phase 1〜13 仕様書が反映済）
- `feat/u-fix-cf-acct-01-deriv-01-github-oidc` ブランチが main から fork されている
- 上記 4 approval gate G1〜G4 の取得記録が PR 本文に貼られている
- 13 evidence のすべての path / hash / size / acquired_at が PR 本文に列挙されている
- aiworkflow-requirements 正本（`deployment-gha.md` / `deployment-secrets-management.md`）の更新差分が含まれている

## コミット禁止事項（secret hygiene）

以下のいずれかに該当する内容のコミットを禁止する:

- 長命 Cloudflare API Token の値（過去・現在・revoke 予定の Token を含む）
- 短命 Cloudflare API Token の値（verify レスポンスの `value` フィールド等）
- intermediate IdP の OAuth トークン値 / Service Account JWT
- `.env` の実値（`op://...` 参照のみ許容）
- GitHub OIDC token の生値

PR 作成前に以下を必ず実行:

```bash
grep -RnE '(Bearer [A-Za-z0-9._-]{20,}|CLOUDFLARE_API_TOKEN=[A-Za-z0-9._-]{20,}|cf_api_token=[A-Za-z0-9._-]{20,}|"value"[[:space:]]*:[[:space:]]*"[A-Za-z0-9._-]{20,}")' . \
  --include='*.md' --include='*.yml' --include='*.yaml' --include='*.json' --include='*.sh' \
  || echo "[ZERO_MATCH] PR 直前 secret hygiene PASS"
```

`[ZERO_MATCH]` 行が出力されない場合は PR 作成を中止する。

## 仕様書 PR と実装 PR の境界

| 観点 | 仕様書 PR | 実装 PR |
| --- | --- | --- |
| ブランチ | `docs/...` | `feat/...` |
| 含まれるファイル | phase-XX.md / outputs main.md / Phase 12 出力 6 件 | workflow YAML / cf.sh / runbook 追記 / aiworkflow-requirements ref / 13 evidence |
| evidence | なし（contract のみ） | 13 evidence + approval-gates.log |
| approval gate | commit / push / PR 独立承認 | G1 / G2 / G3 / G4 すべて |
| Cloudflare 副作用 | なし | あり（cutover / revoke） |

## CLAUDE.md PR 作成完全自律フローへの準拠

両 PR とも以下を遵守:

1. `git fetch origin main` → ローカル main を ff
2. 作業ブランチで `git merge main` → コンフリクトは CLAUDE.md 既定方針で解消
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` を実行
4. 失敗時は最大 3 回まで自動修復してコミット
5. `git status --porcelain` 空 → `git diff main...HEAD --name-only` で PR 含有ファイル確定
6. PR 本文を上記テンプレで生成 → `gh pr create` HEREDOC で作成
7. `gh pr checks --watch` で CI 待機
8. PR URL / 採用ブランチ / 自動修復履歴 / 残課題を 1 回だけ報告

## 統合テスト連携

- 上流: Phase 12 ドキュメント更新差分 / 13 evidence
- 下流: 後続 DERIV-02 / DERIV-03 / DERIV-04 / UT-GOV-002 の評価 input

## 多角的チェック観点

- 仕様書 PR と実装 PR の責務が物理的に分離されている
- approval gate G1〜G4 の取得記録が実装 PR 本文に必ず残る契約になっている
- CI gate（typecheck / lint / verify-indexes-up-to-date）の green 確認が必須化されている
- secret / token 値の grep 0 hit が PR 作成前チェックに入っている
- `pull_request_target` が workflow に追加されていない（fork PR 漏洩防止）
- rollback 手順が PR 本文に明記されている

## サブタスク管理

- [ ] 仕様書 PR の事前確認・本文テンプレ・gh コマンドが揃っている
- [ ] 実装 PR の契約（branch / 本文 / approval 記録 / 必須 evidence 13 件）が揃っている
- [ ] コミット禁止事項（secret hygiene）が明示されている
- [ ] CLAUDE.md PR 作成完全自律フローに準拠している
- [ ] **本仕様書作成タスクでは PR 作成・push を実行しない**ことを明記

## 成果物

- `outputs/phase-13/main.md`
- 仕様書 PR の URL（後続セッションで作成され次第追記）
- 実装 PR の URL（後続タスクで作成され次第追記）

## 完了条件

- [ ] 仕様書 PR / 実装 PR 双方の手順・本文テンプレ・CI gate 待機方針が文書化されている
- [ ] approval gate G1〜G4 と PR フェーズの対応関係が明記されている
- [ ] コミット禁止事項（secret hygiene）が明記されている
- [ ] CLAUDE.md PR 作成完全自律フローへの準拠が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] **本 Phase で `gh pr create` / `git push` を実行していない**（CONST_002）
- [ ] 仕様書 PR と実装 PR の役割が混同されていない
- [ ] secret hygiene PR 直前 grep が契約に含まれている

## 次 Phase への引き渡し

Phase 完了後:
- 仕様書 PR 作成は別セッションで `/diff-to-pr` または手動で実施
- 実装 PR は別タスク `feat/u-fix-cf-acct-01-deriv-01-github-oidc` ブランチで本仕様書の契約に従って作成
- DERIV-02 / DERIV-03 / DERIV-04 は実装 PR merge 後に着手

## 実行タスク

- [ ] phase-13 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `CLAUDE.md`（PR 作成の完全自律フロー / secret hygiene）
