# Phase 3: 設計レビュー（4-condition gate）— サブタスク 2a `/admin/requests` E2E

> **[実装区分: 実装仕様書]**
>
> CONST_004 判定根拠: Phase 1 / Phase 2 と同じく、レビュー対象は Playwright `.spec.ts` の
> 設計（CI 実行対象のランタイム成果物）であり、出力が実コードに直接接続するため
> 実装仕様書として作成する。

---

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| workflow_id | `task-spec-2a-admin-requests-e2e` |
| Phase | 3（設計レビュー） |
| 対象 | sub-task 2a 単体 |
| レビュー日 | 2026-05-09 |
| 実装区分 | **実装仕様書**（CONST_004） |

---

## 2. 4-condition gate（判定）

| # | 条件 | 判定 | 根拠 |
|---|------|------|------|
| C1 | 単一責務（CONST_007） | **OK** | sub-task 2a は `/admin/requests` の mutation flow + 認可境界の単一責務に閉じている。2b（identity-conflicts）/ 2c（member-delete）/ 2d（contract）と直交、重複なし |
| C2 | 不変条件遵守（CLAUDE.md UI alignment 1-5 + Stage 2 横断 4 件） | **OK** | 既存 fixture 再利用 / 新 endpoint なし / D1 直接アクセスなし / token 直書きなし / `page.route()` 限定 / 新 fixture 禁止 / `test.skip` 0 件、すべて Phase 1 §12 / Phase 2 §12 で適合確認済 |
| C3 | 受け入れ基準が観測可能 | **OK** | AC1-AC10 全件が `wc -l` / Playwright reporter / spec inspect / grep / tsc / ESLint で機械検証可能（Phase 1 §5 / §11） |
| C4 | 依存（Stage 1）が明示 | **OK** | Stage 1（admin smoke + `signSession()` 活性化）完了済を Phase 1 §4 / §13 で明示。`adminPage` / `memberPage` / `anonymousPage` の 3 fixture 利用可確認 |

---

## 3. sub-task 2a GO / NO-GO

| 観点 | 判定 | 根拠 |
|------|------|------|
| API endpoint 実在 | **OK** | `apps/api/src/routes/admin/requests.ts:194,254`（GET / POST resolve） |
| UI route 実在 | **OK** | `apps/web/app/(admin)/admin/requests/page.tsx` |
| シナリオ 6 件すべて mock 戦略あり | **OK** | Phase 2 §5 で M1-M4 必須 + M5/M6 任意を確定 |
| race 検証の決定論性 | **OK** | stale 409 mock（test 4 内 closure）で 1 回目 200 / 2 回目 409 を機械的に再現 |
| 認可 3 ロール分岐 | **OK** | `adminPage` / `memberPage` / `anonymousPage` の既存 fixture で network 不要 |
| `test.skip` 不使用 | **OK** | Phase 2 §4 で 0 件確定。cascade preview の skip は 2c のみ |
| 新 endpoint / 新 fixture / D1 schema 変更 | **0 件** | Phase 2 §12 |
| 主入力（`2a-admin-requests.md`）との整合 | **OK** | §1-§14 のうち 2a 単体スコープ全項目が Phase 1 / Phase 2 に反映 |
| **判定** | **GO** | 条件付きなし |

---

## 4. governance index 正本補正事項との関係（2a 関連のみ）

governance index `index.md` §正本補正事項のうち、本サブタスク 2a に関連する項目を以下に整理する。

| 補正事項 | 2a への影響 | 対応 |
|---------|-------------|------|
| §1 merge response shape の正本訂正（2b ↔ 2d） | **無関係** | 2b の `MergeIdentityResponseZ` に関する補正であり、2a は merge を扱わない。Phase 2 §6 の fixture object 設計指針 5 で `mergedMemberId` 不使用を明示済 |
| §2 route 側 zod schema の named export（`ListQueryZ` (requests)） | **間接的に関連**（2d 起点の 1 行修正） | `apps/api/src/routes/admin/requests.ts` の `ListQueryZ` を named export 化する 1 行修正は 2d contract test の前提であり、2a spec 自体には影響しない（mock 駆動のため）。2a 実装は本 export 化の有無に関わらず独立で green 化可能 |

