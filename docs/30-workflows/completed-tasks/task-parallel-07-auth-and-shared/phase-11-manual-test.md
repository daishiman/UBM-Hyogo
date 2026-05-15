# Phase 11: 手動テスト（VISUAL）

> Phase: 11 / 13
> 名称: 手動テスト
> visual classification: **VISUAL**
> 取得枚数: **4 画面 × light/dark = 8 枚**

---

## 11.1 取得対象

| # | 画面 | URL | 状態誘発 |
|---|------|-----|---------|
| S1 | `/login` slow load | `http://localhost:3000/login` | DevTools network throttle "Slow 3G" |
| S2 | `/login` error | `http://localhost:3000/login` | 一時的に throw を仕込み、再試行直前で stop |
| S3 | root error | `http://localhost:3000/__force_error` | 一時 throw を仕込んだダミーページ、または devtools で react error boundary 発火 |
| S4 | `/profile` slow load | `http://localhost:3000/profile` | Slow 3G |

各画面を light / dark で 1 枚ずつ取得（計 8 枚）。

---

## 11.2 撮影ガイド

- viewport: 1280×800 desktop / 375×812 mobile のうち **desktop** を本タスクの主基準とする（mobile はオプション）
- テーマ切替: OS 設定 or DevTools の "Emulate CSS prefers-color-scheme"
- skeleton は loading 中の representative な瞬間（pulse が見える）で停止
- focus 移譲後の状態を撮影する場合は h1 に `focus ring` が見える状態を保つ

---

## 11.3 保存規約

| 画面 / テーマ | path |
|-------------|------|
| login loading / light | `outputs/phase-11/login-loading-light.png` |
| login loading / dark | `outputs/phase-11/login-loading-dark.png` |
| login error / light | `outputs/phase-11/login-error-light.png` |
| login error / dark | `outputs/phase-11/login-error-dark.png` |
| root error / light | `outputs/phase-11/root-error-light.png` |
| root error / dark | `outputs/phase-11/root-error-dark.png` |
| profile loading / light | `outputs/phase-11/profile-loading-light.png` |
| profile loading / dark | `outputs/phase-11/profile-loading-dark.png` |

加えて `outputs/phase-11/manual-test-result.md` に以下を記録:

- 各画面の取得時刻 / viewport / テーマ
- focus が期待要素に当たっていたか（screen reader の発話確認含む）
- prefers-reduced-motion ON 時の挙動メモ
- 視覚的回帰観点での差分コメント

---

## 11.4 a11y 手動検証

| # | 観点 | 手段 |
|---|------|------|
| H1 | screen reader が「ログイン処理でエラーが発生しました」をアナウンス | macOS VoiceOver |
| H2 | screen reader が「ログイン画面を読み込み中」をアナウンス | VoiceOver |
| H3 | キーボードのみで再試行ボタンに到達できる | Tab 操作 |
| H4 | focus outline が OKLch token で視認可能 | 目視 |

---

## 11.5 完了判定

- スクリーンショット 8 枚保存済み
- `manual-test-result.md` 記録済み
- H1〜H4 全 pass

---

## 次フェーズへの引き継ぎ

Phase 12 でドキュメント更新（必須 7 outputs）を作成する。
