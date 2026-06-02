# Phase 11: マニュアルテスト

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 11 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| visualEvidence | VISUAL_ON_EXECUTION |
| runtime evidence | **PENDING_RUNTIME_EVIDENCE（staging user-gated）** |
| 前提 | Phase 1-10 完了 |

## 目的

Task A は admin UI（`/admin/sync-status` の backfill パネル）であり、screenshot 取得は
**staging 認証必須 → user-gated**。本サイクルでは静的 screenshot を取得しない。
インタラクション状態テーブルと手動テスト手順、screenshot 取得計画を evidence として定義し、
runtime evidence は後続 staging（Task B proxy 注入完了後）で取得する pending とする。

## VISUAL_ON_EXECUTION の扱い

- 本タスクは VISUAL_ON_EXECUTION（実行時に視覚要素を持つが、本サイクルでは静的描画証跡を撮らない）。
- 理由:
  1. 描画には admin login（staging）が必須で、CONST_002 により screenshot は user-gated。
  2. backfill endpoint は proxy の `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` server-only 注入に依存し（NO-GO-1）、その注入は Task B に集約。Task B 完了後の staging でのみ runtime 描画が成立する。
- したがって verdict は **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**。`outputs/phase-11/` は deterministic plan evidence と pending runtime boundary を分離して記録する。

## インタラクション状態テーブル

| # | 状態 | トリガ | 期待描画 |
|---|------|--------|----------|
| ST-1 | dry-run 初期 | パネル mount 直後 | `AdminSectionCard`（title="公開状態 backfill"）+ dry-run ボタン（`variant="soft"`, enabled）+ apply ボタン（`variant="danger"`, **disabled**）。結果 `<dl>` 非表示。error 非表示 |
| ST-2 | 結果表示（dry-run） | dry-run 押下 → 200 + 検証成功 | `<dl>` に `mode=dryRun` / `scanned` / `candidates` / `applied(=0)` / `skipped.*` × 4 を描画。apply は `candidates>0` のとき enabled |
| ST-3 | apply disabled | dry-run 未実行 または `candidates===0` | apply ボタン `disabled`（`canApply===false`） |
| ST-4 | apply 実行 | apply 押下 → confirm OK → 200 | `<dl>` に `mode=apply` / `applied`（昇格件数）を描画。`onApplied` 通知発火 |
| ST-5 | error（HTTP） | dry-run/apply で HTTP error | `<p role="alert">` に `mutation.error.message`。結果 `<dl>` 非描画 |
| ST-6 | parseError（schema mismatch） | レスポンスが `BackfillResultSchema` に不適合 | `<p role="alert">` に `"backfill result schema mismatch"`。結果 `<dl>` 非描画。`parseError` が `mutation.error` より優先 |
| ST-7 | pending | dry-run/apply 実行中 | 両ボタン `disabled={mutation.isLoading}`。実行中モード側ボタンのみ `loading`（in-flight 中の `activeMode` 基準：dry-run 実行中なら `activeMode !== "apply"`、apply 実行中なら `activeMode === "apply"`）。完了済み `mode` ではなく `activeMode` を使うことで、押下したボタンだけが busy 表示になる |

> 各状態は jsdom 単体テスト（TC-A1..A7）で挙動検証済み。本テーブルは staging での目視確認の期待描画を定義する。

## 手動テスト手順（staging / user-gated）

`outputs/phase-11/manual-test-plan.md` を正本とする。要約:

1. admin として staging にログインする。
2. `/admin/sync-status` を開き、ページ末尾に「公開状態 backfill」カードが表示されることを確認（ST-1）。
3. dry-run ボタンを押下し、`scanned/candidates/skipped` の `<dl>` が描画されることを確認（ST-2）。DB が無変更であることを別系統（members 一覧の publish_state）で確認。
4. dry-run の `candidates>0` を確認後、apply ボタンが enabled になることを確認（ST-3 の解除）。
5. apply ボタンを押下し、confirm ダイアログで OK を選択（ST-4）。`applied` 件数が表示され、対象会員が public へ昇格したことを members 一覧で確認。
6. confirm をキャンセルした場合は no-op（TC-A2c 相当）であることを確認。
7. 異常系: endpoint を 5xx に擬似させ `role="alert"` 表示（ST-5）、不正レスポンスで `parseError`（ST-6）を確認。

## screenshot 取得計画（後続 staging）

`outputs/phase-11/screenshot-plan.json` を正本とする。撮影予定画面:

| id | 画面 | status |
|----|------|--------|
| `backfill-panel-initial` | ST-1（初期：apply disabled） | pending |
| `backfill-dry-run-result` | ST-2（dry-run 結果 dl） | pending |
| `backfill-apply-result` | ST-4（apply 結果 applied 件数） | pending |
| `backfill-error` | ST-5 / ST-6（alert 表示） | pending |

> 全 status=`pending`。本サイクルでは実 png を撮らない（staging user-gated）。

