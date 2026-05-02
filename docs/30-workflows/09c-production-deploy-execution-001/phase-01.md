# Phase 1: 要件定義 + user approval gate 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-production-deploy-execution-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 + user approval gate 設計 |
| Wave | 9 |
| Mode | serial（execution-only / production mutation） |
| 作成日 | 2026-05-02 |
| 前 Phase | なし |
| 次 Phase | 2 (設計 — 実行フロー + evidence 設計) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL |
| user_approval | REQUIRED（Phase 1 / 5 / 10 の三段ゲート） |
| Issue | #353（CLOSED, 2026-05-02 — クローズドのまま docs / execution を分離整備） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ（`wrangler` 直実行禁止） |

## 目的

09c 親ワークフロー（`docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/`）が docs-only / spec_created として整備した production deploy runbook を、本タスク（execution-only）で **実 Cloudflare production 環境に対して mutation を伴う形で実行** するための要件を確定する。

本 Phase は実 production には触れない。実行前提として:

- 親 09c との境界（docs-only vs execution-only）を文書で固定
- AC-1〜AC-13 の根拠と evidence ファイル設計
- user 明示承認ゲート（Phase 1 / 5 / 10 の三段）
- 4 条件評価 + open question 列挙
- 不変条件 #4 / #5 / #10 / #11 / #15 を production で再確認する方針

を確定し、`outputs/phase-01/main.md` および `outputs/phase-01/user-approval-gate.md` に保存する。

## 実行タスク

1. 親 09c（docs-only）と本タスク（execution-only）の境界を表で確定
2. AC-1〜AC-13 の根拠記述（index.md の AC 13 件 1:1 マッピング）
3. user 明示承認ゲート設計（Phase 1 = scope 固定承認 / Phase 5 = preflight 結果承認 / Phase 10 = GO/NO-GO 承認）
4. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
5. open question 列挙（最大 3 件）
6. 不変条件 #4 / #5 / #10 / #11 / #15 の production 再確認方針
7. Cloudflare wrapper（`bash scripts/cf.sh`）強制方針の文書化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | 本タスク AC 13 件 / Phase 一覧 |
| 必須 | docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md | 起票元 unassigned（Why / What / How） |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-01.md | 親 docs-only Phase 1（テンプレ） |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md | 親 runbook 本体 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/phase12-task-spec-compliance-check.md | 親 compliance 表 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | production deploy / D1 / secrets 正本 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | deploy spec |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CI gate |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper（直 `wrangler` 禁止） |

## 実行手順（ステップ別）

### ステップ 1: 親 09c との境界確定

- `outputs/phase-01/main.md` 冒頭に下表を記述。
  | 観点 | 親 09c (docs-only) | 本タスク (execution-only) |
  | --- | --- | --- |
  | 状態 | spec_created（mutation なし） | applied（実 production mutation） |
  | 成果物 | runbook / template / compliance | preflight / migration / deploy / tag / smoke / 24h evidence |
  | Issue | docs PR 経由 | `Refs #353`（既に CLOSED） |
  | rollback | 不要 | `bash scripts/cf.sh rollback` 事前準備必須 |
  | user approval | 不要 | Phase 1 / 5 / 10 の三段必須 |
- 「親完了 ≠ 実 deploy 完了」を明示する 1 段落を含める。

### ステップ 2: AC-1〜AC-13 の根拠記述

- index.md の AC 13 件を 1:1 で `outputs/phase-01/main.md` に転記し、それぞれに以下 4 項目を付ける。
  - 達成根拠（どの evidence ファイルで証明するか）
  - 検証コマンド（`bash scripts/cf.sh ...` または `git ...`）
  - 担当 Phase（5〜11 のどこか）
  - 失敗時の分岐（rollback / incident / retry）

### ステップ 3: user 明示承認ゲート設計

