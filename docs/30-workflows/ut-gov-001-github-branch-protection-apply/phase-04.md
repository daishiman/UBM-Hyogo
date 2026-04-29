# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（dry-run 差分 / adapter 単体 / dev・main 独立 PUT / rollback リハーサル / 2 段階適用） |
| 作成日 | 2026-04-28 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending（仕様化のみ完了 / 実走は別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 3 で PASS（with notes 4 件）が確定した base case（案 A: gh api 直叩き + payload Git 管理 / lane 1〜5 直列実行 / dev・main 独立 PUT）に対して、**Phase 5 着手前に「何を満たせば Green か」を 5 種類のテスト（T1〜T5）として確定する**。本 Phase はテストの実走ではなく、Phase 5 ランブック / Phase 6 異常系 / Phase 11 smoke が参照する **検証コマンド系列の正本** として固定する。

> **本 Phase は仕様化のみ**。実 `gh api PUT` は Phase 13 ユーザー承認後の別オペレーション。本 Phase ではコマンドを記述するが**実行は禁止**。

## 依存タスク順序（UT-GOV-004 完了必須）— 引き継ぎ確認

UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed であること（Phase 1 / 2 / 3 で 3 重明記済み）。同時完了の場合に限り、案 D（2 段階適用フォールバック）を T5 として組み込む。UT-GOV-004 未完了で T1〜T5 を実走させると、`contexts` 未出現 job 名投入で merge 不能事故（親仕様 §8.2）が発生する。

## 実行タスク

- タスク1: T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを表化する。
- タスク2: UT-GOV-004 完了前提を本 Phase でも再確認する。
- タスク3: 実走を Phase 5 / 6 / 11 / 13 に委譲する境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-02.md | lane 1〜5 設計 / state ownership |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | adapter field マッピング表 / 4 ステップ手順 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-03.md | base case PASS / NO-GO 条件 / open question |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8 | 苦戦箇所（GET/PUT 差異 / contexts / enforce_admins / lock_branch / bulk） |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-04.md | テスト戦略フォーマット参照 |

## 実行手順

1. Phase 2 設計（4 ステップ手順 / adapter / dev・main 独立 PUT）と Phase 3 PASS 判定を入力として確認する。
2. T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態を表に落とす。
3. 本 Phase ではコマンドを実走しないことを Phase 5 ランブック側に明示的に引き渡す。

## 統合テスト連携

T1〜T5 は別オペレーション側で Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 11（手動 smoke）/ Phase 13（ユーザー承認後 PUT）の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T5 のテスト一覧 / 検証コマンド / 期待値 / 失敗時切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## テスト一覧（happy path）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前 / 適用前）の現状値 / **対応 lane** = Phase 2 §3 の lane 番号

### T1: dry-run 差分検証（snapshot ↔ payload）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | lane 3（dry-run） |
| 検証コマンド | `diff <(jq -S . snapshot-dev.json)  <(jq -S . payload-dev.json)` / `diff <(jq -S . snapshot-main.json) <(jq -S . payload-main.json)` |
| 期待値 | intended diff のみが出力され、`apply-runbook.md §dry-run-diff` に記録された差分とバイト一致する |
| Red 状態 | snapshot がそのまま PUT 形式で出力されている（adapter 未通過 → §8.1 違反）/ unintended diff が混入 |
| 失敗時切り分け | (a) adapter で `enforce_admins.enabled` 抽出漏れ / (b) `restrictions.users[].login` の flatten 漏れ / (c) `required_pull_request_reviews=null` 固定漏れ / (d) UT-GOV-004 未反映の contexts 残存 |

### T2: GET → PUT 正規化 adapter の単体検証

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | lane 2（adapter） |
| 検証コマンド | `jq -e` で 11 field の型・必須キー・禁止値を検証し、UT-GOV-004 contexts 積集合と `diff` する。API への PUT / curl は Phase 13 承認前に実行しない |
| 期待値 | 11 field（§8.1 最低限）が PUT schema に正規化されており、`enforce_admins` が bool / `restrictions.users` が `[login]` の string 配列 / `required_pull_request_reviews=null` / `lock_branch=false` 固定 |
| Red 状態 | GET 応答そのままの構造（`enforce_admins.enabled` のネスト / `restrictions.users[].login` のオブジェクト配列）が残存 |
| 失敗時切り分け | (a) jq adapter の field 漏れ / (b) UT-GOV-004 contexts 反映前 → 空配列で 2 段階適用へ / (c) `lock_branch=true` が混入（§8.3 違反） |

### T3: dev / main 独立 PUT 検証（bulk 化禁止）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | lane 4（apply） |
| 検証コマンド | `gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT --input payload-dev.json  > applied-dev.json` の exit 0 / 続けて `gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input payload-main.json > applied-main.json` の exit 0 を**別コマンドとして**確認 |
| 期待値 | 2 つの PUT がそれぞれ独立に exit 0 を返し、`applied-dev.json` / `applied-main.json` が `{branch}` サフィックス付きで生成される。bulk script で一括実行されていない |
| Red 状態 | dev / main を 1 つの payload にまとめて適用 / `applied.json`（branch サフィックス無し）が出力 / 片側失敗で両側ロールバックの設計 |
| 失敗時切り分け | (a) bulk script 残存（§8.5 違反） / (b) `{branch}` サフィックス未分離 / (c) 片側 PUT 失敗時にもう片側を巻き込む rollback 設計 |

