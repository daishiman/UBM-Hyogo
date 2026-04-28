# Phase 1: 要件定義 — main.md

## 1. 目的サマリ

`.claude/skills/aiworkflow-requirements/indexes/` の **drift を authoritative に検出する CI gate** の要件を確定する。
post-merge hook で再生成していた仕組みを撤去した結果として残る「再生成忘れ → main 流入」リスクを、
local hook ではなく GitHub Actions 上で構造的に防ぐ。

## 2. 真の論点（5 件）

1. **drift 検出の権威 source を local hook ではなく CI に移せるか**
   - local hook は `--no-verify` / 未インストールで回避可能。authoritative gate は CI でなければ成立しない。
2. **`generate-index.js` の出力が決定論的か（false positive をゼロにできるか）**
   - 出力順 / 改行 / タイムスタンプ等が非決定的だと CI が常時 fail する。Phase 4 で連続 2 回実行 test を計画する。
3. **既存 4 本の workflow（ci.yml / backend-ci.yml / web-cd.yml / validate-build.yml）と job 名・trigger が衝突しないか**
   - 独立 workflow file + 独立 concurrency で物理的に衝突させない。
4. **drift 検出範囲を `.claude/skills/aiworkflow-requirements/indexes/` に限定できるか**
   - references / scripts / SKILL.md の差分を巻き込まないこと。`git diff --exit-code -- <indexes>` で path 限定する。
5. **fail 時に「何のファイルを再生成すれば直るか」が開発者に伝わるか**
   - `git diff --name-only` + `git status --short` を job log に出力する。

## 3. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか | PASS | 開発者の再生成忘れを CI が検出。レビュアーが古い index を見逃す事故を防ぐ |
| 実現性 | 無料運用 / 既存基盤で成立 | PASS | GitHub Actions 無料枠 + 既存 setup（`actions/checkout@v4` / `pnpm/action-setup@v4` / `actions/setup-node@v4`）を再利用 |
| 整合性 | 既存 CI / 不変条件と矛盾しないか | PASS | 独立 workflow file で job 名衝突なし。CLAUDE.md 不変条件 #1〜#7 に触れない |
| 運用性 | rollback / 障害時 | PASS | 独立 file のため `git revert` 1 つで撤去可能。fail ログが対処方法を直接示す |

## 4. 受入条件（AC-1〜AC-7）と検証可能性

| AC | 内容 | 検証方法 |
| --- | --- | --- |
| AC-1 | PR 作成時 / `main` push 時に `verify-indexes-up-to-date` job が自動起動し drift を検出 | PR を立てて Actions に job が出現するか確認 |
| AC-2 | drift がある場合 job が fail し差分ファイル名が job log に出る | 意図的に index を破壊した PR で fail + `git diff --name-only` を確認 |
| AC-3 | drift なしで false positive にならず PASS | 連続 2 回 `pnpm indexes:rebuild` 実行し diff ゼロを確認（Phase 4） |
| AC-4 | post-merge hook に index 再生成を戻していない | `lefthook.yml` を grep し `indexes:rebuild` が post-merge に無いことを確認 |
| AC-5 | 既存 CI と job 名・trigger・concurrency で衝突しない | inventory 表（次節）で独立性を確認 |
| AC-6 | Node 24 / pnpm 10.33.2 環境で実行 | workflow の `setup-node` / `action-setup` 設定を確認 |
| AC-7 | 監視は `.claude/skills/aiworkflow-requirements/indexes` に限定し、未追跡 index も検出 | `git add -N <indexes>` 後に `git diff --exit-code -- <indexes>` を実行 |

## 5. inventory（既存資産）

### 5.1 既存 GitHub Actions workflow（衝突回避対象）

| ファイル | 役割 | concurrency / job 名 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 共通 CI（typecheck / lint / build） | 独自グループ |
| `.github/workflows/backend-ci.yml` | apps/api 個別 CI | 独自グループ |
| `.github/workflows/web-cd.yml` | apps/web デプロイ | 独自グループ |
| `.github/workflows/validate-build.yml` | build 検証 | 独自グループ |

→ 本タスクは `.github/workflows/verify-indexes.yml` を新設し、job/workflow 名 `verify-indexes-up-to-date`、concurrency `verify-indexes-${{ github.ref }}` で独立させる。

### 5.2 drift 監視対象（`.claude/skills/aiworkflow-requirements/indexes/` 配下）

- `keywords.json`
- `quick-reference.md`
- `quick-reference-search-patterns.md`
- `quick-reference-search-patterns-code.md`
- `quick-reference-search-patterns-ipc-infra.md`
- `quick-reference-search-patterns-skill-ledger.md`
- `quick-reference-search-patterns-skill-lifecycle.md`
- `resource-map.md`
- `topic-map.md`

→ ディレクトリ単位で監視し、ファイル追加時にも `git add -N` で検出可能とする。

### 5.3 生成スクリプト

`.claude/skills/aiworkflow-requirements/scripts/generate-index.js`（package.json `indexes:rebuild` から `node` 経由で起動）。

## 6. fail 時の必須ログ仕様

job が fail する際、以下を順序通りに出力すること:

1. `::error::index drift detected. Run 'pnpm indexes:rebuild' locally and commit the result.`
2. `--- changed files ---` 区切り + `git diff --name-only -- .claude/skills/aiworkflow-requirements/indexes`
3. `--- git status ---` 区切り + `git status --short`
4. 最後に `exit 1`

→ 開発者が PR ログを見て「どの index を再生成すれば直るか」を即座に判断できる。

## 7. 命名規則の確定

| 対象 | 採用値 | 根拠 |
| --- | --- | --- |
| workflow file | `.github/workflows/verify-indexes.yml` | 既存 kebab-case 命名規則と整合 |
| workflow / job 名 | `verify-indexes-up-to-date` | Required Status Checks 表示で意味が読める |
| concurrency group | `verify-indexes-${{ github.ref }}` | 既存 workflow の独立性パターンを踏襲 |

## 8. carry-over 棚卸し

直近 5 commit を確認した結果、本タスクと矛盾する変更はなし。`feat/main-branch-guard` で main/dev への直 commit が pre-commit でブロックされており、authoritative 判定は CI に移すという本タスクの方針と整合する。

## 9. 申し送り（Phase 2 へ）

- 採用案: 独立 workflow file `verify-indexes.yml`
- 監視対象: `.claude/skills/aiworkflow-requirements/indexes/` 1 ディレクトリ
- 検出コマンド: `pnpm indexes:rebuild` → `git add -N <path>` → `git diff --exit-code -- <path>`
- fail 時必須ログ: error annotation + `git diff --name-only` + `git status --short`
- ランタイム: Node 24.15.0 / pnpm 10.33.2（`.mise.toml` と同期）

## 10. 完了条件チェック

- [x] 真の論点 5 件記載
- [x] 4 条件評価 PASS
- [x] AC-1〜AC-7 検証可能性確認済
- [x] inventory（既存 4 workflow + 監視対象）表化済
- [x] fail 時ログ要件確定
