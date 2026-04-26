# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 9 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 8 (DRY 化) |
| 下流 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

無料枠への影響（0 リクエスト想定）と secret hygiene（FORMS_SA_KEY の Cloudflare Secrets 配置）を確定し、a11y は N/A であることを明記する。

## 実行タスク

1. Forms API quota / Workers CPU の試算
2. secret 一覧と配置場所（Cloudflare Secrets / GitHub Secrets / GitHub Variables）
3. .env を生成しないことを明記
4. a11y N/A 明記
5. outputs/phase-09/free-tier-estimate.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | 認証 |
| 必須 | CLAUDE.md | secret 管理 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 10 | GO 根拠 |
| 11 | wrangler secret list 確認（03a/b で実施） |

## 多角的チェック観点（不変条件参照）

- secret 0 露出: `FORMS_SA_KEY` は Cloudflare Secrets 経由のみ
- 無料枠 #10: このタスクは API call 0（モック test のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | quota 試算 | 9 | pending |
| 2 | secret 一覧 | 9 | pending |
| 3 | .env 不在 | 9 | pending |
| 4 | a11y | 9 | pending |
| 5 | outputs | 9 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-09/main.md |
| ドキュメント | outputs/phase-09/free-tier-estimate.md |
| メタ | artifacts.json |

## 完了条件

- [ ] secret 一覧 + 試算 + a11y N/A 完了

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-09/ 2 ファイル
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 10
- 引き継ぎ事項: 試算結果
- ブロック条件: secret 露出

## Forms API 無料枠試算

### Google Forms API

| 項目 | 上限 | このタスク | 余裕 |
| --- | --- | --- | --- |
| forms.get | 6,000 / minute / project | 0（test のみ mock） | 100% |
| forms.responses.list | 6,000 / minute / project | 0 | 100% |

実運用試算（Wave 3 で発生）:
- forms.get: 1 回 / day（schema 監視 cron） = 30 / 月
- forms.responses.list: 1 回 / 5 min（response 同期）= 8,640 / 月
- 上限の 0.001% 程度

### Cloudflare Workers CPU

このタスクは package を作るだけ、Workers ランタイムでの実行 0。

## secret 一覧

| secret | 配置 | 用途 | 取得方法 |
| --- | --- | --- | --- |
| `FORMS_SA_KEY` | Cloudflare Secrets（apps/api binding） | Forms サービスアカウント秘密鍵 | `env.FORMS_SA_KEY` |
| `FORMS_SA_EMAIL` | Cloudflare Secrets | サービスアカウント email | `env.FORMS_SA_EMAIL` |

| 設定値（非機密） | 配置 | 用途 |
| --- | --- | --- |
| `formId` | `wrangler.toml` `[vars]` | フォーム ID（公開情報） |

## .env 不在

- リポジトリに `.env` 生成しない
- ローカル開発用の secret は `.dev.vars`（gitignore 済み）に配置、1Password から手動取得

## a11y

このタスクは TypeScript パッケージ実装のみ、a11y は N/A（後続 06a/b/c のページ実装で必須）。

## secret hygiene チェック

| 項目 | 結果 |
| --- | --- |
| secret 平文の log 出力 | 禁止（test mock では `***` で置換） |
| secret を error message に含める | 禁止 |
| secret を type definition に書く | 禁止（all `string` で受ける） |
| `.env` 生成 | NO |
| 1Password Environments で正本管理 | YES |
