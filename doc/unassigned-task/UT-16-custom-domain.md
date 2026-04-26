# UT-16: カスタムドメイン設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-16 |
| タスク名 | カスタムドメイン設定 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-05) |

## 目的

`ubm-hyogo-web.pages.dev` から独自ドメインへの移行を完了し、Cloudflare Pages と Workers にカスタムドメインを紐付ける。URL を本番環境で確定させることで、後続タスク（Zero Trust 設定・WAF 設定・外部サービス連携）が正しいドメインを参照できる状態を作る。

## スコープ

### 含む
- ドメイン取得（取得先レジストラの選定と購入）
- Cloudflare にドメインを移管またはネームサーバー設定
- Cloudflare Pages へのカスタムドメイン設定
- Cloudflare Workers へのカスタムルート設定（`api.example.com/*` 等）
- SSL/TLS 証明書の自動発行確認
- DNS レコード設定（A / CNAME / MX 等）

### 含まない
- メールドメイン設定（MX レコード等）は別途 01c タスクで対応
- サブドメインの詳細ルーティング（→ アプリケーション実装タスクで対応）
- CDN キャッシュ設定の最適化（→ パフォーマンスチューニングタスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | Pages/Workers の本番環境が稼働済みであること |
| 上流 | ドメイン取得（事前準備） | ドメインが取得済みでなければ設定不可 |
| 下流 | UT-13 (Zero Trust 認証設定) | アクセス制御はドメイン確定後に設定 |
| 下流 | UT-14 (WAF / Rate Limiting) | WAF はドメインが Cloudflare ゾーン管理下にある必要がある |
| 下流 | 全外部サービス連携 | Webhook URL・OAuth リダイレクト URL 等でドメインを参照する |

## 着手タイミング

> **着手前提**: ドメインが取得済みであること。M-02（URL 最終確定）が確定し次第、早期着手を推奨する。

| 条件 | 理由 |
| --- | --- |
| ドメイン取得完了 | ドメインなしでは設定不可 |
| 01b タスク完了 | Pages/Workers が稼働済みでないと紐付け先がない |
| URL 確定（M-02） | ドメイン名・サブドメイン構成が確定していること |

## 苦戦箇所・知見

**1. DNS 伝播の待機時間**
DNS の変更は即座に反映されず、通常24〜72時間の伝播時間が必要（TTL を下げておくと短縮可能）。ドメイン移管の場合はさらに長くなることがある。着手後すぐに動作確認できない点を計画に織り込むこと。Cloudflare への移管であれば伝播は比較的高速（数分〜数時間）。

**2. Pages と Workers のドメイン設定の独立性**
Cloudflare Pages と Workers はそれぞれ独立してカスタムドメインを設定する必要がある。Pages に `ubm-hyogo.example.com` を設定し、Workers に `api.ubm-hyogo.example.com` を設定するなど、サブドメインによる分離を設計しておく。Pages ↔ Workers のルーティングが重複しないよう注意。

**3. SSL 証明書の自動発行失敗**
Cloudflare のユニバーサル SSL は通常自動発行されるが、CAA レコードの設定ミスや既存証明書との競合で発行が失敗するケースがある。発行失敗時は Cloudflare Dashboard のエラーログを確認し、CAA レコードに `letsencrypt.org` / `digicert.com` が含まれていることを確認する。

**4. Workers のルーティング設定**
Workers のカスタムルートは `wrangler.toml` の `routes` セクションまたは Cloudflare Dashboard で設定する。`api.example.com/*` のように設定する場合、パターンの優先順位に注意が必要（より具体的なパターンが優先される）。設定後は CI/CD デプロイパイプラインとの整合も確認すること。

**5. リダイレクト設定の考慮**
`www.example.com` → `example.com`、`http://` → `https://` のリダイレクトを Cloudflare ページルールで設定する必要がある。設定漏れによる重複コンテンツ（SEO 問題）やセキュリティリスクを防ぐため、リダイレクト設定を設定リストに含めること。

## 実行概要

- ドメインレジストラでのドメイン取得（または既存ドメインの確認）
- Cloudflare にドメインを追加し、ネームサーバーをレジストラ側で変更
- Cloudflare Pages のカスタムドメイン設定（Dashboard > Pages > Custom Domains）
- Cloudflare Workers のカスタムルート設定（`wrangler.toml` の `routes` 更新）
- SSL/TLS 証明書の自動発行確認（通常15分以内）
- DNS レコードの確認・追加（必要な場合）
- www リダイレクト・HTTPS 強制の設定

## 完了条件

- [ ] ドメインが取得済みで Cloudflare ゾーン管理下にある
- [ ] Cloudflare Pages にカスタムドメインが設定済みでアクセス可能
- [ ] Cloudflare Workers のカスタムルートが設定済みで API アクセス可能
- [ ] SSL/TLS 証明書が有効（HTTPS アクセスが正常）
- [ ] www リダイレクト・HTTP→HTTPS リダイレクトが動作確認済み
- [ ] カスタムドメイン情報（フルドメイン名）が下流タスク向けにドキュメント化済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Pages/Workers の構成確認 |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | Cloudflare ダッシュボード操作の参考 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare デプロイメント設定方針 |
