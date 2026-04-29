# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（422 / contexts 不在 / enforce_admins 詰み / lock_branch 誤投入 / 片側適用ミス / GET→PUT field drift） |
| 作成日 | 2026-04-28 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending（仕様化のみ完了 / 実走は Phase 11 / 13） |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 4 の T1〜T5（happy path）に加えて、**fail path / 回帰 guard** を T6〜T11 として固定する。本 Phase は「壊れ方が予想範囲を超えないか」「rollback / 緊急 DELETE が期待通り動くか」「dev・main 片側適用ミスが検知できるか」「GET 応答をそのまま PUT に流す drift が再発しないか」を仕様レベルで網羅する。実走は Phase 11 smoke / Phase 13 ユーザー承認後 PUT に委譲する。

## 依存タスク順序（UT-GOV-004 完了必須）

UT-GOV-004 完了は Phase 5 Step 0 ゲートで担保済み。本 Phase は Step 0 をパスした前提で fail path を扱う。同時完了で案 D（2 段階適用）採用時は T7（contexts 不在）が第 1 段階の意図された状態として機能する点を踏まえる。

## 実行タスク

- タスク1: T6〜T11 の 6 件（422 / contexts / enforce_admins / lock_branch / 片側適用 / GET→PUT drift）を定義する。
- タスク2: 各 T のシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応を表化する。
- タスク3: 実走を Phase 11 / 13 に委譲する範囲を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | T1〜T5 happy path |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-05.md | 6 ステップランブック / 4 コミット粒度 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | adapter 11 field / state ownership / rollback 3 経路 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8 | 苦戦箇所 |

## 実行手順

1. Phase 4 の happy path と Phase 5 の実装ランブックを確認する。
2. T6〜T11 をシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応に分解する。
3. Phase 7 の AC マトリクス入力として引き渡す。

## 統合テスト連携

T6〜T11 は実 `gh api PUT` を伴うため、**Phase 13 ユーザー承認後** の Phase 11 smoke で実走する。本 Phase は fail path 仕様の正本化のみ。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T6〜T11 のテスト一覧 / 期待値 / 観測手順 |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 異常系テスト一覧

### T6: 422 Unprocessable Entity（adapter field 漏れ regression）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | adapter 正規化レイヤの完全性（§8.1） |
| シナリオ | snapshot をそのまま PUT に流す / `enforce_admins.enabled` のネスト残存 / `restrictions.users[].login` のオブジェクト配列残存 |
| 検証コマンド | `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input outputs/phase-13/branch-protection-snapshot-dev.json`（**意図的失敗ケース** / Phase 11 smoke で stage 環境 or `--dry-run` 相当で確認） |
| 期待値 | HTTP 422、レスポンスに該当 field の type / structure エラー |
| Red 状態（仕掛け） | adapter Step を skip して snapshot 直 PUT した時に 422 が返る |
| 対応 | adapter 11 field チェックリスト（Phase 4 §3.1）を Step 2 で必ず通過させる。CI 候補として Phase 12 unassigned-task-detection.md に登録 |

### T7: `required_status_checks.contexts` 未出現値投入による merge 不能（§8.2）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | UT-GOV-004 ゲートと 2 段階適用フォールバックの妥当性 |
| シナリオ | typo / 将来予定 job 名（例: `lint-future` / `typecheck-v2`）を `contexts` に投入 → PR の必須 check が永遠に green にならず merge 不能 |
| 検証コマンド | (1) `jq '.required_status_checks.contexts' payload-dev.json` で投入予定値を列挙 → (2) `gh run list --workflow ci --limit 50 --json name \| jq -r '.[].name' \| sort -u` で実在 job と突合 → (3) 差分が空であること |
| 期待値 | 投入予定 contexts ⊆ 実在 job 名（差分 0）。差分があれば PUT を中止し UT-GOV-004 完了 or 案 D（contexts=[] で第 1 段階適用 → 完了後第 2 段階再 PUT）に切替 |
| Red 状態 | 差分があるまま PUT → PR 全 block。緊急 hotfix も停止 |
| 対応 | Phase 5 Step 0 ゲートで block。`apply-runbook.md` に「contexts 突合 → 差分 0 を確認 → PUT」を必須手順として記載 |

### T8: `enforce_admins=true` での admin 自身 block（§8.4）

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | 緊急 rollback 経路の存在と担当者明記 |
| シナリオ | main の `enforce_admins=true` 適用直後に CI 失敗が発生 / hotfix を直 push する admin 経路も封鎖されている状態 |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.enforce_admins.enabled'` => true → (2) `gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE` の exit 0 → (3) `gh api ... \| jq '.enforce_admins.enabled'` => false → (4) hotfix 後 `gh api ... -X PUT --input rollback-main.json` で復元 |
| 期待値 | DELETE 経路が exit 0 / 復元 PUT で `enforce_admins=true` に戻る / runbook に担当者（solo 運用 = 実行者本人）と連絡経路明記 |
| Red 状態 | DELETE 経路が runbook 未記載 / 担当者未明記 / rollback payload 未生成 |
| 対応 | Phase 5 Step 5.2 を `apply-runbook.md` に必ず転記。Phase 11 smoke で DELETE → 復元 PUT を実走確認 |

### T9: `lock_branch=true` 誤投入（§8.3）

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | adapter 強制値（`lock_branch: false`）の維持 |
| シナリオ | adapter ロジックや手動 payload 編集で `lock_branch: true` が混入 → 全 push 完全停止で incident 時詰む |
| 検証コマンド | `jq -e '.lock_branch == false' outputs/phase-13/branch-protection-payload-dev.json` / 同 main / `jq -e '.lock_branch == false' outputs/phase-13/branch-protection-rollback-{dev,main}.json` |
| 期待値 | payload / rollback すべてで `lock_branch == false`（exit 0） |
| Red 状態 | いずれかの JSON で `lock_branch: true` が混入 |
| 対応 | adapter jq テンプレで `lock_branch: false` を**ハードコード**（Phase 2 §4.2）。CI で T9 を gate 候補化し Phase 12 unassigned-task-detection.md へ登録 |

