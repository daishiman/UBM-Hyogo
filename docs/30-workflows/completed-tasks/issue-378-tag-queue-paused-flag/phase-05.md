# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

実装者が phase-01〜04 の決定事項に従って迷いなくコード変更できるよう、ファイル単位の差分方針と手順を確定する。

## 変更対象ファイル一覧（CONST_005 必須項目）

| File | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/api/src/env.ts` | 編集 | `Env` interface に `readonly TAG_QUEUE_PAUSED?: string;` を追加。コメントで issue #378 を言及する。 |
| `apps/api/wrangler.toml` | 編集 | `[vars]` に `TAG_QUEUE_PAUSED = "false"` を追加。`[env.staging.vars]` / `[env.production.vars]` の各セクションにも同様に追加（環境別 override 可能性を担保）。 |
| `apps/api/src/workflows/tagCandidateEnqueue.ts` | 編集 | (1) `EnqueueTagCandidateResult.reason` 型に `"paused"` を追加し、現行 reason を `has_tags` / `has_pending_candidate` / `paused` に固定。(2) 関数シグネチャ第3引数として `paused = false` を追加。(3) 関数先頭で `if (paused) { logWarn({ code: "UBM-TAGQ-PAUSED", message, context: { memberId, responseId, reason: "paused" } }); return { enqueued: false, reason: "paused" }; }`。(4) `parsePaused(env): boolean` helper を export（`"true"` 完全一致のみ true）。 |
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | `runResponseSync` で `parsePaused(env)` を評価し、`processResponse` option 経由で `enqueueTagCandidate` 第3引数へ渡す。 |
| `apps/api/src/workflows/tagCandidateEnqueue.test.ts` | 新規 or 追記 | phase-04 のケース 1〜8 を実装。fakeD1 spy + log spy。 |
| `docs/30-workflows/runbooks/tag-queue-pause.md` | 新規 | 緊急停止手順 / 復旧手順 / 検証コマンドを記載（後述テンプレート参照）。 |

## 実装手順

1. `apps/api/src/env.ts` を編集し `TAG_QUEUE_PAUSED?: string` を追加。
2. `apps/api/wrangler.toml` を編集し 3 セクションに `TAG_QUEUE_PAUSED = "false"` を追加。
3. `apps/api/src/workflows/tagCandidateEnqueue.ts` を編集:
   - `EnqueueTagCandidateResult` 型に `reason: "..." | "paused"` 追加。
   - `parsePaused` を export 関数として追加。
   - `enqueueTagCandidate` に第3引数 `paused: boolean` を追加。
   - 先頭に pause guard を挿入。
4. `apps/api/src/jobs/sync-forms-responses.ts` を編集し、呼び出し箇所に `parsePaused(env)` を渡す。env を関数 scope まで伝播。
5. `rg -n "enqueueTagCandidate\\(" apps/api/src` で production caller と test caller を分けて確認する。
6. `apps/api/src/workflows/tagCandidateEnqueue.test.ts` を作成 / 追記し phase-04 ケース 1〜8 を実装。
7. `docs/30-workflows/runbooks/tag-queue-pause.md` を作成。
8. `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm/api test` を順に実行。

## runbook テンプレート（`docs/30-workflows/runbooks/tag-queue-pause.md`）

含めるセクション:

- 概要（何を停止するか / 何は停止しないか）
- 緊急停止手順
  1. `apps/api/wrangler.toml` の対象 env で `TAG_QUEUE_PAUSED = "true"` に変更
  2. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`
  3. 数分以内に Forms sync の next run が走り、log で `UBM-TAGQ-PAUSED` を確認
- 検証コマンド
  - `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT COUNT(*) FROM tag_assignment_queue WHERE created_at > datetime('now','-10 minutes')"` で増分が止まることを確認
- 復旧手順
  1. `apps/api/wrangler.toml` を `TAG_QUEUE_PAUSED = "false"` に戻す
  2. 同 deploy コマンドで反映
  3. 次回 sync で enqueue が再開することを log で確認

## 実行タスク

- [x] Phase 5 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 4: `phase-04.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-05.md`
- Phase 5 に対応する `outputs/phase-05/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 5 の完了条件を満たす。

- 変更対象ファイル一覧表が CONST_005 の粒度で記載されている。
- 実装手順 1〜8 が順序通り並んでいる。
- runbook テンプレートが緊急停止 / 復旧 / 検証の 3 セクションを含む。
