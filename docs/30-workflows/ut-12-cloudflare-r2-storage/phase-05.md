# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-27 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 4 で事前検証を通過した状態を前提に、R2 バケット作成・wrangler.toml 追記・API Token スコープ追加・CORS 適用・smoke test までの一連のセットアップ手順を runbook として確定し、実行結果を outputs に記録する。下流タスク（将来のファイルアップロード実装）が参照する binding-name-registry.md を整備する。

## 参照資料（前提成果物 / 前 Phase の成果物）

- `outputs/phase-04/precheck-runbook.md` - 事前検証 runbook
- `outputs/phase-04/precheck-checklist.md` - 全 PASS 状態の検証ログ
- `outputs/phase-04/rollback-procedure.md` - ロールバック手順
- `outputs/phase-02/r2-architecture-design.md` - バケット命名・アクセス方針
- `outputs/phase-02/wrangler-toml-diff.md` - 追記差分
- `outputs/phase-02/token-scope-decision.md` - Token 判断（採用案 = 専用 Token 新規作成）
- `outputs/phase-02/cors-policy-design.md` - CORS JSON 設計

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/r2-setup-runbook.md | バケット作成 → CORS 適用までの実行 runbook |
| ドキュメント | outputs/phase-05/wrangler-toml-final.md | wrangler.toml 反映後の該当セクション抜粋 |
| ドキュメント | outputs/phase-05/cors-config-applied.json.md | 適用済み CORS JSON とその適用ログ |
| ドキュメント | outputs/phase-05/smoke-test-result.md | 小ファイル PUT/GET smoke test の実行結果 |
| ドキュメント | outputs/phase-05/binding-name-registry.md | 下流タスク向けバケット名・バインディング名定義 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 5 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス形式）

### ステップ 1: R2 バケット作成

- [ ] Cloudflare Dashboard 経路 / wrangler CLI 経路の両方を runbook に記載する
- [ ] wrangler CLI 経路（推奨）:
  - [ ] `wrangler r2 bucket create ubm-hyogo-r2-staging` を実行
  - [ ] `wrangler r2 bucket create ubm-hyogo-r2-prod` を実行
  - [ ] `wrangler r2 bucket list` で 2 バケットの作成を確認
- [ ] Dashboard 経路（代替）:
  - [ ] R2 > Overview > Create bucket でリージョン（自動 / Eastern North America Hint 等の選択）と名前を入力
  - [ ] 公開アクセス: 両環境とも「無効」（Phase 2 採用案: プライベート基本）
- [ ] バケット作成日時 / 作成経路 / 実行者を runbook に記録

### ステップ 2: wrangler.toml 追記

- [ ] `apps/api/wrangler.toml` の `[env.staging]` セクションに以下を追記する想定で runbook に記載:

  ```toml
  [[env.staging.r2_buckets]]
  binding = "R2_BUCKET"
  bucket_name = "ubm-hyogo-r2-staging"
  ```

- [ ] `apps/api/wrangler.toml` の `[env.production]` セクションに以下を追記:

  ```toml
  [[env.production.r2_buckets]]
  binding = "R2_BUCKET"
  bucket_name = "ubm-hyogo-r2-prod"
  ```

- [ ] `apps/web/wrangler.toml` には追記しないこと（不変条件 5）を runbook で明示
- [ ] R2 バインディング設置根拠コメントを追記（例: `# R2 binding: file uploads/downloads via apps/api only`）
- [ ] `wrangler deploy --dry-run --env staging` で構文確認（実際のデプロイは別タスク）

### ステップ 3: API Token スコープ追加（採用案: 専用 Token 新規作成）

- [ ] Cloudflare Dashboard > My Profile > API Tokens > Create Token で「Custom token」を作成
- [ ] Permissions: `Account` > `Workers R2 Storage` > `Edit`（最小権限）
- [ ] Account Resources: 当該アカウントのみ
- [ ] Token 値は GitHub Secrets `CLOUDFLARE_R2_TOKEN`（または 04 タスクで定めた命名）に登録（実値はドキュメントに記録しない）
- [ ] Token rotation スケジュール（例: 90 日）を runbook に記載

### ステップ 4: CORS 設定適用

- [ ] Phase 2 設計 `cors-policy-design.md` の JSON を staging バケットに適用:
  - [ ] `wrangler r2 bucket cors put ubm-hyogo-r2-staging --rules <path-to-cors.json>` を実行（または Dashboard 経由）
- [ ] production バケットにも同 JSON 構造で適用（AllowedOrigins は production 値）
- [ ] `wrangler r2 bucket cors get ubm-hyogo-r2-staging` で適用結果を確認
- [ ] 適用済み JSON を `outputs/phase-05/cors-config-applied.json.md` に記録（機密値除外）
- [ ] UT-16 (カスタムドメイン) 完了後の AllowedOrigins 再設定 TODO を申し送り事項として記録

