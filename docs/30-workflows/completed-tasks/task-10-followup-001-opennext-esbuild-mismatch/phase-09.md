# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 9 |
| 状態 | spec_created |

## 目的

Phase 5 の実装結果が品質基準を満たすことを集約検証する。

## 品質ゲート

### G1: ビルド回復

| 項目 | 判定基準 |
| --- | --- |
| `build:cloudflare` exit code | 0 |
| `Host version` エラーログ | 出力なし |
| OpenNext build output (`apps/web/.open-next/`) | 生成済み |

### G2: 既存品質ゲート回帰

| 項目 | 判定基準 |
| --- | --- |
| `pnpm typecheck` | green |
| `pnpm lint` | green |
| `pnpm test` | 既存 PASS 集合と同一 |

### G3: 依存解決の健全性

| 項目 | 判定基準 |
| --- | --- |
| `pnpm why esbuild` + platform binary scan | OpenNext host と binary の mismatch pair が 0 件（単一 version が最優先） |
| `node_modules/@esbuild/<platform>/package.json` の version | 全箇所 0.25.4 |
| `node_modules/@opennextjs/aws/node_modules/esbuild/package.json` | 0.25.4 |

### G4: 不変条件遵守

| 項目 | 判定基準 |
| --- | --- |
| `wrangler` 直接呼び出し | grep で本タスク差分に新規追加なし |
| `scripts/cf.sh` 経路 | 既存呼び出しが回帰なし |
| D1 直接アクセス | 影響なし（変更が触っていない） |

### G5: lockfile 健全性

| 項目 | 判定基準 |
| --- | --- |
| `pnpm-lock.yaml` 差分 | esbuild 関連エントリのみ |
| 無関係パッケージの drift | なし |
| `pnpm install --frozen-lockfile` | 成功（PR 後 CI で確認） |

## 検証コマンド一覧

```bash
# G1
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare; echo "exit=$?"

# G2
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test

# G3
mise exec -- pnpm why esbuild
find node_modules -path "*/@esbuild/*/package.json" -exec sh -c 'echo "{}:"; grep "\"version\"" {}' \;

# G4
grep -rn '^wrangler ' .github/workflows/ scripts/ || echo "no direct wrangler calls"

# G5
git diff --stat pnpm-lock.yaml
mise exec -- pnpm install --frozen-lockfile  # 念のため再現性確認
```

## 監視 / アラート

- 本タスクは production runtime には影響しないため、新規アラート設定は不要
- 将来の再発検知が必要な場合は、CI に「OpenNext host/binary mismatch pair が 0 件であることを assert する」step を追加する案を別タスクで検討

## 完了条件

- [ ] G1〜G5 すべての判定基準が記載されている
- [ ] 検証コマンドが揃っている
- [ ] 監視追加の要否判断が記載されている

## 成果物

- `outputs/phase-09/main.md`

## 実行タスク

- G1〜G5 の品質ゲートを Phase 11 evidence に対応付ける
- `wrangler` direct invocation の新規追加がないことを差分で確認する
- lockfile と indexes の再現性を Phase 12 compliance に渡す

## 統合テスト連携

品質保証は Phase 11 の NON_VISUAL evidence と Phase 12 の strict 7 / index sync evidence を統合して判定する。

## 参照資料

- Phase 4 テスト戦略
- Phase 7 AC マトリクス
