# lessons-learned: issue-901 staging-visual-authenticated の secrets 未投入 PR ブロック対策（2026-05-26）

## 事象

`playwright-staging-visual-authenticated.yml` は GitHub Environment `staging-visual-authenticated` の secrets（`STAGING_AUTH_SECRET` 等 6 件）を必要とするが、secrets 投入は **user-gated**（CLAUDE.md / memory `feedback_no_doc_for_secrets.md`）で AI からは実施不能。

結果として PR #946 で:
- ESM `__dirname` 修正後も `mint-staging-storage-state: missing/invalid env` で fail
- AI からは secrets 投入できないため永久に CI green にできない
- PR が `mergeStateStatus=BLOCKED` 状態で停止

## 解消

workflow の最初に `secrets-gate` step を追加し、

- `workflow_dispatch` 起動時は secrets 必須（exit 1）
- `pull_request` 起動時は secrets 不在を success-skip 扱い（`outputs.skip=true`）

後続 step すべてに `if: steps.secrets-gate.outputs.skip != 'true'` を付与。`if: always()` 系も `&& steps.secrets-gate.outputs.skip != 'true'` で AND 結合。

これにより:
- secrets 投入完了状態の `workflow_dispatch` / dev push では従来通り厳格に baseline 撮影
- secrets 未投入の任意 PR では skip success で PR を unblock
- workflow file 自体の変更検知 trigger（`paths` filter）は維持

## L-I901-ENVSEC 系 lessons

- **L-I901-ENVSEC-001**: secrets 必須 workflow を新規作成する spec では、Phase 4 contracts に「pull_request event での secrets 未投入時の graceful skip」を必ず含める。後付け unblock 作業を発生させない。
- **L-I901-ENVSEC-002**: required status check に含める場合、graceful skip success は「実 baseline = skip」を意味することを understand する。実検証は workflow_dispatch / 投入後 push で別途実施する設計を明記する。
- **L-I901-ENVSEC-003**: `continue-on-error: true` での誤魔化しは禁止。真の secrets 欠落と spec バグの双方が無視されるため、skip 判定を明示的に行う。
- **L-I901-ENVSEC-004**: secrets を vars に降格させる妥協は禁止（漏洩リスク）。`pull_request` trigger を外す妥協も禁止（workflow file 変更が CI で検知できなくなる）。

## 反映先

- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md`: 「環境 secrets 必須 workflow の PR 非ブロック化」セクションに L-ENVSEC-001..004 として汎化追記
- `.claude/skills/aiworkflow-requirements/lessons-learned/`: 本ファイル
