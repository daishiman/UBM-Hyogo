# Phase 8: DRY 化 / 共通化 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: 本 Phase は runbook（`cf-token-rotation-runbook.md`）と自動 Issue 起票 workflow（`.github/workflows/cf-token-rotation-reminder.yml`）の章立て / yaml 構造に対し、既存の token rotation 系タスクや secret 自動配置 workflow との重複点を特定し、共通化（あるいは inline 維持）の判定を確定する。判定結果が runbook 本文 / yaml 実装の構造に直接影響するため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 8 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜7 で確定した 3 成果物（runbook / 実施記録テンプレ / `cf-token-rotation-reminder.yml`）に対し、以下 2 種の重複点を機械的に列挙し、(a) 共通化する / (b) 章立て規約のみ統一する / (c) inline 維持 のいずれかへ判定する。CONST_007 に従い「Phase XX で共通化」型の先送りは行わず、本 Phase で判定を確定させる。

1. **既存 token rotation 知見との重複**（D1 health DB token rotation との runbook 章立て）
2. **secret 自動配置 workflow との重複**（UT-25-DERIV-04 系の `.github/workflows/*` 構造）

## 重複検出対象

### A. runbook 章立て側

| # | 候補章立て | 既存類似 | 共通化判断 |
| --- | --- | --- | --- |
| A1 | 概要 / 周期選定根拠 | `task-ut-06-fu-h-health-db-token-rotation-001 / -sop-001`（D1 health DB token rotation SOP の §1 概要 / 周期） | 章立て規約として `docs/30-workflows/operations/` 配下の rotation runbook で見出し体系（概要 / 用語前提 / 事前確認 / staging / production / rollback / reminder / 実施記録 / 落とし穴）を共通化する。本文は対象 token ごとに固有 |
| A2 | 事前確認チェックリスト | 同上（D1 health DB の事前 health check） | 「対象 secret の whoami 相当 + 1Password expiry + 残期間 + 関連 deploy 健全性」の 4 項目テンプレを共通化規約として明示 |
| A3 | staging → production の段階分離 | 同上 | 章番号 §4=staging / §5=production / §6=rollback の固定 |
| A4 | rollback 手順 | 同上 | 「旧資源再有効化 → secret 再注入 → 新資源失効 → 履歴追記」の 4 step 規約を共通化 |
| A5 | 実施記録テンプレ | 同上の rotation log | テンプレ項目は対象 token に依存するため共通化せず inline。**ただし「Token 値・ID は記録しない」invariant のみ規約共通化** |
| A6 | 1Password expiry reminder 設定 | secret 全般で再利用される運用 | 章立て規約として「参照のみ・値非掲載」を共通化 |

### B. workflow yaml 側

| # | 候補要素 | 既存類似 | 共通化判断 |
| --- | --- | --- | --- |
| B1 | `permissions:` 最小権限ブロック | UT-25-DERIV-04 secret 自動配置 workflow / 既存 `.github/workflows/*` | yaml ファイル単独で完結させる。reusable workflow / composite action 化は **過早な抽象化** として inline 維持 |
| B2 | `gh issue create` を使った Issue 自動起票 step | 既存 `.github/workflows/verify-indexes.yml` 等の通知系 step | inline 維持。Issue title prefix `[cf-token-rotation]` は本タスク固有 |
| B3 | 経過日数算出（`date -u -d` を用いた `ELAPSED_DAYS` 計算） | 既存 workflow で類似断片なし | inline 維持。GNU date 依存は ubuntu-latest 前提として yaml コメントに残す |
| B4 | 重複起票防止（`gh issue list --search` で既存 open Issue 検出） | 一般的パターン | inline 維持 |
| B5 | dry-run 分岐（`workflow_dispatch.inputs.dry_run` choice） | 一般的パターン | inline 維持 |

## DRY 化方針

### 共通化判断基準

| 再利用回数 | 扱い |
| --- | --- |
| ≥ 3 件の rotation runbook で繰り返される章立て | 章立て規約として `docs/30-workflows/operations/README.md`（または同等 index）で共通化を **将来検討事項**として記録（本タスクでは規約だけ箇条書きにする） |
| 1〜2 件のみ | inline 維持 |

### 採用する DRY 化（本タスクで実施するもの）

1. **runbook 章立て規約の言語化**: A1〜A4・A6 の章立て骨格を「`operations/` 配下 rotation runbook 共通章立て」として `outputs/phase-08/main.md` に箇条書きで記録する。これは将来 D1 health DB rotation runbook（#245 系）が同 directory に置かれた際の整合の根拠となる。
2. **invariant 共通化**: 「Token 値 / Token ID / scope 値を runbook / log / yaml / コミットメッセージに書かない」を `phase-09` 品質ゲートで grep 検証する共通 invariant として固定する。

### 採用しない DRY 化（過早な抽象化として却下）

1. **reusable workflow / composite action 化**: 現時点で該当 yaml は本タスクのみ。`.github/workflows/_shared/` 配下に共通化する根拠（再利用 ≥ 3）が存在しないため inline 維持。
2. **`scripts/operations/` 配下の rotation 共通スクリプト**: rotation 操作は人手承認（G2）を挟むため自動化対象外。CLI ラッパは既存 `scripts/cf.sh` で十分。
3. **実施記録テンプレの汎用化**: 対象 token ごとに記録項目が異なる（D1 health DB rotation と Cloudflare API Token rotation でフィールドが揃わない）ため inline 維持。

