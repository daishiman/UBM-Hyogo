# Phase Template Phase13

## 対象

Phase 13 の PR 作成。

## ルール

1. user の明示承認がない限り blocked のままにする。
2. ローカル確認を省略しない。
3. commit / PR を自動で作らない。

## quick-summary（Phase 13 必須成果物 4 点）

| 必須成果物 | 役割 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | **必須**: typecheck / lint / build などローカル検証ログを記録 |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前にユーザーに提示） |
| `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |

> **`local-check-result.md` は見落としやすい必須成果物**。Phase 13 着手時の最初のチェックリストに含めること。

## 最低限の記録

- なぜ blocked か
- user approval の有無
- Phase 12 までの完了根拠
- local check の結果要約（→ `outputs/phase-13/local-check-result.md` に必ず記録）
- `outputs/phase-13/local-check-result.md` と `outputs/phase-13/change-summary.md` の作成有無
- `pr-info.md` / `pr-creation-result.md` を作成できる状態か

## approval-gated NON_VISUAL implementation パターン（追加）

> 適用条件: `taskType=implementation` かつ `visualEvidence=NON_VISUAL` で、不可逆 API（branch protection PUT / Cloudflare deploy / D1 migration apply 等）を Phase 13 で実行する場合。
> 実例: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md`（UT-GOV-001 second-stage reapply）。

### 三役ゲート（user 承認 / 実 PUT 実行 / push & PR）

Phase 13 は以下 3 つのゲートを **同一 Phase 内で直列に** 通す。各ゲートは独立しており、前段が PASS しない限り次段を実行しない。

| # | ゲート | 通過条件 | Claude が実行可か |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | change-summary + 実行 plan + rollback location を提示し、user の **明示文言** で承認取得 | 承認取得まで実行禁止 |
| 2 | 実 PUT / deploy / migration apply ゲート | ゲート 1 PASS 後、適用前 GET → 不可逆 API → 適用後 GET → 集合一致確認 | ゲート 1 後にのみ実行 |
| 3 | push / PR 作成ゲート | ゲート 2 PASS 後、コミット粒度ごとに commit → push → `gh pr create` | ゲート 2 後にのみ実行 |

> 曖昧な合意（「いいよ」程度）では実行しない。`change-summary.md` を提示した上での明示指示を要件とする。

### rollback payload 上書き禁止（merge前 / merge後で別ファイル分離）

- 上流タスク（first stage）で生成した `outputs/phase-05/rollback-payload-{branch}.json` は **再利用のみ・上書き禁止**。
- 本タスクの second-stage 用 rollback が必要な場合は別ファイル名で保存する（例: `outputs/phase-05/rollback-payload-second-stage-{branch}.json`）。
- PR merge **前** rollback と merge **後** rollback は判断基準が異なるため、それぞれ別 section として `rollback-judgement.md` に記述する。
- payload を branch 別に分離（dev / main を 1 ファイルに統合しない）し、片側失敗時に他方を独立 rollback 可能にする。

### コミット粒度 5 単位

不可逆 governance / infra タスクの PR は、レビュー / revert を branch 別に容易にするため、以下 5 単位で粒度を分離する。

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | spec（仕様書本体） | `docs/30-workflows/<task>/phase-*.md` / `index.md` / `artifacts.json` |
| 2 | outputs（設計 / runbook / drift 等の生成物） | `outputs/phase-01〜phase-12/` |
| 3 | impl evidence（実 API 応答の証跡） | `outputs/phase-13/branch-protection-{current,applied}-{dev,main}.json` 等 |
| 4 | docs / skill sync（同 wave 同期） | `.claude/skills/**/SKILL.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` |
| 5 | LOGS row（完了行追記） | `docs/30-workflows/LOGS.md` |

> impl 系（test / config 等）が独立して存在する一般タスクでは「spec / config / impl / test / docs」の 5 単位に読み替える。本パターンの本質は **revert 単位 = commit 単位** を保つこと。

### Phase 13 fresh GET を applied evidence として採用

- Phase 5 / Phase 11 で採取した GET は **設計 / 事前検証** の証跡。Phase 13 の applied evidence にしない。
- Phase 13 で実 PUT 直後に取得し直した fresh GET（`outputs/phase-13/branch-protection-applied-{dev,main}.json`）を **唯一の applied evidence** とする。
- 集合一致は `outputs/phase-02/expected-contexts-{dev,main}.json` と Phase 13 fresh GET を `jq -S '.|sort'` 比較する。

### Issue 参照は `Refs #<issue>` を採用、`Closes` は禁止

- 上流 Issue が CLOSED のまま運用されているケース（後追い適用 / second-stage reapply）では、`Closes #<n>` を使うと Issue が誤って再 close 試行される。
- 本パターンでは PR body / commit message ともに `Refs #<issue>` のみ使用する。
- Issue クローズアウトは `gh issue comment` の二段階（Phase 12 = 仕様書化完了 / Phase 13 = 実 PUT 完了）で行う。

## 関連ガイド

- [review-gate-criteria.md](review-gate-criteria.md)
- [commands.md](commands.md)
- [phase-template-phase13-detail.md](phase-template-phase13-detail.md) — 詳細テンプレ + approval-gated 詳細手順
- [phase-12-spec.md](phase-12-spec.md) — Phase 12 必須 7 成果物 + same-wave sync
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) — NON_VISUAL 代替証跡
- [quality-gates.md](quality-gates.md) — 承認ゲート / 検証コマンド
- 実例: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md`
