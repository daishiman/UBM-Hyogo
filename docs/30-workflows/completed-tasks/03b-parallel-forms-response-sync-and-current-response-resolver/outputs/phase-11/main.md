# Phase 11: 手動 smoke — サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase | 11 / 13 |
| 実施区分 | 自動テスト + 手動 smoke 証跡テンプレ整備（実 deploy / 実 wrangler 実行は未実施） |
| 実施日 | 2026-04-28 |
| 状態 | completed（証跡準備完了） |

## 結論

- 自動テスト（unit / route / type）はローカルで全て green。AC-1〜AC-10 は `phase-07/ac-matrix.md` に対応する vitest が pass。
- 本タスクは UI を持たないため、Phase 11 で要求される手動 smoke は **curl / wrangler の証跡準備（テンプレ）に留める**。
- 実 deploy / 実 wrangler 実行は本ワークフローの制約により実施しない。staging オペレーションは Wave 9a（staging smoke）または `bash scripts/cf.sh` 経由のリリース手順で別途実施する。
- 本フェーズでは下記 3 ファイルを成果物として揃え、後続オペが値を埋めるだけで Phase 11 完了条件を満たせる状態を整備した。

## 自動テスト結果（local）

| 観点 | コマンド | 結果 |
| --- | --- | --- |
| 型検査 | `mise exec -- pnpm typecheck` | green（Phase 10 で確認済み） |
| 単体 + ルート | `mise exec -- pnpm vitest run` | 43 files / 324 tests / green（Phase 10 で確認済み） |
| AC 充足 | `phase-07/ac-matrix.md` | AC-1〜AC-10 すべて green |

## 手動 smoke が「未実施」である理由

1. 本ワークフローは制約上 **実 deploy / 実 wrangler 実行を禁止**（doc 編集タスクとして分離されている）。
2. ローカルで `wrangler dev` を立ち上げての smoke も、Cloudflare CLI の直接呼び出しを `scripts/cf.sh` ラッパーに集約するプロジェクト規約（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）と、 `op://` 参照の 1Password 注入が必要なため、ドキュメントエージェントの権限スコープ外。
3. したがって本フェーズでは「**実行コマンド・期待出力・証跡欄**」のテンプレを `manual-evidence.md` に整備し、ステージング担当が値を埋める運用に切り替える（次オペレーション手順を後述）。

## 成果物

| パス | 説明 |
| --- | --- |
| `outputs/phase-11/main.md` | 本書（フェーズサマリ） |
| `outputs/phase-11/manual-evidence.md` | curl / wrangler 実行コマンド・期待出力・証跡欄テンプレ |
| `outputs/phase-11/curl-recipes.md` | curl コマンドの即コピペ用レシピ集 |
| `outputs/phase-11/wrangler-checks.md` | wrangler d1 execute による row 確認クエリ集 |

## 次オペレーション手順（ステージング smoke 担当向け）

1. ローカル smoke を行う場合:
   - `mise exec -- pnpm --filter @ubm/api dev` で API を起動
   - `bash scripts/cf.sh d1 migrations apply ubm_hyogo_staging --local` で migration 0005 を local D1 に適用
   - `apps/api/src/jobs/__fixtures__/` の fixture を `forms-list-page1.json` 等に切替（fixture は本タスクのテストで使用済み）
2. ステージング smoke を行う場合:
   - `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`
   - `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
   - `curl-recipes.md` の Recipe 1〜6 を順に実行
   - `wrangler-checks.md` の Check 1〜6 で row を確認
3. `manual-evidence.md` の各セクションに **実コマンド・実 stdout** を貼って evidence を確定
4. evidence が揃ったら artifacts.json の Phase 11 を `completed` に更新（本ワークフロー外の責務）

## 完了条件チェック（本フェーズ実施範囲）

- [x] 自動テストが green であることを Phase 10 から引き継ぎ確認
- [x] 手動 smoke が UI 無し / 実行制約により「証跡テンプレ整備」になる旨を main.md に明記
- [x] `manual-evidence.md` テンプレ整備（curl response / row count / 再回答 / unknown / 409 / cursor / PII redact / 結論欄）
- [x] `curl-recipes.md` / `wrangler-checks.md` 作成
- [ ] 実 staging smoke の値埋め（後続オペ責務）

## Phase 12 への引継ぎ

- `manual-evidence.md` を Phase 12 の `documentation-changelog.md` の手動 smoke 欄に参照リンクとして掲載する。
- staging smoke 実施時の証跡は Wave 9a で `outputs/phase-11/manual-evidence-staging.md` を新規作成して保管する想定。
- production 昇格は 01b 完了（実 `JwtSigner` 注入）後に別タスクで判断（Phase 10 main.md 既知前提）。
