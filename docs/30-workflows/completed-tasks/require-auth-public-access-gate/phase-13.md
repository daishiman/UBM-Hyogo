# Phase 13: PR作成（最終 Phase）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 13 / 13（**最終 Phase**） |
| 名称 | PR作成 |
| 種別 | リリース Phase |
| gate | **ユーザー明示承認後のみ実施**（CONST_002） |
| base ブランチ | `dev`（既定。production リリース時のみ `dev → main`） |
| 前提 | Phase 12（ドキュメント更新）完了 |
| 重要 | 本 workflow は `implemented_local_evidence_captured`。本 Phase は **ユーザー明示承認後**の PR 手順を定義する |

## 目的

実装サイクル（Phase 4-12）完了後に、`.claude/commands/ai/diff-to-pr.md` 準拠で PR を作成する手順を定義する。
commit / push / PR は **すべてユーザー明示承認後のみ**実行する（CONST_002）。
本 workflow（仕様書作成）の段階では PR を作成せず、手順の確定に留める。

## 実行タスク

1. 事前 gate（typecheck / lint / verify-pr-ready.sh 等）を実行する。
2. base=`dev` を同期し作業ブランチへ取り込む。
3. `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として PR 本文を作成する。
4. PR 本文に implementation-guide.md の内容と Phase 11 screenshot 参照（VISUAL）を反映する。
5. `gh pr create --base dev` で PR を作成する。
6. 上記すべてを **ユーザー明示承認後のみ**実行する。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| PR 仕様 | `.claude/commands/ai/diff-to-pr.md` | PR 本文 Phase 13 仕様 |
| implementation-guide | `outputs/phase-12/implementation-guide.md` | PR 本文へ反映 |
| screenshot | `outputs/phase-11/login-required-notice-unauthenticated.png` / `public-members-authenticated.png` | PR 本文の VISUAL 参照 |
| 事前 gate | `scripts/verify-pr-ready.sh` | docs-only gate の pre-flight |

## 実行手順

### Step 1. 事前 gate（PR 作成前の品質検証）

| # | コマンド | 目的 |
|---|---------|------|
| 1 | `pnpm install --force` | 依存整合 |
| 2 | `pnpm typecheck` | 型チェック |
| 3 | `pnpm lint`（必要時 `pnpm lint --fix`） | リント |
| 4 | `bash scripts/verify-pr-ready.sh` | `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift の一括検証 |

> いずれか失敗時は最大 3 回まで自動修復し、修復差分をコミットする（CLAUDE.md PR フロー準拠）。

### Step 2. base ブランチ同期

1. `git fetch origin dev` を実行し、ローカル `dev` を `origin/dev` へ fast-forward 同期する。
2. 作業ブランチ（`docs/require-auth-public-access-gate-spec` または実装サイクルの feature ブランチ）に戻り `dev` をマージする。
3. コンフリクトは CLAUDE.md の既定方針（設定=dev 基準 / lock=再生成 / コード=両側統合 / docs=意味結合）で自律解消し、`git add` + `git commit` まで行う。

### Step 3. PR 本文作成（diff-to-pr 準拠）

- `git diff dev...HEAD --name-only` で PR に入るファイル一覧を取得し、漏れなし確認に使う。
- `.claude/commands/ai/diff-to-pr.md` と `outputs/phase-12/implementation-guide.md` を参照して PR 本文を作成する。
- PR 本文に含める:
  - 背景（ログイン必須化の要望）と主問題（認証境界が公開層に開いている）。
  - 変更概要（C1: Web UI gate / C2: API gate + server-to-server）。
  - AC-1〜AC-13 の充足状況。
  - **Phase 11 screenshot 参照（VISUAL）**: `login-required-notice-unauthenticated.png` / `public-members-authenticated.png`（実装サイクルで取得済みの場合）。
  - specs4 更新と `aiworkflow-requirements` sync の記載。

### Step 4. PR 作成

```bash
gh pr create --base dev \
  --title "feat: require auth for all public routes and gate /public/* API" \
  --body-file <PR 本文ファイル>
```

> production リリース時のみ `--base main` を明示する。本タスクは `dev` を既定とする。

### Step 5. user-gated 制約

| 操作 | 承認要否 |
|------|---------|
| commit | **ユーザー明示承認後のみ** |
| push | **ユーザー明示承認後のみ** |
| `gh pr create` | **ユーザー明示承認後のみ** |
| staging へのデプロイ / 実機 screenshot 取得 | **ユーザー明示承認後のみ** |

> 本 workflow（仕様書作成）の時点では上記いずれも実行しない（CONST_002 / CONST_006）。

## 多角的チェック観点（AIが判断）

- 完結性: C1 / C2 両 concern と specs4・spec sync が 1 PR に含まれ、partial fix のまま PR されないか（Phase 10 の partial fix 検出結果を最終確認）。
- リスク系: `INTERNAL_AUTH_SECRET` の staging / production secret 投入が PR 本文に runbook として明記されているか（ゲート後に sitemap / OG が壊れないため）。

## サブタスク管理

- [ ] 事前 gate（typecheck / lint / verify-pr-ready.sh）手順を定義
- [ ] base=dev 同期・コンフリクト解消方針を定義
- [ ] PR 本文に implementation-guide + Phase 11 screenshot（VISUAL）反映を定義
- [ ] `gh pr create --base dev` 手順を定義
- [ ] commit / push / PR / staging が全て user-gated であることを明記

## 成果物

| 成果物 | 配置 / 形態 |
|--------|-----------|
| PR（dev base） | GitHub PR（実装サイクル完了後・user-gated） |
| PR 本文 | implementation-guide + Phase 11 screenshot 参照を反映 |

## 完了条件

- [ ] 事前 gate（4 コマンド）が定義されている
- [ ] base=dev 同期手順が定義されている
- [ ] PR 本文への implementation-guide / Phase 11 screenshot（VISUAL）反映が定義されている
- [ ] commit / push / PR / staging が全て **ユーザー明示承認後のみ**（CONST_002）と明記されている
- [ ] 本 workflow（仕様書作成）段階では PR を作成しないと明記されている

## タスク100%実行確認【必須】

- [ ] 事前 gate・base 同期・PR 本文・gh pr create・user-gated 制約をすべて記述した

## 次Phase

**最終 Phase**（Phase 13 が本 workflow の最後。以降の実装・commit・PR はユーザー承認を得てから実装サイクルで実施する）
