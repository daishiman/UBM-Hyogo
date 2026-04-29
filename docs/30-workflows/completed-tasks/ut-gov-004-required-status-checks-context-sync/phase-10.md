# Phase 10: 最終レビュー / GO-NO-GO

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Required Status Checks の context 名同期 (UT-GOV-004) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー / GO-NO-GO |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（governance gate） |

## 目的

Phase 1〜9 で蓄積した抽出結果・対応表・段階適用判定・lefthook 対応表・strict 採否・QA 結果を横断レビューし、AC-1〜AC-7（原典 §2.2 想定 AC を Phase 7 で AC-1〜AC-7 として定式化）すべての達成状態と 4 条件最終判定を確定する。本 Phase の最重要目的は **「UT-GOV-001 へ安全に確定 context リストを引き渡せる状態か」** の明示的な GO/NO-GO ゲート設置である。NO-GO 時のリレー先（UT-GOV-005 へ未存在 context を移送、UT-GOV-001 を block 維持）も併せて確定する。

## 実行タスク

1. AC-1〜AC-7 の達成状態を spec_created 視点で評価する（完了条件: 7 件すべてに「未実装だが仕様確定」「仕様未確定」のいずれかが付与）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定を確定する（完了条件: PASS / MINOR / MAJOR が一意に決定）。
3. blocker 一覧を governance 観点で確定する（完了条件: 4 種 blocker（未出現 context 残存 / matrix 展開未確認 / strict 決定保留 / lefthook 整合未確認）が定義されている）。
4. UT-GOV-001 への引き渡し条件を schema 形式で明示する（完了条件: `confirmed-contexts.yml` v1 schema が GO 必須入力として明記）。
5. NO-GO 時のリレー先を確定する（完了条件: UT-GOV-005 / UT-GOV-001 へのフォールバック手順が記述）。
6. GO/NO-GO 判定を確定し、`outputs/phase-10/go-no-go.md` に記述する（完了条件: GO 条件全 6 項目 / NO-GO 条件全 4 項目が PASS / FAIL 表形式で記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/context-name-mapping.md | 設計時の context 対応表 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/staged-rollout-plan.md | 設計時の段階適用案 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/lefthook-ci-correspondence.md | 設計時の hook / CI 対応 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-08.md | DRY 化結果 / `confirmed-contexts.yml` schema |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-09.md | governance QA 4 観点 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典 §2.2 想定 AC |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | consumer タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md | リレー先 |
| 参考 | https://docs.github.com/en/rest/branches/branch-protection | API 仕様 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、Phase 1〜9 で具体的に確定し、UT-GOV-001 が直接消費可能な schema として表現されているかで判定する。

| AC | 内容（原典 §2.2） | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 全 workflow / job 名一覧化 | 仕様確定 | Phase 5 抽出ヘルパ + outputs/phase-08 extracted-jobs.md | PASS |
| AC-2 | 草案 8 contexts × 実在 context 確定（fullpath / matrix 込み） | 仕様確定 | Phase 8 mapping-table.md + `confirmed-contexts.yml` | PASS |
| AC-3 | 過去 30 日の成功実績確認 | 仕様確定 | Phase 6 段階適用判定 + Phase 9 QA 観点 1 | PASS |
| AC-4 | 未出現 context は除外 + 段階適用案記述 | 仕様確定 | `deferred_contexts[]` + 後追い投入条件 | PASS |
| AC-5 | lefthook hook ↔ CI 対応表 | 仕様確定 | Phase 8 lefthook-ci-mapping.md（pnpm script 中継） | PASS |
| AC-6 | UT-GOV-001 が直接参照可能な確定リスト | 仕様確定 | `confirmed-contexts.yml` v1 | PASS |
| AC-7 | strict 採否決定 + 根拠記述 | 仕様確定 | Phase 9 strict-decision.md（dev=false / main=true） | PASS |

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-GOV-001 着手前に永続 block 事故を構造的に排除し、governance wave 全体の前提を整える。 |
| 実現性 | PASS | 抽出 / 対応表 / 判定の 3 工程が共通ヘルパ 4 個に収束、`gh api` で 30 日成功実績取得可能。 |
| 整合性 | PASS | 不変条件 #5（D1 直接アクセス禁止等）に抵触しない。lefthook ↔ CI が pnpm script で結ばれている。 |
| 運用性 | PASS | schema バージョン化により次 wave での context 追加が UT-GOV-001 から逆参照可能、運用ルールが文書化済み。 |

