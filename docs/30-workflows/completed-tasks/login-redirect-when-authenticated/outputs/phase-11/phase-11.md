# Phase 11 — 手動テスト（NON_VISUAL）

## NON_VISUAL 宣言

- **タスク種別**: NON_VISUAL（server-side redirect + 純関数）
- **理由**: UI レイアウト変更なし。表示要素 0、副作用（HTTP redirect）と純関数挙動が成果物。
- **代替証跡**: `manual-test-result.md`（Vitest 自動テスト結果 + redirect 経路確認）
- **スクリーンショット**: 不要（Phase 11 capture metadata の `mode: "NON_VISUAL"`）
- **`screenshots/.gitkeep`**: 削除（ディレクトリごと作成しない）

## 検証手順

### 1. 自動テスト

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/url/__tests__/safe-next.spec.ts \
  apps/web/app/login/__tests__/page.spec.tsx
```

### 2. ローカル staging 手動確認（任意・user-gated）

| シナリオ                                                                 | 期待動作                            |
| ------------------------------------------------------------------------ | ----------------------------------- |
| ログイン状態で `http://localhost:3000/login` 直接アクセス                 | 即 `/profile` へ 307/308 redirect   |
| ログイン状態で `http://localhost:3000/login?next=%2Fadmin%2Fmembers`     | 即 `/admin/members` へ redirect     |
| ログイン状態で `http://localhost:3000/login?next=%2F%2Fevil.example.com` | 即 `/profile` へ redirect（弾く）   |
| 未ログインで `http://localhost:3000/login`                                | 既存 LoginCard が描画される         |

### 3. 証跡保存先

`outputs/phase-11/manual-test-result.md` に下記を記録:

- 実行コマンド
- vitest 結果（PASS/FAIL 件数）
- 仕様判断根拠
- 既知制限（Phase 11 では実地ブラウザ操作は user-gated）
