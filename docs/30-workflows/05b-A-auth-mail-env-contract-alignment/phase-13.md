# Phase 13: PR 作成 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 13 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## ⚠ 自走禁止宣言（最重要）

**本タスクではユーザーの明示指示があるまで PR を作成しない。** 本 Phase は PR 作成の payload 仕様（title / body / 対象ブランチ / approval gate / rollback 手順）を文書として確定するのみで、`gh pr create` / `git push` / `git commit` を **実行しない**。

- Claude Code が自走して PR を作る対象外タスク
- 本 Phase の outputs/phase-13/main.md は「将来 PR 化する際のテンプレ」であり「PR 作成済みの記録」ではない
- ユーザーが「PR を作成してよい」と明示指示した時点で、別ターンとして本テンプレを使い PR を作成する

## 目的

将来 PR 化する際の payload を仕様化する。具体的には (a) PR title / body テンプレ、(b) 対象ブランチ、(c) `Refs #<issue>` 採用 / `Closes` 禁止のルール、(d) approval gate（user approval → 実 secret 登録 → deploy）の三役分離、(e) rollback payload を確定する。

## PR payload 仕様

### 対象ブランチ

- **作業ブランチ**: `feat/05b-A-auth-mail-env-contract-alignment-spec`（既に作成済）
- **PR base**: `main`
- **作業内容**: 本ワークフロー (`docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`) と、Phase 12 で計画した spec docs / aiworkflow references の更新を 1 PR に同梱する案を default とする
- **分割案**（user 判断）: 仕様書本体（`docs/30-workflows/...`）と 正本 spec 更新（`docs/00-getting-started-manual/specs/...` / `.claude/skills/aiworkflow-requirements/...`）を 2 PR に分けることも可。分けた場合は本 PR が先行し、spec 更新 PR は 09a 着手と同時に出す

### PR title 案（70 文字以下）

```
docs(05b-fu): align auth mail env contract to MAIL_*/AUTH_URL
```

候補:

- `docs(05b-fu): align auth mail env contract spec to implementation` (60 文字)
- `docs(05b-fu): unify mail env names (MAIL_PROVIDER_KEY/AUTH_URL)` (62 文字)

### PR body テンプレ（HEREDOC）

```markdown
## Summary

- Magic Link / 認証メールの環境変数名のドリフト（spec docs / 実装 / aiworkflow の 3 者不一致）を解消し、実装語 (`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`) に片寄せする仕様書 (Phase 1-13) を `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` に追加。
- production 未設定時の挙動を request 単位 fail-closed (502 `MAIL_FAILED`) として仕様化。boot fail は採用しない。
- 後方互換 alias は不採用（spec / aiworkflow / runbook の一方向更新で完了）。

## Test plan

- [ ] `outputs/phase-09/main.md` の grep コマンドを実行し、旧 env 名 (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) 残存件数 0 を確認
- [ ] root `artifacts.json` parity（phases 13 件 / status `spec_created`）を確認
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` で 7 ファイル実体・canonical filename・root artifacts 単独正本宣言を確認
- [ ] `outputs/phase-11/secret-list-check.md` テンプレが key 名のみ記録ルールに準拠
- [ ] secret 実値・provider response body が outputs / spec docs / PR body に転記されていない
- [ ] 不変条件 #14 / #15 / #16 のチェックリスト（Phase 10）が PASS

## 境界宣言

- 本 PR は spec_created 段階の close-out であり、production 実測 PASS ではない
- Cloudflare Secrets / Variables への実 secret 投入、staging / production の Magic Link 実送信 smoke は本 PR 範囲外
- 実投入と実送信は下流 09a / 09c タスクで user 承認後に実施

## Refs

Refs #<issue-number>
```

### `Refs #<issue>` 採用 / `Closes #<issue>` 禁止のルール

- **採用**: `Refs #<issue-number>`
- **禁止**: `Closes #<issue-number>` / `Fixes #<issue-number>` / `Resolves #<issue-number>`
- 理由: 本 PR は `spec_created` close-out であり、Issue が要求する「実 secret 投入 + 実送信 smoke + production deploy」までは完了しない。Issue は下流 09a / 09c 完了時点で別 PR から `Closes` する。本 PR で `Closes` を使うと Issue lifecycle と実装完了の整合が壊れる。

## approval gate（三役分離）

| # | 役割 | 操作 | 承認主体 | 実行タイミング |
| --- | --- | --- | --- | --- |
| 1 | spec author | 仕様書 commit / push / PR 作成 | user（明示指示） | 本 Phase 13 でテンプレ確定 → user 指示後に別ターンで実行 |
| 2 | secret operator | Cloudflare Secrets / Variables への投入、1Password Vault 実値登録 | user | 本 PR merge 後、09a 着手時点で user 自身が実行 |
| 3 | deploy operator | `bash scripts/cf.sh deploy` の staging / production 実行 | user | 09a (staging) / 09c (production) で user 承認後に実行 |

> **三役分離の意義**: spec 確定（#1）と実 secret 投入（#2）と deploy（#3）を直列の別承認にすることで、誤投入・誤 deploy 時の rollback がそれぞれの段階で打てる。本 PR は #1 のみを完了対象とする。

## rollback payload 仕様

### canonical env 名を再投入する手順テンプレ