## 既存共通モジュールの再利用箇所マトリクス

| 既存モジュール | 用途 | 本タスクでの呼出箇所 |
| --- | --- | --- |
| `scripts/cf.sh` | wrangler / Cloudflare API ラッパ。op run + esbuild 整合 + mise exec を内包 | runbook §3 事前確認の `whoami`、runbook §4 / §5 の deploy / d1 系コマンド全て |
| `scripts/with-env.sh` | `op run --env-file=.env` ラッパ | `gh secret set` を 1Password 値で実行する場面で間接利用（cf.sh が内部で呼ぶ） |
| `mise exec --` | Node 24 / pnpm 10 を保証 | 本タスクではローカル yaml lint（`actionlint` / `yamllint`）実行時に利用 |
| `gh` CLI | secret set / issue list / issue create / workflow run | runbook の `gh secret set --env <env>` 全箇所 + workflow yaml 内の `gh issue list` / `gh issue create` |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | secret 取り扱い正本 | runbook §1 / §2 / §7 から相対リンク参照。invariant の根拠として引用 |

## 起票テンプレ（共通化が必要と判定された場合）

本タスク内で「再利用 ≥ 3」が確認されないため、新規 unassigned-task 起票は **不要**。ただし将来 D1 health DB rotation runbook が同じ `operations/` 配下に揃った時点で、章立て規約の正式共通化（`docs/30-workflows/operations/README.md` 起票）を検討する旨を `outputs/phase-08/main.md` に記録する。

起票が必要になった場合のテンプレ:

```md
# task-operations-rotation-runbook-conventions-001

## title
`docs/30-workflows/operations/` 配下 rotation runbook の章立て規約共通化

## scope
- 共通章立て骨格（概要 / 用語前提 / 事前確認 / staging / production / rollback / reminder / 実施記録 / 落とし穴）
- invariant（Token 値 / ID / scope 値非掲載）
- 1Password expiry reminder の参照表記方法

## motivation
Cloudflare API Token rotation（issue-407）と D1 health DB token rotation（#245）以降、3 件以上の rotation runbook が `operations/` 配下に揃ったため、章立て骨格を README 化する。

## refs
- docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/phase-08.md
- docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md

## DoD
- README に章立て骨格 9 節 + invariant 1 件が記述されている
- 既存 runbook 2 件以上が README リンクで参照されている
```

## 実行手順（本 Phase の作業）

1. A1〜A6・B1〜B5 の重複候補を Phase 1〜7 で確定した runbook 章立て / yaml 構造に対して照合する。
2. 「再利用 ≥ 3」の閾値で共通化対象を判定する。
3. 採用する DRY 化 2 項目（runbook 章立て規約の言語化 / invariant 共通化）を `outputs/phase-08/main.md` に箇条書きする。
4. 採用しない DRY 化 3 項目を「却下理由」とともに同ファイルに記録する。
5. 既存共通モジュール 5 種の呼出箇所マトリクスを記録する。
6. 起票が不要であることと、将来起票テンプレを `outputs/phase-08/main.md` 末尾に残す。

## 参照資料

- `phase-01.md` / `phase-02.md` / `phase-03.md` / `phase-07.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- `docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `scripts/cf.sh` / `scripts/with-env.sh`
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール / シークレット管理）

## 統合テスト連携

- 上流: Phase 1〜7（章立て・yaml 構造・AC マトリクス）
- 下流: Phase 9（品質ゲートで invariant grep を検証） / Phase 12（章立て規約を documentation 更新履歴に明記）

## 多角的チェック観点

- 不変条件（Token 値 / ID / scope 値非掲載）が共通化規約として明文化されている
- reusable workflow 化を**選ばなかった**理由が CONST_007（過早な抽象化禁止）に整合している
- 既存共通モジュール（`scripts/cf.sh`）を回避していない（新規ラッパを作っていない）
- runbook 章立て規約が将来 D1 health DB rotation runbook と整合可能な抽象度に保たれている
- 共通化判断が「再利用 ≥ 3」の閾値で機械的に行われている

## サブタスク管理

- [ ] A1〜A6 / B1〜B5 を Phase 1〜7 成果物に対して再カウント
- [ ] 採用する DRY 化 2 項目を確定
- [ ] 却下する DRY 化 3 項目とその理由を確定
- [ ] 既存共通モジュール 5 種の呼出マトリクスを Phase 5 ランブック step に対応付け
- [ ] 将来起票テンプレを `outputs/phase-08/main.md` に保存
- [ ] `outputs/phase-08/main.md` を作成

## 成果物

- `outputs/phase-08/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み
- 採用 / 却下の判定が全 11 項目（A1-A6 + B1-B5）に付いている
- 既存共通モジュールの再利用箇所が Phase 5 ランブック step と対応している
- `.github/workflows/_shared/` を新規作成していない
- `scripts/operations/` 配下に新規スクリプトを作成していない

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] CONST_007（過早な抽象化禁止 / 先送り禁止）に違反していない
- [ ] 本 Phase で yaml / runbook 本文の実装、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ:
- 共通化された invariant（Token 値 / ID / scope 値非掲載）を grep ベース品質ゲートに昇格させる
- runbook 章立て規約 9 節を documentation lint の対象として渡す
- 共通モジュール再利用マトリクスを Phase 11 evidence 取得手順の根拠として渡す

## 実行タスク

- [ ] phase-08 の既存セクションに記載した手順・検証・成果物作成を実行する
