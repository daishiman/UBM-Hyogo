# Phase 7 — テスト / カバレッジ

## 1. テストファイル

`scripts/__tests__/verify-phase12-compliance.spec.ts` に以下を含める。

### Suite: `verifyComplianceFile`

| ID | ケース | 期待 |
| --- | --- | --- |
| ICF-1 | `pass` fixture | `{ ok: true }` |
| ICF-2 | `fail-missing-file` fixture（既存） | `{ ok: false, reason: "missing-file" }` |
| ICF-3 | `fail-missing-heading` fixture（既存） | `{ ok: false, reason: "missing-heading" }` |
| ICF-4 | `fail-missing-evidence` fixture（新規） | `{ ok: false, reason: "missing-evidence" }`, `details` に missing path を含む |

### Suite: `parsePhase11EvidenceClaims`

| ID | ケース | 期待 |
| --- | --- | --- |
| PPE-1 | heading + 3 行 table | rows.length === 3 |
| PPE-2 | heading 無し | rows.length === 0 |
| PPE-3 | heading のみ / table 不在 | rows.length === 0 |
| PPE-4 | path 列が backtick 装飾 | `evidencePath` から backtick が除去される |
| PPE-5 | status `Present` / `〇` 等表記揺れ | `unknown` に正規化 |
| PPE-6 | 重複 path | 1 行のみ採用 |

### Suite: `verifyPhase11EvidenceExistence`

| ID | ケース | 期待 |
| --- | --- | --- |
| VPE-1 | rows 空 | `{ ok: false, missing: [], invalidStatuses: [] }` |
| VPE-2 | docs-only 3 点 present + 実体あり | `{ ok: true }` |
| VPE-3 | 1 件 missing | `{ ok: false, missing.length === 1 }` |
| VPE-4 | status unknown 1 件 | `{ ok: false, unknown.length === 1 }` |
| VPE-5 | absolute path 指定 | `missing[]` に append + `ok: false` |
| VPE-6 | status pending / n/a は実在チェック対象外 | `{ ok: true }`（実体不在でも fail にならない） |

## 2. カバレッジ目標

- 新規 ts 2 ファイル: 行 / branch / function いずれも 90% 以上
- 既存 `verify-compliance-file.ts` の編集分岐（`reason: "missing-evidence"` ルート）に最低 1 件のテスト到達

## 3. 実行コマンド

```bash
mise exec -- pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts
mise exec -- pnpm test:phase12-compliance
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 4. coverage 検証

```bash
mise exec -- pnpm test --coverage scripts/__tests__/verify-phase12-compliance.spec.ts
```

root `vitest.config.ts` の include に `scripts/__tests__/**` が含まれていることを Phase 5 で sanity check 済みとする。

## 5. 回帰確認

- 既存 fixture (`pass` / `fail-missing-file` / `fail-missing-heading`) の振る舞いが変わらないこと
- `pnpm verify:phase12-compliance` を任意の既存 workflow root（例: `issue-617-ci-test-time-reduction-split`）に対して実行し、本変更前後で **新たに fail にならない**ことを確認（既に Phase 11 evidence section + 実体ファイルが揃っている場合）
- もし既存 root のうち Phase 11 evidence section / 実体ファイル不整合が見つかった場合、本タスク PR の Phase 9 で個別に評価し、別 follow-up issue として記録する（本タスクで一括修復はしない）
