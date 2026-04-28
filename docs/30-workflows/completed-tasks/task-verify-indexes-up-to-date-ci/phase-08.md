# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 |
| 下流 | Phase 9 |
| 状態 | completed |

## 目的

`.github/workflows/verify-indexes.yml`（新規）と既存 workflow（`ci.yml` /
`backend-ci.yml` / `web-cd.yml` / `validate-build.yml`）の重複を棚卸しし、
**DRY 化を即時適用するか / 初回スコープでは見送るか** を Before/After 形式で確定する。
あわせて命名規則・navigation drift を洗い出し、Phase 9（品質保証）が比較できる
構造に整える。

## 方針サマリ

- 共通 setup（`actions/checkout` → `pnpm/action-setup` → `actions/setup-node`
  → `pnpm install`）の重複は **本タスクのスコープでは抽出しない**（理由は下記
  Before/After 表 D-1 の「理由」列）。
- 命名規則・job id・concurrency group は本 Phase で確定し、Phase 5 ランブックの
  placeholder と Phase 9 link チェックの参照点を一致させる。
- navigation drift（CLAUDE.md / README / `aiworkflow-requirements` skill 内参照）
  は本 Phase で grep 観点を提示し、Phase 12（ドキュメント更新）の TODO に
  確実に流す。

## DRY 対象

### 1. 共通 setup の抽出可否（最重要決定）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| D-1 | pnpm/Node setup の 4 〜 5 行ブロック | `ci.yml` / `backend-ci.yml` / `validate-build.yml` で同一手順をインラインで記述。`verify-indexes.yml` も同形でインライン記述する | 同形のインラインを **そのまま許容**（reusable workflow / composite action 化は **本タスクでは見送り**） | (a) `ci.yml` 等は既存稼働中で改変リスクあり。(b) gate 1 本のために共通化導入は YAGNI。(c) 将来 skill index 検証が増えた段階で初めて composite action（例: `.github/actions/setup-pnpm-node`）に切り出す方が責務が明確になる。(d) AC-5「既存 CI と非衝突」を最大限尊重する |
| D-2 | Node 24 / pnpm 10.33.2 のバージョン値 | 各 workflow に直書き | **現状維持**（直書き）。verify-indexes.yml も `node-version: 24`・`version: 10.33.2` を直書きする | (a) `.mise.toml` を single source of truth とする運用に既存 workflow も追従していない。(b) 本タスクで先行統一は scope 越境。(c) Phase 12 で「将来 reusable workflow 化する場合の前提」として申し送る |
| D-3 | concurrency group の命名 | 既存 4 workflow は workflow 単位で独立 group を採用 | `verify-indexes-${{ github.ref }}` を採用し、衝突しないことを Phase 9 で確認 | AC-5 衝突回避の structural 担保。既存と同じ命名パターン（`<workflow-key>-${{ github.ref }}`）を踏襲する |

### 2. 命名規則（本タスクで確定）

| 種別 | Before（揺れ候補） | After（確定） | 理由 |
| --- | --- | --- | --- |
| workflow file 名 | `verify_indexes.yml` / `VerifyIndexes.yml` / `index-verify.yml` | `verify-indexes.yml` | 既存 4 workflow が kebab-case（`backend-ci.yml` / `web-cd.yml` / `validate-build.yml`） |
| workflow `name:` | `Verify Indexes` / `verify-indexes` | `verify-indexes-up-to-date` | Required Status Checks 欄での発見性。元タスクの gate 名と完全一致させる |
| job id | `verify` / `check` / `verify_indexes` | `verify-indexes-up-to-date` | workflow `name` と一致させ、Required Status Checks の文字列マッチで迷わせない |
| step id（drift 検出） | `diff` / `check_diff` | `detect-drift` | 用途明示。後続 step `report-drift` から参照する |
| step id（差分出力） | `report` / `print_diff` | `report-drift` | 用途明示 |
| concurrency group | `verify-indexes` | `verify-indexes-${{ github.ref }}` | 同一 ref 内のみで cancel-in-progress |

### 3. trigger / path filter の統一

| 項目 | Before | After | 理由 |
| --- | --- | --- | --- |
| `on.pull_request` | branches 指定なし | `branches: [main, dev]` | 既存 ci.yml と同一 trigger 構造に揃える |
| `on.push` | 限定なし | `branches: [main, dev]` | 既存 web-cd.yml の「main / dev push」運用と整合 |
| paths filter 採用可否 | `.claude/skills/aiworkflow-requirements/**` だけに絞る案 | **絞らない**（全 PR で起動） | drift は generate-index.js の依存変化や package.json `indexes:rebuild` 変更でも発生する。誤った paths filter が AC-3 false positive と逆方向の false negative を生む |

### 4. navigation drift 棚卸し（Phase 12 への TODO 抽出）

| # | 対象 | 現状 | 期待 After |
| --- | --- | --- | --- |
| N-1 | `CLAUDE.md` の「よく使うコマンド」セクション | `pnpm indexes:rebuild` のみ記載 | 「CI gate `verify-indexes-up-to-date` が drift を検出する」旨を 1 行追記（Phase 12 で確定） |
| N-2 | `README.md`（存在すれば） | 未調査 | CI gate 名の最小追記 or 既存 CI 記述に追従 |
| N-3 | `.claude/skills/aiworkflow-requirements/SKILL.md` 等の indexes 言及行 | post-merge 廃止後の文面に未追従の可能性 | grep で `post-merge` / `indexes:rebuild` を洗い、CI gate 経路に誘導（drift 修正のみ） |
| N-4 | `doc/00-getting-started-manual/lefthook-operations.md` | post-merge 廃止経緯のみ記載 | 「CI 側の authoritative gate は `verify-indexes-up-to-date`」へのリンク追記（本実装AC） |

