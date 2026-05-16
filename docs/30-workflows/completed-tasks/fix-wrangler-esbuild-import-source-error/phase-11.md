# Phase 11: 手動テスト

## 11.1 NON_VISUAL 宣言

| 項目 | 内容 |
|------|------|
| タスク種別 | CI/CD インフラ修正（バックエンドビルド設定の bump） |
| 非視覚的理由 | UI/UX 変更を一切伴わない。`apps/web` の routes・コンポーネント・CSS・design tokens いずれにも変更なし |
| 代替証跡 | ローカル deterministic command 結果 + Phase 13 後の GitHub Actions job URL |
| screenshot 取得 | しない（`screenshots/.gitkeep` も作成しない） |

[WEEKGRD-03] に従い、本宣言を `outputs/phase-11/main.md` 冒頭でも明記する。UI/UX 変更なしのため screenshot は作成しない。

## 11.2 実施項目

### 11.2.1 ローカル実地確認

| # | 項目 | 期待 | 証跡保存先 |
|---|------|------|----------|
| L-1 | `pnpm install` 後の lockfile 更新 | esbuild 関連 entry が `0.27.3` に揃う | `outputs/phase-11/main.md` / `manual-smoke-log.md` |
| L-2 | local verification commands | 全 exit 0 | `outputs/phase-11/manual-smoke-log.md` |
| L-3 | 旧 override の再現確認 | destructive な一時 revert は実走しない。Phase 4/6 に `not_executed_design_guard` として記録し、PASS 証跡から除外 | `outputs/phase-11/main.md` |

### 11.2.2 CI 上の確認（Phase 13 PR 作成後）

| # | 項目 | 期待 |
|---|------|------|
| C-1 | `web-cd / deploy-staging` job が green | 全 step exit 0 |
| C-2 | `backend-ci / deploy-staging` job が green | 全 step exit 0 |
| C-3 | `runtime-smoke-staging` workflow が staging 環境で green | smoke 規定の全 endpoint 200 |

## 11.3 source-level PASS と環境ブロッカーの分離

[WEEKGRD-01] に従い、以下を別カテゴリで記録する:

| カテゴリ | 例 |
|---------|-----|
| source-level PASS | install / dependency resolution / esbuild version / shell syntax / web build / api dry-run / artifacts parity のローカル exit 0 |
| 環境ブロッカー | 1Password 未認証 / CLOUDFLARE_API_TOKEN 未設定 / mise install 未実行 等 |

## 11.4 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-11/main.md` | Phase 11 evidence index + NON_VISUAL 宣言 + runtime_pending 境界 |
| `outputs/phase-11/manual-smoke-log.md` | ローカル command 実行ログ要約 |
| `outputs/phase-11/link-checklist.md` | 参照ファイル / 正本リンク確認 |

## 11.5 Phase 11 evidence メタ情報必須項目

[Feedback 4] 対応:
- 証跡の主ソース: local deterministic commands（install / dependency resolution / esbuild version / shell syntax / web build / api dry-run / artifacts parity）
- スクリーンショットを作らない理由: UI/UX 変更ゼロ（11.1 参照）
- 代替手段の有効性: build / dry-run / runtime smoke の 3 層で機能不変を担保

## 11.6 DoD

- 11.4 の 3 ファイルがすべて存在。
- C-1〜C-3 は Phase 13 PR 後の `runtime_pending` evidence としてリンク収集する。Phase 11 はローカル deterministic evidence と user-gated 境界の記録で完了する。
