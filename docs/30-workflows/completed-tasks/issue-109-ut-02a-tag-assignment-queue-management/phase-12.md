# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Issue | #109 [UT-02A] tag_assignment_queue 管理 Repository / Workflow |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL evidence 整理) |
| 次 Phase | 13 (PR 作成 / user 承認ゲート) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created (root は据え置き、phases[].status のみ更新) |
| 状態 | completed |

## 目的

`tag_assignment_queue` の Repository / Workflow 実装に伴うドキュメント更新を完了し、
Phase 12 必須 5 タスク + Task 6 (skill feedback) + Task 7 (compliance check) の計 7 成果物を生成する。
02a の `memberTags.ts` は read-only を維持しつつ、queue 側の CRUD / 状態遷移 / idempotency / retry/DLQ
の挙動を spec / changelog / unassigned-task-detection に反映する。

現時点では Phase 12 は未実行であり、このファイルは実行手順を定義する仕様書である。`outputs/phase-12/` の実体、validator 実測値、same-wave sync 証跡が揃うまで PASS / OK / parity 完了を宣言しない。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル (5 要素チェックリスト)

- [ ] 「キュー (queue)」を日常生活の例えで説明する（例: 給食の配膳列・銀行の整理券）
- [ ] 「べき等性 (idempotency)」を、同じボタンを 2 回押しても 1 個しか注文されない仕組みとして説明する
- [ ] 「リトライ / DLQ (Dead Letter Queue)」を、配達できなかった荷物を「保留棚」に移す例で説明する
- [ ] なぜ管理者承認 (admin queue) が必要かを「先生の確認後に名簿に書く」例えで説明する
- [ ] 困りごと（自己申告タグの濫用・処理中断時の重複付与）と解決後の状態を最初に示す

### Part 2: 開発者・技術者レベル

- [ ] `tag_assignment_queue` テーブルの DDL / index 設計を記載
- [ ] `TagQueueRepository` の interface (TypeScript) と Drizzle / D1 binding 経路を明記
- [ ] state machine: `queued → resolved | rejected | dlq` の遷移条件を表形式で
- [x] idempotency key (`memberId + responseId`) の設計と UNIQUE 制約
- [ ] retry policy (exponential backoff, max 3 回) と DLQ 移送条件、緊急停止 flag (`TAG_QUEUE_PAUSED`)
- [ ] zod schema, error mapping (4xx/5xx), audit_log payload
- [ ] 検証コマンド (`pnpm -F apps/api typecheck / test / build`)

## 実行タスク

| Task | 成果物パス | 内容 |
| --- | --- | --- |
| 12-1 | outputs/phase-12/main.md | Phase 12 本体サマリー |
| 12-2 | outputs/phase-12/implementation-guide.md | Part 1 中学生レベル + Part 2 技術者レベル詳細 |
| 12-3 | outputs/phase-12/system-spec-update-summary.md | specs/ 系の更新サマリー (Step 1-A/B/C/D) |
| 12-4 | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| 12-5 | outputs/phase-12/unassigned-task-detection.md | 未割当検出（0 件でも出力必須） |
| 12-6 | outputs/phase-12/skill-feedback-report.md | skill 改善 feedback（無くても出力必須） |
| 12-7 | outputs/phase-12/phase12-task-spec-compliance-check.md | root vs outputs artifacts.json parity 確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | tag_assignment_queue DDL 章 |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | 管理者レビュー workflow |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | resolve endpoint 仕様 |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/ | 上流 workflow 設計 |
| 必須 | outputs/phase-01〜11/ | 全成果物（Phase 12 実行時の起点。未生成の場合は Phase 12 を実行しない） |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase12*.md | テンプレ |

## 実行手順

### Step 1-A: `08-free-database.md` の `tag_assignment_queue` 章更新

- columns: `id / response_id / member_id / tag_slug / status / attempt_count / last_error / idempotency_key / created_at / updated_at / processed_at`
- index: `(status, created_at)` / UNIQUE `(idempotency_key)`
- 無料枠 D1 write 試算: 月間 ~600 writes 以下を維持

### Step 1-B: `11-admin-management.md` / `12-search-tags.md` への参照追記

- 管理者操作経路から本タスクの Repository への矢印を追加
- 12-search-tags.md の resolve workflow が本タスクの queue を起点とする旨を明記

### Step 1-C: changelog 反映

- 02a memberTags.ts は read-only 維持 / queue 側で書き込み一元化を明記

### Step 1-D: integration matrix 更新

- 上流: 07a (resolve workflow), 03b (sync hook)
- 下流: 08a / 08b (検索 / 公開タグ表示)

### Step 2: stale contract withdrawal

- 02a Phase 12 `unassigned-task-detection.md` の本タスクへの参照を「formalize 済」へ更新
- 旧記載のうち「memberTags 直接書き込み案」は不採用として stale 化

### Step 3: workflow_state ハンドリング

- spec_created / NON_VISUAL では root の `workflow_state` を据え置く
- Phase 12 実行完了時のみ `phases[].status` を `completed` にし、Phase 13 は `pending_user_approval` のまま維持する

## Part 1 中学生レベル概念説明 (例え話)

