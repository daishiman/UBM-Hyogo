# Phase 9: 品質保証 / 4 条件評価

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 9 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. 全 Phase（1〜13）に対する 4 条件評価集約マトリクスを作成する。
2. `task-specification-creator` の checklist に基づく skill 検証チェックリストを実行する。
3. `aiworkflow-requirements` との整合性確認項目を定義する。
4. 不変条件 #5 への影響評価を最終確認する。
5. 評価結果サマリー（PASS / MINOR / MAJOR）を確定し、Phase 10 へ引き継ぐ。

## 目的

Phase 11 の手動 smoke（runbook dry-run）実施前に、仕様書全体の品質ゲート項目を定義する。
本 workflow は `spec_created` のため、本 Phase では実測 PASS を宣言せず、判定基準と
実行時記録ルールのみを固定する。最終 PASS は Phase 11 / Phase 12 の compliance check で記録する。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-01.md` 〜 `phase-08.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/automation-30/references/elegant-review-prompt.md`

## 入力

- 全 Phase 仕様書（phase-01.md 〜 phase-08.md）
- `artifacts.json`（Phase 状態の正本）
- `outputs/artifacts.json`（生成済みの場合のみ。未生成時は root `artifacts.json` を唯一正本として扱う）

## 全 Phase × 4 条件評価集約マトリクス

| Phase | 矛盾なし | 漏れなし | 整合性 | 依存関係整合 | 備考 |
| --- | --- | --- | --- | --- | --- |
| Phase 1（要件定義） | PASS | PASS | PASS | PASS | 真の論点（production apply の運用境界）と AC-1〜AC-12 が cross-check 済み |
| Phase 2（runbook 構造設計） | PASS | PASS | PASS | PASS | preflight / apply / post-check / evidence / failure handling の 5 セクション網羅 |
| Phase 3（設計レビュー） | PASS | PASS | PASS | PASS | 自動化案 / 手動全工程案 / runbook 化案の 3 案比較で runbook 化を採用 |
| Phase 4（検証戦略） | PASS | PASS | PASS | PASS | grep / dry-run / staging 模擬適用の 3 段で AC-3〜AC-10 をカバー |
| Phase 5（runbook 本体） | PASS | PASS | PASS | PASS | UT-07B Phase 5 と責務境界（Phase 8 で確定）に整合 |
| Phase 6（異常系） | PASS | PASS | PASS | PASS | 二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 衝突の 4 シナリオ + UT-07B 4 シナリオの継承 |
| Phase 7（AC マトリクス） | PASS | PASS | PASS | PASS | AC-1〜AC-12 が Phase × 検証コマンド × 成果物にトレース |
| Phase 8（DRY 化） | PASS | PASS | PASS | PASS | 責務分離 + 参照継承を採用、統合化を不採用 |
| Phase 9（本 Phase） | PASS | PASS | PASS | PASS | 判定基準を固定（実測 PASS は Phase 11/12） |
| Phase 10（最終レビュー） | PLANNED | PLANNED | PLANNED | PLANNED | Phase 9 結果を集約して GO 判定 |
| Phase 11（手動 smoke） | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL | dry-run のみ。production 値は記録しない |
| Phase 12（ドキュメント更新） | PLANNED | PLANNED | PLANNED | PLANNED | Issue #363 再 open / 新規起票判断を含む |
| Phase 13（PR 作成） | blocked_until_user_approval | - | - | - | ユーザー明示承認前は判定対象外 |

## skill 検証チェックリスト（task-specification-creator 準拠）

| 項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| index.md 必須セクション | メタ情報 / 目的 / スコープ / 依存関係 / AC / Phase 一覧 / 成果物 / 不変条件 / 完了判定 / 状態語彙 / 苦戦想定の存在 | 全セクション存在 |
| Phase ファイル必須セクション | メタ情報 / 実行タスク / 目的 / 参照資料 / 入力 / 完了条件 / 苦戦想定 / 関連リンク / 成果物 | 全セクション存在 |
| 状態語彙の正規化 | `spec_created` / `executed` / `verified` / `blocked_until_user_approval` のみ使用 | 揺れなし |
| AC 通し番号 | AC-1〜AC-12 が連番で抜けなし | 連番一致 |
| visualEvidence | 全 Phase で `NON_VISUAL` | 一致 |
| taskType | 全 Phase で `requirements / operations / runbook` | 一致 |
| GitHub Issue 参照 | 全 Phase メタ情報に `#363（CLOSED）` 表記 | 一致 |
| 機密値の非記録 | Token / Account ID / OAuth 値が grep で検出されない | 0 件 |

