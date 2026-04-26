# UT-12: Cloudflare R2 ストレージ設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-12 |
| タスク名 | Cloudflare R2 ストレージ設定 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2+ |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-01) |

## 目的

ファイルアップロード・画像配信機能のための Cloudflare R2 バケットを設定し、Cloudflare Workers からのバインディングを確立する。無料枠（10GB ストレージ・1,000万読み/月）内で運用できる構成を定義し、後続のファイルアップロード機能実装が迷いなく着手できる状態を作る。

## スコープ

### 含む
- R2 バケット作成（production / staging 分離）
- `wrangler.toml` への R2 バインディング設定追加
- Workers からの R2 アクセス権限設定
- CORS 設定（ブラウザからの直接アップロード対応）
- パブリックアクセス設定方針（パブリック / プライベート の選択）
- 無料枠使用量モニタリング設定方針

### 含まない
- ファイルアップロード機能の実装コード（→ 別途実装タスクで実施）
- CDN/キャッシュ設定（→ 別途タスク）
- 画像リサイズ・変換処理（→ アプリケーション層で対応）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・API Token スコープの確定が前提 |
| 上流 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | R2 バインディング名を CI/CD に登録するため |
| 下流 | ファイルアップロード実装タスク（将来） | R2 バケット名・バインディング名が確定後に実装可能 |

## 着手タイミング

> **着手前提**: `01b-parallel-cloudflare-base-bootstrap` と `04-serial-cicd-secrets-and-environment-sync` が完了し、ファイルアップロード機能の実装が計画に入った段階で着手すること。

| 条件 | 理由 |
| --- | --- |
| アプリにファイルアップロード機能が計画済み | 不要な R2 リソースの作成を避けるため |
| 01b タスク完了 | API Token スコープ（R2:Edit 追加）が確定している必要がある |

## 苦戦箇所・知見

**1. R2 バインディングの wrangler.toml 追記方法**
wrangler.toml に `[[r2_buckets]]` セクションを追加する際、production と staging で異なるバケット名を設定する必要がある。`[env.production]` と `[env.staging]` のセクション分けが必須。01b タスクで確立したトポロジー（`ubm-hyogo-web` / `ubm-hyogo-web-staging`）の命名規則に揃えて `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` とすることを推奨。

**2. API Token への R2:Edit スコープ追加**
01b タスクで作成した API Token は Pages:Edit / Workers:Edit / D1:Edit の3スコープのみ。R2 を追加する場合、既存 Token にスコープを追加するか、R2 専用 Token を新規作成するかを決定する必要がある。最小権限原則から専用 Token を推奨するが、Token 管理コストとのトレードオフがある。

**3. CORS 設定の落とし穴**
ブラウザから R2 に直接アップロード（Presigned URL 方式）を行う場合、R2 バケットの CORS 設定が不足するとアップロードがブロックされる。`AllowedOrigins` に本番・ステージング両ドメインを列挙する必要があり、カスタムドメイン設定（UT-15）完了後に再設定が必要になる可能性がある。

**4. 無料枠の制限**
R2 の無料枠は 10GB ストレージ・1,000万 Class A 操作（書き込み系）/ 1億 Class B 操作（読み取り系）/月。画像配信用途では Class B 操作が急増するリスクがある。モニタリングアラート（UT-16）と連携して無料枠接近時の通知を設定することを推奨。

## 実行概要

- Cloudflare Dashboard から R2 バケットを2つ作成（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`）
- `wrangler.toml` の production/staging 環境それぞれに `[[r2_buckets]]` バインディングを追加
- API Token に R2:Edit スコープを追加（または専用 Token 作成）
- CORS 設定を JSON で定義し R2 バケットに適用
- Workers からの R2 アクセスを動作確認（小ファイルのアップロード/ダウンロードテスト）
- 使用量ダッシュボードの確認方法をドキュメント化

## 完了条件

- [ ] R2 バケットが production / staging で作成済み
- [ ] `wrangler.toml` に正しい R2 バインディングが設定済み
- [ ] Workers から R2 へのファイルアップロード・ダウンロードが動作確認済み
- [ ] CORS 設定が適用済み（ブラウザからのアクセスが機能する）
- [ ] API Token に必要なスコープが追加済み
- [ ] バケット名・バインディング名が下流タスク向けにドキュメント化済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md | API Token スコープ定義 |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | Cloudflare リソース作成手順の参考 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers バインディング設定方針 |
