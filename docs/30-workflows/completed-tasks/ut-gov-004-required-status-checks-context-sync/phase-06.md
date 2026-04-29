# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 (UT-GOV-004) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（failure-case / governance hazard） |

## 目的

UT-GOV-004 は branch protection を **適用しない** タスクだが、その出力（確定 context 名リスト）が UT-GOV-001 で apply された瞬間に **永続 merge 不能** を引き起こすリスクを孕む。本 Phase では、原典 §8 の 6 類型の苦戦箇所を 6 件以上の failure case マトリクスに展開し、各々の発見手段・mitigation・rollback を runbook 化する。Phase 7 の AC トレースに紐付けする。

## 実行タスク

1. 原典 §8.1〜§8.6 を起点に failure case を 6 件以上マトリクス化する（完了条件: 各ケースに 分類 / 原因 / 検出 / mitigation / rollback の 5 項目が埋まる）。
2. 「永続 merge 不能事故」シナリオを単独の最重要ケースとして詳細化する（完了条件: admin override 手順含む復旧 runbook が完結）。
3. context 名 refactor ドリフト（先に投入した context が後で名前変更される）の運用ルールを mitigation として文書化する（完了条件: 「新旧両 context を一時的に並列必須化 → 旧側 1 回 PASS → 旧除去」のワークフロー記述）。
4. lefthook ↔ CI ドリフトの検出シナリオを定義する（完了条件: ローカル PASS / CI FAIL の再現条件と修復手順）。
5. strict=true 起因 merge 摩擦爆発の検出シナリオと dev / main 別 mitigation を定義する（完了条件: solo 運用 vs チーム運用の閾値あり）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典 §8.1〜§8.6 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-04.md | 検証手段 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-05.md | 確定 context リスト / 対応表 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | apply 側の責務 |
| 参考 | https://docs.github.com/en/rest/branches/branch-protection | branch protection API |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | mitigation | rollback |
| - | --- | --- | --- | --- | --- | --- |
| 1 | 永続 merge 不能 (致命) | 未出現 context を required に投入 | 草案 context 名 (例: `integration-test`) を実在検証なしで投入 | UT-GOV-001 適用直後、PR チェック画面で `Expected — Waiting for status to be reported` が消えない | 投入前に `gh api .../check-runs` で必ず実在確認 (Phase 4 §1) / phase-1 cut-off 3 条件 AND を遵守 (Phase 5 Step 4) | admin で branch protection 編集→該当 context を contexts から外して save / `gh api -X PATCH repos/:owner/:repo/branches/main/protection` |
| 2 | matrix 展開ずれ | matrix 値追加で context 名が `(<old>)` から `(<old>, <new>)` に変化 | matrix 戦略の job key に `name:` 未付与で auto 命名 | Actions UI で context 名末尾の `(...)` 部が変動 | 全 matrix job に明示 `name:` を付与し、matrix 値を含めて固定文字列化（原典 §8.2） / 現状 matrix 不在を Phase 4 で確認済 | 旧 context を contexts から除去 → 新 matrix 展開後の context を実績取得後に再投入 |
| 3 | 同名 job 衝突 | 異 workflow に同 job 名 (例: `lint`) があり設計書で曖昧化 | 確定リストで `<workflow> / <job>` フルパス未使用 | UT-GOV-001 適用後、意図しない workflow の job が match して別の workflow が gate にならない | 確定リストは必ず `<workflow> / <job>` フルパス記載 (Phase 5 Step 4) / 現状実 workflow に `lint` job 名は存在しない | 該当 context を一旦除去 → フルパス指定で再投入 |
| 4 | context 名 refactor ドリフト | 投入後に workflow / job の `name:` を変更 | refactor PR が branch protection 設定変更と分離 | refactor merge 直後から PR が `Waiting for status` で停止 | refactor PR と branch protection 更新を同一 PR で実施するルール / または「新旧両 context を一時的に並列必須化 → 旧側で 1 回 PASS させ → 旧側を除去」の二段階移行 | admin で旧 context を contexts から除去、新 context は実績確認後に追加 |
| 5 | strict 起因 merge 摩擦爆発 | strict=true 下で他 PR の merge 連発により全 PR が rebase ループ | main strict=true を採用 (Phase 5 Step 6 推奨) | PR 上で `This branch is out-of-date with the base branch` が常時表示、CI 連続再実行 | solo 運用では発生確率低 / dev は strict=false 維持 / チーム化時は dev も strict=true 検討時に閾値再評価 | strict=false へ一時切り替え (`gh api -X PATCH ... protection -F required_status_checks.strict=false`) → merge 解消後に true へ戻す |
| 6 | lefthook ↔ CI ドリフト | ローカル lefthook と CI で異なる script / version を使用 | lefthook が `pnpm lint` を呼び CI が `pnpm lint:strict` を呼ぶ等 | ローカル PASS / CI FAIL の常態化 | Phase 5 Step 5 の対応表 grep で同一 `pnpm <script>` を必須化 / `rg -n 'pnpm (typecheck\|lint\|test\|build)' lefthook.yml .github/workflows/` を CI で fail-fast チェック | lefthook.yml または workflow.yml のいずれかを修正し、対応表に整合させる |
| 7 | gh api rate limit 起因の検証スキップ | 検証 batch 中に 5000 req/h 超過 | per_page 未指定や paginate 多発 | `API rate limit exceeded` エラー | per_page=100 + 取得対象を直近 30 日に絞る / Authenticated token で実行 | 1 時間待機後に再実行、または GITHUB_TOKEN を別 PAT に切り替え |
| 8 | check-run 名と context 名の混同 | `check_runs[].name` (job name) と context 名 (`<workflow> / <job>`) を混同 | 仕様書で 1 階層名のみ記録 | UT-GOV-001 投入時に context が一致せず Waiting | Phase 5 Step 3 で必ず `<workflow> / <job>` フルパスを記録 / `gh api commits/.../check-runs` の name は workflow 部を含まない点を Phase 6 ノートに固定 | 投入後即座に admin 編集で contexts を訂正 |

