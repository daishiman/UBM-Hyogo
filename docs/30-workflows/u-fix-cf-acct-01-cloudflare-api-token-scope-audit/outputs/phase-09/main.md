# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 9 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流 | outputs/phase-01/main.md 〜 outputs/phase-08/main.md |
| 下流 | outputs/phase-10/main.md, outputs/phase-11/main.md |

## 1. 目的

Phase 11 の手動 smoke 実施前に、仕様書全体の品質ゲート項目を確定する。本 workflow は `spec_created` のため、本 Phase では実測 PASS は宣言せず、「**判定基準と再点検結果**」を残す。Phase 11 で再評価する。

## 2. 品質チェック項目

### 2.1 line budget チェック

| 対象 | 確認方法 | 期待結果 | 本 Phase 時点の見積り |
| --- | --- | --- | --- |
| 各 phase 行数 | `wc -l docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-*.md` | 各 phase 70〜500 行以内 | spec ファイル群は範囲内（最大 phase-02.md ≒ 200 行台、phase-05.md ≒ 170 行）。OK 見込み |
| index.md 行数 | `wc -l .../index.md` | 200 行以内 | 187 行で範囲内 |
| outputs/phase-XX/main.md 行数 | `wc -l outputs/phase-*/main.md` | 各 100〜300 行を目安 | Phase 1〜8 main.md は 100〜220 行。OK |

### 2.2 リンク健全性チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| 内部 path 参照 | 各 phase の `../completed-tasks/...` / `./phase-XX.md` / `outputs/phase-XX/main.md` を `test -e` で実在確認 | 全 link が解決 |
| 外部 URL（Cloudflare Permissions Reference / wrangler-action README） | 目視レビューのみ（Phase 11 で curl しない） | URL 形式が正当 |
| seed spec 参照 | `test -e docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md` | 実在 |

### 2.3 mirror parity チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| `artifacts.json` の phase キー | `jq '.phases \| keys' artifacts.json` | phase-01〜phase-13 の 13 件 |
| `outputs/artifacts.json` の整合 | `test -f outputs/artifacts.json && diff <(jq '.phases' artifacts.json) <(jq '.phases' outputs/artifacts.json)` | 未生成時は `root artifacts.json` を単独正本とする（FAIL ではない） |
| `outputs/phase-XX/main.md` 配置予定 | `ls outputs/phase-*/main.md` | Phase 11 実施前は phase-01〜10 の 10 件、Phase 11 / 12 は実施時に追加 |

### 2.4 skill 検証 4 条件の再点検

| 条件 | 検証手順 | 本 Phase 時点の判定 |
| --- | --- | --- |
| **矛盾なし** | Phase 1「真の論点」、Phase 2 §3「権限マトリクス」、Phase 3「Option A 採用」、Phase 7 AC マトリクスを cross-check | PASS（各 phase の主張が衝突しない。Option A の 4 種正本 + 条件付き 2 種で一貫） |
| **漏れなし** | wrangler-action / D1 migration / Pages deploy の 3 経路 × 3 観点（権限・検証コマンド・rollback）= 9 セルが埋まっているか確認 | PASS（Phase 2 §3 / §5 + Phase 4 TC / Phase 5 Step / Phase 6 FC で全 9 セル充足） |
| **整合性** | Cloudflare 公式 Permissions Reference / wrangler-action README v3 / `scripts/cf.sh` 運用ルール / `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` と矛盾しない | PASS（権限名・コマンド形式・ガード方針すべて整合） |
| **依存関係整合** | 上流（FIX-CF-ACCT-ID-VARS-001 完了）/ 並列（U-FIX-CF-ACCT-02 ADR cross-ref）/ 下流（main deploy）の依存が破綻しない | PASS（Phase 8 で並列タスク責務境界を確定、`index.md` 依存表と整合） |

### 2.5 不変条件 #5 の侵害なし

| 観点 | 結果 |
| --- | --- |
| `apps/web` から D1 直接アクセス経路を新設するか | しない（Token 権限編集のみ） |
| Token 権限変更が `apps/api` のデータアクセス境界を変えるか | 変えない（CI 上の D1 migration 用権限のみ。runtime binding は `apps/api/wrangler.toml` の D1 binding が引き続き正本） |
| 結論 | **侵害なし** |

## 3. NON_VISUAL 宣言

| 観点 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（Cloudflare Token 権限編集 + GitHub Secret 更新） |
| 非視覚的理由 | UI / UX 変更を含まない security-audit |
| 代替証跡 | `outputs/phase-11/main.md`（`gh secret list` 名のみ / `scripts/cf.sh whoami` exit / Cloudflare Dashboard 権限名一覧。Token 値・Account ID は記録しない） |
| `screenshots/.gitkeep` | 不要（NON_VISUAL）。ただし Cloudflare Dashboard 権限名一覧を画像化する場合は `outputs/phase-11/screenshots/` 配下に格納し、Token 値・Account ID 部分を黒塗り |

## 4. Token 値非記録ルール（再宣言）

- TC-S06 / TC-N04 を Phase 11 完了直前の **必須 grep gate** とする
- `set -x` 禁止 / `gh secret set` は stdin 経路のみ / `--body` 引数禁止
- 本ルールは Phase 4 §6・Phase 5 §6・Phase 6 §3 と完全一致

## 5. 統合テスト連携

- 本タスクは Cloudflare Token の権限変更と Secret 更新のみで、アプリケーション統合テストは追加しない。
- 代替検証は Phase 4 設計の static / runtime / production の三段検証を Phase 11 で実施。

## 6. 品質チェック結果サマリー

| 項目 | 判定基準 | 本 Phase 時点 | Phase 11 で再評価 |
| --- | --- | --- | --- |
| line budget | 全 phase が範囲内 | OK 見込み | 実行時に再計測 |
| リンク健全性 | 内部 link 100% 解決 | OK 見込み | Phase 11 で再走 |
| mirror parity | `artifacts.json` 13 件整合 | OK（root を正本） | outputs mirror 生成時に再判定 |
| skill 4 条件 | 4 条件すべて PASS | **PASS** | Phase 12 compliance check |
| 不変条件 #5 | 侵害なし | **PASS** | Phase 11 で再確認 |
| NON_VISUAL 代替証跡 | 記録方法が確定 | 確定 | Phase 11 実施 |

## 7. AC マッピング（Phase 9 内 完結分）

| AC | 本 Phase での貢献 |
| --- | --- |
| AC-8 | §4 Token 値非記録ルール再宣言 |
| AC-9 | §2.5 不変条件 #5 侵害なし宣言 |
| AC-11 | §2.4 skill 4 条件 PASS 判定 |

## 8. 完了条件

- [ ] line budget チェックが計画通り
- [ ] リンク健全性チェックが PASS（実行時計測は Phase 11）
- [ ] mirror parity チェックが PASS（root artifacts.json を正本）
- [ ] skill 検証 4 条件すべてが PASS
- [ ] NON_VISUAL 宣言と Token 値非記録ルールが明記されている
- [ ] 不変条件 #5 を侵害しないことが再確認されている

## 9. 成果物

- 本ファイル: `outputs/phase-09/main.md`
