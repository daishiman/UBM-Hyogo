---
task: branch-sync (dev → feature) CI gate recovery
recorded: 2026-05-15
topics: [ci-cd, branch-sync, indexes, gate-metadata, merge-conflict, artifacts-json]
related-references:
  - .claude/skills/aiworkflow-requirements/references/gate-metadata.md
  - .claude/skills/aiworkflow-requirements/indexes/keywords.json
  - .claude/skills/aiworkflow-requirements/indexes/topic-map.md
  - .github/workflows/verify-indexes.yml
classification: [operations/branch-sync, ci-cd/required-status-checks, design/artifacts-json-schema]
---

# Lessons Learned — dev → feature sync で発火する CI gate 2 種（2026-05）

`branch-sync-and-push` プロンプトで dev を feature ブランチへ取り込んだ際に、PR 上で 2 種類の required status check が連動して落ちた事例から得た教訓を classification-first で整理する。同種の sync-merge は今後も発生するため、再発防止手順を 使用書 として記録する。

---

## 1. operations / 自動生成 indexes は dev 採用後に必ず rebuild する

### 概要
`.claude/skills/aiworkflow-requirements/indexes/keywords.json` と `indexes/topic-map.md` は `node scripts/generate-index.js`（= `pnpm indexes:rebuild`）で全 references から再生成される自動生成物である。dev → feature の sync-merge でこの 2 ファイルがコンフリクトした場合、`--theirs`（dev 側採用）や `--ours`（feature 側採用）だけで終わらせると、マージ後に追加された references / changelog / lessons-learned が反映されず drift する。

### なぜ重要か
- `.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` job は dev / main の **required status check** に登録済みで、drift 検出時に `pnpm indexes:rebuild` 結果との diff を吐いて exit 1 する。
- merge コミット直後の push でこの gate が落ちると、PR は merge 不可になる。
- 「マージは成功したが CI が赤」という状態は、sync-merge の責務範囲（リモート取り込み）と CI gate の責務範囲（drift gate）が分離されていることが原因で、片側だけ満たすと必ず再発する。

### 再発防止アクション
- sync-merge のコンフリクト解消手順:
  1. `git checkout --theirs .claude/skills/aiworkflow-requirements/indexes/keywords.json .claude/skills/aiworkflow-requirements/indexes/topic-map.md` で一旦 dev 側に揃える。
  2. **マージコミット作成と同じ wave で** `mise exec -- pnpm indexes:rebuild` を実行する。
  3. rebuild 後の差分を `chore(indexes): rebuild after dev merge` の単独コミットとして積む（merge コミットに混ぜない）。
- `--ours` / `--theirs` で終わらせて push する運用は **常に drift を生む**ため禁止する。
- LOGS / changelog / lessons-learned を追加・変更した PR では、push 前に必ず一度 `pnpm indexes:rebuild` を実行して `git status` がクリーンになることを確認する。

---

## 2. ci-cd / 新規 `completed-tasks/*/artifacts.json` は metadata.gates 必須

### 概要
`scripts/gate-metadata/` の validator は `--require-gates-for-changed` モードで PR 変更ファイル一覧を受け取り、`metadata.gates` が欠落している `artifacts.json` を **ERROR** として exit 1 する。`verify-gate-metadata` job が required status check のため、新規 `docs/30-workflows/completed-tasks/<task-id>/artifacts.json` を追加する PR でこの gate が落ちる。

### なぜ重要か
- `references/gate-metadata.md` の Validator Contract は「`metadata.gates` absent」を WARN（historical artifacts のみ skip）として明文化しているが、**changed artifacts.json は ERROR** に格上げされる契約になっている。
- gates 欠落が見過ごされると、Gate-A / Gate-B / Gate-C の通過証跡が構造化されないままタスクが close され、後続の Phase 12 strict outputs と evidence path の機械検証が利かなくなる。
- 「artifacts.json は既存」「他の field は揃っている」だけでは gate を通過しない。