> 本 Phase ではあくまで **棚卸しと TODO 化** に留める。実書換は Phase 12 で実施する。

### 5. test / fixture の DRY

本タスクは workflow 1 本の追加であり、unit test / fixture を伴わないため対象外。
Phase 4 のテスト戦略（連続 2 回実行 test、意図的 drift fail test）は手動 smoke
（Phase 11）と CI 上での自然 PASS で代替する。

## Before / After 集約

| カテゴリ | Before | After | 削減 |
| --- | --- | --- | --- |
| 共通 setup 抽出 | インライン重複 4 箇所 + 新規 1 = 5 箇所 | 同（5 箇所、抽出見送り） | 0%（YAGNI 判定） |
| 命名 | 4 種以上の揺れ候補 | kebab-case + gate 名一致で 1 種 | 100% |
| trigger / path filter | path filter で誤限定する選択肢 | 全 PR + main/dev push（filter なし） | 揺れ 0 |
| navigation drift | 4 箇所の参照行を未棚卸し | 4 箇所を Phase 12 TODO 化 | 棚卸し 100% |
| test 重複 | N/A | N/A | — |

## 実行タスク

1. 共通 setup 抽出見送り判断と理由を `outputs/phase-08/main.md` に明記
2. 命名規則（workflow / job / step / concurrency）を `outputs/phase-08/naming.md`
3. navigation drift 4 件を `outputs/phase-08/navigation-drift.md` に棚卸しし、
   各行に Phase 12 TODO ID を採番（N-1〜N-4）
4. Before/After 集約表を `outputs/phase-08/before-after.md`
5. Phase 9（品質保証）への引き渡し（line budget / link / mirror parity の前提）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs/phase-02/main.md | 採用設計（独立 workflow file） |
| 必須 | Phase 3 outputs/phase-03/main.md | PASS 判定 + MINOR 2 件 |
| 必須 | Phase 5 outputs/phase-05/main.md | runbook の placeholder と命名整合 |
| 必須 | Phase 7 outputs/phase-07/main.md | AC-1〜AC-7 の触れる範囲 |
| 必須 | .github/workflows/ci.yml | 既存 setup と命名比較 |
| 必須 | .github/workflows/backend-ci.yml | 同上 |
| 必須 | .github/workflows/web-cd.yml | 同上 |
| 必須 | .github/workflows/validate-build.yml | 同上 |
| 参考 | CLAUDE.md | navigation drift N-1 |
| 参考 | doc/00-getting-started-manual/lefthook-operations.md | navigation drift N-4 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 9 | DRY 確定後の line budget / link チェック / mirror parity の対象を引き渡す |
| Phase 12 | navigation drift N-1〜N-4 を TODO として確実に消化 |
| 既存 4 workflow | 改変なし（AC-5 を structural に担保） |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| boundary | #5 | D1 アクセス層に触れない（CI gate のみ） |
| 不変条件全般 | #1〜#7 | 本 Phase で命名・path 確定するが不変条件には触れない |
| 既存 CI 非衝突 | — | concurrency group / trigger / job id の重複なしを Phase 9 で再確認 |
| solo 開発運用 | — | reusable workflow 抽出の YAGNI 判断が solo 運用前提と整合 |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 共通 setup 抽出見送り判断 | completed | D-1〜D-3 |
| 2 | 命名規則の確定 | completed | workflow / job / step / concurrency |
| 3 | trigger / path filter 整合 | completed | path filter 不採用の根拠記載 |
| 4 | navigation drift 棚卸し | completed | N-1〜N-4 |
| 5 | Before/After 集約 | completed | 5 カテゴリ |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-08/main.md | 共通 setup 抽出見送り判断 + 総括 |
| outputs/phase-08/naming.md | 命名規則確定表 |
| outputs/phase-08/navigation-drift.md | N-1〜N-4 棚卸し |
| outputs/phase-08/before-after.md | 5 カテゴリ Before/After |

## 完了条件

- [ ] 共通 setup 抽出を「見送り」と明示し理由 4 点を記録
- [ ] 命名規則が workflow / job / step / concurrency の 4 階層で確定
- [ ] navigation drift 4 件が Phase 12 TODO として棚卸し済み
- [ ] Before/After 集約 5 カテゴリ 一致
- [ ] AC-5（既存 CI 非衝突）に違反する命名 / concurrency が無い

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-08/* 配置済み（main.md / naming.md / navigation-drift.md / before-after.md）
- [ ] artifacts.json の Phase 8 を completed

## 次 Phase

- 次: Phase 9（品質保証）
- 引き継ぎ事項:
  - 命名規則確定（job id `verify-indexes-up-to-date` / concurrency `verify-indexes-${{ github.ref }}`）
  - navigation drift 4 件の Phase 12 TODO（N-1〜N-4）
  - 共通 setup 抽出は本タスクでは行わない（YAGNI）
- ブロック条件: 命名が既存 4 workflow と衝突する場合 Phase 8 再実行
