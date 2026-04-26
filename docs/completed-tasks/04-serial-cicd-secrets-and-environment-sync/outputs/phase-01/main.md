# Phase 1 成果物: 要件定義書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 状態 | completed |

---

## 1. 背景と目的

### 背景

UBM兵庫支部会プロジェクトは Cloudflare Workers (Next.js + Hono) + D1 + Auth.js を組み合わせたモノレポ構成を採用している。
インフラ構築フェーズが進む中で、以下の運用リスクが顕在化してきた。

- **runtime secret と deploy secret が混在したまま**設計が進んでいる。Cloudflare へのデプロイに使う API Token と、アプリが実行時に参照する Google OAuth クレデンシャルは種別・ライフサイクル・ローテーション権限がすべて異なる。これらが同一の置き場（例: GitHub Secrets）に混在すると、rotate 範囲の判断が曖昧になり、インシデント時の revoke 対応が遅延する。
- **web (apps/web) と api (apps/api) のデプロイ経路が単一 workflow に統合**されたまま設計が進む懸念がある。web と api は変更頻度・ビルド手順・依存ファイルが異なり、一方の変更で他方の不要なデプロイが走ることはリードタイムを増大させる。
- **dev / main それぞれの trigger が branch strategy と明示的に紐付けられていない**。`feature/* → dev → main` というブランチ戦略が定義されているにもかかわらず、workflow の trigger を整理した成果物が存在しない。
- **ローカル環境のシークレット正本が定義されていない**。1Password Environments を正本とする方針はあるが、平文 `.env` との関係が明文化されておらず、誤コミットリスクが残る。

### 目的

本タスクは上記4つの混乱を解消し、以下を達成する。

1. runtime secret / deploy secret / public variable の置き場を一意に確定する
2. web と api のデプロイ workflow を分離し、ブランチ戦略と trigger を一致させる
3. ローカル正本を 1Password Environments に固定し、平文 `.env` を正本から外す
4. secret rotation / revoke / rollback の runbook を文書化する

---

## 2. 解決する問題

### 問題 P-1: runtime secret と deploy secret の混在

| 変数名 | 実際の種別 | 混在リスク |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy secret | runtime に漏洩すると全 Cloudflare リソースを操作可能 |
| `GOOGLE_CLIENT_SECRET` | runtime secret | deploy 用 CI に持ち込むと不要な権限拡大 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | runtime secret | 同上 |

deploy secret は CI/CD の実行コンテキストのみで参照されればよく、Workers の runtime から参照される必要はない。
逆に runtime secret は Workers の環境変数として Cloudflare Secrets に持ち、GitHub Actions からは参照しない。
この分離が不明確なまま進むと、rotate 対象を誤る・revoke 漏れが発生するリスクがある。

### 問題 P-2: web / api のデプロイ経路が未分離

`apps/web` は `@opennextjs/cloudflare` によるビルドと Workers へのデプロイを必要とし、
`apps/api` は Hono ベースの Workers を別途デプロイする。
変更ファイルが `apps/web/**` のみであっても `apps/api` のデプロイが走るような設計は、
デプロイ時間の無駄・障害範囲の拡大・無料枠の圧迫につながる。

### 問題 P-3: dev / main trigger の未整理

`feature/* → dev (staging) → main (production)` というブランチ戦略が CLAUDE.md に定義されているが、
workflow の trigger が `push: branches: [main]` のみに集中する、または dev へのマージが CI をスキップするといった構成になると、staging での確認が形骸化する。

### 問題 P-4: ローカル正本の曖昧さ

平文 `.env` は `.gitignore` で除外すれば直接漏洩はしないが、
チームメンバーが独自に `.env` を作成・更新するとローカル環境間で値がドリフトする。
1Password Environments を正本とし、`.env` はそこから生成される一時ファイルと定義することで、ドリフトを防ぎ棚卸しを容易にする。

---

## 3. スコープ

### 含む（in-scope）

| 項目 | 理由 |
| --- | --- |
| secret placement matrix の確定 | AC-1 の直接的な成果物 |
| ci.yml / web-cd / backend-deploy の workflow 設計 | AC-2・AC-4 の直接的な成果物 |
| dev / main 環境差分の定義 | AC-2 の補足 |
| 1Password Environments を正本とするローカル運用定義 | AC-3 の直接的な成果物 |
| secret rotation / revoke / rollback runbook | AC-5 の直接的な成果物 |

### 含まない（out-of-scope）

| 項目 | 理由 |
| --- | --- |
| GitHub Actions workflow ファイルの実装（`.github/workflows/*.yml`） | Phase 4 以降で実施 |
| 実際の Cloudflare Secret の投入 | Phase 5 以降で実施 |
| 通知基盤（Slack 通知等）の常設設定 | 別タスクへ委譲 |
| 本番データ投入・マイグレーション | 別タスクで管理 |
| 実際のトークン値・秘密情報の記録 | いかなる成果物にも記載しない |

---

## 4. 受入条件（AC）詳細説明

### AC-1: runtime secret / deploy secret / public variable の置き場が一意である

**達成基準:**
- `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` は GitHub Secrets にのみ存在し、Cloudflare Secrets には存在しない
- `GOOGLE_CLIENT_SECRET` と `GOOGLE_SERVICE_ACCOUNT_JSON` は Cloudflare Secrets にのみ存在し、GitHub Secrets には存在しない
- `NEXT_PUBLIC_*` 等の公開変数は GitHub Variables または `wrangler.toml` の vars セクションにのみ存在する
- secret placement matrix ドキュメントが作成されており、各変数の置き場・理由が明記されている

**検証方法:** Phase 7（統合テスト）で matrix と実際の Cloudflare/GitHub 設定を照合する

