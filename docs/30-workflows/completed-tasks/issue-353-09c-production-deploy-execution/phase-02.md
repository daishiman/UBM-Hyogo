# Phase 2: 設計 — issue-353-09c-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

> Phase 1 で確定した AC × evidence path mapping、13 ステップ実行順序、自走禁止操作、blocker をもとに、実行構造（state machine）、依存 matrix、Cloudflare CLI wrapper 経路、D1 migration の dry-run/list/apply 段階分離、24h verification の自動化境界を設計する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-353-09c-production-deploy-execution |
| phase | 2 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 実装区分 | 実装仕様書（runbook execution + evidence collection） |

## 目的

Phase 1 出力を起点に、後続実行サイクル（Phase 5 実装ランブック / Phase 11 手動 smoke 実測）が機械的に進められる粒度で設計を確定する。

具体成果:

1. 13 ステップの state machine（pending → in_progress → done / blocked / rollback）
2. 依存 matrix（step → 上流 step / approval gate / evidence path）
3. evidence path 設計（`outputs/phase-11/` ファイル一覧）
4. rollback / skip 条件
5. Cloudflare CLI wrapper（`bash scripts/cf.sh`）経路の設計（環境変数注入、esbuild binary 解決、Node 24 保証）
6. D1 migration の dry-run / list / apply 段階分離
7. 24h verification の自動化境界（手動 metrics 取得 vs スクリプト化範囲）

## 実行タスク

1. Phase 1 outputs/phase-01/main.md の AC × evidence path mapping を読み、各 step の入出力境界を確定する。完了条件: step ごとに「入力（前 step の evidence / approval log）」と「出力（evidence file）」が決まる。
2. 13 ステップの state machine を設計する。完了条件: step transition 図と blocked / rollback 分岐が明確。
3. Cloudflare CLI wrapper 経路を設計する。完了条件: `bash scripts/cf.sh` 経由のコマンドが具体的な引数まで確定する。
4. D1 migration の段階分離を設計する。完了条件: list（read-only）→ apply（mutation）の境界と user approval gate が決まる。
5. 24h verification の自動化境界を確定する。完了条件: 手動取得項目とスクリプト化項目が決まる。
6. outputs/phase-02/main.md に上記すべてを集約する。

## 参照資料

- `docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-01/main.md`（Phase 1 確定事項）
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-02/main.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-02/production-deploy-flow.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

## 実行手順

- 対象 directory: `docs/30-workflows/issue-353-09c-production-deploy-execution/`
- Phase 2 では仕様書（phase-02.md）と outputs/phase-02/main.md のみを書く。
- D1 database name は `ubm-hyogo-db-prod`（infrastructure-runbook 正本）に統一する。
- Cloudflare CLI は `bash scripts/cf.sh` 経由のみ。

## 統合テスト連携

- 上流: Phase 1 の AC × evidence mapping、13 ステップ実行順序、自走禁止操作、blocker
- 下流: Phase 3（設計レビュー）が代替案・リスク・GO/NO-GO を確定する起点になる

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 と各 step の対応
- mutation / read-only の境界が approval gate と整合
- rollback path が main path と独立に追えるか
- evidence path が AC と 1:1 で対応し続けるか
- secret 値が evidence に転記される経路を作っていないか

## サブタスク管理

- [ ] Phase 1 outputs/phase-01/main.md を確認する
- [ ] 13 ステップの state machine を確定する
- [ ] step → 上流 step / approval gate / evidence path の依存 matrix を作る
- [ ] Cloudflare CLI wrapper の経路を設計する
- [ ] D1 migration の段階分離を確定する
- [ ] 24h verification の自動化境界を確定する
- [ ] rollback / skip 条件を確定する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- `outputs/phase-02/main.md`（state machine / 依存 matrix / evidence path 設計 / rollback 設計 / Cloudflare CLI 経路 / D1 段階分離 / 24h verification 自動化境界）

## 完了条件

- [ ] 13 ステップの state machine が完成
- [ ] 依存 matrix（step × 上流 / approval / evidence）が完成
- [ ] evidence path が `outputs/phase-11/` の具体ファイル名で決まる
- [ ] rollback / skip 条件が明文化される
- [ ] Cloudflare CLI wrapper の引数が確定する
- [ ] D1 migration の list / apply が approval gate と接続する
- [ ] 24h verification の自動化境界が決まる

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] Phase 1 の決定事項を再否定していない
- [ ] 仕様書作成タスクであり、実装・deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 3（設計レビュー）へ次を引き渡す:

- state machine（13 ステップ）
- 依存 matrix
- evidence path 設計
- rollback / skip 条件
- Cloudflare CLI 経路
- D1 段階分離
- 24h verification 自動化境界
