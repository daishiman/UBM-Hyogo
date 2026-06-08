# Phase 10: 最終レビュー

- taskId: `TASK-SENTRY-EXTENSION-NOISE-FILTER-001`
- 実装区分: **implementation（NON_VISUAL）** / implemented_local_evidence_captured
- 対象: 新規 `apps/web/src/lib/sentry/extension-noise-filter.ts` / 編集 `apps/web/src/instrumentation-client.ts` / 新規 `apps/web/src/lib/sentry/extension-noise-filter.spec.ts`

## 1. acceptance criteria 最終判定（AC-1..AC-7）

実装後レビューとして、各ACを実コードとPhase 11証跡で確認する。

| AC | 条件（要約） | 判定 | 根拠 |
|----|--------------|------|------------------------------|
| AC-1 | `chrome-extension://` / `moz-extension://` / `safari-web-extension://` / `safari-extension://` の extension-only event を `beforeSend` で `null`（drop） | PASS | `eventHasExtensionFrame` / `filterExtensionNoise` 実装と focused tests |
| AC-2 | アプリ自身の error（拡張フレーム非含有）は素通り（**fail-open**） | PASS | app frameのみ、mixed frame、判定例外の保持をテスト済み |
| AC-3 | `ignoreErrors` に観測された拡張メッセージパターンを登録 | PASS | `EXTENSION_IGNORE_ERRORS` を `Sentry.init` に配線済み |
| AC-4 | `denyUrls` に拡張 protocol の正規表現を登録 | PASS | `EXTENSION_DENY_URLS` を `Sentry.init` に配線済み |
| AC-5 | `extension-noise-filter.ts` は `Sentry.init` を起動しない pure module | PASS | side-effectなし import test PASS |
| AC-6 | filter 関数は throw せず、判断不能時は event を残す | PASS | malformed event / throwing getter test PASS |
| AC-7 | typecheck / lint / focused vitest がすべて green | PASS | Phase 11: focused Vitest 14 PASS、web typecheck PASS、web lint PASS |

**blocker: なし。** AC-1..AC-7 は実装と証跡でPASS。

## 2. blocker 判定

| 項目 | 結果 |
|------|------|
| blocker | **なし** |
| 新規依存追加 | なし（既存 `@sentry/nextjs` の `ignoreErrors` / `denyUrls` / `beforeSend` のみ） |
| 不変条件抵触 | なし（client は Next.js SDK のみ・D1 非接触・`*.spec.ts` 慣習・命名規則すべて踏襲） |
| fail-open 保証 | AC-2 / AC-6 で担保（実エラーを失わない） |

## 3. MINOR 指摘の棚卸し（Phase 3 由来）

| ID | 指摘 | 確定対応 | 未タスク化 |
|----|------|----------|------------|
| MINOR-1 | `import type` の alias（`@/` vs 相対）は実ファイルに合わせる必要 | 実装で `@/lib/sentry/extension-noise-filter` を使用 | **不要** |
| MINOR-2 | `denyUrls` は最終 stack frame の URL のみ評価する穴がある | `beforeSend` の全 stack frame 走査（`eventHasExtensionFrame`）で補完済み。残課題なし（Phase 2 §5 / Phase 3）。 | **不要**（同タスク内で既に閉じている） |
| MINOR-3 | 除外パターンの将来追加 | 同 module の `EXTENSION_*` 定数追記で閉じる恒常的拡張点として設計。追加時もファイル 1 箇所で監査可能。 | **不要**（恒久的な拡張点として許容。需要発生時に定数追記で対応） |

3 件いずれも「同タスク内で解決済み」または「定数追記で閉じる設計内事項」であり、新規タスク（spec / Issue）を起票する必要はない。

## 4. 到達不能ノイズ（OUT-1）の取り扱い

ユーザーが観測したコンソール行の大半 —
`service-worker-loader.js` の connection error / `Unchecked runtime.lastError` / 他拡張内蔵の `[Sentry] You cannot use Sentry.init()` 警告 —
は、拡張の**隔離コンテキスト・別 SDK インスタンス・Chrome 本体の console 出力**であり、私たちのページの `window.onerror` にも私たちの Sentry にも**到達しない＝アプリ側コードからフィルタ不能**である。

本タスクが除去できるのは「main world に注入された拡張フレーム由来 error が私たちのグローバルハンドラに漏れて Sentry を汚染するサブセット」のみ。到達不能ノイズの恒久対策は**拡張無効化 / incognito** であり、コード変更の余地が存在しない。

> したがって OUT-1 は「**実装余地が存在しない**」ため**未タスク化対象外**。Phase 12 の未タスク 0 件の根拠となる（誤って「将来対応」として起票しない）。

## 5. 最終判定

**判定: PASS**

- AC-1..AC-7 を実コードとPhase 11証跡で確認した。
- blocker なし。MINOR-1..3 はいずれも未タスク化不要。
- OUT-1（到達不能ノイズ）は実装余地が無く未タスク化対象外。
- local implementation は完了。commit / push / PR は **user-gated**。