`tag_assignment_queue` は「学級委員が候補者を整理券順に並べる箱」。
- 整理券（idempotency key）があるので同じ人を 2 回並ばせない
- 先生（管理者）が呼び出して、認める / 却下を決める
- 呼び出し中に停電（処理中断）しても、整理券があるからやり直しても重複しない
- 3 回呼び出しても返事がない人は「保留棚 (DLQ)」に移す
- 緊急時は受付窓口を一時停止 (`TAG_QUEUE_PAUSED` flag) できる

## Part 2 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| binding | `apps/api` 内の D1 binding のみ（不変条件 #5）|
| repository | `TagQueueRepository` (enqueue / listPending / transition / incrementRetry / moveToDlq) |
| workflow | `enqueueTagCandidate(env, payload)` + 07a resolve workflow |
| idempotency | `(member_id, response_id, tag_code)` を SHA-256 → `idempotency_key` UNIQUE |
| retry | exponential backoff (1s / 4s / 16s)、max 3、超過時 DLQ |
| state machine | `queued → {resolved, rejected, dlq}` 単方向 |
| circuit breaker | env `TAG_QUEUE_PAUSED=true` で enqueue を 503 へ短絡 |
| audit | `admin.tag.queue_{enqueued, resolved, rejected, dlq_moved}` |

## system spec 更新概要

- specs/08-free-database.md: queue table DDL 追記、index / UNIQUE 制約明記
- specs/11-admin-management.md: 管理者レビュー導線に queue を追加
- specs/12-search-tags.md: resolve endpoint と queue の関係を表で明示
- 02a Phase 12 unassigned-task-detection.md: 本タスクへの参照を formalize 済に更新

## documentation-changelog

| 日付 | 変更 | 影響 |
| --- | --- | --- |
| 2026-05-01 | tag_assignment_queue Repository 設計確定 | apps/api |
| 2026-05-01 | idempotency_key UNIQUE 制約追加 | D1 schema |
| 2026-05-01 | retry/DLQ policy 確定 | workflow runtime |
| 2026-05-01 | TAG_QUEUE_PAUSED 緊急停止 flag 追加 | runtime / rollback |

## unassigned-task-detection

| 未割当項目 | 理由 | 登録先候補 |
| --- | --- | --- |
| memberTags 直接書き込み | 不変条件 #13 違反 | 採用しない |
| 自己申告タグ | spec 11 で不採用 | 採用しない |
| DLQ 自動再投入 | 安全側で manual のみ | 別 Issue 候補 |

## skill feedback

| skill | feedback |
| --- | --- |
| task-specification-creator | NON_VISUAL implementation の Phase 12 で workflow_state 据え置きパターンの reference を追加すると良い |
| aiworkflow-requirements | tag_assignment_queue の audit payload 標準形を topic-map に追加すると良い |

## phase12-task-spec-compliance-check (root vs outputs artifacts.json parity)

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | N/A | tag は schema 外 |
| #2 consent キー統一 | N/A | tag workflow と無関係 |
| #3 responseEmail = system | N/A | 関連なし |
| #4 本人本文編集禁止 | N/A | tag のみ |
| #5 D1 直接アクセス禁止 | ✅ | apps/api 内のみ |
| #6 GAS prototype 非昇格 | ✅ | spec のみ参照 |
| #7 responseId と memberId 混同 | ✅ | branded type |
| #13 tag は admin queue → resolve 経由のみ | ✅ | repository が enforce |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description / change-summary の根拠 |
| 後続 Issue | 08a / 08b に implementation-guide を引き継ぎ |

## 多角的チェック観点

| 観点 | 確認 | 結果 |
| --- | --- | --- |
| 不変条件 #5 / #13 | compliance check で ✅ | OK |
| spec sync | specs/08, 11, 12 と齟齬なし | OK |
| artifacts.json parity | Phase 12 実行時に root と outputs を照合 | pending |
| NON_VISUAL evidence | Phase 11 の実測ログを転記 | pending |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | Part 1+2 |
| 2 | system-spec-update | 12 | pending | Step 1-A/B/C/D |
| 3 | changelog | 12 | pending | 履歴 |
| 4 | unassigned | 12 | pending | 0 件でも必須 |
| 5 | skill feedback | 12 | pending | 無くても必須 |
| 6 | compliance check | 12 | pending | parity |
| 7 | main.md | 12 | pending | サマリー |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1+2 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 反映 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未処理 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | trace |
| メタ | artifacts.json | phases[12].status = completed (root state は据え置き) |

## 完了条件

- [ ] 7 成果物を作成
- [ ] compliance check を全項目評価
- [ ] specs/08, 11, 12 への spec sync 漏れなし
- [ ] artifacts.json で phases[12].status = completed
- [ ] root の `workflow_state` を spec_created のまま据え置き

## タスク100%実行確認

- 全 7 成果物が `outputs/phase-12/` 配下に存在
- artifacts.json で phase 12 が completed
- root vs outputs parity 表で diff 0

## 次 Phase

- 次: 13 (PR 作成 / user 承認ゲート)
- 引き継ぎ: 7 成果物を PR description / change-summary の根拠に
- ブロック条件: compliance check で ✅ 以外があれば差し戻し
