# Phase 6: テスト拡充（fail path / 回帰 guard）

## 0. このフェーズの目的

Phase 5 の Green を守るための **fail path テスト**・**回帰 guard**・**既存テストのシグネチャ追従**を追加する。
特に、シグネチャ変更（5 引数 → 6 引数）により既存 repository テストが壊れるため、その追従が本フェーズの中心。

---

## 1. シグネチャ変更による既存テスト追従（必須・最優先）

### 1-1. 影響範囲の特定

`dismissIdentityConflict()` の呼び出し元を grep で全件洗い出す。

```bash
grep -rn "dismissIdentityConflict" apps/api/src --include="*.ts"
```

現時点で判明している旧シグネチャ呼び出し:

| ファイル | 行 | 現状（5 引数） | 必要対応 |
|----------|----|----------------|----------|
| `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts` | L79 | `dismissIdentityConflict(env.ctx, ids.source, ids.target, "admin_1", "別人")` | `actorAdminEmail` を追加: `(env.ctx, ids.source, ids.target, "admin_1", "admin@example.com", "別人")` |
| 同上 | L89-95 | `dismissIdentityConflict(env.ctx, ids.source, ids.target, "admin_1", "別人 user@example.com ...")` | 同様に email 引数（例 `null`）を追加 |
| `apps/api/src/routes/admin/identity-conflicts.ts` | dismiss endpoint | Phase 5 で修正済 | 対応済 |

> **[FB-TASK-01/02] 教訓の適用**: シグネチャ変更時は `describe.skip` 内を含む全残存呼び出しを同一 wave で更新する。スキップ済みテストは型エラーにならないため見落としやすい。grep でゼロ件を証跡に残す。

### 1-2. 既存 repository テストの追従内容

`identity-conflict.repository.spec.ts` の以下を更新する（**挙動の検証は維持しつつシグネチャのみ追従**）。

```ts
// L79: dismiss 後は候補から除外される（actorAdminEmail を追加）
await dismissIdentityConflict(env.ctx, ids.source, ids.target, "admin_1", "admin@example.com", "別人");

// L89: dismiss reason redaction（email 引数は null でも可）
await dismissIdentityConflict(
  env.ctx, ids.source, ids.target, "admin_1", null,
  "別人 user@example.com 090-1234-5678 で確認済み",
);
```

これらの既存ケースは「dismiss 後の候補除外」「dismissal.reason の redact」を検証しており、Phase 5 後も同じ assert が通ることを確認する（回帰 guard）。

---

## 2. fail path テストの追加

### 2-1. batch 非対応時の throw（repository 単体テスト）

`identity-conflict.repository.spec.ts` の `describe("dismissIdentityConflict", ...)` を新設し、batch 非対応 ctx を渡して例外を検証する。

| TC | 操作 | 期待 |
|----|------|------|
| TC-D05 | `db.batch` を持たない疑似 ctx で `dismissIdentityConflict` を呼ぶ | `DismissAtomicBatchUnavailable` を throw し、`identity_conflict_dismissals` / `audit_log` に**部分書き込みが起きない** |

```ts
import { dismissIdentityConflict, DismissAtomicBatchUnavailable } from "../identity-conflict";

it("batch 非対応 ctx では DismissAtomicBatchUnavailable を throw（部分書き込みなし）", async () => {
  // env.ctx をベースに、db.batch を未定義にした ctx を作る
  const noBatchDb = new Proxy(env.db as object, {
    get(t, p) {
      if (p === "batch") return undefined;
      return (t as Record<string | symbol, unknown>)[p];
    },
  });
  const noBatchCtx = { db: noBatchDb } as typeof env.ctx;

  await expect(
    dismissIdentityConflict(noBatchCtx, "m_source", "m_target", "admin_1", null, "x"),
  ).rejects.toBeInstanceOf(DismissAtomicBatchUnavailable);

  // 部分書き込みが起きていないこと
  const d = await env.db
    .prepare("SELECT COUNT(*) AS n FROM identity_conflict_dismissals")
    .first<{ n: number }>();
  expect(d?.n).toBe(0);
  const a = await env.db
    .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='identity.dismiss'")
    .first<{ n: number }>();
  expect(a?.n).toBe(0);
});
```

> 注: 実装は batch 非対応判定（`typeof db.batch !== "function"`）を **書き込み前**に行うため、stmt は prepare のみで実 INSERT は走らない。Proxy で `batch` を消す方式が確実。`prepare` を経由した stmt 自体は副作用を持たない（`.run()` / batch 実行時のみ書き込み）ことが前提。

