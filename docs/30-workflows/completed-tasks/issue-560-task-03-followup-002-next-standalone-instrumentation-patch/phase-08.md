# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| Source | `outputs/phase-8/phase-8.md` |
| 状態 | completed |

## 目的

GREEN 状態を保ったまま patch script の保守性を上げる。

## 実行タスク

- 定数（`SOURCE` / `TARGET` / `VERIFY_TOKENS`）を script 上部にまとめ単一箇所で管理
- `guardCwd` / `patch` / `verify` の責務分離を 1 関数 1 責務に整える
- ログ書式を `key=value` 形式に統一（パース可能・secret 非含有）
- script 自体に shebang `#!/usr/bin/env node` を付与し executable 不要で `node` 起動できることを確認
- 不要 log / console.log を削除

> リファクタリングは GREEN 維持必須。改修後に `node --test` を再実行し PASS を確認すること。

## 参照資料

- `outputs/phase-6/phase-6.md`

## 成果物

- `outputs/phase-8/phase-8.md`（before/after の責務マトリクス）

## 完了条件

- 関数 1 責務 / 定数集約 / ログ書式統一が達成
- TC-01〜TC-07 全 PASS 維持