合計: 8 件（要件 6 件以上を満たす）。

## 永続 merge 不能事故 復旧 runbook（Case 1 詳細）

```bash
# 1) 即座に branch protection 編集 (admin token 必須)
gh api -X GET repos/:owner/:repo/branches/main/protection \
  --jq '.required_status_checks' > /tmp/current-protection.json

# 2) 不正 context を除去
jq '.contexts = (.contexts | map(select(. != "integration-test")))' \
  /tmp/current-protection.json > /tmp/fixed-protection.json

# 3) PATCH で適用
gh api -X PATCH repos/:owner/:repo/branches/main/protection/required_status_checks \
  --input /tmp/fixed-protection.json

# 4) 停止していた PR の merge を再開できることを確認
gh pr list --base main --json number,statusCheckRollup
```

> 復旧後、原因分析として「投入時の Phase 4 存在性検証スキップ」が無かったかを必ず post-mortem に記録する。

## context 名 refactor ドリフト 二段階移行 runbook（Case 4 詳細）

```markdown
## 段階 A: 並列必須化（refactor 前）

1. 新 context 名 (例: `ci-new`) を workflow に追加し PR を main に merge
2. main で 1 回以上 SUCCESS を確認 (`gh api .../check-runs --jq '.check_runs[]|select(.name=="ci-new")|.conclusion'`)
3. branch protection の contexts に **新旧両方** を一時追加

## 段階 B: 旧 context 除去（refactor 後）

4. 旧 context を生成していた job 定義を削除する PR を merge
5. 並列期間中の最後の SUCCESS 実績を確認
6. branch protection の contexts から旧 context を除去
```

## lefthook ↔ CI ドリフト 検出 runbook（Case 6 詳細）