> 結論: 2a は governance 補正事項に**ブロックされない**。route 側 named export 化は 2d 実装時に併せて行う想定で、2a spec の green 化と並列実行可能。

---

## 5. Open Questions（後続フェーズへの申し送り）

親 workflow `phase-3.md` §Open Questions のうち、2a に関連する Q1 を再掲し、本サブタスクの取り扱いを明示する。

| # | 問い | 解決状態 | 受け先 / 取り扱い |
|---|------|---------|------------------|
| Q1 | `requireAdmin` middleware が member 認証 cookie に対して 403 を返すか、`/login` redirect か | **解決済**（親 workflow Phase 4 §1） | API は 401/403 JSON、UI 側で member は `/login?gate=admin_required` redirect、anonymous は `/login` redirect。Phase 1 §4 Pre-condition 5 / Phase 2 §9 R5 に反映済 |
| Q2-Q6 | 2b / 2c / 2d 関連 | — | 本サブタスク対象外 |

> 2a 単体スコープでは Open Question 残課題は **0 件**。

---

## 6. リスク再点検（Phase 2 §9 リスト → 緩和済か確認）

| # | リスク | 緩和策の確度 | 残課題 |
|---|--------|-------------|--------|
| R1 | UI の query / path 不一致 | URL pattern を `**/admin/requests*` で許容、実装フェーズで実 UI 確認 | なし |
| R2 | `signSession()` placeholder | Stage 1 完了で活性化済（前提条件） | なし |
| R3 | reject modal の selector miss | `getByRole('dialog')` 第一選択 + `data-testid` fallback | なし |
| R4 | race 通知文言の不確定 | `getByRole('alert')` ベースで assertion、文言は補助 | なし |
| R5 | `requireAdmin` 挙動分岐 | Phase 4 で確定済（Q1 解決） | なし |
| R6 | stale 409 mock の closure リーク | counter は test 内 closure 限定 | なし |

> R1-R6 全件で緩和策が Phase 2 設計に組み込まれており、残課題なし。

---

## 7. Stage 全体 / 2a 単体の verdict

> **GO（条件なし）**

| 観点 | 判定 |
|------|------|
| C1-C4 4-condition gate | 全 OK |
| sub-task 2a GO/NO-GO | GO |
| governance 正本補正事項との衝突 | なし |
| Open Question 残課題 | 0 件 |
| リスク残課題 | 0 件 |

> Phase 4（実装フェーズ）以降、本仕様書の Phase 1 §6 / Phase 2 §8 を起点に
> `apps/web/playwright/tests/admin-requests.spec.ts` を新規作成し、Phase 1 §11 DoD（10 項目）に沿って green 化を確認する。

---

## 8. 完了条件（Phase 3 観点）

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | 4-condition gate（C1-C4）が全 OK 判定 | §2 表 |
| 2 | sub-task 2a の GO/NO-GO が GO（条件なし） | §3 表 |
| 3 | governance 正本補正事項との関係が整理され、2a 単体への影響が「なし」と確定 | §4 表 |
| 4 | Open Question 残課題が 0 件 | §5 表 |
| 5 | リスク R1-R6 全件で緩和策が確定し、残課題 0 件 | §6 表 |
| 6 | 不変条件 1-5 + Stage 2 横断（page.route() 限定 / 新 fixture 禁止 / 新 endpoint 禁止 / test.skip 禁止）が遵守 | Phase 1 §12 / Phase 2 §12 へのリンク |

---

## 9. 参照

| 用途 | path |
|------|------|
| 主入力 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| governance index | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/index.md` |
| 親 workflow Phase 3 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-3.md` |
| 本仕様書 Phase 1 | `docs/30-workflows/task-spec-2a-admin-requests-e2e/phase-1.md` |
| 本仕様書 Phase 2 | `docs/30-workflows/task-spec-2a-admin-requests-e2e/phase-2.md` |
| API 実装 | `apps/api/src/routes/admin/requests.ts:194,254` |
| fixture 正本 | `apps/web/playwright/fixtures/auth.ts:1-67` |
| UI alignment 不変条件 | `CLAUDE.md` § UI prototype alignment / MVP recovery |
