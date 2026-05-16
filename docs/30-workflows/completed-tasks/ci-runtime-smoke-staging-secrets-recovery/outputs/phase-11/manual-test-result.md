# Phase 11: 手動テスト（NON_VISUAL）

## 種別

CI / 運用設定変更。UI/UX 変更なし。スクリーンショット非取得（PII / secret マスキング誤り混入リスク回避）。

## 証跡

| ソース | ファイル |
|--------|---------|
| local guard 実行 | `evidence/verify-workflow-doc-refs.txt` |
| guard test | `evidence/verify-workflow-doc-refs-test.txt` |
| bash 構文チェック | `evidence/bash-syntax.txt` |
| actionlint | `evidence/actionlint.txt` |
| Phase 12 strict 7 件 compliance | `evidence/phase12-compliance.txt` |
| runtime pending marker | `evidence/runtime-pending.md` |
| user 操作後の secret 一覧 | **PENDING**（user-gated。取得時は secret 名のみ・値は記録しない） |
| runtime-smoke-staging 再実行ログ | **PENDING**（user-gated。job URL + step exit code、bearer/member id は記録しない） |

## 完了条件

- guard test SUMMARY: 7 passed / 0 failed → **DONE**
- local guard exit 0 → **DONE**
- secrets-list 5 行 → **PENDING (user)**
- smoke job exit 0 → **PENDING (user-approved rerun)**

## 判定

repo-local: **PASS**。runtime: **PENDING**（user 承認後）。
