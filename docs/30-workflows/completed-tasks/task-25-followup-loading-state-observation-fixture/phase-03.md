# Phase 3: 設計レビュー

`[実装区分: 実装仕様書]`

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| production 漏出リスク | OK | `ENABLE_STAGING_SMOKE_FIXTURE` + `ENVIRONMENT !== "production"` 二重ガード。`notFound()` フォールバック。既存 `__smoke__/error-boundary` と同パターン |
| flake リスク | OK | `setTimeout` ベース deterministic 遅延。Playwright の auto-wait と `waitUntil: "commit"` で navigation 完了前に loading boundary 検査が可能 |
| TOKEN-SSOT | OK | 既存 Tailwind utility のみ。HEX 直書きなし |
| API surface 変更 | 無 | Web layer のみ完結。`apps/api` 触らず |
| D1 直接アクセス | 無 | DB 接触なし |
| テスト suffix 規約 | OK | `*.spec.ts` 既存ファイル編集のみ |
| 単一サイクル完了（CONST_007） | OK | 4 ファイル変更で完結。後続 follow-up を生まない |

## 想定変更ファイル群の俯瞰（後続実装者向け）

```
apps/web/
├── app/
│   ├── __smoke__/
│   │   ├── error-boundary/page.tsx        (既存・参考)
│   │   ├── members-list/page.tsx          (既存・参考)
│   │   └── loading-state/                  ← 新規ディレクトリ
│   │       ├── page.tsx                    ← 新規
│   │       └── loading.tsx                 ← 新規
│   └── loading.tsx                         (既存・class 参照元)
├── src/lib/env.ts                          (既存・readRawEnv 提供元)
└── tests/e2e/
    └── staging-smoke.spec.ts               ← 編集（describe 追記）

docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/
└── SMOKE-COVERAGE-MATRIX.md                ← 編集（行 19 + summary）
```

## 代替案と却下理由

| 代替案 | 却下理由 |
|--------|---------|
| Playwright `page.route` で API レスポンス遅延を artificial 注入 | flake 化しやすく、Issue 苦戦箇所そのもの。設計目的に反する |
| route group 単位の loading（admin / profile / login）をすべて個別 fixture 化 | matrix 行 19 は単一 component surface として括られているため root 観測で充足。CONST_007 単一サイクル超過リスクあり |
| query param ではなく path segment（`/smoke/loading-state/[delay]`）で遅延指定 | 動的 segment 増加で OpenNext build 影響リスク。query 1 個で足りる |
| client component 化して `useEffect` で setTimeout | Suspense fallback (`loading.tsx`) が発火しない。要件 FR-01 を満たさない |

## エスカレーション要否

- なし。task-specification-creator skill / aiworkflow-requirements skill いずれの正本仕様にも矛盾なし。
- private source は `app/__smoke__/` 配下、実 URL は既存 `app/smoke/ui-primitives` と同じ `app/smoke/` wrapper に置く。Next.js の `_` private folder 規約と build route list に整合する。

## 承認後の次ステップ

Phase 4（テスト skeleton）→ Phase 5（実装）に進む。