- `outputs/phase-01/user-approval-gate.md` を新規作成し、以下 3 ゲートを明記。
  | ゲート | Phase | 承認対象 | 入力 evidence | 出力 evidence |
  | --- | --- | --- | --- | --- |
  | G1: scope 固定 | Phase 1 | scope / AC / approval gate 設計そのもの | 本 main.md / user-approval-gate.md | `outputs/phase-01/user-approval-log.md`（user の明示文字列） |
  | G2: preflight 通過 | Phase 5 | `git rev-parse origin/main` / `cf.sh whoami` / migration list dry-run / secrets list 結果 | `outputs/phase-05/preflight-evidence.md` | `outputs/phase-05/user-approval-log.md` |
  | G3: GO/NO-GO | Phase 10 | smoke 結果 / 認可境界結果 / release tag 適用結果 | `outputs/phase-09/smoke-evidence.md`, `outputs/phase-08/release-tag-evidence.md` | `outputs/phase-10/go-no-go.md`, `outputs/phase-10/user-approval-log.md` |
- 各ゲートにつき「承認なしで Phase X 実行禁止」「承認文字列の表現例」「rollback 起動条件」を 3 項目固定で書く。

### ステップ 4: 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 親 docs-only と分離した execution-only タスクで、未実行の production deploy を見える化できるか | PASS |
| 実現性 | 親 09c の runbook + 本タスクの 13 Phase で 1 営業日 + 24h 検証が完了するか | PASS |
| 整合性 | AC 13 件と不変条件 #4 / #5 / #10 / #11 / #15 が整合し、`bash scripts/cf.sh` 強制が貫けるか | PASS |
| 運用性 | user 承認 3 段ゲート + rollback 手順が誰でも追跡可能か | TBD（Phase 3 で rollback コマンド列確定後 PASS） |

### ステップ 5: open question 列挙

- Q1〜Q3 を `outputs/phase-01/main.md` に列挙し、Phase 3（実装計画）で clearance させる。

### ステップ 6: 不変条件再確認方針

- 不変条件 #4（本人本文 D1 override しない）/ #5（apps/web → D1 直接禁止）/ #10（無料枠）/ #11（admin が本人本文編集不可）/ #15（attendance 重複防止 / 削除済み除外）について、Phase 9 / 11 のどこで production 実測するか割り当てる。

### ステップ 7: Cloudflare wrapper 強制方針

- 本タスクで実行する Cloudflare 系コマンドはすべて `bash scripts/cf.sh ...` のみ。Phase 12 で `git diff main...HEAD` / 全 evidence に対し `grep -E '^\s*wrangler\s' = 0` を AC-13 evidence にする方針を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope を 13 ステップ Mermaid + evidence ファイル設計に展開 |
| Phase 3 | rollback コマンド列の事前確定で運用性を PASS に昇格 |
| Phase 5 | G2 preflight ゲートの入力 |
| Phase 10 | G3 GO/NO-GO ゲートの入力 |
| Phase 12 | AC-13 wrangler 直実行 0 件 grep evidence の根拠 |
| 親 09c | runbook / template を receive、実行 evidence を本タスクで初出力 |

## 多角的チェック観点（不変条件）

