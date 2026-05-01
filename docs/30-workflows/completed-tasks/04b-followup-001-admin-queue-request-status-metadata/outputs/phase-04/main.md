# Phase 4: テスト戦略 — 成果物サマリ

## レイヤ別テスト戦略

| レイヤ | テスト対象 | ファイル | 主検証点 |
| --- | --- | --- | --- |
| Repository unit | `create` / `hasPendingRequest` / `markResolved` / `markRejected` / `findById` | `apps/api/src/repository/__tests__/adminNotes.test.ts` | 値域 / state 遷移 / pending ガード / 未知 id null / general 行に対する no-op |
| Routes integration | `POST /me/visibility-request` の再申請フロー | `apps/api/src/routes/me/index.test.ts` | resolved 後の再申請が 202、pending 行は常に 1 件 |

## AC ↔ test ケースの対応

詳細は `test-strategy.md` を参照。
