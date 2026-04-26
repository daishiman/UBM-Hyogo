# Phase 8: 設定 DRY 化 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## DRY 化成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| dependency-boundary-rules.md | outputs/phase-08/dependency-boundary-rules.md | apps/web / apps/api / packages の dependency rule 一意説明 |

## Before / After 比較

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| branch 記法 | develop 混在の可能性 | dev へ統一 | branch strategy 優先（feature→dev→main） |
| runtime adapter | @cloudflare/next-on-pages（廃止予定） | @opennextjs/cloudflare（Workers 上で Next.js） | adapter 廃止対応 |
| data ownership | Sheets / D1 混線の可能性 | Sheets input / D1 canonical として分離 | source-of-truth 一意化 |
| Node バージョン | 不明または 22.x | Node 24.x（LTS Krypton） | 最新 LTS / Next.js 16 要件 |
| pnpm バージョン | pnpm 9.x（EOL） | pnpm 10.x | 2026-04-30 EOL 対応 |
| Next.js バージョン | 15.x | Next.js 16.x | @opennextjs/cloudflare 推奨 |
| Auth.js secret prefix | NEXTAUTH_SECRET / NEXTAUTH_URL | AUTH_SECRET / AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET | Auth.js v5 移行対応 |
| TypeScript バージョン | 5.x（正本仕様は 5.7.x） | 6.x（6.0.3 以上） | v7.0 はベータのため 6.x を採用（Phase 12 で同期） |

## 共通化パターン

| 対象 | 共通化内容 |
| --- | --- |
| branch / env | feature→dev→main の記法を全 phase で統一 |
| secret placement | runtime secret → Cloudflare Secrets, deploy secret → GitHub Secrets を全 phase で統一 |
| outputs 配置ルール | outputs/phase-XX/main.md + 主成果物のパターンを全 phase で統一 |
| 4条件記法 | 価値性 / 実現性 / 整合性 / 運用性 の4条件を全 phase で統一 |
| 環境変数プレフィックス | AUTH_*（Auth.js v5 仕様）を全 phase で統一 |

## 削除対象（legacy assumption）

| 削除対象 | 理由 |
| --- | --- |
| `@cloudflare/next-on-pages` 参照 | 廃止予定。全 phase で @opennextjs/cloudflare に置換済み |
| `develop` ブランチ記法 | dev への統一。phase-01〜08 で確認済み |
| `NEXTAUTH_*` 環境変数 | AUTH_* に統一。phase-01〜08 で確認済み |
| `pnpm 9.x` 記述 | EOL（2026-04-30）。pnpm 10.x に統一 |
| `Node 22.x` 記述 | Node 24.x LTS に統一 |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 全 phase の表記を DRY 化することで、実装者の判断ミスを防ぐ |
| 実現性 | PASS | ドキュメント更新と runtime foundation skeleton の実装で完結 |
| 整合性 | PASS | before/after 比較で全 phase の表記が一致していることを確認 |
| 運用性 | PASS | dependency-boundary-rules.md により AC-3 を PASS 状態にする |

## Phase 8 → Phase 9 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| dependency-boundary-rules.md | AC-3 の根拠として Phase 9 / 10 で使用 |
| DRY 化完了 | 全 phase で表記が統一された状態 |
| Phase 12 同期対象 | TypeScript 6.x, @opennextjs/cloudflare の正本仕様同期（引き続き必須） |

## 完了条件チェック

- [x] 主成果物が作成済み（dependency-boundary-rules.md）
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
