# Phase 3: 設計レビュー

## ゲート判定

**PASS — Phase 4 に進行可能**

## 評価観点

| 観点 | 評価 | 根拠 |
|------|------|------|
| 責務境界 | ○ | env accessor（`env.ts`）/ lib 純関数（`security-headers.ts`）/ 配線（`middleware.ts`）が明確に分離されている。`env.ts` は `security-headers.ts` を import しない |
| env アクセス不変条件 | ○ | `process.env.*` 直接参照なし。`getSecurityHeaderEnv()` が `readRawEnv()` 経由で取得（env.ts 内 `readProcessEnv` は infra 層として許容） |
| lib API 不変 | ○ | `security-headers.ts` の `buildSecurityHeaders` / `applySecurityHeaders` / `buildCspDirective` は一切変更しない。既存単体テストが回帰ガードとして継続機能する |
| 安全側デフォルト | ○ | `CSP_MODE` 未設定時は `default("report-only")`。env 未注入環境（ローカル開発・CI）は自動的に安全側動作 |
| 段階導入の妥当性 | ○ | staging=enforce / production=report-only により、実ユーザー影響 0 の状態で enforce 経路を検証できる。production 実切替は ops runbook のみ（コード変更なし） |
| smoke テストの追従正しさ | ○ | `process.env.CSP_MODE` 判定で mode を解決し、active ヘッダの存在 + 反対ヘッダの absent を両方 assert する。ローカル CI は未注入 → report-only で既存挙動維持 |
| `getPublicEnv` import 差し替え | ○ | middleware 内で `getPublicEnv` が他用途未使用ならば完全に `getSecurityHeaderEnv` へ差し替えることで未使用 import を残さない。実装時に使用箇所を確認してから判断する |
| zod parse 失敗の扱い | ○ | throw を握り潰さず `app/error.tsx` に委譲。既存 `getEnv()` パターンと一貫 |
| issue #868 依存の境界 | ○ | `report-to` は #868 スコープであることを明記。本タスクの変更ファイルと #868 の変更ファイル（`buildCspDirective`）は重複しないため並行開発可能 |

## 因果ループ

- **強化ループ**: staging enforce → 違反ゼロ確認 → production enforce 実切替 → セキュリティ強化
- **バランスループ**: env default report-only → 予期しない CSP 違反によるサービス障害リスクを排除

## 残リスクと緩和

| リスク | 緩和 |
|--------|------|
| staging enforce で既存ページの CSP 違反が発生する | staging デプロイ直後に Playwright smoke + 手動確認で検出可能。production は report-only のため影響なし |
| `getPublicEnv` が middleware 内で他用途に使われていた場合、差し替えが不完全になる | 実装時に `grep getPublicEnv middleware.ts` で使用箇所を全件確認してから判断 |
| Playwright テストが `CSP_MODE` 未注入環境で enforce ブランチを実行してしまう | `process.env.CSP_MODE === "enforce"` の厳密等値比較により、未注入（undefined）は report-only に fallback する |

## MINOR 指摘 → 未タスク化方針

以下は本タスクのスコープ外として未タスク候補に挙げる（本 PR では対応しない）:

| 指摘 | 方針 |
|------|------|
| production の enforce 実切替 | ops runbook として別 issue で管理。コード変更なし |
| `report-to` / `Reporting-Endpoints` ディレクティブ追加 | issue #868 スコープ |
| CSP nonce 化（`'unsafe-inline'` 排除） | issue #871 スコープ |
| staging CI パイプラインへの `CSP_MODE=enforce` 注入 | CI workflow 変更を伴うため別 issue で対応 |

## 総合判定

**PASS**。設計は要件を満たし、env アクセス不変条件・lib API 不変・安全側デフォルト・段階導入の全条件が成立している。Phase 4 テスト計画の作成に進む。
