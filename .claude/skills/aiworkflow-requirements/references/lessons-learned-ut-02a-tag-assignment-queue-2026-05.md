# Lessons Learned — UT-02A Tag Assignment Queue Management (2026-05-01)

出典:
- `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/outputs/phase-12/unassigned-task-detection.md`

---

## 概要

UT-02A は `tag_assignment_queue` の **書き込み側（enqueue）パイプライン左半分** を担当する NON_VISUAL implementation タスク。期間は 2026-05-01（Phase 1-12 completed、Phase 13 user approval pending）。
本タスクで実装した範囲:

- migration `0009_tag_queue_idempotency_retry.sql`（5 列追加 + partial unique index + pending/dlq 補助 index）
- repository `apps/api/src/repository/tagQueue.ts` の status enum 拡張（`dlq` 追加）と関数追加（`findByIdempotencyKey` / `createIdempotent` / `listPending` / `listDlq` / `incrementRetry` / `moveToDlq` / `deriveIdempotencyKey`）
- 既存 workflow `tagCandidateEnqueue.ts` は AC-10 を既に満たすため不変
- 既存 workflow `tagQueueResolve.ts`（07a）の `transitionStatus` 拡張と互換維持
- type-level read-only test `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` を新規追加
- spec 08 / 11 / 12 を same-wave で更新（idempotency / retry / DLQ / `<memberId>:<responseId>` key 反映）

retry workflow / DLQ requeue API / `admin.tag.queue_dlq_moved` audit 等の **運用面** は本 wave では実装せず、formal な未割当タスクとして分離した（unassigned-task 5 件起票）。

---

## L-UT02A-001: 仕様書命名（複数形）と既存規約（単数形）の差分判断

- 症状: 上位 spec は `apps/api/src/repositories/tagAssignmentQueue.ts`（複数形 + 完全名）を想定していたが、既存 repository ディレクトリは `apps/api/src/repository/`（単数形）で、既に `tagQueue.ts` という短縮名 file が稼働していた。
- 対応: 既存規約（ディレクトリ名 `repository/` 単数形 / file 名 `tagQueue.ts` 短縮）を **優先採用** し、新規 file 作成 ではなく **既存 file の拡張**（status enum + 7 関数追加）で対応した。
- 再発防止: `task-specification-creator` の Phase 02 template に「既存 monorepo 規約優先」ルールを明示する feedback を 12 phase report に記録。skill 更新時の判定基準は「実装規約が既に確立している場合は spec の表記揺れを実装に合わせる（=spec 側を Phase 12 same-wave で再 align）」を採用する。

## L-UT02A-002: idempotency key 設計に `tagCode` を含めない判断

- 症状: 直感的には `<memberId>:<responseId>:<tagCode>` でユニーク化したくなるが、現行 candidate row は `suggested_tags_json='[]'` で投入し、admin が後から tagCodes を確定するため、enqueue 時点で `tagCode` が未確定。
- 対応: idempotency key を `<memberId>:<responseId>` で deterministic に生成（`deriveIdempotencyKey` 関数化）。同一 response からの二重 enqueue を防止しつつ、admin 側の tagCodes 確定タイミングを enqueue 後に分離した。
- 再発防止: idempotency key の構成要素は「**enqueue 時点で確定している identifier のみ**」とするルールを quick-reference §UT-02A 早見に明示。partial unique index（`WHERE idempotency_key IS NOT NULL`）で legacy 既存行（key NULL）との互換も担保した。

## L-UT02A-003: retry / DLQ 列追加で既存 row に既定値を確実に与える

- 症状: ALTER TABLE ADD COLUMN で `attempt_count` / `next_visible_at` / `dlq_at` を追加した際、既存 row への back-fill が漏れると `incrementRetry` の guarded UPDATE が想定外に noop 化するリスク。
- 対応: `attempt_count INTEGER NOT NULL DEFAULT 0` で SQLite の ADD COLUMN セマンティクスにより既存 row へも 0 を確定。`last_error` / `next_visible_at` / `dlq_at` は NULL 許容で運用、guarded UPDATE は `WHERE status='queued'` のみを条件に絞り、terminal 行（resolved/rejected/dlq）は常に noop となるよう設計した。
- 再発防止: state machine 表（quick-reference 早見）で `resolved` / `rejected` / `dlq` を terminal と明示し、以降の transition は手動 requeue API（未実装 / 起票済）経由のみに限定する。

## L-UT02A-004: type-level read-only test (`*.test-d.ts`) を導入してメンバータグ書き込み境界を恒久化

- 症状: `apps/api/src/repository/memberTags.ts` は read-only 規約だが、ランタイムテストでは「書き込み関数が export されていないこと」を直接保証できない。リファクタで write 関数が追加されると、規約違反が CI で検知できず流出するリスク。
- 対応: `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` で `expectTypeOf` を用いて write 系シンボル（`insertMemberTag` 等）が export 表面に **存在しないこと** を type-level に assert。`vitest --typecheck` 経路で評価される。
- 再発防止: skill-feedback-report に `int-test-skill` への要望として「`vitest --typecheck` 起動コマンドの README 化」を記録。今後 read-only 境界が必要な repository（`tag_definitions` 等）にも同パターンを横展開する。

## L-UT02A-005: 既存ファイル拡張 vs 新規ファイル作成の判断

