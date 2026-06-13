# Phase 13: PR Creation（PR作成）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-12-documentation.md（strict 7 成果物・drift ゼロ） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| PR base | `dev` |
| 目的 | アップグレード成果を `dev` 向け PR にまとめる（Issue #1200 は CLOSED のまま参照する） |

## user 承認ゲート（厳守）

- **commit / PR の作成は user の明示承認後のみ** 実行する。後続実装者による自動実行は禁止する。
- 本 Phase に到達しても、user が「PR作成」「commit して」等を明示するまでは、コマンドを実行せず承認待ちとする。
- 承認前に許可される read-only 操作: `git status` / `git diff dev...HEAD --name-only` / `bash scripts/verify-pr-ready.sh`（pre-flight 検証）等の副作用のない確認のみ。

## 作業ブランチの方針

- 本仕様書パッケージのブランチは `docs/issue-1200-vitest-3-to-4-major-upgrade-spec`（docs 系・仕様書のみ）。
- **実装サイクルでは `feat/` 系の作業ブランチを新設**する（例: `feat/vitest-3-to-4-major-upgrade`）。仕様書ブランチに実装コードを混載しない。
- 依存 bump 主体のため `chore(deps-dev)` 系の commit/PR title を用いるが、ブランチ prefix は本リポジトリの実装サイクル慣行に従い `feat/` 系で新設する。

## pre-flight 検証（verify-pr-ready）

PR 作成前に以下 4 コマンドを実行し、全て green を確認する（CLAUDE.md PR 作成フロー準拠）。

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

`verify-pr-ready.sh` は docs-only gate の pre-flight として以下を一括検証する。

- `verify:phase12-compliance`（canonical 9 見出し / Phase 11 evidence 表 / workflow root scan）
- `gate-metadata:validate`（artifacts.json zod schema）
- `indexes:rebuild` drift（生成物 index の drift ゼロ）

失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照して原因を切り分け、修正してから再実行する。

## コミットメッセージ例（承認後のみ）

```
chore(deps-dev): bump vitest from 3.2.6 to 4.1.8 with v4 breaking-change follow-up

- vitest / @vitest/coverage-v8 を ^4.1.8 へ（exact pin 整合）
- @vitejs/plugin-react を ^5.2.0 へ（vite 6-8 peer 整合）
- vitest.d1.config.ts: poolOptions.forks.singleFork → maxWorkers: 1（isolate: false は不採用、D1 timeout 180s）
- apps/api test:coverage:unit から --minWorkers=1 を削除
- C2-C4 起因のテスト/snapshot 最小修正・coverage 閾値整合

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

## PR 本文の構成

PR 本文には以下を漏れなく含める。`outputs/phase-12/implementation-guide.md` が存在する場合、その主要見出しと内容（package.json / scripts / config 差分・C1-C8 v4 版・coverage 実測 diff）を PR 本文に反映する。

| セクション | 内容 |
| --- | --- |
| 概要 | vitest を 3.2.6 → 4.1.8 へメジャーアップグレード（`@vitest/coverage-v8` 同期・`@vitejs/plugin-react` ^5.2.0 同時更新）。NON_VISUAL 依存アップグレード |
| 変更ファイル一覧 | `git diff dev...HEAD --name-only` の全件。root `package.json` / `apps/api/package.json` / `apps/og/package.json` / `pnpm-lock.yaml` / `vitest.d1.config.ts` + 破壊的変更で修正した `*.spec.ts(x)` / snapshot +（あれば）`vitest.config.ts` / coverage 閾値設定 |
| 破壊的変更対応サマリ | C1-C8（v4 版）の各カテゴリについて、当 repo での対応（確定修正 / 観測修正 / 警告ゼロ確認 / 該当なし）を一覧化 |
| テスト結果 | 全 693 spec の shard 別 green 結果、deprecation 警告 0 件（or 分類記録）、obsolete snapshot 0 件、skip 非増加、バージョン整合（`pnpm why` ×4）。Phase 11 の代替証跡（`outputs/phase-11/`）を参照 |
| Issue #1200 との関係 | 本 PR が Issue #1200（CLOSED のまま運用・vitest-2-to-3-major-upgrade-followup-001）の実行正本である本ワークフローの成果であることを明記。issue 起票時前提（v4 stable 待ち / Vite 先行 / Node 衝突）の current facts 更新内容（index.md 調査サマリ）を要約 |
| coverage 数値変動（C2） | AST remapping による実測 diff と、閾値調整を行った場合はその根拠（Phase 7 記録への参照） |
| スクリーンショット | **作成しない**（NON_VISUAL）。「UI/UX 変更なしのためスクリーンショット不要」と明記し、スクリーンショット専用セクションは設けない |

## PR 作成コマンド（承認後のみ）

```bash
gh pr create --base dev --title "<title>" --body "<body>"
```

- base は `dev` を明示する（`main` への直接 PR は禁止。production リリース時の `dev → main` のみ）。
- title は `chore(deps-dev): bump vitest from 3.2.6 to 4.1.8` 系を基準とする。

## 作業ブランチ・同期手順（承認後のみ）

1. 現在ブランチを確認。`dev` 直上の場合は `feat/` 系の作業ブランチを作成する。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチへ `dev` をマージ。コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い自律解消（`pnpm-lock.yaml` は `mise exec -- pnpm install --force` 結果を正とする）。
4. `git status --porcelain` が空になるまで `git add -A` + commit。
5. pre-flight 検証（上記 4 コマンド）→ PR 作成。

## 完了条件

- [ ] commit / PR は user の明示承認後のみ・自動実行禁止が明記されている
- [ ] pre-flight 4 コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）が記載されている
- [ ] PR base = `dev` が明記され、`main` 直接 PR の禁止が記載されている
- [ ] 実装サイクルで `feat/` 系ブランチを新設する方針（本 spec ブランチは docs 系）が記載されている
- [ ] コミットメッセージ例と PR 本文の構成（変更ファイル一覧 / C1-C8 対応サマリ / テスト結果 / Issue #1200 との関係 / coverage 実測 diff / implementation-guide.md 反映）が記載されている
- [ ] NON_VISUAL のためスクリーンショット専用セクションを設けない方針が記載されている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- Phase 12 outputs, PR pre-flight checklist, CLOSED Issue reference rule
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-13-pr-creation.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
