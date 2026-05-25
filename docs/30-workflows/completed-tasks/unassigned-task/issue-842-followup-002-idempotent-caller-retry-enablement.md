# 冪等 admin mutation caller での retry / idempotencyKey 有効化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Issue        | [#912](https://github.com/daishiman/UBM-Hyogo/issues/912)                                                                             |
| タスクID     | issue-842-followup-002-idempotent-caller-retry-enablement                                                                             |
| タスク名     | 冪等(PUT/DELETE) admin mutation caller 登場時に retry policy / idempotencyKey を有効化し reliability を享受させる                       |
| 分類         | 改善                                                                                                                                  |
| 対象機能     | `apps/web/src/features/admin/hooks/useAdminMutation.ts` の retry / idempotencyKey policy を、新規 idempotent admin caller で opt-in 宣言 |
| 優先度       | 低                                                                                                                                  |
| 優先度根拠   | 冪等 caller の登場に依存。トリガ条件が満たされるまで着手不可                                                                         |
| 見積もり規模 | 小規模                                                                                                                              |
| 規模根拠     | hook 基盤は実装済み。新 caller 側の opt-in 宣言 + spec 追加が主                                                                      |
| ステータス   | consumed_by_issue_912_local_implemented_pending_pr                                                                                    |
| 発見元       | issue-842-admin-mutation-reliability-policy Phase 1 AC-3 最適化                                                                        |
| 発見日       | 2026-05-24                                                                                                                            |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- consumed workflow: `docs/30-workflows/issue-912-idempotent-attendance-remove-retry/`
- current state: `implemented_local_evidence_captured / implementation / NON_VISUAL`。2026-05-25 に既存 `DELETE /meetings/:sessionId/attendance/:memberId` endpoint と `MeetingPanel` caller の前提依存成立を確認し、同サイクルで apps/web 実装・focused Vitest 証跡取得まで完了。commit / push / PR 完了後に `completed-tasks/unassigned-task/` へ移動する。
- AC-3 最適化の根拠: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/phase-1-requirements.md` §4 AC-3 / `index.md`「issue 陳腐化への最適化方針」表（retry は opt-in・既定オフ・idempotent method 限定）
- 現状実装（実装済み・本タスクの土台）:
  - retry / idempotencyKey / overload 本体: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
    - `RetryPolicy`（`maxAttempts` / `baseDelayMs?` / `maxDelayMs?` / `retryOn?`）— L16-28
    - `IdempotentMethod = "PUT" | "DELETE"`（型レベルガード）— L13
    - overload 2 本（idempotent: retry 受け付け / 非冪等: retry 不可）— L126-136
    - `shouldRetry` の runtime 二重ガード（`!isIdempotent(method)` で常に false）— L97-107
    - `Idempotency-Key` header 送出（`resolveIdempotencyKey`・指定時のみ）— L115-117 / L224-230
    - 既定定数 `DEFAULT_TIMEOUT_MS=10000` / `DEFAULT_BASE_DELAY_MS=200` / `DEFAULT_MAX_DELAY_MS=2000` — L69-71
  - 既存 spec（retry / idempotency の TC）: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
    - retry: TC-13（DELETE 5xx→再試行→成功）/ TC-14（PUT maxAttempts 到達→失敗）/ TC-15（4xx は retry しない）/ TC-16（指数 backoff）
    - idempotency: TC-17（文字列）/ TC-18・TC-29（関数で trigger 毎評価）/ TC-19（未指定で header なし）
    - mutationFn 経路: TC-27（timeout 非適用）/ TC-28（retry 非適用）
    - 型レベル: TC-TY-01（POST/PATCH に retry を渡すと `@ts-expect-error`）
- overload 設計の根拠: POST/PATCH（非冪等）への retry 適用は重複実行リスクがあるため、型レベルで idempotent method 限定にしている。現 admin caller（`MemberDrawer` / `MeetingPanel` / `IdentityConflictRow` / `TagsQueueResolveDrawer` / `SchemaDiffPanel` / `RequestQueuePanel`）は全て POST/PATCH のため、現状 retry を有効化している caller はゼロ。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-842 で `useAdminMutation` に timeout / retry（exponential backoff）/ idempotencyKey header 送出の reliability policy が実装された。ただし AC-3 最適化により、retry は **型レベルで idempotent method（`PUT` / `DELETE`）限定・既定オフ（opt-in）** として設計されている。

`phase-1-requirements.md` §2 の caller 実測表のとおり、現 admin caller は全て POST/PATCH（非冪等）であり、overload により retry を型で渡せない。結果として、retry の実装本体・テスト（TC-13..16）・指数 backoff・`Idempotency-Key` 送出機構は **整備済みだが、production で有効化している caller がゼロ** の状態にある。

### 1.2 問題点・課題

- retry / idempotencyKey の土台（overload・runtime 二重ガード・backoff・header 注入・spec）が実装済みなのに、誰も使っていない（活用機会の損失）。
- 将来 admin に冪等な mutation（例: リソース全体置換の `PUT`、リソース削除の `DELETE`）が登場したとき、reliability policy の存在に気付かず、各 caller が独自に retry / 重複防止を再発明するリスクがある。
- overload で「POST/PATCH では retry を渡せない型ガード」が既に整っているため、新 caller 側で opt-in 宣言するだけで使える。この土台が使われないまま陳腐化すると、`shouldRetry` / `backoffMs` / `resolveIdempotencyKey` が dead path 化し、リファクタ時に「使われていない＝消してよい」と誤判断される懸念がある。

### 1.3 放置した場合の影響

- 冪等 admin endpoint / caller が登場しても reliability（一過性 5xx / network error の自動再試行 + idempotency-key による重複保護）を享受できず、管理者が手動リロードで重複操作 → audit log 汚染という issue-842 が解こうとした gap が再発する。
- 実装済みの retry / idempotency 機構が「呼ばれないコード」として残り、coverage / 保守対象の純損失になる。

> このタスクは **条件付き future work** であり、「冪等な admin mutation endpoint / caller が先に存在すること」を着手の前提依存とする（§3.4 参照）。トリガ条件を満たさない限り着手しない。

---

## 2. 何を達成するか（What）

### 2.1 目的

将来 admin に冪等(PUT/DELETE)な mutation caller が登場したとき、`useAdminMutation` の retry policy と idempotencyKey を **opt-in 宣言** で有効化し、issue-842 で整備済みの reliability を享受させる。新 endpoint / hook 機構は追加せず、既存 overload の opt-in 経路を使うだけにする。

### 2.2 最終ゴール

- 新規 idempotent admin caller（`PUT` / `DELETE`）が、`useAdminMutation(endpoint, "PUT" | "DELETE", { retry, idempotencyKey })` の opt-in 宣言で reliability を有効化している。
- 該当 caller の `.spec.{ts,tsx}` で「retry が掛かること」「idempotency-key が送出されること」「POST/PATCH と同様の既存挙動が回帰しないこと」が検証されている。
- hook 本体（`useAdminMutation.ts`）の型・overload・runtime ガード・定数は **変更しない**（既に整備済みのため）。

### 2.3 スコープ

#### 含むもの

- 新規 idempotent admin caller での `retry` / `idempotencyKey` opt-in 宣言の追加（caller 側コードのみ）。
- 既定値（`maxAttempts` / `baseDelayMs` / `maxDelayMs` / `retryOn`）の妥当性を当該 endpoint の特性に照らして検討し、必要なら caller 側で上書き。
- 当該 caller の `.spec.{ts,tsx}` で retry / idempotency / 既存挙動回帰の検証を追加。

#### 含まないもの

- `useAdminMutation.ts` 本体の型 / overload / runtime ガード / 定数の変更（既に整備済み・触らない）。
- 冪等 admin endpoint 自体の新規実装（→ §3.4 の前提依存。CLAUDE.md UI prototype alignment 不変条件 1「既存 API endpoint surface のみ利用」のため、本タスクでは endpoint を追加しない）。
- server 側の idempotency-key 永続化 / dedupe（→ issue-842-followup-003 で別途。理由は §「リスクと対策」「スコープ」参照）。
- POST/PATCH caller への retry 適用（型・runtime の二重ガードで禁止。非冪等操作の重複実行を防ぐため）。

### 2.4 成果物

- 新規 idempotent admin caller の差分（`retry` / `idempotencyKey` opt-in 宣言）。
- 対応する `.spec.{ts,tsx}`（retry 発火 / idempotency-key 送出 / 既存挙動回帰）。

---

## 3. どのように実装するか（How）

### 3.1 opt-in 宣言の基本形

idempotent method（`PUT` / `DELETE`）のときだけ overload が retry 付き options（`UseAdminMutationIdempotentOptions<T>`）を受け付ける。新 caller は以下のように宣言するだけで有効化できる。

```ts
// 例: 将来の DELETE 系 admin caller
const mutation = useAdminMutation("/api/admin/example/:id", "DELETE", {
  // idempotent method なので retry を型で渡せる（POST/PATCH では型エラー）
  retry: { maxAttempts: 3 }, // baseDelayMs/maxDelayMs/retryOn は既定でよければ省略
  idempotencyKey: () => crypto.randomUUID(), // trigger 毎に再評価される
});

