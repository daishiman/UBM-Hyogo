# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| ゲート種別 | MAJOR/MINOR/PASS の 3 値判定 |

## 目的

Phase 1 要件と Phase 2 設計が `index.md` の AC-1〜AC-12 をすべて満たし、不変条件 / セキュリティ / 運用ポリシーに違反しないことを **代替案比較**で確認する。MAJOR が 1 件でもあれば Phase 2 へ戻る。MINOR は記録の上 Phase 4 へ進めるが Phase 12 で必ず追従。

## 実行タスク

1. Phase 1 の true issue / AC-1〜AC-12 と Phase 2 の 4 設計成果物を照合する。
2. 単一 OAuth client 案、環境別 OAuth client 案、testing user 拡大のみ案を比較する。
3. secrets 平文混入、redirect URI drift、B-03 解除条件の曖昧化を MAJOR 条件として評価する。
4. MAJOR / MINOR / PASS のゲート判定を確定し、Phase 4 への進行可否を記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | 要件 / AC / 依存境界 |
| Phase 2 | `phase-02.md` | OAuth client / secrets / consent screen / runbook 設計 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | Auth.js session resolve と admin gate 契約 |
| skill | `.claude/skills/task-specification-creator/references/phase-template-core.md` | Phase 3 gate / MAJOR 戻り先 / simpler alternative の確認 |

## 代替案比較

### 案 1（採用）: 単一 OAuth client / 段階適用 runbook で staging+production を統合

| 観点 | 評価 |
| --- | --- |
| 価値性 | PASS（B-03 解除と staging evidence 上書きを 1 タスクで完結） |
| 実現性 | PASS（Google Cloud Console / Cloudflare Secrets / 1Password の既存運用と整合） |
| 整合性 | PASS（不変条件 / `02-auth.md` / `environment-variables.md` と整合） |
| 運用性 | PASS（runbook 化により再現可能） |

### 案 2（不採用）: staging と production で別 OAuth client / 別 consent screen

| 観点 | 評価 |
| --- | --- |
| 価値性 | MINOR（blast radius 限定の利点はあるが、verification を 2 重申請する追加コスト発生） |
| 実現性 | PASS |
| 整合性 | MAJOR（consent screen は project 単位で 1 つしか production publish できないため、verification 取得 client が drift） |
| 運用性 | MAJOR（secrets 配置表が 2 client 分に増え DRY 違反） |

→ MAJOR があるため不採用。

### 案 3（不採用）: testing user 拡大運用のみで verification 申請を保留

| 観点 | 評価 |
| --- | --- |
| 価値性 | MAJOR（B-03 解除されず、外部会員ログイン不能のまま本番公開不可） |
| 実現性 | PASS |
| 整合性 | MINOR |
| 運用性 | MAJOR（会員追加のたびに testing user 登録が必要、運用負債化） |

→ MAJOR があるため不採用。ただし B-03 解除条件 c（testing user 拡大）として案 1 内で暫定退避路として保持する。

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 1 | 真の論点（configuration 単一正本 + 段階適用）が Phase 1/2 で一貫 | PASS | index / phase-01 / phase-02 で同一表現 |
| 2 | AC-1〜AC-12 が index と phase-01 で完全一致 | PASS | 12 件すべて対応 |
| 3 | 単一 OAuth client / 単一 consent screen の方針が確定 | PASS | phase-02 §設計成果物 1 / 3 |
| 4 | scope が最小権限（openid / email / profile）に固定 | PASS | consent-screen-spec で固定 |
| 5 | secrets 配置表に実値が混入しない（`op://` 参照のみ） | PASS | phase-02 §設計成果物 2 |
| 6 | `wrangler login` 排除と `scripts/cf.sh` 単一経路 | PASS | phase-01 / phase-02 で再掲 |
| 7 | privacy / terms / home の 200 必須が runbook に明記 | PASS | phase-02 §設計成果物 3 / 4 |
| 8 | 段階適用フロー A→B→C のゲート条件が定義済 | PASS | phase-02 §段階間ゲート |
| 9 | B-03 解除条件 a/b/c の優先順位確定 | PASS | a > b > c |
| 10 | 不変条件（D1 直接アクセス禁止 / admin-managed data 分離 / GAS prototype 非昇格）違反なし | PASS | 本タスクは OAuth 設定のみ、D1 / Sheets には触らない |
| 11 | branch protection / solo 運用ポリシー違反なし | PASS | required_pull_request_reviews=null / scripts/cf.sh 経路維持 |
| 12 | screenshot に secret / token が映らない撮影方針 | PASS | Phase 5 runbook で再注意喚起する旨を Phase 2 で明示 |

→ 総合判定: **PASS**（MAJOR 0 / MINOR 0）

## ゲート判定基準

| 判定 | 条件 | 動作 |
| --- | --- | --- |
| MAJOR | 上表で MAJOR が 1 件以上 | Phase 2 に戻す |
| MINOR | MAJOR 0 / MINOR 1 件以上 | Phase 4 に進めるが Phase 12 で追従責務を記録 |
| PASS | MAJOR 0 / MINOR 0 | Phase 4 に進む |

## 完了条件チェックリスト

- [ ] 代替案 3 件の比較が記載済（採用 / 不採用 2 件の根拠付き）
- [ ] レビュー観点 12 件すべてに PASS / MINOR / MAJOR の判定
- [ ] 総合判定が PASS
- [ ] MINOR がある場合 Phase 12 追従項目に転記済（本仕様書では 0 件）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果と総合判定 |

## 統合テスト連携

| 連携先 | 本 Phase の扱い |
| --- | --- |
| Phase 4 test strategy | PASS 判定時のみ AC × test ID trace を作成可能にする |
| 05a smoke checklist | MAJOR 0 件の場合、実 OAuth client 接続版として Phase 11 で再実行する |
| `verify-all-specs.js` | 必須見出しと gate 判定の構造検証対象にする |

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ: 総合判定 PASS / 案 1 確定 / B-03 解除条件 a > b > c
- ブロック条件: MAJOR 1 件以上で Phase 2 に戻す
