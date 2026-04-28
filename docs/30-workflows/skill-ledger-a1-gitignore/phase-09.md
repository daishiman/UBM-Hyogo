# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 8 までで整備した命名・ガード・section ルールを前提に、line budget / link 整合 / mirror parity の 3 観点で品質保証チェックを行い、Phase 10 最終レビューに必要な客観的根拠を揃える。本ワークフローは docs-only / spec_created に閉じるため、無料枠見積・secret hygiene・a11y は対象外（インフラ governance / docs のみで完結する）と明記する。検証コマンドの単一情報源は `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-a1-gitignore`。

## 実行タスク

1. line budget を確認する（完了条件: 各 phase-NN.md が 100〜500 行範囲、index.md が 250 行以内、outputs/phase-NN/main.md が 50〜400 行範囲）。
2. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-NN.md 間のリンク切れが 0）。
3. mirror parity を確認する（完了条件: 本ワークフローは N/A 判定であることが明記されている。ただし将来 `.claude/skills/<skill>` 配下を実改変する PR で再評価する手順は残す）。
4. 無料枠 / secret hygiene / a11y が「対象外」であることを明記する（完了条件: 3 項目すべて対象外と記述）。
5. `validate-phase-output.js` を実行し、artifacts.json と phase-NN.md / outputs path の整合を機械検証する（完了条件: exit 0）。
6. outputs/phase-09/main.md に QA チェックリスト結果を集約する（完了条件: 1 ファイルにすべて記述。spec_created のためプレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-08.md | DRY 化済みの hook ガード / `.gitignore` 整列 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/index.md | AC / Phase 一覧 / 関連サービス |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/artifacts.json | path 整合の起点 |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 機械検証スクリプト |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-09.md | QA phase の構造参照 |

## line budget 確認

| ファイル | 想定行数 | budget | 判定方針 |
| --- | --- | --- | --- |
| index.md | 約 167 行（既存） | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100〜500 行 | 500 行上限（task-specification-creator 規約）/ 100 行下限 | 100 行未満は内容不足、500 行超は分割を Phase 10 で検討 |
| outputs/phase-NN/main.md | 50〜400 行 | 個別判定 | spec_created プレースホルダは 50 行未満許容 |

> 計測コマンド: `wc -l docs/30-workflows/skill-ledger-a1-gitignore/phase-*.md docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-*/main.md`

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| Phase 10 outputs path 表記 | `outputs/phase-10/main.md` に統一 | Phase 8 で確定した正規表記に全箇所一致 |
| index.md × phase-NN.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-NN.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/task-specification-creator/SKILL.md` 等 | 実在確認 |
| 原典 unassigned-task 参照 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/129` | 200 OK（手元では `gh issue view 129` で確認） |
| Phase 5 runbook link | `../completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md` | 実在 |

## mirror parity（N/A 判定）

- 本ワークフローは `docs/30-workflows/skill-ledger-a1-gitignore/` 配下のドキュメント整備のみを行い、`.claude/skills/` 配下の skill 資源を改変しない。
- ゆえに `.claude` 正本と `.agents` mirror の rsync diff は **本ワークフローでは N/A**。
- 将来 Phase 5 別 PR で `.claude/skills/<skill>/indexes/*.json` 等の untrack を行う場合、その PR では `rsync -avn --delete .claude/skills/ .agents/skills/` の dry-run 結果を `outputs/phase-09/mirror-diff.txt` に保存し、parity 0 を確認すること（手順は本仕様書に残しておく）。

### 将来の mirror parity 確認手順（参考）

```bash
# dry-run で差分のみ確認（actual sync は行わない）
rsync -avn --delete .claude/skills/ .agents/skills/ \
  > outputs/phase-09/mirror-diff.txt
wc -l outputs/phase-09/mirror-diff.txt   # 期待: header 行のみ
```

## 対象外項目（明記）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積 (Workers / D1 / Sheets) | 対象外 | 本ワークフローは Cloudflare resource を消費しない。`.gitignore` / hook の docs-only 整備のみ |
| secret hygiene | 対象外 | Secret 導入なし（`artifacts.json.secrets_introduced=[]`）。Phase 5 別 PR でも secret 追加は発生しない |
| a11y (WCAG 2.1) | 対象外 | UI なし。infrastructure governance タスク |
| free-tier-estimation.md | 不要 | 上記 3 項目が対象外のため別ファイル化しない |

## 検証コマンド

```bash
# 機械検証（artifacts.json × outputs path × phase 一覧）
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/skill-ledger-a1-gitignore

# line budget 計測
wc -l docs/30-workflows/skill-ledger-a1-gitignore/phase-*.md \
      docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-*/main.md

# link 切れ検出（相対参照）
grep -rn '\](\.\./\|\](\./\|](outputs/' \
  docs/30-workflows/skill-ledger-a1-gitignore/

# Phase 10 outputs path 表記揺れ検出
grep -rn 'phase-10/main.md' \
  docs/30-workflows/skill-ledger-a1-gitignore/
```

