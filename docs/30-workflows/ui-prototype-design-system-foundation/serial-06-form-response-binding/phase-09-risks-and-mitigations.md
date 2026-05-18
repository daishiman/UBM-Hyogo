---
phase: 9
title: リスク評価と対策
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
depends_on:
  - serial-05-page-routes-blueprint-binding
---

# Phase 9 — リスク評価と対策

[実装区分: 実装仕様書]

## 0. 前提リスク（serial-05 依存）

**最大リスク**: serial-05 が未完了の状態で本 sub-workflow に着手すると、page.tsx skeleton / AppShell / error boundary が不在のため fetch / adapter 配線が空中分解する。

対策:
- Phase 5 §0 に `test -f apps/web/app/(public)/members/[id]/page.tsx` の precondition check を配置
- serial-05 完了 PR の merge を待ってから本 sub-workflow の実装着手

## 1. リスクマトリクス

| # | リスク | 影響 | 確率 | 対策 |
|---|--------|-----|------|------|
| R-01 | serial-05 未完了で着手 | 高 | 中 | Phase 5 §0 precondition / serial-05 PR merge 待機 |
| R-02 | 既存 API shape と UI 期待の乖離 | 高 | 中 | adapter 層で吸収（Phase 2 §3）。API は変更しない |
| R-03 | unknown field / 未知の kind が production response に出現 | 中 | 中 | adapter `normalizeField` で `FieldKindZ.safeParse` → silent skip |
| R-04 | visibility filter の漏れ（API 側で誤って member field を含む応答） | 高 | 低 | UI adapter で二重防御 + Playwright assertion で `data-stable-key` を grep |
| R-05 | Server Component fetch の cache 設定漏れで stale 表示 | 中 | 中 | `cache: "no-store"` 明示。`export const dynamic = "force-dynamic"` 併用 |
| R-06 | `notFound()` 呼び出しが try/catch で握り潰される | 高 | 低 | adapter / page.tsx で try/catch を書かない方針を Phase 5 で明文化 |
| R-07 | API base URL の env injection 漏れ | 高 | 低 | `getEnv()` 経由のみ（task-02 不変条件） |
| R-08 | OpenNext Workers bundle で fetch 仕様差異 | 中 | 低 | `next build --webpack` を CI で実行（既存 NFR-05） |
| R-09 | Playwright snapshot が CI と local で diff | 中 | 中 | `serial-07-regression-evidence` に screenshot baseline 管理を委譲 |
| R-10 | `samplePublicMemberProfile` fixture が `PublicMemberProfileZ.parse` に不適合 | 中 | 中 | fixture 定義時に `PublicMemberProfileZ.parse(samplePublicMemberProfile)` を spec で実行（self-validation） |
| R-11 | adapter が input を mutate する実装ミス | 中 | 低 | unit spec #6 で immutability を assertion |

## 2. 既存 API shape 乖離時の adapter 層吸収方針（R-02 詳細）

| 乖離パターン | adapter 吸収 |
|------------|-------------|
| API が `publicSections` → UI が `sections` 期待 | adapter 出力で rename |
| API が `attendance: []` を返さない（field 自体無し） | adapter 出力で空配列に正規化 |
| API が将来 `socialLinks` 等を追加 | adapter は `PublicMemberProfileZ.parse` 後の output のみ扱うため、schema 拡張時は本 adapter も拡張 |
| API が `tags[].source` を追加 | adapter 出力からは無視。primitive 側は既存 props を維持 |

## 3. unknown field 出現時 fallback（R-03 詳細）

```ts
// adapter 内
const parsed = FieldKindZ.safeParse(field.kind);
if (!parsed.success) {
  // silent skip。logger には warn を出さない（production console を汚さない）
  return null;
}
```

- production: silent skip
- development: 任意で `console.warn` を出す方針も検討可だが、本 sub-workflow では silent 統一

## 4. ロールバック方針

- adapter / primitive / page.tsx 変更は全て `apps/web` 内の追加・編集のみ。`apps/api` / D1 / schema 変更なし
- 不具合発覚時は当該 PR を revert すれば serial-05 完了状態に戻る
- fixture は test 専用のため production runtime に影響しない

## 5. 参照

- Phase 2 アーキテクチャ
- Phase 5 実装ガイド
- `apps/web/src/lib/env.ts`
