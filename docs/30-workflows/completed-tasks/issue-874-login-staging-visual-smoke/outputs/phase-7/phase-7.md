**[実装区分: 実装仕様書]**

# Phase 7: カバレッジ確認 / 局所スコープ宣言

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 4-6 |

## 1. coverage 対象（局所宣言）

| カテゴリ | path | 計測対象 |
|---|---|---|
| TypeScript (spec) | `apps/web/playwright/tests/login-smoke.spec.ts` | `EVIDENCE_DIR` 初期化分岐 2 経路（env あり / env なし） |
| Shell script | `scripts/run-login-staging-smoke.sh` | (a) usage / exit 1 経路、(b) 引数優先経路、(c) env fallback 経路、(d) 正常 mkdir → playwright invoke 経路 |
| 生成物 | `outputs/phase-11/staging-screenshots/*.png` | 7 件存在、各 non-empty かつ ≤ 500KB |

明示的に **広域 `apps/web/**` / `scripts/**` の coverage 計測指定は行わない**（本 task の変更面以外を巻き込むと既存 coverage gate の挙動を歪めるため）。

## 2. coverage 計測手段

| 種別 | 手段 |
|---|---|
| spec 分岐 (env あり / なし) | TC-LOCAL-01 + TC-STAGING-01 の実行で両分岐を踏む |
| shell 4 経路 | TC-SHELL-01 / 02 / 03 + 実 staging smoke で 4 経路を踏む |
| 生成物検証 | Phase 5 ステップ 6 の `find` / `test -s` |

## 3. coverage 非対象（明示）

- `playwright.config.ts`（無改変のため対象外）
- 他 visual spec（本 task で触らない）
- `apps/web/src/**`（本 task で触らない）
- `apps/api/**`（無改変）

## 4. coverage 報告物

| 項目 | path |
|---|---|
| local 互換ログ | `outputs/phase-11/evidence/local-compat.log` |
| shellcheck ログ | `outputs/phase-11/evidence/shellcheck.log` |
| staging smoke ログ | `outputs/phase-11/staging-smoke.log` |
| PNG inventory | `outputs/phase-11/evidence/png-inventory.txt` (`ls -lS outputs/phase-11/staging-screenshots/` 出力) |

## 5. Phase 7 完了条件

- [x] coverage 対象を spec 1 ファイル / shell 1 ファイル / 生成物 7 PNG に局所明示
- [x] coverage 計測手段を確定
- [x] 非対象を明示
- [x] 報告物 path を確定

## 6. 次 Phase への引き継ぎ

Phase 8 では本 Phase で確定した局所 coverage を維持しつつ、最小リファクタリング（shell helper 内 path 計算の重複除去、コメント整理）の範囲を決定する。本 task は差分が極小のためリファクタリング余地は最小限。