### ステップ 5: smoke test（小ファイル PUT/GET）

- [ ] staging バケットに対し小ファイルをアップロード:
  - [ ] `wrangler r2 object put ubm-hyogo-r2-staging/smoke-test.txt --file ./smoke-test.txt`
- [ ] ダウンロード確認:
  - [ ] `wrangler r2 object get ubm-hyogo-r2-staging/smoke-test.txt --file ./smoke-test-out.txt`
- [ ] 中身一致を確認（`diff smoke-test.txt smoke-test-out.txt` が空）
- [ ] テスト後ファイル削除: `wrangler r2 object delete ubm-hyogo-r2-staging/smoke-test.txt`
- [ ] production バケットに対しても同 smoke test を実施（または staging のみで AC-4 充足とするか Phase 3 で確定した方針に従う）
- [ ] 実行ログ（タイムスタンプ / 結果）を `smoke-test-result.md` に記録

### ステップ 6: binding-name-registry.md 作成（下流タスク向け）

- [ ] 以下を含む下流参照用ドキュメントを作成:
  - [ ] バケット名（環境別）: `ubm-hyogo-r2-staging` / `ubm-hyogo-r2-prod`
  - [ ] Workers バインディング名: `R2_BUCKET`
  - [ ] アクセス可能アプリ: `apps/api` のみ（不変条件 5）
  - [ ] CORS AllowedOrigins（環境別の値が分かる形式 / 実ドメインは UT-16 完了後更新）
  - [ ] Token 識別子（GitHub Secrets キー名のみ。値は記載しない）
  - [ ] パブリック / プライベート方針
- [ ] 下流（ファイルアップロード実装タスク / UT-16 / UT-16）から参照される旨を明記

## 完了条件（受入条件 + AC-X との紐付け）

- [ ] R2 バケット 2 個（production / staging）が命名規則に整合した形で作成されている → AC-1
- [ ] `apps/api/wrangler.toml` の `[env.production]` / `[env.staging]` に `[[r2_buckets]]` バインディングが追記されている → AC-2
- [ ] API Token に R2:Edit スコープが追加（または専用 Token 新規作成）され、最小権限原則の根拠が記録されている → AC-3
- [ ] smoke test（PUT/GET）が成功し結果が記録されている → AC-4
- [ ] CORS 設定 JSON が両バケットに適用され、確認ログが記録されている → AC-5
- [ ] `binding-name-registry.md` が下流タスク向けに作成されている → AC-7
- [ ] パブリック / プライベート選択基準と UT-17 連携 TODO が runbook に記載されている → AC-8
- [ ] 機密値（Account ID / Token 実値）が成果物に含まれていないこと

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | CORS / Token / binding の異常系検証入力として setup 結果を渡す |
| Phase 8 | wrangler.toml と CORS JSON の重複削減対象として渡す |
| Phase 11 | smoke test コマンドと binding-name-registry.md を手動検証入力にする |
| Phase 12 | implementation-guide Part 2 の runbook 根拠にする |

## レビューポイント / リスク / 落とし穴

- バケット名の typo（特に `prod` と `production`、`staging` と `stg`）に注意。Phase 2 採用命名から逸脱しない
- wrangler.toml 追記時、`[[env.production.r2_buckets]]` のように環境スコープ付きテーブル配列を使う（インデント混在エラーに注意）
- 既存 Token に R2:Edit を追加する案 A を採用した場合は、追加直後に Workers の他機能が正常動作するか確認する
- CORS 適用時、AllowedOrigins に `*` を入れないこと（Phase 2 設計違反）
- smoke test の実行ファイルを bucket に残置しないこと（無料枠ストレージ消費 / Class A ops 計上）
- production バケットへ実書き込みを行うことの是非は Phase 3 レビュー結果に従う。MINOR 申し送りで staging のみとした場合は AC-4 の充足条件をその旨で記録
- Token 値・CORS の実 origin 値はリポジトリにコミットしない。`outputs/phase-05/cors-config-applied.json.md` には正規化済み構造のみ記録

## 次フェーズへの引き渡し

- Phase 6 への入力: r2-setup-runbook.md / smoke-test-result.md / cors-config-applied.json.md / wrangler-toml-final.md
- Phase 6 で実施すべき内容: CORS 違反 / Token 権限不足 / 無料枠超過 / バインディング誤設定 / ロールバック実行の異常系検証
- ブロック条件: smoke test FAIL または CORS 適用 FAIL が残っている場合は Phase 6 に進まない
- Phase 12 への申し送り: binding-name-registry.md / r2-setup-runbook.md は implementation-guide からリンクする
