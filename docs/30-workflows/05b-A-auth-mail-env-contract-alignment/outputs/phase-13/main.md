# Output Phase 13: PR 作成

## ⚠ 自走禁止宣言

**本タスクではユーザーの明示指示があるまで PR を作成しない。** 本 Phase は PR 作成の payload 仕様（title / body / 対象ブランチ / approval gate / rollback 手順）を文書として確定するのみで、`gh pr create` / `git push` / `git commit` を**実行しない**。

## PR payload 仕様

### 対象ブランチ

- 作業ブランチ: `feat/05b-A-auth-mail-env-contract-alignment-spec`（または現行 `docs/issue-382-05b-a-auth-mail-env-contract-alignment-spec`）
- PR base: `main`
- 既定: 本ワークフローと Phase 12 で計画した spec docs / aiworkflow refs 更新を 1 PR に同梱
- 分割案（user 判断）: 仕様書本体と正本 spec 更新を 2 PR に分けることも可。分けた場合は本 PR が先行し、spec 更新 PR は 09a 着手と同時

### PR title 案（≤70 文字）

```
docs(05b-fu): align auth mail env contract to MAIL_*/AUTH_URL
```

候補:
- `docs(05b-fu): align auth mail env contract spec to implementation`
- `docs(05b-fu): unify mail env names (MAIL_PROVIDER_KEY/AUTH_URL)`

### PR body テンプレ

```markdown
## Summary

- Magic Link / 認証メールの環境変数名ドリフト（spec / 実装 / aiworkflow 3 者不一致）を解消し、実装語 (`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`) に片寄せする仕様書 (Phase 1-13) を `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` に追加。
- production 未設定時を request 単位 fail-closed (502 `MAIL_FAILED`) として仕様化。boot fail 不採用。
- 後方互換 alias 不採用（spec / aiworkflow / runbook の一方向更新で完了）。

## Test plan

- [ ] `outputs/phase-09/main.md` の grep で旧 env 名残存 0 件
- [ ] root / outputs `artifacts.json` parity（phases 13 / status `spec_created`）
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` の 7 ファイル / canonical / parity 確認
- [ ] `outputs/phase-11/secret-list-check.md` が key 名のみ記録ルール準拠
- [ ] secret 実値・provider response body が outputs / spec docs / PR body に非転記
- [ ] 不変条件 #14 / #15 / #16 が Phase 10 で PASS

## 境界宣言

- 本 PR は spec_created close-out。production 実測 PASS ではない
- Cloudflare Secrets / Variables 実投入、Magic Link 実送信 smoke は本 PR 範囲外
- 実投入・実送信は下流 09a / 09c で user 承認後に実施

## Refs

Refs #<issue-number>
```

### `Refs` 採用 / `Closes` 禁止

- 採用: `Refs #<issue-number>`
- 禁止: `Closes` / `Fixes` / `Resolves`
- 理由: 本 PR は spec_created 段階。Issue が要求する「実 secret 投入 + 実送信 smoke + production deploy」までは完了しない。Issue は下流 09a / 09c 完了時に別 PR から `Closes` する

## approval gate（三役分離）

| # | 役割 | 操作 | 承認主体 | タイミング |
| --- | --- | --- | --- | --- |
| 1 | spec author | 仕様書 commit / push / PR 作成 | user 明示指示 | 本 Phase 13 でテンプレ確定 → user 指示後に別ターンで実行 |
| 2 | secret operator | Cloudflare Secrets / Variables 投入、1Password 実値登録 | user | 本 PR merge 後、09a 着手時に user 実行 |
| 3 | deploy operator | `bash scripts/cf.sh deploy` 実行 | user | 09a (staging) / 09c (production) で user 承認後 |

三役分離の意義: spec 確定 / 実 secret 投入 / deploy を直列別承認にすることで誤投入・誤 deploy 時の rollback を各段階で打てる。本 PR は #1 のみを完了対象とする。

## rollback payload

旧 env 名へ一時的に戻す必要が出た場合（極めて低確率。実装側は `MAIL_PROVIDER_KEY` 固定のため通常不要）、user 承認必須で以下手順テンプレ:

```bash
# 1Password から op read 経由 stdin 投入のみ。--body 禁止。
op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY \
      --config apps/api/wrangler.toml --env staging
```

## 完了条件

- PR title / body / Refs / approval gate / rollback 手順が**テンプレとして**確定
- `gh pr create` / `git push` / `git commit` を本 Phase で実行していない
- secret 実値・provider response body が PR body / outputs / spec docs に非含有

## 次アクション（user 指示後）

1. user が「PR を作成してよい」と明示指示
2. 別ターンで本テンプレを使い `gh pr create` 実行
3. PR merge 後、09a が secret 投入と staging smoke を担当
4. 09a 完了後、09c が production deploy を担当
