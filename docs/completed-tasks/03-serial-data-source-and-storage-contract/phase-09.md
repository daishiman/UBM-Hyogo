# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| implementation_mode | new |
| visibility | NON_VISUAL |

## 目的

Phase 8 の DRY 化結果を入力に、Sheets→D1 data contract 仕様の品質を 4 観点（runbook link 整合 / D1 migration 互換性 / Secrets placeholder / 不変条件遵守）でスキャンし、Phase 10 の gate 判定に必要な qa-report を確定する。コード実装は行わない。

## 実行タスク

- runbook link 切れチェック（d1-bootstrap-runbook / sync-deployment-runbook）
- D1 schema migration の forward / backward compatibility 確認
- Secrets placeholder 化チェック（実値混入禁止）
- CLAUDE.md 不変条件 1〜7 違反スキャン
- 命名規則・参照整合性・無料枠遵守チェック

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-08/refactor-record.md | DRY 化結果（QA の起点） |
| 必須 | outputs/phase-02/data-contract.md | schema 正本 |
| 必須 | outputs/phase-05/d1-bootstrap-runbook.md | runbook link 検証対象 |
| 必須 | outputs/phase-05/sync-deployment-runbook.md | runbook link 検証対象 |
| 必須 | CLAUDE.md | 不変条件 1〜7 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 migration 手順 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |

## 実行手順

### ステップ 1: link 整合性スキャン
- runbook 内 anchor / 相対 path / outputs/phase-XX 参照を列挙し、存在しないものを link 切れとして記録する。
- index.md / phase-02 / phase-05 / phase-08 と相互参照が双方向で生きているか確認する。

### ステップ 2: D1 migration 互換性レビュー
- forward: 新 schema を旧コードが読んでも例外を出さないかを表で判定。
- backward: 旧 schema 行が新コードから NULL / default で読めるかを表で判定。
- breaking change がある場合は rollback 手順への参照を必須化する。

### ステップ 3: Secrets / 不変条件スキャン
- placeholder 以外の実値（base64 / JSON 断片 / OAuth token 等）の混入を 0 件確認。
- 不変条件 1〜7（schema 固定しすぎ / consent キー / responseEmail / admin-managed 分離 / D1 直接アクセス / GAS prototype / Form 再回答）への違反を表で記録。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | qa-report.md を gate 判定根拠として使用 |
| Phase 7 | AC-1〜AC-5 トレース結果と突合 |
| Phase 8 | refactor-record.md の Before/After を再検証 |
| Phase 12 | spec sync 時の品質基準として参照 |

## 多角的チェック観点（AIが判断）

- 価値性: 品質指摘が下流 task（04 / 05a / 05b）の手戻りを減らすか。
- 実現性: 無料運用スコープ内で全 QA 項目が完結するか。
- 整合性: 不変条件 1〜7 と一切矛盾しないか。
- 運用性: link 切れ・migration breaking が rollback runbook に紐づいているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook link 切れスキャン | 9 | completed | d1-bootstrap / sync-deployment |
| 2 | migration 互換性表作成 | 9 | completed | forward / backward |
| 3 | Secrets placeholder 確認 | 9 | completed | 実値 0 件 |
| 4 | 不変条件 1〜7 スキャン | 9 | completed | CLAUDE.md 起点 |
| 5 | qa-report.md 確定 | 9 | completed | outputs/phase-09/qa-report.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/qa-report.md | QA 結果（主成果物） |
| ドキュメント | outputs/phase-09/main.md | Phase 9 サマリー |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

依存Phase 5: `outputs/phase-05/d1-bootstrap-runbook.md` / `outputs/phase-05/sync-deployment-runbook.md`

依存成果物参照: `outputs/phase-05/d1-bootstrap-runbook.md` / `outputs/phase-05/sync-deployment-runbook.md`

- [ ] link 切れ 0 件、または残件は Phase 10 blocker として登録済み
- [ ] D1 migration の forward / backward 判定が全行埋まっている
- [ ] Secrets 実値混入 0 件
- [ ] 不変条件 1〜7 違反 0 件
- [ ] qa-report.md が Phase 10 から参照可能な状態

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（rollback 不能 migration / 実値混入 / GAS 持ち込み）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: qa-report.md の判定結果と未解消 blocker を Phase 10 に渡す。
- ブロック条件: 不変条件違反 1 件以上、または実値 secret 混入が残る場合は Phase 10 へ進まない。

## runbook link 切れチェック表

| runbook | 参照先 | 期待 path | 判定 |
| --- | --- | --- | --- |
| d1-bootstrap-runbook | data-contract | outputs/phase-02/data-contract.md | TBD（実行時確定） |
| d1-bootstrap-runbook | rollback 手順 | deployment-core.md | TBD |
| sync-deployment-runbook | sync-flow | outputs/phase-02/sync-flow.md | TBD |
| sync-deployment-runbook | constants | outputs/phase-08/refactor-record.md | TBD |

## D1 migration 互換性チェック表

| 変更種別 | forward 互換 | backward 互換 | rollback 参照 |
| --- | --- | --- | --- |
| 列追加（NULL 許容） | OK | OK | runbook §rollback |
| 列削除 | NG（要 view） | NG | runbook §rollback |
| 列リネーム | NG（view 経由必須） | NG | runbook §rollback |
| index 追加 | OK | OK | 不要 |

## Secrets 漏洩チェック

- 実値（JSON / token / base64）を一切書いていない
- 1Password を local canonical としている（CLAUDE.md Secrets 管理）
- Cloudflare Secrets と GitHub Secrets / Variables の配置先が混線していない
- `GOOGLE_SERVICE_ACCOUNT_JSON` は placeholder 表記のみ

## 不変条件違反スキャン（CLAUDE.md 1〜7）

| # | 不変条件 | 対象 phase | 判定 |
| --- | --- | --- | --- |
| 1 | schema をコードに固定しすぎない | 02 / 08 | TBD |
| 2 | consent キー統一 | 02 / 08 | TBD |
| 3 | responseEmail は system field | 02 | TBD |
| 4 | admin-managed data 分離 | 02 / 05 | TBD |
| 5 | D1 直接アクセスは apps/api 限定 | 02 / 05 | TBD |
| 6 | GAS prototype を本番化しない | 全 phase | TBD |
| 7 | Form 再回答を本人更新経路とする | 02 | TBD |

## 命名規則 / 無料枠チェック

| 対象 | 基準 / 判定 |
| --- | --- |
| task dir | wave + mode + kebab-case / TBD |
| secret 名 | ALL_CAPS_SNAKE_CASE / TBD |
| D1 schema 列名 | snake_case / TBD |
| D1 行数・DB サイズ | 無料枠内 / TBD |
| sync cron 頻度 | Workers 無料枠内 / TBD |
