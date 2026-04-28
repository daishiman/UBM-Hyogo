# Phase 6 — 失敗ケース集（failure-cases）

## Status
done

> branch protection 適用と auto-rebase / pr_target safety gate ワークフロー運用時の典型障害を網羅する。
> 各ケースに **detection（検知）/ recovery（復旧）/ preventive control（再発防止）** を併記。

---

## FC-ADMIN-BYPASS — 管理者バイパス誤許可

| 項目 | 内容 |
| --- | --- |
| 概要 | `enforce_admins=false` で適用してしまい、Admin が 2 名レビューを迂回して main へ push 可能になる |
| 影響 | レビュー要件の事実上無効化。CLAUDE.md ブランチ戦略違反 |
| detection | `gh api …/branches/main/protection \| jq .enforce_admins.enabled` が `false`（Phase 4 M-04） |
| recovery | `gh api -X PATCH …/branches/main/protection -F enforce_admins=true`、過去 N 日の merge 監査ログを `gh api repos/:o/:r/commits?since=...` で確認 |
| preventive control | Phase 4 test-matrix M-04 を CONDITIONAL ではなく **必須**。Phase 5 §6 検証で毎回 enabled を出力させる |

---

## FC-CTX-DRIFT — required_status_checks の名称ドリフト

| 項目 | 内容 |
| --- | --- |
| 概要 | CI ジョブ名は `ci / typecheck (web)` だが、protection 側に `typecheck-web` 等と不一致を登録 |
| 影響 | PR が green にならず永遠に詰まる |
| detection | PR の checks タブに "Expected — Waiting for status to be reported" が常駐 |
| recovery | Phase 2 §1 の 8 contexts を **唯一の正本** とし、`gh api -X PUT …/protection` で再投入 |
| preventive control | Phase 2 §1 の表をリポ内 `docs/30-workflows/.../phase-2/design.md` から **コピペ運用**。lefthook 側ジョブ名と相互参照（横断タスクとの整合） |

---

## FC-FORK-SECRETS — fork PR からの secrets 露出（Critical）

| 項目 | 内容 |
| --- | --- |
| 概要 | `pull_request_target` で fork PR の HEAD を checkout し、そのコードを secrets を持つ環境で実行してしまう |
| 影響 | 機密値（CLOUDFLARE_API_TOKEN 相当）の漏えい / supply chain 汚染 |
| detection | `pull_request_target` workflow 内に `github.event.pull_request.head.sha` checkout、`pnpm install`、`pnpm build` 等の PR code 実行 step が存在する |
| recovery | 即時 workflow を `disabled` 化（`gh api -X PUT repos/:o/:r/actions/workflows/:id/disable`）→ 当該期間に発火した job のログを精査 → 漏えい疑義 secret を **即時 rotate**（Cloudflare / GitHub 双方） |
| preventive control | Phase 2 §6 の **workflow 分離**を死守。`pull_request_target` は triage のみ、untrusted build は `pull_request` workflow に限定する。fork PR を扱う限り `pull_request_target` 採用は最小限 |

---

## FC-REBASE-CONFLICT — auto-rebase の conflict 放置

| 項目 | 内容 |
| --- | --- |
| 概要 | auto-rebase ワークフローが conflict で `exit 1` 停止したまま PR が放置される |
| 影響 | base 乖離が拡大、stale PR 増加 |
| detection | workflow run の `failure` 件数が増加。GitHub Actions の "rebase conflict — bot は手を出さない" ログ |
| recovery | 人手で `git rebase origin/<base>` → conflict 解消 → `git push --force-with-lease`。本タスクでは復旧手順を持たず、横断 task-conflict-prevention-skill-state-redesign に委譲（Phase 3 MINOR-2） |
| preventive control | Phase 2 §5 の **bot 停止境界** を維持し、conflict 通知を当該横断タスクで実装 |

---

## FC-LOCK-MISFIRE — lock_branch 誤動作

| 項目 | 内容 |
| --- | --- |
| 概要 | `lock_branch=true` を緊急時に有効化したまま解除を忘れる、または平時に誤って true に切り替える |
| 影響 | 全 PR がマージ不可。リリース停止 |
| detection | `gh api …/branches/main/protection \| jq '.lock_branch.enabled'` が想定外に `true` |
| recovery | 承認者 2 名連名で `gh api -X PATCH …/branches/main/protection -F lock_branch=false`（Phase 5 §7） |
| preventive control | Phase 5 §7 の凍結条件・解除条件・承認者を runbook で固定。lock 切替は issue コメントで記録必須 |

