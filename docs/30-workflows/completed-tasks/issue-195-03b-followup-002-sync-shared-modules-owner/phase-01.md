# Phase 1: 要件定義

[実装区分: 実装仕様書]
判定根拠: ユーザー方針変更により今回サイクルで code 化する。owner 表の運用化のため `_shared/` モジュール skeleton と CODEOWNERS 行を実装する最小スコープ。既存ロジックの物理移管・置換は後続タスク化。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-03b-followup-002-sync-shared-modules-owner |
| Phase | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | governance |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

03a / 03b 並列 wave で共同利用される sync 共通モジュール（`apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts`）の **owner / co-owner / 変更ルール** を spec 文書に明文化し、今後の並列開発で同一ファイルへの semantic drift・merge 衝突・PII redact 漏れを spec 段階で防ぐ。

## 真の論点（true issue）

- **論点 1（保管場所）**: owner 表を `docs/30-workflows/_design/` 配下の新規 markdown とする。既存 `02-application-implementation/_design/` に倣い、ワークフロー横断の設計成果物として `_design/` 階層を確立する。
- **論点 2（粒度）**: 表は最低限「ファイル / owner / co-owner / 必須レビュアー / 備考」の 5 列。owner 確定基準は **既存実装の歴史的経緯（03a 先行実装）** に従い、03a を owner、03b を co-owner として記録する。
- **論点 3（リンク責務）**: 03a / 03b の `index.md` (現在は `completed-tasks/` 配下) から owner 表へ 1 ホップで到達可能にする。これにより以後の sync 系タスクが owner 表を必ず通る導線になる。
- **論点 4（未割当 #7 との関係）**: `sync_jobs` の `job_type` enum / `metrics_json` schema 集約タスク（未割当 #7）は本 owner 表を **foundation** として参照する形にし、本タスクで schema 集約自体は実施しない。
- **論点 5（成果物の拘束力）**: owner 表は AC として「2 ファイル以上の行を持つ表」「変更ルール文の存在」までを必須とし、将来の sync 系モジュール追加に伴う行追加は後続タスクで実施する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流参照 | completed-tasks/03b-...-followups/03b-followup-002-sync-shared-modules-owner.md | 既存 draft 本文 | 整理済 owner 表 |
| 上流参照 | apps/api/src/jobs/_shared/（将来 path） | 対象モジュール想定一覧 | owner 表行 |
| 後続 | 未割当 #7（job_type / metrics_json 集約） | 本表 foundation | schema 集約タスク仕様への参照点 |

## 価値とコスト

- **初回価値**: sync 共通モジュールの責任所在が spec で明示され、03a / 03b 以降の sync wave が「owner に変更提案 PR を出す」明確なフローを得る。
- **初回で払わないコスト**: 対象モジュールの新規実装、`sync_jobs` schema 集約、skill 本体の dependency matrix 改修。
- **トレードオフ**: `_design/` 階層を新設することで、`02-application-implementation/_design/` との重複が将来発生しうる。後者は実装ワークフロー固有設計、本タスクの `_design/` は workflow 横断 governance 設計と位置付けて重複を避ける。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 並列 wave の owner 不在に起因する drift / 衝突を spec 段階で予防できるか | PASS | owner 表 1 ホップ参照を 03a / 03b index.md から強制 |
| 実現性 | code / NON_VISUAL として `_shared/` skeleton + tests + CODEOWNERS + owner 表更新で完結するか | PASS | 既存 draft にコード実体化スコープを加えた最小実装で成立 |
| 整合性 | 不変条件 #5 / #6 と整合するか | PASS | apps/api / apps/web / D1 / GAS prototype に触れない |
| 運用性 | 後続 sync 系タスクが owner 表を必ず通る導線か | PASS | 03a / 03b index.md からのリンクが gate |

## Schema / 共有コード Ownership 宣言

| 対象 | 旧 owner | 新 owner | 移管理由 |
| --- | --- | --- | --- |
| `apps/api/src/jobs/_shared/ledger.ts` | 不在（暗黙の 03a） | 03a（co-owner: 03b） | 並列開発時の semantic drift 防止 |
| `apps/api/src/jobs/_shared/sync-error.ts` | 不在（暗黙の 03a） | 03a（co-owner: 03b） | error code / PII redact 経路の単一化 |
| `_design/sync-shared-modules-owner.md` 自体 | — | issue-195（本タスク） | 本タスクで新規確立 |

## 実行タスク

- [ ] 既存 draft（completed-tasks 配下）の本文を再読し、流用範囲を確定する
- [ ] AC-1〜7 を quantitative に書き起こす（成果物 / 実行コマンド単位）
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（`_design/README.md` 要否、未割当 #7 への参照表現）を記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-002-sync-shared-modules-owner.md | 既存 draft |
| 必須 | docs/30-workflows/02-application-implementation/_design/ | `_design/` 先行例 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5 / #6 |

## 多角的チェック観点

- 不変条件 #5: 新規コードは `apps/api/src/jobs/_shared/` に限定し、`apps/web` と D1 schema boundary に触れない
- 不変条件 #6: GAS prototype を canonical workflow に昇格させない
- secret hygiene: owner 表本文に API token / OAuth secret 等の実値を含めない（Phase 9 で gate 化）

## 完了条件

- AC-1〜7 が quantitative に表現されている
- 4 条件評価が PASS で揃い根拠が記録されている
- `outputs/phase-01/main.md` に決定事項サマリが記録されている

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
