# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 5 で確立したセットアップが想定外の経路（CORS 違反 / 権限不足 Token / 無料枠超過 / バインディング誤設定）でも適切に振る舞うことを検証し、各 failure case の対応手順（mitigation）を確定する。Phase 4 で文書化したロールバック手順を実際に適用できることを確認する。

## 参照資料（前提成果物 / 前 Phase の成果物）

- `outputs/phase-05/r2-setup-runbook.md` - セットアップ runbook
- `outputs/phase-05/wrangler-toml-final.md` - 反映済み wrangler.toml セクション
- `outputs/phase-05/cors-config-applied.json.md` - 適用済み CORS JSON
- `outputs/phase-05/smoke-test-result.md` - smoke test 正常系結果
- `outputs/phase-05/binding-name-registry.md` - バインディング登録情報
- `outputs/phase-04/rollback-procedure.md` - ロールバック手順

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/anomaly-test-cases.md | 異常系テストケース一覧（FC-01〜FC-06） |
| ドキュメント | outputs/phase-06/anomaly-test-result.md | 各ケースの実行結果と mitigation 確認ログ |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 6 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス形式）

### ステップ 1: failure case の網羅リストアップ

- [ ] index.md の苦戦予測ポイント（4 項目）を起点に failure case を抽出する
- [ ] Phase 2 設計 / Phase 3 レビューで挙がった代替案不採用理由から想定リスクを抽出する
- [ ] 下記 6 ケースをデフォルトとし、追加が必要な場合は anomaly-test-cases.md に列挙する

### ステップ 2: FC-01 CORS 違反時の挙動確認

- [ ] 許可外オリジン（例: `https://evil.example.com`）からの fetch を再現する手順を runbook 形式で記録
- [ ] ブラウザ DevTools / curl で `Origin` ヘッダを偽装し PUT 試行を行う
- [ ] レスポンスが CORS エラー（preflight 失敗 / 403 Forbidden）となることを確認
- [ ] mitigation: AllowedOrigins の追加 / 削除手順、UT-16 完了後の更新タイミングを記録

### ステップ 3: FC-02 権限不足 Token での挙動確認

- [ ] R2:Read のみの Token で PUT を試行する想定手順を記録（実トークン作成は staging 限定）
- [ ] エラー応答（403 / `unauthorized`）の内容を記録
- [ ] mitigation: Token スコープ追加手順 / 専用 Token への切替手順を確認

### ステップ 4: FC-03 無料枠超過時の挙動・通知確認

- [ ] Cloudflare R2 Analytics で Storage / Class A / Class B の現在値を確認する手順を記載
- [ ] 閾値到達時の挙動（実超過テストは行わない / 仕様確認のみ）:
  - [ ] Storage 10GB 超過時の課金切替（無料枠の場合は書き込みブロック）仕様を Cloudflare 公式ドキュメントから引用
  - [ ] Class A / B ops 上限到達時の挙動を引用
- [ ] mitigation: UT-17 (Cloudflare Analytics alerts) との連携で 80% 通知が機能するかを確認
- [ ] UT-17 未着手の場合は MINOR 申し送り事項として記録

### ステップ 5: FC-04 バインディング誤設定時のエラー再現

- [ ] `wrangler.toml` の `bucket_name` を意図的に typo した状態で `wrangler deploy --dry-run --env staging` を実行
- [ ] エラーメッセージ（bucket not found / binding mismatch）を記録
- [ ] `binding` 名を apps/api コードから参照不能な値に設定した場合のランタイムエラー例を記録
- [ ] mitigation: binding-name-registry.md を正本として参照する運用ルールを確立

### ステップ 6: FC-05 wrangler.toml apps/web 誤混入の検出

- [ ] `apps/web/wrangler.toml` に `[[r2_buckets]]` が混入していないことを `grep` で確認する手順を記録
- [ ] 混入発覚時の対応: 該当セクション削除 / Pre-commit hook 追加検討
- [ ] mitigation: 不変条件 5（D1/R2 直接アクセスは apps/api に閉じる）の自動チェック方針を Phase 12 申し送り

### ステップ 7: FC-06 ロールバック実行テスト

- [ ] Phase 4 rollback-procedure.md の手順を staging 限定で実際に試行
  - [ ] CORS 設定の空 JSON 適用 → 適用解除確認
  - [ ] wrangler.toml 追記の git revert → diff が空に戻ることを確認
  - [ ] テスト用バケット（`ubm-hyogo-r2-staging-rollback-test`）を別作成 → `wrangler r2 bucket delete` で削除確認
- [ ] production バケットに対するロールバックは「手順存在のみ確認」で実行しない
- [ ] ロールバック所要時間 / 手順上の落とし穴を記録

### ステップ 8: AC-X との対応・申し送り

- [ ] FC-01〜FC-06 と AC-1〜AC-8 の対応表を anomaly-test-result.md に作成
- [ ] 未解決の failure case がある場合は次タスク（UT-16 / UT-17 / ファイルアップロード実装）への申し送り事項として記録

## 完了条件（受入条件 + AC-X との紐付け）

- [ ] FC-01 CORS 違反検証が完了し mitigation が記録されている → AC-5
- [ ] FC-02 権限不足 Token 検証が完了し mitigation が記録されている → AC-3
- [ ] FC-03 無料枠超過の仕様確認と UT-17 連携 TODO が記録されている → AC-6
- [ ] FC-04 バインディング誤設定の検出方法が記録されている → AC-2 / AC-7
- [ ] FC-05 apps/web 混入検出方法が記録されている → 不変条件 5 の防衛
- [ ] FC-06 ロールバック実行テストが staging 限定で完了している → 運用性要件
- [ ] FC × AC 対応表が anomaly-test-result.md に作成されている

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 異常系カバレッジの抜け漏れ判定に検証結果を渡す |
| Phase 10 | 残存リスクと RETURN 条件の判断材料にする |
| Phase 11 | 不許可 origin / Token 失効などの手動 smoke test 期待結果に反映する |

## レビューポイント / リスク / 落とし穴

- 異常系テストでも production バケット / production Token への破壊的操作は禁止する。staging のみで実施する
- 無料枠超過の「実超過テスト」は無料枠を消費するため絶対に行わない。仕様確認のみ
- 権限不足 Token のテスト用に作成した一時 Token はテスト終了後に必ず Dashboard で削除する
- CORS 違反テストで使用する偽装 Origin はリポジトリにコミットしない
- ロールバックテストで誤って正規 staging バケットを削除しないこと（必ず別名のテスト用バケットを使用）
- mitigation 手順が「実行可能な粒度」であることを確認（コマンド / 画面遷移 / 期待結果が含まれる）
- UT-17 未着手の場合、FC-03 の通知系は MINOR 申し送りで許容し、Phase 12 で implementation-guide に転記する

## 次フェーズへの引き渡し

- Phase 7 への入力: anomaly-test-cases.md / anomaly-test-result.md / FC × AC 対応表
- Phase 7 で実施すべき内容: AC-1〜AC-8 の検証項目カバレッジマトリクス作成 / 未カバー項目の補完計画
- ブロック条件: FC-01 / FC-02 / FC-04 / FC-06 のいずれかが mitigation 記録なしで残っている場合は次 Phase に進まない
- Phase 12 への申し送り: ロールバック実行テストで判明した落とし穴は implementation-guide のリスクセクションに反映する
