# Phase 7: AC マトリクス（受入条件 × 検証 Phase）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（受入条件 × 検証 Phase） |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |

## 目的

原典スペック (`docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md`) §2.2 で定義された AC（6 件）に加え、本タスクで派生した運用観点を含めた **AC-1〜AC-10** を Phase 1〜6 の検証手順とクロス参照する。各 AC ごとに「検証 Phase / 検証コマンド or 手順 / 期待結果 / 検証担当」を一覧化し、実装担当者が Phase 9 / 10 の GO/NO-GO 判定で利用できる粒度に揃える。

> 本タスクはアプリコード非含のため、line / branch coverage は適用しない。AC × Phase × 観察対象の 3 軸マトリクスでカバレッジ責務を担う。

## 実行タスク

- タスク1: AC-1〜AC-10 を原典 §2.2 から派生して定義する。
- タスク2: 各 AC を検証する Phase / コマンド / 期待結果 / 検証担当のクロスマトリクスを作成する。
- タスク3: 空セルや未割当 AC が無いことを完了条件とする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | §2.2 想定 AC（原典） |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-04.md | T1〜T4 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-05.md | Step 0〜5 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-06.md | T5〜T9 |

## AC 定義（AC-1〜AC-10）

### 原典由来（AC-1〜AC-6）

| AC ID | 内容 | 原典 §2.2 対応 |
| --- | --- | --- |
| AC-1 | リポジトリ直下に `.github/CODEOWNERS` が存在する | §2.2 (1) |
| AC-2 | governance 5 パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）に owner が明示されている | §2.2 (2) |
| AC-3 | global fallback (`* @daishiman`) が 1 行配置され、最終マッチ勝ち仕様を踏まえた順序になっている | §2.2 (3) |
| AC-4 | `gh api .../codeowners/errors` で `errors: []` が確認できる | §2.2 (4) |
| AC-5 | `doc/` 表記が `docs/` に統一されている、または不可避ケースのみ明示記録されている | §2.2 (5) |
| AC-6 | main branch protection 設定で `require_code_owner_reviews` を有効化しない方針が明記され、CODEOWNERS が ownership 文書として機能することが確認されている | §2.2 (6) |

### 本タスク派生（AC-7〜AC-10）

| AC ID | 内容 | 派生根拠 |
| --- | --- | --- |
| AC-7 | CODEOWNERS の glob は `**` 形式に統一され、末尾 `/` 有無の差異が混入していない | Phase 6 T7 / 落とし穴 §8-5 |
| AC-8 | owner は本タスク時点で個人ハンドル (`@daishiman`) のみで構成され、未存在の team handle / user handle が混入していない | Phase 6 T6 / 落とし穴 §8-3 |
| AC-9 | post-merge（main 反映後）に `gh api .../codeowners/errors` の再確認が実施され、errors=[] が記録されている | Phase 5 Step 5 |
| AC-10 | CI 自動 gate（codeowners-validator 等）の導入可否が判定され、不採用の根拠（T4 の 3 条件）または再評価トリガが Phase 12 へ申し送られている | Phase 4 T4 / 過剰品質回避 |

## AC × 検証 Phase マトリクス

| AC ID | 検証 Phase | 検証コマンド / 手順 | 期待結果 | 検証担当 |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 5 Step 3 / Phase 11 | `test -f .github/CODEOWNERS` | exit 0 | 実装担当者 |
| AC-2 | Phase 5 Step 4 (T2) | test PR で 5 パスに無害 file → suggested reviewer 確認 | 5 パスすべて `@daishiman` が表示 | 実装担当者（UI 目視） |
| AC-3 | Phase 5 Step 3 / Phase 6 T9 | `head -20 .github/CODEOWNERS` で 1 行目が `* @daishiman`、governance ルールが末尾配置 | 順序が正本通り | 実装担当者 |
| AC-4 | Phase 5 Step 4 (T1) | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` | `[]` | 実装担当者 |
| AC-5 | Phase 5 Step 1 / Step 2 / Step 5 (T3) | `rg -n "(^\|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!docs/30-workflows/completed-tasks/**' .` | 0 hit、または除外記録済みのみ | 実装担当者 |
| AC-6 | Phase 5 Step 0 / 関連: UT-GOV-001 | branch protection 草案で `required_pull_request_reviews.require_code_owner_reviews=false`（or null）であることを目視確認、本ファイル `phase-05.md` Step 0 ゲート記述を再確認 | `require_code_owner_reviews` が true でない | 実装担当者 + UT-GOV-001 連携 |
| AC-7 | Phase 5 Step 3 / Phase 6 T7 | `rg "^[^#].* @" .github/CODEOWNERS` で governance 行がすべて `**` 形式 | 末尾 `/` のみや末尾なし表記が無い | 実装担当者 |
| AC-8 | Phase 5 Step 4 (T1) / Phase 6 T6 | `gh api .../codeowners/errors` の errors=[] かつ `grep -E "@[^ ]+/" .github/CODEOWNERS` で team 形式が出現しない | 個人ハンドル `@daishiman` のみ | 実装担当者 |
| AC-9 | Phase 5 Step 5 | main マージ後 `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` を再走しログを `outputs/phase-11/manual-smoke-log.md` に記録 | `[]` | 実装担当者（post-merge） |
| AC-10 | Phase 4 Step 0 / Phase 12 | T4 の 3 条件チェックリストを `outputs/phase-04/main.md` に記録、再評価トリガを Phase 12 unassigned-task-detection.md に登録 | 不採用の根拠 or 再評価トリガが文書化済み | 実装担当者 + Phase 12 申し送り |

