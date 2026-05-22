# Phase 9 — 品質保証 (task-01)

## 品質ゲート

| ゲート | コマンド | 期待 |
| ------ | -------- | ---- |
| actionlint | `./actionlint -color .github/workflows/ci.yml .github/actions/setup-project/action.yml` | exit 0 |
| yamllint (optional) | `yamllint .github/actions/setup-project/action.yml .github/workflows/ci.yml` | exit 0 (warning 許容) |
| composite token gate | `ci.yml` の `Validate setup-project composite action structure` step | success |
| line budget | 全 phase-*.md が 200 行以内 | `wc -l phase-*.md` で確認 |
| 変更行数 | +8 / -1 程度 | `git diff --stat` |

## actionlint 詳細期待

`actionlint` が検知し得る項目:

- input default 値の型整合 (`cache` が string 型として一貫)
- 未定義 input 参照 (composite 内で `${{ inputs.cache }}` がエラーにならない)
- expression syntax (`${{ inputs.cache }}` の brace 整合)

## yamllint 観点 (optional)

- indent: 2 空白統一
- trailing whitespace なし
- `cache: ''` の空文字記法 (`''` か `""` か) — リポジトリ既存スタイルに合わせ単一引用符 `''` を採用

## line budget

| ファイル | 目安 | 上限 |
| -------- | ---- | ---- |
| index.md | ~80 | 150 |
| phase-1.md | ~100 | 200 |
| phase-2.md | ~150 | 200 |
| phase-3.md | ~60 | 150 |
| phase-4.md | ~90 | 200 |
| phase-5.md | ~100 | 200 |
| phase-6.md | ~80 | 200 |
| phase-7.md | ~60 | 150 |
| phase-8.md | ~40 | 100 |
| phase-9.md | ~70 | 150 |
| phase-10.md | ~40 | 100 |
| phase-11.md | ~70 | 150 |
| phase-12.md | テンプレ枠 | 後続実装が確定 |
| phase-13.md | ~40 | 100 |

## CI gate 通過条件

`bash scripts/verify-pr-ready.sh` を PR 作成前に実行し以下を確認:

- `verify:phase12-compliance`: phase-12.md の canonical 9 headings 充足 (Phase 12 完了時)
- `gate-metadata:validate`: `artifacts.json` zod schema 準拠
- `indexes:rebuild`: skill indexes drift なし

## セキュリティ確認

- token / secret 値の YAML / docs 転記: なし
- 新規外部依存: なし (`actions/setup-node` / `pnpm/action-setup` の SHA pin 維持)
