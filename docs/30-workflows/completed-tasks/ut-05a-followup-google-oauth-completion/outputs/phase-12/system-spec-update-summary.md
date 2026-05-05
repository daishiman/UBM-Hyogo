# System Spec Update Summary

> Phase 12 で `docs/00-getting-started-manual/specs/` と aiworkflow 正本へ反映した内容のサマリ。
> Phase 11 actual evidence は未実行のため、B-03 は解除済みに昇格しない。

## 1. `02-auth.md` への更新

状態: 反映済み。

### 追加セクション

```markdown
### Secrets 配置（正本）

OAuth および Auth.js 関連の secrets 配置は単一正本に集約:

→ [`docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/secrets-placement-matrix.md`](../../30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/secrets-placement-matrix.md)

注入は `bash scripts/cf.sh secret put` 経由のみ。`wrangler` 直接呼び出し禁止。

### OAuth Redirect URI（正本）

→ [`docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/oauth-redirect-uri-matrix.md`](../../30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/oauth-redirect-uri-matrix.md)
```

## 2. `13-mvp-auth.md` への更新（B-03 セクション）

状態: 反映済み（`spec_created` / external evidence pending として追記）。解除済み・submitted への昇格は Phase 11 actual evidence 後に限定。

### Phase 11 完了後の置換例

**verified の場合**:

```markdown
### B-03: testing user 以外ログイン不能（**解除済**）

Google OAuth verification が verified 状態となり、testing user 以外の Gmail からも `/login` → `/admin` 到達可能。

- verification 状態: verified（YYYY-MM-DD 取得）
- evidence: [`outputs/phase-11/production/login-smoke.png`](../../30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/production/login-smoke.png)
- 申請記録: [`verification-submission.md`](../../30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/production/verification-submission.md)
```

**submitted（審査中）の場合**:

```markdown
### B-03: testing user 以外ログイン不能（**verification 審査中・暫定運用**）

Google OAuth verification を submitted 状態で運用中。審査中は consent 画面に "App is being verified" 警告が表示される可能性があるが login flow は機能。

- verification 状態: submitted（YYYY-MM-DD 申請）
- 暫定運用: testing user に主要管理者を追加して凌ぐ
- 解除完了予定: verified 取得時
- evidence: [`verification-submission.md`](../../30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/production/verification-submission.md)
```

## 3. `completed-tasks/05a-parallel-.../outputs/phase-11/main.md` の placeholder 上書き

状態: 参照先パスを正規化済み。実 evidence は未取得のため、05a 本体への実 screenshot 上書きは Phase 11 actual completion 後に実施。

以下を追記（既存内容を残しつつ、placeholder セクションだけ上書き）:

```markdown
## OAuth visible evidence（UT-05A-FOLLOWUP-OAUTH で取得）

05a Phase 11 で「実 Google OAuth client × Cloudflare Workers staging 未接続」のため取得できなかった OAuth 可視 evidence は、後続タスク UT-05A-FOLLOWUP-OAUTH で取得済:

- staging smoke evidence: [`ut-05a-followup-.../outputs/phase-11/staging/`](../../../ut-05a-followup-google-oauth-completion/outputs/phase-11/staging/)
- production verification: [`ut-05a-followup-.../outputs/phase-11/production/`](../../../ut-05a-followup-google-oauth-completion/outputs/phase-11/production/)

placeholder の `screenshots/spec-created-placeholder.png` は本実装で削除可。
```

## 4. `environment-variables.md`（任意）

状態: 反映済み。`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を推奨名、`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` を legacy alias として記録。

```markdown
### OAuth / Auth.js 関連 secrets

配置の正本は [secrets-placement-matrix.md](../../30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/secrets-placement-matrix.md) を参照。
```

## 適用手順（Phase 11 完了後）

```bash
# 1. 各仕様書を上記の追記内容で更新（実 Phase 11 結果に応じて B-03 セクションを a/b/c で確定）
# 2. 05a placeholder 削除
rm docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/screenshots/spec-created-placeholder.png

# 3. 内部リンク検証
mise exec -- pnpm indexes:rebuild  # skill indexes 再生成
```

## 5. apps / packages 反映判定

| 対象 | 判定 | 理由 |
| --- | --- | --- |
| `apps/desktop/` | N/A | 本リポジトリに存在しない。対象名は旧仕様由来 |
| `apps/backend/` | N/A | 本リポジトリでは `apps/api/` が backend 相当。本タスクはコード変更なし |
| `apps/api/` | N/A | OAuth 設定・運用 runbook のみで API 契約変更なし |
| `apps/web/` | N/A | 既存実装は `GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_ID` alias 両対応済み。UI変更なし |
| `packages/shared/` | N/A | JWT/session 型契約変更なし |
