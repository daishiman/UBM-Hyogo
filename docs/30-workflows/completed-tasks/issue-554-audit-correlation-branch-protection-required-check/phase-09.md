# Phase 9: `pnpm indexes:rebuild` で drift 解消

## 目的

Phase 8 の手編集で生じうる indexes drift を `pnpm indexes:rebuild` で正規化し、CI の `verify-indexes-up-to-date` gate（`.github/workflows/verify-indexes.yml`）が green になる状態を保証する。

## 実装手順

```bash
mise exec -- pnpm install
mise exec -- pnpm indexes:rebuild

git status .claude/skills/aiworkflow-requirements/indexes/
git diff   .claude/skills/aiworkflow-requirements/indexes/ | head -200
```

`indexes:rebuild` 実行後の差分が以下を満たすこと:

- `topic-map.md` に Phase 8 で追加した anchor が含まれる
- `keywords.json` が rebuild 後も追加キーワードを保持している（rebuild 規約により上書き / 並べ替えされる場合は順序のみ変更で OK）
- `resource-map` 系ファイルも整合状態

## DoD（Phase 9）

- [ ] `mise exec -- pnpm indexes:rebuild` が success
- [ ] `git status` で indexes 配下が clean か、追加分のみが diff に残っている
- [ ] `outputs/phase-9/phase-9.md` に rebuild 出力ログが記録されている
