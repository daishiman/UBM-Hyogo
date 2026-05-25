# Phase 13: PR Gate

## ステータス

**commit / push / PR 作成はユーザー明示承認まで blocked。**

本タスクは `spec_created` 段階であり、ローカル実装・テスト実行・品質ゲートをすべて通過してからユーザーへ承認を求める。

---

## spec-from-closed-issue モード: issue 状態の扱い

- GitHub issue #869 は **CLOSED 状態を維持する**。PR 作成時に reopen しない
- PR description では `Refs #869` で参照のみ行う（`Closes #869` / `Fixes #869` は使わない）
- ローカル台帳（`docs/30-workflows/issue-869-csp-enforce-cutover/`）が実装の正本を担う

---

## 前提条件（blocked 解除のチェックリスト）

以下がすべて green になってから承認を求める。

| 条件 | コマンド / 確認方法 | 期待結果 |
|------|-----------------|---------|
| ローカル実装完了 | `git diff --stat` で対象ファイル全件差分が存在すること | 差分あり |
| Vitest TC-01〜04（env.spec.ts） | `mise exec -- pnpm --filter @ubm-hyogo/web test -- env.spec` | PASS |
| Vitest TC-05/06 + 回帰（security-headers.spec.ts） | `mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers.spec` | PASS |
| Playwright TC-07/08（enforce） | `CSP_MODE=enforce ... playwright test security-headers.spec.ts` | PASS |
| Playwright TC-07/08（report-only） | `... playwright test security-headers.spec.ts` | PASS |
| Typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| Lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| Build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |
| verify-pr-ready | `bash scripts/verify-pr-ready.sh` | exit 0 |
| grep ガード（ハードコード禁止） | `rg -n "cspMode.*report-only" apps/web/src/middleware.ts` | hit 0 |

---

## PR 情報骨子

**PR base ブランチ**: `dev`（CLAUDE.md 既定・main への直接 PR 禁止）

**想定 PR タイトル**:

```
feat(csp): CSP モード切替を環境変数 CSP_MODE で設定可能にする (#869)
```

**想定 PR 本文骨子**:

```markdown
## 変更概要

apps-web-security-headers-hardening の follow-up タスク。
middleware.ts にハードコードされていた `cspMode: "report-only"` を
環境変数 `CSP_MODE` 経由に変更し、staging と production で段階的に
enforce を有効化できる仕組みを導入する。

## 変更ファイル

- `apps/web/src/lib/env.ts`: CSP_MODE zod enum + getSecurityHeaderEnv() 追加
- `apps/web/middleware.ts`: getSecurityHeaderEnv() 経由配線変更
- `apps/web/wrangler.toml`: 環境別 CSP_MODE vars 設定（staging=enforce / production=report-only）
- `apps/web/src/lib/env.spec.ts`: TC-01〜04 追加
- `apps/web/playwright/tests/security-headers.spec.ts`: TC-07/08 追加

変更禁止ファイル（手を加えていない）:
- `apps/web/src/lib/security-headers.ts`（SSOT）
- `apps/web/src/lib/security-headers.spec.ts`（回帰ガード）

## テスト結果

- Vitest TC-01〜08 + enforce 回帰: PASS
- Playwright security-headers（enforce / report-only 双方）: PASS
- Typecheck / Lint / Build: exit 0

## staging / production 動作

- staging は deploy 後即 enforce（CSP_MODE=enforce）
- production は report-only 観察（1〜2 週間）後に ops runbook で enforce 切替予定
- production enforce 切替は wrangler.toml 1 行変更 + cf.sh deploy のみ（コード変更なし）

## 関連

Refs #869 (CSP report-only → enforce 切替, CLOSED)
Soft deps: #868 (report-to 集約, 本 PR 非ブロッカー), #871 (nonce 化, 独立), #870 (api hardening, 独立 surface)
```

---

## production enforce 実切替の扱い

production の `CSP_MODE` を `"report-only"` → `"enforce"` に変更する操作は**本 PR とは別の ops 操作**である。

- 実施タイミング: staging enforce 確認後 + production report-only 観察（1〜2 週間）後
- 実施方法: `ops runbook`（`outputs/phase-12/implementation-guide.md` §Production Cutover Ops Runbook 参照）
- PR 化: `wrangler.toml` 変更を含む軽量 PR を別途作成する（issue reopen 不要）
- この ops 操作の承認もユーザー明示承認が必要

---

## aiworkflow 同波 sync（PR 承認後・merge 前後に実施）

| 対象 | 変更内容 |
|------|---------|
| `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | `CSP_MODE` + `getSecurityHeaderEnv()` 追記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-869 workflow エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory 行追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 完了欄へ移動 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` | 新規インターフェース登録 |

これらは PR と同一 commit に含めるか、merge 直後の後続 commit で実施する。
