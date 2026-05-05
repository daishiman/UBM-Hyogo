# Phase 1 主成果物 — 要件定義

> 仕様: `phase-01.md` / 状態: `spec_created` → 本ドキュメントで実装

## 1. 真の論点 (true issue)

「screenshot を取り直す」「verification を申請する」ではなく、
**`secrets / redirect URI / consent screen / privacy policy / scope` を staging と production で 1 つの正本配置表に統合し、testing user 以外で `/login` → `/admin/*` まで到達できる状態を再現可能 runbook で固定する** ことが本質。

副次論点:

- Auth.js JWT / session cookie の互換性（`Secure` / `SameSite` / domain 属性が staging と production で同一仕様か）
- `scripts/cf.sh` 経由以外の `wrangler login` を排除し、平文 token がローカル / リポジトリ / ログのいずれにも残らない運用の固定
- 既知制約 B-03（testing user 以外ログイン不能）の解除条件:
  - 候補 a: Google OAuth verification verified（理想）
  - 候補 b: verification submitted（審査中・暫定運用）
  - 候補 c: testing user 拡大運用（一時退避）
- Phase 2 で a > b > c の優先順位を確定する。

## 2. visualEvidence

| 項目 | 値 |
| --- | --- |
| visualEvidence | **VISUAL** |
| 物理形態 | screenshot（PNG）+ curl 出力（txt）+ session JSON + log + Markdown |
| 検証方法 | staging 実機 smoke（M-01〜M-11 / F-09 / F-15 / F-16 / B-01）+ production login smoke（testing user 以外） |

## 3. 受入条件 (AC-1 〜 AC-12)

`index.md` に列挙された AC-1 〜 AC-12 を本タスクの正本 registry とする（重複転記を避けるため `index.md` を参照）。

## 4. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | Auth.js Google provider / admin_users.active gate / smoke-checklist.md | smoke 実行と evidence 上書き |
| 上流 | 1Password Environments | OAuth client secret / API token の正本 vault | Cloudflare Secrets / GitHub Secrets への配置経路 |
| 上流 | Google Cloud Console | OAuth client / consent screen / privacy policy URI / scope 管理権限 | verification 申請の owner |
| 上流 | Cloudflare Workers staging | 本番と同一 host 構成のデプロイ先 | OAuth callback の到達先 |
| 並列 | なし | - | - |
| 下流 | 本番リリース | B-03 制約解除 | login flow が外部 Gmail で動作する状態 |
| 下流 | Magic Link provider 統合タスク | OAuth と並行する provider 設計 | secrets 配置表の DRY 適用 |

## 5. 苦戦箇所 4 件 → AC 対応

| # | 苦戦箇所 | 対応 AC |
| --- | --- | --- |
| 1 | staging redirect URI / Cloudflare host 差分で本番直前に失敗 | AC-1 / AC-5 |
| 2 | screenshot / curl / session JSON が placeholder のまま残る | AC-4 / AC-12 |
| 3 | OAuth client secret の取り扱い属人化 | AC-2 / AC-3 / AC-9 |
| 4 | testing user 以外ログイン不能（B-03） | AC-6 / AC-7 / AC-10 |

## 6. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | B-03 解除は本番公開の必須前提 |
| 実現性 | PASS | Auth.js / admin gate は 05a 完了済 / staging 環境と Console 権限あり |
| 整合性 | PASS | `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` と整合 |
| 運用性 | PASS | runbook 化により再現可能。verification 待機状態も index で読み取れる |

## 7. Schema / 共有コード Ownership 宣言

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `apps/api/src/routes/auth/*` | 05a タスク（変更しない） | 全環境 | 05a |
| `outputs/phase-02/oauth-redirect-uri-matrix.md` | 本タスク | Phase 5 / 11 / 12 | 本タスクのみ |
| `outputs/phase-02/secrets-placement-matrix.md` | 本タスク | `02-auth.md` 更新時 | 本タスクのみ |
| Google Cloud Console OAuth client / consent screen | 本タスクで運用変更 | - | プロジェクト owner（手作業） |
| `~/Library/Preferences/.wrangler/config/default.toml` | **不在固定（禁止）** | - | - |

## 8. Phase 2 への引き渡し

- 4 設計成果物: redirect-uri-matrix / secrets-placement-matrix / consent-screen-spec / staging-vs-production-runbook
- B-03 解除条件 a > b > c を Phase 2 で確定
- redirect URI 候補（local/staging/production）/ Secrets 配置候補表

## 完了条件チェック

- [x] visualEvidence = VISUAL 確定
- [x] taskType = implementation 確定
- [x] 真の論点 = configuration 単一正本 + 段階適用
- [x] 4 条件評価が全 PASS
- [x] 依存境界（上流 4 / 下流 2）固定
- [x] 苦戦箇所 4 件すべて AC 対応
- [x] AC-1〜AC-12 が `index.md` と一致
- [x] Ownership 宣言 5 行以上
- [x] `wrangler login` 排除 / `scripts/cf.sh` 単一経路を明示
- [x] B-03 解除条件 a/b/c を Phase 2 入力として提示