### T10: dev / main 片側適用ミス（§8.5）

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | dev / main 独立 PUT の維持と片側 drift 検出 |
| シナリオ | dev のみ PUT 成功 / main は失敗（または逆） / bulk script 残存で片側を巻き込んで rollback / `{branch}` サフィックス未分離で applied JSON 上書き |
| 検証コマンド | (1) `test -f outputs/phase-13/branch-protection-applied-dev.json && test -f outputs/phase-13/branch-protection-applied-main.json` → (2) `jq '.url' applied-dev.json \| rg "/dev/protection"` / 同 main → (3) `gh api repos/{owner}/{repo}/branches/dev/protection \| jq -S . > /tmp/get-dev.json && diff /tmp/get-dev.json <(jq -S . outputs/phase-13/branch-protection-payload-dev.json)`（intended diff 以外なし）/ 同 main |
| 期待値 | applied JSON が `{branch}` サフィックス分離で 2 件存在し、それぞれの GET が payload と一致 |
| Red 状態 | 片側のみ生成 / 両者が同一内容（上書き発生）/ bulk script で 1 PUT に統合 |
| 対応 | Phase 5 Step 4 の独立 PUT × 2 を厳守。bulk script を作らない。CI で T10 を gate 候補化 |

### T11: GET → PUT field drift（regression / §8.1）

| 項目 | 内容 |
| --- | --- |
| ID | T11 |
| 観点 | GET 応答の構造変化に追随する adapter のメンテ性 |
| シナリオ | GitHub REST API の GET 応答に新 field が追加 / 既存 field の構造変化（例: `restrictions` の新 sub-resource） / adapter が知らない field が出現したまま PUT に流す |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/main/protection \| jq 'keys'` で snapshot 時点の top-level key 一覧を取得 → (2) Phase 2 §4.1 の 11 field 表と突合 → (3) 表に無い key が出現していないか / 既存 field の type が変わっていないかを `jq 'type'` 単位で確認 |
| 期待値 | 11 field 表で全て説明できる。未知 field が出現した場合は adapter 更新タスクを Phase 12 unassigned-task-detection.md に起票 |
| Red 状態 | 未知 field が出現したまま PUT で 422 / 既存 field の type 変化を adapter が変換しないまま PUT で 422 |
| 対応 | Phase 5 Step 2 の 11 field 突合に「未知 key の検知」ステップを追加。GitHub API バージョン変更時は adapter 再評価を Phase 12 unassigned に登録 |

## fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase / Step |
| --- | --- | --- |
| T6 | lane 2 | Phase 5 Step 2 / Phase 12 CI gate |
| T7 | lane 2 + lane 4 | Phase 5 Step 0 ゲート / Phase 5 Step 4 / Phase 13 第 2 段階再 PUT |
| T8 | lane 5 | Phase 5 Step 5.2 / Phase 11 smoke |
| T9 | lane 2 | Phase 5 Step 2 jq ハードコード / Phase 12 CI gate |
| T10 | lane 4 | Phase 5 Step 4 / Phase 12 CI gate |
| T11 | lane 1 + lane 2 | Phase 5 Step 1〜2 / Phase 12 unassigned（GitHub API バージョン変更時） |

## 完了条件

- [ ] T6〜T11 が `outputs/phase-06/main.md` に表化されている
- [ ] 各テストにシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応が記述されている
- [ ] 6 観点（422 / contexts / enforce_admins / lock_branch / 片側適用 / GET→PUT drift）がカバーされている
- [ ] 緊急 rollback DELETE 経路（T8）が `apply-runbook.md` 転記対象として明記されている
- [ ] 実テスト走行は Phase 11 / 13（ユーザー承認後）に委ねる旨が明示されている

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-06/main.md
rg -c "^### T(6|7|8|9|10|11):" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-06/main.md
# => 6
```

## 苦戦防止メモ

1. **T6 / T9 / T10 は CI gate 化が必須**: 手動 review では adapter 漏れ・bulk 化・lock_branch 混入を検出しきれない。Phase 12 unassigned-task-detection.md に CI gate タスクを登録。
2. **T7 の contexts 突合は PUT 直前に必ず実走**: UT-GOV-004 完了後でも `ci.yml` の job 名変更で drift し得る。`apply-runbook.md` に「PUT 直前に再突合」を必須手順化。
3. **T8 の DELETE 経路は単独で動作確認**: `enforce_admins=true` 復元 PUT が失敗した場合の最終手段。Phase 11 smoke で DELETE → GET 確認を独立シナリオとして実走。
4. **T11 は GitHub API バージョン依存**: 突発的な API 仕様変更で 422 が再発し得る。年次レベルで adapter 再評価を Phase 12 unassigned に置く。
5. **本 Phase は実走しない**: 仕様化のみ。実走は Phase 11 smoke / Phase 13 ユーザー承認後 PUT。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T5（happy path）+ T6〜T11（fail path）の合計 11 件を Phase 7 AC マトリクス入力として渡す
  - T6 / T9 / T10 を CI gate 候補として Phase 12 に申し送り
  - T8 の DELETE 経路 + 担当者明記を Phase 11 apply-runbook.md / Phase 13 PR 説明に転記
- ブロック条件:
  - 6 観点のいずれかが未カバー
  - 緊急 rollback DELETE 経路（T8）が runbook に転記されない
  - dev / main bulk 化禁止（T10）が Phase 5 Step 4 から欠落
