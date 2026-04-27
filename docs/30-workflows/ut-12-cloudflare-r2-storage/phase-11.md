# Phase 11: 手動 smoke test（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-27 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |
| 実行モード | **NON_VISUAL**（[UBM-002] [UBM-003] 準拠 / スクリーンショット不要） |
| 証跡の主ソース | `outputs/phase-11/manual-smoke-log.md` 内のコマンド出力テキスト |

> **NON_VISUAL である理由**: 本タスクは Cloudflare R2 のバケット設定・wrangler.toml バインディング設定・CORS 設定の docs-only タスクであり、UI コンポーネントの追加・変更は存在しない。検証はすべて CLI コマンド出力（wrangler r2 / curl）と HTTP レスポンスヘッダで完結するため、スクリーンショットの取得は不要かつ false green の温床となる。  
> [Feedback 4] / [Phase 12 苦戦防止 Tips] に従い、`outputs/phase-11/screenshots/` ディレクトリ・`.gitkeep` プレースホルダーは作成しないこと。

## 目的

R2 バケットへのアップロード / ダウンロード / CORS 動作の手動 smoke test 手順を文書化する。NON_VISUAL タスクとして、CLI 出力テキスト + HTTP ヘッダ確認 + AC 証跡パス突合の 3 点で証跡を完結させる。実環境への適用は将来のファイルアップロード実装タスクで実施するが、本 Phase では「再現可能な手順」として確定させる。

## 参照資料（前提成果物）

- Phase 10: review-decision.md（PASS 判定）
- Phase 5: r2-setup-runbook.md / binding-name-registry.md
- Phase 6: 異常系検証ノート（CORS 不許可 origin / Token 失効）
- Phase 8: dry-applied-diff.md

## 成果物（出力一覧 / NON_VISUAL の必須 3 点）

| 種別 | パス | 説明 | 必須 |
| --- | --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 main report（実施概要・所見・PASS / FAIL） | YES |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | 手動 smoke test の実行ログ（コマンド + 出力テキスト） | YES |
| ドキュメント | outputs/phase-11/link-checklist.md | リンク整合チェック（前後 Phase 成果物の参照確認） | YES |
| メタ | artifacts.json | Phase 状態の更新 | YES |

> 上記成果物の実体ファイルは Phase 11 実行時に作成する。本 phase 仕様書では作成しない。  
> **screenshots ディレクトリは作成しない**（NON_VISUAL タスクのため / [UBM-002] [UBM-003]）。

## 実行タスク（チェックボックス）

- [ ] R2 バケットへの小ファイル PUT / GET / DELETE smoke test コマンドを文書化する
- [ ] curl で Origin ヘッダを付与した CORS 動作確認手順を文書化する
- [ ] wrangler r2 bucket cors get / put の確認手順を文書化する
- [ ] 異常系（不許可 origin の CORS 拒否）動作の確認手順を文書化する
- [ ] AC-4（smoke test）の証跡パスを manual-smoke-log.md に固定する
- [ ] link-checklist.md で前後 Phase の参照リンクが全て生きていることを確認する
- [ ] main.md に NON_VISUAL である理由・証跡の主ソース・screenshots 不作成方針を明記する

## 実行手順

### ステップ 1: NON_VISUAL の宣言と証跡方針

- main.md の冒頭に「NON_VISUAL タスク」と明記する
- 証跡の主ソースが manual-smoke-log.md（CLI 出力テキスト）であることを明記する
- screenshots/.gitkeep を作成しない方針を明記（[UBM-002] [UBM-003]）

### ステップ 2: PUT / GET / DELETE smoke test 手順設計

- staging バケットを対象に、小サイズのテストファイル（例: 1KB の `smoke-test.txt`）でアップロード・ダウンロード・削除のコマンド手順を記録する
- production への適用は実装タスク側で実施するため、本 phase は staging 限定の手順として確定する

### ステップ 3: CORS 動作確認手順設計

- curl で `Origin: https://staging.<domain>` を付与した OPTIONS / GET / PUT を発行
- レスポンスヘッダ（`Access-Control-Allow-Origin` / `Access-Control-Allow-Methods`）を検証
- 不許可 origin で CORS 拒否されること（403 / ヘッダ非返却）を確認

### ステップ 4: link-checklist の作成

- 前後 Phase（Phase 5 / 6 / 8 / 10）の成果物パスが全て有効であることを確認
- index.md / artifacts.json の参照と実 outputs ディレクトリの整合を確認

## smoke test コマンド設計【必須】

### PUT / GET / DELETE（staging 限定 / 実行は将来タスク側）

```bash
# 小ファイル PUT（wrangler r2 / staging 限定）
echo "smoke-test-$(date +%s)" > /tmp/smoke-test.txt
wrangler r2 object put ubm-hyogo-r2-staging/smoke-test.txt \
  --file /tmp/smoke-test.txt --env staging

# GET 確認
wrangler r2 object get ubm-hyogo-r2-staging/smoke-test.txt --env staging

# DELETE 確認
wrangler r2 object delete ubm-hyogo-r2-staging/smoke-test.txt --env staging
```

