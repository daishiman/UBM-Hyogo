# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |

## 目的

Phase 2 設計と Phase 4 テスト戦略を、人手でも AI でも再現可能な手順書に落とし込む。Google Cloud Console での Service Account 作成、`bash scripts/cf.sh` 経由での Cloudflare Secrets 配置、`packages/integrations/google/src/sheets/auth.ts` の実装ステップ、`.dev.vars` / `.gitignore` 設定までを順序付きで記述。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-05/implementation-runbook.md | 12 ステップの手順書 |

## 完了条件

- [ ] 12 ステップが順序付き番号で記述
- [ ] `wrangler` 直接実行コマンドが含まれない（`bash scripts/cf.sh` のみ）
- [ ] 1Password 参照（`op://`）形式で secret を `.env` に記述
- [ ] 各ステップに「検証方法」が併記される
- [ ] AC-3 / AC-4 / AC-5 / AC-10 を runbook で被覆

## 次 Phase への引き渡し

- Phase 6: 各ステップの異常系（手順失敗時のリカバリ）を派生
- Phase 11: ステップ 11（疎通確認）の curl コマンドを smoke として再実行
