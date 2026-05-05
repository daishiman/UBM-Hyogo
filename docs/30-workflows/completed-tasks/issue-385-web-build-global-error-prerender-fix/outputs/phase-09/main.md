[実装区分: 実装仕様書]

# Phase 9 合意 — 品質保証ゲート

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| phase | 9 / 13 |
| 改訂日 | 2026-05-03 |
| 実装区分 | 実装仕様書 |
| 状態 | pending（ゲート定義完了・実走は Phase 11 / user 指示後) |

## 合意 summary

Plan A 実装完了後に実走する 5 ゲート（typecheck / lint / test / build / build:cloudflare）+ 補助 grep + lefthook + CI 影響を確定。前段失敗時は後段を実行せず Phase 5 ランブックへ差し戻す fail-fast 戦略を採る。

## Phase deliverables

### 5 ゲート

| # | ゲート | コマンド | 対応 AC |
| --- | --- | --- | --- |
| G-1 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | AC-4 |
| G-2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | AC-5 |
| G-3 | test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | AC-9 |
| G-4 | build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | AC-1 / AC-3 |
| G-5 | cloudflare build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | AC-2 / AC-3 |

### G 別失敗時判定（要約）

- G-1 fail: `getAuth()` 戻り型と route handler 分割代入の整合崩れ / `import type` 漏れ → Phase 5 差し戻し
- G-2 fail: unused import（旧 `NextAuth` 等の削除漏れ）/ `import type` 表記の混入 → Phase 5 清書
- G-3 fail: mock 形式の不整合 / lazy factory 経路カバレッジ不足 → Phase 5 で test 修正
- G-4 fail（`useContext` null 出現）: Plan A 不十分（top-level value import 漏れ） → Phase 8 DC-2〜DC-6 grep 再実行
- G-4 fail（その他 prerender エラー）: Phase 5 差し戻し
- G-5 fail: G-4 と同様 + OpenNext 1.19.4 dynamic import 互換確認

### 補助 grep（source guard L3）

```
rg -n '^import\s+(?!type)' apps/web/src/lib/auth.ts | rg 'from "next-auth'
rg -n '^import\s+(?!type).*from "next-auth/react"' apps/web/src/lib/auth/oauth-client.ts
```

両方 0 hit が AC-6 PASS 条件。

### lefthook / CI gate 影響

- pre-commit / pre-push hook: 既存ルール（typecheck / lint）通過必須。本タスク改修で追加 hook なし
- verify-indexes-up-to-date: skill index drift 検出のため Phase 12 で `pnpm indexes:rebuild` 実行
- coverage gate: 既存テストの mock 切替のみで logic 変更なし、coverage 影響軽微（実測時に確認）

### evidence 永続化

- typecheck / lint / test の exit code とサマリは `outputs/phase-09/main.md` に追記
- build / build:cloudflare の stdout 抜粋は `outputs/phase-11/build-smoke.md` / `build-cloudflare-smoke.md` に永続化
- secret 値は evidence に転記しない（不変条件 #16）

## 状態

- **pending**: 5 ゲートの定義 / 失敗時判定 / 評価方針が確定。実走（typecheck / lint / test / build / build:cloudflare の実行と exit code 取得）は **未実施**。本 Phase ではコード変更 / commit / push / PR を実施しない

## 次 Phase への引き渡し

Phase 10（最終レビュー）へ次を渡す:

- 5 ゲート実走計画
- 補助 grep 仕様
- lefthook / CI gate 影響評価
- skill index rebuild 必要性（Phase 12 引き継ぎ）
- Phase 11 へ持ち越す実測 evidence 4 ファイル（main / build-smoke / build-cloudflare-smoke / prerender-output-check）