## AC × T テスト 対応

| AC ID | T1 構文 | T2 UI | T3 表記 | T4 CI 判定 | T5 構文異常 | T6 silently skip | T7 glob | T8 両残置 | T9 順序逆転 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | - | - | - | - | - | - | - | - | - |
| AC-2 | ◎ | ◎ | - | - | - | △ | △ | - | △ |
| AC-3 | - | - | - | - | - | - | - | - | ◎ |
| AC-4 | ◎ | - | - | - | ◎ | - | - | - | - |
| AC-5 | - | - | ◎ | - | - | - | - | ◎ | - |
| AC-6 | - | - | - | - | - | - | - | - | - |
| AC-7 | △ | ◎ | - | - | - | - | ◎ | - | - |
| AC-8 | ◎ | △ | - | - | △ | ◎ | - | - | - |
| AC-9 | ◎ | - | ◎ | - | - | - | - | - | - |
| AC-10 | - | - | - | ◎ | - | - | - | - | - |

> 凡例: ◎ = 主たる検証 / △ = 補助検証 / - = 該当なし。
> AC-1 / AC-6 はテスト T 群ではなく Phase 5 Step での文書／配置確認で担保するため T 列はすべて `-`。

## 空セル検査

各 AC が「Phase / コマンド / 期待結果 / 検証担当」の 4 列をすべて埋めていること。AC × T 表で AC-1 / AC-6 を除く 8 件に ◎ が 1 つ以上存在すること。

## 統合テスト連携

- 本マトリクスは Phase 9（品質保証） / Phase 10（GO/NO-GO 判定） / Phase 11（実走証跡）の入力として再利用する。
- AC-9（post-merge 再確認）は Phase 11 の `manual-smoke-log.md` に必ず実値を記録する。
- AC-10（CI gate 判定）は Phase 12 unassigned-task-detection.md に再評価トリガを記載する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC-1〜AC-10 × Phase × T テストの 3 軸マトリクス |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## 完了条件

- [ ] AC-1〜AC-10 が `outputs/phase-07/main.md` に定義されている
- [ ] 各 AC に検証 Phase / 検証コマンド or 手順 / 期待結果 / 検証担当が表で記述されている
- [ ] AC × T テスト対応表で AC-1 / AC-6 を除く 8 件に ◎ が 1 つ以上存在する
- [ ] AC-1（ファイル存在）と AC-6（必須レビュー無効）が文書配置 / 方針記述で担保される旨が明記されている
- [ ] AC-10 の CI gate 不採用判定が再評価トリガ付きで Phase 12 申し送り対象になっている
- [ ] 「全ファイル一律 X%」のような薄いカバレッジ閾値が **記述されていない**

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-07/main.md
rg -c "^### AC-[0-9]+" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-07/main.md || \
  rg -c "AC-[0-9]+\b" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-07/main.md
# AC-1 〜 AC-10 が言及されている
rg -q "全ファイル一律" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-07/main.md && echo NG || echo OK
```

## 苦戦防止メモ

1. **AC-6 を CODEOWNERS だけで担保しない**: branch protection 草案 (UT-GOV-001) と連動して確認する必要がある。AC-6 の検証担当に「UT-GOV-001 連携」を明記。
2. **AC-9 の post-merge 確認を省かない**: PR 段階の T1 が Green でも、main 反映後に他要因（並走 PR の merge 等）で errors が増えるケースを想定。
3. **AC-10 を Phase 12 に申し送る**: 本タスクで CI gate を不採用としても、将来条件が変わった場合の再起票トリガを残す。
4. **AC-1 / AC-6 に T 列の ◎ を無理に置かない**: T テストは挙動検証であり、ファイル存在 / 方針記述は文書配置で担保する別レイヤ。
5. **本 Phase は実走しない**: 仕様化のみ。実値記録は Phase 11 / 実装 PR で行う。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC × Phase × T のマトリクスを Phase 9 / 10 GO/NO-GO 判定の根拠として再利用
  - AC-9 / AC-10 を Phase 11 / Phase 12 への明示的申し送り項目とする
- ブロック条件:
  - AC のいずれかが Phase / コマンド / 期待結果 / 検証担当の欠落を持つ
  - 「全ファイル一律 X%」表記が混入
  - AC-6 が CODEOWNERS 単体で担保される誤った記述になっている
