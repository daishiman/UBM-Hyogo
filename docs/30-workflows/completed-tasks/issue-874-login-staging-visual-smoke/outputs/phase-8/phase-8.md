**[実装区分: 実装仕様書]**

# Phase 8: リファクタリング / 重複除去

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 5-7 |

## 1. リファクタリング判断

本 task の総差分は spec 2 行 + shell 30 行程度のため、**リファクタリング余地は最小限**。以下のみを実施対象とする。

| 項目 | 内容 | 判定 |
|---|---|---|
| spec 改修の三項分岐の冗長 | `process.env.PLAYWRIGHT_EVIDENCE_DIR ? resolve(...) : resolve(...)` の `resolve` 重複 | **保持**（可読性優先、`?? <default>` で文字列直結すると Playwright cwd の処理が変わるリスクあり） |
| shell helper の `REPO_ROOT` 計算 | `cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd` の 1 箇所利用 | **保持**（重複なし） |
| shell helper コメント | usage / 役割記述 | **保持**（shellcheck / レビュー時の補助） |
| `mkdir -p` の冗長性 | playwright が出力時に作らない可能性に備える | **保持** |
| state 配列の重複 | `login-smoke.spec.ts` は無改変方針 | **保持** |
| dead code | 検出されない | **N/A** |

## 2. 命名整合確認

| 命名 | 規約 | 整合 |
|---|---|---|
| `scripts/run-login-staging-smoke.sh` | kebab-case + `.sh` 拡張子 (既存 `scripts/cf.sh` / `scripts/coverage-guard.sh` と整合) | OK |
| `outputs/phase-11/staging-screenshots/` | kebab-case ディレクトリ (既存 `outputs/phase-11/screenshots/` と整合) | OK |
| evidence PNG 名 | `login-<state>.png` (mobile は `login-input-mobile.png`) | OK |
| 環境変数 | `PLAYWRIGHT_STAGING_BASE_URL` / `PLAYWRIGHT_EVIDENCE_DIR`（既存 `playwright.config.ts` と一致） | OK |

## 3. drift / navigation 整合

| 項目 | 確認 |
|---|---|
| local 既定値 path が親 workflow path と一致 | OK（Phase 5 ステップ 1 diff で保持） |
| staging path が本 workflow 配下に閉じている | OK（`outputs/phase-11/staging-screenshots/`） |
| 親 workflow への live ref 残骸 | grep で 0 件確認（Phase 5 ステップ 8）|

## 4. リファクタリング実施項目

- なし（リファクタリング余地が最小限のため、Phase 5 の差分をそのまま実装する）
- Phase 5 ステップで「shellcheck clean」が満たされていれば本 Phase は no-op

## 5. Phase 8 完了条件

- [x] リファクタリング判断を表形式で記録
- [x] 命名整合を確認
- [x] drift / navigation 整合を確認
- [x] 実施項目「なし」を明示し根拠を提示

## 6. 次 Phase への引き継ぎ

Phase 9 では typecheck / lint / shellcheck / spec gate / playwright local 互換性の総合品質保証を行い、Gate-B を判定する。
