[実装区分: 実装仕様書]

> CONST_004 判定根拠: 本サブタスク 2a は Phase 1-10 で確定した spec を実 Playwright `.spec.ts` として落とし、CI（`pnpm test:e2e`）の green 判定に直接接続する **実コード成果物**を生成する。Phase 11-13 はその実コード成果物に対する手動検証 / ドキュメント / PR 作成を扱うため、docs-only ではなく **実装仕様書** として扱う。

# Phase 11: 手動テスト（3 層評価 / NON_VISUAL）— サブタスク 2a 単体スコープ

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 対象 route | `/admin/requests` のみ（2a 単体） |
| 対象 spec | `apps/web/playwright/tests/admin-requests.spec.ts` |
| visualEvidence | `NON_VISUAL`（mock 駆動 / スクリーンショット不要） |
| 評価層 | Functional / Semantic / Visual（Visual は NON_VISUAL でスキップ可） |
| 親 phase | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-11.md` |

---

## 1. NON_VISUAL の根拠（Visual 層スキップ可能）

サブタスク 2a の主入力（`2a-admin-requests.md` §1 メタ情報）に明記されているとおり、本タスクは:

- `visualEvidence: NON_VISUAL`（mock 駆動・スクリーンショット不要）
- すべての test が `page.route()` mock で完結し、実 D1 / 実 Cloudflare Worker / 実描画パイプラインに到達しない
- OKLch トークンの可視確認は 2a 範囲外（`tokens.css` 検証は task-18 の `verify-design-tokens` CI gate が担保）

したがって本 phase の **Visual 層 (`screenshot canonical`) はスキップ可能** とし、代替 evidence で Functional / Semantic を担保する。

> 親 phase-11.md §1 のマトリクスでは `/admin/requests` に `admin-requests-mutation.png` が割り当てられているが、サブタスク 2a 単独では NON_VISUAL のためこの screenshot を **必須としない**。Stage 2 全体（2a+2b+2c+2d 統合）の Phase 11 で Visual 評価が必要になった場合に限り、後続タスクで撮影する（持越し）。

---

## 2. 3 層評価マトリクス（2a 単体）

| route | Functional | Semantic | Visual |
|-------|-----------|---------|--------|
| `/admin/requests` | 一覧表示 + approve / reject + race(409) + 認可 3 ロール | role / aria-label / heading 階層 / focus trap | **NON_VISUAL のためスキップ**（代替 evidence で担保） |

---

## 3. 代替 Evidence（NON_VISUAL 用）

Visual 層をスキップする代わりに、以下の機械的 evidence を `outputs/phase-11/` 配下に保管する。

| # | evidence 種別 | 保存パス | 取得コマンド | 必須/任意 |
|---|--------------|---------|------------|----------|
| 1 | Playwright reporter HTML | `outputs/phase-11/playwright-report/` | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts --reporter=html` | 必須 |
| 2 | Playwright JSON 結果 | `outputs/phase-11/results.json` | `--reporter=json --output=outputs/phase-11/results.json`（または環境変数 `PLAYWRIGHT_JSON_OUTPUT_NAME`） | 必須 |
| 3 | trace（race test 4 のみ） | `outputs/phase-11/trace-test-4.zip` | `--trace=on-first-retry`（test 4 で retry 走った場合のみ自動生成） | 任意 |
| 4 | network log（HAR） | `outputs/phase-11/admin-requests.har` | `context.recordHar({ path: ... })`（再現確認時のみ手動採取） | 任意 |
| 5 | typecheck 出力 | `outputs/phase-11/typecheck.txt` | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck \| tee outputs/phase-11/typecheck.txt` | 必須 |
| 6 | lint 出力 | `outputs/phase-11/lint.txt` | `mise exec -- pnpm lint \| tee outputs/phase-11/lint.txt` | 必須 |

> 評価記録は `outputs/phase-11/report.md` に Functional / Semantic の pass/fail を 1 行ずつ記す。Visual は `NON_VISUAL` と明記する。

---

## 4. 手動テストシナリオ（Functional / 2a 単体）

親 phase-11.md §3.1 を 2a 単体に縮約。spec の自動 test と同じ 6 ケースを手動再現できる手順として記す（Playwright 自動実行が green であれば手動実施は省略可。fail 時の root cause 解析にのみ使用）。

| step | 操作 | 期待 |
|------|------|------|
| 1 | admin login → `/admin/requests` 訪問 | pending list 3 件表示（fixture 準拠） |
| 2 | 任意 row の approve ボタン押下 | 該当行 DOM から消失、POST body に `{ resolution: 'approve' }` |
| 3 | 別 row の reject ボタン → modal 空 submit | inline error 可視 |
| 4 | reject modal に reason 入力 → submit | POST body に `{ resolution: 'reject', resolutionNote: <input> }`、行消失 |
| 5 | stale な pending row の approve を実行 | 1 回目 200、2 回目 409 `already_resolved` を toast/alert で観測 |
| 6 | member 認証で `/admin/requests` 訪問 | `/login?gate=admin_required` redirect、admin 専用 row 不可視 |
| 7 | 未ログインで `/admin/requests` 訪問 | URL に `/login` を含む |

---

## 5. Semantic 評価チェック（2a 単体）

| 観点 | チェック | 検証手段 |
|------|---------|---------|
| heading 階層 | `h1` が 1 件、`h2` 以下が論理順 | `getByRole('heading', { level: 1 })` で 1 件 |
| role | row / button / alertdialog（reject modal）が適切 | `getByRole('row')` 件数、`getByRole('alertdialog')` |
| aria-label | approve / reject button にラベル | `getByRole('button', { name: /approve|reject/i })` |
| focus trap | reject modal 内で Tab 循環、Esc で close | 自動 test 推奨だが本サブタスクではスコープ外（持越し） |
| keyboard nav | Enter で submit | 自動 test 推奨だが本サブタスクではスコープ外（持越し） |

> spec の §4 test 構造には focus trap / keyboard nav の test は含めない（2a-admin-requests.md §8 テスト方針 6 件確定）。Semantic 全項目の自動化は Stage 3 持越し候補とする。

---

## 6. Visual 評価チェック（NON_VISUAL のためスキップ）

| 観点 | 判定 |
|------|------|
| OKLch tokens / HEX 直書き | spec 内 selector に色値依存なし（DoD §10-7 で機械検証） |
| destructive token | reject button の destructive 適用 — Visual スキップ |
| spacing rhythm | Visual スキップ |
| hover/focus | Visual スキップ |

> 本セクションは「スキップした旨と根拠」を記録する目的でのみ存在する（CLAUDE.md PR 本文ルール「画像がない場合は Screenshot セクションを作らない」に整合）。

---

## 7. 評価記録テンプレ（`outputs/phase-11/report.md`）

```text
[sub-task 2a manual evidence @ 2026-05-09]
target: apps/web/playwright/tests/admin-requests.spec.ts
visualEvidence: NON_VISUAL

