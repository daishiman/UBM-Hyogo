# Phase 1: 要件定義 / GO 判定 / silent failure 排除条件確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| Source | `outputs/phase-1/phase-1.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |

## 目的

Next.js standalone build における `instrumentation.ts` 自動 copy 不在問題を、build pipeline 内で恒常解決するための要件と silent failure 排除条件を SSOT として確定する。Phase 2（既存 state 調査）の GO/NO-GO を判定する。

## 実行タスク

詳細は `outputs/phase-1/phase-1.md` を正本とする。要点:

- 親タスク task-03 が確定する `instrumentation.ts` の export 仕様（`register()` / `__ubmSentryInitialized__`）を前提として記述
- silent failure シナリオ（build success かつ instrumentation 不在 → Sentry server event 欠落）を構造的に排除する条件を確定
- CI gate fail 条件 5 種を確定:
  1. `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` 不在
  2. 当該ファイルに文字列 `register` / `Sentry` のいずれかが含まれない
  3. patch script 実行時 `cwd` が `apps/web` 以外
  4. patch script 自体が exit code ≠ 0
  5. `server/instrumentation.js.nft.json` の trace files copy に失敗
- スコープ確定（patch script 改修 + regression test + CI gate + RUN BOOK の 4 成果物を 1 サイクル内で完了）
- API contract 不変 / `apps/api` 非接触 / secret 非接触 を不可侵条件として明文化

## 統合テスト連携

Phase 4 の vitest / node --test シナリオで、patch script の入出力契約と CI post-build assertion の expectation を確定する。

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md`
- `apps/web/open-next.config.ts`
- `apps/web/src/instrumentation.ts`（task-03 で配置済み）
- `.github/workflows/`（既存 web build job）

## 成果物

- `outputs/phase-1/phase-1.md`

## 完了条件

- silent failure 排除条件 4 種が SSOT として確定
- スコープ（既存 script 改修 + regression test + CI gate + RUN BOOK の 4 成果物 / 1 サイクル）が固定され不可侵条件が文書化
- 親タスク task-03 の export 仕様参照点が明示
