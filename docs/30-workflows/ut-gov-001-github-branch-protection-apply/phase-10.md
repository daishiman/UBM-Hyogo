# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / dry-run / apply / rollback リハーサル) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 1〜9 で確定した要件・設計・レビュー・QA を統合し、(1) AC-1〜AC-14 全件カバレッジ評価、(2) 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価、(3) Phase 13 ユーザー承認ゲート前チェック、(4) rollback 経路 3 種（通常 / 緊急 enforce_admins / 再適用）の最終再確認、を実施する。本ワークフローは仕様書整備に閉じるため、最終判定は **「仕様書として PASS / 実 PUT は Phase 13 ユーザー承認後の別オペレーション」** とし、MINOR 指摘は Phase 12 unassigned-task-detection.md へ formalize する方針を明文化する。

## 実行タスク

1. AC-1〜AC-14 を spec_created 視点で評価し、PASS / FAIL / 仕様確定先 を全件付与する（完了条件: 14 件すべてに判定 + 確定先 Phase 番号が付与）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価を行う（完了条件: 各観点に PASS/MINOR/MAJOR + 根拠が記述）。
3. Phase 13 ユーザー承認ゲート前チェックリストを確定する（完了条件: 「UT-GOV-004 完了確認」「payload schema 検証 PASS」「rollback 3 経路 payload 事前生成」「CLAUDE.md grep 一致」「smoke リハーサル完了」の 5 件以上）。
4. rollback 経路 3 種（通常 / 緊急 enforce_admins / 再適用）の最終再確認を行う（完了条件: 各経路の手順 / 担当者 / トリガ条件 / 復旧確認方法が記述）。
5. blocker 判定基準を明文化する（完了条件: 5 件以上、UT-GOV-004 未完了 / payload schema 違反 / rollback 経路不備 / `enforce_admins` 担当者未明記 / bulk PUT 設計残存 を含む）。
6. MINOR 指摘の未タスク化方針を確定する（完了条件: Phase 12 unassigned-task-detection.md への formalize ルートが記述）。
7. 最終 GO/NO-GO 判定を確定し、`outputs/phase-10/main.md` に記述する（完了条件: 「仕様書 PASS / 実 PUT は Phase 13 ユーザー承認後 / status=spec_created」が明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md | AC-1〜AC-14 / Phase 一覧 / 不変条件 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-01.md | 4 条件評価初期判定 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-03.md | base case 最終判定（with notes）|
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-08.md | DRY 化 SSOT |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-09.md | QA 13 項目 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | rollback 3 経路設計 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8 | 苦戦箇所 §8.1〜§8.6 |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-10.md | 最終レビュー phase の構造参照 |

## AC × PASS/FAIL マトリクス（spec_created 視点）

> **評価基準**: 「Phase 1〜9 で具体的に確定し、Phase 5 / 11 / 13 で実装・実走可能な粒度に分解されているか」で判定する。実 PUT は未着手。

| AC | 内容 | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | 適用前 dev/main snapshot を `gh api` 取得し `outputs/phase-13/branch-protection-snapshot-{dev,main}.json` に保全 | Phase 2 §10 / Phase 8 §2 / Phase 11 / 13 | PASS |
| AC-2 | 草案 JSON を PUT schema に正規化した payload を `outputs/phase-13/branch-protection-payload-{dev,main}.json` に保存 | Phase 2 §4 / Phase 8 §3 / Phase 9 §2 | PASS |
| AC-3 | `required_status_checks.contexts` は UT-GOV-004 で実在 job 名同期済みの積集合のみ採用、未完了時は `[]` で 2 段階適用 | Phase 1 §依存境界 / Phase 2 §12 / Phase 3 §NO-GO / Phase 9 §4 | PASS |
| AC-4 | dry-run（差分プレビュー）でレビュー承認後に本 PUT が走る手順 | Phase 2 §7 / Phase 8 §4 / Phase 11 / 13 | PASS |
| AC-5 | dev/main それぞれ PUT 成功し応答を `applied-{dev,main}.json` に保存 | Phase 2 §7 / Phase 8 §2 / Phase 13 | PASS |
| AC-6 | rollback リハーサル（snapshot から 1 回戻す → 再適用）の double-apply | Phase 2 §7 / Phase 8 §5 / Phase 11 / 13 | PASS |
| AC-7 | `enforce_admins=true` rollback 担当者・経路が `apply-runbook.md` に明記、rollback payload 事前生成 | Phase 2 §9.2 / Phase 8 §4.2 / §5.2 | PASS |
| AC-8 | CLAUDE.md ブランチ戦略（solo 運用 / `required_pull_request_reviews=null`）と GitHub 実値が grep 確認手順で一致 | Phase 2 §7 ステップ 7 / Phase 8 §6 / Phase 9 §3 | PASS |
| AC-9 | payload / snapshot / rollback / applied がすべて `{branch}` サフィックスで分離、bulk 化禁止 | Phase 2 §6 / Phase 8 §2 | PASS |
| AC-10 | `lock_branch=false` 明示、有効化は freeze runbook 別タスク | Phase 2 §4.1 / Phase 9 §2 | PASS |
| AC-11 | GET/PUT field 差異が adapter で正規化（`enforce_admins.enabled→bool` / `restrictions.users[].login→配列` / `required_pull_request_reviews=null` 等） | Phase 2 §4 / Phase 8 §3 / Phase 9 §2 | PASS |
| AC-12 | UT-GOV-004 完了が Phase 1 / Phase 2 / Phase 3 の 3 箇所で重複明記 | Phase 1 §依存境界 / Phase 2 §12 / Phase 3 §NO-GO | PASS |
| AC-13 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 / Phase 3 双方で PASS 確認 | Phase 1 §4 条件評価 / Phase 3 §base case 最終判定 | PASS |
| AC-14 | Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致、Phase 1〜3=completed / Phase 4〜13=pending | artifacts.json | PASS |

