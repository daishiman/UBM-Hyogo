# Phase 13: PR 作成（task-01 — web-cd workflow secret 名整合）

| 項目 | 値 |
|------|----|
| 入力 | `phase-12.md` 完了 |
| 出力 | PR（base=`dev`, head=`fix/web-cd-secret-name-alignment`） |
| PR スコープ | task-01 単独（task-02 は別 PR / 別 spec） |

---

## 1. PR 構造

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `fix/web-cd-secret-name-alignment` |
| title | `fix(ci): align web-cd secret refs to existing CLOUDFLARE_API_TOKEN env secret` |
| label（任意） | `ci` / `bugfix` / `ci-secret-alignment-and-runtime-smoke-recovery` |
| reviewer | なし（solo policy） |

---

## 2. PR 含むファイル

| ファイル | 種別 |
|---------|------|
| `.github/workflows/web-cd.yml` | edit（line 22 / 56 + 2 step 追加） |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/index.md` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/phase-{1..13}.md` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/artifacts.json` | new |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-11/**` | new（evidence） |

`scripts/cf.sh` には触れない（不変条件 1）。

---

## 3. PR 本文テンプレート

```markdown
## Summary

- `.github/workflows/web-cd.yml` の secret 参照名 `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` を実 GitHub Environment 登録名 `CLOUDFLARE_API_TOKEN` に整合。
- `deploy-staging` / `deploy-production` 両 job に `Verify CF token is present` step を追加（mise-action の後 / Install dependencies の前）。env 空時は `::error::` で即時 fail し再発時の根本原因を runner ログ先頭に出す。
- `scripts/cf.sh` は無変更（ローカル op 経路を維持）。CI 内では `op` を呼ばない。

## 背景

PR #648 マージ後の dev push run #374 で `web-cd / deploy-staging` が `[cf.sh] 1Password CLI (op) が見つかりません` で失敗。実 Environment は `CLOUDFLARE_API_TOKEN` のみ登録されており、workflow 側の参照名 drift で env が空文字 → cf.sh が op fallback で fail していた。

## Spec

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/phase-{1..13}.md`
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/index.md`
- 親ワークフロー: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/`

## 受入基準

| AC | 状態 |
|----|------|
| AC-01 旧 secret 名完全除去 | pass（grep 0 件） |
| AC-02 新 secret 名 2 箇所参照 | pass（grep -c=2） |
| AC-03 Verify step が両 job に存在 | pass（grep -c=2） |
| AC-04 op 不在エラー消失 | runtime_pending（user-approved dev run log で確認） |
| AC-05 Deploy step exit 0 | runtime_pending（user-approved run conclusion で確認） |
| AC-06 secret 値残留なし | pass（grep gate 0 件） |

## Evidence

`outputs/phase-11/evidence/` 配下:
- `yaml-syntax.log` / `grep-gate.log` / `secret-residue.log`
- `typecheck.log` / `lint.log`
- `runtime-ci-pending.md`

`dev-run-watch.log` / `dev-run-conclusion.txt` は commit / push / PR 承認後に追加取得する runtime evidence。

## ドキュメント更新

- `CLAUDE.md` 影響なし（運用方針の変更ではなく workflow 側を実体に整合させる修正のため）
- 親 `index.md` のサブタスク状態表（task-01 行）はマージ後 done に更新
- task-02 は別 PR で実施（runtime-smoke-staging readiness gate）

## CONST_007 / solo policy

- single-cycle scope 遵守（Phase 1→13 一直線）
- `required_pull_request_reviews=null` 維持
- `scripts/cf.sh` 不変・CI で op 不使用

## 残課題（backlog）

- BL-01: wrangler-action 移行検討（低）
- BL-02: Verify step の composite action 化（task-02 完了後・中）
- BL-03: cf.sh のエラーメッセージ多言語化（低）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 4. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --head fix/web-cd-secret-name-alignment \
  --title "fix(ci): align web-cd secret refs to existing CLOUDFLARE_API_TOKEN env secret" \
  --body-file docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-13/pr-body.md
```

`outputs/phase-13/pr-body.md` に §3 のテンプレートを投入してから実行する。

---

## 5. PR 作成前 final checklist

| # | 項目 | 確認方法 |
|---|------|---------|
| F-01 | `git status --porcelain` が PR 対象差分のみ | 実行 |
| F-02 | `git diff dev...HEAD --name-only` で含まれる変更がスコープ通り | 実行 + 目視 |
| F-03 | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` PASS | 実行 |
| F-04 | YAML 構文 / grep gate 全 PASS（Phase 6） | 実行 |
| F-05 | `scripts/cf.sh` に diff が無い | `git diff dev...HEAD -- scripts/cf.sh` 空 |
| F-06 | secret 実値が PR diff に含まれない | `git diff dev...HEAD \| grep -E 'eyJ[A-Za-z0-9_-]+\.'` 0 件 |
| F-07 | spec 13 phase + index + artifacts.json が揃っている | `ls docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/` |
| F-08 | local evidence ファイルと runtime pending marker が存在（phase-11 §2） | `ls docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-11/evidence/` |

---

## 6. PR merge 後 close-out 手順

| # | 操作 |
|---|------|
| M-01 | `gh run list --workflow=web-cd.yml --branch=dev --limit=1` で `success` 観測 |
| M-02 | `dev-run-watch.log` を `outputs/phase-11/evidence/` に追加コミット（必要に応じて follow-up PR） |
| M-03 | 親 `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md` のサブタスク表 task-01 行を done に更新 |
| M-04 | `artifacts.json#metadata.workflow_state` を `spec_implemented` に更新 |
| M-05 | `fix/web-cd-secret-name-alignment` を削除（local + remote） |
| M-06 | task-02（runtime-smoke-staging readiness gate）の前提として進行可能な状態を確認 |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | PR が `dev` に merge されている |
| EX-02 | merge 後 dev で `web-cd / deploy-staging` が green |
| EX-03 | `[cf.sh] 1Password CLI (op) が見つかりません` がログに含まれない |
| EX-04 | task-02 が本 PR merge を前提として進行可能 |

---

## 8. task-01 終了

本 Phase 完了をもって `ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment` を終了する。task-02 は別 spec で進行。
