# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

Phase 2 設計に対する不変条件適合性・リスク・依存タスク整合性をレビューし、
Phase 4（詳細設計）に進む可否を判定する。

## 1. 不変条件マトリクス

| ID | 不変条件 | Phase 2 設計での担保 | 判定 |
|----|----------|----------------------|------|
| INV-01 | 既存 API endpoint surface のみ | review で `apps/web` detail page が依存する `GET /admin/meetings/:id` が API 本体に欠落していることを検出したため、既存 document/API surface と一致する detail read route を同一 wave で追加する。mutation surface は既存 `/attendances` を維持 | PASS |
| INV-02 | D1 直接アクセス禁止 | mock は HTTP server 経由のみ。`apps/web` SSR は `INTERNAL_API_BASE_URL` 経由で mock に到達する設計 | PASS |
| INV-03 | OKLch tokens 正本 | UI 変更は `data-testid` 追加のみで色・スタイル変更なし。`verify-design-tokens` を AC-8 で確認 | PASS |
| INV-04 | `TODO(08b)` 解消 + skip 不在 | `attendance.spec.ts` を 4 test に書き換え、`test.skip` 不使用を明記 | PASS |
| INV-05 | `*.spec.ts` のみ | 新ファイル `admin-meetings.ts` (fixture builder) は test ではないため対象外。spec 追加は既存 `attendance.spec.ts` のみ | PASS |
| INV-06 | baseline 画像更新 user-gated | screenshot は `outputs/phase-11/screenshots/` に保存し `*-snapshots/` には組み入れない。Phase 2 §6.1 / §10 で明記 | PASS |
| INV-07 | Phase 1-13 を 1 サイクル | Phase 2 で全ファイル列挙・全 AC 検証手段が確定。先送り項目なし | PASS |
| INV-08 | mock 二重実装禁止 | standalone mock のみを single source of truth とし、`page.route()` を使わない（Phase 2 §5） | PASS |
| INV-09 | `provenance: local-mock` 明記 | `phase11-capture-metadata.json` schema で固定（Phase 2 §6.3） | PASS |
| INV-10 | tracked `.txt` / `.json` 限定 | evidence 命名はすべて `.png` / `.txt` / `.json` / `.md` / `.zip`。`.log` 不使用 | PASS |

## 2. リスクと緩和策

| # | リスク | 影響 | 緩和策 |
|---|--------|------|--------|
| R-1 | `MeetingPanel.tsx` への `data-testid` 追加が visual baseline diff を引き起こす | task-18 visual 17 routes baseline と衝突 | Phase 11 で focused Playwright screenshot と design-token gate を確認。万一 visual baseline 更新が必要な場合は INV-06 により user 承認後に `--update-snapshots` を実行する |
| R-2 | standalone mock の `/admin/meetings/:id` が他 spec（admin-pages.spec.ts 等）の挙動に影響 | smoke project の他テストが赤化 | `mockApi.reset()` を `test` beforeEach で呼ぶ既存設計を維持。default seed を空にすると他 spec が壊れる可能性 → admin-meetings 領域は **空 default + 各 test で seedMeetings 明示呼び出し**にする |
| R-3 | SSR `fetchAdmin<MeetingDetail>` が standalone mock に到達できない（`INTERNAL_API_BASE_URL` 設定漏れ） | detail page が 404 で screenshot が破綻 | Phase 4 で `apps/web/src/lib/admin/server-fetch.ts` の base URL 解決を確認し、`playwright.config.ts#webServer.env.INTERNAL_API_BASE_URL=http://127.0.0.1:8787` 設定の有無を verify。なければ Phase 5 で追加 |
| R-4 | duplicate add の挙動が「即 toast」（CSR 側 `registered.has` 早期 return）で 409 path を通らない | AC-3 evidence が API 409 ではなく CSR 早期 return の screenshot になる | Phase 2 仕様で **AC-3 は CSR 楽観更新側の toast を evidence と認める**（既登録判定の二重防御）。API 409 path の検証は contract spec (`meetings.contract.spec.ts:214`) で既に担保済 |
| R-5 | Playwright trace が CI artifact size limit を超える | upload 失敗 | `--trace on` を attendance spec 単体に限定し、AC-4 だけで使用 |
| R-6 | `mockApi.seedMeetings` 制御 endpoint と既存 `/__test__/reset` の責務が混線 | mock state drift | Phase 4 で endpoint contract を明文化（`/__test__/reset` は all-clear、`/__test__/seed-meetings` は attendance 領域のみ上書き） |
| R-7 | CI smoke で `attendance.spec.ts` が現状 skip / fixme なしで実行されると mock 不足で失敗していた可能性 | 既存 CI が green であった理由を確認要 | Phase 5 で `git log` / 既存 CI run を確認。skip 不在で green なら mock も既に整っている可能性。要事前確認 |

## 3. 依存タスク整合性