```bash
# 同一 pnpm script の出現箇所を抽出
rg -n 'pnpm (typecheck|lint|test|build)' lefthook.yml .github/workflows/

# 期待: lefthook 側と workflow 側で同名 script のペアが存在
# 不一致時は Phase 5 Step 5 の対応表を更新し、いずれかを書き換える
```

CI に組み込む場合の擬似 step（UT-GOV-005 等で実装可能）:

```yaml
- name: lefthook-ci-mapping-drift-check
  run: |
    set -euo pipefail
    diff \
      <(rg -oN 'pnpm \w+' lefthook.yml | sort -u) \
      <(rg -oN 'pnpm \w+' .github/workflows/ci.yml | sort -u) \
      || (echo "lefthook ↔ CI drift detected"; exit 1)
```

## 各ケース ↔ Phase 4 検証スイート wire-in

| Case # | 対応する Phase 4 検証 |
| --- | --- |
| 1, 8 | 存在性検証 (`gh api .../check-runs`) |
| 2, 3 | 抽出スクリプト dry-run (matrix 展開有無 / フルパス採用) |
| 4 | 段階適用 phase-1 健全性 + 二段階移行 mitigation |
| 5 | strict 採否決定メモ (Phase 5 Step 6) のレビュー |
| 6 | lefthook ↔ CI 対応表 grep (Phase 5 Step 5) |
| 7 | `gh api` 検証コマンドテンプレートの per_page / window 指定 |

## 実行手順

1. 8 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記
2. Case 1 (永続 merge 不能) 復旧 runbook を別セクションに展開
3. Case 4 (refactor ドリフト) 二段階移行 runbook を展開
4. Case 6 (lefthook ↔ CI ドリフト) 検出 grep を CI 組み込み擬似 yaml で記載
5. 検証スイート wire-in を Phase 4 マトリクスと相互参照

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 8 件 case ID を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 11 | Case 1 復旧 runbook を staging で 1 回 dry-run smoke |
| Phase 12 | Case 6 を CI 化する案を UT-GOV-005 unassigned-task に登録 |

## 多角的チェック観点

- 価値性: 「永続 merge 不能事故」が phase-1 投入で本当に発生しないことを担保しているか。
- 実現性: 復旧コマンドが admin token (`repo` scope) のみでコピペ実行可能か。
- 整合性: 8 件 case が原典 §8.1〜§8.6 を漏れなくカバーするか (§8.1=#1, §8.2=#2, §8.3=#3, §8.4=#5, §8.5=#6, §8.6=#4)。
- 運用性: solo 開発前提 (CLAUDE.md 記載) で strict=true (main) が現実的に運用可能か。
- 認可境界: 復旧時に admin token が必要であることが事前周知されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 8 件 failure case マトリクス | spec_created |
| 2 | Case 1 復旧 runbook 詳細化 | spec_created |
| 3 | Case 4 二段階移行 runbook 詳細化 | spec_created |
| 4 | Case 6 検出 grep / CI 擬似 yaml 化 | spec_created |
| 5 | Phase 4 wire-in 紐付け | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 8 件マトリクス + 3 ケース復旧 runbook + Phase 4 wire-in |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 6 件以上の failure case が分類別に網羅 (実績 8 件)
- [ ] Case 1 復旧 runbook が `gh api -X PATCH` 完結
- [ ] Case 4 二段階移行ワークフローが段階 A / B で記述
- [ ] Case 6 grep が CI 組み込み擬似 yaml で例示
- [ ] 全 case が Phase 4 検証スイートに wire-in

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置予約
- 原典 §8.1〜§8.6 全てが case # に対応
- 永続 merge 不能事故が単独で詳細化されている

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 8 件 case # を AC-1〜AC-7 トレース表の「関連 failure case」列で参照
  - Case 1 / 4 / 6 復旧 runbook を Phase 11 staging smoke の対象に予約
  - Case 6 (lefthook ↔ CI ドリフト) CI 化を UT-GOV-005 リレー候補として Phase 12 unassigned へ
- ブロック条件:
  - 6 件未満で Phase 7 へ進む
  - Case 1 復旧手順が記述されないまま完了
