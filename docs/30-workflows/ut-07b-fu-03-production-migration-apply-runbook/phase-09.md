# Phase 9: 品質保証 / 4 条件評価

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 9 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook / implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. 全 Phase（1〜13）に対する 4 条件評価集約マトリクスを作成する。
2. `task-specification-creator` の format checklist を実行する。
3. `aiworkflow-requirements` 整合性確認項目を定義する。
4. CONST_005 必須項目チェックを実施する。
5. 不変条件 #5 への影響評価を最終確認する。
6. 評価結果サマリー（PASS / MINOR / MAJOR）を確定する。

## 目的

実装仕様書 + runbook 文書が、AC-1〜AC-20 の全件を bats / CI gate / 文書品質で `verified` 化できる品質ゲートを満たすことを保証する。本 Phase は判定基準と実行時記録ルールを固定する段階であり、最終 PASS は Phase 11 / 12 の compliance check で記録する。

## 参照資料

- `index.md` / `artifacts.json`
- `phase-01.md` 〜 `phase-08.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/automation-30/references/elegant-review-prompt.md`

## 入力

- 全 Phase 仕様書（phase-01.md 〜 phase-08.md）
- 実装ファイル仕様（spec_created 段階）
- `artifacts.json`

## 全 Phase × 4 条件評価集約マトリクス

| Phase | 矛盾なし | 漏れなし | 整合性 | 依存関係整合 | 備考 |
| --- | --- | --- | --- | --- | --- |
| Phase 1（要件定義） | PASS | PASS | PASS | PASS | 真の論点（production apply の運用境界 + 実装ファイル分離）と AC-1〜AC-20 が cross-check 済 |
| Phase 2（設計：runbook 構造 + 実装ファイル分割） | PASS | PASS | PASS | PASS | preflight / apply / postcheck / evidence / cf.sh wrapper / DRY_RUN / redaction / exit codes / failure handling の F1〜F9 網羅 |
| Phase 3（設計レビュー） | PASS | PASS | PASS | PASS | 自動化案 / 手動全工程案 / runbook + 実装スクリプト案の比較で「runbook + 実装スクリプト + bats + CI gate」を採用 |
| Phase 4（検証戦略） | PASS | PASS | PASS | PASS | bats / staging dry-run / CI gate / grep の 4 段で AC-1〜AC-20 をカバー |
| Phase 5（runbook Part A + 実装 Part B） | PASS | PASS | PASS | PASS | UT-07B Phase 5 と責務境界（Phase 8 で確定）に整合 |
| Phase 6（異常系・exit codes） | PASS | PASS | PASS | PASS | 4 シナリオ × exit code（0〜6）+ FC-01〜18 |
| Phase 7（AC マトリクス） | PASS | PASS | PASS | PASS | AC-1〜AC-20 が「検証方法 × 実装ファイル × 仕様書セクション × 状態」の 4 軸でトレース |
| Phase 8（DRY 化） | PASS | PASS | PASS | PASS | helper `source` + 文書参照 + fixture 集約を採用 |
| Phase 9（本 Phase） | PASS | PASS | PASS | PASS | 判定基準を固定（実測 PASS は Phase 11/12） |
| Phase 10（最終レビュー） | PLANNED | PLANNED | PLANNED | PLANNED | Phase 9 結果を集約して GO 判定 |
| Phase 11（手動 smoke + bats + CI dry-run） | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL | bats 全 PASS / staging dry-run / redaction grep gate |
| Phase 12（ドキュメント更新） | PLANNED | PLANNED | PLANNED | PLANNED | Issue #363 再 open / 新規起票判断含む |
| Phase 13（PR 作成） | blocked_until_user_approval | - | - | - | ユーザー明示承認前は判定対象外 |

## skill 検証チェックリスト（task-specification-creator フォーマット準拠）

