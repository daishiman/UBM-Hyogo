# Phase 11: 手動テスト — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 前提

`visualEvidence: NON_VISUAL` のため Playwright visual baseline / scenes 取得は不要。a11y 観察のみ。

## 2. ローカル smoke 手順

### Step 1: dev server 起動

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev
```

### Step 2: error boundary 強制発火

以下いずれかで error boundary を起動:

**方法 A: ブラウザ console から throw**
任意 page を開き、devtools console で:
```js
throw new Error("manual-smoke-i06")
```
※ root error.tsx 発火を確実にしたい場合、server component で throw する短期 page を用意するか、`pnpm -F "@ubm-hyogo/web" exec next dev` で開発時のエラー表示と切り分ける。

**方法 B: 既存 error throw 経路を利用**
profile 等で意図的に API 500 を引き、`error.tsx` 経路へ遷移する。

### Step 3: a11y 観察

| 観察項目 | 期待 |
|---|---|
| VoiceOver / NVDA で「画面を表示できませんでした」が即座に読み上げられる | ✅ |
| ビューポートが画面トップへスナップしない（`preventScroll: true` 効果） | ✅ |
| h1 に focus outline が visible でない（`:focus-visible` 由来で keyboard 時のみ表示） | ✅ |
| 再試行ボタンクリックで `reset()` が走る | ✅ |
| digest 表示が崩れない | ✅ |

## 3. デバイス / 環境

| 環境 | 確認 |
|---|---|
| macOS Safari + VoiceOver | ☐ |
| macOS Chrome | ☐ |
| iOS Safari（mobile viewport 跳躍確認） | ☐（任意・solo 運用では best-effort） |

## 4. evidence

`outputs/phase-11/manual-smoke-log.md` に以下を記録:

- 実行日時
- ブラウザ + screen reader
- focus 移譲が観察できたか（yes / no）
- viewport jump が発生していないか（yes / no）
- 既存挙動（reset / digest / dev stack）regression なし

スクリーンショット画像は **取得しない**（NON_VISUAL タスク、`outputs/phase-11/` には `.md` ファイルのみ）。

## 5. 失敗時の戻り

| 観察 | 戻り先 |
|---|---|
| focus が h1 に当たらない | Phase 5 （実装ミス） |
| viewport jump 発生 | Phase 5（`preventScroll: true` 漏れ） |
| visual outline が常時表示 | global CSS の focus-visible utility 確認、本タスクで対処せず別 issue 起票 |

## 6. 完了条件

§2 Step 3 の観察 5 項目を `outputs/phase-11/manual-smoke-log.md` に記録し、可能な環境の範囲で確認できたら Phase 12 documentation へ進む。自動テスト・typecheck・lint の実行ログは `outputs/phase-11/evidence/` に保存する。
