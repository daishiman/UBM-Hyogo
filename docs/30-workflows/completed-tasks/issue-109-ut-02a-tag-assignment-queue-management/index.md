# issue-109-ut-02a-tag-assignment-queue-management — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-tag-assignment-queue-management |
| ディレクトリ | docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management |
| Wave | 2-plus |
| 実行種別 | serial |
| 作成日 | 2026-05-01 |
| 担当 | app-admin-ops |
| 状態 | implemented-local |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 関連 GitHub Issue | #109（CLOSED） |
| タスクID | task-imp-02a-tag-assignment-queue-management-001 |

## 目的

`tag_assignment_queue` の **書き込み側 repository / workflow** を確立し、Forms 同期から発生する tag 割当 candidate を queue に投入できる経路を作る。
これは 02a `apps/api/src/repositories/memberTags.ts` が **read-only に固定**されているため、tag 反映経路が現状成立していない構造的欠落を埋めるためのタスクである。

本タスクが完成して初めて、07a の resolve workflow が「実在する queue 行を取り出して `member_tags` に反映する」ことができるようになる。
言い換えれば本タスクは 07a の前提条件であり、`Forms → tag_assignment_queue → (07a resolve) → member_tags` のパイプラインのうち **左半分**を担当する。

## スコープ

### 含む

- `apps/api/src/repositories/tagAssignmentQueue.ts`（CRUD + 状態遷移 + idempotency）
- `tag_assignment_queue` の状態モデル（仕様語: `candidate / confirmed / rejected`、実装語: `queued / resolved / rejected`）
- idempotency key（同一 `(memberId, responseId)` の重複投入をブロック。現行 candidate row は `suggested_tags_json='[]'` で admin が後から確定するため、`tagCode` はまだ決まっていない）
- retry / DLQ：投入失敗時の再投入と最終失敗の隔離
- enqueue workflow（03b の forms sync hook から呼ばれる関数 export）
- 02a `memberTags.ts` の **read-only 制約を破らない**ことの型レベル検証 test
- マイグレーション（必要に応じて `tag_assignment_queue` の DDL 整備、idempotency key 用 unique index）

### 含まない

- 07a の resolve workflow 本体（本タスク完了後に 07a 側で消費される）
- `member_tags` への直接 INSERT 経路（不変条件 #13 により禁止）
- tag_definitions の seed（01a 担当）
- 自己申告タグ UI（不変条件 #13 により採用されない）
- schema_diff_queue（07b の責務）
- attendance queue（07c の責務）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a member-identity-status-and-response-repository | `memberTags.ts` の read-only 制約（破らないことを担保） |
| 上流 | 02b meeting-tag-queue-and-schema-diff-repository | `tag_assignment_queue` 既存 column / index の確認元 |
| 上流 | 03a forms-schema-sync-and-stablekey-alias-queue | candidate 投入元の Forms 同期 hook |
| 下流 | 07a tag-assignment-queue-resolve-workflow | 本タスクで作る queue を消費する resolve 側 |
| 下流 | 08a api-contract-repository-and-authorization-tests | repository の contract test |

## 受入条件 (AC)

- AC-1: `tag_assignment_queue` に対する CRUD 相当（insert / select by id / list pending / update status / DLQ list）が repository から提供される。履歴保持のため soft delete は採用せず、terminal status で管理する。
- AC-2: 状態遷移は `candidate → confirmed | rejected` の単方向のみ。逆遷移（resolved → queued、rejected → queued、resolved ↔ rejected）は呼び出すと失敗（戻り値で明示）する。
- AC-3: idempotency key（`memberId + responseId`。現行 candidate は tagCode 未確定）が同値の重複 enqueue は **新規 row を作らず**、既存 row の id を返す。
- AC-4: insert 失敗時の retry が指数バックオフで N 回まで再試行され、最終失敗は DLQ 用カラム / table に隔離される（pending と区別可能な状態）。
- AC-5: 02a `apps/api/src/repositories/memberTags.ts` は **本タスク完了後も read-only**（write 関数を export しない・型レベルで `never` または読み取り型のみ）であることが test で固定される。
- AC-6: D1 への直接アクセスは `apps/api` 内に閉じる（不変条件 #5）。`apps/web` から本 repository を import しないことを dependency 検査で担保する。
- AC-7: enqueue / status 遷移はすべて `audit_log` か同等の追跡経路に観測点を残す（07a の audit と整合する key 命名）。
- AC-8: 仕様語 `candidate / confirmed / rejected` と実装語 `queued / resolved / rejected` の対応表がドキュメントに固定され、route / repository / migration の grep が一致する。
- AC-9: マイグレーション SQL（`apps/api/migrations/*.sql`）と repository の column / type が **完全一致**（grep 照合表で証跡）。
- AC-10: 03b 側の Forms sync 完了 hook から `enqueueTagCandidate(env, { memberId, responseId, tagCode })` を 1 行で呼べる public API が export される。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md, outputs/phase-02/state-machine.md, outputs/phase-02/spec-extraction-map.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | 受入条件 trace | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 / リファクタ | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビューゲート | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | NON_VISUAL evidence | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR 作成（user 承認ゲート） | phase-13.md | pending | outputs/phase-13/main.md |

> 本ワークフローは local implementation / NON_VISUAL evidence まで完了済み。Phase 13 の commit / push / PR 作成だけはユーザー承認待ちである。

## Phase 12 成果物

`outputs/phase-12/` 配下へ 7 ファイル（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）を作成済み。root / outputs `artifacts.json` は Phase 1〜12 completed、Phase 13 pending_user_approval で同期済み。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-01.md | 要件定義（AC・状態遷移・visualEvidence 確定） |
| ドキュメント | phase-02.md | repository / state machine / idempotency / retry / DLQ 設計 |
| ドキュメント | phase-03.md | alternative 評価と PASS/MINOR/MAJOR 判定 |
| メタ | artifacts.json | 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers (Hono) | apps/api の repository 実行環境 | 100k req/日 |
| Cloudflare D1 | tag_assignment_queue 永続化 | 5GB / 500k reads / 100k writes |

## Secrets 一覧（このタスクで導入）

なし。D1 binding は既存定義を流用する。

## 触れる不変条件

- #5: D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から本 repository を import 禁止）。
- #13: `member_tags` への書込みは 07a queue resolve 経由のみ。本タスクは queue 側のみ扱い、`member_tags` には直接 INSERT しない。
- 02a `memberTags.ts` の read-only 制約（型レベルで write を禁止する test を pass させ続ける）。

## 完了判定

- Phase 1〜12 の status が artifacts.json と一致（completed）。
- Phase 13 は artifacts.json で `pending_user_approval` として登録され、commit / push / PR 作成は未実行である。
- AC 10 件すべてが Phase 1 / 2 のいずれかにトレースされている。
- 仕様語↔実装語対応表が phase-02 に固定済み。
- マイグレーション × repository の grep 照合表が phase-02 に存在。
- 02a `memberTags.ts` の read-only 担保案が phase-02 / phase-03 に明記。

## 関連リンク

- 上流: ../completed-tasks/02a-parallel-member-identity-status-and-response-repository/
- 上流: ../completed-tasks/02b-parallel-meeting-tag-queue-and-schema-diff-repository/
- 下流: ../completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/
- 発見元: ../completed-tasks/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md (#3)
- formal stub: ../unassigned-task/UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT.md
