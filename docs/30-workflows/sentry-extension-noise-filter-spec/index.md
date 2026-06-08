# sentry-extension-noise-filter-spec

## 概要

ブラウザのコンソールに出続ける `chrome-extension://...` 由来のエラー群を調査した結果、**これらはすべて第三者ブラウザ拡張機能起因であり、UBM 兵庫支部会アプリ（`apps/web`）のコード起因ではない**ことが確定した。アプリのコードで「拡張のバグそのもの」を直すことは原理的に不可能である。

ただし `apps/web` はクライアントサイドで `@sentry/nextjs` を使っており、`src/instrumentation-client.ts` の `Sentry.init()` に **`beforeSend` / `ignoreErrors` / `denyUrls` が未実装**である。このため、main world に注入された拡張スクリプト由来の uncaught error が私たちのグローバルハンドラに漏れた場合、**自分たちの Sentry 監視ダッシュボードにノイズとして流入する**。

本ワークフローは、Sentry 公式の browser-extension ベストプラクティスに沿って **拡張由来エラーを自分たちの Sentry 監視から除外するフィルタ**を実装するためのタスク仕様書（実装仕様書）を作成する。

- 実装区分: **実装仕様書（NON_VISUAL）**
- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
- implementation_mode: `new`
- implementation_status: `implementation_complete_pending_pr`
- Phase 12 strict 7: `outputs/phase-12/` に配置済み
- Phase 13: commit / push / PR は user-gated

## 実装区分の判定根拠（CONST_004）

| 判定 | 内容 |
|------|------|
| ラベル | ユーザー指定なし（「対策を行ってください」=動作改善要求） |
| 実態 | 目的（Sentry へのノイズ流入を止める）の達成には `instrumentation-client.ts` のコード変更が必須 |
| 結論 | **実装仕様書**（コード変更を伴う）。CONST_005 の必須項目をすべて記載する |

> 「ドキュメントのみ仕様書」には該当しない。コード変更（新規 pure module + `Sentry.init` 配線 + 単体テスト）なしには目的が達成できないため。

## 観測症状（ユーザー報告 2026-06-06）

```
chrome-extension://k…-worker-loader.js:1 Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
service-worker-loader.js:1 Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
Unchecked runtime.lastError: No tab with id: 754482493.
profile:1 Error handling response: TypeError: Cannot read properties of undefined (reading 'mapKeyRegistry') at chrome-extension://dbepggeogbaibhgnhhndojpepiihcmeb/lib/utils.js
profile:1 Error handling response: TypeError: Cannot read properties of undefined (reading 'useVimLikeEscape') at chrome-extension://dbepggeogbaibhgnhhndojpepiihcmeb/lib/utils.js
profile:1 Unchecked runtime.lastError: Access to storage is not allowed from this context.
index-BusXyNuZ.js:13319 [Sentry] You cannot use Sentry.init() in a browser extension
```

## エラー起因分類（調査結果）

| エラー | 起因 | アプリ側で対策可能か |
|--------|------|----------------------|
| `service-worker-loader.js: Could not establish connection` | Chrome 拡張の service worker メッセージング | ❌ 拡張内部・到達不能 |
| `Unchecked runtime.lastError: No tab with id` | Chrome 拡張の `chrome.tabs` API | ❌ Chrome 自身の console 出力・到達不能 |
| `lib/utils.js: 'mapKeyRegistry'/'useVimLikeEscape'` | Vim 系キーバインド拡張の内部バグ | △ main world 漏れ時のみ Sentry 除外可 |
| `Access to storage is not allowed from this context` | 拡張 content script の storage アクセス | △ main world 漏れ時のみ Sentry 除外可 |
| `[Sentry] You cannot use Sentry.init() in a browser extension` | **別**拡張に内蔵された Sentry の自己警告 | ❌ 別 SDK インスタンス・到達不能 |

> **正直な境界（重要）**: 上記の多くは拡張の隔離コンテキスト／別 SDK／Chrome 本体の console 出力であり、私たちのページの `window.onerror` にも私たちの Sentry にも**到達しない＝アプリからフィルタ不能**。本タスクが除去できるのは「main world に注入された拡張フレーム由来の error が私たちのグローバルハンドラに漏れて Sentry を汚染するサブセット」のみ。到達不能なノイズの恒久対策は「拡張を無効化／incognito で確認」であり、コード変更では不可能。この事実を Phase 1 と implementation-guide に明記する。

## スコープ（1 タスク / 1 サイクル / 1 PR で完了）

| Task | 対象 | 区分 | 状態 | 仕様書 |
|------|------|------|------|--------|
| 単一 | 拡張由来エラーを Sentry 監視から除外するフィルタ（pure module + `Sentry.init` 配線 + 単体テスト） | 実装仕様書（NON_VISUAL） | implemented_local_evidence_captured（implementation_complete_pending_pr） | `outputs/phase-1/phase-1.md` 〜 `outputs/phase-13/phase-13.md` |

> 単一の関心ごと（Sentry ノイズフィルタ）であり、後続の実装プロンプト（`03.実装.md`）の **1 サイクル内で完了**する。先送り・別 PR 分割なし（CONST_007）。

## 変更ファイル一覧（実装時）

| パス | 種別 | 役割 |
|------|------|------|
| `apps/web/src/lib/sentry/extension-noise-filter.ts` | 新規 | 拡張由来判定の pure module（`beforeSend` / `ignoreErrors` / `denyUrls` の正本） |
| `apps/web/src/instrumentation-client.ts` | 編集 | `Sentry.init()` に 3 オプションを配線 |
| `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | 新規 | pure module の単体テスト |
| `apps/web/src/lib/sentry/index.ts` | 編集（任意） | 新 module の re-export（barrel 整合） |

## 不変条件

1. **既存 API 表面のみ**: 新 endpoint / D1 schema / Google Form 仕様変更なし。`apps/web` 内のクライアント instrumentation のみ変更。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を触らない（本タスクは無関係だが継続）。
3. **アプリの実エラーは絶対に握り潰さない**: フィルタは拡張フレーム由来イベントのみ `null` を返す。アプリ自身の error はこれまで通り全件 Sentry に送る（fail-open 設計）。
4. **fail-soft 継続**: `Sentry.init()` は既存の try/catch を維持。filter 関数自体も throw しない。
5. **env アクセス不変条件（task-02）**: `process.env.NEXT_PUBLIC_*` は instrumentation-client の既存パターンを踏襲（本タスクで env アクセサ方針は変更しない）。
6. **テスト命名**: `*.spec.ts` のみ（`*.test.ts` 禁止 / 不変条件 #8）。
7. **OKLch / HEX**: UI 変更なし（NON_VISUAL）。色トークンに非接触。

## 正本順位（衝突時）

1. 本 `index.md` のスコープ・不変条件
2. `outputs/phase-{1,2,3}/phase-N.md`（設計書）
3. Sentry 公式 browser-extension best practices（`ignoreErrors` / `denyUrls` / `beforeSend`）
4. 既存コード（`apps/web/src/lib/sentry/capture.ts` の fail-soft 規約）

## Phase 一覧

| Phase | 名称 | 成果物 |
|-------|------|--------|
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` |
| 5 | 実装手順 | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント更新 | `outputs/phase-12/main.md`（strict 7） |
| 13 | PR 作成 | `outputs/phase-13/phase-13.md`（user-gated） |
