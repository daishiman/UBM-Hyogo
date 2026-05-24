[実装区分: 実装仕様書]

# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 6（20 テスト PASS） |
| 次 Phase | Phase 8（リファクタリング） |

## 目的

bash 関数の branch coverage を測定し、変更行限定で 100% 実行を確認する。stub の「helper 全関数が分岐ごとにテストされていること」を満たす。

## 変更対象ファイル

なし（測定のみ）

## カバレッジ測定手法

bash スクリプトの coverage 測定は `bashcov`（Ruby gem）または `kcov` で行う慣行があるが、本リポジトリでは軽量にするため、**関数単位の手動マッピング表** で代用する。`scripts/__tests__/` 配下の慣行（`scripts/d1/__tests__/*.bats`）と整合させる。

### カバレッジ表（関数 × テスト ID）

| 関数 / 分岐 | カバーする TC | カバー率 |
| --- | --- | --- |
| `enforce_history_off` 成功 | TC-01, TC-02 | 100% |
| `assert_stdin_piped` TTY 分岐 | TC-03 | 100% |
| `assert_stdin_piped` pipe 分岐 | TC-04 | 100% |
| `compute_fingerprint` 成功 | TC-05, TC-06 | 100% |
| `compute_fingerprint` 空入力 | TC-13 | 100% |
| `put_secret` 正常 | TC-10 | 100% |
| `put_secret` op fail | TC-11, TC-14 | 100% |
| `put_secret` cf.sh fail | TC-15 | 100% |
| `put_secret` dry-run | TC-09 | 100% |
| `put_secret` env invalid | TC-17 | 100% |
| `verify_name` 存在 | TC-12 | 100% |
| `verify_name` 不在 | TC-12 | 100% |
| `tail_window` 正常 | TC-16 | 100% |
| `tail_window` timeout | TC-16 | 100% |
| `dispatch put-production` state guard | TC-20 | 100% |
| 値漏洩 negative | TC-18, TC-19 | 100% |

> 全関数・全分岐がいずれかの TC でカバーされている。

## 検証経路

```bash
# bats verbose で各 TC が実際に対象関数を経由しているかを観察
mise exec -- bats --verbose-run scripts/__tests__/cf-rotate-sa-key.bats

# coverage-guard は bash 対象外だが、変更ファイル一覧と上記マッピング表を Phase 11 evidence に添付
```

> 注: 本タスクの変更コードは bash のみで、`coverage-guard.sh` の対象（TypeScript / Vitest）外。index.md メタ情報の「coverage AC 適用外（bash 専用 helper）」と整合させる。

## DoD

- [ ] カバレッジ表で全関数・全分岐が TC でマップされている
- [ ] 未カバー分岐が 0 件
- [ ] `coverage-guard.sh` 適用外であることが Phase 11 evidence に記載されている

## 次 Phase

Phase 8（リファクタリング）
