# Phase 11 — UI Sanity / Visual Review

## a11y
- ✅ heading hierarchy: `<h1>依頼キュー</h1>` → `<h2>依頼詳細</h2>` → `<h3>確認 dialog</h3>`
- ✅ `role="group" aria-label="依頼種別"` / `aria-label="依頼一覧"` / `aria-label="依頼詳細"` / `aria-label="操作"` / `aria-label="確認"`
- ✅ confirmation modal: `role="dialog" aria-modal="true" aria-labelledby="confirm-h"`
- ✅ destructive warning: `role="alert"`
- ✅ toast: `role="status"`
- ✅ tab buttons: `aria-pressed` で current 表示
- ✅ form label: `<label>メモ...<textarea/></label>` で関連付け

## overflow / layout
- desktop grid `1fr 2fr` で list/detail 配置
- mobile（< 768px）では grid が崩れる可能性あり → 既存 admin 画面群と同じ pattern なので global responsive style に依存

## copy
- 「依頼キュー」「公開停止/再公開」「退会」「依頼を承認します」「論理削除されます」「他の管理者が既に処理済み」など、admin が状況を即座に判断できる文言

## PII
- API 側で `sanitizePayload` 適用済。`summarizePayload` は `desiredState` のみ抽出 or `JSON.stringify` で fallback（API sanitize 後の値を使うため raw PII は出ない）

## 結論
重大な UI 崩れ・a11y violation 無し