## aiworkflow-requirements との整合性確認

| 項目 | reference | 確認内容 | 期待結果 |
| --- | --- | --- | --- |
| `scripts/cf.sh` 利用ルール | `deployment-secrets-management.md` | runbook 内のすべての Cloudflare 操作が `bash scripts/cf.sh ...` 形式 | 整合 |
| `wrangler` 直接実行禁止 | CLAUDE.md / `deployment-secrets-management.md` | runbook 内に `wrangler ...` の直接呼び出しがないこと | 0 件 |
| 1Password / op 経由の Secret 解決 | `deployment-secrets-management.md` | 実値の記録なし、op 参照のみ言及 | 整合 |
| Token 値・Account ID の取り扱い | `deployment-secrets-management.md` | 実値および値の例示が文書中に存在しないこと | 0 件 |
| D1 production DB 名 | aiworkflow-requirements 正本 | `ubm-hyogo-db-prod` 表記の統一 | 整合 |
| migration apply 経路 | aiworkflow-requirements 正本 | `apps/api/migrations/` 配下 SQL のみを対象とする旨 | 整合 |

## 不変条件 #5 への影響評価（最終確認）

| 観点 | 結果 |
| --- | --- |
| `apps/web` から D1 直接アクセス経路を新設するか | しない（runbook 文書化のみ） |
| `apps/api/migrations/` 以外の SQL を production に適用するか | しない（対象は `0008_schema_alias_hardening.sql` のみ） |
| 運用コマンドの実行主体 | `bash scripts/cf.sh d1 migrations apply` であり、`apps/api` 配下の migration ディレクトリのみを対象 |
| ランタイムのデータアクセス境界に影響するか | しない（CI 上 / 手動運用上の D1 操作のみ） |
| 結論 | 侵害なし |

## 品質チェック項目

### 1. line budget チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| 各 phase 行数 | `wc -l docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/phase-*.md` | 各 phase 70〜500 行以内 |
| index.md 行数 | `wc -l docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/index.md` | 250 行以内 |

### 2. リンク健全性チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| 内部 path 参照 | 各 phase の `../completed-tasks/...` / `./phase-XX.md` 等を `test -e` で実在確認 | 全 link が解決 |
| 外部 URL（Cloudflare D1 docs / wrangler docs / GitHub Issue） | 目視レビュー | URL 形式が正当 |
| seed spec 参照 | `test -e ../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` | 実在 |
| UT-07B canonical 参照 | UT-07B Phase 5 / Phase 12 ファイルが実在 | 実在 |

### 3. mirror parity チェック

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json の phase キー | `jq '.phases | keys' artifacts.json` | phase-01 〜 phase-13 の 13 件 |
| outputs/artifacts.json の整合 | 生成済みの場合のみ root と diff | 未生成時は root 単独正本として記録 |
| outputs/phase-XX/main.md 配置予定 | `ls outputs/phase-*/main.md` | Phase 11 実施前は未存在で OK |

### 4. NON_VISUAL 宣言と evidence 規律

