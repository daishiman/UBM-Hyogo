# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-07 |
| 前 Phase | 2（設計） |
| 次 Phase | 4（検証戦略） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持） |
| Gate Phase | ✅（Phase 1 / Phase 2 戻し判定を行うゲート） |

## 目的

Phase 1（要件定義）と Phase 2（設計）の出力を、5 観点（AC 充足 / silent-skip 経路の整合 / Secrets 露出リスク / 既存 lib との DRY 整合 / Issue #517 再 OPEN 禁止徹底）と 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、MAJOR / MINOR / PASS を確定する。MAJOR が 1 件でも検出されれば Phase 1 / Phase 2 へ戻す。GO 判定で Phase 4 へ進める。

---

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 観点ごとに base case が AC / NFR を充足 | そのまま採用 |
| **MINOR** | 軽微な懸念あり（後続 Phase で吸収可能） | base case 維持。Phase 4 / 5 で追補 |
| **MAJOR** | AC 未充足 / Secrets 露出 / silent-skip 設計矛盾 / DRY 違反 / Issue 再 OPEN 含意 | **Phase 1 or Phase 2 に差し戻し** |

戻し先決定ルール:

- 「機能要件 / 非機能要件 / 変更対象ファイル / 制約」関連 → Phase 1 戻し（MAJOR 戻り）
- 「workflow YAML / 関数構造 / exit code / 失敗パターン」関連 → Phase 2 戻し（MINOR/MAJOR 戻り）

---

## 設計分岐点の確定記録

`index.md` の D-1〜D-10 を本ゲートで再確認し、最終確定する:

| ID | 分岐点 | 最終確定値 | 確定根拠 |
| --- | --- | --- | --- |
| D-1 | cron 起動時刻 | `0 1 * * *` UTC | post-release-dashboard.yml が UTC 00:00 起動。1h 後の 01:00 で履歴確定 |
| D-2 | gh run list limit | 80 | issue-497 互換 |
| D-3 | 30 日 gate 判定 | 最古 schedule run.createdAt <= today - 30d | issue-497 Phase 2 軸 1-1 と同式 / ISO 8601 文字列比較 |
| D-4 | 重複 PR 検出キー | title prefix `[auto-summary] post-release-dashboard 30d` + 同月 (YYYYMM) | 月次集計の自然な粒度 |
| D-5 | branch 命名 | `auto/post-release-30day-summary-YYYYMM` | force-push 不可・同月内一意 |
| D-6 | redaction patterns | `token` / `bearer` / `secret` / `Authorization` | issue-497 / issue body 一致 |
| D-7 | failure 比率しきい値 | `>= 10%` | issue-497 / issue body 一致 |
| D-8 | Slack payload 行数上限 | 5 行 | issue body 明示 |
| D-9 | dry-run 入口 | `--dry-run` flag / `dry_run` workflow input | ローカル / GHA 同型性 |
| D-10 | Slack channel bootstrap | `w1618436027-ek2505248` を通知先 channel とし、Phase 11 preflight で Incoming Webhook bind / Secret 登録 / test post を確認 | issue body 明示 / Slack App 化を避けるため手動 preflight に限定 |

確定後は Phase 4 以降で D-1〜D-10 を **不変** として扱う。

---

## レビュー観点

### 観点 1: Phase 2 設計が AC-1〜AC-10 を充足するか

| AC | 充足要素（Phase 2 出力） | 判定方法 |
| --- | --- | --- |
| AC-1（cron + silent skip） | 軸 1-1 schedule + 軸 2-3 step 6 | YAML cron 値と is_30day_gate_satisfied 分岐の双方確認 |
| AC-2（PR body に 4 集計） | 軸 2-2 aggregate_runs + render_pr_body | 集計 JSON schema 4 項目 (conclusion_dist / longest_failure_streak / failure_rate / 原因分類) 網羅 |
| AC-3（Slack 5 行 + PR URL） | 軸 2-2 render_slack_payload + post_slack | 5 行制限の固定 / PR URL 引数化 |
| AC-4（重複 PR スキップ） | 軸 2-3 step 7 + find_existing_pr | YYYYMM 粒度 + Slack 送信なし明示 |
| AC-5（redaction） | 軸 2-3 step 8 + 軸 5-2 既存 lib | パターン 4 件固定 |
| AC-6（failure>=10% 検討節） | 軸 2-2 render_pr_body + 軸 4 早見表 | しきい値 0.10 が render_pr_body 内に固定 |
| AC-7（dispatch + dry_run） | 軸 1-1 inputs + 軸 2-6 dry-run mode | inputs.dry_run boolean / DRY_RUN env 流入 |
| AC-8（ローカル --dry-run） | 軸 2-6 | step 11〜13 スキップが明示 |
| AC-9（Phase 12 7 成果物） | Phase 12 で扱う（本ゲートでは引き継ぎ） | 出力契約に skill-references-diff / changelog 等が含まれる予定 |
| AC-10（4 条件 PASS） | Phase 1 / Phase 2 の 4 条件表 | 全 PASS が根拠付き |

