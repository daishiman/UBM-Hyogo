# Phase 3: 代替案比較 ADR

実装区分: 実装仕様書

成果物: `outputs/phase-03/adr-di-strategy.md`

## 3.1 比較対象 (3 alternatives)

| Alt | 方式 | サマリ |
| --- | --- | --- |
| A | 引数追加（`deps?`）— 既存 ut-02a 採用方式 | builder の optional 引数で provider を渡す |
| B | **Hono ctx 注入（`c.var.attendanceProvider`）** ★採用 | middleware で `c.set` し、builder 内で `c.var` から解決 |
| C | DI container（tsyringe / inversify 等） | container に provider を register し、builder で resolve |

## 3.2 評価マトリクス

| 観点 | A: 引数追加 | B: ctx 注入 | C: DI container |
| --- | --- | --- | --- |
| 影響範囲（initial） | 小（call site のみ） | 中（middleware + 全 call site + 型） | 大（container init + 全 wire-up） |
| provider 追加時の作業量 | O(N) call site | O(1) middleware | O(1) container register |
| Hono との親和性 | 中 | **高（公式パターン）** | 低（reflection 必要） |
| 型安全性 | 高（compile-time required） | 高（`Variables` で表明） | 中（runtime resolve 多い） |
| バンドルサイズ影響 | なし | なし | 増（library 依存追加） |
| テスト時 mock 注入容易性 | 高（引数置換） | 高（`c.set` で fixture middleware） | 中（container reset 必要） |
| silent fallback リスク | 高（optional のため未指定で `[]`） | 低（throw 化可能） | 中（resolve 失敗で undefined） |
| 学習コスト | 低 | 低（Hono 既知ユーザー） | 高 |
| 02b/02c 拡張時の整合 | 引数列肥大 | パターン再利用容易 | 過剰汎用 |

## 3.3 採用理由 (B: ctx 注入)

- **Hono のフレームワーク哲学に沿う**: `c.var` は middleware で組み立てるための公式機構
- **provider 追加コストが O(1)**: middleware 1 段追加で全 route に行き渡る
- **silent fallback を排除**: middleware 結線が漏れると即 throw、テスト・E2E で即発見可能
- **依存追加なし**: bundle / build cost に影響しない
- **既存 `SessionGuardVariables` パターンと整合**: `Variables: A & B` の交差型合成がプロジェクト内で既定パターン

## 3.4 不採用理由

- **A**: ut-02a で採用した暫定策。優先度低だがフォローアップ起票（本タスク）の理由そのもの。引数列肥大と silent fallback リスクが残る
- **C**: 単一 provider のためにフレームワーク導入は overkill。Workers バンドルサイズ・cold start に影響、reflection は esbuild 構成で取り扱い注意点が増える

## 3.5 ADR テンプレ（`outputs/phase-03/adr-di-strategy.md` に展開）

```markdown
# ADR: repository provider 注入戦略

- Date: 2026-05-06
- Status: Accepted
- Context: ut-02a で採用した builder への optional 第N引数 DI が、provider 追加時に O(N) で call site が爆発する問題への対処
- Decision: **Hono ctx 注入 (`c.var.attendanceProvider`)** を採用
- Alternatives: 引数追加 (A) / ctx 注入 (B) / DI container (C)
- Consequences:
  - middleware 結線が必須（漏れると 500 throw）
  - 02b/02c で同パターンを再利用可能
  - public profile builder（attendance を含まない）は対象外、必要時に同パターンで個別追従
- References:
  - docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/outputs/phase-03/alternatives-comparison.md
  - issue #371
```

## 3.6 完了条件

- `outputs/phase-03/adr-di-strategy.md` が存在し、上記 6 項目（Date / Status / Context / Decision / Alternatives / Consequences）を満たす
- 比較マトリクスが ADR 内に再掲または link されている
