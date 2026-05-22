# Phase 9: 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 受入確認 |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | completed |

## 目的

index.md の AC-1〜AC-7 がすべて満たされていることを実コード / 実行ログで確認する。

## 受入条件 (AC) 確認

| AC | 内容 | 確認方法 | 期待 |
| --- | --- | --- | --- |
| AC-1 | `apps/web/app/layout.tsx` で `<ToastProvider>` が `{children}` を wrap | `git diff` / `grep "ToastProvider" apps/web/app/layout.tsx` | 1 行ヒット（JSX 内 wrap） |
| AC-2 | client boundary 判定が outputs/phase-02 にある | `cat outputs/phase-02/client-boundary-decision.md` | "use client" 確認結果記載 |
| AC-3 | `useAdminMutation.spec.tsx` が silent fail を出さない | `pnpm test useAdminMutation` の console output 検査 | warnMissingToastProvider 未出力 |
| AC-4 | dev で toast 目視 evidence | `outputs/phase-11/manual-smoke.md` | local static/build evidence PASS。authenticated admin visual smoke は user-session runtime gate |
| AC-5 | typecheck / lint PASS | `pnpm typecheck && pnpm lint` | exit 0 |
| AC-6 | p-08 DoD line 172 満たす | parallel-08 spec の DoD checkbox 状態 | チェック可能状態 |
| AC-7 | hydration mismatch / RSC error なし | `pnpm dev` console + `pnpm build` の warning 検査 | 該当 error なし |

## 検証コマンド一括実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation 2>&1 | tee /tmp/i01-test.log
mise exec -- pnpm -F "@ubm-hyogo/web" build 2>&1 | tee /tmp/i01-build.log
```

## AC 不達時の戻り先

| AC | 不達時の戻り先 |
| --- | --- |
| AC-1 / AC-5 | Phase 6 (実装手順) |
| AC-2 | Phase 2 (設計) |
| AC-3 | Phase 7 (テスト計画) |
| AC-4 | Phase 11 (Visual evidence) |
| AC-6 | Phase 8 (ドキュメント更新) |
| AC-7 | Phase 2 (hydration 設計見直し) |

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-09/acceptance.md | AC-1〜AC-7 の判定結果と evidence log 抜粋 |

## 完了条件

- [x] AC-1〜AC-7 の local/static/build 境界を判定済み。authenticated admin visual smoke は user-session runtime gate
- [x] 検証コマンドの実行ログが outputs/phase-09 / phase-11 / phase-12 に保存されている
- [x] 不達 AC は runtime visual gate として Phase 13/post-merge smoke に分離済み

## 次 Phase

Phase 10: リファクタ
