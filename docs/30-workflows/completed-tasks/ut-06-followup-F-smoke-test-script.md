# UT-06 Follow-up F: smoke test スクリプト化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-F |
| タスク名 | Phase 11 smoke (S-01〜S-10) の CLI スクリプト化 |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 作成日 | 2026-04-27 |
| 種別 | implementation |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-F |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

Phase 11 smoke test (S-01〜S-10) を CLI スクリプトとして自動化し、CI/CD またはオンデマンドで一括実行できるようにする。再現性向上と post-deploy 監視の高速化が目的。

## スコープ

### 含む

- `scripts/smoke-prod.sh` （または `scripts/smoke.sh --env production`）の実装
- S-01〜S-10 の各 case を関数化し、PASS/FAIL を判定
- 結果を `outputs/phase-11/smoke-test-result.md` のテンプレ形式で出力
- CI/CD 統合（post-deploy step として呼び出し）
- 出力 JSON でのアラート連携余地

### 含まない

- Phase 11 のスクリーンショット自動取得（ヘッドレスブラウザ導入は別タスク）
- 性能ベンチマーク
- E2E 全シナリオ（playwright 等は別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06-FU-H（/health/db 実装） | smoke 対象 endpoint の前提 |
| 上流 | UT-06-FU-I（/health 期待値同期） | smoke 期待値の前提 |
| 上流 | UT-06-FU-J（CORS preflight） | S-06 の前提 |
| 関連 | UT-29 CD post-deploy smoke 自動化 | 同コンテキスト |

## 苦戦箇所・知見

**1. 期待値の docs と実装の drift**
Phase 12 で確認済み（UNASSIGNED-I）の通り、現行 docs と実装で `/health` レスポンス形式が異なる。先行して FU-I を解消するか、smoke スクリプトに期待値の柔軟性（複数許容）を持たせる必要がある。

**2. CORS preflight smoke の実環境依存**
S-06 は OPTIONS リクエストを使用するため、実装が CORS middleware を持たない現状ではテストできない。FU-J の前提依存を仕様書冒頭に明示する。

**3. CI/CD 上での credentials 取り扱い**
本番 smoke は認証ヘッダ付きリクエストを含む可能性があるため、`scripts/with-env.sh` 経由で 1Password から動的注入する設計に統一する。`.env` 直書き禁止。

**4. 失敗時の判定基準**
HTTP status だけでなく body schema の最低限チェックも入れないと、表面的に 200 でも JSON が崩れている場合を検出できない。

## 受入条件

- [ ] `scripts/smoke-prod.sh` が S-01〜S-10 全 case を実行できる
- [ ] 実行結果が markdown レポートとして書き出される
- [ ] CI/CD post-deploy step として呼び出され、失敗時に exit non-zero
- [ ] credentials は 1Password 経由で注入され `.env` 直書きなし
- [ ] FU-H / FU-I / FU-J の依存解消後に S-03 / S-06 / S-07 が PASS

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-F |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | テンプレ |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-11.md | smoke 仕様 |
| 参考 | scripts/with-env.sh | secrets 注入 |