await mutation.trigger(payload);
```

```ts
// 例: 将来の PUT 系 admin caller（全体置換）。404 race を成功扱いにしたい場合
const mutation = useAdminMutation("/api/admin/example/:id", "PUT", {
  retry: { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 2000 },
  idempotencyKey: stableKey, // 文字列固定なら trigger 間で同一値
  treat404AsSuccess: { toast: "既に別管理者が処理済みです" },
});
```

### 3.2 既定値の妥当性検討

| 項目 | 既定 | 妥当性の観点 |
| --- | --- | --- |
| `maxAttempts` | 既定なし（必須） | 初回 + (n-1) retry。admin 操作は同期 UX のため 2〜3 が現実的。多すぎると管理者の待ち時間が伸びる |
| `baseDelayMs` | `200`（`DEFAULT_BASE_DELAY_MS`） | `backoffMs(attempt) = min(base * 2^(attempt-1), maxDelayMs)`。200 → 400 → 800… |
| `maxDelayMs` | `2000`（`DEFAULT_MAX_DELAY_MS`） | backoff 上限。admin 同期操作で 2s 超は体感悪化のため据え置きが妥当 |
| `retryOn` | network error（status null）または 5xx | 4xx は再試行で直らないため対象外（実装済み既定）。当該 endpoint で 409 を再試行したい等の特殊要件があれば上書き |
| `idempotencyKey` | 未指定（header 送出なし） | 指定時のみ `Idempotency-Key` header 送出。retry で同一リクエストが二重到達しても server 側 dedupe があれば二重書き込みを防げる（→ followup-003 依存・§リスク参照） |

> retry を有効化するなら `idempotencyKey` も併せて宣言することを推奨。retry は同一リクエストを複数回送出しうるため、server 側で idempotency-key を見て dedupe できないと「片方は成功したが応答が落ちて retry → 二重書き込み」が起こり得る。

### 3.3 mutationFn 経路の注意

`options.mutationFn` を指定した caller では、後方互換のため **timeout / retry / abort signal が適用されない**（spec TC-27 / TC-28 で固定）。新 idempotent caller で retry を効かせたい場合は、`mutationFn` を使わず素の fetch 経路（`endpoint` + `method`）を使うこと。

### 3.4 前提依存（トリガ条件）

本タスクは以下が **先に成立していること** を着手の前提とする。

1. 冪等な admin mutation の **API endpoint** が `apps/api/src/routes/` 配下に存在する（PUT による全体置換 / DELETE による削除）。本タスクでは endpoint を追加しない（不変条件 1）。
2. その endpoint を叩く admin caller（component）を実装する作業が立っている。

上記が無い段階では retry を型で渡す相手が存在しないため、本タスクは「未実施」のまま待機する。issue-842 `index.md` の「DELETE attendance route 自体の新規実装」は step-06 が「将来 task」と明記しており、それが具体化したタイミングが代表的なトリガ。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（L13 / L51-56 / L126-136）
- 症状: overload により `useAdminMutation(endpoint, "POST" | "PATCH", options)` の options 型には `retry` が含まれない（`UseAdminMutationOptions<T>`）。POST/PATCH に `retry` を渡すと **typecheck error** になる。これは仕様（`__tests__/useAdminMutation.spec.ts` TC-TY-01 が `@ts-expect-error` でコンパイル時に固定）。新 caller を実装する際、間違って非冪等 method で retry を宣言すると型エラーで弾かれるので、method が本当に冪等(PUT/DELETE)かを先に確定すること。
- 参照: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` TC-TY-01（L786-795）