**判定**: 全 AC が Phase 2 出力にマップ可能であれば PASS。1 件でも欠落があれば対応戻し先（Phase 1 / 2）へ MAJOR 差し戻し。

### 観点 2: silent-skip 経路と副作用 step の境界整合

| 確認項目 | 期待状態 |
| --- | --- |
| gate 不成立 silent skip → exit 0 / Slack 送信なし | 軸 2-3 step 6 / 軸 4 早見表で固定 |
| 重複 PR silent skip → exit 0 / Slack 送信なし | 軸 2-3 step 7 / 軸 4 早見表で固定 |
| dry-run → step 11〜13 全スキップ / exit 0 | 軸 2-6 で固定 |
| Slack POST 失敗 → exit 3 / PR は残置 | 軸 2-5 / 軸 4 で固定 |
| `set -euo pipefail` 配下で各関数が動作 | 軸 2-2 冒頭で固定 |

**判定方法**: 上記 5 経路のうち 1 件でも「副作用が漏れる」「exit code が曖昧」「Slack 送信が gate 後に走る」設計があれば MAJOR（Phase 2 戻し）。

### 観点 3: SLACK_WEBHOOK_URL の露出リスク評価

| 確認項目 | 期待状態 |
| --- | --- |
| `SLACK_WEBHOOK_URL` は GHA `secrets:` 経由のみ流入 | 軸 1-1 env block で確認 |
| script は環境変数経由でのみ参照（コードに直書きしない） | 軸 2-2 post_slack 設計 |
| log / PR body / Slack payload に webhook URL を echo しない | redaction patterns に `secret` / `token` 含むため自動防御 + post_slack 内で `set +x` |
| README / ドキュメントに実値を記載しない | NFR-3 / CLAUDE.md 方針 |
| dry-run 実行時に Webhook URL 未設定でも fail しない | 軸 2-6 で「read-only operation のみ」明示 |
| channel bootstrap が Phase 11 preflight にあり、workflow / shell script が Slack channel 作成 API を持たない | Slack App / Bot OAuth 化を避ける |

**判定方法**: 6 件中 1 件でも違反があれば MAJOR（Phase 1 / 2 戻し）。

### 観点 4: 既存 lib との DRY 整合（`lib/redaction-check.sh`）

| 確認項目 | 期待状態 |
| --- | --- |
| 既存 `lib/redaction-check.sh` の 4 パターン (`token` / `bearer` / `secret` / `Authorization`) を本タスクでも採用 | D-6 で固定 |
| `redact_log()` は既存 lib を source または同等パターン共有 | 軸 5-2 で明示 |
| redaction ロジックの重複実装禁止 | Phase 1 「変更対象ファイル」変更しないファイル節で固定 |
| Phase 5 実装 runbook で「source による再利用 vs 関数同名 import」のいずれかを最終確定する引き継ぎ | 軸 5-2 末尾で言及 |

**判定方法**: パターンセット不一致または重複実装方針が検出されれば MINOR（Phase 2 戻し / Phase 5 補強）。完全整合なら PASS。

### 観点 5: GitHub Issue #517 を再 OPEN しない方針が全 Phase で徹底されているか

| 確認項目 | 期待状態 |
| --- | --- |
| index.md の GitHub Issue 欄に「CLOSED 維持・再 OPEN しない」明示 | ✅ |
| Phase 1 / Phase 2 メタ情報・参照資料・本文に `gh issue reopen` を含まない | ✅ |
| PR 文面が `Refs #517, Refs #497, Refs #351` で統一（`Closes` / `Fixes` 不使用） | index.md / Phase 1 で固定 |
| draft PR の auto-create コマンド (`gh pr create --draft`) が `Closes #517` を含まない | 軸 2-3 step 12 確認 |