- /admin/requests:
  - Functional: <pass|fail>（test 1..6 / Playwright reporter 参照）
  - Semantic:   <pass|fail>（role / aria-label / heading 階層）
  - Visual:     SKIP（NON_VISUAL）

evidence files:
- outputs/phase-11/playwright-report/index.html
- outputs/phase-11/results.json
- outputs/phase-11/typecheck.txt
- outputs/phase-11/lint.txt
```

---

## 8. Phase 11 完了定義

- [x] NON_VISUAL の根拠（§1）が 2a-admin-requests.md §1 から引用されている
- [x] 3 層評価マトリクス（§2）が 2a 単体に縮約されている
- [x] 代替 evidence（§3）に Playwright reporter / JSON / typecheck / lint の保管手順がある
- [x] Functional シナリオ（§4）が spec §4 の 6 test と 1:1 対応
- [x] Semantic チェック（§5）が role / aria / heading を網羅
- [x] Visual スキップ（§6）の根拠が明記
- [x] 評価記録テンプレ（§7）が NON_VISUAL を明示

> Phase 12 へ進める。

---

## 参照

| 用途 | path |
|------|------|
| 主入力（仕様書） | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 親 Phase 11 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-11.md` |
| spec 対象 | `apps/web/playwright/tests/admin-requests.spec.ts`（新規） |
| fixture | `apps/web/playwright/fixtures/auth.ts:1-67` |
