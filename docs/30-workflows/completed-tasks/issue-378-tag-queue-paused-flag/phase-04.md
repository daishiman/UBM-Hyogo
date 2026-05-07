# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

unit test の対象・ケース・assertion を確定し、phase-05 実装後にすぐ書ける状態にする。

## テスト対象ファイル

`apps/api/src/workflows/tagCandidateEnqueue.test.ts`（新規 or 既存に追記）

## テスト戦略

vitest + 現行 `setupD1()` fixture（既存 issue-109 の test と同形式）。
paused case は `env.db.prepare` を spy し、pause guard が D1 read / write の前に return することを検証する。

## ケース一覧

| # | ケース名 | env.TAG_QUEUE_PAUSED | 期待結果 | INSERT spy | log spy |
| --- | --- | --- | --- | --- | --- |
| 1 | 未設定で enqueue される | `undefined` | `enqueued: true` | called | not called |
| 2 | `"false"` で enqueue される | `"false"` | `enqueued: true` | called | not called |
| 3 | `"true"` で停止する | `"true"` | `{ enqueued: false, reason: "paused" }` | **NOT called** | called with `code: "UBM-TAGQ-PAUSED"` |

## 補助テスト

| # | ケース名 | 期待結果 |
| --- | --- | --- |
| 4 | `parsePaused({})` | `false` |
| 5 | `parsePaused({ TAG_QUEUE_PAUSED: "false" })` | `false` |
| 6 | `parsePaused({ TAG_QUEUE_PAUSED: "true" })` | `true` |
| 7 | `parsePaused({ TAG_QUEUE_PAUSED: "True" })` | `false`（厳格 parse）|
| 8 | `parsePaused({ TAG_QUEUE_PAUSED: "1" })` | `false`（厳格 parse）|

## log spy assertion

```ts
const warnSpy = vi.spyOn(console, "warn"); // または既存 logWarn helper の spy
// ...
expect(warnSpy).toHaveBeenCalledWith(
  expect.stringContaining('"code":"UBM-TAGQ-PAUSED"')
);
```

実装が `logWarn` helper を使う場合は、そちらを spy する。

## D1 発行有無の確認方法

paused case では `vi.spyOn(env.db, "prepare")` の call count を assertion する。
`expect(prepareSpy).not.toHaveBeenCalled()` を case 3 で要求し、INSERT だけでなく SELECT も発行しないことを担保する。

## 実行タスク

- [x] Phase 4 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`
- Phase 2: `phase-02.md`
- Phase 3: `phase-03.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-04.md`
- Phase 4 に対応する `outputs/phase-04/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 4 の完了条件を満たす。

- ケース 1〜3（必須）と補助 4〜8 が一覧化されている。
- INSERT spy / log spy の assertion 方法が明示されている。
- 既存 test フィクスチャ（`tagCandidateEnqueue` 関連）と整合する形式になっている。