### CORS 動作確認（curl）

```bash
# 許可 origin（staging 想定）
curl -i -X OPTIONS \
  -H "Origin: https://staging.<domain>" \
  -H "Access-Control-Request-Method: PUT" \
  https://<r2-endpoint>/ubm-hyogo-r2-staging/smoke-test.txt
# 期待: HTTP/1.1 200 + Access-Control-Allow-Origin ヘッダ返却

# 不許可 origin（拒否されることの確認）
curl -i -X OPTIONS \
  -H "Origin: https://malicious.example" \
  -H "Access-Control-Request-Method: PUT" \
  https://<r2-endpoint>/ubm-hyogo-r2-staging/smoke-test.txt
# 期待: Access-Control-Allow-Origin ヘッダなし or 403
```

### CORS ルールの確認

```bash
# 現在の CORS ルールを取得して期待 JSON と突合
wrangler r2 bucket cors get ubm-hyogo-r2-staging --env staging
```

## manual-smoke-log.md の構造【必須】

| セクション | 記録内容 |
| --- | --- |
| 実施日時 / 実施者 | docs-only のため「未実施 / 将来実装タスク側で実施」と明記可 |
| 実行コマンド | 本仕様書で確定した CLI コマンドを引用 |
| 期待出力 / 実出力 | 期待出力のみ記録（実出力は実装タスク時に追記） |
| AC-4 証跡 | 本 manual-smoke-log.md 自体が証跡パスとなる旨を記録 |
| NON_VISUAL 宣言 | screenshots 不要 / 証跡は CLI 出力テキスト |

## link-checklist.md の構造【必須】

| 確認項目 | 期待 | 確認方法 |
| --- | --- | --- |
| index.md → phase-11.md | リンク有効 | 目視 |
| phase-11.md → outputs/phase-11/* | 全 3 ファイル存在 | ls |
| Phase 5 / 6 / 8 / 10 → 本 Phase 参照 | 引き継ぎ事項のリンク有効 | grep |
| artifacts.json `phase: 11` | outputs パス整合 | jq |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の smoke コマンドと整合 |
| Phase 6 | 異常系（不許可 origin）の検証根拠 |
| Phase 12 | smoke test 結果（NON_VISUAL の証跡方針）を implementation-guide に反映 |

## 多角的チェック観点

- 価値性: 将来のファイルアップロード実装タスクで本手順をそのまま再利用可能か
- 実現性: NON_VISUAL タスクとして screenshots に頼らず証跡が完結するか
- 整合性: AC-4 / AC-5 の証跡パスが phase-10 の AC 充足判定と一致するか
- 運用性: 不許可 origin / CORS 拒否の挙動が異常系として正しく文書化されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | NON_VISUAL 宣言と証跡方針記録 | 11 | pending |
| 2 | PUT / GET / DELETE 手順設計 | 11 | pending |
| 3 | CORS curl 検証手順設計 | 11 | pending |
| 4 | manual-smoke-log.md 構造化 | 11 | pending |
| 5 | main.md 作成 | 11 | pending |
| 6 | link-checklist.md 作成 | 11 | pending |

## 完了条件（受入条件 + AC 紐付け）

- [ ] main.md / manual-smoke-log.md / link-checklist.md の 3 点が揃っている（NON_VISUAL 必須セット）
- [ ] NON_VISUAL である理由・証跡の主ソースが main.md に明記されている（[Feedback 4]）
- [ ] screenshots ディレクトリ・`.gitkeep` が作成されていない（[UBM-002] [UBM-003]）
- [ ] AC-4（smoke test）の証跡パスが確定（manual-smoke-log.md）
- [ ] AC-5（CORS）の curl 検証手順が確定
- [ ] link-checklist.md で前後 Phase の参照が全て有効

## レビューポイント / リスク / 落とし穴

- screenshots ディレクトリを誤って作ると Phase 12 の compliance check で fail → 作らないことを冒頭に明記
- CORS 検証の curl で `<r2-endpoint>` を実値で書かない（機密情報）→ プレースホルダーで記録
- staging のみで smoke test を確定し、production 適用は実装タスク側にハンドオフ
- AC-4 の証跡が「未実施 / 手順のみ確定」となるため、Phase 12 implementation-guide で実行手順をハンドオフする旨を必須申し送り

## 次フェーズへの引き渡し

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: NON_VISUAL 証跡方針 / smoke test 手順 / link-checklist 結果 / AC-4 / AC-5 の証跡パス
- ブロック条件: 必須 3 点（main.md / manual-smoke-log.md / link-checklist.md）が未作成 / NON_VISUAL 理由未記載の場合は次 Phase に進まない
