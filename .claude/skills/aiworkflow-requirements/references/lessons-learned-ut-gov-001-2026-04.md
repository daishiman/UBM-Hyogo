# Lessons Learned — UT-GOV-001 GitHub Branch Protection Apply (Phase 12 close-out)

> 2026-04-29 分離: `lessons-learned-current-2026-04.md` が 900 行となり 500 行制限超過のリスクが高いため、UT-GOV-001 close-out 教訓は本ファイルへ分離する。
> 関連: `references/deployment-branch-strategy.md`（pending apply: UT-GOV-001 セクション） / `docs/30-workflows/ut-gov-001-github-branch-protection-apply/`
> 出典: `docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/system-spec-update-summary.md`

---

## L-GOV-001: GET 形 / PUT 形の用途分離（payload adapter pattern）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | infra / GitHub branch protection / payload normalization |
| 症状       | `gh api repos/{owner}/{repo}/branches/{branch}/protection` の GET 応答（snapshot）をそのまま `gh api -X PUT ... --input snapshot.json` に渡すと HTTP 422 で fail する |
| 原因       | GitHub branch protection API は GET / PUT で型形が非対称: GET は `enforce_admins.enabled: bool` / `restrictions.users[].login` / `required_pull_request_reviews=null` を許容しないネスト構造で返すが、PUT は `enforce_admins: bool` / `restrictions.users: ["login", ...]` / `required_pull_request_reviews: null` をフラットに要求する |
| 解決策     | snapshot（GET 形）と payload（PUT 形）を物理ファイルとして分離し、両者の間に payload adapter を置く。adapter で `enforce_admins.enabled` → bool / `restrictions.users[].login` → 配列 / `required_pull_request_reviews=null` を正規化してから PUT する |
| 再発防止   | adapter 経由でなければ PUT しない契約を Phase 5 runbook と `scripts/verify-branch-protection.sh` で固定。snapshot ファイルと payload ファイルを `{branch}` サフィックスで分離（dev / main の bulk PUT を禁止） |
| 関連タスク | UT-GOV-001 / Phase 5-6 / `references/deployment-branch-strategy.md` pending apply セクション |

## L-GOV-002: UT-GOV-004 完了前提の N 重明記（順序事故防止）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | governance / dependency ordering / required status checks |
| 症状       | UT-GOV-004（required_status_checks.contexts の実 job 名同期）未完了の状態で UT-GOV-001 を実 PUT すると、未登録 context が `required_status_checks.contexts` に固定され、PR が永続的に block される（解除には enforce_admins 解除 + 再 PUT が必要となり rollback コストが跳ね上がる） |
| 原因       | branch protection の `required_status_checks` は「過去 1 回以上 main で報告された context」しか受理せず、未報告 context を指定すると merge gate が永久に green にならない |
| 解決策     | UT-GOV-004 完了を上流前提として 5 重明記する: Phase 1（要件定義）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）/ Phase 11 STEP 0（再掲）/ Phase 12 system-spec-update-summary Step 1-C。未完了時は `contexts=[]` の 2 段階適用 fallback に切り替える |
| 再発防止   | governance 系タスクの上流依存は「テンプレ的 1 行」ではなく Phase 別に N 重明記する。Phase 11 STEP 0 を「上流依存 explicit re-check」に固定 |
| 関連タスク | UT-GOV-001 / UT-GOV-004 / Phase 1-3 / Phase 11 STEP 0 / Phase 12 |

## L-GOV-003: spec_created と user_approval_required の二重ゲート

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | process / Phase 12-13 boundary / docs-only ops |
| 症状       | 仕様書整備（Phase 12）が完了しても「実 PUT してよい」と誤解されやすく、destructive `gh api PUT` が Phase 13 ユーザー承認前に走るリスクがある |
| 原因       | Phase 12 完了 = `spec_created` で「仕様書として close-out」した状態であり、実適用ではない。Phase 13 のユーザー明示承認が独立ゲートとして必要だが、従来 Phase は 1 段ゲートで運用していた |
| 解決策     | Phase 12 完了条件を「spec_created / docs-only / 実 PUT 未実行」に固定し、Phase 13 を `blocked_until_explicit_user_approval` で別ゲート化。`artifacts.json` に `phase13_blocked` ステータスを置き、`docs/30-workflows/LOGS.md` の governance テーブルにも `spec_created` 行と Phase 13 pending 行を分離して記録する |
| 再発防止   | docs-only / NON_VISUAL の destructive ops 系タスクは Phase 12 close-out 完了でも実適用と切り離す。`task-specification-creator` テンプレに「destructive ops は Phase 13 ユーザー承認後の別オペレーション」明文化を反映 |
| 関連タスク | UT-GOV-001 / Phase 12-13 / `task-specification-creator` Phase 12 close-out ルール |

## L-GOV-004: NON_VISUAL / 手動 smoke の evidence 充足基準（docs-only 代替 evidence）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | process / Phase 11 / NON_VISUAL evidence |
| 症状       | UT-GOV-001 はアプリコード追加なし / GitHub UI / `gh api` 操作のみで完結し、視覚スモーク（screenshot）が成立しないため、Phase 11 の従来 evidence 仕様（UI smoke）と整合しない |
| 原因       | Phase 11 evidence 標準が「UI 動作確認 = 視覚証跡」前提で組まれており、運用証跡（snapshot.json / payload.json / applied.json / `gh api` 応答 / `verify-branch-protection.sh` 出力 / runbook ステップログ）を一級 evidence として扱う設計になっていなかった |
| 解決策     | Phase 11 では `manual-smoke-log.md` に `gh api` GET 応答 / payload diff / `gh run list` での context 登録確認を記録し、`scripts/verify-branch-protection.sh` 出力を再検証証跡として固定。UT-19 で確立した NON_VISUAL evidence パターン（L-UT19-002）を継承する |
| 再発防止   | docs-only / destructive ops 系タスクの Phase 11 サブテンプレに「snapshot / payload / applied JSON / verify script 出力 / runbook ステップログ」の 5 点を必須 evidence として固定する |
| 関連タスク | UT-GOV-001 / Phase 11 / `lessons-learned-ut-19-branch-protection-2026-04.md`（L-UT19-002 継承） |

---

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` — UT-GOV-001 適用予定値（pending apply セクション）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-19-branch-protection-2026-04.md` — UT-19 NON_VISUAL evidence 先例
- `docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/system-spec-update-summary.md` — Step 1-A/1-B/1-C/Step 2 REQUIRED 判定根拠
- `scripts/verify-branch-protection.sh` — 再検証スクリプト（GET → 期待値 grep）