**合計: 14/14 PASS（spec_created 視点）**

## 4 条件最終再評価

| 条件 | 判定 | 根拠（Phase 9 までの確定事項を統合） |
| --- | --- | --- |
| 価値性 | PASS | dev/main の direct push / force push / 削除 / 必須 check 未通過 merge を構造 block。Phase 1 / Phase 3 で PASS 確定、Phase 8 SSOT で実装容易性が向上 |
| 実現性 | PASS | `gh api` + jq + payload Git 管理で完結、新規依存ゼロ。adapter sub-function 4 件分解で SRP / テスト容易性確保（Phase 8 §3）。Phase 9 検証手順で機械検証可能 |
| 整合性 | PASS | 不変条件 #5 を侵害しない / CLAUDE.md ブランチ戦略 SSOT と整合 / Phase 8 用語統一（正本 / PUT payload / rollback 3 経路）/ scripts/cf.sh 思想と整合 |
| 運用性 | PASS | snapshot / rollback payload 事前生成 + `enforce_admins` 単独 false 化経路 + apply-runbook テンプレ統合（Phase 8 §4）+ verify_no_drift() SSOT で詰まない rollback / drift 検知が確保 |

**最終判定: PASS（仕様書として）**

## Phase 13 ユーザー承認ゲート前チェックリスト

> Phase 13 で実 PUT を実行する**前**に、実行者本人（solo 運用）が以下のチェックリストを 1 件ずつ確認すること。1 件でも未充足なら NO-GO。

| # | チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | UT-GOV-004 完了確認 | `docs/30-workflows/.../ut-gov-004-.../artifacts.json` の state = completed、または同時完了で 2 段階適用フォールバック合意 | completed または合意済み |
| 2 | payload schema 検証 PASS | Phase 9 §2 の `validate_payload()` を 4 ファイル（payload × 2 + rollback × 2）に実走 | 全件 OK |
| 3 | rollback 3 経路 payload 事前生成 | `branch-protection-rollback-{dev,main}.json` の存在 + adapter 通過確認 | 2 ファイル存在 + schema PASS |
| 4 | CLAUDE.md grep 5 項目一致 | Phase 9 §3 の `verify_claude_md_consistency()` 実走 | 全 hit |
| 5 | smoke リハーサル完了 | Phase 11 `rollback-rehearsal-log.md` 存在確認 | 存在、ログに dry-run / rollback 記録あり |
| 6 | `enforce_admins=true` 担当者明記 | `apply-runbook.md` 冒頭表 grep | 「実行者本人」明記 |
| 7 | bulk PUT 設計残存していない | per-branch ループまたは独立 PUT のみ | 1 PUT あたり 1 branch |
| 8 | `lock_branch=false` 明示 | 4 payload 全件で `.lock_branch == false` | 全件 false |
| 9 | navigation drift 0 | `validate-phase-output.js` exit 0 | exit 0 |
| 10 | user_approval_required: true | `artifacts.json` の Phase 13 設定 | true |

## rollback 経路 3 種の最終再確認

