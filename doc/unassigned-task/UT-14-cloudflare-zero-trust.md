# UT-14: Cloudflare Zero Trust 認証設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-14 |
| タスク名 | Cloudflare Zero Trust 認証設定 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2+ |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-03) |

## 目的

管理画面（`/admin` 等）に対する SSO アクセス制御を Cloudflare Zero Trust（旧 Cloudflare Access）で実装する。開発チームメンバーのみがアクセスできるよう Identity Provider（Google Workspace または GitHub）連携を設定し、認証なしでの管理画面露出リスクを排除する。

## スコープ

### 含む
- Cloudflare Access Application の作成（管理画面パスの保護）
- Identity Provider（IdP）連携設定（Google Workspace または GitHub OAuth）
- アクセスポリシー定義（許可するユーザー/グループの設定）
- Zero Trust ネットワーク経由でのアクセス動作確認
- WARP クライアント設定方針（開発者端末向け）

### 含まない
- エンドユーザー向けの認証（→ アプリケーション層の認証機能で対応）
- ネットワークレベルのアクセス制御（デバイス証明書等）
- Zero Trust の DNS フィルタリング（→ 別途検討）
- mTLS 設定（→ 別途高度なセキュリティタスクで対応）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・Pages 設定の確定が前提 |
| 上流 | UT-15 (カスタムドメイン設定) | Access Application はドメインに紐付くため、カスタムドメイン確定後に最終化 |
| 上流 | 管理画面実装タスク（将来） | 保護対象のパス（/admin 等）が確定している必要がある |
| 連携 | doc/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap | IdP として Google Workspace を使う場合、GSuite ディレクトリが設定済みであること |

## 着手タイミング

> **着手前提**: 管理画面が実装され、保護対象パスが確定した段階で着手すること。カスタムドメイン設定（UT-15）も完了していることが望ましい。

| 条件 | 理由 |
| --- | --- |
| 管理画面実装完了 | 保護対象パスが確定していないと Access Application の設定が宙に浮く |
| カスタムドメイン確定（推奨） | `.pages.dev` ドメインと独自ドメインで設定を二重管理しないため |

## 苦戦箇所・知見

**1. Zero Trust の無料枠制限（50ユーザーまで）**
Cloudflare Zero Trust の無料プランはユーザー数 50人まで。開発初期は問題ないが、チーム規模拡大時に有料移行が必要になる。Free → Team の移行は設定を引き継げるが、コスト試算を事前に行っておくことを推奨。

**2. アプリケーション URL とパスのマッチング**
Access Application の設定で保護するパスを指定する際、`https://admin.example.com/*` のようなサブドメイン方式と `https://example.com/admin/*` のようなパス方式で設定方法が異なる。Pages/Workers のルーティング設計と整合させる必要がある。

**3. Bypass ルールの設計**
ヘルスチェックエンドポイントや Webhook 受信エンドポイントは Zero Trust をバイパスさせる必要がある。設定ミスで CI/CD の自動デプロイや外部サービスの Webhook が認証でブロックされるケースがあるため、バイパス対象を事前にリストアップすること。

**4. セッションの有効期限設定**
Cloudflare Access のセッション有効期限のデフォルトは24時間。管理画面の操作は機密性が高いため、8時間程度に短縮することを推奨。有効期限切れ後の再認証フローが UX に影響するため、開発チームと合意しておく。

## 実行概要

- Cloudflare Zero Trust ダッシュボードで Team ドメインを設定（`ubm-hyogo.cloudflareaccess.com` 等）
- Identity Provider として Google Workspace または GitHub を連携
- Access Application を作成し、管理画面パスを保護対象に設定
- アクセスポリシーで許可するメールアドレス/グループを定義
- 動作確認（許可ユーザーのアクセス成功・未許可ユーザーのブロック確認）

## 完了条件

- [ ] Zero Trust Team ドメインが設定済み
- [ ] Identity Provider（Google/GitHub）連携が完了
- [ ] 管理画面パスへの Access Application が作成済み
- [ ] アクセスポリシーが設定済み（許可するユーザー/グループが定義済み）
- [ ] 許可ユーザーのアクセス成功・未許可ユーザーのブロックが動作確認済み
- [ ] Bypass ルール（ヘルスチェック等）が設定済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Cloudflare サービス構成の把握 |
| 必須 | UT-15（カスタムドメイン設定） | 保護対象ドメインの確定 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare サービス設定方針 |
