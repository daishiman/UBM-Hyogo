# Phase 6 成果物 — 異常系検証

## 1. 異常系サマリ

T6〜T11 の 6 ケースで、UT-GOV-001 base case の fail path（**422 / contexts 不在 / enforce_admins 詰み / lock_branch 誤投入 / dev・main 片側適用ミス / GET→PUT field drift**）を仕様レベルで網羅する。実走は **Phase 11 smoke / Phase 13 ユーザー承認後 PUT** に委譲し、本 Phase ではコマンド・期待値・Red 状態・対応を正本化する。

## 2. T6: 422 Unprocessable Entity（adapter field 漏れ regression / §8.1）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | adapter 正規化レイヤの完全性 |
| シナリオ | snapshot をそのまま PUT に流す / `enforce_admins.enabled` ネスト残存 / `restrictions.users[].login` のオブジェクト配列残存 |
| 検証コマンド | `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input outputs/phase-13/branch-protection-snapshot-dev.json`（**意図的失敗ケース**。Phase 11 smoke で stage 環境または本番一時投入で確認） |
| 期待値 | HTTP 422 / レスポンスに該当 field の type / structure エラー |
| Red 状態（仕掛け） | adapter Step を skip して snapshot を直 PUT した場合に 422 |
| 対応 | adapter 11 field チェックリスト（Phase 4 §3.1）を Step 2 で必ず通過。CI gate 候補として Phase 12 unassigned-task-detection.md に登録 |

## 3. T7: contexts 未出現値投入による merge 不能（§8.2）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | UT-GOV-004 ゲートと 2 段階適用フォールバックの妥当性 |
| シナリオ | typo / 将来予定 job 名（例: `lint-future` / `typecheck-v2`）を `contexts` に投入 |
| 検証コマンド | (1) `jq '.required_status_checks.contexts' outputs/phase-13/branch-protection-payload-dev.json` で投入予定値列挙 / (2) `gh run list --workflow ci --limit 50 --json name \| jq -r '.[].name' \| sort -u` で実在 job 名取得 / (3) `comm -23 <(jq -r '.required_status_checks.contexts[]' payload-dev.json \| sort) <(gh run list ... \| sort -u)` で差分 0 確認 |
| 期待値 | 投入予定 contexts ⊆ 実在 job 名（差分 0）。差分があれば PUT 中止 → UT-GOV-004 完了 or 案 D 切替 |
| Red 状態 | 差分があるまま PUT → PR 全 block / 緊急 hotfix 停止 |
| 対応 | Phase 5 Step 0 ゲートで block。`apply-runbook.md` に「PUT 直前に contexts 突合 → 差分 0 確認 → PUT」を必須手順として記載 |

## 4. T8: enforce_admins=true での admin 自身 block（§8.4）

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | 緊急 rollback 経路の存在と担当者明記 |
| シナリオ | main の `enforce_admins=true` 適用直後に CI 失敗 / hotfix 直 push 経路も封鎖された状態 |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.enforce_admins.enabled'` => true / (2) `gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE` exit 0 / (3) `gh api ... \| jq '.enforce_admins.enabled'` => false / (4) hotfix 後 `gh api ... -X PUT --input outputs/phase-13/branch-protection-rollback-main.json` で復元 / (5) `jq '.enforce_admins.enabled'` => true（復元確認） |
| 期待値 | DELETE 経路 exit 0 / 復元 PUT で `enforce_admins=true` に戻る / runbook に担当者（solo 運用 = 実行者本人）と連絡経路（手元 ssh / GitHub UI）明記 |
| Red 状態 | DELETE 経路が runbook 未記載 / 担当者未明記 / rollback payload 未生成 |
| 対応 | Phase 5 Step 5.2 を `apply-runbook.md` に必ず転記。Phase 11 smoke で DELETE → 復元 PUT を独立シナリオとして実走 |

## 5. T9: lock_branch=true 誤投入（§8.3）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | adapter 強制値（`lock_branch: false`）の維持 |
| シナリオ | adapter ロジックや手動編集で `lock_branch: true` が混入 → 全 push 完全停止で incident 時詰む |
| 検証コマンド | `jq -e '.lock_branch == false' outputs/phase-13/branch-protection-payload-dev.json` / 同 main / `jq -e '.lock_branch == false' outputs/phase-13/branch-protection-rollback-{dev,main}.json` |
| 期待値 | 4 ファイルすべてで `lock_branch == false`（exit 0） |
| Red 状態 | いずれかの JSON で `lock_branch: true` 混入 |
| 対応 | adapter jq テンプレで `lock_branch: false` を**ハードコード**（Phase 2 §4.2 / Phase 5 §5.2）。CI gate 候補として Phase 12 unassigned-task-detection.md に登録 |