- 対象: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（L94-107 `isIdempotent` / `shouldRetry`）
- 症状: retry は型ガードだけでなく **runtime でも二重ガード**されている。`shouldRetry` は `!retry || !isIdempotent(method)` で常に false を返すため、仮に型を回避（`as any` 等）して POST に retry を渡しても runtime で再試行は起きない。逆に言うと「retry を宣言したのに掛からない」とき、まず method が PUT/DELETE か、`retryOn` が当該 status を拾うか（既定は network error / 5xx のみ・4xx は対象外）を疑う。
- 参照: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` TC-15（4xx は retry しない）

- 対象: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（L207-217 `options?.mutationFn` 分岐）
- 症状: `mutationFn` 経路は fetch `signal` を受け取れないため、**timeout / retry / abort / idempotency-key header が一切適用されない後方互換の罠**。「DELETE で retry を宣言したのに 1 回しか呼ばれない」場合、`mutationFn` を併用していないか確認する（TC-28 が「mutationFn 経路では idempotent method でも retry が掛からない」を固定）。
- 参照: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` TC-27 / TC-28（L744-783）

- 対象: server 側 idempotency-key の dedupe 不在
- 症状: client は `Idempotency-Key` header を送出するが、現状 server 側に永続化/dedupe は無い（issue-842 `index.md` スコープ外明記）。retry で同一リクエストが二重到達した場合、server が同一 key を認識しないと二重書き込みになり得る。idempotency-key の真価は server 側 dedupe（followup-003）とセットで初めて出る。
- 参照: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md`「スコープ外」L79

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| retry が非冪等操作に誤適用され重複実行される | 高 | method を必ず PUT/DELETE に限定。型 overload + `shouldRetry` runtime 二重ガードで非冪等は弾かれる。caller 実装時に「この操作は本当に冪等か（同一リクエストを 2 回適用しても結果が同じか）」を AC でレビュー |
| server 側 idempotency-key の dedupe が無いため retry の二重書き込みを防げない | 高 | followup-003（server 側 idempotency-key 永続化）に依存。それが無い間は retry を有効化しても「応答ロスト → retry → 二重書き込み」を完全には防げない。endpoint が自然に冪等（同一 PUT / DELETE が安全に再適用可能）であることを前提条件に据える |
| `mutationFn` 経路で retry を宣言しても効かない | 中 | 新 idempotent caller では `mutationFn` を使わず素の fetch 経路（`endpoint` + `method`）を使う。spec で `fetch` 呼び出し回数を assert |
| `maxAttempts` を過大にして管理者の待ち時間が伸びる | 低 | 同期 admin UX のため 2〜3 を上限目安にし、`maxDelayMs`（既定 2000）で backoff を抑える |
| トリガ条件（冪等 endpoint）未成立のまま着手して空振りする | 低 | §3.4 の前提依存（冪等 admin endpoint + caller の存在）が成立するまで「未実施」で待機する |

## 検証方法

> 着手は §3.4 の前提依存が成立してから。以下は新 idempotent caller を実装した後の検証手順。

### 単体検証

新 caller の spec で retry / idempotency / 既存挙動回帰を検証する（`*.spec.{ts,tsx}` のみ。`*.test.*` 禁止）。

```bash
# 新 caller の spec を直接実行（例: NewIdempotentPanel.spec.tsx）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/<新caller>.spec.tsx

