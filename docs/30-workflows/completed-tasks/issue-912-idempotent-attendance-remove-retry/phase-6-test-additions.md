# Phase 6: テスト拡充

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 6
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 6 (テスト追加) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-6-test-additions.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. fail path / 回帰 guard

Phase 4 で定義した helper / component / hook focused Vitest に加え、以下の guard を既存 spec 拡張に含める。

### G-01: `mutationFn` 経路を使っていないことの間接検証

- `removeAttendanceMutation.trigger` の呼び出しで `fetch` が呼ばれる（mock）ことを assert
- もし `mutationFn` 経路に戻したら hook L209-217 分岐で `fetch` が呼ばれなくなるため、本 assert で回帰検知

### G-02: endpointOverride の URL encoding

- `sessionId="session/with slash"` のような edge case で `fetch` URL が `encodeURIComponent` を通っていること
- assertion: `expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/session%2Fwith%20slash/), expect.objectContaining({ method: "DELETE" }))`

### G-03: retry 間 backoff の最低待ち時間

- vitest fake timer (`vi.useFakeTimers()`) を使い、5xx → 5xx の間で `await vi.advanceTimersByTimeAsync(200)` 未満では retry が発火しないこと
- 既定 `baseDelayMs=200` の挙動を caller spec 側で固定

### G-04: `addAttendanceMutation` 型ガード（コンパイル時）

- `// @ts-expect-error retry is not allowed on POST` コメントを伴う型試験コード片を spec 末尾に置く（テスト本体は実行しないコメントブロックか、`expectTypeOf` ベース）
- TC-TY-01 と同じ機構を caller 側でも担保

## 2. 既存挙動回帰 guard

| 既存挙動 | 担当 TC | guard 観点 |
|---|---|---|
| 404 race の楽観 UI 戻し | TC-05 | DOM 上の attended chip / list 要素の消失 |
| 409 / 422 toast 文言 | TC-07 | `toast` mock 呼び出しの message 完全一致 |
| `confirm` dialog の throw 契約 | TC-05 | `await expect(...).rejects.toBeInstanceOf(FetchAuthedError)` |
| `addAttendanceMutation` の既存 `mutationFn` 経路 | TC-06 / TC-07 | `addAttendance` helper（lib/admin/api.ts）が呼ばれること（spy） |

## 3. mock 抜け漏れチェックリスト

- [ ] `next/navigation` の `useRouter` mock
- [ ] `useToast` の `toast` mock
- [ ] `useConfirmDialog` の confirm を即時 resolve に stub
- [ ] `fetch` を `vi.stubGlobal` で mock
- [ ] `crypto.randomUUID` は jsdom で利用可能なら mock 不要。env で未定義なら `vi.spyOn(globalThis.crypto, "randomUUID")` で stub
- [ ] meetings / members の initial props を MeetingPanel に渡すための fixture

## 4. 期待されるカバレッジ寄与

- `MeetingPanel.tsx` の `removeAttendanceMutation` 経路（新規）: 4xx / 5xx / network / 404 race / 成功の 5 branch カバー
- `apps/web/src/lib/admin/api.ts` の `removeAttendance`: DELETE 経路 1 branch
- `useAdminMutation.ts` の既存 retry / idempotency 経路: 既に hook spec で full carve、本タスクでは追加 carve 不要
