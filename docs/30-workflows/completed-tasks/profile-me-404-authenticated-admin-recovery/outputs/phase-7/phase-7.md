# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 7 / 13 |
| taskType | implementation |
| implementation_mode | `edit` |
| visualEvidence | VISUAL_ON_EXECUTION（NON_VISUAL・UI 描画不変） |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

Phase 6 のテスト群が、本サイクルで**変更するブロックに限定**して line / branch を充足することを、対象ファイル・対象関数・実測予定値の表で固定する。カバレッジ目標は apps 全体の一律閾値ではなく、**T01（error-handler.ts `notFoundHandler` 周辺）/ T03（safe-fetch.ts `logServerFetchFailure` 周辺・transport の method 制約分岐）が触れる関数・分岐に限定**して評価する（Feedback BEFORE-QUIT-002 / Feedback 5：全ファイル一律指定にしない）。T02（yaml）/ T04（shell）は vitest カバレッジ対象外として、それぞれ yaml 構文 + 分岐 grep / `bash -n` + 出力 key 検査（Phase 9）で別途担保する。

## 実行タスク

### 7.1 カバレッジ対象範囲（限定スコープ）

| タスク | 変更ファイル | 評価対象ブロック | 評価対象外（無変更・計測しない） |
| --- | --- | --- | --- |
| T01 | `apps/api/src/middleware/error-handler.ts`（編集） | `notFoundHandler`（path 解決 try/catch + 診断 context 組立: `reason` / `method` / `path` / `hasAuthorization` / `hasSessionCookie` の boolean 導出）+ `errorHandler` の logError 呼び出しに渡る context 追加分 | `errorHandler` の既存 status 体系分岐・`buildResponse`・他 error code 経路（`UBM-5000` 等） |
| T03 | `apps/web/src/lib/server-fetch/safe-fetch.ts`（編集） | `logServerFetchFailure`（status 抽出 regex + `routeNotFound` 導出分岐 + transport descriptor flat 展開）。`logPath` 無し early return | `statusFromError` / `transportFromError` / `shouldRethrow` / `normalizeError` / `safeServerFetch` 本体（無変更だが SF 系で被覆維持） |
| T03 | `apps/web/src/lib/fetch/transport.ts`（**回帰のみ・本 WF では原則無編集**） | fallback の method 判定分岐（GET/HEAD のみ・非冪等伝播・HTTP エラー Response 非 fallback） | chain 構成本体（#1237 で被覆済・本 WF で挙動を変えない） |

> 本 WF の主編集は **error-handler.ts と safe-fetch.ts の 2 ブロック**。transport.ts は #1237 の method 制約が侵食されていないことの**回帰 guard**であり、本 WF で行を追加しない（追加する場合のみ当該行を被覆対象に格上げ）。`authed.ts` も同様に挙動不変・回帰維持。

### 7.2 変更ブロックの line / branch 実測予定値

| 対象ブロック | 関数 / 箇所 | line 予定 | branch 予定 | 充足テスト |
| --- | --- | --- | --- | --- |
| notFound 診断 context | `notFoundHandler`（URL parse 成功/失敗の try/catch・cookie 有無 boolean・authorization 有無 boolean） | 100% | 100%（URL parse OK / 失敗 fallback × hasSessionCookie true/false × hasAuthorization true/false） | NF-1〜NF-5 |
| notFound 応答契約 | `notFoundHandler` → `errorHandler` の body/status（ログ追加で応答不変） | 100% | 100%（404 経路のみ・status 不変） | NF-7 |
| route-404 ログ導出 | `logServerFetchFailure`（status 抽出 match / `routeNotFound` = status===404） | 100% | 100%（404→true / 401・410→false / 抽出不能→null+false / logPath 無し early return） | SF-1〜SF-6 |
| method 制約（回帰） | transport fallback の `FALLBACK_SAFE_METHODS` 判定 + HTTP エラー Response 非介入 | 既存維持 | 100%（GET/HEAD fallback / 非冪等伝播 / HTTP エラー非 fallback / 全滅 rethrow） | MT-1〜MT-5 |

> 予定値は**変更ブロック 100%**。`notFoundHandler` の boolean 導出は「cookie 有/無 × authorization 有/無 × URL parse 成功/失敗」を NF-1（cookie 有・auth 無・parse 成功）/ NF-2（cookie 無）/ NF-3（auth 有）/ NF-5（parse 失敗）で両側被覆する。`logServerFetchFailure` の `routeNotFound` 分岐は SF-1（404→true）/ SF-2・SF-3（401・410→false）/ SF-4（null→false）で三方向被覆する。

