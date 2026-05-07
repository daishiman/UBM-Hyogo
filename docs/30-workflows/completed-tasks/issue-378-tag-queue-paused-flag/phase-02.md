# Phase 2: 設計・状態抽象化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

pause check の挿入位置・result 型拡張・structured log code 採番・helper 関数の責務を確定し、phase-05 の実装ランブックが書ける粒度まで設計する。

## pause check 挿入位置

`enqueueTagCandidate(c: DbCtx, input, paused: boolean)` の **先頭**に配置する。
理由:

1. 削除済み member skip（不変条件 #13）よりも前に短絡することで、停止中の D1 read を一切発生させない。
2. idempotency check より前に置くことで、停止中に新規 SELECT も発生しない。
3. paused 時は `enqueueTagCandidate` 呼び出しごとに structured log を 1 行出す。batch 単位の集約や sampling は本タスクでは導入しない。

擬似コード:

```ts
export async function enqueueTagCandidate(
  c: DbCtx,
  input: EnqueueTagCandidateInput,
  paused: boolean,
): Promise<EnqueueTagCandidateResult> {
  if (paused) {
    logWarn({
      code: "UBM-TAGQ-PAUSED",
      memberId: input.memberId,
      responseId: input.responseId,
      reason: "paused",
    });
    return { enqueued: false, reason: "paused" };
  }
  // 既存ロジック（削除済み member skip → idempotency → INSERT）
}
```

## result 型拡張

`EnqueueTagCandidateResult.reason` に `"paused"` を追加する。
現行 reason は `has_tags` / `has_pending_candidate` / `paused` の 3 値とする。

## helper: parsePaused

`apps/api/src/workflows/tagCandidateEnqueue.ts` 内に private helper を追加。

```ts
export function parsePaused(env: Pick<Env, "TAG_QUEUE_PAUSED">): boolean {
  return env.TAG_QUEUE_PAUSED === "true";
}
```

- `"true"` 完全一致のみ true。
- 未設定 / `"false"` / その他は false（厳格 parse）。
- export することで `sync-forms-responses.ts` から呼べる。
- unit test の対象になる。

## structured log code 採番

`UBM-TAGQ-PAUSED` を採番する。
- prefix `UBM-` は既存 code 規約に合わせる。
- `TAGQ` は tag_assignment_queue の短縮。
- `PAUSED` は理由。
- 既存 helper `logWarn` を流用し、payload は `message` と `context.reason = "paused"` を含める。

## 実行タスク

- [x] Phase 2 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-02.md`
- Phase 2 に対応する `outputs/phase-02/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 2 の完了条件を満たす。

- pause check 挿入位置が phase-05 で参照可能な粒度で固定されている。
- `EnqueueTagCandidateResult.reason` の追加値が `"paused"` で確定。
- `parsePaused` の入力 / 出力 / 厳格 parse 規則が確定。
- structured log code `UBM-TAGQ-PAUSED` が採番済み。
