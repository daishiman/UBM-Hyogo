# Phase 11 outputs / main

## 目的

Phase 5 runbook を実行し、evidence を `outputs/phase-11/evidence/` 配下に保存する。

## 実行ステップ（再掲）

1. `gh api` で 3 repo の release 取得
2. キーワード grep
3. `triage-table.md` 記入
4. 分岐:
   - 改善なし → `pkg-unchanged.log` 保存
   - 改善あり → A/B 3×3 実行 + `ab-summary.md`
5. `secret-hygiene-grep.log`（0 行期待）
6. `apps-api-untouched.log`（差分 0 期待）

## 完了条件

- [x] triage-table.md（2026-05-11 実行・改善なし判定）
- [x] pkg-unchanged.log（改善なし時）— porcelain・diff stat ともに空
- [x] secret-hygiene-grep.log 0 行（exit=1 = no match）
- [x] apps-api-untouched.log 差分 0

## 実行結果（2026-05-11）

- 3 repo × 直近 15 リリースを `gh api` で取得。
- triage キーワード hit はすべて websocket / 内部 refactor / 内部 test infra に限定され、socket pool / port reuse / EADDRNOTAVAIL / TIME_WAIT に対応する上流改善は 0 件。
- 結論: **Path A（改善なし）→ `apps/api/package.json#test:coverage` の `--maxWorkers=1 --minWorkers=1` を維持**。A/B 実験は本サイクル不実施。

## user 承認境界

- Step 1-2（read-only 取得）は事前 evidence として取得可
- Step 4b（A/B vitest 実行）は本実行サイクル内で実施可。user 承認必須は `apps/api/package.json` 編集、commit、push、PR、GitHub Issue 操作に限定

## evidence 一覧

```
outputs/phase-11/evidence/
├── workers-sdk-releases.json
├── undici-releases.json
├── workerd-releases.json
├── triage-grep-raw.log
├── triage-table.md
├── pkg-unchanged.log         # 改善なし時
├── ab-{2,4,auto}-run-{1,2,3}.log  # 改善あり時
├── ab-summary.md             # 改善あり時
├── secret-hygiene-grep.log
└── apps-api-untouched.log
```

## 次フェーズ

Phase 12 ドキュメント更新。
