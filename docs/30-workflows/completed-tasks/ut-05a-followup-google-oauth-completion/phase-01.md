# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | 2-plus |
| 実行種別 | serial |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | implementation（OAuth client / Cloudflare Secrets / Google Cloud Console 設定変更を含む） |
| visualEvidence | VISUAL（OAuth flow / consent screen の screenshot 取得が成果物の一部） |
| 統合元 issue | #251（staging smoke evidence）/ #252（production verification） |

## 目的

05a Phase 11 で「実 Google OAuth client × Cloudflare Workers staging 未接続」のため取得できなかった OAuth 可視 evidence の上書きと、本番公開前に必須となる Google OAuth verification 申請を **同一 OAuth client / 同一 consent screen / 同一 secrets 配置表** で進行できる単一仕様書として確定する。後続 Phase（設計 / 実装 runbook / 手動 smoke）が `staging で確証 → production 化 → verification 申請 → testing user 以外で本番 login smoke` の段階適用を一意に判断できる入力を提供する。

## 実行タスク

1. 上流 05a の Auth.js Google OAuth / admin gate 実装状態と Phase 11 evidence 欠落理由を確認する。
2. GitHub Issue #251 / #252 の未対応責務を本タスクの AC-1〜AC-12 に統合する。
3. `artifacts.json.metadata.taskType=implementation` / `visualEvidence=VISUAL` / `workflow_state=spec_created` を確定する。
4. OAuth client / consent screen / redirect URI / secrets / privacy policy / scope の単一正本境界を定義する。
5. Phase 2 へ渡す 4 設計成果物と依存境界を固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 上流 workflow | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/` | Auth.js Google OAuth / admin gate の既存実装と evidence 欠落理由 |
| 正本仕様 | `docs/00-getting-started-manual/specs/02-auth.md` | 認証仕様への Phase 12 同期先 |
| 正本仕様 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | B-03 制約状態の Phase 12 同期先 |
| aiworkflow | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/auth/session-resolve` / admin gate 正本 |
| aiworkflow | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `AUTH_SECRET` など認証環境変数の正本 |
| skill | `.claude/skills/task-specification-creator/references/phase-template-core.md` | Phase 1 必須見出し / taskType / visualEvidence 判定 |

## 真の論点 (true issue)

- 「screenshot を取り直す」「verification を申請する」ではなく、**「`secrets / redirect URI / consent screen / privacy policy / scope` を staging と production で 1 つの正本配置表に統合し、testing user 以外で `/login` → `/admin/*` まで到達できる状態を再現可能 runbook で固定すること」** が本質。
- 副次論点:
  - Auth.js JWT / session cookie の互換性（Cloudflare host 配下で `Secure` / `SameSite` / domain 属性が staging と production で同一仕様か）
  - `scripts/cf.sh` 経由以外の `wrangler login` を排除し、平文 token がローカル / リポジトリ / ログのいずれにも残らない運用の固定
  - 既知制約 B-03（testing user 以外ログイン不能）の **解除条件** を「verification verified」「verification submitted（猶予期間中）」「testing user 拡大」のいずれで満たすかを Phase 2 設計で確定

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | VISUAL | OAuth consent screen / login flow / `/admin` redirect が screenshot 必須 |
| 成果物の物理形態 | screenshot（PNG）+ curl 出力（txt）+ session JSON + log + Markdown | `outputs/phase-11/staging/`, `outputs/phase-11/production/` |
| 検証方法 | staging 実機 smoke（M-01〜M-11 / F-09 / F-15 / F-16 / B-01）と production login smoke（testing user 以外） | Phase 11 で実機検証 |

artifacts.json の `metadata.visualEvidence` を `VISUAL` で確定。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | Auth.js Google provider 実装 / admin_users.active gate / smoke-checklist.md | smoke 実行と evidence 上書き |
| 上流 | 1Password Environments | OAuth client secret / API token の正本 vault | Cloudflare Secrets / GitHub Secrets への配置経路 |
| 上流 | Google Cloud Console プロジェクト | OAuth client / consent screen / privacy policy URI / scope 管理権限 | verification 申請の owner |
| 上流 | Cloudflare Pages / Workers staging 環境 | 本番と同一 host 構成のデプロイ先 | OAuth callback の到達先 |
| 並列 | なし | - | - |
| 下流 | 本番リリース | B-03 制約解除 | login flow が外部 Gmail で動作する状態 |
| 下流 | Magic Link provider 統合タスク | OAuth と並行する provider 設計 | secrets 配置表の DRY 適用 |

## 苦戦箇所 4 件（要件 → AC / 多角的チェックへの対応）