| 項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| index.md 必須セクション | メタ / 目的 / スコープ / 依存 / AC / Phase 一覧 / 成果物 / 不変条件 / 完了判定 / 状態語彙 / 苦戦想定 | 全セクション存在 |
| Phase ファイル必須セクション | メタ / 実行タスク / 目的 / 参照 / 入力 / 完了条件 / 苦戦想定 / 関連リンク / 成果物 | 全セクション存在 |
| 状態語彙正規化 | `spec_created` / `executed` / `verified` / `blocked_until_user_approval` のみ | 揺れなし |
| AC 通し番号 | AC-1〜AC-20 連番 | 連番一致 |
| visualEvidence | 全 Phase で `NON_VISUAL` | 一致 |
| taskType | 全 Phase で `requirements / operations / runbook / implementation` | 一致 |
| GitHub Issue | 全 Phase メタに `#363（CLOSED）` | 一致 |
| 機密値非記録 | Token / Account ID / OAuth が grep で 0 件 | 0 件 |

## aiworkflow-requirements 整合性確認

| 項目 | reference | 確認内容 | 期待結果 |
| --- | --- | --- | --- |
| `scripts/cf.sh` 利用ルール | `deployment-secrets-management.md` | 全 Cloudflare 操作が `bash scripts/cf.sh ...` 経由 | 整合 |
| `wrangler` 直接実行禁止 | CLAUDE.md / `deployment-secrets-management.md` | runbook + 実装スクリプト内に `wrangler ...` 直叩きなし | 0 件 |
| 1Password / op 経由 Secret 解決 | `deployment-secrets-management.md` | 実値非記録、op 参照のみ | 整合 |
| Token 値・Account ID 非記録 | 同上 | 値および値の例示が文書 / スクリプトに存在しない | 0 件 |
| D1 production DB 名 | aiworkflow-requirements 正本 | `ubm-hyogo-db-prod` 表記統一 | 整合 |
| migration apply 経路 | aiworkflow-requirements 正本 | `apps/api/migrations/` 配下 SQL のみ対象 | 整合 |

## CONST_005 必須項目充足チェック表

| 項目 | 充足 | 根拠 |
| --- | --- | --- |
| AC-1〜AC-20 連続性 | OK | Phase 7 連番表 |
| 検証方法明記（bats / grep / CI / staging dry-run / runbook 章） | OK | Phase 7 マトリクス |
| 成果物 2 軸（実装ファイル + 仕様書セクション） | OK | Phase 7 マトリクス |
| 状態語彙 | OK | Phase 1〜13 整合 |
| 上流 / 下流 Phase | OK | Phase 7 依存エッジ表 |
| 4 条件評価 | OK | Phase 1〜9 PASS |
| `task-specification-creator` フォーマット | OK | 必須 9 セクション存在 |
| `aiworkflow-requirements` 整合 | OK | 6 項目すべて整合 |
| 不変条件 #5 | OK | 侵害なし |

## 不変条件 #5 への影響評価（最終確認）

| 観点 | 結果 |
| --- | --- |
| `apps/web` から D1 直接アクセス経路新設 | しない |
| `apps/api/migrations/` 以外の SQL を production に適用 | しない（対象は `0008_schema_alias_hardening.sql` のみ） |
| 運用コマンド実行主体 | `bash scripts/cf.sh d1:apply-prod` → `wrangler d1 migrations apply`、`apps/api/migrations/` のみ対象 |
| ランタイムのデータアクセス境界影響 | なし（CI / 手動運用上の D1 操作のみ） |
| 結論 | 侵害なし |

## 品質チェック項目

### 1. line budget

| 対象 | 確認方法 | 期待結果 |
| --- | --- | --- |
| 各 phase 行数 | `wc -l docs/30-workflows/.../phase-*.md` | 各 phase 70〜500 行 |
| index.md 行数 | `wc -l index.md` | 250 行以内 |
| 実装スクリプト | `wc -l scripts/d1/*.sh` | 各 200 行以内 |

### 2. リンク健全性

| 対象 | 確認方法 |
| --- | --- |
| 内部 path 参照 | `test -e` で全件解決 |
| 外部 URL（Cloudflare D1 docs / wrangler docs / GitHub Issue） | 目視 |
| UT-07B canonical 参照 | 実在 |

### 3. mirror parity

| 対象 | 確認方法 |
| --- | --- |
| `artifacts.json` の phase キー | `jq '.phases | keys'` で 13 件 |
| `outputs/phase-XX/main.md` 配置 | Phase 11 完了時に全件存在 |

