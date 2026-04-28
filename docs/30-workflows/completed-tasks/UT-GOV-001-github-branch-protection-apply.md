# GitHub branch protection 実適用 (dev / main) - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| タスクID     | UT-GOV-001                                                                                                      |
| タスク名     | branch protection JSON 草案の GitHub repository settings 実適用 (dev / main)                                    |
| 分類         | 実装 / GitHub governance                                                                                        |
| 対象機能     | GitHub repository branch protection (dev / main)                                                                |
| 優先度       | 高 (Phase 13 承認後の最優先実装ブロッカー)                                                                      |
| 見積もり規模 | 中規模                                                                                                          |
| ステータス   | 未実施 (proposed)                                                                                               |
| 親タスク     | task-github-governance-branch-protection                                                                        |
| 発見元       | `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md` U-1 |
| 発見日       | 2026-04-28                                                                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-github-governance-branch-protection` Phase 2 / Phase 12 にて、dev / main 双方の branch protection JSON 草案（`required_status_checks` / `enforce_admins` / `required_pull_request_reviews=null`（solo 運用のためレビュアー必須化なし） / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes=false` / `allow_deletions=false`）を策定済み。CLAUDE.md ブランチ戦略（`feature/* → dev → main` / solo 開発のため dev・main ともレビュアー不要）に整合する草案だが、現時点では GitHub repository settings に未適用で、運用上は無防備な状態となっている（solo 運用では CI gate が唯一の防波堤となるため、必須 status checks / linear history / conversation resolution / force-push 禁止 / 削除禁止は維持する）。

### 1.2 問題点・課題

- 草案 (JSON) は出力済みだが GitHub 側の真の状態は未強制で、main / dev に直 push 可能な状態のまま運用されている
- `required_status_checks.contexts` の実 job 名は UT-GOV-004 で同期するため、未同期のまま投入すると merge 不能事故を誘発する
- 適用前の現行 protection を保全しないと、誤適用時の rollback 経路が無い
- `enforce_admins=true` を盲目的に投入すると admin 自身も即時 block されるため、rollback 担当・経路を事前確定しないと運用詰みのリスクがある

### 1.3 放置した場合の影響

- governance 草案が「設計だけ存在し強制されない」状態が継続し、CLAUDE.md のブランチ戦略が事実上強制されない
- 並行 PR / 直 push / force push / branch 削除のリスクが残り、production 事故・履歴破壊の経路が塞がれない
- Phase 13 承認の意義が失われ、後続 UT-GOV-002〜007 が前提とする「protected な dev / main」が成立しない

---

## 2. 何を達成するか（What）

### 2.1 目的

Phase 13 承認後に、設計済み branch protection JSON 草案を GitHub REST API 経由で dev / main へ実適用し、rollback 経路を確立した上で「強制されている governance」状態へ移行する。

### 2.2 想定 AC

1. 適用前の dev / main の現行 protection 設定が `gh api` で取得され、`outputs/phase-13/branch-protection-snapshot-{dev,main}.json` として保全されている
2. 草案 JSON が GitHub REST API の PUT schema（`PUT /repos/{owner}/{repo}/branches/{branch}/protection`）に正規化された adapter 出力として保存されている
3. `required_status_checks.contexts` には UT-GOV-004 で実在 job 名同期済みのものだけが含まれる（未出現 context は含めない）
4. dry-run（差分プレビュー）で intended diff がレビュー承認されている
5. dev / main それぞれに PUT が成功し、応答 JSON が `outputs/phase-13/branch-protection-applied-{dev,main}.json` として保存されている
6. rollback リハーサルとして snapshot から PUT を 1 回戻し、再度本適用 PUT を行う double-apply が完了している
7. `enforce_admins=true` 適用時の rollback 担当者・経路が記録されている
8. CLAUDE.md ブランチ戦略（solo 運用のため dev / main ともレビュアー不要、`required_pull_request_reviews=null`）が GitHub 側の実値と一致している

### 2.3 スコープ

#### 含むもの

- dev / main の branch protection 草案を REST API PUT schema へ正規化する adapter 実装
- 適用前 snapshot 取得 / rollback payload 別ファイル保存
- dry-run（差分プレビュー） → 実適用 → rollback リハーサル → 再適用の手順実行
- `gh api` か Terraform かの適用手段選定とその記録
- 適用結果の 1 次検証（`gh api` GET で実値確認）

#### 含まないもの

- `required_status_checks.contexts` の job 名同期（UT-GOV-004 に分離）
- PR target safety gate dry-run（UT-GOV-002 に分離）
- CODEOWNERS ファイルの内容定義（UT-GOV-003 に分離）
- GitHub Actions の action pin 方針（UT-GOV-007 に分離）
- 自動 commit / push / PR の発行（実行者承認後に別途実施）

### 2.4 成果物

- `outputs/phase-13/branch-protection-payload-{dev,main}.json`（PUT 用正規化 payload）
- `outputs/phase-13/branch-protection-snapshot-{dev,main}.json`（適用前 snapshot）
- `outputs/phase-13/branch-protection-rollback-{dev,main}.json`（rollback 用 payload。snapshot を PUT schema に変換したもの）
- `outputs/phase-13/branch-protection-applied-{dev,main}.json`（適用後 GET 応答）
- `outputs/phase-13/apply-runbook.md`（dry-run → apply → rollback リハーサル手順 / 担当者）

---

## 3. 影響範囲

- GitHub repository settings (dev / main の protection rules)
- 実行中 / 今後発生する全 PR の merge 可否（contexts 設定誤りは即 merge 不能を招く）
- admin 操作（`enforce_admins=true` で admin も block される）
- UT-GOV-002 (PR target safety gate dry-run) の前提条件
- UT-GOV-004 (required_status_checks 実在 job 名同期) との順序依存