| # | 苦戦箇所 | 対応 AC / 多角的チェック |
| --- | --- | --- |
| 1 | staging redirect URI / Cloudflare host 差分で本番直前に失敗 | AC-1（redirect URI matrix）/ AC-5（admin gate redirect 確認） |
| 2 | screenshot / curl / session JSON が placeholder のまま残る | AC-4（staging smoke 9 ケース evidence）/ AC-12（05a Phase 11 placeholder 上書き） |
| 3 | OAuth client secret の取り扱いが属人化 | AC-2 / AC-3（Secrets 配置表）/ AC-9（`wrangler login` 不在） |
| 4 | testing user 以外でログイン不能（B-03） | AC-6 / AC-7 / AC-10（verification 状態と B-03 解除条件） |

## 価値とコスト

- 価値: B-03 制約解除と外部会員ログイン可能化により、本番公開のブロッカーを一掃。staging smoke で OAuth 設定 drift を事前検出し、本番障害ゼロでローンチ可能にする。
- コスト: Google Cloud Console での verification 申請（無料）+ staging smoke 実行 1 ラウンド + Cloudflare Secrets 注入確認。Google verification 審査は数日〜数週間の待機が発生し得る（待機中は申請済み状態で完了扱いとする運用を Phase 2 で確定）。
- 機会コスト: testing user 拡大運用で凌ぐ選択肢もあるが、外部公開時に毎回 testing user 追加が必要となり運用負債化する。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | B-03 解除は本番公開の必須前提。staging smoke は OAuth flow 設定の最終証跡 |
| 実現性 | PASS | Auth.js Google provider / admin gate は 05a 完了済。staging 環境と Google Cloud Console アクセス権は確保済 |
| 整合性 | PASS | `02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` の secrets 配置と整合。`scripts/cf.sh` 運用ポリシーに準拠 |
| 運用性 | PASS | runbook 化により dev / staging / production で同手順を再現。verification 待機状態も index で読み取れる |

## スキーマ要件（Phase 2 入力）

### 設計対象（4 文書 / 単一正本）

| # | 成果物 | 役割 |
| --- | --- | --- |
| 1 | `oauth-redirect-uri-matrix.md` | staging / production の redirect URI 一覧と Google OAuth client 登録状態の対応表 |
| 2 | `secrets-placement-matrix.md` | 1Password / Cloudflare Secrets / GitHub Secrets の配置表（実値非掲載・op 参照のみ） |
| 3 | `consent-screen-spec.md` | privacy policy / terms / homepage URI / scope / app domain / authorized domain の設定値仕様 |
| 4 | `staging-vs-production-runbook.md` | staging smoke → production verification → production smoke の段階適用手順書 |

### redirect URI 候補（Phase 2 で確定）

| 環境 | host | callback path | 用途 |
| --- | --- | --- | --- |
| local dev | `http://localhost:3000` | `/api/auth/callback/google` | wrangler dev / Next.js dev |
| staging | `https://<staging-domain>` | `/api/auth/callback/google` | Cloudflare Workers staging |
| production | `https://<production-domain>` | `/api/auth/callback/google` | Cloudflare Workers production |

### Secrets 配置候補（Phase 2 で確定）

| key | 1Password | Cloudflare Secrets (env=staging) | Cloudflare Secrets (env=production) | GitHub Secrets |
| --- | --- | --- | --- | --- |
| AUTH_SECRET | op://Vault/UBM-Auth/auth-secret | YES（独立値） | YES（独立値） | YES（CI 用） |
| GOOGLE_CLIENT_ID | op://Vault/UBM-Auth/google-client-id | YES | YES | NO |
| GOOGLE_CLIENT_SECRET | op://Vault/UBM-Auth/google-client-secret | YES | YES | NO |
| admin_users.active | op://Vault/UBM-Auth/admin-allowlist | YES | YES | NO |

> 上記は Phase 2 で `secrets-placement-matrix.md` として固定する。`.env` には `op://` 参照のみ記述し、実値はファイルに残さない。

### Schema / 共有コード Ownership 宣言

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `apps/api/src/routes/auth/*` | 05a タスク（変更しない） | 全環境 | 05a |
| `outputs/phase-02/oauth-redirect-uri-matrix.md` | 本タスク UT-05A-FOLLOWUP-OAUTH | Phase 5 / 11 / 12 | 本タスクのみ |
| `outputs/phase-02/secrets-placement-matrix.md` | 本タスク UT-05A-FOLLOWUP-OAUTH | `02-auth.md` 更新時 | 本タスクのみ |
| Google Cloud Console OAuth client / consent screen | 本タスクで運用変更 | - | プロジェクト owner（手作業） |
| `~/Library/Preferences/.wrangler/config/default.toml` | **不在固定（禁止）** | - | - |

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence が `VISUAL` で確定
- [ ] artifacts.json.metadata.taskType が `implementation` で確定
- [ ] 真の論点が「configuration の単一正本化 + 段階適用」に再定義
- [ ] 4条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 4 / 下流 2 すべて前提と出力付きで記述
- [ ] 苦戦箇所 4 件すべてが AC または多角的チェックに対応
- [ ] AC-1〜AC-12 が index.md と完全一致
- [ ] Schema / 共有コード Ownership 宣言が 5 行以上で固定
- [ ] `wrangler login` 排除と `scripts/cf.sh` 単一経路を明示
- [ ] B-03 解除条件（verified / submitted / testing user 拡大）の選択肢が Phase 2 設計入力として提示

