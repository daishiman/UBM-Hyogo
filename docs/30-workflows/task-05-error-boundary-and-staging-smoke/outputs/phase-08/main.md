# Phase 8: DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-08/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## 重複検出と対策

| 観点 | 検出 | 対応 |
| --- | --- | --- |
| `error.tsx` と `global-error.tsx` の useEffect logger 呼び出し | 構造類似 | 共通ヘルパ `function logBoundary(event, error)` を内部に切り出すことは**しない**（Next.js は両 boundary を独立 client bundle に分離するため、import 共有はオーバーヘッド。8 行程度の重複は許容） |
| token 直書き | `var(--ubm-color-*)` 文字列が 4 ファイル散在 | task-09 token 確定後に refactor task で巻き取り（本 task では先行直書き） |
| smoke spec の URL 配列定義 | 1 ファイル内 | 配列定数として spec 冒頭に宣言。共通モジュール化は task-18 で総合化 |
| 19 routes 表 | index.md / phase-01 / `staging-smoke-checklist.md` / spec の 4 箇所 | `staging-smoke-checklist.md` を **正本** とし、他はリンク参照に統一 |
| logger 呼び出しの event string | task-04 で予約 union 型 (`"error.boundary.caught"` / `"error.global-boundary.caught"` / `"error.not-found"`) | event string は task-04 export の type に合わせる。直書き重複でなく型による拘束を優先 |

## 抽象化判断（YAGNI 適用）

- error UI を共通 component に抽出**しない**（4 boundary それぞれ用途が異なる）
- Sentry 呼び出しを util 関数化**しない**（task-04 logger 経由 1 行で完結）

## 完了条件

- [ ] 重複検出 5 観点に対する判断が記録されている
- [ ] 過剰抽象化を行っていない（CONST_003 タスク特性最適化）