---

## 4. 依存・関連タスク

- 前提: Phase 13 承認の完了
- 前提: UT-GOV-004（`required_status_checks.contexts` の実在 job 名同期）が先行 or 同時完了していること
- 関連: UT-GOV-002 (PR target safety gate dry-run) — 適用後の挙動検証
- 関連: UT-GOV-003 (CODEOWNERS governance paths) — solo 運用のため必須レビュアー化はしないが、ownership 文書化として整備
- 関連: UT-GOV-007 (GitHub Actions action pin policy) — required_status_checks に紐づく workflow の信頼性

---

## 5. 推奨タスクタイプ

implementation

---

## 6. 参照情報

- 草案: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-2/design.md` §2
- 実装ガイド: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md` §1, §2
- 検出ログ: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md` 現行 U-1
- CLAUDE.md ブランチ戦略セクション（solo 運用のため dev / main ともレビュアー不要）
- GitHub REST API: `PUT /repos/{owner}/{repo}/branches/{branch}/protection`
- 連携タスク: UT-GOV-004 / UT-GOV-002 / UT-GOV-003 / UT-GOV-007

---

## 7. 備考

- 適用順序は **ユーザー承認 → dry-run → 実適用 → rollback リハーサル → 再適用** を厳守。
- 適用手段（`gh api` 直叩き vs Terraform）は本タスク冒頭で選定し、`apply-runbook.md` に記録する。MVP 段階では `gh api` 直叩き＋ payload を Git 管理する方式で十分。Terraform は将来の IaC 化フェーズで再評価。
- commit / push / PR は実行者承認後に別タスクとして発行する（本タスクでは禁止）。

---

## 8. 苦戦箇所・落とし穴（実体験ベース）

将来同種タスクを最短で解くため、実際に判断・調査に時間を要した点を記録する。

### 8.1 GET 応答と PUT payload の field 名差異

- 罠: `gh api repos/:owner/:repo/branches/:branch/protection` で取得した GET 応答は、各 sub-resource を `enabled` / `users` / `teams` / `apps` のネスト構造で返すが、PUT は `restrictions: { users: [], teams: [], apps: [] }` のような flatten された配列や、`required_pull_request_reviews.dismissal_restrictions` のような独自構造を要求する。GET 結果をそのまま PUT に流すと 422 になる。
- 解決指針: GET → PUT の field 変換 adapter を最初から「正規化レイヤ」として作り、snapshot 保存と rollback payload 生成を別ファイルで持つ。snapshot は監査用、rollback は PUT 用、と用途を分離する。
- 確認 field（最低限）: `required_status_checks.{strict,contexts}` / `enforce_admins(.enabled→bool)` / `required_pull_request_reviews=null`（solo 運用のため `required_approving_review_count` / `require_code_owner_reviews` / `require_last_push_approval` / `dismissal_restrictions` は列挙しない） / `restrictions(.users/.teams/.apps→names 配列)` / `required_linear_history` / `allow_force_pushes` / `allow_deletions` / `required_conversation_resolution` / `lock_branch` / `allow_fork_syncing`。

### 8.2 `required_status_checks.contexts` 未出現値投入による merge 不能事故

- 罠: contexts に「将来追加予定」の job 名や typo の job 名を入れると、その context は永遠に green にならず以後 PR が一切 merge 不能になる。緊急 hotfix も止まる。
- 解決指針: contexts は UT-GOV-004 で「直近 N 日の Actions run から実在 job 名を抽出」した結果の積集合のみを採用する。UT-GOV-004 完了前に本タスクを進める場合は contexts を空配列にして PUT し、後続で UT-GOV-004 の結果を反映する 2 段階適用にする。

### 8.3 `lock_branch=true` の運用条件未定義

- 罠: `lock_branch=true` は「全 push を完全停止」する強力な flag。緊急時の解除手順 / 解除権限者 / 解除トリガを定義せずに有効化すると、production incident 時に対応経路が無く詰む。
- 解決指針: 本タスクでは `lock_branch=false` を明示し、有効化が必要な場合は別タスクで「freeze runbook（誰が・どの条件で・どう解除するか）」とセットで導入する。

### 8.4 `enforce_admins=true` での admin 自身 block

- 罠: `enforce_admins=true` は admin も保護ルールに従わせる正しい設定だが、solo 運用では approver が自分自身しかいないため、CI 失敗時に main へ hotfix できない状態が発生し得る。
- 解決指針: 適用前に CI 失敗時の rollback 経路（`enforce_admins` のみ一時 false に戻す `gh api` 手順）を `apply-runbook.md` に明記する。rollback 用 payload を事前生成しておく。

### 8.5 dev / main の差分管理ミス

- 罠: solo 運用では dev / main の差分は CI 段階の厳密度（例: `strict: true` の有無）程度に縮退するが、payload を 1 つに丸めると片側適用ミスが起きやすい。
- 解決指針: payload / snapshot / rollback / applied のすべてのファイルを `{branch}` サフィックスで分離し、適用も branch ごとに 1 回ずつ独立した PUT として実行する（bulk 化しない）。

### 8.6 CLAUDE.md 表記との二重正本リスク

- 罠: CLAUDE.md（solo 運用 / レビュアー不要）と GitHub 設定値が drift すると、どちらが正本か不明になる。
- 解決指針: 「正本は GitHub 側の実値」「CLAUDE.md はその参照」と明記する運用とし、本タスク完了後に実値とドキュメントの一致を grep で確認する手順を runbook に含める。
