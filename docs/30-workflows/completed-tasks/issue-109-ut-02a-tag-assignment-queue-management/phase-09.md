# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Issue | #109 [UT-02A] tag_assignment_queue 管理 Repository / Workflow |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

## 目的

型安全 / lint / unit / contract test を全 PASS とし、coverage threshold（branch 80% 目安）を満たすことを確認する。さらに D1 migration drift と 02a `memberTags.ts` への write 経路 0 件を grep 検証することで、不変条件 #5 / #13 を構造的に担保する。

## 実行タスク

1. typecheck（apps/api）
2. lint（apps/api）
3. unit test（queue repository / workflow / aliasMap / retryPolicy）
4. contract test（@repo/shared mock provider 経由）
5. coverage threshold 確認（branch 80% 以上）
6. D1 migration drift check
7. memberTags.ts write 経路 grep 検証
8. 無料枠見積もり / secret hygiene

## 実行手順

### ステップ 1: 型安全

```bash
mise exec -- pnpm -F @repo/api typecheck
```

- `TagAssignmentQueueRow` / `QueueTransitionResult` / zod infer が API response と一致

### ステップ 2: lint

```bash
mise exec -- pnpm -F @repo/api lint
```

### ステップ 3: unit test

```bash
mise exec -- pnpm --filter @repo/api exec vitest run src/lib/queue
mise exec -- pnpm --filter @repo/api exec vitest run src/routes/admin/tagQueue
```

- 必須カバー: enqueue / transition (queued→resolved / queued→rejected / queued→dlq) / idempotency / retry attempts cap / DLQ 移送 / aliasMap 双方向

### ステップ 4: contract test

```bash
mise exec -- pnpm --filter @repo/shared exec vitest run tagQueue
```

- Mock provider と D1 binding 経由 repository の契約一致を確認

### ステップ 5: coverage

```bash
mise exec -- pnpm --filter @repo/api exec vitest run --coverage
```

| 指標 | しきい値 | 対象 |
| --- | --- | --- |
| branch | 80% 以上 | `apps/api/src/lib/queue/**` / `apps/api/src/routes/admin/tagQueue.ts` |
| line | 85% 以上 | 同上 |
| function | 90% 以上 | 同上 |

### ステップ 6: migration drift check

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env staging
```

- `tag_assignment_queue` テーブルの最新 migration が両環境で同一適用済みであること

### ステップ 7: memberTags.ts write 経路 grep（不変条件 #13）

```bash
grep -RIn "INSERT INTO member_tags\|UPDATE member_tags\|DELETE FROM member_tags" apps/api/src
grep -RIn "memberTags.*\.\(insert\|update\|delete\)" apps/api/src
```

- 期待: 02a 配下からの write 0 件。実際の write は 07a `tagQueueResolve` workflow（別タスク管轄）経由のみ
- 02a `apps/api/src/repositories/memberTags.ts` は read-only（`select` のみ）

### ステップ 8: IPC ドリフト grep（不変条件 #5）

```bash
grep -RIn "from.*apps/api\|from.*lib/queue\|d1\.prepare" apps/web/src
grep -RIn "DB_BINDING" apps/web/src
```

- 期待: 0 件（apps/web は API 経由でのみ queue にアクセス）

### ステップ 9: 無料枠見積もり

| 操作 | 1 日想定 | 月間 D1 writes |
| --- | --- | --- |
| candidate enqueue | 5 | 150 |
| status transition (queued→resolved) | 5 | 150 |
| status transition (queued→rejected) | 1 | 30 |
| retry attempt update | 1 | 30 |
| DLQ 移送 | 0.1 | 3 |
| audit_log writes | 12 | 360 |

- 合計 723 writes / 月 = D1 free tier 100k writes/日 の 0.025%（十分な余裕）

### ステップ 10: secret hygiene

- 本タスクで新規 secret なし
- D1 binding は `apps/api/wrangler.toml` で管理
- ログ出力に queue_id 以外の PII（email / responseId 生値）が混入していないことを sample log で確認

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #5 D1 直接アクセスは apps/api に閉じる | grep ステップ 8 | TBD |
| #13 02a memberTags.ts read-only 維持 | grep ステップ 7 | TBD |
| 監査 | 全 transition に audit_log entry | unit test |
| retry / DLQ | attempts cap 到達で DLQ 移送 | unit test |
| 仕様語 ↔ DB 語 | aliasMap 双方向で 1:1 | unit test |
| 無料枠 | 723 writes / 月 | 99.97% 余裕 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-04/test-strategy.md` | test 計画 |
| 必須 | `outputs/phase-08/main.md` | 命名統一 |
| 必須 | `CLAUDE.md` §シークレット管理 | secret hygiene |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck PASS | 9 | pending | apps/api |
| 2 | lint PASS | 9 | pending | apps/api |
| 3 | unit test PASS | 9 | pending | lib/queue + routes |
| 4 | contract test PASS | 9 | pending | @repo/shared |
| 5 | coverage 80% branch | 9 | pending | vitest --coverage |
| 6 | migration drift 0 | 9 | pending | cf.sh d1 |
| 7 | memberTags.ts write 0 件 | 9 | pending | grep |
| 8 | IPC drift 0 件 | 9 | pending | grep |
| 9 | secret hygiene | 9 | pending | log redact |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 全 PASS が GO 前提 |
| Phase 11 | grep 結果と coverage を evidence に転記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-09/main.md` | チェック結果サマリ |
| ドキュメント | `outputs/phase-09/quality-report.md` | typecheck / lint / unit / contract / coverage / grep の実測 |
| メタ | `artifacts.json` | Phase 9 を completed |

## 完了条件

- [ ] typecheck / lint / unit / contract が全 PASS
- [ ] coverage branch 80% / line 85% / function 90% を達成
- [ ] migration drift が 0 件
- [ ] 02a memberTags.ts への write 経路が grep で 0 件
- [ ] apps/web からの D1 / queue 直接参照が grep で 0 件
- [ ] 無料枠想定 99% 以上の余裕
- [ ] secret 漏出なし
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認

- 全 9 サブタスクの実測結果を `quality-report.md` に記録
- artifacts.json で phase 9 を completed

## 次 Phase

- 次: 10 (最終レビューゲート)
- 引き継ぎ: 全 PASS を GO 判定の根拠とする
- ブロック条件: 1 項目でも FAIL なら差し戻し（特に grep 検証は構造的不変条件のため即差戻し）
