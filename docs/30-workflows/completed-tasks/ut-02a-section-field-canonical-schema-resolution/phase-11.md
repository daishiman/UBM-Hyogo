# Phase 11: 手動 smoke (NON_VISUAL 代替 evidence)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke (NON_VISUAL 代替 evidence) |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは `taskType: implementation` / `visualEvidence: NON_VISUAL` のため、UI screenshot は取得しない。代わりに以下の 4 種の代替 evidence を取得し、`MetadataResolver` への置換が public / member / admin 3 view を同一 metadata から導出する状態を達成していること、および schema drift（unknown stableKey）を repository 層で検知できる状態にあることを実測で示す。

NON_VISUAL は「VISUAL evidence の代替として infrastructure / contract レベルの実測で代用する」モードであり、production preflight（実 production 環境への deploy 後の smoke）とは別軸の verification である点を厳密に区別する（後述「production preflight 評価軸」参照）。

## 依存境界

- 上流: Phase 10 (最終レビュー) で GO 判定済みであること
- 上流: Phase 5 runbook 通りに `apps/api/src/repository/_shared/metadata.ts` / `builder.ts` 改修が完了し、`builder.test.ts` が存在すること
- 下流: Phase 12 documentation で本 evidence を引用する

## 実行タスク

- [ ] Task 11-1: builder unit test 実行と結果保存
- [ ] Task 11-2: schema drift（unknown stableKey）resolver 失敗ログ取得
- [ ] Task 11-3: 3 view parity 確認 manifest 作成
- [ ] Task 11-4: NON_VISUAL evidence index 作成
- [ ] Task 11-5: manual-test-result.md に 5 観測軸の結果記録
- [ ] Task 11-6: production preflight 評価軸の境界明記
- [ ] Task 11-7: 不変条件 #1 / #2 / #3 / #5 の充足 observation note 記録
- [ ] Task 11-8: artifacts.json の phase 11 status を completed に更新

## 取得対象（4 NON_VISUAL evidence + 1 manual-test-result + 1 main）

| # | ファイル | 取得元 | 観測 | 不変条件 |
| --- | --- | --- | --- | --- |
| 1 | outputs/phase-11/builder-unit-test-result.txt | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared` の生出力 | 全 test PASS / fallback 分岐 0 件 | #1, #2, #3 |
| 2 | outputs/phase-11/drift-detection-log.md | resolver に未登録 stableKey を意図的に渡した試験ログ | `unknownStableKey` 通知が repository 層に到達 | #1 |
| 3 | outputs/phase-11/three-view-parity-check.md | public / member / admin 3 view の field_kind / section_key / label 一致表 | 3 view が同一 metadata から導出 | #1, #2, #3 |
| 4 | outputs/phase-11/non-visual-evidence.md | 上記 3 ファイルへの index と取得手順 | evidence chain の参照可能性 | (process) |
| 5 | outputs/phase-11/manual-test-result.md | 5 観測軸の手動確認 | section 重複 / consent 誤判定 / label 露出 / drift 検知 / alias 失敗 | #1, #2 |
| 6 | outputs/phase-11/main.md | Phase 11 全体サマリ | observation note 集約 | (process) |

## 5 観測軸（manual-test-result.md に記録）

| 観測軸 | 期待値 | 取得方法 | 紐づく AC |
| --- | --- | --- | --- |
| section 重複 | 1 つの field が複数 section に同時に属さない | builder unit test 出力 + 3 view parity manifest | AC-3 |
| consent 誤判定 | `publicConsent` / `rulesConsent` が consent kind として解決され text/select に落ちない | builder unit test の consent ケース | AC-4 |
| label 露出 | `q_section1_company_name` などの stable_key 文字列が外部 view に露出しない | builder unit test の label assertion | AC-5 |
| drift 検知 | 未登録 stableKey 投入時に `unknownStableKey` が repository 層に通知される | drift-detection-log.md | AC-6 |
| alias 失敗時の baseline 解決 | 03a alias queue 未完成時の generated static manifest baseline が動作 | builder unit test の resolver baseline ケース | AC-7 |

## 実行手順

### Part A: builder unit test 取得 (Task 11-1)

```bash
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared \
  | tee docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/builder-unit-test-result.txt