## evidence ファイル（outputs/phase-11/）

| ファイル | 内容 | ステータス |
|---------|------|-----------|
| `outputs/phase-11/main.md` | evidence index（VISUAL_ON_EXECUTION / runtime pending 明記） | present |
| `outputs/phase-11/manual-test-plan.md` | 手動テスト手順 | present |
| `outputs/phase-11/interaction-states.md` | 状態テーブル（ST-1..ST-7） | present |
| `outputs/phase-11/screenshot-plan.json` | 撮影予定画面 JSON（全 pending） | present |
| `outputs/phase-11/manual-smoke-log.md` | staging manual smoke の pending boundary | present |
| `outputs/phase-11/link-checklist.md` | local link checklist | present |

> 実 png は本サイクルで作成しない。runtime evidence は Task B proxy 注入完了後の staging で取得。

## 参照資料

| 参照 | パス |
|------|------|
| 依存 Phase 1 成果物 | `./phase-1.md` |
| 依存 Phase 2 成果物 | `./phase-2.md` |
| 依存 Phase 5 成果物 | `./phase-5.md` |
| 依存 Phase 6 成果物 | `./phase-6.md` |
| 依存 Phase 7 成果物 | `./phase-7.md` |
| 依存 Phase 8 成果物 | `./phase-8.md` |
| 依存 Phase 9 成果物 | `./phase-9.md` |
| 依存 Phase 10 成果物 | `./phase-10.md` |
| 最終レビュー | `./phase-10.md`（AC マッピング / NO-GO） |
| 設計 UI 構造 | `./phase-2.md` |
| 実装 | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` |
| page mount | `apps/web/app/(admin)/admin/sync-status/page.tsx` |

## 実行タスク

1. インタラクション状態テーブル（ST-1..ST-7）を evidence として固定する。
2. staging 用の手動テスト手順を作成する。
3. screenshot 取得計画を pending 状態で作成する。
4. manual smoke / link checklist を deterministic plan evidence として作成する。
5. runtime evidence pending が user-gated であることを明記する。

## 実行手順

1. インタラクション状態テーブル（ST-1..ST-7）を `outputs/phase-11/interaction-states.md` に固定。
2. 手動テスト手順を `outputs/phase-11/manual-test-plan.md` に固定。
3. screenshot 取得計画を `outputs/phase-11/screenshot-plan.json`（全 pending）に固定。
4. evidence index を `outputs/phase-11/main.md`（VISUAL_ON_EXECUTION / runtime pending 明記）に固定。
5. manual smoke log と link checklist を deterministic plan evidence として固定。
6. 本サイクルで実 png を撮らないこと（staging user-gated）を全 evidence に明記。

## 統合テスト連携

- 各 ST 状態は jsdom 単体テスト（TC-A1..A7）が挙動を担保し、staging での目視は期待描画の最終確認。
- runtime evidence は Task B 完了後の staging で取得（pending）。

## 多角的チェック観点（AIが判断）

- ST-6（parseError）が ST-5（HTTP error）より表示優先される（`parseError ? ... : mutation.error ? ...`）ことを目視で再確認できるか。
- ST-3 の apply disabled が `candidates===0` でも維持されるか（dry-run しても候補 0 なら apply 不可）。
- runtime pending を「未完」ではなく「user-gated による意図的 defer」として evidence に明記できているか。

## サブタスク管理

| ID | 内容 | ステータス |
|----|------|-----------|
| MT-1 | インタラクション状態テーブル（ST-1..ST-7） | present |
| MT-2 | 手動テスト手順 | present |
| MT-3 | screenshot 取得計画（全 pending） | present |
| MT-4 | evidence index（runtime pending 明記） | present |
| MT-5 | manual smoke log / link checklist | present |

## 成果物

- 本マニュアルテストファイル。
- `outputs/phase-11/main.md` / `manual-test-plan.md` / `interaction-states.md` / `screenshot-plan.json` / `manual-smoke-log.md` / `link-checklist.md`。

## 完了条件

- [x] VISUAL_ON_EXECUTION / runtime evidence pending（PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / staging user-gated）を明記。
- [x] インタラクション状態テーブル（ST-1..ST-7）を定義。
- [x] 手動テスト手順（login → /admin/sync-status → dry-run → 結果 → apply → confirm → applied）を定義。
- [x] screenshot 取得計画（全 status=pending）を JSON で定義。
- [x] `outputs/phase-11/` に main.md / manual-test-plan.md / interaction-states.md / screenshot-plan.json / manual-smoke-log.md / link-checklist.md を作成。
- [x] 実 png を本サイクルで撮らないことを明記。

## タスク100%実行確認【必須】

- [x] 7 状態すべての期待描画を定義。
- [x] runtime evidence pending を user-gated の意図的 defer として明記。

## 次Phase

Phase 12（中学生向け概念説明）。