---

## FC-SQUASH-BYPASS — squash-only 違反のすり抜け

| 項目 | 内容 |
| --- | --- |
| 概要 | repo setting で merge_commit / rebase_merge を再有効化されてしまう、または `required_linear_history=false` に書き換えられる |
| 影響 | 履歴の非線形化、squash 前提の rollback 手順が破綻 |
| detection | Phase 4 P-01..P-03 / M-05 / D-05 のいずれか FAIL。`git log --merges main` に merge commit が出現 |
| recovery | Phase 5 §3 と §6 を再適用、混入した merge commit 範囲を特定し、必要なら revert PR を起票 |
| preventive control | **二層強制**（repo setting + protection）。Phase 5 §3 / §4 / §6 の検証コマンドを定期 cron（別タスクで実装） |

---

## FC-MAIN-LOCK — main を先に厳格化してセルフロック

| 項目 | 内容 |
| --- | --- |
| 概要 | Phase 5 の適用順を逆転し、main protection を先に適用したため、後続の workflow 配置 PR が自分でマージできなくなる |
| 影響 | 適用作業の中断、Admin 権限での緊急 force-merge が必要になる（記録必須） |
| detection | 自身の PR が "Required reviews not met" / "Required status checks have not passed" で詰まる |
| recovery | Admin 権限で一時的に `enforce_admins=false` に PATCH → 必要 PR を merge → ただちに `enforce_admins=true` に戻す。**事後 issue で経緯を記録** |
| preventive control | Phase 5 §6 の **「main は最後」** ルールを runbook 冒頭に太字で記載済み。実行者は §3〜§5 完了の sign-off 後に §6 へ進む |

---

## FC-CTX-RENAME — CI ジョブ名の rename で旧 contexts に固定

| 項目 | 内容 |
| --- | --- |
| 概要 | apps/web のリファクタ等で `ci / typecheck (web)` を `ci / web/typecheck` に rename したが、protection 側を更新し忘れる |
| 影響 | 全 PR がブロック |
| detection | "Expected — Waiting for status to be reported" が rename 直後の PR から発生 |
| recovery | rename と同 PR で `branch-protection.*.json` も更新する PR ルールを徹底。緊急時は protection から旧 contexts を一時除去 |
| preventive control | CI ジョブ名と protection JSON を **同 PR で変更** することをレビュー観点に追加。横断 task-git-hooks-lefthook-and-post-merge とジョブ名規約を共有 |

---

## FC-LAST-PUSH-DRIFT — require_last_push_approval 設定漏れ

| 項目 | 内容 |
| --- | --- |
| 概要 | main に対して `require_last_push_approval=false` のまま運用してしまう |
| 影響 | 最新 push 後の差分が未レビューでマージされる |
| detection | `gh api …/branches/main/protection \| jq '.required_pull_request_reviews.require_last_push_approval'` が `false` |
| recovery | `gh api -X PATCH …` で `true` に戻す。直近マージ済み PR のうち、approve 後に push があったものを `gh pr list --state merged` で抽出し再レビュー |
| preventive control | Phase 4 検証マトリクスに本項目を追加（main 専用 D 系には含めない）。Phase 5 §6 の検証出力でキー名を明示確認 |

---

## 付録: ケース ↔ Phase 参照

| FC | 参照 Phase 4 ID | 参照 Phase 5 手順 |
| --- | --- | --- |
| FC-ADMIN-BYPASS | M-04 | §6 |
| FC-CTX-DRIFT | M-02, D-04 | §6 |
| FC-FORK-SECRETS | S-01..S-10 | §5 |
| FC-REBASE-CONFLICT | A-07 | §5（横断委譲） |
| FC-LOCK-MISFIRE | （L2 取得） | §7 |
| FC-SQUASH-BYPASS | P-01..P-03, M-05 | §3, §4, §6 |
| FC-MAIN-LOCK | （手順） | §6 冒頭注記 |
| FC-CTX-RENAME | M-02 | §5, §6 |
| FC-LAST-PUSH-DRIFT | （新規） | §6 |
