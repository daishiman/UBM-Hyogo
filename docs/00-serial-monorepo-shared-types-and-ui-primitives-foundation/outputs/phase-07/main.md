# Phase 7 成果物: AC マトリクス

## 4 軸マトリクス

| AC | 内容 | Phase 4 test | Phase 5 step | Phase 6 failure case | 不変条件 |
|----|------|-------------|-------------|---------------------|---------|
| AC-1 | pnpm install | scaffold-smoke | Step 1 | #8 (pnpm version) | - |
| AC-2 | typecheck exit 0 | typecheck × 4 package | Step 2,3,4,5,6 | #1,#2 | #1 |
| AC-3 | lint exit 0 + RuleTester | lint | Step 6 | #3,#4 | #5 |
| AC-4 | test exit 0 | unit × tones/ids/primitives | Step 6 | #6,#7,#12,#13 | - |
| AC-5 | UI primitives 15 種 export | barrel export smoke | Step 5 | #11 | #6,#8 |
| AC-6 | tones.ts 2 関数 export | tones.test.ts | Step 5 | #6 | - |
| AC-7 | next.config.ts @opennextjs 対応 | scaffold-smoke | Step 5 | #10 | - |
| AC-8 | GET /healthz 200 {"ok":true} | scaffold-smoke (curl) | Step 4 | #9 | - |
| AC-9 | shared 4 型 export | typecheck shared | Step 2 | #1 | #1 |

## 不変条件 ↔ AC マッピング

| 不変条件 | 該当 AC | 担保方法 |
|---------|--------|---------|
| #1 schema 固定回避 | AC-2, AC-9 | 型 4 層 placeholder + branded type |
| #5 apps/web → D1 禁止 | AC-3 | ESLint custom rule (placeholder) |
| #6 GAS prototype 非昇格 | AC-5 | primitive 内 localStorage 不使用 |
| #8 localStorage 非正本 | AC-5 | Avatar hue 決定論的算出 |

## 未トレース blocker

なし（全 AC が test + runbook + failure case に紐付き済み）。