## 実行手順

### ステップ 1: 上流前提の確認

- `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` を確認し、M-01〜M-11 / F-09 / F-15 / F-16 / B-01 の test ID 一覧を控える。
- `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md` / `.claude/skills/aiworkflow-requirements/references/environment-variables.md` の secrets 配置仕様を読み、不変条件と整合する配置候補を Phase 2 入力にする。
- Cloudflare staging / production の host 名を `apps/web/wrangler.toml` / `apps/api/wrangler.toml` から控える。

### ステップ 2: B-03 解除条件の選択肢列挙

- 候補 a: Google OAuth verification verified（理想）
- 候補 b: verification submitted（審査中・testing user に外部 owner 追加して暫定運用）
- 候補 c: testing user 拡大運用（一時退避）
- Phase 2 で a → b → c の優先順位を確定する。

### ステップ 3: secrets 配置表 draft 作成

- 1Password / Cloudflare Secrets / GitHub Secrets の必要項目を表形式で列挙し、実値は **op:// 参照のみ**で表現することを明記。
- `.env` に書く内容は `op://` 参照だけであり、`scripts/with-env.sh` 経由で実行時注入する運用を再確認。

### ステップ 4: 4条件と AC のロック

- 4条件すべてが PASS で固定されていることを確認。
- AC-1〜AC-12 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる。

## 多角的チェック観点

- 不変条件と整合: D1 / Sheets schema は本タスクで触らない。`apps/web` から D1 直接アクセス禁止に違反しない。
- セキュリティ: OAuth client secret / API token を平文で出力しない。screenshot 撮影時に token / secret が画面に映らないよう Phase 5 runbook で注意喚起する。
- AI 学習混入防止: `.env` に実値を絶対に書かない。本タスクの仕様書・成果物にも client_id / client_secret の実値を転記しない（mask して `op://` 参照のみ）。
- Cloudflare CLI ポリシー: `wrangler` 直接呼び出し禁止。`bash scripts/cf.sh` のみ使用。`wrangler login` を行わず、`~/Library/Preferences/.wrangler/config/default.toml` の不在を確認する手順を Phase 5 / 11 に組み込む。
- branch protection: solo 運用ポリシーに準拠（`required_pull_request_reviews=null`）。本タスクでも CI gate / linear history のみで品質担保する。

## 統合テスト連携

| 連携先 | 本 Phase の扱い |
| --- | --- |
| 05a 自動テスト | 新規作成せず、Phase 4 で再実行対象として整理する |
| OAuth staging smoke | Phase 11 の VISUAL evidence として設計し、Phase 1 では AC と依存境界のみ固定する |
| `validate-phase-output.js` | Phase 1 必須見出しと artifacts metadata の整合を検証対象にする |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | visualEvidence = VISUAL の確定 | 1 | spec_created | artifacts.json と同期 |
| 2 | 真の論点の「configuration 単一正本 + 段階適用」化 | 1 | spec_created | main.md 冒頭に記載 |
| 3 | 依存境界（上流 4 / 下流 2）の固定 | 1 | spec_created | 05a / 1Password / Google Cloud / Cloudflare 接続 |
| 4 | redirect URI 候補表（local / staging / production）作成 | 1 | spec_created | Phase 2 へ持ち越し |
| 5 | secrets 配置候補表作成 | 1 | spec_created | op:// 参照のみ |
| 6 | Ownership 宣言（5 行以上） | 1 | spec_created | wrangler login 禁止を含む |
| 7 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 8 | AC-1〜AC-12 の確定 | 1 | spec_created | index.md と完全一致 |
| 9 | B-03 解除条件 a/b/c の列挙 | 1 | spec_created | Phase 2 で優先順位確定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件評価・true issue・依存境界・Phase 2 入力） |
| メタ | artifacts.json | Phase 1 状態の更新 + visualEvidence 確定 |

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `pending` から `spec_created` へ遷移
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 4 件すべてが AC または多角的チェックに対応
- 異常系（redirect 不一致 / placeholder 残存 / token 平文化 / B-03 滞留）の論点が要件レベルで提示
- artifacts.json の `phases[0].status` が `spec_created`
- artifacts.json の `metadata.visualEvidence` が `VISUAL`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = configuration 単一正本 + 段階適用
  - 4条件評価（全 PASS）の根拠
  - redirect URI / Secrets 配置の候補表
  - Ownership = `outputs/phase-02/*.md` を本タスクが単独所有
  - B-03 解除条件 a/b/c の選択肢
- ブロック条件:
  - 05a smoke-checklist.md の test ID 一覧が確定していない
  - 4条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-12 が index.md と乖離
  - visualEvidence が VISUAL 以外で誤確定