| 依存タスク | 整合性 | 備考 |
|------------|--------|------|
| 06c admin UI | OK | `MeetingPanel.tsx` / `MeetingAttendancePanel.tsx` の `data-testid` 追加は 06c の責務範囲外。本タスク edit に含めて整合 |
| 07c attendance audit API | OK | API 変更なし。mock は contract shape を模倣 |
| 08b Playwright E2E | OK | 同 e2e suite (`apps/web/playwright/tests/`) に追加。命名規約一致 |
| task-18 visual regression | 要確認 | R-1 と同じ論点。Phase 11 で 17 routes baseline の diff=0 を evidence 化 |
| 09a staging smoke | OK | local mock screenshot は 09a staging fresh evidence で **置換**される計画を `staging_replacement_plan` に記録（Phase 2 §6.3） |

## 4. Phase 2 設計の妥当性チェック

### 4.1 CONST_005（実装可能粒度）

| 必須要素 | Phase 2 該当節 | 充足 |
|----------|---------------|------|
| 変更対象ファイル全列挙 | §2 | YES |
| 関数シグネチャ | §3 | YES |
| spec 名・viewport | §4 | YES |
| mock API URL / body schema | §5 | YES |
| evidence canonical path | §6 | YES |
| 1 行実行コマンド | §7 | YES |
| CI 配線方針 | §8 | YES |
| DoD | §9 | YES |
| ロールバック | §10 | YES |

→ 実装着手可能。

### 4.2 CONST_007（先送り禁止）

- detail page の delete UI 実装を保留したが、これは「未実装機能の追加」ではなく、AC-4 を list page で達成する設計選択。スコープ外送りではない（D-1 で確定）
- baseline 更新を user-gated にした件は INV-06 由来で、本タスクが触らない正しい boundary。先送りではない

→ 先送り該当なし。

### 4.3 quality-gates §7.1（テスト常時実行可能性）

| 要件 | Phase 2 該当 | 充足 |
|------|--------------|------|
| 対象 spec ファイル列挙 | §9 DoD | YES (`apps/web/playwright/tests/attendance.spec.ts`) |
| 1 コマンド実行 | §7 | YES |
| pre-requisite | §7 | YES |
| un-skip 不変条件 | §9 / INV-04 | YES |

### 4.4 phase-11-screenshot-guide §「local mock-screenshot 経路」

| 条件 | 充足 |
|------|------|
| staging 別タスク分離・user 承認済み | YES (09a) |
| standalone mock のみ | YES (§5) |
| SSR 経路も standalone mock | R-3 で Phase 4 verify 予定 → 条件付き YES |
| `provenance: local-mock` 明記 | YES (§6.3) |

## 5. 指摘事項（Phase 4 への申し送り）

| # | 指摘 | 対応 |
|---|------|------|
| F-1 | R-3: `INTERNAL_API_BASE_URL` の現状確認が Phase 2 で未実施 | Phase 4 冒頭で `playwright.config.ts` と `server-fetch.ts` を読み込み、SSR fetch が `127.0.0.1:8787` に到達するかを確認。到達しなければ config 追加を Phase 5 計画に組み込む |
| F-2 | R-2: 他 spec への影響範囲未確認 | Phase 4 で `git grep -l "/admin/meetings" apps/web/playwright/tests/` を実行し、影響範囲を把握 |
| F-3 | R-7: 現状 `attendance.spec.ts` の CI 挙動 | Phase 4 で 直近 main / dev の playwright-smoke run を確認し、green / fail のどちらか把握 |
| F-4 | Phase 11 metadata の `staging_replacement_plan.owner` is fixed to `task-09a-staging-deploy-smoke` | 09a staging smoke を owner として固定 |
| F-5 | coverage 計測手段（monocart 等）が `apps/web` で既に動いているか | Phase 4 で `apps/web/package.json` / `playwright.config.ts` を確認。導入済みなら DoD §9 通り運用、未導入なら範囲を明確化（本タスクで導入するか、unassigned-task に切り出すか Phase 4 判断） |

## 6. レビュー判定

**判定: 条件付き PASS**

- Phase 2 は CONST_005 / CONST_007 / quality-gates §7 / phase-11-screenshot-guide 規約をすべて満たす
- ただし F-1〜F-5 を Phase 4 で解決することを条件とする
- F-3 / F-5 の調査結果次第で Phase 5 実装計画に追加 step が発生する可能性あり

## 7. 次フェーズ（Phase 4）への引き継ぎ

Phase 4（詳細設計）で実施すべきこと:

1. F-1: `INTERNAL_API_BASE_URL` 確認・必要なら `playwright.config.ts` 修正案を盛り込む
2. F-2: `/admin/meetings` 参照箇所の影響範囲確認
3. F-3: 直近 CI run 確認
4. F-5: coverage 計測手段の現状確認
5. mock state の type 定義（TypeScript interface 完全形）の確定
6. spec 4 test の test 本文擬似コード化（実装直前粒度）
7. `MeetingPanel.tsx` への `data-testid` 追加 diff（行単位）の確定

以上を満たした上で Phase 5 実装計画へ進む。
