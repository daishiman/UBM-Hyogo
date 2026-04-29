# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts 同期 (UT-GOV-004) |
| Phase 番号 | 3 / 3（本セッション分） |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 以降（後続セッションで作成） |
| 状態 | spec_created |
| タスク分類 | governance / docs-only / NON_VISUAL（design review） |

## 目的

Phase 2 の設計（context-name-mapping.md / staged-rollout-plan.md / lefthook-ci-correspondence.md）に対して、最低 3 つ（実装上は 4 つ）の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と本タスク固有の 4 観点（branch protection 永続停止リスク / merge 摩擦 / CI 実績 / hook 整合性）に対する PASS / MINOR / MAJOR 判定を付与し、UT-GOV-001 着手可否ゲートを通すこと。

## 実行タスク

1. 代替案を最低 3 つ列挙する（A: 全 context 一括投入 / B: 段階適用 = base case / C: strict main のみ / D: 契約テスト先行）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 4 観点で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載されている）。
5. UT-GOV-001 着手可否ゲートを定義する（完了条件: GO / NO-GO 条件が明示されている）。
6. open question を Phase 4 以降（後続セッション）に引き渡す（完了条件: 各 open question に受け皿が指定されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-02.md | レビュー対象設計 |
| 必須 | outputs/phase-02/context-name-mapping.md | base case のマッピング |
| 必須 | outputs/phase-02/staged-rollout-plan.md | base case の段階適用 |
| 必須 | outputs/phase-02/lefthook-ci-correspondence.md | base case の hook ↔ CI 対応 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 後続タスクの入力契約 |
| 参考 | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | strict mode 公式 |

## 代替案比較

### 案 A: 全 context 一括投入（草案 8 件をそのまま投入）

- 概要: 草案 8 contexts を実績確認なしで一気に `required_status_checks.contexts` に投入。
- 利点: 設計の意図がそのまま branch protection に反映される。Phase 2 の調査コストがゼロ化。
- 欠点: 実在しない context が含まれていれば、その瞬間から main / dev への merge が **永続停止**。事故影響が極大。**MAJOR**。

### 案 B: 段階適用（Phase 2 採用 = base case）

- 概要: 実績確認済 context のみフェーズ 1 で投入し、新規 context は UT-GOV-005 等で workflow 新設後にフェーズ 2 で後追い投入。
- 利点: 永続停止リスクをゼロに近づける。投入対象の真正性が担保される。lefthook と CI の対応表が整備されドリフト摩擦も解消。
- 欠点: 一部 context（security-scan / docs-link-check / phase-spec-validate 等）の保護が遅れる。フェーズ 2 投入忘れリスクがあり、UT-GOV-005 完了時に Phase 4 以降で reminder が必要。

### 案 C: strict main のみ + 最小 contexts

- 概要: contexts は typecheck / lint / build の 3 件最小に絞り、main のみ `strict: true`。dev は contexts 投入せず free pass。
- 利点: 投入リスク最小、merge 摩擦も最小。
- 欠点: dev が無保護化し、staging 段階での fail を main PR まで持ち越す。価値性 MINOR。dev での CI 検証が個人ガバナンスに依存。

### 案 D: 契約テスト先行（投入前に dry-run で context 報告検証）

- 概要: 投入前に PR を 1 本作って `gh pr checks <pr>` で全 contexts が報告されることを観測してから本投入。
- 利点: 永続停止リスクを完全にゼロ化できる検証ステップを追加。
- 欠点: 工程が 1 段階増え運用コストが上がる。base case（案 B）の実績確認で実質同等の安全性が得られるため過剰。整合性 MINOR（base case と冗長）。

### 代替案 × 評価マトリクス

| 観点 | 案 A (一括) | 案 B (段階適用 = base) | 案 C (strict main のみ) | 案 D (契約テスト先行) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | MINOR（dev 無保護） | PASS |
| 実現性 | PASS | PASS | PASS | PASS |
| 整合性 | MAJOR（草案と実在のドリフト前提） | PASS | PASS | MINOR（B と冗長） |
| 運用性 | MAJOR（事故時の rollback コスト極大） | PASS | PASS | MINOR（工程増） |
| branch protection 永続停止リスク | MAJOR（実証なしで投入） | PASS（実績確認必須） | PASS（最小限） | PASS（dry-run 検証） |
| merge 摩擦 | PASS | PASS（dev=false / main=true で調整） | PASS（最小） | PASS |
| CI 実績 | MAJOR（未確認） | PASS（gh api 証跡） | PASS（既知 3 件のみ） | PASS（dry-run） |
| hook 整合性 | MINOR（lefthook 未整理のまま） | PASS（対応表 + 共有規約） | MINOR（最小ゆえ未整理） | PASS |

### 採用結論

- base case = **案 B（段階適用）**。
- 理由:
  - 4条件すべて PASS、本タスク固有の 4 観点もすべて PASS。
  - 案 A は永続停止 MAJOR、案 C は dev 無保護化で価値性 MINOR、案 D は案 B と機能重複で整合性 MINOR。
  - lefthook ↔ CI 対応表の整備により hook 整合性も担保される唯一の案。
