# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 6 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 6 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-06/main.md

## 完了条件

- [x] Phase 6 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 06 — 異常系検証

[実装区分: 実装仕様書]

## 異常系シナリオ

| # | シナリオ | 期待挙動 | 期待 exit |
| --- | --- | --- | --- |
| E1 | `--base-url` 到達不能（DNS / connect refused） | 全件 `status=0 body.error='network'`、verdict=fail（接続不能扱いで `others=N`）。実装上は全件 network なら exit 2 で接続不能を明示 | 2 |
| E2 | session cookie 無効 | 全件 401。`others=N`、`verdict=fail` | 1 |
| E3 | queue not_found（誤 id） | 全件 404。`others=N`、`verdict=fail` | 1 |
| E4 | queue 既に resolved | 1 件目で 200 / 残りで 409 `state_conflict` または `race_lost` 混在 → `state_conflict` は others 扱いで `fail`。Phase 11 ではこのケースを避ける（fixture を queued で用意） | 1 |
| E5 | `--concurrency=1` | race を再現できないため usage error、exit 2 | 2 |
| E6 | fetch timeout（>10s） | 該当 fetch のみ network error 扱いで others。残りで判定 | analysis 次第（pass / fail） |
| E7 | `--tag-codes` 未指定 + `--action=confirmed` | server で 400 `validation_error` を返す可能性 → others=N で fail | 1 |
| E8 | rejected で `--reason` 空 | server 400 `reason_required` → others=N で fail | 1 |
| E9 | 引数不足（`--queue-id` 抜け） | parseArgs validation で throw、stderr に usage、exit 2 | 2 |

## 検証手段

- E1: `--base-url http://127.0.0.1:1` で実行（local テスト）
- E2: 空 cookie / 期限切れ cookie で実行
- E3: 存在しない queue id を指定
- E5: `--concurrency 1`
- E9: 引数を 1 つ削って実行

E2/E3/E4/E7/E8 は staging 上で意図的に再現すると副作用を残しうるため、Phase 11 本実行とは別の fixture で行う（または local API で再現）。

## DoD

- E1 / E5 / E9 がローカルで確認可能
- E2 / E3 は Phase 11 staging 確認時に 1 度だけ意図的に試行し、evidence に分けて保存

## 成果物

- `outputs/phase-06/main.md`

## 次 Phase

- [phase-07.md](./phase-07.md): AC マトリクス
