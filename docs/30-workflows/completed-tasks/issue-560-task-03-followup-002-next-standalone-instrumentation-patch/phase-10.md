# Phase 10: 最終レビュー / runtime-export / OpenNext artifact drift 検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| Source | `outputs/phase-10/phase-10.md` |
| 状態 | completed |

## 目的

成果物全体の最終レビューと、runtime export / OpenNext artifact drift（Sentry register API 変更や standalone target path 変更）の有無を検証する。

## 実行タスク

- 親タスク task-03 が確定する `instrumentation.ts` の export 仕様（`register` / `__ubmSentryInitialized__`）を再確認し、patch script の verify token と整合
- `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` の path が OpenNext / Next.js 現バージョンで実在することを再確認
- runbook の章立て / 章ごとの参照リンク切れがないこと
- CI workflow YAML の step 順序（build → verify）が崩れていないこと
- secret 非接触: patch script log / runbook / test fixture に DSN / token / 内部 URL が含まれていないこと

## 参照資料

- `outputs/phase-3/phase-3.md`
- `outputs/phase-7/phase-7.md`
- `outputs/phase-9/phase-9.md`

## 成果物

- `outputs/phase-10/phase-10.md`（drift 確認チェックリスト）

## 完了条件

- runtime export / OpenNext artifact drift なし
- 不変条件 5 種（API contract 不変 / cwd 固定 / silent failure 防止 / secret 非接触 / secret hygiene）すべて満たす