### 7.3 line/branch 実測を残す方針（Feedback BEFORE-QUIT-002 / Feedback 5）

- カバレッジは **`--coverage` 実行後のレポートで対象 2 ファイル（`error-handler.ts` / `safe-fetch.ts`）の変更ブロックのみ**を確認し、7.2 の予定値（line/branch 100%）と一致したことを**実測値として記録**する。focused 実行のため他ファイルの % は参考値とし評価しない（広域一律 judge しない）。
- 未到達分岐が出た場合は **Phase 6 のケース表へ 1 ケース追補**して再計測する（実装側で分岐を消す方向は契約変更＝NO-GO）。
- 実測ログは Phase 9 の品質ゲート実行時に取得し、Phase 10 の AC-2 / AC-4 充足判定へ引き継ぐ。`implemented_local_runtime_pending` 段階では予定値を固定し、本 wave の実測へ更新済み。

### 7.4 coverage-guard 整合

- `bash scripts/coverage-guard.sh --changed` は変更行被覆を判定する。本サイクルの ts 変更行（`error-handler.ts` notFound context / `safe-fetch.ts` routeNotFound 導出）はすべて 7.2 の対象ブロックに含まれ Phase 6 のテストで到達するため、changed-line coverage は閾値を割り込まない。
- T01 が「dev 取り込みの merge commit」を含む push になる場合は CLAUDE.md の sync-merge ポリシーどおり coverage-guard が自動スキップ対象。T01〜T03 の feature commit には通常どおり適用される。
- T02（yaml）/ T04（shell）と spec ファイル自体は coverage 計測対象外。

### 7.5 カバレッジ計測コマンド（限定実行・実測方針）

```bash
# api 側 notFound ブロック
cd apps/api
mise exec -- pnpm exec vitest run --coverage src/middleware/error-handler.spec.ts
cd ../..

# web 側 route-404 ブロック + method 制約回帰（apps/web package 内・--root=../.. 形式）
cd apps/web
mise exec -- pnpm exec vitest run --coverage --root=../.. --config=vitest.config.ts \
  'apps/web/src/lib/server-fetch/safe-fetch.spec.ts' \
  apps/web/src/lib/fetch/authed.spec.ts
cd ../..
```

計測後、coverage レポートで **`error-handler.ts`（notFoundHandler 周辺）/ `safe-fetch.ts`（logServerFetchFailure 周辺）の変更ブロックのみ**を確認し、7.2 の予定値（変更ブロック line/branch 100%）と一致することを判定する。他ファイル % は参考値（広域一律 judge しない）。未到達分岐は Phase 6 へ 1 ケース追補して再計測。

## 統合テスト連携

7.2 の変更ブロック被覆を Phase 9 の品質保証（typecheck / lint / focused vitest 一括 / `bash -n` / yaml 構文 / redaction grep）と同時に確認し、未到達分岐ゼロを Phase 10 の AC-2 / AC-4 / AC-8 充足判定へ引き継ぐ。実測値は `implemented_local_runtime_pending` から実装サイクルへ移行時に予定値へ上書き記録する。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 分岐（被覆対象境界の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約（変更対象外境界の確認） |

- `outputs/phase-6/phase-6.md`（ケース表 NF / SF / MT / PG / CD / DG）
- `_shared-context.md` §8（inventory・変更ファイル俯瞰）
- `CLAUDE.md`（coverage-guard の sync-merge スキップポリシー）

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）

## 完了条件

- [x] カバレッジ評価対象を T01/T03 の変更ブロック（error-handler.ts notFoundHandler 周辺 / safe-fetch.ts logServerFetchFailure 周辺）に**限定**（全ファイル一律指定にしない）
- [x] 各変更ブロックの line / branch 予定値（100%）と充足テスト（NF / SF / MT）を対応付け
- [x] line/branch 実測を残す方針（Feedback BEFORE-QUIT-002 / Feedback 5）を明示
- [x] boolean 導出・routeNotFound 分岐の両側/三方向被覆方針を明示
- [x] coverage-guard（changed-line / merge commit スキップ）との整合を明示
- [x] 限定スコープの計測コマンド（`--coverage` + focused subset）を固定
