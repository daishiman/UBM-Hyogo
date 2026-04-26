# System Spec Update Summary

## Step 1-A: 完了タスク記録

Wave 0 `monorepo-shared-types-and-ui-primitives-foundation` を Phase 12 close-out 済みとして記録する。関連成果物はこの task root の `outputs/phase-01` から `outputs/phase-12` に集約済み。

## Step 1-B: 実装状況テーブル

| 対象 | 状態 | 根拠 |
| --- | --- | --- |
| pnpm workspace scaffold | completed | `pnpm-workspace.yaml`, root `package.json` |
| `apps/web` scaffold | completed | Next.js + OpenNext config, route group layouts |
| `apps/api` scaffold | completed | Hono health endpoints |
| `packages/shared` branded ID placeholder | completed | `MemberId`, `ResponseId`, `ResponseEmail`, `StableKey` |
| `packages/integrations/google` FormsClient placeholder | completed | interface + NotImplemented client |
| UI primitives 15種 + tones | completed | barrel export + tests |

## Step 1-C: 関連タスク同期

後続 Wave 01a/01b/06a/06b/06c/08a/08b/09 系の入力として、implementation guide に引き渡し事項を記録した。大きな未解決課題は未タスク化せず、後続 Wave の既存責務へ割り当て済み。

## Step 2: システム仕様更新

新規型/API/定数が入ったため、正本仕様へ同期対象あり。

| 仕様領域 | 反映内容 |
| --- | --- |
| monorepo architecture | `apps/web`, `apps/api`, `packages/shared`, `packages/integrations/google` の Wave 0 scaffold |
| shared types | branded ID placeholder 4種 |
| integration packages | Google Forms client placeholder |
| API | `/healthz`, `/public/healthz`, `/me/healthz`, `/admin/healthz` scaffold |
| UI/UX | 15 UI primitives, Modal/Drawer focus handling, Toast client boundary |
| quality | dependency-free boundary lint guard for `apps/web` |
