# Phase 8: 統合確認（local apply --dry-run / diff）

[実装区分: 実装仕様書]

## 1. 目的

Cloudflare API への書き込みを行わない範囲で、IaC 適用フロー全体が壊れていないことをローカルで保証する。

## 2. 検証項目

| 観点 | コマンド | 期待結果 |
| --- | --- | --- |
| read-only list | `mise exec -- pnpm cf:alerts:list` | repo 側 7-8 件、Cloudflare actual 5 件（KV 未適用状態）の差分が表示される |
| drift 検知 | `mise exec -- pnpm cf:alerts:diff` | exit 2 + `missing: ["workers-kv-writes-per-day", "workers-kv-stored-bytes"]` |
| dry-run apply | `bash scripts/cf.sh alerts apply`（`--yes` なし） | dry-run 出力に webhook → policy 順で「create policy workers-kv-*」が含まれる |
| 既存 policy 無影響 | 同上 dry-run 出力 | 既存 5 policy に対する operation が 0 件 |
| 冪等性事前確認（mock） | `pnpm test:alerts -- diff.spec` | apply 後 mock state で diff が空に収束 |

## 3. 副作用

- Step 1-5 はすべて read-only token + dry-run のため Cloudflare 上の状態を変更しない

## 4. 失敗時の対応

- `cf:alerts:list` が認証エラー → `CLOUDFLARE_ALERTS_TOKEN_READ` の op 参照を確認
- dry-run apply 出力に既存 policy への operation が混入 → canonicalize / diff の regression を疑い Phase 7 へ戻る
- diff が `missing` ではなく `extra` を返す → repo 側に未削除の旧定義が残っている可能性、Phase 5 ファイル一覧と整合確認

## 5. 成果物

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-08/local-diff.log` | 新規 | `cf:alerts:diff` 出力 |
| `outputs/phase-08/local-list.log` | 新規 | `cf:alerts:list` 出力 |
| `outputs/phase-08/local-dry-run.log` | 新規 | `cf:alerts:apply` dry-run 出力 |

## 6. 完了条件 (DoD)

- [ ] 検証項目 5 件すべて期待通り
- [ ] regression なし
- [ ] evidence log が `outputs/phase-08/` 配下に保存されている
