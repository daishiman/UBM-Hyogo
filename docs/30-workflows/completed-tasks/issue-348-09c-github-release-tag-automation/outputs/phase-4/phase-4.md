# Phase 4: 統合テスト設計（bats / actionlint / shellcheck）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | completed |

## 目的

Phase 3 の I/F を入力として、bats（決定論性 / tag format invalid / changelog missing fallback / dry-run vs apply 差分）、`actionlint` による workflow 検証、`shellcheck` によるスクリプト検証、`gh release create --notes-file` を実 release 作成せずに検証する方針を確定する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-4

# 1) bats / actionlint / shellcheck の version 固定確認
{ bats --version; actionlint -version; shellcheck --version | head -2; } \
  | tee outputs/phase-4/lint-tools-version.log

# 2) `gh release create` 実 release を作らない検証手段の存在確認
gh release create --help 2>&1 | grep -E '\-\-(notes-file|verify-tag|target)' \
  | tee outputs/phase-4/gh-flags.log
```

## bats 検証シナリオ（4 シナリオ）

| ID | シナリオ | 入力 | 期待 |
| --- | --- | --- | --- |
| BT-1 | 決定論性 | 同一引数で `generate-release-notes.sh` を 2 回実行 | stdout が完全一致（diff 0 行） |
| BT-2 | tag format invalid | `--tag v2026426-1530`（桁不足） | exit 3 / stderr に `tag format` を含む |
| BT-3 | changelog missing fallback | `--changelog-path /tmp/does-not-exist.md` | exit 4 / stderr に `changelog-path not found` を含む |
| BT-4 | dry-run と apply の差分 | `create-github-release.sh --dry-run` と `--apply`（fixture mode） | dry-run は `gh release create` を呼ばず stdout のみ。apply は `gh` を呼ぶ（mock 検証）|

`gh` の mock 戦略:

- bats 内で `PATH` を fixture bin に差し替え、`gh` を `cat $1; echo "MOCK gh"` 相当の shim にする
- `--apply` 時に shim が呼ばれたかを `outputs/phase-4/gh-mock-call.log` で検証

ファイル配置:

- `scripts/release/__tests__/generate-release-notes.bats`
- `scripts/release/__tests__/create-github-release.bats`
- `scripts/release/__tests__/fixtures/`（template / changelog / mock `gh`）

## `actionlint` 検証

```bash
actionlint .github/workflows/release-create.yml \
  | tee outputs/phase-4/actionlint.log
```

期待: 非 0 出力なし（warning も含めて clean）。

検証観点:

- `permissions: contents: write` の宣言ミス
- `on.push.tags` のクオート漏れ
- `${{ ... }}` の expression syntax
- shell step の implicit shell 警告

## `shellcheck` 検証

```bash
shellcheck \
  scripts/release/generate-release-notes.sh \
  scripts/release/create-github-release.sh \
  | tee outputs/phase-4/shellcheck.log
```

期待: SC0（警告 0）。許容例外は `# shellcheck disable=SCxxxx` を必ず行内コメントで根拠と共に記述。

## `gh release create` の dry-run 相当（実 release 非作成方針）

実 GitHub Release は本タスクの統合テスト中に作成しない。代替手段:

| 観点 | 方法 |
| --- | --- |
| API 引数の正しさ | bats 内 `gh` shim で argv を log に dump し、期待 argv と diff |
| markdown render | `gh release create` ではなく `gh api /markdown` で `--notes-file` の本文を render し、placeholder 残存の有無を検証 |
| tag immutability | `gh release view <既存 tag>` で既存 release があれば exit 7 を返すことを bats で擬似検証 |

実 release を 1 件作る検証は **Phase 11（runtime evidence）** に切り出す。Phase 4 はあくまで設計レベル。

## CI 統合（Phase 7 で `release-create.yml` に組み込み予定）

| job | コマンド | 失敗時挙動 |
| --- | --- | --- |
| `bats` | `bats scripts/release/__tests__/` | workflow fail |
| `actionlint` | `actionlint .github/workflows/release-create.yml` | workflow fail |
| `shellcheck` | `shellcheck scripts/release/*.sh` | workflow fail |

これら 3 job は Phase 7 で `.github/workflows/release-create.yml` 内の pre-release 検証 step として配置する。

## 期待 evidence ファイル（Phase 11 で実機取得）

- `outputs/phase-4/lint-tools-version.log`
- `outputs/phase-4/gh-flags.log`
- `outputs/phase-4/bats-result.log`
- `outputs/phase-4/actionlint.log`
- `outputs/phase-4/shellcheck.log`
- `outputs/phase-4/gh-mock-call.log`

## 成果物

- `outputs/phase-4/phase-4.md`
- 上記 evidence 群（Phase 11 で実機取得）

## 次 Phase の前提条件

bats / actionlint / shellcheck の検証契約を入力として、Phase 5 で `generate-release-notes.sh` / `create-github-release.sh` を実装する。
