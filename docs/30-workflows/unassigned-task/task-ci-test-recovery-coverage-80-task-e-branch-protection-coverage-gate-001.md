# task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001: branch protection への coverage-gate required context 追加

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001 |
| タスク名 | GitHub branch protection の `required_status_checks.contexts` に `coverage-gate` を追加する |
| 優先度 | HIGH |
| 推奨Wave | 後続即時 |
| 状態 | unassigned |
| 作成日 | 2026-05-04 |
| 検出元 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/outputs/phase-12/unassigned-task-detection.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`ci-test-recovery-coverage-80-2026-05-04` Task E で `coverage-gate` job を hard gate 化（`continue-on-error: true` を job/step 両方から削除）したが、GitHub branch protection の `required_status_checks.contexts` に `coverage-gate` を登録しないと、PR マージ時の merge gate として機能しない。本タスクで `main` / `dev` 両ブランチの branch protection に `coverage-gate` を追加し、coverage 80% 未達 PR が merge できない状態を確定させる。

## スコープ

### 含む

- `gh api PUT /repos/daishiman/UBM-Hyogo/branches/main/protection` 経由で `required_status_checks.contexts` に `coverage-gate` を追加
- `gh api PUT /repos/daishiman/UBM-Hyogo/branches/dev/protection` 経由で同様に追加
- 適用後の fresh GET evidence 取得（`gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection`）
- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の "current applied" 表更新
- 既存 required context (`ci` / `Validate Build` 等) を破壊しないこと

### 含まない

- branch protection の他項目（`required_pull_request_reviews` / `lock_branch` / `enforce_admins`）の変更
- 新規 CI job の追加（既に Task E で `coverage-gate` job 自体は実装済み）
- `.github/workflows/ci.yml` の修正（hard gate 化は Task E で完了）
- 組織レベル / repo settings UI の変更
- coverage 閾値 80% 自体の見直し

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ci-test-recovery-coverage-80-2026-05-04 (Task E) の merge | hard gate 化された `coverage-gate` job が main 上で1回以上実行され、status check context として GitHub に登録されている必要がある（未登録だと PUT 時 `422 Unprocessable Entity`） |
| 上流 | Task C / Task D の coverage 80% 達成 | hard gate 化前提として coverage が 80% を満たしていること |
| 下流 | 本タスク完了後の全 PR | `coverage-gate` 失敗時に merge button が disabled になる |

## 着手タイミング

> **着手前提**: `feat/ci-coverage-recovery` が main へ merge され、main 上で `coverage-gate` job が success で1回以上実行済みであること。

| 条件 | 理由 |
| --- | --- |
| Task E の hard gate 化が main に取り込み済み | context 名 `coverage-gate` が GitHub の内部 DB に登録される必要がある（未登録だと PUT 失敗） |
| Task C / D の coverage 補強が main に取り込み済み | 80% 未達状態で hard gate を適用すると以降の PR が全部 block される |
| ユーザー明示承認 | repository setting の実 PUT を伴う外部設定変更のため CONST_007 user-gated 扱い |

## 苦戦箇所・知見

**1. context 名の登録タイミング**: GitHub branch protection の `required_status_checks.contexts` に登録する context 名は、対象 job が GitHub Actions 上で1回以上実行されないと内部 DB に登録されない。Task E が main へ merge されただけでは不十分で、main の最新 commit に対する CI run で `coverage-gate` job が完走している必要がある。未登録の context を PUT すると 422。

**2. 既存 contexts を破壊しない PUT 戦略**: `gh api PUT .../protection` は contexts を全置換するため、既存 `ci` / `Validate Build` 等を漏らすと merge gate が抜ける。事前に GET で現状の contexts を取得し、`coverage-gate` を append した完全な配列を PUT する。CLAUDE.md `Governance` セクションの drift 検証パターンに従う。

**3. solo 開発ポリシーとの整合**: `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の3点 invariant を維持すること。`coverage-gate` 追加時に他 protection 項目を意図せず変更してはならない。`.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表で drift がないか PUT 前後で確認する。

**4. dev / main 両方への適用順序**: 個人開発フローでは feature → dev → main で merge するため、dev 側の hard gate を先に有効化すると Task A-E 自身の merge が block される可能性がある。安全には main 側を先に hard gate 化し、dev 側は次サイクル以降の PR で安定後に適用する2段階を推奨。

## 実行概要

1. main 上で `coverage-gate` job が success で1回以上実行済みであることを `gh run list -b main -w ci.yml --limit 5` で確認する
2. `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-protection-before.json` で現状取得
3. `jq` で `required_status_checks.contexts` に `coverage-gate` を append した PUT body を組み立てる
4. `gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection --input <(...)` で適用
5. 適用後 `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で fresh GET し、`coverage-gate` が contexts に含まれ、`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` が drift していないことを確認
6. dev ブランチについて 2-5 を繰り返す（main 安定確認後）
7. `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表に `coverage-gate` を反映
8. テスト PR を起票し、coverage 80% 未達 commit を push したときに merge button が disabled になることを確認

## 完了条件

- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` の `required_status_checks.contexts` に `coverage-gate` が含まれている
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の `required_status_checks.contexts` に `coverage-gate` が含まれている
- [ ] 同 GET 結果で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` が維持されている（drift なし）
- [ ] 既存 contexts (`ci` / `Validate Build` 等) が消えていない
- [ ] `deployment-branch-strategy.md` の current applied 表が更新済み
- [ ] coverage 未達 PR で merge button が disabled になる挙動を1件以上の検証 PR で確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/outputs/phase-12/implementation-guide.md | hard gate 化の実装根拠・regression guard 仕様 |
| 必須 | docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/outputs/phase-12/unassigned-task-detection.md | 検出コンテキスト |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch protection の正本仕様・current applied 表 |
| 必須 | .github/workflows/ci.yml | `coverage-gate` job 定義（context 名の正本） |
| 参考 | scripts/coverage-guard.sh | hard gate の判定ロジック |
| 参考 | scripts/coverage-guard.test.ts | regression guard（`continue-on-error` 再混入検出） |
| 参考 | docs/30-workflows/unassigned-task/UT-19-github-branch-protection-manual-apply.md | 過去の branch protection 適用先例（手順テンプレ） |
