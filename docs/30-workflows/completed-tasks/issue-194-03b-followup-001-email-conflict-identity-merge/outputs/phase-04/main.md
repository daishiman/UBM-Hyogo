# Phase 4: テスト戦略 — 実行記録（実装済 reflect）

## 状態
実施済み。unit + integration 16 ケース all green。E2E は Phase 11 manual smoke に寄せる方針確定。

## 追加テストファイル（実装結果）

| パス | 種別 | テスト数 |
| --- | --- | --- |
| `apps/api/src/services/admin/identity-conflict-detector.test.ts` | unit | 5 |
| `apps/api/src/repository/__tests__/identity-conflict.test.ts` | integration (in-memory D1) | 5 |
| `apps/api/src/repository/__tests__/identity-merge.test.ts` | integration (in-memory D1) | 6 |

合計 **16 テスト all green**。

## カバレッジ対応（ケース→AC マッピング）

- 完全一致候補抽出 / 不一致除外 / 自己除外 / NFKC + trim 正規化 / 空欄スキップ → 判定基準 AC
- merge atomic（alias / merge_audit / audit_log の 3 テーブル整合） → atomic transaction AC + #13
- 二重 merge → `MergeConflictAlreadyApplied`（UNIQUE 抑止） → 409 ALREADY_MERGED
- 不在 member → `MergeIdentityNotFound` → 404 MEMBER_NOT_FOUND
- self-reference → `MergeSelfReference` → 400 SELF_REFERENCE
- PII redaction（email / phone） → #3
- canonical 解決（`resolveCanonicalMemberId`） → canonical 解決 AC
- list の name+affiliation 完全一致 / dismiss 後の再検出抑止 / alias 登録済 source の除外 → list 動作 AC
- `parseConflictId` 境界 → `400 BAD_CONFLICT_ID`

## 未追加（背景）

- `apps/web/test/e2e/admin-identity-merge.spec.ts` (Playwright e2e):
  現状 e2e harness の DB seed が本タスクで必要な `response_fields(stable_key='fullName' | 'occupation')` seed と
  整合しないため、UI 経由の e2e は manual smoke (Phase 11) に寄せる。component 単位の振る舞いは
  API 側 integration test がカバー済。

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --no-coverage \
  apps/api/src/services/admin/identity-conflict-detector.test.ts \
  apps/api/src/repository/__tests__/identity-merge.test.ts \
  apps/api/src/repository/__tests__/identity-conflict.test.ts
# expected: 16 passed
```

## 引き渡し
- Phase 5 へ: 実機 D1 migration apply runbook と smoke 入力データ
