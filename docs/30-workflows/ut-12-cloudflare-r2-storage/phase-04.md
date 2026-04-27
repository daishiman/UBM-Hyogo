# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-27 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 5 のセットアップ実行前に、上流タスク（01b / 04）の成果物・Cloudflare アカウント状態・既存 wrangler.toml の状態・API Token のスコープ・ロールバック手順を事前検証し、実行時の失敗リスクと既存バインディングへの干渉を排除する。Phase 5 へ進めるためのゲート条件を確定し、検証ログの記録形式を決める。

## 参照資料（前提成果物 / 前 Phase の成果物）

- `outputs/phase-03/design-review.md` - 4条件評価・採用設計
- `outputs/phase-03/review-decision.md` - Phase 4 進行可否（GO / NO-GO / RETURN）
- `outputs/phase-02/r2-architecture-design.md` - バケット命名・アクセス方針
- `outputs/phase-02/wrangler-toml-diff.md` - 追記差分サンプル
- `outputs/phase-02/token-scope-decision.md` - Token 判断
- `outputs/phase-02/cors-policy-design.md` - CORS JSON 設計
- 上流: `docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md`
- 上流: `docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md`

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/precheck-runbook.md | 事前検証 runbook（手順とコマンド） |
| ドキュメント | outputs/phase-04/precheck-checklist.md | チェックリスト形式の検証項目（PASS/FAIL 記録） |
| ドキュメント | outputs/phase-04/rollback-procedure.md | Phase 5 失敗時のロールバック手順 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 4 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス形式）

### ステップ 1: 上流タスク成果物の確認

- [ ] `01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md` に R2:Edit が追加可能なエントリがあることを確認
- [ ] `01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md` に Account ID 取得経路が記載済みであることを確認
- [ ] `04-serial-cicd-secrets-and-environment-sync/index.md` で Secrets/Variables 登録経路が確立済みであることを確認
- [ ] 上流成果物に未確定項目（TBD）が残っている場合は GO 判定を保留する

### ステップ 2: Cloudflare アカウント・Token スコープ確認

- [ ] `wrangler whoami` でログイン中のアカウントが運用アカウントであることを確認
- [ ] Cloudflare Dashboard の API Tokens 画面で既存 Token のスコープを確認（R2:Read / R2:Edit の有無）
- [ ] Phase 2 採用案（専用 Token 新規作成）に従う場合、新規 Token 作成権限があることを確認
- [ ] Account ID を実値で記録しないこと（環境変数 / Secrets 参照のみ記載）

### ステップ 3: 既存 wrangler.toml 状態確認

- [ ] `apps/api/wrangler.toml` の現状を取得し、既存バインディング（D1 / KV / Secrets）一覧を記録
- [ ] `[[r2_buckets]]` セクションが既存しないこと（または既存する場合は本タスクの差分と衝突しないこと）を確認
- [ ] `[env.production]` / `[env.staging]` セクションの構造が phase-02 wrangler-toml-diff.md と整合することを確認
- [ ] `apps/web/wrangler.toml` に `[[r2_buckets]]` が追加されていないこと（不変条件 5）を確認

### ステップ 4: R2 操作前提条件の確認

- [ ] `wrangler --version` が R2 対応バージョン（3.x 以上）であることを確認
- [ ] `wrangler r2 bucket list` が実行可能でアクセス権限エラーが出ないことを確認
- [ ] バケット命名規則 `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` が既存バケットと衝突しないことを確認
- [ ] CORS 適用に必要な `wrangler r2 bucket cors put` または Dashboard 経路が利用可能であることを確認

### ステップ 5: ロールバック手順の事前確認

- [ ] バケット作成のロールバック手順（`wrangler r2 bucket delete`）を確認
- [ ] wrangler.toml 追記のロールバック手順（git revert / 該当セクション削除）を確認
- [ ] CORS 設定のロールバック手順（空 JSON 適用 / Dashboard 削除）を確認
- [ ] Token 追加のロールバック手順（Dashboard で Token 削除 / Secrets 削除）を確認
- [ ] ロールバック実行責任者（Phase 5 実行者）を明記

### ステップ 6: 検証ログ記録形式の確定

- [ ] precheck-checklist.md に各チェック項目の PASS/FAIL 記録欄を設ける
- [ ] FAIL 項目には原因 / 対応 / 再検証日時を記録する形式を定める
- [ ] 機密値（Account ID / Token 値）は記録対象から除外する旨を明記

## 完了条件（受入条件 + AC-X との紐付け）

