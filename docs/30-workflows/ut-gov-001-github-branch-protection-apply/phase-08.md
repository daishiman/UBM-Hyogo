# Phase 8: リファクタリング (DRY 化)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング (DRY 化) |
| 作成日 | 2026-04-28 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 5 実装ランブック（adapter / payload 生成）と Phase 11 手動 smoke の間で重複しがちな「`{branch}` サフィックスのファイル名生成」「adapter jq 関数」「runbook の dry-run / apply / rollback / 再適用 4 ステップ」「grep 検証手順」を、単一情報源（SSOT）に集約するリファクタ手順を仕様書として確定し、Phase 9 品質保証へ「同概念のロジックが複数箇所に並ぶ」「dev/main 用に二重コピペされた payload 生成手順」状態を持ち越さないようにする。本ワークフローは仕様書整備に閉じる（実コード未実装）ため、本 Phase は Phase 5 着手後に参照される refactor 指針として記述する。

## 実行タスク

1. payload / snapshot / rollback / applied の 4 種ファイルすべてを `{branch}` サフィックスで生成する命名規則を SSOT として確定する（完了条件: ファイル名生成パターンが 1 箇所のテーブルに集約され、Phase 5 / 11 / 13 すべての参照先になっている）。
2. adapter jq 関数を **単一責務の sub-function** に分解する Before/After を提示する（完了条件: `flatten_restrictions` / `extract_enabled_bool` / `normalize_required_pr_reviews_null` の 3 関数以上に分離され、`map_get_to_put(snapshot)` が main エントリで合成されている）。
3. dev / main の手順を for-each（branch list）でループ化し、bulk 化禁止原則を維持しつつ手順テンプレを 1 本化する（完了条件: branch list = `["dev", "main"]` を変数化し、各ステップが branch 引数を取る関数として記述されている）。
4. `apply-runbook.md` の dry-run / apply / rollback / 再適用 4 ステップを 1 つのテンプレに統合し、Phase 11（リハーサル用）と Phase 13（本番用）で同じテンプレを参照する（完了条件: テンプレが 1 ファイル化され、Phase 11 / 13 の runbook が同テンプレへの参照のみで成立する）。
5. grep 検証ロジック（CLAUDE.md ↔ applied の `required_pull_request_reviews=null` 突合）を 1 つのチェッカー関数として定義する（完了条件: チェッカー擬似コードが 1 箇所に集約されている）。
6. outputs/phase-08/main.md に Before/After テーブル・SSOT 集約箇所・adapter 関数分解図を集約する（完了条件: 1 ファイルにすべて記述。spec_created 段階のため「NOT EXECUTED — spec_created」プレースホルダで可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-02.md | base case（lane 1〜5 / state ownership / adapter §4） |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | adapter jq 擬似コードの正本 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-05.md | 実装ランブック（adapter / payload 生成）— spec_created |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8 | 苦戦箇所 §8.1 / §8.5 / §8.6 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md §2 | 草案 JSON |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-08.md | DRY 化 phase の構造参照 |

## Before / After 比較テーブル（リファクタ対象）

> 詳細は `outputs/phase-08/main.md` を参照。本仕様書には観点と代表例のみ記載。
> 依存成果物は Phase 2 base case（adapter §4 / 別ファイル §6 / 4 ステップ §7 / grep §7 ステップ 7）、Phase 6 の 422 異常系、Phase 7 の AC マトリクスとし、Phase 8 はこれらの重複・表記揺れを整理して Phase 9 へ渡す。

### `{branch}` サフィックス命名（SSOT 化）

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| 4 種ファイル名 | dev 用 / main 用で個別ハードコード | `branch-protection-{kind}-{branch}.json` テンプレ × `kind ∈ {payload,snapshot,rollback,applied}` × `branch ∈ {dev,main}` の 1 行で派生 | bulk 化禁止を維持しつつ命名を 1 箇所化（§8.5） |
| ループ展開 | dev 用 / main 用ブロックがコピペ重複 | `for branch in dev main; do ... ; done` の手順テンプレ | 順序事故の発生面を縮小 |
| Phase 11 / 13 参照 | 各 phase の runbook がそれぞれファイル名を直書き | SSOT テーブルへの参照のみ | 表記揺れ 0 |
| applied 出力先 | runbook ごとに別ディレクトリ表記混在 | `outputs/phase-13/branch-protection-applied-{branch}.json` に統一 | navigation drift 0 |