**判定方法**: 全 Phase 文書を `gh issue reopen` / `Closes #517` / `Fixes #517` で grep。検出ゼロなら PASS。1 件でも検出されれば MAJOR（Phase 1 戻し）。

---

## レビューチェックリスト

- [ ] 変更対象ファイル一覧（Phase 1）と関数構造（Phase 2）の対応が 1:1
- [ ] FR-1〜FR-12 がすべて Phase 2 の軸 1〜5 にマッピング済
- [ ] NFR-1〜NFR-7 が軸 1-2（YAML 値）/ 軸 2-2（関数契約）/ 軸 4（失敗パターン）に反映済
- [ ] AC-1〜AC-10 と Phase 2 出力の対応表（観点 1）に欠落なし
- [ ] silent-skip 3 経路（gate / 重複 PR / dry-run）が exit 0 で統一
- [ ] exit code 0 / 2 / 3 / 64 が一意定義
- [ ] permissions が least-privilege（`contents: write` / `pull-requests: write` / `actions: read` のみ）
- [ ] `SLACK_WEBHOOK_URL` が log / PR body / Slack payload に echo されない設計
- [ ] Slack channel bootstrap が Phase 11 preflight に限定され、Slack App / Bot OAuth 実装が混入していない
- [ ] 既存 `lib/redaction-check.sh` の DRY 再利用方針が固定
- [ ] aiworkflow-requirements `references/deployment-gha.md` 章追加方針が変更対象ファイル一覧に含まれる
- [ ] CONST_005 必須項目（変更対象ファイル / 関数 / 入出力 / テスト / ローカル実行 / DoD）が Phase 1 / 2 のいずれかで網羅
- [ ] CONST_007 スコープ単一性: alert / retry / Slack App 化が本仕様書本文に混入していない
- [ ] Issue #517 再 OPEN を含意する記述ゼロ

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Phase 2 設計が AC-1〜AC-10 全件を充足し、機械的再現性と silent-skip 安全を確立。dry-run 同型性で運用 onboarding コスト最小化 |
| 実現性 | PASS | gh / jq / curl / git のみで完結し、GHA permissions / Secrets / cron / draft PR は標準。timeout 10 分の安全 margin |
| 整合性 | PASS | 不変条件 1〜7 すべて影響なし。既存 redaction lib を再利用し DRY 整合。issue-497 仕様書を改変しない |
| 運用性 | PASS | exit code semantics 4 種が一意で運用判別可能。gate / 重複 PR / dry-run / Slack 失敗 の 4 経路の挙動が早見表で固定 |

---

## ゲート判定（最終）

- 観点 1〜5 が全 PASS であれば **GO（Phase 4 へ進行）**
- 観点 1〜5 で 1 件でも MAJOR 検出時は Phase 1 または Phase 2 へ戻す
- MINOR のみの場合は base case 維持で Phase 4 / 5 に追補事項として引き継ぐ

---

## 次フェーズへ進むゲート条件

- [ ] 設計分岐点 D-1〜D-10 が確定（変更不可として後続 Phase へ凍結）
- [ ] 観点 1〜5 が全 PASS（または MINOR のみ）
- [ ] チェックリスト 13 項目すべて充足
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] `artifacts.json.phases[2].status` = `spec_created`

---

## DoD（Phase 3）

- [ ] D-1〜D-10 が「最終確定」と明示
- [ ] 観点 5 件すべての判定方法が記述済
- [ ] 戻し先決定ルール（Phase 1 / Phase 2）が表で固定
- [ ] レビューチェックリスト 13 項目が網羅
- [ ] 4 条件評価が全 PASS
- [ ] Issue #517 再 OPEN 検出ゼロ

---

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略）
- 引き継ぎ事項:
  - 設計分岐点 D-1〜D-10（凍結）
  - 関数 7 件の入出力契約（変更不可）
  - 制御フロー 13 ステップ（変更不可）
  - silent-skip 3 経路 + Slack 失敗 1 経路の挙動（変更不可）
- ブロック条件:
  - 観点 1〜5 のいずれかで MAJOR 残存
  - チェックリスト未消化項目あり
  - 4 条件で MINOR / MAJOR
