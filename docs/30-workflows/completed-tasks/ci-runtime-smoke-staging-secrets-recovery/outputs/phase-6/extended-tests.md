# Phase 6: テスト拡充（実行結果）

## 追加カバレッジ判定

| ID | ケース | 判定 |
|----|--------|------|
| TC-04 | URL と repository-local missing path の同一行混在 | external URL は ref 単位で除外し、local missing は検出 |
| TC-07 | 現リポジトリ実体 | 17 references / 32 workflow files を確認 |
| bash syntax | `bash -n` | `verify-workflow-doc-refs.sh` / test script とも OK |

## 回帰 guard

`runtime-smoke-staging.yml` を stale path に戻すと TC-02 経路が踏まれて exit 1 になる。CI workflow が dev/main push と PR で必ず走るため再発検出される。

## 判定

同一行混在 false negative を塞ぐ TC-04 を追加し、TC-01〜TC-07 で今回の guard 契約に必要な分岐を確認する。
