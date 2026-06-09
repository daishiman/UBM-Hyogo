# Phase 4: テスト作成

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **implementation_mode: new**
**対象 Issue: #1146 [FU-SASR-002]（CLOSED 維持・`Refs #1146` のみ）**

## 0. このタスクの性質と「テスト」の定義

本タスクの本体変更は `.github/workflows/verify-no-localhost-bake.yml` の `on.pull_request.paths`
ブロック**除去のみ**であり、gate 本体（`scripts/verify-no-localhost-bake.sh` の grep LOGIC）と
self-test（`scripts/verify-no-localhost-bake.spec.ts`）は**一切変更しない**。

したがって本 Phase で扱う「テスト」は新規テストコードの追加ではなく、次の 2 系統の検証で構成する。

| 系統 | 何を検証するか | 実体 |
| --- | --- | --- |
| (a) gate self-test 回帰 | paths 除去後も `verify-no-localhost-bake.sh` の grep LOGIC が不変であり、self-test が PASS すること | 既存 `scripts/verify-no-localhost-bake.spec.ts`（変更なし） |
| (b) trigger 変更の構造検証 | yml の `on` ブロックに `pull_request.paths` が無いこと・`pull_request.branches:[main,dev]` と `push.branches:[main,dev]` が保持されること | yml 静的検査（yamllint / actionlint / 目視 + grep assert） |

> branch protection の required context 登録検証（`gh api .../protection`）は **runtime（実行系）の検証**であり
> 本 Phase の test スコープ外とする。これは Phase 5（登録手順）/ Phase 11（evidence 取得）/ Phase 13（PUT 実行と after GET）へ委譲する。

## 1. 系統 (a): gate self-test の回帰確認

### 1.1 既存テストケース一覧（`scripts/verify-no-localhost-bake.spec.ts`）

| ID | ケース名（describe/it） | 期待 |
| --- | --- | --- |
| TC-VNLB-01 | `fails on unallowlisted localhost API endpoint` | `apps/web/src/lib/bad.ts` に `http://127.0.0.1:8787/me` がある fixture root に対し exit code = 1 / stderr に `localhost bake detected` を含む |
| TC-VNLB-02 | `allows local fallback with explicit allowlist comment` | `// localhost-allow:local-fallback` コメント直後行の `http://localhost:8787` を許容し exit code = 0 |

### 1.2 期待結果（expected result）

- grep LOGIC（`scripts/verify-no-localhost-bake.sh` の `PATTERN` / `scan_file` / `scan_tree`）は本タスクで
  **無変更**であるため、TC-VNLB-01 / TC-VNLB-02 の **2 ケースは全件 PASS** を期待する。
- self-test は yml の `self-test` step（`mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts`）でも
  CI 上で実行されるが、この step も本タスクで**無変更**。
- 加えて `bash scripts/verify-no-localhost-bake.sh --self-test`（スクリプト内蔵の dirty/clean/allow fixture 自己検証）も
  `self-test passed` を出力すること。

### 1.3 ローカル実行コマンド

```bash
mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts
bash scripts/verify-no-localhost-bake.sh --self-test
bash scripts/verify-no-localhost-bake.sh --src-only
```

## 2. 系統 (b): trigger 変更の構造検証

### 2.1 検証観点

| 観点 ID | 観点 | 合格基準 |
| --- | --- | --- |
| TRG-01 | `on.pull_request.paths` が存在しないこと | yml の `pull_request` 配下に `paths:` キーが無い |
| TRG-02 | `on.pull_request.branches` が `[main, dev]` で保持されていること | 除去対象は `paths` のみ。`branches` は不変 |
| TRG-03 | `on.push.branches` が `[main, dev]` で保持されていること | `push` は元々 paths を持たず無変更 |
| TRG-04 | `jobs.verify-no-localhost-bake` 配下（self-test / source grep gate step）が不変であること | 差分が `on:` ブロックの paths 除去に限定される |

### 2.2 期待結果（yamllint / actionlint 観点）

- **yamllint**: paths 除去後も YAML 構文・インデントが正しく、警告/エラー 0。
- **actionlint**: `on` トリガ定義が GitHub Actions schema 準拠であり、`paths` 削除後も `pull_request` / `push` が
  有効な trigger として認識されること（エラー 0）。
- paths 除去後の `on` ブロックは required check 群（ci / Validate Build / e2e-tests / lighthouse）と同じ
  **no-paths 規約**に揃う（trigger 一貫性が向上）。

### 2.3 検証コマンド（構造 assert）

```bash
# TRG-01: paths が無いこと（出力が空であること）
grep -nE '^[[:space:]]*paths:' .github/workflows/verify-no-localhost-bake.yml || echo "OK: no paths block"

# TRG-02 / TRG-03: branches 保持の目視 + actionlint
grep -nE 'branches:\s*\[main, dev\]' .github/workflows/verify-no-localhost-bake.yml
./actionlint -color .github/workflows/verify-no-localhost-bake.yml
```

## 3. branch protection 検証の委譲（test スコープ外の明示）

| 内容 | 委譲先 |
| --- | --- |
| dev/main の現 required contexts の before GET | Phase 5（手順記述）/ Phase 11（evidence） |
| `verify-no-localhost-bake` を contexts に追加した PUT payload 設計 | Phase 5 |
| PUT 実行と after GET（登録確認） | Phase 13（user 承認後のみ） |

> 現 required contexts（dev/main 共通・実測）: `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]`。
> 追加 context = `verify-no-localhost-bake`。

## 完了条件（Phase 4）

- [x] テストが 2 系統（gate self-test 回帰 / trigger 構造検証）であることを明記した
- [x] 既存 self-test ケース（TC-VNLB-01 / 02）を列挙し、grep LOGIC 不変ゆえ全件 PASS 期待を明記した
- [x] trigger 構造観点（TRG-01〜04）と yamllint / actionlint 期待を定義した
- [x] branch protection 検証は runtime であり Phase 5/11/13 へ委譲する旨を区別した
