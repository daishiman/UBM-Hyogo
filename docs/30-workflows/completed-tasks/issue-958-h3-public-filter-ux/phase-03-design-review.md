# Phase 3 — 設計レビュー

## 判定

**Phase 4 着手可** ✅

## 4 条件 + invariants

| 項目 | 判定 | 根拠 |
|------|------|------|
| 価値性 | ✅ | 3 ペルソナ（会員 / 管理者 / 来訪者）の不可視性コストを下げる |
| 実現性 | ✅ | 既存 primitive + 既存 API のみ、新 endpoint ゼロ |
| 整合性 | ✅ | INV-1〜7 全遵守。INV-4 は CTA リンク誘導のみで mutation API 追加なし |
| 運用性 | ✅ | Phase 11 で UI 検証可能、staging deploy 後の確認経路明確 |
| INV-1 (新 endpoint 禁止) | ✅ | apps/api/src/routes/ 配下に変更なし（Phase 9 grep gate） |
| INV-2 (OKLch token) | ✅ | Callout / Button primitive 経由 |
| INV-3 (D1 直接禁止) | ✅ | apps/web から D1 binding 使用なし |
| INV-4 (Form 再回答) | ✅ | publicConsent direct mutation API 追加なし |
| INV-5 (.spec) | ✅ | 全 spec ファイル `*.spec.tsx` |
| INV-6 (FormField) | ✅ | Track B checkbox は FormField wrapper 経由 |
| INV-7 (useAdminMutation) | ✅ | Track B mutation は hook 経由 |

## 設計レビュー指摘

### MINOR-1: `editResponseUrl` の取得経路

`/me/profile` レスポンスに `editResponseUrl` が含まれているかは Phase 4 で確認。含まれていなければ Track A は `responderUrl` のみで動作（fallback 設計済のため動作には支障なし）。

→ Phase 4 Track A spec で `MeProfileResponse` schema を確認し、`editResponseUrl` field が無ければ `responderUrl` のみ使用に変更。

### MINOR-2: Track B candidates のスコープ

「現在 page」だけを候補にすると、複数 page に跨る hidden member は一括処理できない。MVP 規模（数十人想定）では問題なし。将来 100+ 会員になった場合は別タスク（本タスク外）。

→ phase-02 §2.5 で明示済。Phase 12 unassigned-task-detection で記録。

### MINOR-3: Track C の `hasSearchFilters` 判定

検索フィルタ判定は `search.q !== "" || ...` の OR 連結。`density` / `sort` は filter ではなく view 設定なので除外する。Phase 4 で test case を明示。

## blocker

なし。

## 次フェーズ

Phase 4 (Test Design) へ進む。3 Track 並列で test 設計可能。
