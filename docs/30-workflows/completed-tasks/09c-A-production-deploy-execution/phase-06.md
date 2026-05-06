[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 6: 異常系検証 — 09c-A-production-deploy-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 6 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |

## 目的

production deploy の各 Step で起こり得る異常系（D1 migration 失敗 / deploy exit ≠ 0 / smoke fail / observability 沈黙 / 24h metrics 異常 / Cloudflare API token revoked / esbuild version mismatch 等）を列挙し、検知方法・分岐先（rollback / incident）・evidence path・09b incident runbook への引き渡し手順を確定する。

## 実行タスク

1. 異常系 9 種類を `outputs/phase-06/main.md` に列挙し、Step との対応・検知方法・mitigation を明示する。
2. 各異常系の evidence path（`outputs/phase-11/anomaly-<type>.md`）を定義する。
3. 09b incident runbook への escalation 手順を記述する。
4. Phase 5 rollback 3 種類との接続を明示する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-05/main.md | 8 Step + rollback 経路 |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-04/main.md | 5 層 verify suite |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-03/main.md | risk R1〜R12 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | Severity 表 / Rollback 基準 |
| 参考 | docs/30-workflows/completed-tasks/09c-serial-*/phase-06.md | failure case 13 件の構造 |

## 実行手順

### ステップ 1: 異常系 9 種類の列挙

Step 単位で発生する異常系を 9 種類に絞り（A タスクのスコープ）、それぞれを `outputs/phase-06/main.md` に表化する。

### ステップ 2: 検知方法の固定

検知方法は次の 5 経路に分類する:

- exit code（deploy / typecheck / build）
- Cloudflare CLI stderr（migration / deploy）
- HTTP smoke（curl 5xx / 4xx）
- SQL（`sync_jobs` 状態）
- observability 通知（Sentry / Slack / 09b-A）

### ステップ 3: mitigation 分岐

各異常系を「rollback 経路（Phase 5 §9 A/B/C）」「incident escalation（09b）」「差し戻し（該当 wave）」のいずれかに分岐させる。

### ステップ 4: evidence path 定義

異常発生時のみ作成する evidence は `outputs/phase-11/anomaly-<type>.md` 命名で統一する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | rollback A/B/C を異常系 mitigation に再利用 |
| Phase 7 | negative AC matrix の base |
| Phase 11 | 異常発生時のみ実 evidence を取得 |
| 上流 09b | incident response runbook へ escalation |

## 多角的チェック観点

- 異常時にも不変条件 #5 / #6 / #14 を破壊しない（rollback 経路で復元）
- secret 値を mitigation log に転記しない
- silent failure を PASS と扱わない（沈黙時は WARN として記録）

## サブタスク管理

- [ ] 異常系 9 種類を `outputs/phase-06/main.md` に列挙
- [ ] 検知経路 5 種を分類
- [ ] mitigation 分岐を 3 経路で記述
- [ ] evidence path（`anomaly-<type>.md`）を定義

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 異常系 9 種 + 検知 + mitigation + evidence |

## 完了条件

- [ ] 9 種すべてに Step / 検知 / mitigation / evidence が記述される
- [ ] 09b incident runbook への引き渡し手順が記述される
- [ ] Phase 5 rollback 3 種への接続が明示される

## タスク100%実行確認

- [ ] outputs/phase-06/main.md が完成
- [ ] silent failure を PASS と扱わない方針が明示される
- [ ] secret 値を含まない

## 次 Phase への引き渡し

- 異常系 9 種を Phase 7 の negative AC matrix に再利用
- evidence 命名規約（`anomaly-<type>.md`）を Phase 11 に
