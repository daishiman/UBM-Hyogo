# Implementation Guide

## Part 1: 中学生レベル

リリースタグは「この日にこの内容を公開した」という目印です。この仕組みでは、その目印が付いたら、変更内容を書いたメモと証拠リンクを集めて、GitHub の Releases に載せる文章を自動で作ります。いきなり公開せず、まず下書きや dry-run で確認できるので、間違ったタグや足りない説明に気づきやすくなります。

日常例で言うと、文化祭のあとに「いつ、どの出し物を、どの写真付きで記録したか」を掲示板にまとめる係です。タグが開催日の札、changelog が出し物リスト、evidence が写真アルバム、draft release が先生に見せる下書きです。

| 用語 | 中学生向け説明 |
| --- | --- |
| release tag | 公開した日付と時刻を表す札 |
| changelog | 何が変わったかを書いたメモ |
| evidence | 本当に確認したことを示す証拠リンク |
| dry-run | 実際には貼らず、下書きだけ作る練習 |
| draft release | GitHub 上に作る公開前の下書き |
| rollback | 問題が起きた時に元へ戻す手順 |

## Part 2: 技術者レベル

### C12P2-1 TypeScript / スキーマ型定義

リリース生成は bash スクリプトのため TypeScript 型は持たないが、入出力契約は YAML / Markdown 構造で固定する。

- GitHub Actions 入力契約 (`.github/workflows/release-create.yml`):
  - `inputs.tag`: `string` `^v[0-9]{8}-[0-9]{4}$`
  - `inputs.target`: `string` `^[0-9a-f]{7,40}$`
  - `inputs.changelog_path`: `string`（リポジトリ相対パス）
  - `inputs.evidence_url`: `string`（https://github.com/... を期待）
  - `inputs.mode`: `enum("dry-run","apply")` 既定 `dry-run`
- Release notes 構造（`scripts/release/release-notes.template.md`）: `{{TAG}} / {{COMMIT}} / {{CHANGELOG}} / {{EVIDENCE_URL}} / {{ROLLBACK_URL}} / {{FOLLOWUP_URL}} / {{GENERATED_AT}}` プレースホルダ。
- 生成物メタ（`outputs/phase-11/dry-run-release-notes.md`）: タグ・コミット・evidence URL・generated_at を含む。

### C12P2-2 API シグネチャ

下記「API Signatures」セクション参照。発火条件は「`refs/tags/v*` push」または「`workflow_dispatch` の `mode=dry-run`」のみ。`workflow_dispatch` での apply は禁止（CI で `inputs.mode == "apply"` を弾く）。

### C12P2-3 使用例

下記「Usage」セクション参照。ローカル dry-run / draft apply の二段例を含む。

### C12P2-4 エラー処理

下記「Error Handling」テーブル参照。NO-GO 条件は exit 64（タグ書式不正・ターゲット不正・apply 時の draft 必須違反・既存リリース重複等）。差戻しルールは「dry-run 出力をレビュー後にしか apply できない」`--reviewed-notes-file` 必須化で担保。

### C12P2-5 設定可能パラメータ・定数

下記「Parameters」テーブル参照。`artifacts.json.metadata` 必須フィールドは `tag_format=vYYYYMMDD-HHMM` / `mutation_boundary=user-gated-draft` / `dispatch_mode=dry-run-only`。環境変数は不要（gh CLI 認証は Actions 標準 `GITHUB_TOKEN` を使用）。

### Data flow

```text
tag push vYYYYMMDD-HHMM
  -> .github/workflows/release-create.yml
  -> scripts/release/create-github-release.sh
  -> scripts/release/generate-release-notes.sh
  -> scripts/release/release-notes.template.md + Phase 12 changelog + Phase 11 evidence URL
  -> gh release create --draft
```

`generate-release-notes.sh` is pure: it validates the tag and commit, reads the changelog if present, resolves template placeholders, and writes markdown to stdout. `create-github-release.sh` owns the side-effect boundary: `--dry-run` renders only, while `--apply --draft` calls `gh release create` after checking that a release for the tag does not already exist.

`workflow_dispatch` is dry-run only. Tag push is the only automated apply route, and it creates a draft release.

### API Signatures

```bash
bash scripts/release/generate-release-notes.sh \
  --tag vYYYYMMDD-HHMM \
  --commit <sha> \
  --changelog-path <path> \
  --evidence-url <url> \
  [--rollback-url <url>] \
  [--followup-url <url>] \
  [--generated-at <iso8601>] \
  [--template <path>]

bash scripts/release/create-github-release.sh \
  --tag vYYYYMMDD-HHMM \
  --target <sha> \
  --changelog-path <path> \
  --evidence-url <url> \
  (--dry-run|--apply --draft --reviewed-notes-file <path>)
```

### Usage

```bash
bash scripts/release/create-github-release.sh \
  --tag v20260506-1530 \
  --target "$(git rev-parse HEAD)" \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" \
  --dry-run
```

### Error Handling

| Error | Handling |
| --- | --- |
| invalid tag | exit 64 before rendering or mutation |
| invalid target SHA | exit 64 before rendering or mutation |
| `--apply` without `--draft` | exit 64; published release creation is not allowed |
| local tag missing on apply | exit 64; apply requires an existing local tag |
| tag target mismatch | exit 64; tag commit must match `--target` |
| missing reviewed notes on apply | exit 64; apply requires a prior dry-run notes file |
| release already exists | exit 64 before `gh release create` |

### Parameters

| Parameter | Required | Notes |
| --- | --- | --- |
| `--tag` | yes | Must match `vYYYYMMDD-HHMM` |
| `--target` / `--commit` | yes | Hex SHA; apply also verifies local commit and tag match |
| `--changelog-path` | yes | Missing file renders an explicit fallback in dry-run output |
| `--evidence-url` | yes | Phase 11 evidence URL embedded in release notes |
| `--rollback-url` | no | Defaults to `N/A` |
| `--followup-url` | no | Defaults to `N/A` |
| `--dry-run` | one mode required | Renders markdown only |
| `--apply --draft --reviewed-notes-file` | one mode required | Creates a draft GitHub Release after local tag/target checks and reviewed dry-run output |