- [ ] 上流タスク成果物の確認が完了し、ブロッカーがないこと（AC-1 / AC-3 の前提）
- [ ] Cloudflare アカウント・Token スコープが事前確認済みであること（AC-3 の前提）
- [ ] 既存 wrangler.toml への干渉リスクが評価済みであること（AC-2 の前提）
- [ ] バケット命名衝突が無いことを確認済みであること（AC-1 の前提）
- [ ] ロールバック手順が文書化済みであること（運用性要件）
- [ ] precheck-checklist.md の検証ログ形式が確定していること
- [ ] 全項目 PASS でない場合、Phase 5 進行をブロックする判断フローが記録されていること

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | precheck-checklist.md の PASS 結果をセットアップ実行の開始条件にする |
| Phase 6 | rollback-procedure.md を異常系検証の入力にする |
| Phase 11 | smoke test 前提条件の確認経路として利用する |

## レビューポイント / リスク / 落とし穴

- 上流タスク（01b / 04）が未完了の場合、本 Phase は NO-GO とし、ブロッカー解消まで保留する
- 既存 Token を編集する案を採用した場合、Phase 4 完了前に Token rotation スケジュールを確認する（運用中タスクへの影響回避）
- `apps/web/wrangler.toml` に R2 バインディングが誤って入っていないか必ず再確認する（不変条件 5）
- 検証ログに Account ID / Token 値の実値を書かないこと
- ロールバック手順を「実際に試す」ことは Phase 6（異常系検証）で行う。Phase 4 では手順の存在のみ確認する
- staging バケット名と production バケット名を取り違えると Phase 5 で復旧コストが大きい

## precheck-checklist.md テンプレート（参考）

| # | カテゴリ | チェック項目 | 期待結果 | 状態 | 記録 |
| --- | --- | --- | --- | --- | --- |
| 1 | 上流 | 01b token-scope-matrix.md に R2:Edit 追加可能エントリあり | YES | TBD | - |
| 2 | 上流 | 01b cloudflare-bootstrap-runbook.md に Account ID 取得経路あり | YES | TBD | - |
| 3 | 上流 | 04 secrets-and-environment-sync の Secrets 登録経路確立 | YES | TBD | - |
| 4 | アカウント | `wrangler whoami` で運用アカウントが表示される | YES | TBD | - |
| 5 | アカウント | 既存 API Token のスコープ確認（R2:Edit 有無） | 記録のみ | TBD | - |
| 6 | アカウント | 新規 Token 作成権限あり（採用案: 専用 Token） | YES | TBD | - |
| 7 | wrangler.toml | `apps/api/wrangler.toml` に既存 `[[r2_buckets]]` がない | YES | TBD | - |
| 8 | wrangler.toml | `apps/web/wrangler.toml` に R2 設定がない（不変条件 5） | YES | TBD | - |
| 9 | wrangler | `wrangler --version` が 3.x 以上 | YES | TBD | - |
| 10 | wrangler | `wrangler r2 bucket list` が権限エラーなく実行可能 | YES | TBD | - |
| 11 | 命名 | `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` が既存バケットと衝突しない | YES | TBD | - |
| 12 | rollback | バケット削除手順を確認済 | YES | TBD | - |
| 13 | rollback | wrangler.toml revert 手順を確認済 | YES | TBD | - |
| 14 | rollback | CORS 設定解除手順を確認済 | YES | TBD | - |
| 15 | rollback | Token 削除手順を確認済 | YES | TBD | - |

> 上記テーブルは Phase 4 実行時に precheck-checklist.md として展開する。本 phase 仕様書では雛形のみ示す。

## ゲート判定

| 結果 | 判定 | アクション |
| --- | --- | --- |
| 全項目 PASS | GO | Phase 5 へ進む |
| ステップ 1 で上流未完了 | NO-GO | 上流タスクの完了を待つ |
| ステップ 3 で apps/web 混入発覚 | RETURN | Phase 2 設計差し戻し |
| ステップ 4 で wrangler バージョン不足 | 条件付き GO | wrangler 更新後に再実行 |
| その他 FAIL | RETURN | 該当 Phase（2 または 3）に差し戻す |

## 次フェーズへの引き渡し

- Phase 5 への入力: precheck-runbook.md / precheck-checklist.md（全 PASS 状態）/ rollback-procedure.md
- Phase 5 で実施すべき内容: バケット作成 → wrangler.toml 追記 → Token スコープ追加 → CORS 適用 → smoke test → binding-name-registry.md 作成
- ブロック条件: precheck-checklist.md に FAIL が残っている場合は Phase 5 に進まない
- Phase 12 への申し送り: ロールバック手順は implementation-guide にも転記する
