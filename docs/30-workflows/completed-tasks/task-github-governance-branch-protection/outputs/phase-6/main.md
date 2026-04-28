# Phase 6 — 失敗ケース集（サマリ）

## Status
done

> 本 Phase は Phase 5 ランブックを実適用した際に発生しうる **典型障害** を網羅し、
> 各ケースに detection（検知）/ recovery（復旧）/ preventive control（再発防止）を割り当てる。
> 詳細は `failure-cases.md`。

---

## 1. ケース一覧（id / 重大度 / 影響）

| ID | 重大度 | ケース名 | 主な影響 |
| --- | :-: | --- | --- |
| FC-ADMIN-BYPASS | High | 管理者バイパス誤許可（`enforce_admins=false` 誤設定） | 2 名レビューがすり抜け |
| FC-CTX-DRIFT | High | required_status_checks の名称ドリフト | PR が永遠に green にならず詰まる |
| FC-FORK-SECRETS | Critical | fork PR で `pull_request_target` から secrets 露出 | 機密漏えい / supply chain |
| FC-REBASE-CONFLICT | Medium | auto-rebase が conflict で停止し放置 | base 乖離・stale PR |
| FC-LOCK-MISFIRE | High | `lock_branch=true` 解除忘れ・誤適用 | リリース停止 |
| FC-SQUASH-BYPASS | High | squash-only 違反のすり抜け | 履歴非線形 / バンドル肥大 |
| FC-MAIN-LOCK | High | main protection を先に適用してセルフロック | 自分の PR が通せない |
| FC-CTX-RENAME | Medium | CI ジョブ名の rename で旧 contexts に固定 | 全 PR ブロック |
| FC-LAST-PUSH-DRIFT | Medium | `require_last_push_approval` 設定漏れ | 最新コミット未確認のままマージ |

---

## 2. 横断タスクとの責務境界（再確認）

| 横断タスク | 本 Phase が扱う失敗 | 当該タスクへ委譲する失敗 |
| --- | --- | --- |
| task-conflict-prevention-skill-state-redesign | FC-REBASE-CONFLICT の **検知/停止条件** のみ | conflict の解消手順 / 通知経路 |
| task-git-hooks-lefthook-and-post-merge | FC-CTX-DRIFT / FC-CTX-RENAME のジョブ名整合 | hook 側のリトライ実装 |
| task-claude-code-permissions-decisive-mode | （干渉なし） | Claude Code 側の権限制御 |
| task-worktree-environment-isolation | （干渉なし） | worktree の env 隔離 |

---

## 3. 検知レイヤの整理

| レイヤ | 何を検知 | 代表ケース |
| --- | --- | --- |
| L1 静的（ローカル） | YAML/JSON schema の欠落 | FC-FORK-SECRETS / FC-SQUASH-BYPASS |
| L2 適用後 API 取得 | 設定差分 | FC-ADMIN-BYPASS / FC-LAST-PUSH-DRIFT / FC-LOCK-MISFIRE |
| L3 PR 上の振る舞い | green にならない / マージできない | FC-CTX-DRIFT / FC-CTX-RENAME / FC-MAIN-LOCK |
| L4 履歴・監査 | 非線形 commit / unknown actor | FC-SQUASH-BYPASS（事後） |

---

## 4. preventive control の主軸

- **二層強制**（repo setting + branch protection）→ FC-SQUASH-BYPASS
- **適用順の鉄則**（main を最後）→ FC-MAIN-LOCK
- **status check 名の単一定義源**（Phase 2 §1）→ FC-CTX-DRIFT / FC-CTX-RENAME
- **workflow `permissions: {}` 既定 + job 単位昇格**（Phase 2 §6）→ FC-FORK-SECRETS
- **`enforce_admins=true` を CI で再検査**（Phase 4 M-04）→ FC-ADMIN-BYPASS
- **rollback snapshot を毎回取得**（Phase 5 §1）→ FC-LOCK-MISFIRE

---

## 5. Phase 1 受入条件との関連

- AC-1〜AC-4 の各設定欠陥は Phase 6 各 FC に直接対応する。FC-* の preventive control が AC を運用面から補強する。
- AC-5 横断境界は §2 で再確認済み。
- AC-6 Phase 13 ゲートはすべての recovery において維持される（権限変更を含む rollback 適用時もユーザー承認を経る）。

---

## 6. 完了判定

- `failure-cases.md` に 9 ケースが id / detection / recovery / preventive control の 4 項目で記述されること。
- 各ケースに参照すべき Phase 4 検証 ID または Phase 5 手順番号が明示されること。