# hook 本体の既存 spec が回帰していないこと（retry/idempotency TC を含む）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
```

期待:
- 新 caller spec: DELETE/PUT で 5xx → 再試行 → 成功、`Idempotency-Key` header が送出される、4xx は retry しない、を assert して PASS
- hook 既存 spec: TC-13..19 / TC-27..29 / TC-TY-01 が全 PASS（回帰なし）

### 統合検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待:
- `typecheck`: 0 error。特に新 caller が `PUT`/`DELETE` で retry を宣言できること、誤って POST/PATCH に retry を書いた場合は型エラーで検知されること
- `lint`: 0 error / 0 warning（baseline 維持）

失敗時の切り分け:
- 「retry が掛からない」→ method が PUT/DELETE か / `retryOn` が当該 status を拾うか / `mutationFn` を併用していないかを §苦戦箇所の順で確認
- typecheck で `retry` が型エラー → method が非冪等（POST/PATCH）になっている

## スコープ

### 含む

- 新規 idempotent admin caller（`PUT` / `DELETE`）での `retry` / `idempotencyKey` opt-in 宣言の追加。
- 当該 caller の既定値妥当性検討（必要時は caller 側で上書き）。
- 当該 caller の `.spec.{ts,tsx}`（retry 発火 / idempotency-key 送出 / 既存挙動回帰）。

### 含まない

- `useAdminMutation.ts` 本体の型 / overload / runtime ガード / 定数の変更（既に整備済みのため触らない）。
- **冪等 admin endpoint 自体の新規実装**（CLAUDE.md UI prototype alignment 不変条件 1「既存 API endpoint surface のみ利用」のため。endpoint 追加は別タスク。§3.4 の前提依存として外部に置く）。
- **server 側 idempotency-key の永続化 / dedupe**（→ issue-842-followup-003。client 送出と header 設計までが issue-842 の範囲で、server 永続化は明示スコープ外。retry の二重書き込み防止はこの followup に依存）。
- POST/PATCH caller への retry 適用（非冪等操作の重複実行防止のため型・runtime で禁止）。
- 公開 / 会員 mypage の mutation 経路への波及（admin scope 限定）。

---

## 関連 path / refs

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- AC-3 最適化根拠: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/phase-1-requirements.md` §4 AC-3 / §2 caller method 実測表
- issue 陳腐化最適化方針: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md`
- API シグネチャ / 使用例 / 定数一覧: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/outputs/phase-12/implementation-guide.md`
- hook 本体（retry / idempotencyKey / overload）: `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- 既存 spec（retry/idempotency TC・型レベル TC）: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- 既存 caller（全て POST/PATCH・非冪等）: `MemberDrawer` / `MeetingPanel` / `IdentityConflictRow` / `TagsQueueResolveDrawer` / `SchemaDiffPanel` / `RequestQueuePanel`（`apps/web/src/components/admin/` 配下）
- 後続依存: issue-842-followup-003（server 側 idempotency-key 永続化 / dedupe）
- CLAUDE.md 不変条件: 1「既存 API endpoint surface のみ利用」/ 5「`apps/web` から D1 直接アクセス禁止」/ 8「新規 test は `*.spec.{ts,tsx}` のみ」/ 10「admin mutation は `@/features/admin/hooks/useAdminMutation` 経由標準」
- issue-842 で確立した不変条件継承: retry は idempotent method（`PUT`/`DELETE`）限定・既定オフ
