# Phase 13: PR Creation（PR作成）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-12-documentation.md（strict 7 成果物・drift ゼロ） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| workflow_state | `implemented_local_evidence_captured`（commit / PR は未実施。ユーザー明示承認後のみ実行） |
| PR base | `dev` |
| 目的 | Vite 5.4.21 → 7.x のアップグレード成果を `dev` 向け PR にまとめる |

## user 承認ゲート（厳守）

- **commit / PR の作成は user の明示承認後のみ** 実行する。自動実行は禁止する。
- 本 Phase に到達しても、user が「PR作成」「commit して」等を明示するまでは、コマンドを実行せず承認待ちとする。
- 承認前に許可される read-only 操作: `git status` / `git diff dev...HEAD --name-only` / `bash scripts/verify-pr-ready.sh`（pre-flight 検証）等の副作用のない確認のみ。

## Issue #1201 の扱い（厳守）

- 由来 Issue [#1201](https://github.com/daishiman/UBM-Hyogo/issues/1201) は **CLOSED のまま維持** する。本 Phase で **Issue を再 open しない**。
- PR 本文に Issue を参照する場合も、`Closes #1201` 等で再 open を誘発する文言は使わず、「由来 Issue #1201（CLOSED 維持）の方針に沿う」形で参照のみに留める。

## pre-flight 検証（verify-pr-ready）

PR 作成前に以下を実行し、docs-only gate の pre-flight を通す。

```bash
bash scripts/verify-pr-ready.sh
```

- `verify:phase12-compliance`（canonical 9 見出し / Phase 11 evidence 表 / workflow root scan）
- `gate-metadata:validate`（artifacts.json zod schema）
- `indexes:rebuild` drift（生成物 index の drift ゼロ）

失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照して原因を切り分け、修正してから再実行する。

加えて、コード変更を伴うため以下も green を確認する（CLAUDE.md PR 作成フロー準拠）。

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## PR 本文の構成

PR 本文には以下を漏れなく含める。

| セクション | 内容 |
| --- | --- |
| 概要 | Vite を 5.4.21 → 7.x へメジャーアップグレード（root `package.json` への `vite ^7.0.0` 直接 devDependency 新規追加）。NON_VISUAL 依存アップグレード。テストツールチェーン（vitest / @vitejs/plugin-react）専用で apps/web 本番ビルドは Vite 非依存 |
| 変更ファイル一覧 | `git diff dev...HEAD --name-only` の全件。root `package.json` / `pnpm-lock.yaml` +（破壊的変更で修正があれば）`vitest.config.ts` / `vitest.d1.config.ts` / 該当 `*.spec.{ts,tsx}` |
| 破壊的変更対応サマリ | V1〜V8 の各カテゴリについて、当 repo での対応（必須作業 / 等価維持 / 警告ゼロ確認 / 該当なし / sanity 確認）を一覧化 |
| テスト結果 | 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の shard 別 green 結果、deprecation 警告 0 件、バージョン整合（`pnpm why vite` が単一 7.x 解決）。Phase 11 の代替証跡（`outputs/phase-11/`）を参照 |
| apps/web 非影響 | `next build --webpack`（OpenNext Workers）で Vite を一切使わないため deploy bundle 非影響。`pnpm build` の sanity 確認結果を記す（blocker ではない） |
| 由来 Issue #1201 との関係 | 由来 Issue #1201 は CLOSED 維持。本 PR で再 open しない旨を明記。`pnpm.overrides.vite` ではなく直接 devDependency 追加を採用した理由（dependabot 追跡可能・解決バージョン可視化）を記す |
| スクリーンショット | **作成しない**（NON_VISUAL）。「UI/UX 変更なしのためスクリーンショット不要」と明記し、スクリーンショット専用セクションは設けない |

> `outputs/phase-12/implementation-guide.md` が存在する場合、その主要見出しと内容（package.json 差分 / V1〜V8 / config 影響 / apps/web 非影響）を PR 本文に反映する。

## PR 作成コマンド（承認後のみ）

```bash
gh pr create --base dev --title "<title>" --body "<body>"
```

- base は `dev` を明示する（`main` への直接 PR は禁止。production リリース時の `dev → main` のみ）。
- title は変更主題に沿って `chore(deps-dev): bump vite from 5.4.21 to 7.x` 系を基準とする。

## 作業ブランチ・同期手順（承認後のみ）

1. 現在ブランチを確認。`dev` 直上の場合は `chore/` 系の作業ブランチを作成する。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチへ `dev` をマージ。コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い自律解消（`pnpm-lock.yaml` は `pnpm install --force` 結果を正とする）。
4. `git status --porcelain` が空になるまで `git add -A` + commit。
5. pre-flight 検証 → PR 作成。

## 完了条件

- [ ] commit / PR は user の明示承認後のみ・自動実行禁止が明記されている
- [ ] pre-flight として `bash scripts/verify-pr-ready.sh` を実行する手順が記載されている
- [ ] PR base = `dev` が明記され、`main` 直接 PR の禁止が記載されている
- [ ] PR 本文の構成（変更ファイル一覧 / 破壊的変更対応サマリ V1〜V8 / テスト結果 / apps/web 非影響 / 由来 Issue #1201 との関係）が記載されている
- [ ] Issue #1201 は CLOSED 維持・再 open しない旨が記載されている
- [ ] NON_VISUAL のためスクリーンショット専用セクションを設けない方針が記載されている
