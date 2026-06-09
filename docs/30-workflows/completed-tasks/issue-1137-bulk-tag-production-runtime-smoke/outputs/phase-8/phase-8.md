# Phase 8: リファクタリング — issue-1137-bulk-tag-production-runtime-smoke

## 目的

production 経路追加に伴い、staging のハードコード値を関数化し、env 固定箇所を一般化することで、staging / production の orchestration を共有し重複を排除する。
**最優先制約: staging 挙動は完全不変**（AC-6 / I-7）。リファクタは「同じ振る舞いを保ったまま構造を改善する」ことに限定し、新機能（production）はその対称構造の上に乗せる。

## 対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| staging / production 変数の確定箇所 | `parse_args` 内に staging 固定値と env 参照が直書き | `configure_environment()` に集約し、env 名から `STAGING_*` / `PRODUCTION_*` を選ぶ | DRY・env 分岐の対称性。状態確定箇所を 1 関数に閉じる |
| `run_d1` の env | `bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"` と `staging` 固定 | `bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env "$ENVIRONMENT" --remote "$@"` と一般化 | production でも同一 orchestration を流用するため env を変数化。staging では `ENVIRONMENT=staging` で挙動不変 |
| allowlist regex のデフォルト値 | staging allowlist が runner 内に固定文字列で 1 箇所だけ存在 | env 別変数化（`STAGING_API_HOST_ALLOW_REGEX` / `PRODUCTION_API_HOST_ALLOW_REGEX`）。各 guard 関数が自 env の変数を `${VAR:-<default>}` で参照 | env ごとに独立評価（AC-1）。staging のデフォルトは現状値を逐語保持し、production は別 default を持つ。両者が混線しない |
| `CLOUDFLARE_ENV` 要求値 | staging 固定で `staging` を要求 | env に応じて `staging` / `production` を要求するよう一般化（staging 分岐は現状の固定挙動を維持）| production 実走時の環境一致チェックを同じ仕組みで担保。staging では要求値が変わらない |
| env 受理判定 | `if [[ "$ENVIRONMENT" != "staging" ]]; then exit 2; fi` | `case "$ENVIRONMENT" in staging) ...; production) ...; *) exit 2; esac` | 受理 env の拡張点を明示。未知 env は従来同様 exit 2（拒否挙動不変）|
| guard 呼び出し | `main()` 内で `assert_staging_guard` 直呼び | `main()` で env に応じ `assert_staging_guard` / `assert_production_guard` を呼び分け | production 経路を別関数で完全分離。staging 呼び出しパスは不変 |

## duplicate / navigation drift の削減

| 重複候補 | 削減方法 |
| -------- | -------- |
| seed→assign→retry-noop→unassign→audit→cleanup の orchestration を staging / production で二重実装する誘惑 | **単一 runner の env 分岐で共有**（代替案 A の別ファイル新規作成を Phase 3 で棄却済）。`post_bulk` / `assert_status_file` / `audit_count` / `count_by_table` / `cleanup` / `write_summary` は env 非依存のまま 1 実装を両 env が呼ぶ |
| staging / production の値確定ロジックが parse_args 内に散在 | `configure_environment` に集約。「どの env がどの値を持つか」が 1 箇所で読める（navigation drift 削減）|
| allowlist regex が guard ごとにマジック文字列で埋め込まれる | env 別変数 + `${VAR:-default}` パターンに統一。default は 1 箇所定義 |

> followup-007（smoke runner 共通 lib への抽出）には**踏み込まない**。本タスクの DRY は「単一 runner 内の env 分岐共有」までに留める。runner 間（attendance / admin-web / tag-bulk）を横断する共通 lib 抽出は別タスク（本タスク非依存・Phase 10 で MINOR 記録）。

## staging 挙動が完全不変であることの保証方法

1. **値の逐語一致**: `configure_environment()` の staging 経路が設定する全変数（`PREFIX` / `CF_D1_DATABASE` / `SEED_SQL` / `CLEANUP_SQL` / `MEMBER_IDS` / `TAG_IDS` / api_base / bearer）を、リファクタ前のハードコード値と**文字単位で一致**させる。
2. **`assert_staging_guard` 逐語不変**: 関数本体を 1 文字も変更しない（AC-6 / I-7）。`main()` からの呼び出しパスも staging では従来通り。
3. **既存 local test の非退化 PASS**: `runtime-tag-bulk.test.sh` の既存 staging ケース（production-env-refused / production-url-refused / d1-database-refused 等）がリファクタ後も全て PASS することを本サイクルで確認済み。これが「挙動不変」の機械的証跡。
4. **`run_d1` の等価性**: `--env "$ENVIRONMENT"` は staging 経路で `ENVIRONMENT=staging` のため、展開後の実コマンドは `--env staging` とリファクタ前と完全等価。
5. **差分レビュー観点**: PR diff で staging 関連行が「移動（同一文字列の relocation）」以外の変更を含まないことを目視確認する。

## 完了判定チェックリスト

- [ ] staging のハードコード値を `configure_environment()` に集約し、値を逐語一致で保持した
- [ ] `run_d1` の `--env` を `"$ENVIRONMENT"` に一般化し、staging で展開結果が `--env staging` と等価であることを確認した
- [ ] allowlist regex を env 別変数（`STAGING_*` / `PRODUCTION_*`）化し、default を 1 箇所に定義した
- [ ] `CLOUDFLARE_ENV` 要求値を env 別に一般化し、staging 要求値が不変であることを確認した
- [ ] env 受理を `case` 化し、未知 env の exit 2 挙動が不変であることを確認した
- [ ] orchestration（post_bulk〜cleanup〜write_summary）を単一実装で staging/production が共有し、重複実装を作らない方針を明記した
- [ ] `assert_staging_guard` を逐語不変で温存した（AC-6 / I-7）
- [ ] 既存 staging local test の非退化 PASS を「挙動不変」の証跡とする方針を明記した
- [ ] followup-007 共通 lib 抽出には踏み込まないスコープ境界を明記した
