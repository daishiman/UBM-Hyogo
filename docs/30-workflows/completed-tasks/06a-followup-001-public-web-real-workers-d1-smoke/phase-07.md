# Phase 7: AC マトリクス

## 目的

AC-1〜7 を「verify 手段（コマンド or 手順）」「evidence 保存先（outputs/phase-11/evidence/ 配下）」「該当不変条件」「失敗時の Phase 戻し先」の 4 軸で完全 trace する。Phase 4 の curl matrix を AC 観点に再編する位置付けで、本フェーズ完了をもって Phase 11 手動 smoke の合否判定基準が固定される。

## マトリクス本体

詳細表は `outputs/phase-07/ac-matrix.md` に格納する。本ファイルでは構造と運用ルールのみを定義する。

### 列定義

| 列 | 内容 |
| --- | --- |
| AC | AC-1〜7 の識別子 |
| 観点 | local / staging / 経路 / 不変条件 のいずれか |
| verify 手段 | 実行コマンド（`bash scripts/cf.sh ...` 経由 / `curl` / `rg`）または Read 確認手順 |
| 期待値 | exit code / HTTP status / 出力に含まれるべき文字列 |
| evidence | `outputs/phase-11/evidence/` 配下の保存ファイル名 |
| 不変条件 trace | #1 / #5 / #6 のいずれか（複数可） |
| 失敗時の戻し先 | Phase 5 runbook / Phase 6 異常系 / Phase 2 設計のどれに戻るか |

### 運用ルール

1. **すべての AC は単独で観測可能**（複合 AC を作らない）。AC-3 は「seed member 1 件以上」または「D1 query log」のいずれか単一条件で OK とする。
2. **evidence ファイル名は固定**: `local-curl.log` / `staging-curl.log` / `staging-screenshot.png` の 3 つに集約する。Phase 8 DRY 化で命名規則統一済み。
3. **secret hygiene**: verify 手段の中で API token / D1 database id / staging URL の path 以下を log へ出力しない（Phase 9 の責務だが本マトリクスでも該当列にマーキング）。
4. **fallback 検知**: AC-5 では `PUBLIC_API_BASE_URL` が `localhost` を指していないことを必ず正規表現で除外確認する（`grep -v 'localhost'` 等）。

## AC × verify 手段の概要（詳細表は ac-matrix.md）

- **AC-1（local 起動 / esbuild mismatch 不再現）**: `bash scripts/cf.sh dev --config apps/api/wrangler.toml` を 2 回連続 fresh 起動し、`Listening on http://127.0.0.1:8787` を `tee` で `local-curl.log` 冒頭に追記。
- **AC-2（local 4 route family / 5 smoke cases）**: `curl -s -o /dev/null -w "%{http_code}\n"` を `/`, `/members`, `/members/{seeded-id}`, `/members/UNKNOWN`, `/register` の順に実行。期待値 `200 / 200 / 200 / 404 / 200`。
- **AC-3（実 D1 経由証跡）**: API 側 `GET /public/members` の `items.length >= 1` と、その ID を使った web `/members/{seeded-id}` の `200` を確認。`/members/UNKNOWN` の 404 は異常系確認であり主証跡にはしない。
- **AC-4（staging 4 route family / 5 smoke cases）**: staging URL に対し AC-2 と同形式の curl を実行し `staging-curl.log` に保存。
- **AC-5（staging vars）**: Cloudflare deployed vars を `bash scripts/cf.sh` 経由で確認し、`PUBLIC_API_BASE_URL` が apps/api の staging URL を指すことを目視確認した結果を `staging-curl.log` 冒頭にコメント行で追記（値は記録しない）。`apps/web/wrangler.toml` は現状未定義のため補助確認に留め、deployed vars 未設定なら NO-GO。
- **AC-6（evidence trace）**: 06a 親タスクには本 followup task evidence への相対リンク trace のみ追記し、実体ファイルは本 task 側に保持する。
- **AC-7（不変条件 #5 再確認）**: `pnpm --filter @ubm-hyogo/web exec rg -n "D1Database|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**'` 出力が 0 件であることを確認し、コマンド + 結果を `local-curl.log` 末尾セクションに保存。

## 不変条件 trace サマリ

| 不変条件 | 主担当 AC | 補助 AC |
| --- | --- | --- |
| #5（D1 直接アクセス禁止） | AC-7 | AC-2 / AC-3 / AC-4（経路自体が 3 層分離） |
| #1（schema 固定回避） | AC-3 | AC-2 / AC-4（200 が返ること自体が間接担保） |
| #6（GAS prototype 非昇格） | — | smoke 対象に GAS endpoint を含めないことで自動担保 |

## 失敗時の戻し先

| 失敗 AC | 戻し先 | 理由 |
| --- | --- | --- |
| AC-1 | Phase 6 異常系 → Phase 5 runbook | esbuild mismatch 再発時の手順書を再点検 |
| AC-2 / AC-4 | Phase 5 runbook | 起動 / curl 順序ミスの可能性を最初に排除 |
| AC-3 | Phase 6 異常系（D1 binding 未 apply） | migration apply 状況の確認に戻る |
| AC-5 | Phase 2 設計 → Phase 5 | vars 設計から再確認 |
| AC-6 | Phase 12 documentation | 06a 親タスクへの追記 path を再確認 |
| AC-7 | Phase 2 設計 | 3 層分離の境界違反は実装に踏み込む（本タスクの scope out 注意） |

## verify 手段の詳細補足

### local 起動の 2 回連続 fresh 観測（AC-1）

「fresh 起動」とは、前回プロセスを完全停止し、`.wrangler/` キャッシュを残したまま（あるいは必要に応じてクリアして）再度 `bash scripts/cf.sh dev` を呼ぶ操作を指す。esbuild Host/Binary version mismatch は環境変数 `ESBUILD_BINARY_PATH` が `scripts/cf.sh` で正しく解決される限り再発しない設計のため、2 回連続成功で恒久解決を担保する。

### AC-3 の seed 件数判定

D1 binding の seed は 02b 親タスクで apply 済みである前提。本タスク内で seed の追加 / 変更は行わない（scope out）。`length >= 1` という緩条件は、seed 件数の運用上の揺らぎ（テストデータ追加 / クリーンアップ）に対する冪等性確保のため。

### AC-4 staging URL の取り扱い

staging URL の生値は `staging-curl.log` の curl 行に含まれる範囲のみ許容し、本マトリクスや phase-NN.md の本文には記載しない（Phase 9 secret hygiene）。

## Phase 8 / 11 への引き継ぎ

- 本マトリクスの evidence 列が Phase 8 DRY 化の 3 ファイル固定ルールと完全整合
- Phase 11 実施者は ac-matrix.md の verify 列を上から順に実行することで AC-1〜7 を 1 パスでカバーできる
- 失敗時戻し先列は Phase 6 異常系シナリオの index としても機能する

## 完了条件

- [ ] 既存の完了条件を満たす

- `outputs/phase-07/main.md` と `outputs/phase-07/ac-matrix.md` が揃っている
- AC-1〜7 すべてに verify / evidence / 不変条件 / 戻し先 が埋まっている
- 「evidence ファイル名は 3 種に集約」のルールが Phase 8 DRY 化と矛盾しない
- 不変条件 #5 が AC-7 主担当として明示されている
- staging URL / API token / D1 id が本ファイル本文に記載されていない

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 7
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- AC matrix を更新する
- AC ごとの verify command / evidence / invariant trace を照合する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-07/main.md`

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。
