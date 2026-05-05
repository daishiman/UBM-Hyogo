# OAuth Consent Screen Spec

> Phase 2 設計成果物 3 / Owner: UT-05A-FOLLOWUP-OAUTH

## 設定値仕様

| 項目 | 値 / 仕様 | 根拠 |
| --- | --- | --- |
| User Type | **External** | UBM 会員は Workspace 内ユーザー限定ではない |
| Publishing status | Testing → **In production** （verification 申請時に遷移） | testing user 制限解除のため |
| App name | `UBM 兵庫支部会` | サイト表示名 |
| User support email | UBM 運用担当 mail | Console 上で管理（実値非掲載） |
| App logo | UBM ロゴ（任意） | verification 信頼性向上 |
| Application home page | `https://<production-domain>/` | privacy / terms と同一 origin |
| Application privacy policy link | `https://<production-domain>/privacy` | **200 必須** |
| Application terms of service link | `https://<production-domain>/terms` | **200 必須** |
| Authorized domains | `<production-domain>` のルート | privacy / terms / home と一致 |
| Developer contact | UBM 開発 mail | Google からの審査連絡先 |
| Scopes | `openid` / `email` / `profile` | Auth.js Google provider 既定 / **最小権限** |
| Test users（Testing 期間中のみ） | UBM 開発者 + admin_users.active 一部 | verification 完了時は不要 |

## 設計判断

- scope は **最小権限 3 つに固定**。`gmail.send` 等の sensitive scope は申請しない（審査長期化を避ける）
- Authorized domain は **production の root domain のみ**。staging が独立 domain（`*.workers.dev` 等）の場合は staging を production の sub-domain に統一する設計（Phase 5 runbook で確認）
- privacy / terms / home の URL は **必ず 200 を返す** こと（Stage B-1 で `curl -I` 確認）

## verification 申請に必要な情報

| 項目 | 内容 |
| --- | --- |
| Scope justification | `openid email profile` のみ。「会員認証で email / 表示名のみ取得」の旨 |
| App demo video | 任意（最小権限のため通常不要） |
| Privacy policy 詳細説明 | URL 内に「取得項目 / 保管期間 / 第三者提供」を明記 |
| Authorized domain ownership 証明 | Google Search Console の domain 認証 |
| Sensitive scope | **使用しない**（申請対象外） |

## Phase 5 / 11 での参照

- Phase 5 Step B-2 で本仕様の値を Console に反映 → "PUBLISH APP"
- Phase 11 Stage B で submission 後の screenshot を `outputs/phase-11/production/consent-screen.png` に保存
