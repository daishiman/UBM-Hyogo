# Phase 11: Manual Test — issue-801 admin error focus transfer

## 手動テスト方針

`visualEvidence: VISUAL_ON_EXECUTION`。local deterministic evidence（typecheck / lint / Vitest / grep）は本サイクルで取得し、実ブラウザ screenshot と screen reader smoke は user-gated runtime evidence として分離する。

## 事前準備

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev
```

admin としてログイン（test account: `manjumoto.daishi@senpai-lab.com`）。

## エラーを意図的に発生させる方法

開発時のみ、admin route の任意の Server Component に一時的に `throw new Error("manual-test")` を追加して error boundary を発火させる。確認後は revert すること。

API エラーは `(admin)/admin/error.tsx` の render error boundary を発火しないため、render 経路で throw する方法を使う。

## 確認項目

### MT-01: focus 移譲

1. admin route で error boundary を発火
2. 「管理画面を表示できませんでした」h1 に focus が当たること
3. Tab キー押下で「再試行する」ボタンへ移動

### MT-02: aria-live 通知

1. macOS VoiceOver (`Cmd+F5`) を有効化
2. error boundary を発火
3. 「管理画面を表示できませんでした」が即時 announce される

### MT-03: digest 表示

1. production build で error 発火
2. Next.js digest が「エラーID: xxxxx」として表示

### MT-04: stack 抑制

1. production build で error 発火
2. `<pre>` ブロックが DOM 上に存在しない

### MT-05: reset 動作

1. 「再試行する」ボタンクリック
2. segment が再 mount され元の admin route に戻る

### MT-06: トップへ戻る

1. 「トップへ戻る」リンククリック
2. `/`（公開 top）へ遷移し、auth 切れで `/admin` リダイレクトループが発生しない

## Phase 11 evidence inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot plan | outputs/phase-11/screenshot-plan.json | present |
| visual review note | outputs/phase-11/ui-sanity-visual-review.md | present |
| capture metadata | outputs/phase-11/phase11-capture-metadata.json | present |
| focused web test | outputs/phase-11/evidence/focused-web-test.txt | present |
| typecheck | outputs/phase-11/evidence/typecheck.txt | present |
| lint | outputs/phase-11/evidence/lint.txt | present |
| grep gate | outputs/phase-11/evidence/grep-gate.txt | present |
| runtime screenshot | outputs/phase-11/screenshots/admin-error-focus.png | pending |

## DoD

- MT-01〜MT-06 は runtime/user-gated evidence として実行時に保存
- local deterministic evidence は `outputs/phase-11/evidence/` に保存済み
- runtime screenshot を未取得のまま completed と表記しない