## 6. T10: dev / main 片側適用ミス（§8.5）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | dev / main 独立 PUT の維持と片側 drift 検出 |
| シナリオ | dev のみ PUT 成功 / main は失敗（または逆） / bulk script 残存 / `{branch}` サフィックス未分離で applied JSON 上書き |
| 検証コマンド | (1) `test -f outputs/phase-13/branch-protection-applied-dev.json && test -f outputs/phase-13/branch-protection-applied-main.json` / (2) `jq -r '.url' outputs/phase-13/branch-protection-applied-dev.json \| rg "/dev/protection"` / 同 main / (3) `gh api repos/{owner}/{repo}/branches/dev/protection \| jq -S . > /tmp/get-dev.json && diff /tmp/get-dev.json <(jq -S . outputs/phase-13/branch-protection-payload-dev.json)`（intended diff 以外なし）/ 同 main |
| 期待値 | applied JSON が `{branch}` サフィックス分離で 2 件存在 / それぞれの GET が payload と一致 |
| Red 状態 | 片側のみ生成 / 両者が同一内容（上書き）/ bulk script で 1 PUT に統合 |
| 対応 | Phase 5 Step 4 の独立 PUT × 2 を厳守。bulk script を作らない。CI gate 候補化 |

## 7. T11: GET → PUT field drift（regression / §8.1）

| 項目 | 内容 |
| --- | --- |
| ID | T11 |
| 観点 | GET 応答構造変化への追随性（adapter メンテ性） |
| シナリオ | GitHub REST API の GET 応答に新 field 追加 / 既存 field の構造変化（例: `restrictions` の新 sub-resource） |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/main/protection \| jq 'keys' > /tmp/keys-current.json` / (2) Phase 2 §4.1 の 11 field 表と突合 / (3) 表に無い key が出現していないか / (4) `gh api ... \| jq '.required_status_checks \| type'` 等で各 field type を表と突合 |
| 期待値 | 11 field 表で全て説明可能 / 未知 field 出現時は adapter 更新タスクを Phase 12 unassigned-task-detection.md に起票 |
| Red 状態 | 未知 field がそのまま PUT に流れて 422 / type 変化を adapter が変換せず 422 |
| 対応 | Phase 5 Step 2 の 11 field 突合に「未知 key の検知」ステップ追加。GitHub API バージョン変更時の adapter 再評価を Phase 12 unassigned に登録 |

## 8. fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step | CI gate 候補 |
| --- | --- | --- | --- |
| T6 | lane 2 | Phase 5 Step 2 | ◎（Phase 12 登録） |
| T7 | lane 2 + lane 4 | Phase 5 Step 0 / Step 4 / Phase 13 第 2 段階再 PUT | - |
| T8 | lane 5 | Phase 5 Step 5.2 / Phase 11 smoke | - |
| T9 | lane 2 | Phase 5 Step 2 jq ハードコード | ◎（Phase 12 登録） |
| T10 | lane 4 | Phase 5 Step 4 | ◎（Phase 12 登録） |
| T11 | lane 1 + lane 2 | Phase 5 Step 1〜2 | -（年次再評価） |

## 9. 実走計画（本 Phase 範囲外）

| 実走 Phase | 対象 T |
| --- | --- |
| Phase 11 smoke（Phase 13 承認後） | T6（意図的 422）/ T8（DELETE → 復元）/ T10（独立 PUT × 2）|
| Phase 13 PR + ユーザー承認後 PUT | T7（contexts 突合）/ T9（lock_branch 突合）/ T11（key drift） |

## 10. 引き渡し（Phase 7 へ）

- 異常系 6 件（T6〜T11）+ happy path 5 件（T1〜T5）= 全 11 件を Phase 7 AC マトリクス入力に渡す
- T6 / T9 / T10 を CI gate 候補として Phase 12 unassigned-task-detection.md に申し送り
- T8 の緊急 DELETE 経路 + 担当者明記を Phase 11 apply-runbook.md / Phase 13 PR 説明に転記
- 本 Phase で実 PUT / DELETE を実行しない境界を Phase 7 / 11 / 13 に再確認させる