### 4. NON_VISUAL evidence 規律

| 観点 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（runbook + 実装スクリプト + bats + CI） |
| 代替証跡 | bats 出力 / CI workflow run / `outputs/phase-11/main.md` dry-run ログ（production 実値含まない） |
| Token 値 grep | Phase 11 で `grep -RE "[A-Za-z0-9_-]{30,}" outputs/phase-11/` を許可 prefix リストでフィルタ |
| `screenshots/.gitkeep` | 不要 |

## 評価結果サマリー

| 項目 | 判定基準 | 現時点判定 | 最終判定タイミング |
| --- | --- | --- | --- |
| 全 Phase × 4 条件 | Phase 1〜9 PASS / Phase 10〜12 PLANNED | PASS / PLANNED | Phase 12 |
| skill 検証チェックリスト | 8 項目 PASS | PASS | Phase 11 |
| aiworkflow-requirements 整合 | 6 項目整合 | PASS | Phase 11 |
| CONST_005 必須項目 | 9 項目 OK | PASS | Phase 11 |
| 不変条件 #5 | 侵害なし | PASS | Phase 12 |
| line budget | 範囲内 | 実行時判定 | Phase 11 |
| リンク健全性 | 内部 link 100% 解決 | 実行時判定 | Phase 11 |
| mirror parity | キー一致 | Phase 11 で判定 | Phase 11 |
| NON_VISUAL 代替証跡 | 規律確立 | 設計済 | Phase 11 |

**サマリー: PASS（MINOR 3 件、MAJOR 0 件）**

| Severity | 内容 | 移管先 |
| --- | --- | --- |
| MINOR | GitHub Issue #363 が CLOSED 状態 | Phase 12 で再 open / 新規起票判断 |
| MINOR | 共通 SQL スニペット集 / composite action 化は将来候補 | Phase 12 unassigned-task |
| MINOR | 実 production apply の運用実行は本タスク外 | Phase 10 残課題、Phase 12 で別タスク化明示 |

## 4 条件評価（本 Phase 自身）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実装ファイル / 仕様書 / AC が排他で重複なし、cf.sh 拡張と新規スクリプトの責務分離明確 |
| 漏れなし | PASS | F1-F9 + bats + CI gate + runbook + AC-1〜AC-20 が網羅 |
| 整合性 | PASS | exit code / DRY_RUN / op run / scripts/cf.sh 規約 / wrangler.toml binding / D1 migrations 仕様と一致 |
| 依存関係整合 | PASS | UT-07B / U-FIX-CF-ACCT-01 完了済み、bats が CI で先に走る、CI gate green が PR merge の前提 |

## 統合テスト連携

- bats（`pnpm test:scripts`）+ CI workflow `d1-migration-verify` の 2 段で AC-13 / AC-14 を gate。
- アプリ統合テスト追加なし。

## 完了条件

- [ ] 全 Phase × 4 条件評価集約マトリクスが記録されている
- [ ] skill 検証チェックリスト 8 項目の確認手順が定義されている
- [ ] aiworkflow-requirements 整合 6 項目の確認手順が定義されている
- [ ] CONST_005 必須項目 9 項目が OK で記録されている
- [ ] 不変条件 #5 「侵害なし」で確定
- [ ] 評価結果サマリー PASS（MINOR 3 件 / MAJOR 0 件）
- [ ] Phase 11 / 12 への引継ぎ項目が明示されている

## 苦戦想定

**1. bats / CI dry-run の実行タイミング差** — 実測 PASS は Phase 11 で確定。本 Phase は判定基準のみ固定。

**2. redaction の疑陽性** — D1 migration hash / commit SHA が Token 正規表現に hit。Phase 6 の許可 prefix リストを redaction filter で適用。

**3. mirror parity** — outputs/ 側未生成段階では diff 失敗。Phase 11 で同時生成し本 Phase は計画整合性のみ確認。

## 関連リンク

- 上位 index: `./index.md`
- AC: `./phase-07.md`
- DRY: `./phase-08.md`
- 最終レビュー: `./phase-10.md`
- 手動 smoke: `./phase-11.md`

## 成果物

- `outputs/phase-09/main.md`
