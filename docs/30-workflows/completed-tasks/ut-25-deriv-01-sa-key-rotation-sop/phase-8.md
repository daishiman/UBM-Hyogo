[実装区分: 実装仕様書]

# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 7（カバレッジ 100% マップ済み） |
| 次 Phase | Phase 9（品質保証） |

## 目的

Phase 5 で導入した helper / SOP の重複を排除し、引数 parser・logging・error message を DRY 化する。テスト RED を発生させないこと（リファクタリングはテスト維持の元で実施）。

## 変更対象ファイル

| ファイル | 種別 |
| --- | --- |
| `scripts/cf-rotate-sa-key.sh` | 引数 parser を関数化、共通エラーメッセージを定数化 |
| `docs/30-workflows/runbooks/sa-key-rotation-sop.md` | 重複説明の削除、共通手順を §5 に集約 |

## リファクタリング項目

| 項目 | Before | After |
| --- | --- | --- |
| 引数 parser | 各 subcommand 内に case 文 | `parse_common_args()` 関数に集約 |
| エラーメッセージ | ハードコード文字列 | `ERR_*` 定数（読み取り専用 `readonly`） |
| state ファイルパス | ハードコード `/tmp/...` | 関数 `state_file_path()` で生成 |
| dispatch | 巨大 case 文 | subcommand 名 → 関数名の関数ポインタ table |
| SOP 重複 | §5.4 と §5.6 で wrangler tail 説明が重複 | §6 に集約し §5.4/5.6 から逆参照 |

## 注意

- 関数分割で公開 API（subcommand 名 / exit code 表）を変えない
- bats テスト 20 ケースを全 PASS のまま維持
- shellcheck 警告が増えないこと

## 実行コマンド

```bash
mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats   # 24/24 PASS
mise exec -- shellcheck scripts/cf-rotate-sa-key.sh         # exit 0
mise exec -- pnpm exec markdownlint docs/30-workflows/runbooks/sa-key-rotation-sop.md
```

## DoD

- [ ] 5 件のリファクタリング項目が完了
- [ ] bats 24/24 PASS 維持
- [ ] shellcheck PASS
- [ ] SOP markdown line budget 350 行以内維持

## 次 Phase

Phase 9（品質保証）
