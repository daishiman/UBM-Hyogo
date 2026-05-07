# Phase 1: 要件定義

## 目的

task-03（Sentry Workers SDK 統一）の AC・スコープ・不変条件 trace・artifacts.json metadata を確定し、本仕様書全体の正本となる「何が完了かを判定するテーブル」を固める。Phase 2 以降は本 Phase の AC を分解する形で展開する。

## 真の論点 / 設計判断

1. **論点 A: Sentry SDK を 1 種類に統一できないか？**
   - 結論: **不可能**。Cloudflare Workers ランタイムは `window` も `requestIdleCallback` も持たない。`@sentry/nextjs` は内部で Browser API を参照し RSC 500 を引き起こす（phase-1 §6 リスク・現行プロダクション再現済）。
   - 採用案: **`@sentry/cloudflare`（server / edge）+ `@sentry/nextjs`（browser）の 2 経路明示分離**。

2. **論点 B: runtime 判定のソースは何か？**
   - `process.env.NEXT_RUNTIME`（Next.js v15 が注入、`'nodejs' | 'edge' | undefined`）と `typeof window` の併用。
   - `instrumentation.ts` 側は `NEXT_RUNTIME` を、`capture.ts` 側は `typeof window` を一次判定として使う（呼び出し側コンテキストに合わせる）。

3. **論点 C: 二重 init ガードはどこに置くか？**
   - server 側: モジュールスコープ `let initialized = false`（worker isolate 単位で十分）+ `globalThis.__ubmSentryInitialized__`（HMR / 再 import 耐性）
   - client 側: `window.__ubmSentryInitialized__`（ブラウザ単位）
   - **import 不要で参照可能な命名（`__ubmSentryInitialized__`）にする**ことで task-04 / task-05 が依存なしに状態確認できるようにする。

4. **論点 D: DSN を Secrets と `[vars]` に分けるべきか？**
   - server DSN: Cloudflare Secrets `SENTRY_DSN_WEB`（クォータ・rate-limit 観点で隠蔽）
   - client DSN: `[vars]` の `NEXT_PUBLIC_SENTRY_DSN`（Sentry 仕様上 client DSN は公開前提）
   - 理由: Sentry の client DSN は bundle に焼かれるため secret 化しても意味がなく、`[vars]` での扱いが正しい。

5. **論点 E: 既存の `sentry.{client,server,edge}.config.ts` をどう扱うか？**
   - 完全削除（D）。`@sentry/nextjs` の旧形式 config が残っていると Next.js が自動 inject し二重 init が再発する。

## 実行タスク（チェックリスト）

- [ ] 元タスク `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` の §0〜§11 を熟読
- [ ] phase-1 §6（Sentry 二重初期化リスク）の現行再現条件を確認
- [ ] task-02 の env 注入スキーマ（`SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_DSN`）を確認
- [ ] AC-1〜AC-9 の各検証手段が実行可能であることを確認（grep / tsc / build / test / staging deploy）
- [ ] スコープ in/out の境界を SCOPE.md と照合
- [ ] 不変条件 trace 表を index.md に固定
- [x] artifacts.json の metadata を確定（`taskType: implementation` / `visualEvidence: NON_VISUAL` / `workflow_state: implemented-local`）
- [ ] AC を Phase 11 evidence 計画と 1:1 対応させる

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 元タスク仕様 / phase-1 §6 / phase-2 §1 / phase-3 §4.3 / SCOPE.md / CLAUDE.md |
| 出力 | index.md の AC・不変条件 trace・metadata、artifacts.json の phases 配列 |

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` §0〜§2
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` §6 リスク
- `CLAUDE.md` 不変条件 #1〜#7

## 成果物

- `index.md`（AC / 不変条件 trace / Phase 索引が確定）
- `artifacts.json`（metadata 確定）
- `artifacts.json` / `outputs/artifacts.json`（implemented-local 状態へ同期済み）

## 完了条件（DoD）

- [ ] AC-1〜AC-9 が測定可能（コマンド・期待値が明文化済）
- [ ] 不変条件 #1〜#8 が trace 表で本 task の扱いと結びついている
- [ ] 真の論点 5 件すべてに採用案が記録されている
- [x] artifacts.json の `metadata.workflow_state` が `implemented-local`、`docs_only` が `false`
- [ ] 元タスク §0.7 の凍結シグネチャが phase-03 で転載される前提が確認済

## 統合テスト連携

- 本 Phase は local implementation の契約確定であり、Phase 11 の状態語彙は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とする。
- 実装後の typecheck / lint / test / build / grep gate 5 点は Phase 11 `outputs/phase-11/evidence/` に集約する。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 1
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