- 不変条件 #4: production `/profile` の本人本文編集 form 不在を Phase 9 で再確認する旨を明記
- 不変条件 #5: `apps/web` の production build artifact から D1 binding 直接呼び出しがないことを Phase 7 / 9 で再確認
- 不変条件 #10: 24h Cloudflare Analytics で Workers req < 5k/day、D1 reads / writes が無料枠 10% 以下を Phase 11 で実測
- 不変条件 #11: production admin UI に本文編集 form がないことを Phase 9 で再確認
- 不変条件 #15: production data に対する attendance 重複 0 件 / 削除済み除外 SQL を Phase 11 で確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 親 09c との境界表確定 | 1 | pending | docs-only vs execution-only |
| 2 | AC-1〜AC-13 根拠記述 | 1 | pending | index.md 1:1 |
| 3 | user approval gate 3 段設計 | 1 | pending | G1 / G2 / G3 |
| 4 | 4 条件評価 | 1 | pending | 運用性 TBD |
| 5 | open question 列挙 | 1 | pending | 最大 3 件 |
| 6 | 不変条件 #4/#5/#10/#11/#15 production 再確認方針 | 1 | pending | Phase 9 / 11 割当 |
| 7 | wrapper 強制方針記述 | 1 | pending | AC-13 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope / 親境界 / AC 13 件根拠 / 4 条件 / open question / 不変条件 |
| ドキュメント | outputs/phase-01/user-approval-gate.md | G1 / G2 / G3 三段ゲート設計 |
| ドキュメント | outputs/phase-01/user-approval-log.md | G1 通過時の user 明示承認ログ |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] AC-1〜AC-13 の 13 件すべてに evidence パス / 検証コマンド / 担当 Phase / 失敗時分岐が紐づく
- [ ] user approval gate 3 段（G1 / G2 / G3）が設計されている
- [ ] G1（Phase 1 ゲート）の user 明示承認ログが `outputs/phase-01/user-approval-log.md` に保存
- [ ] 4 条件評価で MAJOR がない（運用性 TBD は Phase 3 で解消予定で許容）
- [ ] open question が 3 件以内
- [ ] 不変条件 #4 / #5 / #10 / #11 / #15 の production 再確認 Phase 割当が表で確定
- [ ] `bash scripts/cf.sh` 強制方針が文書化

## タスク100%実行確認【必須】

- 全実行タスク（ステップ 1〜7）が completed
- 4 ファイル（main.md / user-approval-gate.md / user-approval-log.md / artifacts.json）配置
- artifacts.json の Phase 1 を completed に更新
- G1 承認なしで Phase 2 に進ませないことを文中に明記

## 次 Phase

- 次: 2 (設計 — 実行フロー + evidence 設計)
- 引き継ぎ事項: scope / AC 13 件根拠 / user approval gate 3 段 / 4 条件 / open question / 不変条件再確認割当
- ブロック条件: G1 承認ログ未取得 / open question 4 件以上 / AC 根拠不足

## 真の論点

- 親 09c が docs-only として spec_created で完了しているのに、実 production deploy が未実行の状態を「タスク完了」と区別する仕組みをどう docs に固定するか
- production mutation の user 承認をどの粒度（タスク全体一括 / Phase 単位 / コマンド単位）で取るか → 三段ゲート（G1: scope, G2: preflight, G3: GO/NO-GO）に分割
- `wrangler` 直実行 0 件をどう機械的に証明するか → Phase 12 で `grep -E '^\s*wrangler\s' outputs/` = 0 を evidence 化

## 依存境界

- 本タスクが触る:
  - 親 09c の runbook を execute する production mutation 実行
  - main 昇格 evidence / cf.sh whoami / D1 migration / secrets / api+web deploy / release tag / smoke / 24h verify
  - user approval log の保存
- 本タスクが触らない:
  - 親 09c の docs-only 仕様書の再設計（既に spec_created）
  - 新規機能開発 / 新規 secret 登録 / secret rotation
  - staging deploy（09a）/ cron triggers 追加変更（09b）
  - semver / Slack bot 自動通知 / 24h 自動 alert

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | docs-only と execution-only の分離で「未実行 deploy が完了済みに見える」事故を防げるか | PASS |
| 実現性 | Phase 1〜13 と user 三段ゲートで 1 営業日 + 24h で完了できるか | PASS |
| 整合性 | AC 13 件 / 不変条件 5 つ / Cloudflare wrapper 強制が矛盾なく満たせるか | PASS |
| 運用性 | rollback / incident 分岐が事前確定し、誰でも実行可能か | TBD（Phase 3 で rollback コマンド列確定後に PASS 昇格） |

## open question

- Q1: G2 preflight ゲートで失敗した場合、Phase 2-4 まで戻すか Phase 5 内で retry するか → Phase 3 で確定
- Q2: 24h verify 中に新規 deploy 凍結を破る hotfix が必要になった場合の承認手順 → 親 09b incident runbook の P0 経路で対応、本タスクは追加承認不要
- Q3: release tag (`vYYYYMMDD-HHMM`) の HHMM は JST / UTC どちら基準か → JST（運用者全員 JST のため）。Phase 3 で固定