**最終判定: GO（PASS）**

## blocker 一覧（governance 観点）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 未出現 context 残存 | データ | `confirmed-contexts.yml` の `contexts[].apply_phase==1` 全件で `last_green_run_at` が 30 日以内 | YAML loader で抽出 + ISO8601 比較 |
| B-02 | matrix 展開未確認 | データ | matrix を持つ workflow 全件で実 check-run の context 名を Actions UI と照合済み | `gh api` 出力との突合 |
| B-03 | strict 決定保留 | 設計 | `strict_decision.dev` / `strict_decision.main` の両方が bool で固定 | YAML grep |
| B-04 | lefthook 整合未確認 | 設計 | lefthook ↔ CI 三項対応表で空欄 / 片側 only 行ゼロ | 表の機械的検査 |

> B-01〜B-04 のいずれかが未解消の場合、Phase 11 着手は NO-GO となり、UT-GOV-001 への引き渡しも block される。

## UT-GOV-001 への引き渡し条件（GO 必須入力）

UT-GOV-001 が本タスクから受け取る確定 context リストは、以下の schema を満たすこと。

```yaml
# 引き渡し schema（v1 固定）
version: 1
generated_at: <ISO8601>
source_task: "UT-GOV-004"
target_consumer: "UT-GOV-001"
strict_decision:
  dev: <bool>
  main: <bool>
contexts:
  - name: <string>            # GitHub に登録済みの実在 context 名（必須）
    draft_origin: <string>    # 草案語との対応（監査用）
    last_green_run_at: <ISO8601>
    matrix_expansion: <list|null>
    apply_phase: 1            # 即投入対象
deferred_contexts:
  - draft_origin: <string>
    reason: <string>
    relay_to: <string>        # UT-GOV-005 等
    promotion_criteria: <string>
```

**UT-GOV-001 側の契約**: `contexts[].name` を文字列配列として取り出し、`strict_decision.<env>` と組み合わせて GitHub Branch Protection PATCH body の `required_status_checks` をそのまま組み立てる。**追加加工は禁止**（加工が必要な場合は UT-GOV-004 に差し戻す）。

## NO-GO 時のリレー先

| 状況 | リレー先 | 理由 |
| --- | --- | --- |
| 未出現 context が存在し、新規 workflow / job 追加が必要 | UT-GOV-005（docs-only / non-visual / template / skill sync 系 CI 追加） | 新 workflow 設置はそちらの責務 |
| matrix 展開で意図せぬ context 名が登録されている（job rename 必要） | 本タスク Phase 5 へ差し戻し | 草案 → 実在の名寄せ問題 |
| strict 採否で運用合意が取れない | Phase 9 strict-decision.md へ差し戻し | 4 条件再評価 |
| UT-GOV-001 着手は本タスク GO まで block 維持 | UT-GOV-001 に「依存タスク未完了」フラグを残す | 永続 block 事故防止 |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-7 全件 PASS
- [ ] 4 条件最終判定 PASS
- [ ] blocker B-01〜B-04 すべて解消
- [ ] `confirmed-contexts.yml` v1 schema を満たす成果物が `outputs/phase-08/` に存在
- [ ] `strict_decision` の dev / main 両方が bool で確定
- [ ] lefthook ↔ CI 三項対応表に空欄ゼロ

### NO-GO 条件（一つでも該当）

- 未出現 context が phase 1 リストに残存している
- matrix 展開後の context 名が実 check-run と不一致
- strict 採否未決定
- lefthook ↔ CI 対応に片側 only 行が残る

> NO-GO 時は上記「NO-GO 時のリレー先」表に従って差し戻し / リレーを行う。UT-GOV-001 着手は GO 確定まで保留。

## Phase 13 承認ゲートとの連動