### 2-2. repository 直呼びでの audit_log 記録（contract と二重化しない補助）

contract spec（TC-D01）が route 経由の audit_log 記録を既にカバーするため、repository 単体での audit_log full assert は**最小限**にする。重複を避け、route 未経由でも `actorAdminEmail` が actor_email に入ることだけを確認する。

| TC | 操作 | 期待 |
|----|------|------|
| TC-D06 | `dismissIdentityConflict(env.ctx, "m_source", "m_target", "admin_x", "x@example.com", "理由")` | `audit_log` に `action='identity.dismiss'` 1 行、`actor_id='admin_x'`, `actor_email='x@example.com'`, `target_id='m_target'` |

```ts
it("repository 直呼びで audit_log に actor_email を記録する", async () => {
  await dismissIdentityConflict(env.ctx, "m_source", "m_target", "admin_x", "x@example.com", "理由");
  const log = await env.db
    .prepare("SELECT actor_id, actor_email, target_id FROM audit_log WHERE action='identity.dismiss'")
    .first<{ actor_id: string; actor_email: string; target_id: string }>();
  expect(log).toMatchObject({
    actor_id: "admin_x",
    actor_email: "x@example.com",
    target_id: "m_target",
  });
});
```

---

## 3. 回帰 guard（merge への影響なし確認）

本タスクは `identity-conflict.ts` のみを変更し、`identity-merge.ts` は **触らない**。merge 系テストが無改変で通ることを回帰 guard とする。

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/repository/__tests__/identity-merge.repository.spec.ts
```

| 確認項目 | 期待 |
|----------|------|
| `identity-merge.repository.spec.ts` の 6 ケース | 全て無改変で Green（merge へのリグレッションなし） |
| `redactIdentityReason` の export | dismiss が再 import しても merge 側の挙動不変（同関数の共有利用） |
| `audit_log` への merge 記録（`identity.merge`） | dismiss 追加後も `action` で混在せず分離（TC-A02 で target 単位の両立を確認済） |

---

## 4. repository 単体テスト vs contract での代替判断

| 検証対象 | 配置 | 判断理由 |
|----------|------|----------|
| route → repository の email 配線 + audit 記録 end-to-end | contract（TC-D01, Phase 4） | HTTP I/O と actor 解決を同時検証できる |
| PII redact（after_json） | contract（TC-D03, Phase 4） | end-to-end の redact 反映を確認 |
| 二重 dismiss の audit append | contract（TC-D04, Phase 4） | route 経由の冪等性 |
| batch 非対応 throw | **repository 単体（TC-D05, 本フェーズ）** | route 経由では batch 非対応を再現しにくいため repository 直呼びが適切 |
| 既存 dismiss 挙動（候補除外 / dismissal redact） | repository（既存 + シグネチャ追従） | 既存テスト資産を維持 |

> 結論: **contract を主、repository 単体を fail path 補助とする**。新規 `identity-conflict.spec.ts` ファイルは作らず、既存 `identity-conflict.repository.spec.ts` を拡張する（命名規則整合 + 既存シード再利用）。

---

## 5. テスト件数サマリー（Phase 4 + Phase 6 累計）

| ファイル | Phase 4 | Phase 6 追加 | 小計 |
|----------|---------|--------------|------|
| `identity-conflicts.contract.spec.ts` | TC-D01〜D04（4） | 0 | 4 |
| `audit.contract.spec.ts` | TC-A01〜A02（2） | 0 | 2 |
| `identity-conflict.repository.spec.ts` | 0 | シグネチャ追従（2 既存ケース）+ TC-D05/D06（2 新規） | 既存維持 + 2 新規 |
| `identity-merge.repository.spec.ts` | 0 | 0（無改変・回帰 guard 対象） | 0 |

---

## 6. 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared build
# dismiss 系を一括
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/routes/admin/identity-conflicts.contract.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts
# merge 回帰
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/repository/__tests__/identity-merge.repository.spec.ts
# シグネチャ残存呼び出しゼロ確認
grep -rn "dismissIdentityConflict(" apps/api/src --include="*.ts"
```

---

## 7. 完了条件

- [x] 既存 `identity-conflict.repository.spec.ts` の旧シグネチャ呼び出しを全件 6 引数へ追従した
- [x] batch 非対応 throw + 部分書き込みなしを追加し Green
- [x] repository 直呼びの actor_email 記録 / missing member / batch rollback を追加し Green
- [x] `identity-merge.repository.spec.ts` が無改変で全件 Green（1 file / 6 tests PASS）
- [x] dismiss 系 contract + repository テストが全件 Green（D1 focused spec 3 files / 28 tests PASS）
