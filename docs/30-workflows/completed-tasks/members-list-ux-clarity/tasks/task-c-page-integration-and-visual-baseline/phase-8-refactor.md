<!-- workflow: members-list-ux-clarity / task: C / phase: 8 -->

[実装区分: 実装仕様書]

# Phase 8 — リファクタ (Task C)

## 1. リファクタ対象

本 task は薄い integration layer のため、リファクタ機会は限定的。以下の任意改善のみ検討する。

| 候補 | 採否 | 理由 |
| ---- | ---- | ---- |
| `page.tsx` の `listResult.ok ? ... : 0` 計算を局所変数に抽出 | 採用候補 | 2 箇所同じ三項演算が出現する場合のみ。1 箇所なら inline 維持 |
| `members-ux-clarity.spec.ts` の VIEWPORTS / DENSITIES / STATES を共通 helper に切り出し | 不採用 | 単一 spec 内 const で十分。本 task で helper module を作らない (YAGNI) |
| `<p data-role="pagination-meta">` の完全削除 | 不採用 | Phase 3 決定: `aria-hidden` 付与で残す |

## 2. 適用ルール

- 機能変更なし
- リファクタは spec が緑のまま実施
- 1 PR / 1 サイクル内で完結 (CONST_007)

## DoD

- [x] リファクタ候補が列挙され採否が記録されている
