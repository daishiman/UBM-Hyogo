# ut-05a-followup-google-oauth-completion - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-05a-followup-google-oauth-completion |
| 統合元 | GitHub Issue #251（staging OAuth smoke evidence）/ #252（Google OAuth verification） |
| 作成日 | 2026-04-30 |
| ステータス | spec_created |
| 総Phase数 | 13 |
| Wave | 2-plus |
| 優先度 | HIGH |
| 実行種別 | serial（staging smoke → production verification の段階適用） |
| visualEvidence | VISUAL（OAuth flow / consent screen の screenshot 取得が成果物） |
| taskType | implementation（OAuth client / Cloudflare Secrets / Google Cloud Console 設定の運用変更を伴う） |

---

## 統合の理由

GitHub Issue #251 と #252 は「Google OAuth 完成度」という同一テーマの **環境別工程**:

- **#251**: staging（Cloudflare preview / wrangler dev）で OAuth smoke evidence（screenshot / curl / session JSON）を取得
- **#252**: production（本番 domain）で Google OAuth verification 申請を完了させ、testing user 制限を解除

両者は OAuth client / consent screen / redirect URI / Cloudflare Secrets / 1Password 配置を **同じ設定空間**で操作するため、別タスクで進めると `secrets 配置表` `consent screen 設定` `redirect URI 一覧` を二重管理する drift リスクが大きい。本タスクで **「staging で OAuth flow を確証 → そのまま production 化して verification 申請」** の単一ワークフローに統合する。

両 issue は本タスク仕様書作成時点で **closed** だが、closed のまま仕様書を作成し、未対応の運用責務（B-03 制約解除）を本タスクに引き継ぐ運用とする（ユーザー指示）。

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計 | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | spec_created |
| 5 | 実装ランブック（OAuth client / Secrets / smoke 手順） | [phase-05.md](phase-05.md) | spec_created |
| 6 | 異常系検証 | [phase-06.md](phase-06.md) | spec_created |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | spec_created |
| 8 | DRY 化（secrets 配置 / runbook 共通化） | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証（無料枠 / セキュリティ） | [phase-09.md](phase-09.md) | spec_created |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | spec_created |
| 11 | 手動 smoke test（staging + production） | [phase-11.md](phase-11.md) | spec_created |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | spec_created |
| 13 | PR作成 | [phase-13.md](phase-13.md) | pending_user_approval |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
                         ↓
                    (MAJOR→戻り)
```

Phase 11 内部は **段階適用（A: staging smoke → B: production verification 申請 → C: production smoke）** の直列実行とし、A 失敗時は B/C に進まない。

---

## 真の論点（true issue）

- 「staging smoke 証跡を撮ること」「OAuth verification 申請を出すこと」ではなく、**「testing user 制限解除（B-03）を `secrets / redirect URI / consent screen / privacy policy / scope` の単一正本で完結させ、staging 検証 → production 公開を再現可能 runbook で固定すること」** が本質。
- 副次論点として、`apps/web` / `apps/api` の OAuth callback URL 仕様、Auth.js session cookie 互換性、`scripts/cf.sh` 経由の Secrets 注入が staging / production 双方で 1 つの設定表で説明できることを保証する。

---

## 受入条件（AC）

| ID | 内容 |
| --- | --- |
| AC-1 | Google Cloud Console の OAuth client（staging / production）が **同一 project / 同一 consent screen** で登録され、redirect URI 一覧が `outputs/phase-02/oauth-redirect-uri-matrix.md` と一致 |
| AC-2 | Cloudflare Secrets（`AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`）が staging / production 環境双方で設定済（`bash scripts/cf.sh` 経由のみ。平文ファイル不在） |
| AC-3 | 1Password / GitHub Secrets / Cloudflare Secrets の **配置表** が `outputs/phase-02/secrets-placement-matrix.md` で更新され、`docs/00-getting-started-manual/specs/02-auth.md` および `13-mvp-auth.md` から参照される |
| AC-4 | staging で OAuth smoke **主要 9 capture + 補助 6 check**（M-01〜M-11 / F-09 / F-15 / F-16 / B-01）が PASS。screenshot 9 枚以上 / curl response / `session-member.json` / `session-admin.json` / `wrangler-dev.log` が `outputs/phase-11/staging/` に配置 |
| AC-5 | `/login?gate=...` redirect、`/admin/*` 非管理者 redirect、admin_users.active 一致時のみ `/admin` へ進める動作が staging 実機で確認 |
| AC-6 | Google OAuth consent screen が **production / verification submitted（または verified）** ステータスとなり、Google Cloud Console 設定 screenshot を `outputs/phase-11/production/consent-screen.png` に保存 |
| AC-7 | testing user 以外の Google account（外部 Gmail）で本番 login smoke が PASS。screenshot を `outputs/phase-11/production/login-smoke.png` に保存 |
| AC-8 | privacy policy / terms / homepage URI が production domain で 200 を返し、Google verification 申請の URL 要件を満たす |
| AC-9 | `scripts/cf.sh` 経由以外で `wrangler login` / 平文 token を保持していないことを `git grep` / `~/Library/Preferences/.wrangler/` 不在チェックで確認 |
| AC-10 | 既知制約 B-03（testing user 以外ログイン不能）が **解除済** または **verification submitted で待機中**として `docs/00-getting-started-manual/specs/13-mvp-auth.md` から状態が読み取れる |
| AC-11 | 無料枠運用：Google Cloud は OAuth + Cloud Console 操作のみで課金 product を有効化していない。Cloudflare Workers / Secrets も無料枠内に収まる（`outputs/phase-09/free-tier-estimation.md` で根拠化） |
| AC-12 | 05a Phase 11 evidence の placeholder（`outputs/phase-11/main.md` 等）が本タスク成果物リンクで上書きされ、Phase 12 implementation-guide の証跡リンクも更新 |

---

## Phase完了時の必須アクション

1. **タスク100%実行**: Phase 内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json 更新**: `complete-phase.js` で Phase 完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

```bash
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/ut-05a-followup-google-oauth-completion --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 依存

- 上流: `05a-parallel-authjs-google-oauth-provider-and-admin-gate`（Phase 11 までは completed、本タスクは evidence 上書き責務を引き継ぐ）
- 並列なし（Wave 2-plus 単独実行）
- 下流: 本番リリース（B-03 解除前提）/ Magic Link provider 統合タスク

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/oauth-redirect-uri-matrix.md`, `outputs/phase-02/secrets-placement-matrix.md`, `outputs/phase-02/consent-screen-spec.md`, `outputs/phase-02/staging-vs-production-runbook.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/test-strategy.md` |
| 5 | `outputs/phase-05/implementation-runbook.md` |
| 6 | `outputs/phase-06/failure-cases.md` |
| 7 | `outputs/phase-07/ac-matrix.md` |
| 8 | `outputs/phase-08/main.md` |
| 9 | `outputs/phase-09/main.md`, `outputs/phase-09/free-tier-estimation.md` |
| 10 | `outputs/phase-10/go-no-go.md` |
| 11 | `outputs/phase-11/staging/`（screenshot 9 / curl / session-member.json / session-admin.json / wrangler-dev.log）, `outputs/phase-11/production/`（consent-screen.png / login-smoke.png / verification-submission.md）, `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md` |
| 12 | `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/documentation-changelog.md`, `outputs/phase-12/unassigned-task-detection.md`, `outputs/phase-12/skill-feedback-report.md` |
| 13 | - |

---

*このファイルは task-specification-creator skill フォーマットに従い手動作成。*