### 経路 1: 通常 rollback

| 項目 | 内容 |
| --- | --- |
| トリガ条件 | 設定値が誤って適用された / リハーサル後の戻し |
| 手順 | `for branch in dev main; do gh api ... -X PUT --input rollback-{branch}.json; done` |
| 担当者 | 実行者本人（solo 運用） |
| 復旧確認 | `gh api ... GET` で snapshot と diff 0 |
| 関連 SSOT | Phase 8 §5.1 |

### 経路 2: 緊急 rollback（`enforce_admins=true` で admin 自身 block、§8.4）

| 項目 | 内容 |
| --- | --- |
| トリガ条件 | admin が main に hotfix を push できない / CI 失敗で詰む |
| 手順 A（優先） | `gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE` |
| 手順 B（A で復旧不能時） | `gh api ... -X PUT --input rollback-main.json`（enforce_admins=false 含む） |
| 担当者 | 実行者本人（連絡経路: 手元 ssh / GitHub UI） |
| 復旧確認 | `gh api ... GET` で `enforce_admins.enabled == false`、hotfix が push 可能 |
| 関連 SSOT | Phase 8 §5.2 / Phase 2 §9.2 |

### 経路 3: 再適用（rollback リハーサル後）

| 項目 | 内容 |
| --- | --- |
| トリガ条件 | rollback リハーサル完了後に本適用状態へ戻す |
| 手順 | `for branch in dev main; do gh api ... -X PUT --input payload-{branch}.json; done` |
| 担当者 | 実行者本人 |
| 復旧確認 | `gh api ... GET` で payload と adapter 通過後 diff 0 |
| 関連 SSOT | Phase 8 §5.3 |

### 経路選択フロー（再掲）

```
incident 発生
  ├─ admin 自身 block？ → 経路 2 緊急（A → B）
  ├─ 設定値が誤っただけ？ → 経路 1 通常 rollback
  └─ rollback リハーサル直後 → 経路 3 再適用
```

## blocker 判定基準

> 以下のいずれかに該当する場合、Phase 11 / 13 は **着手 NO-GO**。本ワークフロー（spec_created）は仕様書整備に閉じるが、これらの blocker は Phase 5 / 11 / 13 着手前の必須ゲートとして機能する。

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | UT-GOV-004 が completed でない（同時完了 2 段階適用合意もない） | 上流タスク（最重要・3 重明記） | UT-GOV-004 PR が main にマージ済み / または 2 段階適用フォールバック合意 | UT-GOV-004 ワークフローの artifacts.json `state: completed` |
| B-02 | payload schema 違反（10 field のいずれか） | 設計違反 | `validate_payload()` 実走で全 OK | Phase 9 §2 |
| B-03 | rollback 経路 3 種のいずれかが未確定（手順 / 担当者 / 復旧確認のいずれか欠落） | 設計違反 | 3 経路すべて手順 / 担当者 / 復旧確認が記述 | Phase 10 §rollback 3 種再確認 |
| B-04 | `enforce_admins=true` 適用時の rollback 担当者が `apply-runbook.md` に明記されていない | 運用違反（§8.4） | apply-runbook.md 冒頭表に「実行者本人」明記 | grep |
| B-05 | bulk PUT 設計が残存している（dev/main を 1 回の PUT に丸める） | 設計違反（§8.5） | per-branch 独立 PUT または ループによる per-branch PUT のみ | Phase 8 §2.4 / runbook grep |
| B-06 | `lock_branch=true` を許容する分岐が残っている | 設計違反（§8.3） | 4 payload 全件 `.lock_branch == false` | jq 検証 |
| B-07 | snapshot をそのまま PUT に流す擬似コードの混入 | 設計違反（§8.1） | snapshot → adapter → payload の順序遵守 | Phase 8 §3 / runbook grep |
| B-08 | CLAUDE.md grep 5 項目のいずれかが miss | 二重正本 drift（§8.6） | CLAUDE.md 側更新 または payload 側再検討 | Phase 9 §3 |

### blocker 優先順位

1. **B-01（UT-GOV-004 未完了）**: 最重要。merge 不能事故の唯一の再発防止策。Phase 1 / 2 / 3 で 3 重明記済み。
2. **B-02（payload schema 違反）**: 422 事故の原因。Phase 9 §2 で機械検証。
3. **B-03 / B-04（rollback 経路 / 担当者）**: 詰み事故の唯一の出口。
4. **B-05 / B-06 / B-07（設計違反）**: §8.3 / §8.5 / §8.1 由来、Phase 8 SSOT で予防。
5. **B-08（CLAUDE.md drift）**: 運用上の長期リスク。Phase 11 / 13 verify_no_drift() で継続検証。

