# Phase 1: 要件定義

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 1
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 1 (要件定義) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-1-requirements.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. 背景

issue-842 で `useAdminMutation` に timeout / retry（exponential backoff）/ idempotencyKey header 送出の reliability policy が実装された。AC-3 最適化により retry は **型レベルで idempotent method（`PUT` / `DELETE`）限定・既定オフ（opt-in）** として設計されている。

issue #912（followup-002）は「冪等 admin caller が登場したら opt-in を有効化する」未来タスクとして起票されていた。本サイクルのコード調査で次が判明:

- `apps/api/src/routes/admin/attendance.ts:177-199` に冪等 `DELETE /meetings/:sessionId/attendance/:memberId` が**既に存在**（unregistered の場合 404 を返す naturally idempotent endpoint）
- 一方 `apps/web/src/components/admin/MeetingPanel.tsx:106-122` の `attendanceMutation` は **POST `/api/admin/meetings/attendances` + `{ attended: false }`** を `mutationFn` 経由で叩いており、TC-27/28 仕様により timeout / retry / abort / idempotency-key が**一切適用されない**
- helper `apps/web/src/lib/admin/api.ts:556-566` の `removeAttendance` も同 POST 経路

つまり「冪等 endpoint が既存 surface として実在するのに、UI 側 caller が非冪等 POST + `mutationFn` 経路を選んでしまっているため reliability を享受できていない」状態。これは followup-002 が想定していた「冪等 caller の opt-in 宣言」の典型ケースとして本サイクルで解消できる。

## 2. 問題点・課題

| 問題 | 影響 |
|---|---|
| 解除側が POST + `mutationFn` 経路のため一過性 5xx / network error で自動再試行されない | 管理者が手動リロード → 重複解除試行 → 監査ログ汚染 |
| `Idempotency-Key` header が送出されないため、将来 server 側 dedupe（followup-003）が入っても恩恵を受けられない | reliability 機構が dead path 化 |
| 出席登録(POST 非冪等)と解除(冪等候補)を 1 つの `attendanceMutation` で兼ねているため、片方だけ reliability を有効化できない構造 | overload の型ガードを活かせない |

## 3. 何を達成するか（What）

### 3.1 目的

冪等 `DELETE /meetings/:sessionId/attendance/:memberId` を使う UI caller を新設し、`useAdminMutation` の retry policy + idempotencyKey を opt-in で有効化する。issue-842 で整備済みの reliability を**初の運用 caller**として享受させる。

### 3.2 最終ゴール

- `MeetingPanel.tsx` の出席解除経路が DELETE endpoint を `useAdminMutation(endpoint, "DELETE", { retry, idempotencyKey })` で叩き、5xx / network error で自動 retry し、`Idempotency-Key` header を送出する
- 出席登録経路（POST）は既存どおり非冪等で retry なし
- 解除 UI の既存挙動（404 race の楽観 UI 戻し / 409 toast / 楽観 UI / `router.refresh`）が回帰しない
- 既存 `MeetingPanel.component.spec.tsx` 拡張で retry 発火 / `Idempotency-Key` header / 4xx 非 retry / 既存挙動回帰が verify される

### 3.3 受け入れ条件（AC）

| ID | 条件 | 検証方法 |
|---|---|---|
| AC-1 | `apps/web/src/lib/admin/api.ts` の `removeAttendance` は `DELETE /meetings/:sessionId/attendance/:memberId` を呼ぶ | コード grep + spec |
| AC-2 | `MeetingPanel.tsx` の `attendanceMutation` は `addAttendanceMutation` / `removeAttendanceMutation` に分割されている | コード grep + spec |
| AC-3 | `removeAttendanceMutation` は `mutationFn` を使わず素の fetch 経路で動作する（`useAdminMutation(endpoint, "DELETE", options)` のシグネチャ） | 型 + spec で `fetch` 呼び出し回数を assert |
| AC-4 | `removeAttendanceMutation` は 500 → 500 → 200 で **3 回 fetch される**（初回 + 2 retry） | spec TC-02 |
| AC-5 | `removeAttendanceMutation` は各 fetch attempt で `Idempotency-Key` header を送出する | spec TC-03（値の同一性は hook 実装の責務。本 caller spec は header 送出を assert） |
| AC-6 | `removeAttendanceMutation` は 409 / 422 / 400 等 4xx では retry **しない**（1 回のみ fetch） | spec TC-04 |
| AC-7 | 404 race（既に解除済み）の楽観 UI 戻し / toast「既に出席解除されています」/ `throw e` 抑制の既存挙動が保持される | spec TC-05 |
| AC-8 | `useAdminMutation.ts` 本体（型 / overload / runtime ガード / 定数）は無変更 | git diff で確認 |

> **AC-5 の注記**: hook 実装 (`useAdminMutation.ts:115-117 / 224`) は `resolveIdempotencyKey` を retry loop 内で評価する。caller 側の責務は `idempotencyKey` option を渡し、各 attempt に header を載せることまで。同一値か別値かは hook policy の責務であり、本 caller のスコープ外。

### 3.4 前提依存

- 既存 DELETE endpoint (`apps/api/src/routes/admin/attendance.ts:177-199`) が naturally idempotent であること → ✓ 既に成立
- hook 本体の overload / runtime ガード / `Idempotency-Key` 送出機構が整っていること → ✓ 既に成立（TC-13..19 / TC-TY-01 で固定済み）
- server 側 `Idempotency-Key` 永続化 / dedupe → **未成立だが本タスクのスコープ外**（followup-003 担当）。endpoint が naturally idempotent なため retry 時も結果が安全に再現可能（解除済み行に再度 DELETE → 404 race の既存ハンドリングで吸収）。

## 4. なぜ重要か（Why）

- reliability 機構の **初の運用 caller** を確立することで、整備済み overload / `shouldRetry` / `resolveIdempotencyKey` / `backoffMs` が dead path 化しない
- 解除操作は管理者操作の中で最も「もう一度ボタンを押したくなる」破壊系で、idempotent endpoint × 自動 retry の恩恵が最も大きい
- 後続 caller（PUT 全体置換等）の opt-in 宣言の参考実装になる

## 5. スコープ

### 含む

- `removeAttendance` helper の DELETE 直叩き切替
- `MeetingPanel.tsx` の `attendanceMutation` 分割
- 既存 `MeetingPanel.component.spec.tsx` 拡張（retry / idempotency-key / 4xx 非 retry / 既存挙動回帰）

### 含まない

- `useAdminMutation.ts` 本体の変更（既に整備済み）
- 冪等 API endpoint の新規実装（既存 DELETE を使う）
- server 側 `Idempotency-Key` 永続化 / dedupe（followup-003）
- POST/PATCH caller への retry 適用（型・runtime で禁止）
- 公開 / 会員 mypage の mutation 経路への波及

## 6. 関連 ref

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- AC-3 最適化根拠: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/phase-1-requirements.md` §4 AC-3
- source one-pager: `docs/30-workflows/unassigned-task/issue-842-followup-002-idempotent-caller-retry-enablement.md`
- hook 本体: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- hook spec: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`（TC-13..19 / TC-27..29 / TC-TY-01）
- API DELETE route: `apps/api/src/routes/admin/attendance.ts:177-199`
- 改修対象 caller: `apps/web/src/components/admin/MeetingPanel.tsx:106-122`（mutation 宣言）/ `:213`（解除 trigger）
- 改修対象 helper: `apps/web/src/lib/admin/api.ts:556-566`
- CLAUDE.md 不変条件: 1 / 5 / 8 / 10
