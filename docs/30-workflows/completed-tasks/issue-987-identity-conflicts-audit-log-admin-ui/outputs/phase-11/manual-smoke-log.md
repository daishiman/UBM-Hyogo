# Phase 11: 手動スモークログ（NON_VISUAL）

> 本タスクは `implemented_local_evidence_captured`。以下は staging で実施する手動確認手順であり、実行は user-gated。各ステップは実施時に結果を追記する。

## 主証跡（自動テスト）

| ソース | 件数 | 内容 |
| --- | --- | --- |
| `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts` | 11 PASS | dismiss → audit_log 記録 / 再 dismiss dismissalId 整合 / missing member no-audit / batch rollback / PII が audit payload に出ないこと |
| `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | 6 PASS | dismiss endpoint → `identity.dismiss` audit row / actorEmail 配線 / missing member 404 no-audit |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 11 PASS | `action=identity.dismiss` + target filter 通過 |

実行結果: `pnpm exec vitest run --config=vitest.d1.config.ts --hookTimeout=120000 --testTimeout=120000 apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts apps/api/src/routes/admin/identity-conflicts.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` → 3 files / 28 tests PASS。

screenshot を作らない理由: UI 画面に視覚的変更がなく、検証対象は API の監査記録挙動とフィルタ閲覧契約のため、自動 contract spec が一次証跡として十分。

## 手動確認手順（staging / user-gated）

| # | 手順 | 期待結果 | 実施結果 |
| --- | --- | --- | --- |
| 1 | admin として `/admin/identity-conflicts` で任意の conflict を dismiss する | `{ dismissedAt }` が返り、一覧から消える | 未実施 |
| 2 | `/admin/audit?action=identity.dismiss` を開く | 当該 dismiss イベントが時系列降順で表示される | 未実施 |
| 3 | `actorEmail` フィルタに自分の email を入れる | dismiss を実行した actor で絞り込める | 未実施 |
| 4 | `targetId` フィルタに target member id を入れる | 同一 target の merge / dismiss が横断表示される | 未実施 |
| 5 | reason に PII（email/電話）を含めて dismiss し audit payload を確認 | audit payload に reason 生値や PII が出ない | 未実施 |

## 既知の制限

- 本タスクは API 監査記録の追加に閉じる。`/admin/audit` の action プリセット選択肢追加（UX 改善）はスコープ外（Phase 12 未タスク候補）。
