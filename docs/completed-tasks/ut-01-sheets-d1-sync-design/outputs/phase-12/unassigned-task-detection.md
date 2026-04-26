# Phase 12 — 未割当タスク検出

## 設計タスク特有の4パターン確認

| パターン | 説明 | 検出結果 |
|---------|------|---------|
| 設計文書に実装が必要な項目が埋め込まれている | 設計文書内に「TODO: 実装する」等の記述 | 0件 |
| 下流タスクが未登録 | 本設計を参照する実装タスクが artifacts.json に未登録 | 0件（UT-09 は `blocks` に登録済み。ただし UT-21 と実装 ownership が重複するため下表で整理） |
| 上流タスクの成果物への依存が未解決 | 上流タスクが完了前提で処理しているが成果物が未存在 | 0件（上流タスクは完了前提として記録済み） |
| docs-only タスクなのにコード実装が混入 | コードファイル・テストファイルが成果物に含まれている | 0件 |

---

## 下流タスク確認

`artifacts.json` の `blocks` フィールド:

```json
"blocks": [
  "ut-09-sheets-d1-sync-impl"
]
```

| 下流タスクID | 登録状態 | 備考 |
|------------|---------|------|
| ut-09-sheets-d1-sync-impl | 登録済み | 本設計文書を参照して実装着手可能 |
| UT-21-sheets-d1-sync-endpoint-and-audit-implementation | 既存未タスク | 現行 `apps/api` 実装 route / audit logging の実装タスク。UT-09 と統合または supersede 関係を明示する必要あり |

## 追加で formalize しないが UT-09/UT-21 で必ず扱う改善

| 項目 | 理由 | 扱い |
| --- | --- | --- |
| `/sync/manual` / `/sync/backfill` の admin guard・CSRF | 既存 UT-21 で unauthenticated と記録済み | UT-21 の高優先 acceptance として維持 |
| UT-09 と UT-21 の ownership 重複 | 新規タスク化すると重複が増える | 既存タスク間の統合・supersede 判定として扱う |
| `sync_audit` 列名 drift | 本タスク内で guide を既存 migration に合わせて補正 | 新規未タスク不要 |

---

## 判定

**未割当タスク: 0件**

UT-09はすでに下流タスクとして登録済みであり、本タスクの設計文書を参照して実装着手できる状態にある。UT-21 は同じ実装領域の既存未タスクであるため、新規タスクを増やさず、UT-09/UT-21 の統合または supersede 関係を後続のタスク選定で解消する。
