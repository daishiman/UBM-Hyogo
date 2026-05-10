# Phase 13: PR 作成（task-02 — readiness gate + runbook）

| 項目 | 値 |
|------|----|
| 入力 | `phase-12.md` ドキュメント同期完了 |
| 出力 | PR（base=`dev`, head=`fix/runtime-smoke-staging-readiness-gate`） |
| PR スコープ | task-02 単独（task-01 は独立 PR） |

---

## 1. PR 構造

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `fix/runtime-smoke-staging-readiness-gate` |
| title | `fix(ci): add readiness gate to runtime-smoke-staging and add secret provisioning runbook` |
| label（任意） | `ci` / `runbook` / `task-02` |
| reviewer | なし（solo policy） |
| draft | 任意（runtime evidence をユーザー操作後に追記する場合は draft 推奨） |

---

## 2. PR 含むファイル

| ファイル | 種別 |
|---------|------|
| `.github/workflows/runtime-smoke-staging.yml` | edit（pre-check step 追加） |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/index.md` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/phase-{1..13}.md` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/artifacts.json` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/main.md` | **delete** |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/outputs/phase-11/evidence/*` | new（runtime 観測後） |

---

## 3. PR 本文テンプレート

```markdown
## Summary

- `.github/workflows/runtime-smoke-staging.yml` に `verify required staging secrets` pre-check step を追加（`mask staging credentials` の直前）。
- `staging-runtime-smoke` env の必須 secret 4 件（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER`）が空のとき、`::error::` で不足名を列挙して exit 1 する。
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` を新規作成し、5 secret の投入手順をユーザー単独で実行可能な粒度に固定した。
- 既存 smoke スクリプト本体（`scripts/smoke/runtime-attendance-provider.sh`）は変更していない。

## Spec

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/phase-{1..13}.md`
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/index.md`
- 親ワークフロー: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/`

## 受入基準

| AC | 状態 |
|----|------|
| AC-T2-1 pre-check step が 1 回だけ存在 | pass（grep -c = 1） |
| AC-T2-2 secret 未投入で 4 件列挙 + exit 1 | pass（Phase 11 §pre-check-fail-run.log） |
| AC-T2-3 runbook が 5 secret 投入手順を持つ | pass（Phase 5 §2） |
| AC-T2-4 docs / diff の secret 実値 grep 0 件 | pass（Phase 9 QG-4） |
| AC-T2-5 投入後の再実行で pre-check 突破 | **要 user action** （Phase 11 §pre-check-success-run.log） |

## Evidence

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/outputs/phase-11/evidence/`
  - `yaml-syntax.log`
  - `actionlint.log`
  - `grep-gate.log`
  - `pre-check-fail-run.log`（PR push 後の自動 trigger ログ）
  - `secret-name-list-after.log`（user action 後）
  - `pre-check-success-run.log`（user action 後の再実行ログ）

## User action（merge 前後で必要）

このマージ前後で **ユーザー（repo admin）** が以下を実施する必要があります。AI には実値を渡さないでください。

1. `runbooks/secret-provisioning.md` §投入手順 に従い、`gh secret set <NAME> --env staging-runtime-smoke` を 5 件実行。
2. `gh api .../environments/staging-runtime-smoke/secrets --jq '.secrets[].name' | sort` で 5 件を確認。
3. `gh workflow run runtime-smoke-staging.yml --ref dev` で再実行し、`verify required staging secrets` step が PASS することを確認。

## 不変条件

- secret 実値はリポジトリ・コミット・PR 本文・runbook に書かない。
- AI は `gh secret set` で実値を投入しない（値の正本は外部）。
- `scripts/smoke/runtime-attendance-provider.sh` は変更しない。
- readiness 不足時に「PASS のように見える skip」を生まない。

## Rollback

`runtime-smoke-staging.yml` の追加 step block を `git revert` で取り除く。runbook と spec は残置（運用知識として価値あり）。
```

---

## 4. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --head fix/runtime-smoke-staging-readiness-gate \
  --title "fix(ci): add readiness gate to runtime-smoke-staging and add secret provisioning runbook" \
  --body-file <(cat <<'EOF'
（§3 の本文をここに貼る）
EOF
)
```

---

## 5. user action への引き継ぎ

PR 本文 §User action に明記した 3 ステップを、merge 前または merge 直後に実施するようユーザーへ依頼する。AI は以下を**しない**:

- secret 実値の入力支援。
- `gh secret set <NAME> --env staging-runtime-smoke <<< '<value>'` の実行。
- 1Password から値を取り出して標準入力に渡す自動化。

---

## 6. 完了条件

- [ ] PR が `dev` を base に作成済。
- [ ] PR 本文に §1-5 の要素が揃っている。
- [ ] CI（`Validate Build` / `actionlint`）が green。
- [ ] AC-T2-1..AC-T2-4 が PR diff / CI で PASS。
- [ ] AC-T2-5 は user action 完了後に PR コメントで報告。
