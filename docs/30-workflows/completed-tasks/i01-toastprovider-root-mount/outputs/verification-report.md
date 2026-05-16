# タスク仕様書 検証レポート

> 検証日時: 2026-05-16T13:49:40.425Z
> 対象: docs/30-workflows/completed-tasks/i01-toastprovider-root-mount

## サマリー

| 項目 | 値 |
|------|-----|
| 総Phase数 | 13 |
| 検証済みPhase | 13 |
| エラー | 27 |
| 警告 | 0 |
| 情報 | 3 |
| **結果** | **❌ FAIL** |

## Phase別検証結果

### Phase 1: 要件定義 ✅

問題なし

### Phase 2: 設計 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 3: 設計レビューゲート ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 4: テスト作成 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 5: 実装 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 6: テスト拡充 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 7: テストカバレッジ確認 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 8: リファクタリング ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 9: 品質保証 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません
- ℹ️ [consistency] 参照パス「cat outputs/phase-02/client-boundary-decision.md」の存在を確認してください

### Phase 10: 最終レビューゲート ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません
- ❌ [structure] 必須セクション「完了条件」が見つかりません

### Phase 11: 手動テスト検証 ❌

- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません
- ℹ️ [consistency] 参照パス「phase-11-toast-visible.png」の存在を確認してください
- ℹ️ [consistency] 参照パス「phase-11-devtools-provider.png」の存在を確認してください

### Phase 12: ドキュメント更新 ❌

- ❌ [structure] 必須セクション「目的」が見つかりません
- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

### Phase 13: PR作成 ❌

- ❌ [structure] 必須セクション「目的」が見つかりません
- ❌ [structure] 必須セクション「実行タスク」が見つかりません
- ❌ [structure] 必須セクション「参照資料」が見つかりません

## 推奨アクション

1. 上記のエラー（❌）を優先的に修正してください
2. 警告（⚠️）も可能な限り対応してください
3. 修正後、再度検証を実行してください:
   ```bash
   node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/i01-toastprovider-root-mount
   ```