### adapter 関数分解（単一責務化）

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| GET → PUT 変換 | jq 1 ブロックに全 field 変換が直書き（Phase 2 §4.2） | `map_get_to_put(snapshot)` が `flatten_restrictions` / `extract_enabled_bool(field)` / `force_lock_branch_false` / `normalize_required_pr_reviews_null` を合成 | SRP / 単体テスト容易化 |
| `restrictions` flatten | inline `[.restrictions.users[].login]` 等が 3 か所重複 | `flatten_restrictions(.restrictions)` 1 関数に集約（null ガード含む） | 重複ガード一元化 |
| `*.enabled → bool` | 各 field で個別記述（`enforce_admins.enabled` / `required_linear_history.enabled` 等） | `extract_enabled_bool(field; default)` ヘルパー | §8.1 field 差異解消ロジックの SSOT |
| `lock_branch=false` | 各 payload で直書き | `force_lock_branch_false()` で固定値注入 | §8.3 違反防止の単一情報源 |
| `required_pull_request_reviews=null` | 各 payload で直書き | `normalize_required_pr_reviews_null()` で solo 運用ポリシー注入 | CLAUDE.md ブランチ戦略との SSOT 整合 |

### `apply-runbook.md` 手順テンプレ統合

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| 4 ステップ手順 | Phase 11（リハーサル）/ Phase 13（本番）で個別記述 | 共通テンプレ `apply-runbook.template.md` に集約し、両 Phase が参照 | 手順ドリフト 0 |
| dry-run diff コマンド | dev / main で 2 行コピペ | `diff_payload(branch)` 関数 + ループ | 重複解消 |
| rollback 3 経路 | 通常 / 緊急 enforce_admins / 再適用 が散在 | 1 セクションに 3 経路を統合し、緊急経路のみ別 anchor で参照 | §8.4 経路の SSOT |
| grep 検証 | 各 Phase の runbook 末尾で個別記述 | `verify_no_drift()` 関数として 1 箇所化 | §8.6 二重正本 drift 検証の SSOT |
| 担当者明記 | runbook 各所に分散 | runbook 冒頭の「担当 / 連絡経路」表 1 箇所に集約 | solo 運用前提の明確化 |

### 用語・命名

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 「正本」表記 | 「正本」「canonical」「正規」混在 | 「正本 (canonical)」併記で全 Phase 統一 | Phase 2 state ownership と整合 |
| 「派生 payload」呼称 | 「正規化 payload」「PUT payload」「adapter 出力」混在 | 「PUT payload (adapter 正規化済み)」で統一 | snapshot との用途分離を強調 |
| rollback 種別 | 「通常 rollback」「緊急 rollback」「rollback リハーサル」混在 | 「通常 / 緊急 enforce_admins / 再適用」3 経路として固定 | Phase 2 §9 と整合 |

## 重複コードの抽出箇所

| # | 重複候補 | 抽出先 | 他 Phase 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `{branch}` 別ファイル名生成 | Phase 8 SSOT テーブル | 可 | Phase 5 / 11 / 13 すべて |
| 2 | `flatten_restrictions(restrictions)` | adapter ライブラリ（jq モジュールまたは shell function） | 可 | §8.1 解消の中核 |
| 3 | `extract_enabled_bool(field; default)` | 同上 | 可 | enforce_admins / required_linear_history / required_conversation_resolution / allow_force_pushes / allow_deletions / lock_branch / allow_fork_syncing |
| 4 | `for branch in dev main; do ... ; done` ループパターン | apply-runbook テンプレ | 可 | bulk 化禁止を保ちつつコピペ削減 |
| 5 | `verify_no_drift()`（CLAUDE.md ↔ applied grep） | apply-runbook §verify | 可 | §8.6 |
| 6 | rollback 3 経路の手順 | apply-runbook §rollback | 可 | Phase 11 / 13 共通 |
| 7 | snapshot 取得コマンド（GET → ファイル保存） | adapter 前段 lane 1 関数 | 可 | dev / main 共通 |

