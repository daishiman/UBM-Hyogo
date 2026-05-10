# Phase 2: 設計

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-08

## 1. assertion 戦略マトリクス

| サブタスク | 戦略 | 採否 | 理由 |
|-----------|------|-----|------|
| 1a | Fixture exact match (`not.toContainText(LEAK_PROBE_EMAIL)`) | 採用 | 既知 sentinel に対する確定的 regression-guard。低 flakiness。 |
| 1a | DOM regex probe (`not.toContainText(/@/)`) | 補助採用 | sentinel が seed されない環境でも「@ 完全不在」で第二防衛線。 footer 等の `@` 表現があれば後段で許可リスト化。 |
| 1a | API mock で `responseEmail` を含む payload 注入 | 不採用 | public route は server-rendered で API mock が効かない可能性が高く、また MSW 相当が public flow では未整備。実 fixture seed の方が代表性が高い。 |
| 1b | `page.route('**/api/me', ...)` で復帰時 state を mock | 採用 | 既存テストで `page.route` が確立済（`profile-visibility-request.spec.ts:11`）。実 D1 不要で deterministic。 |
| 1b | 実 D1 seed → 202 後のサーバー実応答 | 不採用 | E2E smoke では D1 binding を mock 構成、再現コスト過大。 |
| 1b | localStorage 直接書き込み | 不採用 | 「server 正本性」を検証する目的に反する（in-memory state を bypass しない）。 |

## 2. test data ownership

| データ | owner | 保管場所 | 用法 |
|--------|-------|---------|------|
| `LEAK_PROBE_EMAIL` | spec ファイル内 const | `public-flow.spec.ts` 冒頭 | sentinel email |
| `memberPage` cookie | `auth.ts` fixture | `apps/web/playwright/fixtures/auth.ts:32` | profile spec の auth 文脈 |
| `m-1` member fixture | `d1-seed.ts` | 既存 seed | public detail route の対象 |
| `/api/me` mock response | spec 内 helper `mockMeWithPending(page, type)` | 各 profile spec ファイル冒頭 | 1b 復帰時の state 注入 |

### `mockMeWithPending` helper 仕様（spec 内 inline 定義）

| 項目 | 内容 |
|------|------|
| 引数 | `(page: Page, type: 'visibility_request' \| 'delete_request')` |
| 副作用 | `page.route('**/api/me', ...)` を登録、`pendingRequests: [{queueId, type, status:'pending', createdAt}]` を含む 200 を fulfill |
| 解除 | test 終了時に Playwright が自動 unroute（明示 `unroute` は不要） |
| reuse 範囲 | spec ファイル内のみ（global util 化は本サイクルでは不採用＝ CONST_007 単一サイクル原則） |

## 3. round-trip ナビゲーション設計（1b）

```
[memberPage.goto('/profile')]
   ↓ submit (202 mock)
[expect data-pending-type 表示]
   ↓ goto('/')                ← round-trip 発火
[landing render]
   ↓ goto('/profile') 再訪問
   ↓ GET /api/me → mock(pending=true) を fulfill
[expect data-pending-type 依然 visible]   ← 本サイクル新規 assertion
```

| 設計判断 | 値 | 理由 |
|---------|----|------|
| 中間 route | `/` | login gate に阻まれない / DOM が軽量 |
| `GET /api/me` mock 登録タイミング | submit 直後（round-trip 発火前） | 復帰時 fetch を確実に捕捉 |
| `POST /api/me/visibility-request` mock | 既存と同じ 202 | round-trip 後の **second** post は発生しないため再 mock 不要 |
| `expect.poll` の利用 | 不採用 | `toBeVisible()` の標準 wait で十分 |

## 4. reuse 分析

| 既存資産 | 1a 利用 | 1b 利用 | 備考 |
|---------|---------|---------|------|
| `HomePage` / `MembersListPage` / `MemberDetailPage` | yes | — | `public-flow.spec.ts:4-7` |
| `auth.ts` `memberPage` fixture | — | yes | `auth.ts:48` |
| `auth.ts` `anonymousPage` fixture | yes | — | landing/members は未認証想定 |
| `[data-pending-type]` selector | — | yes | 既存 TC-E-01 / TC-E-03 と一致 |
| `page.route` mock 用法 | — | yes | 既存 `profile-*-request.spec.ts` に倣う |
| AxeBuilder | — | — | 本サイクルでは a11y 拡張対象外 |

## 5. regression-guard メカニズム

| guard | 仕組み | 検出する regression |
|-------|--------|-------------------|
| sentinel email exact match | `expect(body).not.toContainText(LEAK_PROBE_EMAIL)` | API/UI 改修で response email が誤って public payload に流出 |
| `/@/` regex probe | `expect(body).not.toContainText(/@/)` | sentinel 以外の任意 email リテラル混入（dev コメント、admin email 露出） |
| navigate round-trip | `goto('/') → goto('/profile')` 後に pending visible | クライアント memory state にしか pending を保持していない bug（refresh / back navigation で消える ux 不具合） |
| API mock 強制 | `GET /api/me` mock fulfilled | サーバ駆動 state 経路が hook されていることを確認 |

## 6. 失敗モード→assertion マッピング

| failure-mode | サブタスク | 主 assertion |
|-------------|-----------|------------|
| public route で `responseEmail` 流出 | 1a | sentinel exact match |
| 任意 email 文字列の偶発露出 | 1a | `/@/` probe |
| pending state を再訪問で見失う | 1b | round-trip `toBeVisible` |
| サーバ正本を fetch していない | 1b | `/api/me` mock が hit する前提下での assertion 成立 |

## 7. CONST_007 単一サイクル整合

| 項目 | 整合性 |
|------|--------|
| 触る spec ファイル数 | 3（既存ファイルのみ） |
| 新規ファイル | 0 |
| production code 変更 | 0 |
| 新規 endpoint / schema | 0 |
| critical route 範囲 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/profile` のみ（top-5 critical 内） |

## 8. 未解決事項（Phase 3 入力）

| 項目 | 解消手段 |
|------|---------|
| `GET /api/me` 実 response shape | Phase 4 で `apps/web/src/app/profile/page.tsx`（または対応 client component）を確認、shape 確定 |
| `LEAK_PROBE_EMAIL` を fixture seed に追加するか spec 内定数に留めるか | Phase 4: 後者（spec 内定数）を既定とし、後続 stage で seed 拡張 |
| `/@/` probe の許可リスト要否（footer 等） | Phase 8 動的検証時に flaky 観測されたら sentinel-only に縮退 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 2
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 12 evidence に反映し、Phase 11 は実行ログ・skip count・runner version として分離する。

## 統合テスト連携

- NON_VISUAL implementation phase は Playwright assertion 差分、spec completeness、grep gate、artifact parity を検証する。
- E2E runtime 実行結果は outputs/phase-11/evidence に保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- apps/web/playwright/tests/public-flow.spec.ts、profile-visibility-request.spec.ts、profile-delete-request.spec.ts の assertion 差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

