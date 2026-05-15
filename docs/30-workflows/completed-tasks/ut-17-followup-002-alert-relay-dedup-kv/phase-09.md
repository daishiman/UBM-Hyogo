# Phase 9: 品質保証（QA）

[実装区分: 実装仕様書]

## 目的

mirror parity、grep gate、CI 同等の検証を一括実行する。

## 実行コマンド一覧

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/api test

# grep gate
grep -rn "seenAlerts" apps/api/src/ || echo "OK: seenAlerts no longer referenced"
grep -rn "^wrangler " apps/api/scripts/ apps/api/package.json 2>/dev/null | grep -v "scripts/cf.sh" || echo "OK: no direct wrangler invocation"

# wrangler.toml の namespace_id が placeholder ではないことを確認
grep -A1 "ALERT_DEDUP_KV" apps/api/wrangler.toml | grep "id ="
```

## チェック項目

| 項目 | 基準 |
|------|------|
| typecheck | PASS |
| lint | PASS |
| api test 全件 | PASS |
| `seenAlerts` の残存 | ゼロ |
| `wrangler` 直接呼び出し | ゼロ（`bash scripts/cf.sh` 経由のみ） |
| `wrangler.toml` の namespace_id | 16 進文字列の実 ID（`<...>` の placeholder ではない） |
| 既存 alert-relay 仕様（auth / Slack format / retry）の保持 | 変更なし |

## 完了条件

- [ ] 上記すべて PASS
- [ ] `outputs/phase-09/qa.md` に各コマンドの結果（PASS/FAIL）を記録
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 9
- status: completed

## 目的

QA gate と user-gated runtime boundary を確認する。

## 実行タスク

- typecheck、lint、focused tests、grep gate を実行する。

## 参照資料

- `outputs/phase-09/qa.md`

## 成果物/実行手順

- `outputs/phase-09/qa.md`

## 完了条件

- [x] local QA が PASS

## 統合テスト連携

- focused Vitest 21 cases。
