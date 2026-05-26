# Phase 6 — テスト拡充

## 1. 判定

**新規 test 追加なし**。理由を以下に列挙する。

| 候補                                                     | 判定        | 理由                                                                                              |
| -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `scripts/smoke/__tests__/retire-static-fallback.test.sh` | 不採用      | grep gate は CI/pre-push の bash 1 行で代替可能。独立 script は維持コストに見合わない             |
| `.github/workflows/verify-no-static-fallback.yml`        | 不採用      | 単一 file の grep gate のために workflow 1 本立てるのは過剰。pre-push hook 統合の方が即時性が高い |
| vitest spec（mint helper の必須化）                      | 不採用      | mint helper のロジックは変わらない。撤去は呼び出し側の workflow 構造のみ                          |

## 2. 既存 test の regression coverage

| 既存 test                                                       | 本タスクとの関係                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `scripts/smoke/__tests__/runtime-attendance-provider.test.sh`   | mint step が GITHUB_ENV へ export する bearer を runner が受け取れることを保証 |
| `scripts/smoke/__tests__/mint-staging-bearers.spec.ts`（存在時）| mint helper 自体のロジック保証（撤去で挙動変化なし）                        |

## 3. CI gate 追加

pre-push hook（`lefthook.yml`）または既存 `verify-*` workflow に grep gate 1 行を追加するかは、本タスクスコープ外（実装 PR 時に判断）。仕様書としては「grep gate を local + PR pre-flight で実行する」運用ルールを文書化するに留める。