## MINOR 指摘の未タスク化方針

- 本 Phase 10 では **MINOR 判定 0**（AC 14 件 / 4 条件すべて PASS）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化**（本ワークフロー内で抱え込まない）。
  2. `outputs/phase-12/unassigned-task-detection.md` に新規 ID を割り当てて登録。
  3. Phase 12 `implementation-guide.md` / `documentation-changelog.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す（IaC 化フェーズで案 B / 案 C 再評価とセット）。
- 既知候補（Phase 3 open question 由来）:
  - #1（adapter を jq か Node か）→ Phase 5 で確定予定
  - #2（dry-run 差分の出力形式）→ Phase 11 で消化
  - #3（2 段階適用第 2 段階トリガの自動化）→ Phase 13 で消化
  - #4（Terraform 案 B 将来導入時期）→ Phase 12 unassigned
  - #5（drift 検知の高度化 / 定期 GitHub Actions diff）→ Phase 12 unassigned

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ status=spec_created**

- 仕様書としての完成度: **PASS**（AC 14/14 / 4 条件すべて PASS / blocker 判定基準 8 件確定 / rollback 3 経路最終再確認済み）
- 実装ステータス: **spec_created**（実 adapter 実装は Phase 5 / 実 smoke は Phase 11 / 実 PUT は Phase 13 ユーザー承認後）
- Phase 11 進行可否: 「仕様レベルの smoke コマンド系列レビュー」のみ可。実走 smoke は Phase 5 実装後にずれ込む。
- Phase 12 進行可否: implementation-guide.md / documentation-changelog.md / unassigned-task-detection.md の整備は本ワークフロー内で可能。
- Phase 13 進行可否: 仕様書としては可だが、実 PUT は **user_approval_required: true** ゲート + 上記 §Phase 13 ユーザー承認ゲート前チェックリスト 10 件すべて充足が必須。

### GO 条件（すべて満たすこと）

- [x] AC 14 件すべて PASS
- [x] 4 条件最終判定が PASS
- [x] blocker 判定基準が 5 件以上記述（本仕様では 8 件）
- [x] rollback 3 経路すべて手順 / 担当者 / 復旧確認が記述
- [x] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 10 件）
- [x] MAJOR ゼロ
- [x] MINOR を抱え込まず未タスク化方針を明記
- [x] open question すべてに受け皿 Phase が指定済み

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker 判定基準が 5 件未満
- rollback 経路 3 種のいずれかが未確定
- Phase 13 ユーザー承認ゲート前チェックリストが 5 件未満
- UT-GOV-004 完了が前提として明記されていない（重複明記 3/3 のいずれかが欠落）

## 実行手順

### ステップ 1: AC マトリクス再評価
- AC-1〜AC-14 を spec_created 視点で全件再評価。

### ステップ 2: 4 条件最終再評価
- Phase 1 / Phase 3 base case を継承、Phase 9 QA 結果で再確認。

### ステップ 3: Phase 13 ユーザー承認ゲート前チェックリスト確定
- 10 件のチェック項目を確定（UT-GOV-004 / payload schema / rollback / CLAUDE.md grep / smoke / 担当者 / bulk / lock / drift / user_approval）。

### ステップ 4: rollback 3 経路最終再確認
- 通常 / 緊急 enforce_admins / 再適用 の 3 経路を手順・担当者・復旧確認の 3 軸で表化。

### ステップ 5: blocker 判定基準作成
- B-01〜B-08 の 8 件を確定、優先順位付き。

### ステップ 6: MINOR 未タスク化方針明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述。

### ステップ 7: GO/NO-GO 確定
- `outputs/phase-10/main.md` に「仕様書 PASS / 実 PUT は Phase 13 ユーザー承認後 / status=spec_created」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test（dry-run / apply / rollback リハーサル）を仕様レベル実施 |
| Phase 12 | unassigned-task 候補 (#4 / #5) を formalize / implementation-guide.md にまとめ |
| Phase 13 | GO/NO-GO 結果と承認ゲート前チェックリスト 10 件を PR description に転記、user_approval_required: true ゲート |
| Phase 5 別 PR | blocker B-01〜B-08 を着手前ゲートとして再確認 |

## 多角的チェック観点

- 価値性: AC-1 / AC-2 / AC-5（snapshot / payload / applied 保全）の根拠が Phase 1〜9 で確定。
- 実現性: Phase 9 QA で payload schema / GET 照合 / CLAUDE.md grep / UT-GOV-004 突合の 4 観点で機械検証可能。
- 整合性: 不変条件 #5 / Phase 8 SSOT / artifacts.json と一致。
- 運用性: rollback 3 経路 + Phase 13 ユーザー承認ゲート前 10 件チェック + 担当者明記。
- 認可境界: 新規 secret 0、対象外明記済み（Phase 9）。
- 無料枠: resource 消費なし、対象外明記済み（Phase 9）。
- bulk 化禁止: per-branch 独立 PUT が Phase 8 §2.4 / Phase 10 blocker B-05 で二重保護。
- 二重正本: CLAUDE.md ↔ GitHub 実値の verify_no_drift() が Phase 8 §6 / Phase 9 §3 で SSOT 化。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-14 達成状態評価 | 10 | spec_created | 14 件 PASS |
| 2 | 4 条件最終再評価 | 10 | spec_created | PASS |
| 3 | Phase 13 ユーザー承認ゲート前チェックリスト確定 | 10 | spec_created | 10 件 |
| 4 | rollback 3 経路最終再確認 | 10 | spec_created | 通常 / 緊急 / 再適用 |
| 5 | blocker 判定基準作成 | 10 | spec_created | 8 件 |
| 6 | MINOR 未タスク化方針確定 | 10 | spec_created | ルール明文化 |
| 7 | GO/NO-GO 判定 | 10 | spec_created | 仕様書 PASS / spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC × 4 条件 × 承認ゲート前チェック × rollback 3 経路 × blocker × GO/NO-GO 最終判定 |
| メタ | artifacts.json | Phase 10 状態の更新 |

> **path 表記正規化メモ**: Phase 10 outputs は `outputs/phase-10/main.md` に統一。artifacts.json / index.md / phase 本文の表記も同一。

## 完了条件

- [ ] AC 14 件すべて PASS で評価
- [ ] 4 条件最終判定が PASS
- [ ] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 10 件）
- [ ] rollback 3 経路すべて手順 / 担当者 / 復旧確認 / トリガ条件が記述
- [ ] blocker 判定基準が 5 件以上記述（本仕様では 8 件）
- [ ] MINOR 未タスク化方針が明文化
- [ ] 最終判定が「仕様書 PASS / 実 PUT は Phase 13 ユーザー承認後 / status=spec_created」で確定
- [ ] open question 5 件すべてに受け皿 Phase が指定
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/main.md` 配置予定
- AC × 4 条件 × 承認ゲート前 × rollback 3 経路 × blocker × MINOR × GO/NO-GO の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 苦戦防止メモ

