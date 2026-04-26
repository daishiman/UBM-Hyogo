# Phase 2: 設計 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## 設計成果物一覧

| 成果物 | パス | 説明 |
| --- | --- | --- |
| runtime-topology.md | outputs/phase-02/runtime-topology.md | apps/web / apps/api / packages の構成図と責務境界 |
| version-policy.md | outputs/phase-02/version-policy.md | runtime version policy（唯一の version ledger） |

## 構成図（テキスト表現）

```
Cloudflare Workers
  ├── ubm-hyogo-web（@opennextjs/cloudflare + Next.js 16）
  │     ├── SSR / RSC
  │     ├── Static Assets → Cloudflare Pages CDN（静的アセット配信）
  │     └── Auth.js 5.x（Google OAuth / Magic Link）
  └── ubm-hyogo-api（Hono 4.12.x）
        ├── REST API
        └── D1 binding（唯一のアクセス窓口）

packages/
  ├── shared/
  │     ├── core/（依存ゼロ・エンティティ・インターフェース）
  │     ├── src/types/（依存ゼロ・型定義・Zodスキーマ）
  │     ├── src/services/（ドメインロジック・types/ のみ依存）
  │     ├── infrastructure/（DB・外部サービス・core/ + types/ 依存）
  │     └── ui/（UIコンポーネント・core/ 依存）
  └── integrations/（外部API連携・core/ のみ依存・integrations間相互依存禁止）

ブランチ戦略: feature/* → dev（staging）→ main（production）
```

## 環境変数設計

| 区分 | 代表値 | 配置先 | 根拠 |
| --- | --- | --- | --- |
| runtime secret | AUTH_SECRET / AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET | Cloudflare Secrets | Workers が直接利用 |
| deploy secret | CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID | GitHub Secrets | CI/CD（wrangler deploy）専用 |
| local 正本 | 上記すべて | 1Password Environments | 平文 .env をリポジトリに含めない |
| public variable | NEXT_PUBLIC_APP_URL | GitHub Variables / wrangler.toml[vars] | 非機密 |

注記: Auth.js v5 では環境変数プレフィックスが `NEXTAUTH_*` → `AUTH_*` に変更済み。`AUTH_SECRET`（ランダム64文字以上）を必ず Cloudflare Secrets に設定する。

## 設定値表（upstream に渡す唯一の ledger）

詳細は `outputs/phase-02/version-policy.md` を参照。

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | runtime-topology.md と version-policy.md により、実装者の版数・境界の判断コストをゼロにする |
| 実現性 | PASS | Workers 無料枠 3MB 制限 + pnpm 10.x + Next.js 16.x の組み合わせで成立（バンドルサイズ確認は Phase 5 で記録） |
| 整合性 | PASS | feature→dev→main, @opennextjs/cloudflare 採用, AUTH_* 環境変数が一致 |
| 運用性 | PASS | foundation-bootstrap-runbook.md（Phase 5）に rollback 手順を記録予定。03/04/05b への handoff 明記済み |

## downstream handoff

| 下流 Phase / task | 参照するもの |
| --- | --- |
| Phase 3 | 本 Phase の runtime-topology.md・version-policy.md をレビュー入力として使用 |
| Phase 5 | foundation-bootstrap-runbook.md 作成の参照 |
| Phase 7 | AC-1〜5 のトレース根拠 |
| Phase 10 | AC-2 SPEC-PASS_WITH_SYNC の根拠として version-policy.md を使用 |
| Phase 12 | TypeScript 6.x 正本同期の根拠 |
| 03-serial-data-source-and-storage-contract | apps/api が D1 を保持する設計根拠 |
| 04-serial-cicd-secrets-and-environment-sync | secret placement matrix の参照 |
| 05b-parallel-smoke-readiness-and-handoff | runtime-topology.md・bootstrap-runbook の参照 |

## 完了条件チェック

- [x] 主成果物が作成済み（runtime-topology.md, version-policy.md）
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
