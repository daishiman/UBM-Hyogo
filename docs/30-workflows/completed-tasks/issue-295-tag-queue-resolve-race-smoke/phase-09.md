# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 9 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 9 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-09/main.md

## 完了条件

- [x] Phase 9 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 09 — 品質保証

[実装区分: 実装仕様書]

## 静的検査

| ツール | 対象 | 期待 |
| --- | --- | --- |
| `pnpm typecheck` | TS 配下のみ。`.mjs` は対象外（type 検査は JSDoc コメントベースで自己完結） | pass（本 PR で TS 側に変更なし） |
| `pnpm lint` | eslint。`scripts/**/*.mjs` が対象であれば適用 | pass |
| shellcheck（任意） | `scripts/smoke/__tests__/tag-queue-race.test.sh` | warning 0 |

## 動的検査

| 項目 | コマンド | 期待 |
| --- | --- | --- |
| shell test | `bash scripts/smoke/__tests__/tag-queue-race.test.sh` | exit 0、4 case 全 pass |
| dry-run smoke | `node scripts/smoke/tag-queue-race.mjs --dry-run ...` | redact 済み options JSON、cookie が `***` |
| 異常系 E1 / E5 / E9 | Phase 06 のとおり | 期待 exit code |

## 機密扱い確認

- evidence JSON に `sessionCookie` が含まれていないことを `grep -i cookie outputs/phase-11/**/result.json` で確認
- stdout も同様に `***` 表示

## CI 連携

- 本 smoke は手動実行のみ。CI gate には追加しない（staging 副作用と fixture 都合）。
- 将来 CI 化する場合は `scripts/smoke/ci-summary-post.sh` 連携で結果 issue / PR コメント化を検討（先送り）。

## DoD

- 上記静的・動的検査がすべて pass
- secrets 漏洩 grep が hit 0

## 成果物

- `outputs/phase-09/main.md`

## 次 Phase

- [phase-10.md](./phase-10.md): 最終レビュー