- 案 D の dry-run 検証は base case の実績確認で実質代替されるが、フェーズ 2 投入時に追加で適用する余地がある旨を open question に記録。
- 案 C の dev 軽量化は MVP solo 運用の実態と整合する側面があるため、`strict` 採否の最終決定（dev=false）に部分的に取り込む。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず、UT-GOV-001 着手可。 |
| MINOR | 警告レベル。後続 Phase で運用補足（reminder / dry-run 追加 / runbook 追記）が必要だが、UT-GOV-001 着手は許可。 |
| MAJOR | block。UT-GOV-001 着手禁止。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-GOV-001 が安全に実行できる |
| 実現性 | PASS | grep + gh api で完結 |
| 整合性 | PASS | 草案と実在のドリフトを段階適用で吸収 |
| 運用性 | PASS | 名前変更事故の運用ルール + ロールバック手順あり |
| branch protection 永続停止リスク | PASS | 投入前 check-run 実績確認が AC-3 で担保 |
| merge 摩擦 | PASS | dev=`strict: false` / main=`strict: true` で段階調整 |
| CI 実績 | PASS | gh api 証跡を context-name-mapping.md §5 に記録 |
| hook 整合性 | PASS | 同一 pnpm script 共有規約 + 対応表 |

## UT-GOV-001 着手可否ゲート（GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（4 以降の後続セッション）が指定されている
- [ ] context-name-mapping.md §3「確定 context リスト」に YAML コピペ可能な形で確定値が並ぶ
- [ ] staged-rollout-plan.md にロールバック手順が含まれる
- [ ] lefthook-ci-correspondence.md に strict 採否（dev / main 別）が記載されている

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- 確定 context リストに実績証跡欠落の行がある
- 同名 job のフルパス記載が破られている
- ロールバック手順が未定義
- lefthook と CI が同一 pnpm script を呼ばない設計が残っている

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 | 備考 |
| --- | --- | --- | --- |
| 1 | フェーズ 2 投入時に案 D（dry-run 契約テスト）を追加適用するか | 後続 Phase 5 (実装ランブック相当) | UT-GOV-005 完了後の検討事項 |
| 2 | `strict: true` を main で適用後、merge 摩擦の実測値が許容範囲か | 後続 Phase 11 (手動 smoke 相当) | solo 運用での rebase コストを 1 ヶ月観測 |
| 3 | security-scan / docs-link-check / phase-spec-validate の workflow 新設は誰が実施するか | UT-GOV-005 | 本タスクではリレーするのみ |
| 4 | verify-indexes.yml と phase-spec-validate 草案の関係（既存代替の可能性） | 後続 Phase 5 / UT-GOV-005 | 現行 verify-indexes.yml が phase-spec-validate の代替として使えるか要調査 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述する。
- 各案に概要・利点・欠点を 3〜5 行で記述する。

### ステップ 2: 評価マトリクス作成

- 8 観点（4条件 + 4 観点）× 4 案を表化、空セルゼロを確認。

### ステップ 3: base case 確定

- 案 B が PASS のみで構成されることを確認、選定理由を代替案比較から導出。

### ステップ 4: 着手可否ゲート判定

- GO / NO-GO チェックリストを通す。
- GO の場合のみ artifacts.json の Phase 3 を `spec_created` のままにし、後続 Phase へ進める。

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| 後続 Phase 4 (テスト戦略) | base case を入力に、実績確認 / マッピング検証のテスト計画を組む |
| 後続 Phase 5 (実装ランブック) | open question #1, #4 を実装時に確定 |
| 後続 Phase 11 (手動 smoke) | open question #2 を 1 ヶ月観測 |
| UT-GOV-001 | 確定 context リスト + strict 採否を入力契約として受け取る |
| UT-GOV-005 | 除外 context のリレー先として受け取る |

## 多角的チェック観点

- 永続停止リスク: 案 A の MAJOR を base case が踏まないか。
- 整合性: 全代替案で governance 層に閉じ、アプリ層の不変条件に影響を与えないか確認したか。
- 運用性: 名前変更事故と rollback の運用ルールが base case で担保されているか。
- 認可境界: branch protection の admin override 権限が誰に付与されるか（後続 Phase で確認）。
- ドリフト検出: lefthook と CI の対応表が継続的に維持される運用プロセスがあるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | spec_created | A〜D |
| 2 | 評価マトリクス（8 観点 × 4 案） | 3 | spec_created | 空セルゼロ |
| 3 | base case 最終 PASS 判定 | 3 | spec_created | 案 B 確定 |
| 4 | PASS/MINOR/MAJOR 基準定義 | 3 | spec_created | 3 レベル |
| 5 | UT-GOV-001 着手可否ゲート | 3 | spec_created | GO / NO-GO |
| 6 | open question 引き渡し | 3 | spec_created | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・UT-GOV-001 着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 8 観点 × 4 案のマトリクスに空セルが無い
- [ ] base case（案 B）の最終判定が全観点 PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] UT-GOV-001 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 4 件すべてに受け皿が割り当てられている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4条件 + 4 観点すべて PASS、MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 以降（後続セッションで作成）
- 引き継ぎ事項:
  - base case = 案 B（段階適用、dev `strict: false` / main `strict: true`、確定 context リストはフェーズ 1 で投入、除外は UT-GOV-005 経由でフェーズ 2 投入）
  - context-name-mapping.md §3 の確定リストを UT-GOV-001 入力として渡す
  - open question 4 件を後続 Phase / UT-GOV-005 へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - 確定 context リストに実績証跡欠落の行がある
