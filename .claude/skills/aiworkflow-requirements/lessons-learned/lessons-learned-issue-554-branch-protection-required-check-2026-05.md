# Lessons Learned — Issue #554 Audit Correlation Branch Protection Required Check（2026-05-08）

> task: `issue-554-audit-correlation-branch-protection-required-check`（unassigned `U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02-branch-protection-required-check.md` から正式昇格、Issue #516 deferred FU-02）
> 関連 SSOT: `.claude/skills/aiworkflow-requirements/references/branch-protection.md`、`.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
> 関連 reference: `references/workflow-issue-554-audit-correlation-branch-protection-required-check-artifact-inventory.md`、`references/task-workflow-active.md`（issue-554 行）、`indexes/quick-reference.md`、`indexes/resource-map.md`
> 関連 changelog: `changelog/20260508-issue554-audit-correlation-required-check.md`

## 教訓一覧

### L-554-001: branch protection PUT payload は **既存値保持を default、drift 訂正は同 op で行わず別判断** とする

- **背景**: GitHub `PUT /repos/{owner}/{repo}/branches/{branch}/protection` は payload に省略したフィールドを `null` 等で上書きする破壊的 API。Issue #554 では `audit-correlation-verify / verify` を `required_status_checks.contexts` に追加するだけが目的だったが、ナイーブな payload 構築だと既存の `required_pull_request_reviews=null`（solo dev 不変条件）/ `required_linear_history=true` / `required_conversation_resolution=true` / `lock_branch=false` が消失する事故が起きうる。さらに before snapshot で intended invariants から drift していた場合（例: `lock_branch=true` になっている）、同じ PUT で「contexts 追加 + drift 訂正」を一度にやると、ユーザーの意図しない値変更が混入する。
- **教訓**: branch protection 系の governance task は次の 3 点を runbook に固定すること。① **normalized contexts-only adapter pattern**（before snapshot を読み込み、変更対象フィールド以外は現値をそのまま再 PUT する payload を組み立てる）。② **drift 検出時の Phase 13 user-decision 分岐**（contexts-only apply / same-operation drift correction / separate task の 3 択をユーザーに提示し、選択がない限り contexts-only に倒す）。③ **`false` 値の保持義務**（`lock_branch=false` 等 explicit な false を omit すると `null` 化や true 化される実装ブレを誘発するため、payload に明示再送する）。
- **将来アクション**: 同パターンを再利用するため、`references/governance-payload-preservation.md`（仮称）の新規 reference を起票候補としてフォローアップ unassigned task 化する。`branch-protection.md` の Issue #554 runbook 第 3 項に既に「merging while preserving current values for all other branch protection fields」を明記済みだが、再利用 pattern としての横断 reference 化はまだ。

### L-554-002: NON_VISUAL × external mutation × user gate は **Phase 11 を read-only before snapshot で先行充足、after は Phase 13 user 承認後** に分けて記録する

- **背景**: Issue #554 は `NON_VISUAL` かつ external GitHub setting を mutate するため、Phase 11 evidence の取り扱いが Issue #516（fixture-only）とさらに違う。runtime PUT を Phase 11 で実行してしまうとユーザー承認なしの destructive op になるが、Phase 11 を空にすると Phase 12 strict 検証が evidence 不足で fail 判定される。最終的に `outputs/phase-11/before-{dev,main}-protection.json` と `diff-summary.md` を read-only evidence として先行確保し、`after-{dev,main}-protection.json` は `runtime_pending_user_approval` の reserved path として Phase 13 で確定する設計に倒した（`workflow_state = CONTRACT_READY_IMPLEMENTATION_PENDING`）。
- **教訓**: 「外部設定を mutate する NON_VISUAL タスク」では Phase 11 を **read-only before snapshot 専用**、Phase 13 を **user-gated mutation + after snapshot 確定** に分割する。Phase 12 strict 検証は「before evidence + reserved after path + workflow_state=CONTRACT_READY_IMPLEMENTATION_PENDING」のセットを充足条件として認める。runtime mutation evidence と documentation evidence を同 phase に詰め込まない。
- **将来アクション**: `task-specification-creator` の `phase-11-non-visual-alternative-evidence.md` に「external mutation × user gate の before/after split template」を追記候補。Issue #516 の 2x2 表 template と並べて記載する。

### L-554-003: current canonical workflow root の削除や mis-path は **復元 or stale-current 再分類** のいずれかで即修復し、indexes 反映前に確定する

- **背景**: Issue #554 ワークフロー進行中、related canonical workflow root（具体的には Issue #516 親パスの参照先）が `docs/30-workflows/issue-516-...` と `docs/30-workflows/completed-tasks/issue-516-...` の 2 候補で混在していた。さらに inventory 整理の途中で current canonical 配下のファイルを誤って削除しかける場面があり、`resource-map.md` の current canonical row と実ファイルが食い違う drift が発生しかけた。最終的に Issue #516 親を `completed-tasks/` 配下に正規化し、Issue #554 配下からは Issue #516 への参照をすべてその正規パスに統一した。
- **教訓**: workflow root を扱うときは `resource-map.md` の current canonical row と実ファイルパスの整合を **常に同 wave で確定** する。current canonical が削除された/見つからない場合は、(a) 復元、または (b) stale-current として明示的に再分類のどちらかを選ぶ。indexes 更新を先行させて実体不在のまま放置しない。
- **将来アクション**: `aiworkflow-requirements` の skill 監査で「resource-map current canonical row vs 実在ファイル」一致 gate を script 化（`scripts/validate-canonical-set.sh` 候補）するのが望ましい。今 wave では unassigned-task として記録対象。

### L-554-004: parent task path normalization は **unassigned-task と inventory と changelog の 3 箇所を同一 wave で更新** する

- **背景**: Issue #554 は Issue #516 の deferred follow-up（FU-02）として正式化された。Issue #516 の workflow root が `completed-tasks/` 配下に移った時点で、(a) Issue #554 の unassigned-task ファイルの parent_workflow_root 表記、(b) Issue #554 の artifact inventory の Upstream/Parent 行、(c) Issue #516 inventory の Downstream 行、(d) Issue #554 changelog の関連参照、の 4 箇所が同時更新されなければ正本が割れる。今 wave では (a)(b)(c) は更新済みだが、(d) changelog では「Issue #516 parent references normalized to `completed-tasks/...`」と記述したのみで、Issue #516 inventory の Downstream 行更新は触れず、後追い監査で検出した。
- **教訓**: parent–child workflow の path normalization は **unassigned-task / 子 inventory / 親 inventory / changelog の 4 点同期**を default checklist にする。3 点で止めると親側の inventory が drift し、Issue chain を辿った将来の workflow が古い path を継承する。
- **将来アクション**: `task-specification-creator` の Phase 12 documentation guide に「parent–child path normalization の 4 点同期 checklist」を追記候補。`audit-correlation.md` 等の SSOT reference からも parent–child link は双方向で書く運用に統一する。

## メタ

- workflow root: `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`
- source unassigned: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02-branch-protection-required-check.md`（formalized_by_issue_554）
- parent: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- Phase-12 verdict: CONTRACT_READY_IMPLEMENTATION_PENDING（strict 7 outputs all PASS、runtime PUT は Phase 13 user gate）
- 同一 wave 同期完了日: 2026-05-08
- deferred follow-ups: governance-payload-preservation reference 化、resource-map canonical 整合 gate script 化、Phase 11 external-mutation split template、Phase 12 parent–child path normalization checklist
