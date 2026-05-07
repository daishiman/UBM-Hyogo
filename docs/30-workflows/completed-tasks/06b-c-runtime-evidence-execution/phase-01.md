# Phase 1: 実行対象 URL / storageState / 承認境界の確認 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 1 / 13 |
| wave | 6b-fu-runtime |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | **true** |

## 目的

実 runtime evidence 取得を開始する前に、(1) target base URL、(2) `storageState` ファイル、(3) 利用するテストアカウント、(4) この後の commit 範囲、の 4 点を user に明示し承認を取得する。production URL を accidentally 指定しないための gate を最上流で固定する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Issue #449、`docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/`、`apps/web/playwright/tests/profile-readonly.spec.ts`、`scripts/capture-profile-evidence.sh` |
| 出力 | `outputs/phase-01/main.md`（target / storageState path / 利用アカウント / commit 範囲の合意記録） |
| 副作用 | なし（ドキュメント作成のみ） |

## target base URL 候補

| 候補 | 用途 | 承認可否 | 備考 |
| --- | --- | --- | --- |
| `http://localhost:3000` | local dev サーバ | 承認可（推奨） | `mise exec -- pnpm --filter @ubm-hyogo/web dev` で起動 |
| `http://127.0.0.1:3000` | local dev サーバ | 承認可 | 同上 |
| `https://staging.<host>` | staging 環境 | 承認可 | wrapper の guard が `https://staging.*` を許可 |
| `https://*.pages.dev` | Cloudflare preview | 承認可 | wrapper guard が `*.pages.dev` を許可 |
| **production URL（例 `https://ubm-hyogo.example` 等）** | **禁止 / ガード対象** | **不可** | wrapper が exit 3 で reject。本仕様書からも **禁止対象**として明示 |

## storageState

| 項目 | 値 |
| --- | --- |
| 配置 path | `apps/web/playwright/.auth/state.json` |
| 取得方法 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright codegen --save-storage=apps/web/playwright/.auth/state.json <approved-target>/login` |
| gitignore 状態 | `.gitignore` に `apps/web/playwright/.auth/*.json` と `!apps/web/playwright/.auth/.gitkeep` が登録済（先行タスクで配置済）。Phase 9 で `git ls-files apps/web/playwright/.auth/ \| grep -v .gitkeep` が 0 件であることを確認 |
| 値の取り扱い | `cat` / `Read` / `grep` での内容表示禁止。仕様書・PR 本文・Issue body へ転記禁止 |

## テストアカウント（user 承認前提）

| 種別 | email | 用途 |
| --- | --- | --- |
| admin | `manjumoto.daishi@senpai-lab.com` | M-08 / M-10 で管理者 view も読み取り限定であることを確認する場合 |
| 一般会員 | `manju.manju.03.28@gmail.com` | M-08 / M-09 / M-10 / M-16 の通常 logged-in 経路 |

password / Magic Link URL / OAuth refresh token の値は本仕様書には記載しない。`.env`（1Password 参照） / Magic Link メール / Google OAuth の brouwser flow を経由して取得する。

## user approval gate（Phase 1 で確認する 4 項目）

実行前に user に以下を提示し、4 項目すべてに明示同意を得る。同意が無ければ Phase 2 以降には進まない。

1. target base URL: `http://localhost:3000` / staging / pages.dev のいずれかで良いか
2. storageState 取得操作（codegen 1 回起動 + Magic Link or Google OAuth ログイン）を行って良いか
3. 利用テストアカウント（admin / 一般会員）のどちらを使うか
4. 取得後の commit 範囲: 本タスクで作成・更新する docs（先行タスク `outputs/phase-11/`、Phase 12、本タスク `outputs/`）のみで、`apps/web/**` / `apps/api/**` には touch しないこと

## 実行手順

1. Issue #449 と先行タスク `index.md` / `phase-11.md` / `manual-smoke-evidence.md` を読み、scope と path 正本を確認する。
2. 上記表 (target / storageState / アカウント / commit 範囲) を `outputs/phase-01/main.md` にコピーし、user 提示用に整形する。
3. user に 4 項目の承認を求める。
4. 承認結果（target / storageState path / 採用アカウント / 同意 timestamp）を `outputs/phase-01/main.md` の「承認ログ」節に書き残す。
5. 承認が `production` を含む場合、または曖昧な場合は **Phase 2 に進まず一旦停止**する。

## 完了条件チェックリスト

- [ ] target base URL が `localhost` / staging / pages.dev のいずれかに確定している
- [ ] `apps/web/playwright/.auth/state.json` の予定 path が記録されている（実体作成は Phase 5）
- [ ] 採用テストアカウントが 1 つに確定している
- [ ] commit 範囲が「docs only（apps/** には触れない）」と明文化されている
- [ ] production URL の禁止が明記されている
- [ ] user 承認のログが `outputs/phase-01/main.md` に存在する

## 次 Phase への引き渡し

Phase 2 へ承認済 target / storageState path / 採用アカウントを引き渡す。production URL が指定された場合は **本仕様書のフローを停止**し、別途承認 gate を組み直す旨を記録する。
