---
phase: 11
title: 手動テスト / Evidence
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 11 — 手動テスト / Evidence

[実装区分: 実装仕様書]

## 1. dev server 起動

```bash
mise exec -- pnpm --filter web dev
# default: http://localhost:3000
```

Cloudflare Workers 環境変数が必要な場合:

```bash
bash scripts/with-env.sh mise exec -- pnpm --filter web dev
```

## 2. 確認シナリオ

| # | シナリオ | 操作 | 期待 |
|---|---------|------|------|
| S1 | 5 セクション存在 | `/register` を開く | Hero CTA / StepGrid / FormPreviewSections / FAQ / BottomCTA の順に描画 |
| S2 | CTA 遷移（Hero） | Hero「Google フォームを開く」をクリック | 新規タブで Google Form responderUrl が開く |
| S3 | CTA 遷移（Bottom） | Bottom CTA をクリック | S2 同様 |
| S4 | preview API 正常 | DevTools Network で `/public/form-preview` を確認 | 200 / `FormPreviewView` 形 |
| S5 | preview API 失敗 | API を block（DevTools の Block request URL）| `role="alert"` の文言が描画され、Hero/StepGrid/FAQ/BottomCTA は維持される |
| S6 | collapsible 動作 | FormPreviewSections の 2 番目 summary をクリック | 詳細が展開される。1 番目は初期 open |
| S7 | FAQ | FAQ summary をクリック | 詳細が展開される |
| S8 | keyboard | Tab だけで全 CTA / summary を巡回し Enter で操作 | フォーカスリングが見え、details が toggle |
| S9 | SR (VoiceOver / NVDA) | `/register` を SR で読み上げ | landmark / heading 階層が正しい |
| S10 | dark mode | OS 設定で dark | OKLch token 自動追従。コントラスト OK |
| S11 | mobile width | DevTools で 360px | grid-3 が 1col、CTA は全幅 |

## 3. evidence 配置

`outputs/phase-11/` に以下を格納:

| ファイル名 | 内容 |
|-----------|------|
| `register-desktop.png` | 1440px 幅でのフル `/register` |
| `register-mobile.png` | 360px 幅でのフル `/register` |
| `register-preview-error.png` | S5 のエラー alert 状態 |
| `register-faq-open.png` | S7 で FAQ 展開 |
| `register-dark.png` | S10 dark mode |
| `EVIDENCE.md` | 各画像のキャプチャ条件・確認シナリオ ID をまとめた index |

evidence が取得できない環境（CI 等）では `EVIDENCE.md` に「local 環境で取得済 / ローカル確認のみ」と理由を明示する。
