# Phase 3: アーキテクチャ・影響範囲分析

## 3.1 削除対象の系統的位置づけ

```
GitHub Repository: daishiman/UBM-Hyogo
└── Actions Configuration
    ├── Secrets (機密)
    │   ├── CLOUDFLARE_API_TOKEN (使用中)
    │   └── ...
    └── Variables (非機密)
        ├── CLOUDFLARE_ACCOUNT_ID    ← 使用中（apps/{api,web}/wrangler.toml deploy）
        ├── CLOUDFLARE_PAGES_PROJECT ← ★削除対象 (dormant)
        ├── FORM_ID                   ← 使用中（Google Forms 統合）
        └── SHEET_ID                  ← 使用中（Google Sheets 統合）
```

スコープ: repository-level Variable のみ。Environment scope (`staging`/`production`) には同名変数が存在しないことを Phase 7 Step 1 で再確認。

## 3.2 削除前後の system state diff

| 観点 | 削除前 | 削除後 |
| --- | --- | --- |
| `gh api .../actions/variables` total_count | 4 | 3 |
| `CLOUDFLARE_PAGES_PROJECT` への GET | 200 OK | 404 Not Found |
| `.github/workflows/web-cd.yml` の動作 | 影響なし（既に参照を撤去済） | 影響なし |
| `apps/web` 本番デプロイ | 成功 | 成功（無関係） |
| dormant variable 数 | 1 | 0（baseline 達成） |

## 3.3 影響しないもの（明示的に除外）

- Cloudflare Pages project `ubm-hyogo-web` 本体（Cloudflare 側リソース）→ `issue-331-followup-002` 別タスク
- Cloudflare DNS / route 設定 → 無関係
- `apps/web` の Workers deploy bundle → 無関係（Workers deploy は `wrangler.toml` の `name` を使用、本 variable と無関係）
- `CLOUDFLARE_ACCOUNT_ID` などの他 variable → 無関係

## 3.4 アーキテクチャ判断ログ

| 判断 | 採用 | 不採用 | 理由 |
| --- | --- | --- | --- |
| 削除手段 | `gh api -X DELETE` (REST API direct) | `gh variable delete` CLI | `gh` CLI に `variable` サブコマンドが未実装（本環境の `gh` バージョン）。REST API 直叩きが確実 |
| evidence 形式 | JSON (raw API response) | 整形済み Markdown | 機械的検証可能性 / 改ざん耐性のため raw を保存 |
| 旧 spec 処理 | superseded marker 追記 | 物理削除 | history 保全。markdown の冒頭に `> [SUPERSEDED]` block を追記 |
| Issue state | CLOSED のまま | reopen | ユーザー明示指示 |

## 3.5 セキュリティ影響

- Variable value (`ubm-hyogo-web`) は **非機密**（Pages project 名はパブリック URL 由来）であり、evidence JSON にそのまま記録しても情報漏洩リスクなし
- 削除操作は監査ログに記録される（GitHub Audit log）→ Phase 10 で監視ガイド記述
