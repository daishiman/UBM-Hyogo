# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 13 / 13 |
| 前提 | Phase 1-12 完了 |
| base ブランチ | `dev` |
| 作業ブランチ | `docs/task-a-publish-state-backfill-admin-ui-spec` |
| Gate-C | **pending（user-gated）** |

## 目的

Task A の仕様書ディレクトリ（`docs/30-workflows/publish-state-backfill-admin-ui/`）を dev へ統合する PR を作成する。
実装コード本体は PR #1064 / commit `745c95115` で既に dev へ landed 済みのため、本 PR の差分は **本仕様書ドキュメント群が主体**である。
commit / push / PR 作成 / staging screenshot は **すべてユーザー承認まで blocked**（CONST_002）。

## 実行タスク

1. PR 対象ファイル一覧を仕様書ディレクトリと既存実装参照に分けて記録する。
2. ユーザー承認後の commit / push / PR 作成手順を固定する。
3. PR 作成後に確認する CI required checks を列挙する。
4. commit / push / PR / staging screenshot の user-gated 境界を明示する。

## 変更サマリー（変更ファイル一覧）

### 本 PR（docs 主体）

| パス | 区分 |
|------|------|
| `docs/30-workflows/publish-state-backfill-admin-ui/phase-1.md` 〜 `phase-13.md` | 仕様書（Phase 1-13） |
| `docs/30-workflows/publish-state-backfill-admin-ui/index.md` | workflow index |
| `docs/30-workflows/publish-state-backfill-admin-ui/artifacts.json` | gate metadata |
| `docs/30-workflows/publish-state-backfill-admin-ui/outputs/phase-11/*` | manual test plan / interaction states / screenshot plan |
| `docs/30-workflows/publish-state-backfill-admin-ui/outputs/phase-12/*` | strict-7 close-out evidence |

### 実装本体（参照のみ・既に dev へ landed / 本 PR では再差分なし）

| パス | 状態 |
|------|------|
| `apps/web/src/features/admin/diagnostics/backfill.ts` | landed（#1064） |
| `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | landed（#1064） |
| `apps/web/app/(admin)/admin/sync-status/page.tsx`（mount） | landed（#1064） |
| `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | landed（#1064） |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | landed（#1064） |
| `apps/api/src/routes/admin/sync-backfill-publish-state.ts`（変更不要） | landed（既存） |

## PR作成手順

> 以下は **ユーザー承認後** に実行する。承認前は実行しない。

1. `git status --porcelain` で未コミット変更を確認する。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` へ fast-forward 同期する。
3. 作業ブランチへ `dev` をマージし、コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従い解消する。
4. 品質検証（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）を実行する。
5. `git add -A && git commit`（commit message は Co-Authored-By trailer 付き）。
6. `gh pr create --base dev`（production リリース時のみ `--base main`）。PR 本文は本 `phase-13.md` と `outputs/phase-12/implementation-guide.md` を反映する。

```bash
# ユーザー承認後のみ
gh pr create --base dev \
  --title "docs(publish-state-backfill-admin-ui): Task A 公開状態 backfill 管理 UI 正本仕様書" \
  --body-file <(cat docs/30-workflows/publish-state-backfill-admin-ui/outputs/phase-12/implementation-guide.md)
```

## 参照資料

| 参照 | パス |
|------|------|
| 依存 Phase 1 成果物 | `./phase-1.md` |
| 依存 Phase 2 成果物 | `./phase-2.md` |
| 依存 Phase 5 成果物 | `./phase-5.md` |
| 依存 Phase 6 成果物 | `./phase-6.md` |
| 依存 Phase 7 成果物 | `./phase-7.md` |
| 依存 Phase 8 成果物 | `./phase-8.md` |
| 依存 Phase 9 成果物 | `./phase-9.md` |
| 依存 Phase 10 成果物 | `./phase-10.md` |
| 依存 Phase 11 成果物 | `./phase-11.md` |
| 依存 Phase 12 成果物 | `./phase-12.md` |
| Phase 12 summary | `./outputs/phase-12/main.md` |
| implementation guide | `./outputs/phase-12/implementation-guide.md` |
| compliance check | `./outputs/phase-12/phase12-task-spec-compliance-check.md` |
| workflow artifacts | `./artifacts.json` |

## 成果物/実行手順

| 区分 | 内容 |
|------|------|
| 成果物 | 仕様書ディレクトリ一式、Phase 11 evidence、Phase 12 strict-7 outputs |
| 実行手順 | user 承認後に `git status` → branch sync → 品質検証 → commit → `gh pr create --base dev` → CI 確認 |
| 現時点の状態 | Gate-C pending。承認前の commit / push / PR / staging screenshot は未実行 |

## CI確認

PR 作成後、以下 required status check の green を確認する。

| check | 確認内容 |
|-------|----------|
| `verify-phase12-compliance` | `outputs/phase-12/phase12-task-spec-compliance-check.md` の canonical 9 見出し逐語一致 |
| `gate-metadata:validate` | `artifacts.json` の zod schema 整合（gates / approver） |
| `verify-indexes-up-to-date` | skill indexes drift なし |
| `verify-design-tokens` | OKLch トークン以外の色指定なし（実装本体は landed 済） |
| `verify-test-suffix` | `*.spec.tsx` のみ |

## ユーザー承認ゲート

CONST_002 に従い、以下はすべて **ユーザー明示承認まで blocked**。Gate-C は pending。

| 操作 | 状態 |
|------|------|
| commit | user-gated（blocked） |
| push | user-gated（blocked） |
| PR 作成（`gh pr create`） | user-gated（blocked） |
| staging authenticated screenshot 取得（Phase 11 visual evidence） | user-gated（blocked） |

> 本仕様書作成エージェントは仕様書ファイルの Write のみを行い、上記操作は一切実行しない。

## 完了条件

- [ ] ユーザーが PR 作成を承認した。
- [ ] `git status --porcelain` が空（全変更コミット済み）。
- [ ] `git diff dev...HEAD --name-only` が PR 対象一覧として取得できた。
- [ ] 品質 4 コマンドが green。
- [ ] `gh pr create --base dev` で PR を作成した。
- [ ] CI required checks が green。

> 上記は user 承認後に充足する。現時点では Gate-C pending のため未チェック。

## タスク100%実行確認【必須】

- [x] base=dev / 作業ブランチ / PR 手順を明記した。
- [x] commit / push / PR / staging screenshot を user-gated として固定した。
- [x] PR は user 承認まで blocked であることを明記した。
- [x] CI 確認項目を列挙した。

## 次Phase

なし（最終 Phase）。Gate-C 承認後に PR を作成して workflow を close-out へ進める。