## QA チェックリスト（サマリー）

> 詳細は `outputs/phase-09/main.md`。本仕様書には観点のみ記載。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | line budget (phase-NN.md) | 100〜500 行 | spec_created 段階で計測予定 |
| 2 | line budget (index.md) | 250 行以内 | 既存 167 行 → PASS |
| 3 | line budget (outputs/main.md) | 50〜400 行（プレースホルダは < 50 許容） | spec_created |
| 4 | link 整合 (相対) | リンク切れ 0 | spec_created |
| 5 | link 整合 (Phase 10 path) | 表記正規化済み | Phase 8 で正規化方針確定 |
| 6 | mirror parity | N/A | 本ワークフローでは適用外 |
| 7 | 無料枠 | 対象外 | resource 消費なし |
| 8 | secret hygiene | 対象外 | secret 導入なし |
| 9 | a11y | 対象外 | UI なし |
| 10 | validate-phase-output.js | exit 0 | 実走で確認 |

## 実行手順

### ステップ 1: line budget 計測
- `wc -l` で全 phase-NN.md / outputs を測る。500 行超があれば Phase 10 で分割検討。

### ステップ 2: link 検証
- `grep` で相対参照を抽出し、`ls` 突合。

### ステップ 3: Phase 10 outputs path 表記正規化確認
- Phase 8 で確定した表記が全箇所に反映済みかを確認。

### ステップ 4: mirror parity N/A 明記
- 「本ワークフローでは N/A、将来 PR で再評価」を outputs/phase-09/main.md に記述。

### ステップ 5: validate-phase-output.js 実走
- exit 0 を確認。失敗時は stderr を outputs/phase-09/verify-error.txt に保存。

### ステップ 6: outputs/phase-09/main.md 集約
- QA チェックリスト 10 項目を 1 ファイルに集約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | QA 結果を GO/NO-GO の根拠に使用 |
| Phase 11 | 将来実走時の検証コマンドの再利用 |
| Phase 12 | implementation-guide.md に検証コマンドを転記 |
| Phase 13 | PR description に QA サマリーを転記 |

## 多角的チェック観点

- 価値性: line budget / link 整合の自動検証で Phase 10 GO/NO-GO の客観性を担保。
- 実現性: `validate-phase-output.js` 既存スクリプトで完結。
- 整合性: 不変条件 #5 を侵害しない / Phase 8 用語統一を維持。
- 運用性: 検証コマンド 1 行で再現可能。
- 認可境界: secret 導入なし、対象外を明記。
- 無料枠: resource 消費なし、対象外を明記。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | line budget 計測 | 9 | spec_created | 100〜500 行範囲 |
| 2 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 3 | Phase 10 path 表記正規化確認 | 9 | spec_created | Phase 8 出力を再確認 |
| 4 | mirror parity N/A 明記 | 9 | spec_created | 将来手順含む |
| 5 | 対象外項目（無料枠 / secret / a11y）明記 | 9 | spec_created | 3 件 |
| 6 | validate-phase-output.js 実走 | 9 | spec_created | exit 0 |
| 7 | outputs/phase-09/main.md 集約 | 9 | spec_created | QA チェックリスト |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA チェックリスト結果（10 項目） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] line budget が全 phase で 100〜500 行範囲内
- [ ] index.md が 250 行以内
- [ ] outputs/phase-NN/main.md の行数チェック完了
- [ ] link 検証でリンク切れ 0
- [ ] Phase 10 outputs path 表記が全箇所で一致
- [ ] mirror parity が N/A と明記
- [ ] 無料枠 / secret hygiene / a11y が対象外と明記
- [ ] validate-phase-output.js が exit 0
- [ ] outputs/phase-09/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-09/main.md` に配置予定
- 対象外 3 項目が明記
- artifacts.json の `phases[8].status` が `spec_created`

## 苦戦防止メモ

- `validate-phase-output.js` が `outputs/phase-NN/main.md` の存在を要求する場合、outputs/artifacts.json と root artifacts.json を同期してから実行する。失敗時は stderr を保存して Phase 10 で判断。
- mirror parity は実改変 PR で初めて意味を持つ。本ワークフローで「N/A」とだけ書いて終わらせず、将来手順（rsync dry-run）を残すこと。
- line budget は 500 行が task-specification-creator の上限。本仕様書群は phase-03 が 229 行であり余裕。

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QA 10 項目の判定結果（spec_created プレースホルダ）
  - Phase 10 outputs path 表記正規化の最終確認結果
  - mirror parity N/A 判定
  - 対象外 3 項目（無料枠 / secret / a11y）
- ブロック条件:
  - line budget 超過が解消されない
  - link 切れが残る
  - validate-phase-output.js が exit 1
