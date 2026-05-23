[実装区分: 実装仕様書]

# Phase 6: テスト拡充 (異常系)

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 5（GREEN） |
| 次 Phase | Phase 7（カバレッジ確認） |

## 目的

Phase 4〜5 の主要動作テストに加え、stub §苦戦箇所で示された異常パス（stdin 空 / fingerprint 未指定 / cf.sh secret put 失敗 / tail timeout / `--env` 不正 / production unlock state 不一致）を追加し、helper の防御性を機械的に保証する。

## 変更対象ファイル

| ファイル | 種別 |
| --- | --- |
| `scripts/__tests__/cf-rotate-sa-key.bats` | 追記（TC-13〜TC-20） |

## 追加テストケース（TC-13〜TC-20）

| ID | テスト名 | 検証 | 期待 |
| --- | --- | --- | --- |
| TC-13 | `fingerprint with empty stdin` | 空入力で exit 非 0 または空 fingerprint を拒否 | exit !=0 |
| TC-14 | `put-staging requires fingerprint` | `--fingerprint` 未指定 → helper exit 64 | exit 64 |
| TC-15 | `put-staging with cf.sh secret put failure` | mock cf.sh が exit 1 → helper exit 4 | exit 4 |
| TC-16 | `tail timeout exits with 6` | mock cf.sh tail を待機させ `tail --seconds 1` で kill | exit 6 |
| TC-17 | `--env=invalid is rejected` | `--env foo` で exit !=0 | exit !=0 |
| TC-18 | `secret value not in stderr` | put-staging で stdin に書き込んだ JSON が stderr / log に出現しない | grep 0 件 |
| TC-19 | `production fingerprint must match verified staging state` | staging verify state と異なる fingerprint で production を拒否 | exit 7 |
| TC-20 | `production op-ref must match verified staging state` | staging verify state と異なる `op://` 参照で production を拒否 | exit 7 |

## 異常パス詳細

| 異常 | helper 内対応 | bats での再現方法 |
| --- | --- | --- |
| stdin 空 | `[[ -s ]]` チェックで exit | `printf '' \| ...` |
| fingerprint 未指定 | exit 64 を返す | `--fingerprint` を省略 |
| cf.sh 失敗 | exit 4 | `MOCK_CF_EXIT=1` |
| tail timeout | `timeout` / `gtimeout` / perl fallback で 60 秒超 kill | mock cf.sh で sleep 100 |
| `--env` 不正 | case 文で staging/production のみ許容 | `--env foo` を渡す |
| 値の漏洩 | パイプ直結＋ローカル変数禁止 | grep でテスト |

## 状態管理（TC-20 関連）

`put-staging` 成功時は `$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-put` に secret 名 / wrangler config / `op://` 参照 / fingerprint / timestamp を書き、`verify --env staging` 成功時だけ `$CF_ROTATE_STATE_DIR/cf-rotate-sa-key.staging-verified` に昇格する。`put-production` は verified state の `op://` 参照と fingerprint が引数と一致し、期限切れでない場合だけ実行できる。state ファイルは値を持たない。

## 実行コマンド

```bash
mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats   # 24/24 PASS
```

## DoD

- [ ] TC-13〜TC-20 が追記されている
- [ ] 全 24 ケース PASS
- [ ] state ファイル機構（staging→production 順序保証）が実装されている
- [ ] grep で値断片が log / history / stderr に存在しないことが TC-18 / TC-19 で確認される

## 次 Phase

Phase 7（カバレッジ確認）
