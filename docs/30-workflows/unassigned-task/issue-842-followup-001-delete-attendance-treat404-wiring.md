# DELETE attendance route 実装時に treat404AsSuccess policy を MeetingAttendancePanel へ配線 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Issue        | [#911](https://github.com/daishiman/UBM-Hyogo/issues/911)                                                                   |
| タスクID     | issue-842-followup-001-delete-attendance-treat404-wiring                                                                     |
| タスク名     | DELETE attendance route 実装時に treat404AsSuccess policy を MeetingAttendancePanel（および同種 DELETE-race caller）へ配線   |
| 分類         | 機能拡張                                                                                                                      |
| 対象機能     | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` の出席解除（DELETE）導線への 404 success-relaxation 適用 |
| 優先度       | 低                                                                                                                          |
| 優先度根拠   | DELETE attendance route 未実装に依存するため。前提が満たされるまで着手不可                                                   |
| 見積もり規模 | 小規模                                                                                                                        |
| ステータス   | 未実施                                                                                                                        |
| 発見元       | issue-842-admin-mutation-reliability-policy Phase 1 AC-6 最適化                                                              |
| 発見日       | 2026-05-24                                                                                                                    |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- deferred / スコープ外宣言:
  - `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md` 「issue 陳腐化への最適化方針」表（AC-6 行）および「スコープ外」節「DELETE attendance route 自体の新規実装（step-06 が『将来 task』と明記。本タスクは hook 基盤のみ整備）」
  - 同 index.md 変更対象ファイル表末尾の注記: `MeetingAttendancePanel.tsx` は本サイクルでは変更しない（POST 404 は既定 `false` で現挙動維持）
  - `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/phase-1-requirements.md` line 30 / line 61（AC-6 最適化定義）
- 現状実装の参照 path（policy 基盤は先行整備済み・caller 強制移行ゼロ）:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`
    - `Treat404AsSuccess = false | "silent" | { readonly toast: string }`（line 31）
    - `UseAdminMutationOptions.treat404AsSuccess`（line 47-48）
    - 404 success-relaxation 実装本体（trigger 内 `res.status === 404 && options?.treat404AsSuccess` 分岐、line 240-246）
    - method 型に `DELETE` を含む `MutationMethod`（line 10）、retry を idempotent 限定する overload（line 13 / line 126-136）
  - `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`（現状 POST 登録専用。404 を「開催日または会員が見つかりません」として失敗表示・line 56-59）
- 前提（依存条件）: **DELETE attendance route（出席解除）が API / UI 両面で先に実装されていること**。本タスクは DELETE route 実装後の wiring のみを担う条件付き future work であり、DELETE route 自体の新規実装は含まない。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-842（admin mutation reliability policy）の実装により、`apps/web/src/features/admin/hooks/useAdminMutation.ts` に汎用 policy `treat404AsSuccess: false | "silent" | { toast: string }` が整備された。これは「DELETE 系の冪等操作で対象が既に存在しない（404）場合に、それを失敗ではなく成功相当に倒す」ための共通基盤である。

元 issue の AC-6 は `MeetingAttendancePanel.tsx` の DELETE 404（他管理者が先に出席解除した結果のレース）を hook の policy へ移譲することを前提としていた。しかし実装時点の `MeetingAttendancePanel.tsx` は **POST 登録専用で DELETE が未実装**であり、コメントにも「破壊操作は将来 task で追加する」と明記されている（同ファイル line 4-6）。そのため AC-6 の元前提が陳腐化し、issue-842 では **policy 基盤だけを先行整備し、強制移行する caller はゼロ**（POST 404 は既定 `false` の失敗扱いのまま）として収束した。

### 1.2 問題点・課題

- `treat404AsSuccess` policy は実装済みだが、それを必要とする DELETE-race caller が現コードに存在しないため、policy が実適用されないまま残っている。
- 将来 DELETE attendance route（出席解除）が実装された際、`MeetingAttendancePanel.tsx` 側で 404 を素朴に失敗表示すると、「他管理者が先に解除した（=既に意図した状態に到達済み）」レースを管理者がエラーと誤認する。
- 同種の DELETE-race を持つ別の admin caller（例: tag 解除 / member 関連解除など、将来 DELETE 操作を追加する画面）でも、policy を配線しないと caller ごとに try/catch で 404 を個別処理する分散が再発する（issue-842 Phase 1 が指摘した「404 解釈の分散」問題の再来）。

### 1.3 放置した場合の影響