万一 spec 更新後に挙動異常が発生した場合も、旧 env 名は再投入しない。実装側は `MAIL_PROVIDER_KEY` 固定のため、rollback は canonical env 名の再投入、Variable 値の修正、または spec docs の revert に限定する。**実値は 1Password から op read で stdin 投入のみ**。

```bash
# rollback 手順テンプレ（実行前に user 承認必須）

# 1. canonical Secret を再投入
op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env staging

# 2. wrangler.toml の canonical Variable 値を修正（テンプレ。実差分は別 PR）
# [env.staging.vars]
# MAIL_FROM_ADDRESS = "..."
# AUTH_URL = "..."

# 3. spec docs を旧名に戻す revert PR を出す
git revert <この PR の merge commit SHA>

# 4. user 承認後に bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging を実行
```

> **rollback の実用性**: 本タスクは実装が既に正本名を採用しており、spec 側のみ更新するため、rollback は基本的に「spec 側の revert」で完了する。Cloudflare 側の旧名再投入は通常不要。本テンプレは「万一の保険」として明記する。

### secret 値 rollback の禁止事項

- 旧名再投入時にも実値を PR body / commit message / log に転記しない
- `op read` の出力をリダイレクトでファイル保存しない（必ず stdin パイプで `secret put` に渡す）
- rollback 完了後、対象 1Password item の Last-Updated 日時のみ記録し、値ハッシュは記録しない

## 実行タスク

1. 自走禁止宣言を冒頭に明記する。完了条件: ユーザー明示指示があるまで PR 作成しない旨が記載される。
2. PR title 案 / body テンプレを HEREDOC 形式で記述する。完了条件: title 70 文字以下 / body に Summary / Test plan / 境界宣言 / Refs を含む。
3. `Refs #<issue>` 採用 / `Closes` 禁止のルールを記述する。完了条件: 理由（spec_created close-out で Issue lifecycle と整合させない）が明文化される。
4. approval gate の三役分離（spec author / secret operator / deploy operator）を表で定義する。完了条件: 各役割の承認主体・実行タイミングが揃う。
5. rollback payload テンプレを定義する。完了条件: 旧名再投入手順が op 参照経由で記述され、実値転記禁止が明記される。

## 参照資料

- Phase 10 user approval gate 一覧（8 件）
- Phase 11 NON_VISUAL 代替 evidence
- Phase 12 7 ファイル strict
- CLAUDE.md §Cloudflare 系 CLI 実行ルール（`scripts/cf.sh` ラッパー強制）
- CLAUDE.md §シークレット管理（1Password 経由 / 平文 .env 禁止）
- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本 Phase ではアプリケーションコード変更、deploy、commit、push、`gh pr create` を **実行しない**
- PR 作成は user 明示指示後に別ターンで本テンプレを使い実行する
- secret 実値・provider response body・op read 出力を PR body / commit message / outputs に転記しない

## 統合テスト連携

- 上流: 05b Magic Link provider, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B-magic-link-callback-credentials-provider, 09a-A-staging-deploy-smoke-execution, 09c-A-production-deploy-execution

## 多角的チェック観点

- #16 secret values never documented: PR body / commit message / rollback テンプレで実値転記を禁止
- #15 Auth session boundary: `AUTH_SECRET` を本 PR で触らないことを境界宣言に含める
- #14 Cloudflare free-tier: 本 PR で新規 binding を増やさないことを境界宣言に含める
- 未実装/未実測を PASS と扱わない: 本 PR は spec_created close-out であり production 実測 PASS ではないと PR body に明記
- プロトタイプと仕様書の採用/不採用を混同しない: GAS prototype の `RESEND_*` は本 PR の更新対象に含めない

## サブタスク管理

- [ ] 自走禁止宣言を冒頭に明記した
- [ ] PR title 案（70 文字以下）を確定した
- [ ] PR body テンプレ（Summary / Test plan / 境界宣言 / Refs）を確定した
- [ ] `Refs #<issue>` 採用 / `Closes` 禁止のルールを記述した
- [ ] approval gate 三役分離を表で定義した
- [ ] rollback payload テンプレ（旧名再投入手順）を定義した
- [ ] outputs/phase-13/main.md に上記を転記する

## 成果物

- outputs/phase-13/main.md（自走禁止宣言 / PR title 案 / PR body テンプレ / Refs ルール / approval gate 三役分離 / rollback payload テンプレ）

## 完了条件

- 自走禁止宣言が冒頭に明記され、ユーザー明示指示までは PR を作成しないことが固定されている
- PR title が 70 文字以下の案で確定している
- PR body テンプレが Summary / Test plan / 境界宣言 / Refs を含む HEREDOC 形式で確定している
- `Refs #<issue>` 採用 / `Closes` 禁止のルールと理由が明文化されている
- approval gate の三役分離（spec author / secret operator / deploy operator）が表で定義されている
- rollback payload テンプレが op 参照経由で記述され、実値転記禁止が明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）
- [ ] 自走禁止宣言が冒頭に明記されている

## 次 Phase への引き渡し

Phase 完了 へ次を渡す:

- PR 作成は user 明示指示後に別ターンで実行
- 三役分離の approval gate（spec author #1 / secret operator #2 / deploy operator #3）
- 本 PR は #1 のみ完了対象、#2 / #3 は下流 09a / 09c に委譲
- rollback テンプレは「万一の保険」であり通常経路では不要
