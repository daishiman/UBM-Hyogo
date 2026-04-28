# Cloudflare D1 mock factory セットアップ

Cloudflare D1 binding を依存に持つ repository / API 層の統合テストで使う **共通 mock factory の正本テンプレ**。各テストファイルで重複した stub を書かず、factory を import する形に統一する。

- 同期日: 2026-04-29
- 関連: [fake-d1-repository-pattern.md](fake-d1-repository-pattern.md)（02b 由来の fake D1 surface 定義）
- 採用実績: `02b-parallel-meeting-tag-queue-and-schema-diff-repository`（194/194 PASS）/ `03a-parallel-forms-schema-sync-and-stablekey-alias-queue`（194/194 PASS）

---

## 1. 用途

- Cloudflare D1 binding を mock する **統合テスト雛形**
- Miniflare 抜きで repository / API ハンドラを高速・決定論的にテストしたい場合
- 複数タスク（02b / 03a など）で重複していた D1 stub を 1 箇所に集約

Miniflare D1 を使った end-to-end 検証は別レイヤー。本 factory は unit / 軽量 integration 用。

---

## 2. 推奨配置パス

| 種別 | パス | 状態 |
| --- | --- | --- |
| **正本実装（既存）** | `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` | 02b で確立済み |
| **共通 factory（将来配置）** | `apps/api/test-utils/fake-d1.ts` | 未作成。本ドキュメントで仕様定義のみ |

> 現状は `apps/api/test-utils/` ディレクトリが存在しない。次回 D1 mock を扱うタスクで factory を `apps/api/test-utils/fake-d1.ts` に切り出し、`fakeD1.ts` 正本との重複を解消する想定。

---

## 3. 最低限の interface

D1 binding が提供する `prepare → bind → all/first/run` を最小サブセットで再現する。KVNamespace 風 surface に近いが、SQL を解釈する点が違う。

```ts
// apps/api/test-utils/fake-d1.ts (将来配置)

export type FakeD1Database = {
  prepare(sql: string): FakeD1PreparedStatement;
};

export type FakeD1PreparedStatement = {
  bind(...args: unknown[]): FakeD1BoundStatement;
};

export type FakeD1BoundStatement = {
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: { changes: number } }>;
};

/**
 * 共通 factory。任意のテーブル initial seed を受け取り、
 * INSERT / UPDATE / DELETE / SELECT を in-memory に処理する FakeD1Database を返す。
 */
export function createFakeD1(seed?: Record<string, unknown[]>): FakeD1Database {
  // 内部状態: Map<tableName, Row[]>
  // SQL 文字列を正規化し、parameter bind を順序で適用する
  // 実装本体は apps/api/src/repository/_shared/__fakes__/fakeD1.ts を参照
  throw new Error("placeholder: see apps/api/src/repository/_shared/__fakes__/fakeD1.ts");
}
```

---

## 4. 利用パターン

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createFakeD1 } from "@/test-utils/fake-d1"; // 将来配置後

describe("schemaDiffQueue repository", () => {
  let db: ReturnType<typeof createFakeD1>;

  beforeEach(() => {
    db = createFakeD1({
      schema_diff_queue: [], // initial seed
    });
  });

  it("enqueue then resolve transitions status to 'resolved'", async () => {
    // Arrange / Act / Assert
  });
});
```

---

## 5. 採用実績と効果

| タスク | テスト件数 | 効果 |
| --- | --- | --- |
| 02b-parallel-meeting-tag-queue-and-schema-diff-repository | 194 / 194 PASS | repository 7 ファイルで stub 統一、CI 時間短縮 |
| 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | 194 / 194 PASS | sync_jobs ledger / schema diff 共有 |

---

## 6. 関連参照

- [fake-d1-repository-pattern.md](fake-d1-repository-pattern.md): 3 軸テストチェックリスト（状態遷移 / queue 整合性 / not-found guard）
- `task-specification-creator/references/patterns-repository-task-template.md`: Phase 2 ALLOWED 表 / Phase 6 異常系
- `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`: 一次実装