- DELETE attendance route 実装時に、policy 基盤の存在に気づかず caller 側で独自の 404 ハンドリングを書き、issue-842 が一本化したはずの 404 解釈が再び分散する。
- 出席解除レースで「既に解除済み」が失敗 toast として表示され、管理者が再操作や問い合わせを行うなど UX が劣化する。
- `treat404AsSuccess` が「使われない dead policy」として残り続け、後続実装者が意図（何のための policy か）を読み取れず削除候補と誤認するリスクがある。

---

## 2. 何を達成するか（What）

### 2.1 目的

DELETE attendance route が実装された後に、`useAdminMutation` の既存 `treat404AsSuccess` policy を `MeetingAttendancePanel.tsx`（および同種の DELETE-race を持つ admin caller）へ宣言的に配線し、出席解除レース（他管理者先行解除）を成功相当に倒して 404 解釈の分散を防ぐ。

### 2.2 最終ゴール

- `MeetingAttendancePanel.tsx` の出席解除（DELETE）導線が `useAdminMutation(endpoint, "DELETE", { treat404AsSuccess: ... })` を介して 404 を成功相当に倒す。
- 出席解除レース（DELETE 404）で失敗 toast を出さず、UI 上は「解除済み」状態へ収束する。
- 同種 DELETE-race を持つ他 admin caller が存在する場合、同じ policy 宣言で統一する（caller ごとの try/catch 個別 404 分岐を増やさない）。
- 既存 API endpoint surface のみ利用（DELETE route 自体の新規実装は本タスクの前提条件であり、含まない）。
- 対応する `.spec.tsx` が追加され、DELETE 404 = 成功相当（registered 状態から外れる／失敗 toast が出ない）契約が検証される。

### 2.3 スコープ

詳細は末尾「## スコープ」節を正とする。要約: `treat404AsSuccess` の caller 配線と spec 追加に限定し、DELETE attendance route 自体の新規実装・server 側 idempotency-key 永続化は含まない。

### 2.4 成果物

- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` の差分（DELETE 解除導線 + `treat404AsSuccess` 配線）
- 同種 DELETE-race caller が存在する場合、その差分
- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.spec.tsx`（DELETE 404 成功相当の契約検証）

---

## 3. どのように実装するか（How）

### 3.1 設計方針

- **前提（依存条件・必須）**: DELETE attendance route（出席解除）が API（`apps/api/src/routes/`）と UI（解除ボタン・対象 endpoint shape）の両面で先に実装されていること。本タスクは DELETE route 実装後の wiring のみを担う。この前提が満たされていない場合は着手しない（優先度「低」の根拠）。
- `MeetingAttendancePanel.tsx` の出席解除には冪等な DELETE method を用いる。`useAdminMutation` は `DELETE` を `IdempotentMethod` として扱うため、必要に応じて transient 5xx / network error 向けの `retry` も型レベルで併用可能（既定オフ。本タスクでは retry の要否は DELETE route の冪等性が確定してから判断）。
- 404 policy は **解除レースを「成功」として扱いつつ、管理者へ状態確定を伝える** ため、原則 `{ toast: "既に解除済みです" }` を採用する。`"silent"` は成功 toast すら出さず管理者が成否を誤認するリスクがあるため、明確な理由がない限り採用しない（後述「リスクと対策」）。
- POST 登録側（現行）の 404 ハンドリング（line 56-59「開催日または会員が見つかりません」）は**変更しない**。POST 404 は正当な失敗であり、issue-842 で既定 `false` 維持が確定済み。本タスクは DELETE 経路のみに `treat404AsSuccess` を適用する。

### 3.2 変更ファイル一覧

| ファイル                                                                | 種別     | 内容                                                                                       |
| ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`   | 既存変更 | 出席解除（DELETE）導線追加 + `useAdminMutation(..., "DELETE", { treat404AsSuccess })` 配線 |
| 同種 DELETE-race caller（存在する場合のみ）                             | 既存変更 | 同じ `treat404AsSuccess` 宣言で 404 解釈を統一                                              |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.spec.tsx` | 追加     | DELETE 404 成功相当の契約検証（`*.spec.tsx` のみ）                                          |

### 3.3 置換イメージ

before（解除導線が存在しない現行・POST 登録のみ。line 30-34）:

