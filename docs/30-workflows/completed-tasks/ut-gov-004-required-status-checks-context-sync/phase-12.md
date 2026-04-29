# Phase 12: ドキュメント更新（close-out）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 (UT-GOV-004) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（close-out） |
| 作成日 | 2026-04-29 |
| 前 Phase | 11（手動 / `gh api` 検証 evidence 取得） |
| 次 Phase | 13（PR 作成・承認ゲート） |
| 状態 | spec_created |
| タスク分類 | implementation（CI / governance / docs sync）— `scripts/governance/` 等の補助スクリプト追加を伴う場合は `implemented` 扱い |
| user_approval_required | false |
| 関連 Issue | #147（**既に CLOSED**） |

> **備考**: GitHub Issue #147 は既に CLOSED 済み。本タスク仕様書は close 済み Issue の作業を遡及的に正規ワークフロー（13 Phase）の体裁で整理するために作成する。Phase 13 で PR を作る場合も Issue 自動 close（`Closes #147`）は不要で、`Refs #147` 形式のみ用いる。

## 目的

Phase 1〜11 で得られた以下の成果を close-out 用に正本化する。

- `.github/workflows/` 配下の **実在 workflow / job 名** から導出した branch protection `required_status_checks.contexts` の確定リスト
- 草案 8 contexts（typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate）に対する **存在性検証結果**（`gh api` で過去 30 日以内に check-run 実績があるかどうか）
- 段階適用案（Phase 1: 既出 context 先行投入 → Phase 2: 新規 workflow 追加後の追補）
- `strict: true` 採否の決定（dev / main で差をつけるか含む）
- lefthook hook ↔ CI job 対応表（`task-git-hooks-lefthook-and-post-merge` との整合）

これらを `.claude/skills/aiworkflow-requirements/references/` の governance / CI / branch protection 関連 reference へ反映し、UT-GOV-001（branch protection apply）が **本タスクの確定リストを単一情報源として参照** できる状態にする。

`validate-phase-output.js` / `verify-all-specs.js` の PASS と二重 ledger（root `artifacts.json` / `outputs/artifacts.json`）の同期を必ず通す。

## 必須 5 タスク（task-specification-creator skill 準拠）

Phase 12 では下記 5 タスクすべてが **必須出力**（0 件・改善点なしであっても出力ファイルは必ず作る）。