## navigation drift の確認

| チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-NN.md の成果物 path | 目視 + grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表 × 実 phase-NN.md ファイル名 | `ls phase-*.md` と突合 | 完全一致 |
| Phase 13 出力 path（4 種 × 2 branch = 8 ファイル + runbook） | artifacts.json と本仕様書の整合 | 8 + 1 ファイル一致 |
| `{branch}` サフィックス表記 | `grep -E '\\-(dev|main)\\.json'` | dev / main のみ（その他 branch 名混入なし） |
| Phase 11 / 13 runbook の参照先 | テンプレ統合後の link 一致 | リンク切れ 0 |

## 共通化パターン

- adapter エントリ: `map_get_to_put(snapshot)` が `flatten_restrictions` / `extract_enabled_bool` / `force_lock_branch_false` / `normalize_required_pr_reviews_null` を合成する 1 関数に集約。
- ファイル名規則: `branch-protection-{kind}-{branch}.json` テンプレ × `kind ∈ {payload,snapshot,rollback,applied}` × `branch ∈ {dev,main}` で 8 ファイルを派生。
- 手順順序: 「snapshot 取得 → adapter 正規化 → dry-run → apply → rollback リハーサル → 再適用 → 二重正本 grep」固定。
- 用語: 「正本 (canonical)」「PUT payload (adapter 正規化済み)」「通常 / 緊急 enforce_admins / 再適用 rollback」を全 Phase で固定。

## 削除対象一覧

- Phase 11 / 13 runbook で重複していた dev / main 個別記述（テンプレ参照に置換）。
- snapshot をそのまま PUT に流す擬似コードの混入（§8.1 違反、Phase 6 異常系で検出された場合は除去）。
- `lock_branch=true` を許容する分岐コード（§8.3 違反、固定値 false に置換）。
- `required_pull_request_reviews` を空 object で送る分岐（solo 運用方針違反、`null` に統一）。

## 実行手順

### ステップ 1: SSOT テーブルの作成
- `{kind}` × `{branch}` の 8 ファイル命名表を Phase 8 outputs に固定し、Phase 5 / 11 / 13 から参照させる。

### ステップ 2: adapter 関数分解の Before/After 提示
- Phase 2 §4.2 jq 擬似コードを sub-function 4 つに分解し、合成する main 関数を提示する。

### ステップ 3: apply-runbook テンプレ統合
- dry-run / apply / rollback / 再適用 / verify の 5 セクションを 1 テンプレ化し、Phase 11 / 13 はそれを参照する形にする。

### ステップ 4: rollback 3 経路の SSOT 化
- 通常 / 緊急 enforce_admins / 再適用 の 3 経路を 1 セクションに統合し、緊急経路の担当者・連絡経路を冒頭表に集約する。

### ステップ 5: navigation drift 確認
- artifacts.json と各 phase-NN.md の path 整合（Phase 13 outputs 8 ファイル + runbook 1 通）。

### ステップ 6: outputs/phase-08/main.md に集約
- spec_created 段階では「NOT EXECUTED — spec_created」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | line budget / link 整合 / payload schema 検証の前提として DRY 化済み state を渡す |
| Phase 10 | navigation drift 0 / SSOT 集約完了を GO/NO-GO の根拠に使用 |
| Phase 11 | 共通テンプレ `apply-runbook.template.md` を smoke リハーサルで実走 |
| Phase 12 | implementation-guide.md に adapter 関数分解図を反映 |
| Phase 13 | 本適用 runbook が共通テンプレ参照のみで成立することを user_approval ゲートで確認 |

## 多角的チェック観点

