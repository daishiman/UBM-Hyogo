# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 9 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Phase 1〜8 成果物の line budget・リンク健全性・mirror parity を計測する。
2. skill 検証 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）を再点検する。
3. NON_VISUAL 宣言と代替証跡（Phase 11）の準備状態を確認する。

## 目的

Phase 11 の手動 smoke 実施前に、仕様書全体の品質ゲート項目を定義する。本 workflow は `spec_created` のため、この Phase では実測 PASS を宣言せず、実行時に `outputs/phase-09/main.md` へ記録する判定基準を固定する。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-01.md` 〜 `phase-08.md`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 入力

- 全 Phase 仕様書（phase-01.md 〜 phase-08.md）
- `artifacts.json`（Phase 状態の正本）
- `outputs/artifacts.json`（生成済みの場合のみ。未生成時は root `artifacts.json` を唯一正本として扱う）

## 品質チェック項目

### 1. line budget チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| 各 phase 行数 | `wc -l docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-*.md` | 各 phase 70〜500 行以内（task-spec ガイドラインに整合） |
| index.md 行数 | `wc -l docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/index.md` | 200 行以内 |

### 2. リンク健全性チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| 内部 path 参照 | 各 phase の `../completed-tasks/...` / `./phase-XX.md` 等を `ls -la` / `test -e` で実在確認 | 全 link が解決 |
| 外部 URL（Cloudflare Permissions Reference 等） | 目視レビュー（Phase 11 では curl 実施しない） | URL 形式が正当 |
| seed spec 参照 | `test -e docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md` | 実在 |

### 3. mirror parity チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json の phase キー | `jq '.phases | keys' artifacts.json` | phase-01 〜 phase-13 の 13 件 |
| outputs/artifacts.json の整合 | `test -f outputs/artifacts.json && diff <(jq '.phases' artifacts.json) <(jq '.phases' outputs/artifacts.json) || echo "PLANNED: root artifacts.json is canonical until outputs mirror exists"` | 未生成時は FAIL ではなく `root artifacts.json` 単独正本として記録 |
| outputs/phase-XX/main.md 配置予定 | `ls outputs/phase-*/main.md` | Phase 11 実施前は未存在で OK、実施時に揃えること |

### 4. skill 検証 4 条件の再点検

| 条件 | 検証手順 | 期待結果 |
| --- | --- | --- |
| 矛盾なし | Phase 1 「真の論点」と Phase 2 「権限マトリクス」、Phase 3 「Option A 採用」、Phase 7 AC マトリクスを cross-check | 各 phase の主張が衝突しない |
| 漏れなし | wrangler-action / D1 migration / Pages deploy の 3 経路すべてに権限・検証コマンド・rollback が割当されているか確認 | 3 × 3 = 9 セルが全て記載済み |
| 整合性 | Cloudflare 公式 Permissions Reference / wrangler-action README / `scripts/cf.sh` 運用ルール / `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` と矛盾しない | 整合 |
| 依存関係整合 | 上流（FIX-CF-ACCT-ID-VARS-001 完了）/ 並列（U-FIX-CF-ACCT-02 ADR cross-ref）/ 下流（main deploy）の依存が破綻しない | 整合 |

### 5. 不変条件 #5 の侵害なし

| 観点 | 結果 |
| --- | --- |
| `apps/web` から D1 直接アクセス経路を新設するか | しない（Token 権限編集のみ） |
| Token 権限変更が `apps/api` のデータアクセス境界を変えるか | 変えない（CI 上の D1 migration 用権限のみ） |
| 結論 | 侵害なし |

## NON_VISUAL 宣言

| 観点 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（Cloudflare Token 権限編集 + GitHub Secret 更新） |
| 非視覚的理由 | UI / UX 変更を含まない security-audit |
| 代替証跡 | `outputs/phase-11/main.md`（`gh secret list` / `scripts/cf.sh whoami` / Cloudflare Dashboard 権限名スクリーンショット。Token 値は記録しない） |
| `screenshots/.gitkeep` | 不要（NON_VISUAL のため）。ただし Cloudflare Dashboard の権限名一覧を画像化する場合は `outputs/phase-11/screenshots/` 配下に格納し、Token 値・Account ID が画面に映らないこと（黒塗り）を確認 |

## 統合テスト連携

- 本タスクは Cloudflare Token の権限変更と Secret 更新のみで、アプリケーション統合テストは追加しない。
- 代替検証は Phase 4 設計の static / runtime / production の三段検証を Phase 11 で実施。

## 品質チェック結果サマリー

| 項目 | 判定基準 | 完了条件 |
| --- | --- | --- |
| line budget | 全 phase が範囲内 | 実行時に判定 |
| リンク健全性 | 内部 link 100% 解決 | 実行時に判定 |
| mirror parity | artifacts.json と outputs/ 側の phase キー一致 | outputs mirror がある場合のみ判定。未生成時は root 単独正本 |
| skill 検証 4 条件 | 4 条件すべて PASS | 実行時に判定 |
| 不変条件 #5 | 侵害なし | 設計上 PASS、実行時に再確認 |
| NON_VISUAL 代替証跡準備 | Phase 11 で記録方法が確定 | 実行時に判定 |

## 完了条件

- [ ] line budget チェックが PASS
- [ ] リンク健全性チェックが PASS
- [ ] mirror parity チェックが PASS（outputs/artifacts.json の生成計画を含む）
- [ ] skill 検証 4 条件すべてが PASS
- [ ] NON_VISUAL 宣言と Token 値非記録ルールが明記されている
- [ ] 不変条件 #5 を侵害しないことが再確認されている

## 苦戦想定

**1. outputs/artifacts.json の生成タイミング**
mirror parity は outputs/ 側が未生成段階では `diff` が失敗する。Phase 11 実施時に同時生成し、Phase 9 では「生成計画と整合性」のみ確認する点を明文化しておく。

**2. Cloudflare Dashboard スクリーンショットの黒塗り**
権限名一覧を撮影する際、URL の Account ID 部分や Token 詳細の値領域を必ず黒塗りする運用を Phase 11 までに確立する必要がある。

**3. skill 検証「漏れなし」の判定厳密性**
3 経路 × 3 観点（権限・検証コマンド・rollback）= 9 セルの埋まり状況を機械的に確認する手順を Phase 11 で明示する。

## 関連リンク

- 上位 index: `./index.md`
- AC マトリクス: `./phase-07.md`
- 最終レビュー: `./phase-10.md`

## 成果物

- `outputs/phase-09/main.md`
