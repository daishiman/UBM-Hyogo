# Phase 6: テスト拡充

[実装区分: 実装仕様書]

## 目的

Phase 4 で書いた happy path / 主要 dedup ケースに加え、fail path と回帰 guard を追加する。

## 追加テストケース

| ID | 目的 | 期待 |
|----|------|------|
| TC-KV-06 | `payload.policy_id` 欠落時の dedup key fallback（`name` → `alert_type` → `"unknown"`） | 既存 dedup key 仕様維持 |
| TC-KV-07 | minuteBucket 境界跨ぎ（59 秒 → 60 秒）で異なる key になる | Slack 配信 2 回 |
| TC-KV-08 | `dedupeTtlMs` を `deps` で上書き可能 | `expirationTtl` 引数が反映される |
| TC-KV-09 | KV `put` が throw → Slack 配信されず 5xx 系応答 | `expect(slackSendSpy).not.toHaveBeenCalled()` |
| TC-KV-10 | KV `get` が throw → エラー伝播 | 5xx 応答 |
| TC-REG-01 | 既存 cf-webhook-auth 失敗時の 401 応答は無変更 | 既存挙動維持 |
| TC-REG-02 | `SLACK_WEBHOOK_URL` 未設定時の 503 応答は無変更 | 既存挙動維持 |

## 実行コマンド

```bash
mise exec -- pnpm --filter @repo/api test alert-relay
```

## 完了条件

- [ ] 上記 5 ケースが PASS
- [ ] 既存テスト件数（KV 化前）+ TC-KV-* + TC-REG-* の合計件数が記録されている
- [ ] `outputs/phase-06/test-supplement.md` に件数サマリーが記録されている
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 6
- status: completed

## 目的

追加テストで failure path と boundary を補強する。

## 実行タスク

- KV failure、Slack failure retry、TTL boundary を検証する。

## 参照資料

- `outputs/phase-06/test-supplement.md`

## 成果物/実行手順

- `outputs/phase-06/test-supplement.md`

## 完了条件

- [x] 追加テストが PASS

## 統合テスト連携

- focused Vitest 21 cases。