| 観点 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（runbook 文書化 + dry-run 検証） |
| 非視覚的理由 | UI / UX 変更を含まない運用 runbook |
| 代替証跡 | `outputs/phase-11/main.md`（dry-run 出力 / staging 模擬実行ログ。production 実値は含まない） |
| Token 値の grep 検証 | Phase 11 で `grep -RE "[A-Za-z0-9_-]{30,}" outputs/phase-11/` を実施し疑陽性 0 件を確認 |
| `screenshots/.gitkeep` | 不要（NON_VISUAL のため） |

## 評価結果サマリー

| 項目 | 判定基準 | 現時点判定 | 最終判定タイミング |
| --- | --- | --- | --- |
| 全 Phase × 4 条件 | Phase 1〜9 が PASS、Phase 10〜12 が PLANNED で記録 | PASS（Phase 1〜9）/ PLANNED（Phase 10〜12） | Phase 12 compliance check |
| skill 検証チェックリスト | 8 項目すべて PASS | PASS（実行時に再確認） | Phase 11 |
| aiworkflow-requirements 整合 | 6 項目すべて整合 | PASS | Phase 11 |
| 不変条件 #5 | 侵害なし | PASS | Phase 12 |
| line budget | 全 phase が範囲内 | 実行時に判定 | Phase 11 |
| リンク健全性 | 内部 link 100% 解決 | 実行時に判定 | Phase 11 |
| mirror parity | artifacts.json と outputs/ 側のキー一致 | outputs mirror 生成時のみ判定 | Phase 11 |
| NON_VISUAL 代替証跡準備 | dry-run 出力規律確立 | 設計済 | Phase 11 |

**サマリー: PASS（MINOR 指摘 3 件、MAJOR 指摘 0 件）**。

| Severity | 内容 | 移管先 |
| --- | --- | --- |
| MINOR | GitHub Issue #363 が CLOSED 状態 | Phase 12 で再 open / 新規 Issue 起票判断 |
| MINOR | 共通 SQL スニペット集（collision SQL / introspection）の集約は将来候補 | Phase 12 unassigned-task-detection |
| MINOR | 実 production apply の運用実行は本タスク外（下流タスク） | Phase 10 残課題、Phase 12 で別タスク化を明示 |

## 統合テスト連携

- 本タスクは runbook 文書化と dry-run 検証のみで、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 設計の grep / dry-run / staging 模擬適用を Phase 11 で実施。

## 完了条件

- [ ] 全 Phase × 4 条件評価集約マトリクスが記録されている
- [ ] skill 検証チェックリスト 8 項目の確認手順が定義されている
- [ ] aiworkflow-requirements 整合 6 項目の確認手順が定義されている
- [ ] 不変条件 #5 への影響評価が「侵害なし」で確定している
- [ ] 評価結果サマリーが PASS（MINOR 3 件 / MAJOR 0 件）で記録されている
- [ ] Phase 11 / Phase 12 への引き継ぎ項目（最終 PASS の確定タイミング）が明示されている

## 苦戦想定

**1. outputs/artifacts.json の生成タイミング**

mirror parity は outputs/ 側が未生成段階では `diff` が失敗する。Phase 11 実施時に同時生成し、Phase 9 では「生成計画と整合性」のみ確認する点を明文化しておく。

**2. skill 検証「漏れなし」の判定厳密性**

5 セクション（preflight / apply / post-check / evidence / failure handling）× AC-1〜AC-12 のセル埋まり状況を機械的に確認する手順を Phase 11 で明示する必要がある。

**3. 機密値 grep 検証の疑陽性**

Cloudflare D1 migration hash や commit SHA は 30 文字以上の英数字となり、Token 値正規表現にヒットする。Phase 11 で「ハッシュ値は許可、Token 値は除外」のフィルタ規則を確立する必要がある。

## 関連リンク

- 上位 index: `./index.md`
- AC マトリクス: `./phase-07.md`
- DRY 判定: `./phase-08.md`
- 最終レビュー: `./phase-10.md`
- 手動 smoke: `./phase-11.md`

## 成果物

- `outputs/phase-09/main.md`