### T4: rollback リハーサル検証（snapshot → rollback payload → 再適用 double-apply）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | lane 5（rollback rehearsal） |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input rollback-dev.json` で snapshot 相当へ戻す → (2) `gh api ... GET` で rollback payload と一致確認 → (3) `gh api ... -X PUT --input payload-dev.json` で再適用 → (4) `gh api ... GET` で payload と一致確認。main 側も同手順 |
| 期待値 | 4 ステップすべて exit 0 / GitHub 実値が rollback → 本適用の 2 サイクルを通過 / `enforce_admins=true` 状態でも DELETE 経路（`gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE`）が機能する |
| Red 状態 | rollback payload が PUT schema 不整合（snapshot をそのまま使用） / 緊急 DELETE 経路が runbook 未記載 / 再適用後の GET 結果が payload と乖離 |
| 失敗時切り分け | (a) rollback payload が adapter 未通過 / (b) `enforce_admins=true` 詰み時の rollback 担当者（solo 運用 = 実行者本人）が runbook 未明記（§8.4 違反） / (c) 再適用後の `required_pull_request_reviews` が null 以外で復元 |

### T5: contexts 空配列 → UT-GOV-004 反映の 2 段階適用ケース（フォールバック）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | lane 2 + lane 4（adapter + apply / 案 D フォールバック） |
| シナリオ | UT-GOV-004 が同時完了で第 1 段階時点では `contexts` 同期済み job 名が空。第 1 段階で `contexts=[]` を含む payload を適用 → UT-GOV-004 完了後に第 2 段階で contexts 入りの payload を再 PUT |
| 検証コマンド | (1) `jq '.required_status_checks.contexts' payload-dev.json` で `[]` を確認 → (2) `gh api ... -X PUT --input payload-dev.json` で第 1 段階適用 → (3) UT-GOV-004 完了後 `jq '.required_status_checks.contexts' payload-dev.json` が非空配列 → (4) `gh api ... -X PUT` で第 2 段階再適用 → (5) `gh api ... GET | jq '.required_status_checks.contexts'` が UT-GOV-004 積集合と一致 |
| 期待値 | 第 1 段階・第 2 段階とも exit 0。第 2 段階完了時の GitHub 実値の contexts が UT-GOV-004 で同期された実在 job 名のみ（typo / 将来予定 job 無し） |
| Red 状態 | 第 1 段階で `contexts` に未出現値が混入し PR 全 block / 第 2 段階の再 PUT が runbook 未記載で抜け落ちる / Phase 13 完了条件に第 2 段階再 PUT が含まれていない |
| 失敗時切り分け | (a) 第 1 段階で `contexts=[]` 強制ロジックが adapter に無い / (b) UT-GOV-004 完了通知から第 2 段階トリガまでの手順が runbook 不在 / (c) 第 2 段階の再 PUT 後の GET 検証ステップ欠落 |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| adapter field マッピング 11 field（§8.1 最低限） | T1 + T2 で全 field 被覆 |
| dev / main 独立 PUT | T3 で 2 PUT × 別ファイル exit 0 |
| rollback 3 経路（通常 / 緊急 enforce_admins / 再適用） | T4 で 3 経路すべて被覆 |
| 2 段階適用フォールバック（案 D） | T5 で第 1・第 2 段階両方を被覆 |
| 二重正本 drift（CLAUDE.md ↔ GitHub 実値） | T4 ステップ末尾の `grep -E "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md` |

## 完了条件

- [ ] T1〜T5 が `outputs/phase-04/main.md` に表化されている
- [ ] 各テストに ID / 対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] UT-GOV-004 完了が本 Phase の前提として再確認されている
- [ ] base case PASS（Phase 3）と adapter 仕様（Phase 2 §4）が入力として参照されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 / 13 に委ねる旨が明示されている
- [ ] 本 Phase で `gh api PUT` を実行していない（仕様化のみ）

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
# 仕様の存在確認のみ（実テストは走らせない）
test -f docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-04/main.md
rg -c "^### T[1-5]:" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-04/main.md
# => 5
```

## 苦戦防止メモ

1. **dry-run の差分は adapter 通過後の payload で取る**: snapshot をそのまま PUT 比較すると `enforce_admins.enabled` ネスト等で常に diff が出続け、intended diff と区別できなくなる（§8.1）。
2. **adapter 単体テストは 11 field を全件突合**: 1 field の見落としで 422。Phase 2 §4.1 マッピング表を T2 のチェックリストとして転記する。
3. **dev / main を bulk 化しない**: 片側失敗で両側ロールバックすると governance 強制力が dev・main 同時に失われる（§8.5）。T3 で必ず別コマンドとして検証。
4. **rollback リハーサル時に enforce_admins DELETE 経路を確認**: PUT で `enforce_admins=false` 戻しが詰む場合の最終手段（§8.4）。T4 で経路の存在のみ確認、実 DELETE は Phase 11 / 13 で実走。
5. **2 段階適用は第 2 段階の再 PUT が runbook 必須**: 第 1 段階だけで終わると governance 弱化が固定化する。Phase 13 完了条件に第 2 段階を組み込む（Phase 3 notes #1）。
6. **本 Phase は実走しない**: T1〜T5 の Red 確認は Phase 5 着手直前 / Phase 11 smoke / Phase 13 ユーザー承認後の PUT で行う。仕様化のみで Phase 5 へ進む。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T5 を Phase 5 ランブック Step 1〜5 の Green 条件として参照
  - T2（adapter 単体）/ T3（独立 PUT）の検証コマンドを Phase 5 各 Step の確認コマンドに転記
  - T4（rollback リハーサル）/ T5（2 段階適用）は Phase 11 smoke の主要ケース
  - 実走は Phase 13 ユーザー承認後（user_approval_required: true）
- ブロック条件:
  - UT-GOV-004 が completed でない（同時完了 2 段階適用合意も無い）
  - T1〜T5 のいずれかに期待値・検証コマンドが欠けている
  - rollback 3 経路（通常 / 緊急 / 再適用）のうち T4 で被覆漏れがある