- 本 Phase の GO 判定は Phase 13（PR 作成 / 完了タスク移送）の承認ゲートに直結する。
- Phase 13 で PR を作成する際は、Phase 10 の `outputs/phase-10/go-no-go.md` を PR description に転記し、レビュアー（solo 運用では self-review）が GO 条件 6 項目を再確認すること。
- いずれかの GO 条件が PR レビュー時に reproducible でない場合、Phase 13 は merge 不可（branch protection の `required_conversation_resolution` でも block される）。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 草案 `phase-spec-validate` の workflow 新設は誰がやるか | UT-GOV-005 へリレー | unassigned-task 候補 |
| 2 | matrix 展開時の context 名フォーマット変更（GitHub 側仕様変更）追従 | Phase 12 unassigned-task-detection.md | 監視継続 |
| 3 | dev で strict=true への将来昇格条件 | Phase 12 へ送出 | 運用観測後判断 |

## 実行手順

### ステップ 1: AC-1〜AC-7 達成状態評価
- Phase 7 AC マトリクスを基に再評価。

### ステップ 2: 4 条件最終判定
- Phase 9 QA 結果から PASS を継承。

### ステップ 3: blocker 4 種を確定
- B-01〜B-04 の解消条件を文書化。

### ステップ 4: UT-GOV-001 への引き渡し schema を最終確認
- `confirmed-contexts.yml` v1 が PATCH body を直接組み立て可能か。

### ステップ 5: NO-GO 時のリレー先を表化

### ステップ 6: GO/NO-GO 判定を `outputs/phase-10/go-no-go.md` に記述

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test 仕様（テンプレ）作成 |
| Phase 12 | open question を unassigned-task-detection.md に formalize |
| Phase 13 | GO 判定を PR description に転記、承認ゲートと連動 |
| UT-GOV-001 | GO 確定後に `confirmed-contexts.yml` を直接消費して PATCH 実行 |
| UT-GOV-005 | `deferred_contexts[].relay_to` の未存在 context を新規 workflow 化 |

## 多角的チェック観点

- 価値性: UT-GOV-001 を安全に着手可能にする gate が立てられている。
- 実現性: GO 判定全 6 項目が機械的に検証可能。
- 整合性: 不変条件と矛盾する事項なし。
- 運用性: NO-GO 時のリレー先が明記され、行き先不明の項目ゼロ。
- 認可境界: 本タスクは context リスト確定までで、書込みは UT-GOV-001。
- governance: Phase 13 承認ゲート（PR review）と本 Phase GO 条件が連動。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-7 達成状態評価 | 10 | spec_created | 7 件 |
| 2 | 4 条件最終判定 | 10 | spec_created | PASS |
| 3 | blocker 4 種確定 | 10 | spec_created | B-01〜B-04 |
| 4 | UT-GOV-001 引き渡し schema 最終確認 | 10 | spec_created | v1 |
| 5 | NO-GO リレー先表化 | 10 | spec_created | 4 状況 |
| 6 | GO/NO-GO 判定記述 | 10 | spec_created | GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・blocker・引き渡し schema |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-7 全件に達成状態が付与
- [ ] 4 条件最終判定が PASS
- [ ] blocker B-01〜B-04 が解消条件付きで記述
- [ ] UT-GOV-001 への引き渡し schema (v1) が GO 必須入力として明記
- [ ] NO-GO 時のリレー先が 4 状況すべてで指定
- [ ] GO/NO-GO 判定が GO で確定
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` が配置予定
- AC × 4 条件 × blocker × 引き渡し schema × NO-GO リレー × GO/NO-GO の 6 観点すべて記述
- Phase 13 承認ゲートとの連動が記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / NON_VISUAL)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - blocker 4 種が解消済みであることの証跡
  - `confirmed-contexts.yml` v1 が UT-GOV-001 直接参照可能であること
  - `gh api check-runs` 出力との突合手順を Phase 11 smoke で実施
- ブロック条件:
  - blocker B-01〜B-04 のいずれかが未解消
  - `confirmed-contexts.yml` が v1 schema を満たさない
  - strict 採否未確定
  - NO-GO リレー先が未指定

## 依存成果物参照

- `outputs/phase-02/context-name-mapping.md`
- `outputs/phase-02/staged-rollout-plan.md`
- `outputs/phase-02/lefthook-ci-correspondence.md`
