# lessons-learned — profile-loading-skeleton-oklch (2026-05-19)

`docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/` 実装中に得た判断記録。同種の loading skeleton / visual harness 拡張時の意思決定を最短化する。

## L-PLSO-001: skeleton 用 token は新規追加せず `bg-surface-2` を流用する

- 文脈: spec が要求する skeleton 灰色面に対し、`tokens.css` へ `bg-skeleton` を新設するか、既存の `bg-surface-2` を流用するかが争点。
- 判定: 流用採用。理由は (1) UI prototype alignment / MVP recovery 不変条件 3「色は `tokens.css` と `design-tokens.md` が正本」に既存 token で足りる場合の追加は scope 拡張に該当する、(2) skeleton 専用 token は task-08 design tokens サイクルの所掌。
- 横展開: 他の loading skeleton ルートでも `bg-surface-2` + `motion-safe:animate-pulse` を既定にし、新 token は task-08 PR にまとめて起票する。

## L-PLSO-002: skeleton primitive 不在で route 直 `div` 構成を許容する

- 文脈: parallel-09 で `<Skeleton />` primitive は scope 外。loading.tsx 内に `<div className="h-X w-Y bg-surface-2 motion-safe:animate-pulse rounded" />` を直書きする形に。
- 判定: 許容。primitive 化は `parallel-11-skeleton-primitive`（提案）など別ワークフローで横展開する。1 ファイル内 4 行程度の重複は早すぎる抽象化の方が害が大きい。
- 横展開: 他の loading.tsx で同パターンが 3 ヶ所以上になったら primitive 化 PR を切る。それまでは route 直書きで揃える。

## L-PLSO-003: Playwright screenshot 出力先のハードコード path は CI EVIDENCE_DIR と衝突しうる

- 文脈: `profile-loading-skeleton.spec.ts` は phase-11 screenshot を直接 `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/outputs/phase-11/screenshots/` に書き出す。一方 `playwright.config.ts` の `visual-chromium` project は `isTask18RegressionGate` 判定で EVIDENCE_DIR を task-18-w7 へリダイレクトする経路を持つ。
- 判定: phase-11 evidence は workflow ごとに固有 path を持つのが正しい（artifact inventory 単位）。ただし CI 実行時の `process.cwd()` 起点での相対 path 解決に依存するため、CI から起動する際は cwd が repo root であることを runbook に明記する必要がある。
- 横展開: 新規 visual spec を追加するときは `path.resolve(process.cwd(), 'docs/30-workflows/<workflow>/outputs/phase-11/screenshots/')` のパターンを踏襲し、cwd 前提を spec 冒頭コメントに残す。task-18 EVIDENCE_DIR 経路と混ぜないこと。

## 関連

- [[workflow-profile-loading-skeleton-oklch-artifact-inventory]]
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260519-profile-loading-skeleton-oklch.md`
- 隣接 lessons: `references/lessons-learned-task-25-followup-loading-state-observation-fixture-2026-05.md`（loading state 観測 fixture）
