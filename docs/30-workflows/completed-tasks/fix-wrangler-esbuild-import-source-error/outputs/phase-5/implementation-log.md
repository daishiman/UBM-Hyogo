# Phase 5 成果物: 実装ログ

## 変更内容

### package.json
```diff
-      "esbuild": "0.25.4"
+      "esbuild": "0.27.3"
```

### scripts/cf.sh
冒頭コメントに override 根拠を 2 行追記:
```diff
+# - 現在の override は wrangler 4.85.0 が要求する esbuild 0.27.3 に固定し、
+#   OpenNext 互換性は build:cloudflare の実走で担保する
```

### pnpm-lock.yaml
`mise exec -- pnpm install --frozen-lockfile=false` で自動再生成。esbuild 関連 entry がすべて `0.27.3` に揃った。

## git diff --stat
```
 package.json   |   2 +-
 pnpm-lock.yaml | 226 ++++++++++++++++++++++++++++++---------------------------
 scripts/cf.sh  |   2 +
 3 files changed, 121 insertions(+), 109 deletions(-)
```

差分は esbuild 関連に限定。

## バージョン確定手順の実行記録
| Command | Result |
|---------|--------|
| `pnpm view wrangler@4.85.0 dependencies.esbuild` | `0.27.3` |
| `pnpm view @opennextjs/cloudflare@1.19.4 dependencies` | esbuild 直接依存無し |
| `pnpm view @opennextjs/aws@3.10.4 dependencies.esbuild` | `0.25.4` |

採用: wrangler exact の `0.27.3`。OpenNext 互換性は build 実測で担保。

## ローカル回帰確認結果
| ID | 結果 |
|----|------|
| GREEN-1 (`pnpm install`) | exit 0 |
| GREEN-4 (`apps/api wrangler deploy --dry-run --env staging`) | exit 0、Total Upload 1056.23 KiB、`import-source` エラー消失を確認 |
| GREEN-5 (`pnpm typecheck`) | exit 0 |
| GREEN-6 (`pnpm lint`) | exit 0 |

## DoD
- `package.json` / `pnpm-lock.yaml` 差分が esbuild 関連に限定: ✅
- ローカル GREEN-1, GREEN-4, GREEN-5, GREEN-6 が exit 0: ✅
- 変更は単一責務（ビルド/デプロイ回復）に絞った 1 コミット相当: ✅