- 症状: 7 関数追加 + status enum 拡張は新規責務ボリュームとしては中規模。`tagQueue.ts` を分割して `tagQueueIdempotency.ts` / `tagQueueRetry.ts` を作る案もあった。
- 対応: 既存 file 1 本に集約。理由は (a) 単一テーブル（`tag_assignment_queue`）に対する CRUD なので分割すると import 経路が肥大化、(b) 07a `tagQueueResolve` workflow が `tagQueue.ts` から `transitionStatus` を引いており、状態遷移を 1 file で見渡せる方が race / state machine の整合確認が容易、(c) 500 行制約も超過しない見込み。
- 再発防止: repository file 分割の判断基準を「テーブル単位 → 1 file。横断 view assembler / use-case 層は別 file」と quick-reference に整理（既存 §02a repository tables 隣接行）。

## L-UT02A-006: candidate / confirmed / rejected ↔ queued / resolved / rejected の alias 維持

- 症状: spec 12（search-tags）の語彙（`candidate` / `confirmed` / `rejected`）と DB enum（`queued` / `resolved` / `rejected`）が不一致。07a でも同様の混乱があった（L-07A-001 既知）。
- 対応: 07a で確立した alias 表をそのまま継承し、UT-02A 側で新規語彙は導入しない。新規追加した `dlq` のみ DB 専用語として明示し、spec 11 / 12 にも `dlq` status を反映した。
- 再発防止: tag queue 状態語の正本は **DB enum**（`queued` / `reviewing` / `resolved` / `rejected` / `dlq`）とし、spec 側の `candidate` / `confirmed` 表記は alias 表経由でのみ許容する旨を quick-reference §UBM-Hyogo D1 Repository 早見 02b に追記。

## L-UT02A-007: NON_VISUAL implementation の Phase 12 で artifacts.json を更新しない判断

- 症状: NON_VISUAL タスクでは visual evidence が無いため、`artifacts.json` の visual セクションを空更新するか / 据え置きにするかの判断が phase 12 でぶれやすい。
- 対応: 仕様書段階で「`artifacts.json` は本タスクで更新しない」を明示し、`workflow_state` 据え置き + `phases[].status` のみ更新する pattern を採用。
- 再発防止: skill-feedback-report に `task-specification-creator` への要望として「NON_VISUAL implementation の Phase 12 で `workflow_state` 据え置き + `phases[].status` 更新パターンを reference に明示する」を記録。

---

## 採用した設計判断（サマリ）

| 観点 | 採用値 | 不採用案 / 理由 |
| --- | --- | --- |
| idempotency key 形式 | `<memberId>:<responseId>` | `tagCode` を含める案 → enqueue 時点で未確定なため不採用 |
| UNIQUE 制約 | partial unique index `WHERE idempotency_key IS NOT NULL` | 全行 UNIQUE → legacy NULL 行と非互換 |
| state machine | queued → reviewing/resolved/rejected/dlq、resolved/rejected/dlq は terminal | dlq から自動再投入 → 安全側で manual requeue のみ（未実装 / 起票済） |
| retry policy | max=3 / backoff `30s × 2^(attempt-1)` / guarded UPDATE `WHERE status='queued'` | DB トリガで自動再試行 → Cloudflare D1 トリガ未対応 / 観測性低下 |
| repository 配置 | 既存 `apps/api/src/repository/tagQueue.ts` を拡張 | 仕様書通り `repositories/tagAssignmentQueue.ts` 新規作成 → 既存規約と非整合 |
| read-only 境界 | `*.test-d.ts` で type-level assert | runtime test → write 関数の有無は静的型情報の方が確実 |
| audit log | 07a 既存 `admin.tag.queue_resolved` / `admin.tag.queue_rejected` を流用 | UT-02A で `admin.tag.queue_dlq_moved` を即時実装 → retry workflow 実装と同 wave で扱う方が安全 |
| memberTags.ts | 不変（read-only 規約維持） | 直接書き込み案（旧設計）→ 不変条件 #13 違反のため不採用 |

---

## 将来タスクへの推奨事項（formal unassigned tasks）

| # | follow-up | 起票先 |
| --- | --- | --- |
| 1 | DLQ → queued の手動 requeue API（`requeueFromDlq`） | `docs/30-workflows/unassigned-task/task-issue-109-dlq-requeue-api-001.md` |
| 2 | retry workflow の自動 tick（cron / queue） | `docs/30-workflows/unassigned-task/task-issue-109-retry-tick-and-dlq-audit-001.md` |
| 3 | DLQ 移送時の `admin.tag.queue_dlq_moved` audit | `docs/30-workflows/unassigned-task/task-issue-109-retry-tick-and-dlq-audit-001.md` |
| 4 | `apps/api/src/repository/schemaDiffQueue.test.ts` 既存 fail 2 件（本タスク無関係） | 2026-05-05 に `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/` で current GREEN verification 済み。旧 unassigned は consumed trace |
| 5 | `TAG_QUEUE_PAUSED` 緊急停止 flag 運用 guard | `docs/30-workflows/unassigned-task/task-issue-109-tag-queue-pause-flag-001.md` |

---

## 関連 lessons-learned

- `references/lessons-learned-07a-tag-queue-resolve-2026-04.md`（resolve 側 / state machine alias / D1 batch race）
- `references/lessons-learned-02b-schema-diff-and-tag-queue.md`（02b: tag queue repository の初期 enqueue / unresolved status 規約）
- `references/lessons-learned-04c-admin-backoffice-2026-04.md`（admin tag queue API 04c）