### AC-2: dev / main の trigger が branch strategy と一致している

**達成基準:**
- `dev` ブランチへの push が staging 環境へのデプロイを trigger する
- `main` ブランチへの push が production 環境へのデプロイを trigger する
- `feature/*` ブランチへの push は CI（lint/typecheck/build）のみを実行し、デプロイは行わない
- PR が `dev` へマージされたとき staging deploy が走ることを workflow の設計で保証する

**検証方法:** workflow topology ドキュメントの trigger 定義と .github/workflows の実装を照合する

### AC-3: local canonical は 1Password Environments であり、平文 .env は正本ではない

**達成基準:**
- 1Password Environments 上に dev / main に対応するエントリが存在する（作成手順の runbook がある）
- `.env` は 1Password から生成する一時ファイルと定義され、`.gitignore` で除外されている
- 開発セットアップ手順が「1Password から値を取得する」手順を含んでいる
- `README` 等に「平文 .env を正本として使わない」方針が明記されている

**検証方法:** Phase 6（ローカル開発環境検証）でセットアップ手順を実行し確認する

### AC-4: web と api の deploy path が分離されている

**達成基準:**
- `apps/web/**` への変更のみが web-cd workflow を trigger する（path filter 使用）
- `apps/api/**` への変更のみが backend-deploy workflow を trigger する（path filter 使用）
- 共通ファイル（`packages/**` 等）の変更が両方をトリガーするルールが定義されている
- web と api の workflow が別ファイルに分離されている

**検証方法:** 各 workflow ファイルの `on.push.paths` を確認し、独立デプロイをシミュレーションする

### AC-5: secret rotation / revoke / rollback の runbook がある

**達成基準:**
- 各 secret ごとの rotation 頻度・手順・影響範囲が記載されている
- 漏洩時の revoke 手順（Cloudflare / GitHub 両面）が記載されている
- デプロイ失敗時の rollback 手順が記載されている
- runbook は outputs/phase-03/ または専用 doc に配置されている

**検証方法:** Phase 3（設計レビュー）で runbook の完全性をレビューする

---

## 5. 依存関係

### 上流タスク（本タスクが依存するもの）

| タスク | 依存内容 |
| --- | --- |
| `01-infrastructure-setup` | Cloudflare Workers / D1 のアカウント・プロジェクト設定が存在することを前提とする |
| CLAUDE.md のブランチ戦略定義 | `feature/* → dev → main` の戦略が確定済みであることを前提とする |

### 下流タスク（本タスクの出力を使うもの）

| タスク | 利用内容 |
| --- | --- |
| Phase 4: 事前検証手順 | workflow 設計と secret placement を検証環境で確認する |
| Phase 5: 実装 | `.github/workflows/` への workflow ファイル実装に本設計を使用する |
| Phase 7: 統合テスト | AC トレースと secret placement matrix の照合に使用する |
| Phase 10: リリース判定 | AC-1〜5 のすべてが PASS であることを gate 条件とする |

---

## 6. 4条件評価

| 条件 | 評価観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| **価値性** | 誰のどのコストを下げるか | **PASS** | インシデント発生時の revoke 漏れリスクをゼロにする。dev/main の trigger 整理により staging 確認の形骸化を防ぎ、本番障害率を下げる。開発者が「どこに何を置くか」を迷うコストを排除する。 |
| **実現性** | 無料運用の初回スコープで成立するか | **PASS** | GitHub Actions・Cloudflare Workers・1Password はいずれも既存サービスを利用する。新規サービス契約は不要。workflow ファイルの追加と Cloudflare Secret の設定変更のみで実現できる。 |
| **整合性** | branch / env / runtime / data / secret が矛盾しないか | **PASS** | ブランチ戦略（feature→dev→main）と workflow trigger（dev=staging, main=production）が一致する。runtime secret を Cloudflare に、deploy secret を GitHub に分離することで secret の責務が明確になる。 |
| **運用性** | 運用・rollback・handoff が破綻しないか | **PASS** | rotation / revoke / rollback の runbook を AC-5 で必須要件とする。web と api の deploy 分離により一方の障害が他方に波及しない。1Password を正本とすることでチームメンバー間のドリフトを防ぐ。 |

---

## 7. 次 Phase（設計）への引き継ぎ事項

### 設計で決定が必要な事項

| 項目 | 優先度 | 説明 |
| --- | --- | --- |
| path filter の粒度 | 高 | `packages/**` の変更が web-cd / backend-deploy 両方を trigger すべきか、個別に判断するかを設計で決定する |
| dev 環境の Cloudflare Secrets 管理方法 | 高 | dev 用と main 用で別の Workers プロジェクトを使うか、同一プロジェクトに environment を分けるか |
| `GOOGLE_SERVICE_ACCOUNT_JSON` のサイズ対応 | 中 | JSON 全体を Cloudflare Secret 1エントリに格納するか、キーを分割するかを検討する |
| 1Password Environments の具体的なエントリ構造 | 中 | dev / main の識別方法と、ローカルへの取り出しコマンドを設計する |
| CI（lint/typecheck/build）の失敗時デプロイブロック方法 | 中 | ci.yml の結果を web-cd / backend-deploy の実行条件にする連携を設計する |

### blockers（なし）

現時点でブロッカーはない。上記の決定事項はすべて Phase 2 設計フェーズで解消可能。

### open questions

- `CLOUDFLARE_ACCOUNT_ID` は非機密情報として GitHub Variables に格上げできるか（セキュリティポリシー次第）
- dev 環境の Cloudflare API Token を main とは別にするか（rotate 範囲の分離のために推奨）