```

期待値:
- 全 test PASS
- 旧推測 fallback 分岐（`stable_key` label 流用 / heuristic kind / broad assignment）が 0 件（AC-2）。`stable_key` resolver 入力参照は許可

### Part B: schema drift 検知ログ取得 (Task 11-2)

resolver に未登録の stableKey（例: `q_unknown_drift_probe`）を渡す試験ケースを `builder.test.ts` 内に「`drift detection`」describe ブロックとして配置し、その実行ログを `outputs/phase-11/drift-detection-log.md` に整形して保存する。記録項目:

- 投入した stableKey
- resolver が返したシグナル（`Result.err(unknownStableKey)` or 例外型）
- repository 層での捕捉ポイント
- ログ出力例

### Part C: 3 view parity 確認 (Task 11-3)

`outputs/phase-11/three-view-parity-check.md` に以下の表を作成:

| stableKey | public view field_kind | member view field_kind | admin view field_kind | public section_key | member section_key | admin section_key | label (public) | label (member) | label (admin) | parity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

全行で `field_kind` / `section_key` / `label` が 3 view 一致していれば parity = OK。

### Part D: NON_VISUAL evidence index (Task 11-4)

`outputs/phase-11/non-visual-evidence.md` に以下を記録:

- 上記 3 ファイル（builder-unit-test-result.txt / drift-detection-log.md / three-view-parity-check.md）への参照
- 各 evidence の取得コマンド・取得時刻（UTC）
- VISUAL 代替であることの明示と、production preflight ではないことの注記

### Part E: production preflight 評価軸の境界 (Task 11-6)

`outputs/phase-11/main.md` 内に以下のセクションを設ける:

- **NON_VISUAL infrastructure verification**: 本 Phase の対象。local 環境での builder unit test / drift 検知 / 3 view parity の実測。
- **production preflight (本 Phase 対象外)**: 09a / 09b で deploy 後に実行する production smoke。本 Phase の PASS は production PASS を意味しない。

両者を混同しないよう、observation note の冒頭に明記する。

## observation note（`outputs/phase-11/main.md` に記録）

各 evidence について以下を記録:

- 取得時刻（UTC）
- 環境（local only / NON_VISUAL）
- 5 観測軸の判定（PASS / FAIL / N/A）
- 不変条件 #1 / #2 / #3 / #5 の充足判定
  - #1: canonical resolver 経由に集約（builder.ts fallback 0 行 + resolver 経由呼び出しで PASS）
  - #2: `publicConsent` / `rulesConsent` の consent kind 確定（unit test PASS で確認）
  - #3: `responseEmail` を field_kind=system として扱う境界（resolver 出力で確認）
  - #5: D1 直接アクセスは `apps/api` 内 metadata resolver に閉じる（コード配置で確認）
- 取得時 anomaly があれば記述

## 統合テスト連携

- 本 Phase の builder unit test 結果は Phase 9 (品質保証) の coverage report と一致すること
- drift 検知ログは Phase 6 (異常系検証) で定義した failure case 表と整合すること
- 3 view parity は Phase 7 AC マトリクス AC-3 / AC-4 / AC-5 のトレース evidence になる

## 多角的チェック観点

- **構造**: evidence 4 ファイル + manual-test-result + main の 6 ファイルが outputs/phase-11/ に揃う
- **実測性**: 3 ファイルすべてが手動推定ではなくコマンド出力 or test 実行ログから生成されていること
- **再現性**: non-visual-evidence.md にコマンドが記載され、第三者が同一手順で再現可能
- **境界明示**: NON_VISUAL ≠ production preflight が main.md 冒頭で宣言されている

## サブタスク管理

- Task 11-1〜11-3 は順次実行（test 結果に依存して drift / parity を取得）
- Task 11-4〜11-7 は Task 11-3 完了後にまとめて実行可能
- Task 11-8 は最後に artifacts.json を更新

## 異常時処理

- builder unit test fail: Phase 5 runbook に戻り、metadata.ts / builder.ts を修正してから再取得
- drift 検知が `unknownStableKey` ではなく silent fallback になっている場合: AC-6 違反 → Phase 5 / Phase 6 に戻る
- 3 view parity 不一致: 04a / 04b 契約と resolver 出力の整合を Phase 3 review record と突き合わせる
- secret hygiene grep（log 内に token / cookie 流入の有無）:
  ```bash
  grep -iE '(token|cookie|authorization|bearer|secret)' \
    docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/*.txt \
    docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/*.md \
    || echo 'PASS'
  ```

## 完了条件

- [ ] 4 NON_VISUAL evidence ファイル（builder-unit-test-result.txt / drift-detection-log.md / three-view-parity-check.md / non-visual-evidence.md）取得済み
- [ ] manual-test-result.md に 5 観測軸の判定が記録されている
- [ ] main.md に production preflight 境界が明記されている
- [ ] 不変条件 #1 / #2 / #3 / #5 の充足が evidence 上で確認可能
- [ ] secret hygiene grep PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスク (11-1〜11-8) completed
- [ ] 全 evidence 配置済み
- [ ] secret hygiene PASS
- [ ] artifacts.json の phase 11 status を completed に更新

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ: 4 evidence ファイル + manual-test-result の参照、5 観測軸の判定結果