### 再発防止アクション
- 新規 `artifacts.json`（root と `outputs/artifacts.json` の両方）を追加する際は、`metadata` 直下に以下を必ず含める:
  ```json
  "gates": [
    {
      "gate_id": "Gate-A",
      "status": "passed",
      "passed_at": "<ISO8601>",
      "evidence_path": "<repo-root relative POSIX path>",
      "approver": "<github user | CODEOWNERS:<group>>"
    },
    { "gate_id": "Gate-B", "status": "passed | pending | failed | waived", ... },
    { "gate_id": "Gate-C", "status": "pending | passed | waived", "passed_at": null, "evidence_path": "...", "approver": "..." }
  ]
  ```
- canonical reference: 既存 `docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv/outputs/artifacts.json` を雛形とする。
- field 規則は `references/gate-metadata.md § Gate Entry Contract` を参照（`gate_id` 正規表現 / `passed_at` ISO8601 / `evidence_path` は repo-root 相対 POSIX）。
- ローカル検証コマンド:
  ```bash
  pnpm gate-metadata:validate
  pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts-json...>
  ```
- task-specification-creator スキルで新規 task を生成した直後（Phase 12 close-out 前）に `pnpm gate-metadata:validate` を一度回し、後段の PR で初めて落ちる事故を防ぐ。

---

## 3. design / sync-merge と「タスク本体の責務」を分離する

### 概要
dev → feature の sync-merge で CI が落ちた場合、落ちた gate のうち **sync-merge 起因のもの**（例: indexes drift）と **元のタスクから持ち込まれた既存問題**（例: 新規 task artifacts.json の gates 欠落）を分離して扱う。

### なぜ重要か
- sync-merge プロンプトはリモート取り込みと現在ブランチの push が責務であり、タスク本体（issue-XXX の deliverable）の品質保証は別責務である。
- 既存問題まで sync-merge の中で混ぜて修正すると、merge コミットの責務が肥大化し、後から diff レビューと revert が困難になる。

### 再発防止アクション
- sync-merge 完了レポートでは「sync 起因の失敗」と「既存失敗」を明示分離する。
- 既存失敗の修正は **タスク本体の Phase 12 close-out** に組み込み、別コミットで対処する。本 lessons-learned ファイル自体も Phase 12 close-out 同期 wave の成果物として扱う。

---

## 4. ci-cd / ローカル `gate-metadata:validate` の WARN は CI の ERROR と一致しない（2026-05-18 task-761 再発）

### 概要
`task-761-visual-full-required-status-check` で `metadata.gates` が両 `artifacts.json` に未配置のまま push し、`verify-gate-metadata` が ERROR で落ちた。本 lessons-learned § 2 と `references/gate-metadata.md` で既に明文化済みのパターンの **再発**。

### なぜ再発したか
- ローカル `pnpm gate-metadata:validate`（pre-flight `scripts/verify-pr-ready.sh` が実行する形）は **`--require-gates-for-changed` 引数なし** で動くため、`metadata.gates` 欠落は **WARN/skip** にダウングレードされ、ERROR にならない。
- CI 側だけが PR の changed `artifacts.json` を `--require-gates-for-changed` に渡して ERROR へ格上げするため、「pre-flight 緑 → CI 赤」というギャップが生まれる。
- pre-flight でこの差分を吸収する仕組みがなく、`completed-tasks/<task>/artifacts.json` を新規追加した PR で繰り返し落ちる構造になっていた。

### 再発防止アクション
- 新規／変更した `artifacts.json` を含む PR では、push 前に **手動で** 以下を実行する:
  ```bash
  changed=$(git diff origin/dev...HEAD --name-only -- 'docs/30-workflows/**/artifacts.json')
  pnpm gate-metadata:validate --require-gates-for-changed $changed
  ```
- 上記コマンドを `pr-pre-flight-ci-gate-checklist.md § 1` に追加済み。`scripts/verify-pr-ready.sh` への組み込み（changed files を自動算出して strict モードで呼ぶ）は別タスク化候補。
- task-specification-creator スキルで governance-mutation task（`gateModel: three_gate_a_b_c`）を生成する際は、`metadata.gates` を初期テンプレに **必ず** 含めることを Phase 12 close-out チェックの必須項目とする。
- canonical 3-gate テンプレ実例: `docs/30-workflows/completed-tasks/task-761-visual-full-required-status-check/artifacts.json`（Gate-A spec / Gate-B validator / Gate-C runtime user-approval を `three_gate_a_b_c` で配置）。