- 価値性: adapter の SRP 化で Phase 6 異常系のテスト容易性が向上、Phase 11 / 13 リハーサル/本番の手順ドリフトが排除される。
- 実現性: jq / shell の関数分解は既存技術範囲。新規依存なし。
- 整合性: 不変条件 #5（D1 触らない）違反なし / CLAUDE.md ブランチ戦略 SSOT と整合 / Phase 2 state ownership 表を維持。
- 運用性: テンプレ 1 ファイル化で手順修正点が局所化、緊急 rollback 担当者表が冒頭に集約。
- 責務境界: adapter は GET → PUT 変換に閉じ、PUT 実行ロジック / grep 検証 / runbook 手順とは別 SSOT。
- bulk 化禁止: ループ化しても dev / main の独立 PUT が破られないことを「per-branch 関数呼び出し」設計で保証。
- 用語ドリフト: 「正本 / PUT payload / 3 経路 rollback」表記揺れ 0。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `{branch}` サフィックス SSOT 化 | 8 | spec_created | 8 ファイル命名表 |
| 2 | adapter 関数分解 Before/After | 8 | spec_created | 4 sub-function + 合成 main |
| 3 | apply-runbook テンプレ統合 | 8 | spec_created | Phase 11 / 13 共通参照 |
| 4 | rollback 3 経路 SSOT 化 | 8 | spec_created | 緊急担当者表 1 箇所 |
| 5 | 用語統一 | 8 | spec_created | 正本 / PUT payload / rollback 種別 |
| 6 | navigation drift 確認 | 8 | spec_created | 8 + 1 ファイル |
| 7 | outputs/phase-08/main.md 作成 | 8 | spec_created | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタ対象テーブル（対象 / Before / After / 理由）と SSOT 集約方針 |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 検証コマンド

```bash
# {branch} サフィックス表記の網羅確認（dev / main 以外混入なし）
grep -rE 'branch-protection-(payload|snapshot|rollback|applied)-(dev|main)\.json' \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/

# adapter 関数分解の検出（jq sub-function が outputs に書かれていること）
grep -nE 'flatten_restrictions|extract_enabled_bool|force_lock_branch_false|normalize_required_pr_reviews_null' \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-08/main.md

# rollback 3 経路の SSOT 確認
grep -nE '通常 rollback|緊急 rollback|再適用' \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-08/main.md

# Phase 11 / 13 runbook がテンプレ参照になっていること
grep -nE 'apply-runbook\.template\.md' \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-11.md \
  docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-13.md \
  2>/dev/null
```

## 完了条件

- [ ] Before/After テーブルが 4 区分（`{branch}` 命名 / adapter 関数分解 / runbook テンプレ / 用語）すべてで埋まっている
- [ ] 重複コード抽出が 5 件以上列挙されている（本仕様では 7 件）
- [ ] navigation drift（artifacts.json / index.md / phase-NN.md / outputs path）が 0
- [ ] adapter sub-function が 4 つ以上に分解されている
- [ ] `apply-runbook.template.md` が SSOT として確定し、Phase 11 / 13 が参照する設計になっている
- [ ] rollback 3 経路が 1 セクションに統合されている
- [ ] outputs/phase-08/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 `outputs/phase-08/main.md` 配置予定（spec_created のためプレースホルダ）
- 用語ドリフト 0 / navigation drift 0
- adapter 関数分解 4 件以上
- artifacts.json の `phases[7].status` が `spec_created`

## 苦戦防止メモ

- adapter sub-function 分解は jq だけでは sub-function 構文が制限されるため、shell wrapper（`adapter.sh`）で関数を切り出す。Node 化は Phase 5 で採用可否を明示的に判定する。
- ループ化（`for branch in dev main`）は **bulk PUT 化ではない**。1 回のループ内で 1 PUT を per-branch 独立に実行することを runbook で必ず明記し、§8.5 違反を防ぐ。
- rollback 3 経路の統合時、緊急経路（enforce_admins=false 化）と通常経路（rollback payload 全体 PUT）の取り違え防止のため、緊急経路は別 anchor + 警告ボックスで隔離する。
- `apply-runbook.template.md` は実 PUT を含まない仕様レベルテンプレ。Phase 13 で実行者承認後の本番版を派生させる。

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SSOT 化済みファイル命名規則（8 ファイル）
  - adapter sub-function 4 件 + 合成 main の分解図
  - `apply-runbook.template.md` の参照網（Phase 11 / 13）
  - rollback 3 経路の統合済み記述
  - 用語統一済みの 3 用語（正本 / PUT payload / rollback 3 経路）
- ブロック条件:
  - Before/After に空セルが残る
  - navigation drift が 0 にならない
  - adapter 関数分解が 4 件未満
  - rollback 3 経路が分散したまま