1. **実装ガイド作成（2 パート構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも必ず出力）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも必ず出力）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する（合計 6 ファイル）。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1: 中学生レベルの例え話 / Part 2: 技術者レベルの `gh api` 検証手順・段階適用・`strict` トレードオフ）を 1 ファイルに統合作成。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述。`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `deployment-branch-strategy.md` / `governance-hooks-factory-audit-sink.md` への反映を **具体ファイル名で指定**する。
- Task 12-3: documentation-changelog を生成（変更ファイル一覧 + 種別 + 日付）。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力（未存在 context があれば UT-GOV-005 へリレー）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力。
- Task 12-6: phase12-task-spec-compliance-check を実施。本タスクは docs+調査中心だが `scripts/governance/` 配下にヘルパースクリプト（例: `verify-required-contexts.sh`）が追加された場合は **`implemented` 扱い**になる旨を明記。
- Task 12-7: same-wave sync（LOGS ×2 / SKILL ×2 / topic-map）を完了。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期。
- Task 12-9: `validate-phase-output.js` / `verify-all-specs.js` を実行し、全 PASS を確認。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 詳細仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 落とし穴チェックリスト |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | 全 Phase 共通 quality gate |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync ルール |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/implementation-runbook.md | 実装ランブック |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-06/failure-cases.md | 異常系復旧ケース |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-07/ac-matrix.md | AC トレース表 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml | UT-GOV-001 の唯一の機械可読入力 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-09/main.md | governance QA 結果 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-10/go-no-go.md | 最終 GO/NO-GO 判定 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GitHub Actions 正本仕様（context 名定義の反映先） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch protection / merge 戦略の正本（草案 → 確定の差し替え先） |
| 必須 | .claude/skills/aiworkflow-requirements/references/governance-hooks-factory-audit-sink.md | governance hooks / lefthook ↔ CI 対応の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/lessons-learned-verify-indexes-ci-2026-04.md | 既存 CI gate（verify-indexes）の context 名形成事例 |
| 必須 | .github/workflows/ci.yml / backend-ci.yml / validate-build.yml / verify-indexes.yml / web-cd.yml | 実在 workflow / job 名の grep 対象 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典タスク指示書 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | 草案 8 contexts の出典（§2.b） |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md | §1（target contexts）/ §5（H-1: context drift hazard） |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 後続タスク（本タスクの成果物を入力する） |
| 参考 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | CI gate 追加の事例参照 |
| 参考 | docs/30-workflows/completed-tasks/task-husky-rejection-adr.md | governance ADR の参考フォーマット |

## 実行手順

### ステップ 1: 実装ガイド作成（Task 12-1）

`outputs/phase-12/implementation-guide.md` を以下 2 パート構成で記述する。

**Part 1（中学生レベル / 日常の例え話必須・3 つ以上）**

- 「branch protection の `required_status_checks.contexts` って何？」
  - 例え話 1: 「学校で『プリント全員提出してから帰っていいよ』のルールを先生が決める。提出する書類リスト（contexts）にない名前のプリントがあっても、ルール上は『関係ないプリント』として無視される。逆に、リストに『誰も書いたことのない書類名』を入れてしまうと、その書類は永遠に集まらないので、いつまでも帰れない（merge できない）」
- 「なぜ context 名を間違えると PR が永遠に止まるの？」
  - 例え話 2: 「『田中くんの計算ドリルを集める』とリストに書いたのに、実際の書類名が『田中の算数プリント』だった場合、先生は『田中くんの計算ドリル』をいつまでも待ち続ける。書類自体は届いているのに、名前が違うので永遠にチェックが終わらない」
- 「なぜ実在 job 名と一致させないといけないの？」
  - 例え話 3: 「クラス替えで名簿（job 名）が変わったのに、提出ルール（contexts）が古い名簿のままだと、先生は『いない人』のプリントを待ち続けて、誰も帰れなくなる。だから、ルールを更新する前に必ず最新の名簿を見ましょう」
- 「`strict: true` って何？」
  - 例え話 4: 「『他のクラスでルールが更新されたら、自分のプリントもその最新ルールで書き直してから提出してね』というルール。安全だが、書き直す回数が増える」

**Part 2（技術者レベル）**

- `.github/workflows/` 配下の workflow grep 手順（`yq` または `grep -nE "^name:|^\s+name:" .github/workflows/*.yml`）
- context 名の生成規則: `<workflow name> / <job name>` / matrix 展開時の `<workflow> / <job> (<matrix-value>)` / `name:` 省略時は job key
- `gh api` での実績検証手順（**直近 30 日 / 最新 main コミットの check-runs**）

  ```bash
  # 最新の main HEAD SHA に対する全 check-run 一覧
  gh api "repos/:owner/:repo/commits/$(git rev-parse origin/main)/check-runs" \
    --jq '.check_runs[] | {name: .name, status: .status, conclusion: .conclusion}'

  # branch protection 現状取得
  gh api "repos/:owner/:repo/branches/main/protection/required_status_checks" \
    --jq '{strict: .strict, contexts: .contexts, checks: .checks}'
  ```

- 段階適用案

  | フェーズ | 投入対象 | 条件 |
  | --- | --- | --- |
  | Phase 1（即時） | `gh api` で過去 30 日以内に PASS 実績がある context のみ | UT-GOV-001 で apply |
  | Phase 2（追補） | 未存在 context は UT-GOV-005 で workflow を新設 → main に 1 回 PASS 実績を作成 → contexts へ追加 | UT-GOV-005 完了後に再 apply |

- `strict` 採否決定の判断軸: 開発体験悪化（rebase/merge 増） vs main 破壊リスク低減。ソロ開発・solo merge 前提で `dev=false` / `main=true` を推奨（CLAUDE.md ブランチ戦略と整合）。
- lefthook hook ↔ CI job 対応表（同一 `pnpm` script を双方から呼ぶ規約）

  | lefthook hook | 呼び出し script | 対応 CI job (context) |
  | --- | --- | --- |
  | pre-commit | `pnpm lint` | `ci / lint`（要確定） |
  | pre-commit | `pnpm typecheck` | `ci / typecheck`（要確定） |
  | pre-push | `pnpm test` | `ci / unit-test`（要確定） |
  | pre-push | `pnpm indexes:rebuild --check` | `verify-indexes / verify`（既出・実績あり） |

### ステップ 2: システム仕様更新（Task 12-2）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS.md ×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-GOV-004 の Phase 1〜13 完了行追記（Refs #147） |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | governance / branch protection 正本更新の参照ログ |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Phase 12 「Issue が CLOSED 済みでも遡及仕様書を作成する」事例フィードバック |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新（`deployment-gha.md` / `deployment-branch-strategy.md` / `governance-hooks-factory-audit-sink.md` 改訂行） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新（あれば） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 「branch protection / required_status_checks / context 名同期」キーワードの追加とリンク |
| 関連 doc リンク | UT-GOV-001 / UT-GOV-005 / UT-GOV-006 / UT-GOV-007 / `task-git-hooks-lefthook-and-post-merge` / `task-verify-indexes-up-to-date-ci` への双方向リンク |

**Step 1-B: 実装状況テーブル更新**

- `docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md` のステータスを `proposed` → `implemented`（または `documented`）に更新。
- `docs/30-workflows/01-infrastructure-setup/01a-parallel-github-and-branch-governance/index.md` の「下流 / 関連」テーブルに UT-GOV-004 の確定 context リストへのリンクを追加。

**Step 1-C: 関連タスクテーブル更新**

- UT-GOV-001 の指示書（`docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`）の「入力」欄に **本タスクの確定 context リスト**（`outputs/phase-08/confirmed-contexts.yml`）を必須参照として追加し、`outputs/phase-12/implementation-guide.md` は説明用参照に留める。
- `task-git-hooks-lefthook-and-post-merge` の hook 定義に lefthook ↔ CI 対応表へのリンクを追加。
- UT-GOV-005 / UT-GOV-006 / UT-GOV-007 の関連欄から本タスクへ逆方向リンク。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

本タスクは branch protection 設定値（context 名・strict・enforce_admins 連動）の **正本化** であり、新規 API / IPC / DB schema の追加は無い。ただし以下 3 ファイルの reference は **設定値正本** として更新する（Step 2 ではなく Step 1-A の延長として扱う）。

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
  - 全 workflow / job 名一覧（matrix 展開後の context 名込み）
  - context 名命名規則（`name:` の必須化方針 / 省略禁止）
- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
  - 確定 contexts（`required_status_checks.contexts` の最終形）
  - `strict` 採否（dev=false / main=true 推奨）と根拠
  - 段階適用ルール（既出のみ → 新設後追補）
- `.claude/skills/aiworkflow-requirements/references/governance-hooks-factory-audit-sink.md`
  - lefthook hook ↔ CI job 対応表（同一 `pnpm` script 経由）
  - context 名変更を伴う refactor の運用ルール（同一 PR で branch protection も更新 / または新旧並列投入 → 旧側 PASS 後に旧除去）

> Step 2 形式の「新規 IF 追加」には該当しないため、`Step 2: N/A（設定値正本更新は Step 1-A に統合）` と明示記載する。

### ステップ 3: ドキュメント更新履歴作成（Task 12-3）

`outputs/phase-12/documentation-changelog.md` を生成する（種別: 新規 / 更新 / 同期）。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/ | UT-GOV-004 仕様書 13 Phase + index + artifacts.json |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | 実在 workflow / job 名の一覧と命名規則を追記 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | 確定 contexts / strict 採否 / 段階適用ルール |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/governance-hooks-factory-audit-sink.md | lefthook ↔ CI 対応表 / context drift 運用ルール |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | branch protection / context 同期キーワード追加 |
| 2026-04-29 | 同期 | docs/30-workflows/LOGS.md | UT-GOV-004 完了行追加（Refs #147） |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/LOGS/_legacy.md | 正本反映ログ |
| 2026-04-29 | 同期 | .claude/skills/task-specification-creator/LOGS/_legacy.md | CLOSED Issue 遡及仕様書作成事例 |
| 2026-04-29 | 更新 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 入力欄に本タスク確定 contexts リストを必須参照として追加 |
| 2026-04-29 | 新規（条件付き） | scripts/governance/verify-required-contexts.sh | `gh api` で contexts 実在性を検証する補助スクリプト（追加した場合のみ・implemented 判定） |

### ステップ 4: 未割当タスク検出レポート（Task 12-4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。0 件の場合も「該当なし」セクションは必ず作成する。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| 草案 contexts のうち workflow 未存在のもの（例: `phase-spec-validate`） | 実作業 | 新規 workflow 設計 + 1 回 PASS 実績作成 | UT-GOV-005 |
| `docs-link-check` workflow が未存在の場合 | 実作業 | docs 用 link-check workflow 新設 | UT-GOV-005 |
| `security-scan` workflow が未存在の場合 | 実作業 | security 用 workflow 新設 | UT-GOV-005 |
| 同名 job が複数 workflow に存在するケース | 設計 | 確定リストで `<workflow> / <job>` フルパス記載 | 本タスク内で吸収 |
| context 名変更を伴う将来 refactor の運用ルール | 設計 | 同一 PR で branch protection も更新 / 並列投入 → 旧除去 | governance-hooks-factory-audit-sink.md に明文化 |
| `strict: true` を main に適用後の rebase 摩擦観測 | 検証 | 1 ヶ月運用後に再評価 | UT-GOV-001 完了後 next wave |

### ステップ 5: スキルフィードバックレポート（Task 12-5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | CLOSED 済み Issue に対する遡及仕様書作成のガイドが明示的でない | Phase 12 spec に「CLOSED Issue は `Refs #N` 形式で扱い `Closes` 禁止」のルールを追記 |
| aiworkflow-requirements | branch protection の context 名は `deployment-gha.md` と `deployment-branch-strategy.md` に分散しがち | 単一 reference（仮: `governance-required-contexts.md`）への集約を検討 |
| github-issue-manager | CLOSED 済み Issue へのコメント追加で双方向リンクを保つ運用が未整備 | CLOSED Issue 用の「遡及仕様書 link comment」テンプレ追加 |

### ステップ 6: Phase 12 compliance check（必須）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 6 ファイル（compliance check 含む） | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート（例え話 3 つ以上） | PASS |
| Step 1-A / 1-B / 1-C が記述 | system-spec-update-summary に含まれる | PASS |
| Step 2 の必要性判定が記録 | 設定値正本のため Step 1-A に統合（N/A 明記） | PASS |
| same-wave sync が完了 | LOGS ×2 + SKILL ×2 + topic-map | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| タスク特性判定 | docs+調査中心、`scripts/governance/` 追加時は `implemented` / 無ければ `documented` | PASS |
| Issue 状態判定 | #147 は CLOSED のため Phase 13 PR で `Closes` を使わず `Refs` に限定 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS/_legacy.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS/_legacy.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES（更新事項あり） |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES（更新事項あれば） |
| Index | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.docsOnly`。
- 片方のみ更新は禁止（drift の主要原因）。

## タスク特性 / `implemented` 判定【必須】

- 本タスクは **docs + 調査中心**（`.github/workflows/` は読み取り専用、branch protection の実 apply は UT-GOV-001 の責務）。
- `scripts/governance/verify-required-contexts.sh` 等の補助スクリプトを **追加した場合のみ** `metadata.taskType = "implemented"` / `docs_only = false`。
- 追加が無い場合は `metadata.taskType = "docs-only"` / `docs_only = true` / `visualEvidence = "NON_VISUAL"`。
- いずれの場合も same-wave sync / 二重 ledger / validate / verify は PASS 必須。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
mise exec -- node scripts/validate-phase-output.js \
  --task ut-gov-004-required-status-checks-context-sync

mise exec -- node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の `outputs/` 不足ファイルまたは artifacts.json drift を是正してから再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | `gh api` 検証 evidence を `system-spec-update-summary.md` の確定 contexts セクションに転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 後続タスク UT-GOV-001 | `outputs/phase-08/confirmed-contexts.yml` を唯一の機械可読入力として参照し、`outputs/phase-12/implementation-guide.md` は説明用に参照 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも読めるレベルか（merge 永久停止リスクが直感的に理解できるか）。
- 実現性: Step 1-A で指定した 3 つの reference ファイルが実在し、更新箇所が具体行で記述されているか。
- 整合性: `deployment-gha.md` の workflow 一覧と `.github/workflows/*.yml` の grep 結果が完全一致するか。
- 運用性: unassigned-task-detection の委譲先（UT-GOV-005 等）が実在 ID か。
- 認可境界: PR 描画時に `GITHUB_TOKEN` / `gh auth token` の値が記録されていないか。
- Secret hygiene: `gh api` 実行ログに token 文字列が混入していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 3 つ以上 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | gh api / 段階適用 / strict / lefthook 対応 |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 N/A 明記 |
| 4 | documentation-changelog | 12 | spec_created | 9 ファイル + 条件付き 1 件 |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期 | 12 | spec_created | root + outputs |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |

## 成果物（必須 6 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者: gh api / strict / 段階適用） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 N/A 明記 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全項目 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 6 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（N/A 判定含む）が明記
- [ ] documentation-changelog に変更ファイルが網羅されている（最低 9 件）
- [ ] unassigned-task-detection が 0 件でも出力されている
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + topic-map）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] `metadata.taskType` の判定（`implemented` or `documented`）が `git status` 結果と整合

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `completed`
- 必須 6 成果物が `outputs/phase-12/` に配置される設計になっている
- close-out ルール（N/A にせず same-wave sync で閉じる）が遵守されている
- Issue #147 が CLOSED 済みである事実が compliance check と Phase 13 の PR テンプレに反映されている
- artifacts.json の `phases[11].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成）
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の UT-GOV-005 リレー項目 → 別 PR / 別 wave に切り出し
  - **Issue #147 は CLOSED 済み**のため Phase 13 PR の body では `Refs #147` を使い `Closes #147` は使わない
- ブロック条件:
  - 必須 6 ファイルのいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 + topic-map）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - `gh api` による context 実在性の evidence が Phase 11 から引き継がれていない

## 依存成果物参照

- `outputs/phase-05/implementation-runbook.md`
- `outputs/phase-05/workflow-job-inventory.md`
- `outputs/phase-05/required-contexts-final.md`
- `outputs/phase-05/lefthook-ci-mapping.md`
- `outputs/phase-05/staged-rollout-plan.md`
- `outputs/phase-05/strict-mode-decision.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/main.md`
- `outputs/phase-08/confirmed-contexts.yml`
- `outputs/phase-08/lefthook-ci-mapping.md`
- `outputs/phase-09/main.md`
- `outputs/phase-09/strict-decision.md`
