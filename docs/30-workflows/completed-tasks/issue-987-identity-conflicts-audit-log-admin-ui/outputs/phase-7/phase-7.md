# Phase 7: カバレッジ確認（局所検証）

## 0. このフェーズの目的

本タスクで **変更した関数のみ**の line / branch カバレッジを実測し証跡に残す。
全体一律のカバレッジ目標ではなく、`dismissIdentityConflict()` と dismiss endpoint に対象を絞る。

> **[Feedback BEFORE-QUIT-002 / Feedback 5] の適用**: coverage の対象範囲を明示し、変更ファイル / ブロック以外を対象外とする。広域指定にせず、変更行の line / branch 実測値を残す。

---

## 1. カバレッジ対象範囲（明示）

| 区分 | 対象 | 理由 |
|------|------|------|
| 対象（line / branch 100% を目標） | `apps/api/src/repository/identity-conflict.ts` の `dismissIdentityConflict()` 関数 + `DismissAtomicBatchUnavailable` クラス | 本タスクで新規追加 / 修正したロジック |
| 対象（分岐確認） | `apps/api/src/routes/admin/identity-conflicts.ts` の dismiss endpoint（91-110 行）の actor 解決分岐（`claims.sub ?? user.memberId ?? "unknown-admin"` / `user.email ?? null`） | email 引数配線の分岐網羅 |
| 対象外 | `identity-conflict.ts` の `listIdentityConflicts` / `isConflictDismissed` / `parseConflictId` / `fetch*` ヘルパ | 本タスクで未変更（既存テストで担保済） |
| 対象外 | `identity-merge.ts` 全体 | 本タスクで未変更（回帰 guard のみ・Phase 6） |
| 対象外 | audit route（`audit.ts`） | 本タスクで未変更。TC-A01/A02 はフィルタ回帰 guard であり coverage 目標対象ではない |

---

## 2. 変更関数の分岐網羅マップ

`dismissIdentityConflict()` の分岐と、それを覆うテストの対応。

| 分岐 / 行 | 内容 | 覆う TC |
|-----------|------|---------|
| 正常パス（batch 実行 → return） | dismissal upsert + audit_log INSERT | TC-D01 / TC-D06 |
| `redactIdentityReason(reason)` 経路 | PII を含む reason の redact | TC-D03 |
| ON CONFLICT 更新パス（2 回目以降） | 二重 dismiss で dismissal 更新 + audit append | TC-D04 |
| `if (typeof db.batch !== "function") throw` の true 分岐 | batch 非対応 → `DismissAtomicBatchUnavailable` | TC-D05 |
| `if (...) throw` の false 分岐 | batch 利用可 → 正常実行 | TC-D01 ほか正常系全件 |
| `actorAdminEmail ?? null`（null 経路） | email 未指定 | TC-D03（`null` 指定）/ repository 既存ケース |
| `actorAdminEmail`（非 null 経路） | email 指定 | TC-D01（`admin@example.com`）/ TC-D06 |

dismiss endpoint（route）の分岐:

| 分岐 | 内容 | 覆う TC |
|------|------|---------|
| `parseConflictId` null → 400 | 不正 conflictId | 既存テスト or 追加（参考。本タスク主眼外） |
| Zod parse 失敗 → 400 | reason 欠落等 | 既存 schema テストで担保 |
| `requireAdmin` 401 | 未認可 | TC-D02 |
| 正常 → 200 + email 配線 | actor_email 配線 | TC-D01 |

> branch 全網羅の確認: 上表の全分岐が少なくとも 1 TC に対応している。未到達分岐ゼロを目標とする。

---

## 3. coverage 実行コマンド

vitest の coverage で対象ファイルのみを集計する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared build

# dismiss 系テストを対象に coverage 取得（変更ファイルに include を絞る）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --coverage \
  --coverage.include='src/repository/identity-conflict.ts' \
  --coverage.include='src/routes/admin/identity-conflicts.ts' \
  apps/api/src/routes/admin/identity-conflicts.contract.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts
```

> 注: `--root=../..` の都合で `--coverage.include` のパスは `apps/api` ルート相対（`src/...`）で指定する。`vitest.config.ts` の coverage provider 設定に従い、provider が未設定の場合は `@vitest/coverage-v8` の導入要否を確認する（既存リポジトリで coverage script が定義済みならそれを使う）。

代替（リポジトリ既定の coverage script がある場合）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage
```

---

## 4. 証跡に残す実測値（フォーマット）

実行結果（2026-05-30）:

```bash
pnpm exec vitest run --config=vitest.d1.config.ts --hookTimeout=120000 --testTimeout=120000 --coverage --coverage.include='apps/api/src/repository/identity-conflict.ts' --coverage.include='apps/api/src/routes/admin/identity-conflicts.ts' apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts apps/api/src/routes/admin/identity-conflicts.contract.spec.ts
```

結果: 2 files / 17 tests PASS。

| ファイル / 関数 | Statements | Branch | Functions | Lines | 未到達行 |
|-----------------|-----------|--------|-----------|-------|----------|
| `identity-conflict.ts` | 97.38% | 72.22% | 100% | 97.38% | 173-174, 178-180（`parseConflictId` 不正系など本タスク主眼外） |
| `identity-conflicts.ts` | 82.02% | 38.09% | 100% | 82.02% | 52-53, 57-63, 69-99, 100, 117-118（list/merge/error rethrow など本タスク主眼外） |

目標:
- `dismissIdentityConflict` 関数の主要分岐（batch true/false、email null/非null、ON CONFLICT、missing member、batch rollback）を TC が覆う。
- dismiss endpoint の actor 解決分岐は TC-D01（正常）/ TC-D02（401）で主要パスを覆う。`?? "unknown-admin"` の最終 fallback は実環境では到達しないため、未到達でも許容（理由を証跡に明記する）。

> 注: `claims.sub ?? user.memberId ?? "unknown-admin"` の最終 `"unknown-admin"` 分岐は、認可済みリクエストでは必ず `user.memberId` が存在するため到達しない。これは merge endpoint と同一の防御的 fallback であり、未到達を許容する（branch カバレッジ未達の正当な理由として記録）。

---

## 5. 完了条件

- [x] coverage を変更ファイル 2 本に絞って実行した
- [x] `dismissIdentityConflict` 関連の line / branch 実測値を表に記録した（未達分岐は本タスク主眼外または defensive fallback として理由付き）
- [x] dismiss endpoint の email 配線分岐が TC で覆われていることを確認した
- [x] 対象外ファイル（merge / list / audit route）を coverage 目標から除外した旨を明記した
- [x] 未到達分岐（`"unknown-admin"` fallback 等）がある場合、その正当理由を証跡に残した