```tsx
const registerMutation = useAdminMutation<unknown>(
  `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
  "POST",
  { refreshOnSuccess: false },
);
```

after（DELETE attendance route 実装後に追加する解除 mutation。endpoint shape は実装済み route に合わせる）:

```tsx
// 出席登録（現行・変更しない）
const registerMutation = useAdminMutation<unknown>(
  `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
  "POST",
  { refreshOnSuccess: false },
);

// 出席解除（DELETE route 実装後に追加）。
// 他管理者が先に解除した 404 = 既に意図した状態に到達 → 成功相当に倒す。
const unregisterMutation = useAdminMutation<unknown>(
  `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`,
  "DELETE",
  {
    refreshOnSuccess: false,
    treat404AsSuccess: { toast: "既に解除済みです" },
  },
);
```

`treat404AsSuccess` 適用時、hook 側（`useAdminMutation.ts` line 240-246）は 404 で `options.onSuccess(undefined)` を呼び `undefined` を返すため、caller の `onSuccess` / 後続処理は `data` が `undefined` 前提で書く（404 success path では server response body が無い）。

---

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md`（AC-6 陳腐化方針）/ `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`
- 症状（AC-6 陳腐化）: 元 issue の AC-6 は「`MeetingAttendancePanel.tsx` の DELETE 404 = 他管理者先行解除を hook へ移譲」を前提としていたが、実装時点のパネルは POST 登録専用で DELETE-404 シナリオが**コード上に存在しなかった**。そのため issue-842 では `treat404AsSuccess` を汎用 policy として実装するに留め、強制移行する caller をゼロにした（POST 404 は既定 `false` 維持）。本タスクはこの「先行整備した policy 基盤」を、DELETE route 実装という前提が満たされて初めて配線する条件付き future work である点に注意する。policy が既に実装済みであることを前提に caller 側だけを触る。
- 症状（`Treat404AsSuccess` 3 値型の narrowing）: 型は `false | "silent" | { readonly toast: string }`（`useAdminMutation.ts` line 31）。hook 内部（line 240-242）では `if (res.status === 404 && options?.treat404AsSuccess)` で falsy（`false`）を弾いたうえで `if (policy !== "silent") toast(policy.toast, "status")` と narrowing している。caller 側で policy を組み立てる際、`false`（失敗扱い）/ `"silent"`（成功・無音）/ `{ toast }`（成功・通知）の 3 分岐を取り違えると、解除レースが「失敗表示」「無音で成否不明」のいずれかに倒れる。本タスクでは原則 `{ toast: "既に解除済みです" }` を採用し、`"silent"` は採用しない。
- 症状（404 success path の戻り値）: 404 成功相当時、hook は `return undefined as T`（line 245）し `onSuccess(undefined as T)` を呼ぶ。caller の `onSuccess` / await 後処理を `data` 非依存（`undefined` 前提）で書かないと runtime で `undefined` 参照エラーになる。
- 参照:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts` line 30-31 / 47-48 / 239-246
  - `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md`「issue 陳腐化への最適化方針」表 AC-6 行
  - `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/phase-1-requirements.md` line 30 / 61

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| DELETE attendance route の API / UI shape（endpoint パス・body・status 体系）が未確定で、配線先が後から動く | 高 | 本タスクは DELETE route 実装完了を**前提条件**とし、route が確定するまで着手しない（優先度「低」）。route 実装 PR の endpoint surface を確認してから配線する |
| `treat404AsSuccess` を `"silent"` にすると成功 toast が出ず、管理者が解除の成否を誤認する | 中 | 原則 `{ toast: "既に解除済みです" }` を採用し `"silent"` は使わない。`"silent"` 採用が必要な場合は他 UI（行の `data-registered` state 反映等）で成否が判別できることを spec で担保 |
| POST 登録側の 404 ハンドリング（line 56-59）まで誤って `treat404AsSuccess` 化し、正当な「not found」失敗を握り潰す | 高 | POST mutation は変更しない。`treat404AsSuccess` は DELETE mutation のみに適用する。spec で POST 404 が従来通り失敗表示されることを回帰検証 |
| 404 success path で hook が `undefined` を返すことを caller が考慮せず runtime エラー | 中 | `onSuccess` / await 後処理を `data` 非依存に書く。spec で 404 時に `undefined` が返り後続が落ちないことを assert |
| 同種 DELETE-race caller を見落とし、caller ごとに 404 を個別 try/catch する分散が再発 | 低 | 実装前に `apps/web` 内 `useAdminMutation(..., "DELETE"` を grep し、DELETE caller 全件を棚卸ししてから配線方針を統一 |

## 検証方法

> 前提: DELETE attendance route が実装済みで、`MeetingAttendancePanel.tsx` に解除導線が追加されていること。未実装の段階では本検証は実行できない（優先度「低」の根拠）。

### 単体検証

```bash
# DELETE caller の棚卸し（配線対象の網羅確認）
mise exec -- rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web

# treat404AsSuccess の配線確認（DELETE 経路に policy が宣言されているか）
mise exec -- rg -n 'treat404AsSuccess' apps/web/app/\(admin\)/admin/meetings/\[id\]/MeetingAttendancePanel.tsx

# パネル spec（DELETE 404 成功相当の契約）
mise exec -- pnpm --dir apps/web exec vitest run "app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.spec.tsx"

# hook 既存 spec の回帰（treat404AsSuccess 基盤を壊していないこと）
mise exec -- pnpm --dir apps/web exec vitest run src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
```

期待:
- DELETE caller 棚卸しで列挙された DELETE-race 経路がすべて `treat404AsSuccess` を宣言している（個別 try/catch 404 が残っていない）
- `MeetingAttendancePanel.spec.tsx` が全 PASS。DELETE 404 で失敗 toast が出ず「既に解除済みです」表示かつ行が解除状態へ収束する／POST 404 は従来通り失敗表示される（回帰）
- hook 既存 spec が全 PASS（基盤無回帰）

### 統合検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: `pnpm typecheck` / `pnpm lint` ともに 0 error / 0 warning。`*.test.{ts,tsx}` を追加していないこと（lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` に抵触しないこと）。

## スコープ

### 含む

- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` の出席解除（DELETE）導線への `treat404AsSuccess` 配線
- 同種 DELETE-race を持つ admin caller が存在する場合、同 policy による 404 解釈統一
- `MeetingAttendancePanel.spec.tsx`（`*.spec.tsx` のみ）追加による DELETE 404 成功相当契約の検証

### 含まない

- **DELETE attendance route 自体の新規実装**（→ 別タスク。issue-842 index.md「スコープ外」が step-06 を引いて「将来 task」と明記。本タスクの**前提条件**であり、route 未実装の段階では本タスクは着手不可）
- **server 側 idempotency-key の永続化**（→ issue-842-followup-003 想定。issue-842 はクライアント送出と header 設計までで、server 永続化は元 issue でも明示スコープ外）
- POST 登録側 404 ハンドリングの変更（正当な失敗であり既定 `false` 維持。issue-842 で確定済み）
- 新規 API endpoint 追加・既存 endpoint shape 変更（CLAUDE.md UI prototype alignment 不変条件 1。DELETE route 確定後の既存 surface のみ利用）
- D1 schema / binding 変更・`apps/web` からの D1 直接アクセス（CLAUDE.md 不変条件 5）
- legacy `@/lib/useAdminMutation` への新規参照（CLAUDE.md 不変条件 10。配線は `@/features/admin/hooks/useAdminMutation` 経由のみ）
- 新規 primitive / 新規 visual 仕様 / HEX 直書き・`bg-[#xxx]`・`text-[#xxx]` の導入（CLAUDE.md 不変条件 2 OKLch トークン正本化）

## 関連 path / refs

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- deferred / 陳腐化方針: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md`「issue 陳腐化への最適化方針」表 AC-6 行 / 「スコープ外」節 / 変更対象ファイル表末尾の `MeetingAttendancePanel.tsx` 注記
- AC-6 定義: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/phase-1-requirements.md` line 30 / line 61
- policy 実装本体: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`Treat404AsSuccess` line 31 / option line 47-48 / 404 分岐 line 239-246 / `MutationMethod` line 10 / idempotent overload line 13・126-136）
- 配線対象 caller: `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`（現状 POST 専用・404 失敗表示 line 56-59）
- 発見元 workflow（DELETE「将来 task」の出典）: `docs/30-workflows/step-06-meetings-attendance-implementation/`
- フォーマット手本: `docs/30-workflows/unassigned-task/admin-ui-prototype-alignment-followup-001-safe-server-fetch-horizontal-expansion.md`
- 必須セクション仕様: `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md`
- CLAUDE.md 不変条件: §「UI prototype alignment / MVP recovery」不変条件 1（既存 API endpoint surface のみ）/ 不変条件 2（OKLch トークン正本化）/ §「重要な不変条件」5（D1 直接アクセス禁止）/ 8（test ファイルは `*.spec.{ts,tsx}` のみ）/ 10（admin mutation は `@/features/admin/hooks/useAdminMutation` 経由標準）
