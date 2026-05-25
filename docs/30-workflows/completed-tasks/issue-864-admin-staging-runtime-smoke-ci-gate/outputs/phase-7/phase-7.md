# Phase 7: カバレッジ確認

## 目的

concern と dependency edge の coverage を可視化する。

## concern カバレッジマトリクス

| concern | カバーする test | AC |
| ------- | --------------- | -- |
| cf.sh tail subcommand 認識 | TC-J / TC-K | AC-1 |
| /admin 200 probe | TC-D | AC-2 |
| boundary log / digest grep | TC-G / TC-H / FP-2 | AC-3 |
| session cookie 2 層通過 | TC-1/TC-2/TC-5 + Gate-B 実走 | AC-4 |
| web-cd gate job 発火 | actionlint + FP-6 + Gate-B | AC-5 |
| evidence + redaction | TC-I / G-3 | AC-6 |
| test 追加 | 本 Phase 全体 | AC-7 |
| graceful skip | FP-6 | AC-8 |

→ 全 AC に最低 1 test が紐づく。AC-4/AC-5 の runtime 部分は Gate-B（staging 実走）で最終確認。

## dependency edge カバレッジ

| edge | 確認 |
| ---- | ---- |
| runner → cf.sh tail | TC-K（経由確認）/ FP-1（空出力耐性） |
| job → mint helper | mint step が cookie を GITHUB_ENV へ渡す（実走で確認） |
| job → runner | run step exit code が job 成否に反映 |
| deploy-staging → admin-runtime-smoke | `needs:` 依存（actionlint で構文、実走で順序） |

## カバレッジ上の既知ギャップ（Gate-B で解消）

- 実 staging の `/admin` が本当に 200 を返すか（session cookie の 2 層通過の実証）は unit では stub のため、Gate-B（staging deploy 後実走）でのみ確定する。これは `runtime_pending` として Phase 11 へ引き継ぐ。

## 完了判定

- [x] 全 AC に test 紐付け
- [x] runtime-only ギャップを Gate-B へ明示移譲