- 本ワークフローの最終成果物は「タスク仕様書」。実 `gh api PUT` は Phase 13 ユーザー承認後の別オペレーション。本 Phase で「実装 PASS」と書かない。常に **「仕様書 PASS / 実 PUT は Phase 13 ユーザー承認後 / status=spec_created」** と三段で表現する。
- blocker B-01（UT-GOV-004 未完了）は最重要・3 重明記。Phase 11 / 13 着手 PR の reviewer（= 実行者本人）は本仕様書 §blocker を必ず参照すること。
- rollback 経路 3 種のうち **経路 2（緊急 enforce_admins）** は通常経路と取り違えると影響範囲を広げる。手順 A（DELETE）優先 → 手順 B（PUT）後追い、を warning ボックスで隔離（Phase 8 §5.2）。
- MINOR をその場で対応したくなる衝動を抑え、必ず Phase 12 unassigned-task ルートを通す。仕様書スコープを保つために重要。
- Phase 13 ユーザー承認ゲート前チェックリスト 10 件は、実行者本人が 1 件ずつ目視確認する運用。自動化は IaC 化フェーズで再評価。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / dry-run / apply / rollback リハーサル)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実 PUT は Phase 13 ユーザー承認後 / status=spec_created
  - blocker 8 件（実装 / smoke / 本 PUT 着手前に再確認必須）
  - rollback 3 経路の最終再確認結果
  - Phase 13 ユーザー承認ゲート前チェックリスト 10 件
  - open question 5 件の受け皿 Phase
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker 判定基準が 5 件未満
  - rollback 経路 3 種のいずれかが未確定
  - 承認ゲート前チェックリストが 5 件未満
  - MINOR を未タスク化せず抱え込んでいる
