[実装区分: 実装仕様書]

# Phase 4: テスト作成 (TDD RED)

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 3（PASS） |
| 次 Phase | Phase 5（実装 TDD GREEN） |
| 期待状態 | RED（helper 未実装でテスト fail） |

## 目的

`scripts/cf-rotate-sa-key.sh` の単体テストを bats で先行作成し、実装ゼロの状態で全テストが RED であることを確認する。stub §苦戦箇所 5 件のうち helper で機械的に保証可能な 3〜5 を全てテストでカバーする。

## 変更対象ファイル

| ファイル | 種別 | 目的 |
| --- | --- | --- |
| `scripts/__tests__/cf-rotate-sa-key.bats` | 新規 | helper の単体テスト一式 |
| `scripts/__tests__/fixtures/sa-key-rotation/dummy.json` | 新規 | fingerprint テスト用ダミー JSON（実値非該当のテスト固定値）|
| `scripts/__tests__/helpers/cf-mock.bash` | 新規（既存があれば再利用） | `scripts/cf.sh` を mock する関数（PATH 差し替え） |

## テストケース一覧（TC-01〜TC-12）

| ID | テスト名 | 検証内容 | 期待 |
| --- | --- | --- | --- |
| TC-01 | `enforce_history_off sets HISTFILE` | helper 実行後 `HISTFILE=/dev/null` が export されている | PASS |
| TC-02 | `set +o history is active` | `set -o \| grep history` が `off` | PASS |
| TC-03 | `assert_stdin_piped rejects TTY` | TTY 接続時に exit 2 | exit 2 |
| TC-04 | `assert_stdin_piped accepts pipe` | `echo x \| script ...` で stdin パイプを許容 | PASS |
| TC-05 | `compute_fingerprint outputs 16-hex only` | dummy.json を stdin で渡し、16 桁 hex のみ stdout | regex `^[a-f0-9]{16}$` |
| TC-06 | `compute_fingerprint does not log value` | stderr / log に JSON 値の断片が含まれない | grep で値断片 unmatched |
| TC-07 | `put-staging requires --op-ref` | `--op-ref` 未指定で exit !=0 + usage 表示 | exit 非 0 |
| TC-08 | `put-staging requires --env` | `--env` 未指定で exit !=0 | exit 非 0 |
| TC-09 | `put-staging --dry-run echoes plan only` | dry-run で `cf.sh` が呼ばれない | mock cf.sh の call count = 0 |
| TC-10 | `put-staging invokes cf.sh secret put via stdin` | dry-run なしで mock cf.sh が `secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` で呼ばれる | call count = 1, args match |
| TC-11 | `put-staging requires --fingerprint` | `--fingerprint` 未指定で exit !=0 + usage 表示 | exit 非 0 |
| TC-12 | `verify name presence parses cf.sh secret list` | mock cf.sh secret list の出力に `GOOGLE_SERVICE_ACCOUNT_JSON` が含まれれば exit 0、含まれなければ exit 5 | 両方 |

## bats テスト雛形（実装は Phase 5）

```bash
#!/usr/bin/env bats
# scripts/__tests__/cf-rotate-sa-key.bats

setup() {
  SCRIPT="${BATS_TEST_DIRNAME}/../cf-rotate-sa-key.sh"
  export PATH="${BATS_TEST_DIRNAME}/helpers:${PATH}"  # mock cf.sh / op
}

@test "TC-01: enforce_history_off sets HISTFILE" {
  run bash -c "source '${SCRIPT}' --source-only; enforce_history_off; echo \$HISTFILE"
  [ "$status" -eq 0 ]
  [ "$output" = "/dev/null" ]
}

@test "TC-05: compute_fingerprint outputs 16-hex only" {
  run bash -c "cat '${BATS_TEST_DIRNAME}/fixtures/sa-key-rotation/dummy.json' | '${SCRIPT}' fingerprint"
  [ "$status" -eq 0 ]
  [[ "$output" =~ ^[a-f0-9]{16}$ ]]
}

# ... TC-02〜TC-12 を同様に記述
```

## 入出力契約

| 関数 / subcommand | 入力 | 期待出力 | 期待 exit |
| --- | --- | --- | --- |
| `fingerprint` | stdin = JSON | stdout = 16 桁 hex のみ | 0 |
| `put-staging --dry-run` | --op-ref / --fingerprint / --env | stdout = plan、cf.sh 未呼び | 0 |
| `put-staging`（mock cf.sh） | --op-ref / --fingerprint / --env / stdin pipe | cf.sh が stdin で呼ばれる | 0 |
| `verify --env staging` | 環境 | name 存在で 0 / 不在で 5 | 0 or 5 |

## mock 設計

| 対象 | mock 配置 | 振る舞い |
| --- | --- | --- |
| `cf.sh` | `scripts/__tests__/helpers/cf.sh`（PATH 差し替え） | `secret put` は引数を JSON で出力、`secret list` は環境変数 `MOCK_SECRET_LIST` を echo |
| stdin | `printf ... \| helper` | secret 値は helper 引数にせず stdin pipe だけで渡す |

## 実行コマンド

```bash
# bats 実行（既存リポジトリ慣行）
mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats

# 期待: Phase 4 時点では全 12 ケース FAIL（helper 未実装のため）
```

## DoD

- [ ] bats テストファイルが新規作成されている
- [ ] TC-01〜TC-12 全 12 ケースが記述されている
- [ ] fixtures/dummy.json が実値非該当（テスト用固定文字列）であることが確認されている
- [ ] mock cf.sh / op が PATH 差し替えで動作する
- [ ] `bats scripts/__tests__/cf-rotate-sa-key.bats` 実行が RED（全 fail or helper file not found）

## 統合テスト連携

- 単体テスト範囲。統合テストは Phase 11 の dry-run walkthrough で代替（NON_VISUAL）

## 次 Phase

Phase 5（実装 TDD GREEN）
