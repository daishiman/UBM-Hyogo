# fake D1 repository pattern

UBM-Hyogo `02b-parallel-meeting-tag-queue-and-schema-diff-repository` の repository 単体テストで確立された fake D1 パターンの正本テンプレ。Cloudflare D1 binding 互換 surface を in-memory で再現することで、Miniflare 不要・高速・決定論的に repository 層をテストできる。

- 同期日: 2026-04-27
- 一次実装: `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`
- 一次利用例: `apps/api/src/repository/{attendance,meetings,schemaDiffQueue,schemaQuestions,schemaVersions,tagDefinitions,tagQueue}.test.ts`

---

## 1. 適用シーン

- Cloudflare D1 binding に依存する repository 層の **unit test**
- 状態遷移 / queue 整合性 / not-found guard を網羅検証したい場合
- Miniflare 立ち上げ抜きで CI 上を高速に回したい場合

統合テスト（Miniflare D1 を使った end-to-end 検証）は別途必要。02b では `02b-followup-003-miniflare-d1-integration-test.md` として 08a 担当に handoff 済み。

---

## 2. fake D1 surface

D1 binding が提供する `prepare → bind → all/first/run` を最小サブセットで再現:

```ts
type FakeD1 = {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      all<T>(): Promise<{ results: T[] }>;
      first<T>(): Promise<T | null>;
      run(): Promise<{ success: boolean; meta: { changes: number } }>;
    };
  };
};
```

INSERT / UPDATE / DELETE / SELECT を SQL 文字列の正規化＋パラメータバインドで処理。テーブルは Map<string, Row[]> で保持。

---

## 3. 3 軸テストチェックリスト

repository 単体テストはこの 3 軸を必ず網羅する:

### 3.1 状態遷移
- ALLOWED 表（Phase 2 設計成果物）に基づく許可/拒否ケース
- from → to の全網羅（valid / invalid 両方）
- idempotency（同じ遷移を 2 回呼んでもエラーにならないか / 逆にエラーにする設計か）

### 3.2 queue 整合性
- enqueue → resolve → dismiss のライフサイクル正常系
- 同一キー二重投入の挙動（idempotency-key の有無）
- 解決済みエントリへの再 resolve 試行
- dismiss 後の status が `'resolved'` ではなく `'dismissed'` に固定されているか

### 3.3 not-found guard
- 存在しない id への resolve / update / delete が **明示エラー**（silent no-op 禁止）
- エラー型が呼び出し側で識別可能（`NotFoundError` 等）

---

## 4. 不変条件（02b 由来、テストで担保）

| ID | 不変条件 | 担当テストファイル |
| --- | --- | --- |
| #13 | tag は queue 経由のみ書き込み（`tag_definitions` write 不在） | `tagDefinitions.test.ts` / `tagQueue.test.ts` |
| #14 | schema diff queue 未解決の status 正本は `'queued'` | `schemaDiffQueue.test.ts` |
| #15 | `schemaVersions.getLatestVersion()` は `synced_at DESC` で確定 | `schemaVersions.test.ts` |

---

## 5. 関連参照

- `aiworkflow-requirements/references/lessons-learned-02b-schema-diff-and-tag-queue.md` 苦戦知見全体
- `task-specification-creator/references/patterns-repository-task-template.md` Phase 2 ALLOWED 表 / Phase 6 4 軸異常系
- 02b followup: `docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md`
