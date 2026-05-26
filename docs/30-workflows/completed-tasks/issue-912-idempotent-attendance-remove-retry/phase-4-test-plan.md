# Phase 4: テスト計画

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 4
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 4 (テスト計画) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-4-test-plan.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. テスト対象と配置

| 配置 | 対象 |
|---|---|
| `apps/web/src/lib/admin/__tests__/api.spec.ts`（既存拡張） | `removeAttendance` helper の DELETE endpoint 経路 |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx`（既存拡張） | `MeetingPanel` の `addAttendanceMutation` / `removeAttendanceMutation` 経路 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`（既存・変更しない） | hook 本体 TC-13..19 / TC-27..29 / TC-TY-01 の回帰確認 |

## 2. テストケース（RED として記述）

### TC-01: removeAttendanceMutation は DELETE エンドポイントを叩く

- Given: `MeetingPanel` を render し、出席済み member の解除ボタンを押下 → `confirm` を confirm
- When: `removeAttendanceMutation.trigger` が呼ばれる
- Then: `fetch` が `DELETE /api/admin/meetings/{sessionId}/attendance/{memberId}` で 1 回呼ばれる

### TC-02: 5xx → 5xx → 200 で 3 回 fetch される（retry 発火）

- Given: fetch mock が順番に `500`, `500`, `200 { ok: true, ... }` を返す
- When: 解除 trigger
- Then: `fetch` 呼び出し回数 === 3。最終的に成功扱い（toast 表示なし or 既定 toast）

### TC-03: 各 fetch 呼び出しで Idempotency-Key header が送出される

- Given: fetch mock が `200` を返す
- When: 解除 trigger
- Then: `fetch` 第 2 引数の `headers["Idempotency-Key"]` が文字列として存在する（値の同一/別値は問わない・hook 側責務）

### TC-04: 4xx（409 race）では retry しない

- Given: fetch mock が `409 { error: "..." }` を返す
- When: 解除 trigger
- Then: `fetch` 呼び出し回数 === 1。`removeAttendanceMutation.trigger` は reject する

### TC-05: 404 race の楽観 UI 戻し + toast 表示が保持される

- Given: fetch mock が `404 { error: "attendance_not_found" }` を返す。事前に `attended` state に該当 memberId を含めて render
- When: 解除 trigger
- Then:
  - `attended` から該当 memberId が削除されている（楽観 UI 戻し）
  - toast に「既に出席解除されています」が表示される
  - throw されるが test 側で catch（`confirm` dialog の既存契約）

### TC-06: addAttendanceMutation は POST を叩き retry しない

- Given: fetch mock が `500` を返す
- When: 登録 trigger
- Then: `fetch` 呼び出し回数 === 1（POST は overload で retry 不可・runtime ガードで `shouldRetry=false`）。toast に「登録に失敗: ...」表示

### TC-07: 既存 add 側の 422 / 409 既知ハンドリング回帰

- Given: fetch mock が `422` / `409` を返す（2 ケース）
- When: 登録 trigger
- Then: それぞれ「削除済み会員は登録できません」/「この会員は既に出席登録されています」toast。`attended` state には追加されない

### TC-08: network error → retry → 成功

- Given: fetch mock が 1 回目 `TypeError("Failed to fetch")`、2 回目 `200` を返す
- When: 解除 trigger
- Then: `fetch` 呼び出し回数 === 2。最終成功

## 3. mocking 戦略

- `vi.stubGlobal("fetch", vi.fn())` を `useAdminMutation.spec.ts` と同じ pattern で使用
- `next/navigation` の `useRouter().refresh` は `vi.mock` で no-op stub
- `crypto.randomUUID` は jsdom で利用可。stable assertion 用に `vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-...")` を必要に応じて使用（TC-03 で header 存在のみなら不要）
- `useToast` は `vi.mock` で `toast` を `vi.fn()` 化（既存 hook spec と同パターン）
- `useConfirmDialog` の confirm は test util で同期的に confirm 扱いに stub（既存 MeetingPanel test pattern を踏襲）

## 4. 実行コマンド

```bash
# focused 実行（root Vitest config 明示。pnpm filter の file narrowing drift を避ける）
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx \
  apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  --reporter=default

# 全 web typecheck / lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 5. 期待結果

- focused Vitest: `api.spec.ts` / `MeetingPanel.component.spec.tsx` / `useAdminMutation.spec.ts` の 3 ファイル全 PASS
- 既存 hook spec: TC-13..19 / TC-27..29 / TC-TY-01 全 PASS（回帰なし）
- typecheck: 0 error
- lint: 0 error / 0 warning（baseline 維持）
