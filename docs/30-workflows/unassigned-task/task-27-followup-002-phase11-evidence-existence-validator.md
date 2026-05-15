# Phase 11 evidence 実在性 validator 追加 - タスク指示書

## メタ情報

```yaml
issue_number: 730
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-27-followup-002-phase11-evidence-existence-validator                     |
| タスク名     | Phase 11 evidence 実在性 validator 追加                                       |
| 分類         | スキル改善 / Validator                                                        |
| 対象機能     | `task-specification-creator` skill の Phase 12 verification                   |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | task-27 Phase 12 skill-feedback-report                                        |
| 発見日       | 2026-05-15                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

task-27 (UI MVP W9 SOLO MVP 3-Layer Task Mapping) は docs-only / NON_VISUAL タスクであり、Phase 11 で UI スクリーンショットを撮影する代わりに `manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md` などの代替証跡 (textual evidence) を Phase 11 outputs として残す運用にしている。

Phase 12 では `phase12-task-spec-compliance-check.md` 内に「Phase 11 evidence パスと Status 列」の表が出力され、`task-specification-creator` skill の `scripts/verify-phase12-compliance.js` (もしくは既存の `validate-phase11-canonical-evidence-paths.js` / `validate-phase11-screenshot-coverage.js`) が compliance check を行う想定になっている。

### 1.2 問題点・課題

- phase-12 compliance check の `Status` 列を手書きで `present` と宣言しても、実体ファイルが存在しないままパスする運用ホールが残っている
- docs-only / NON_VISUAL タスクで頻出する Phase 11 代替証跡 (`manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md`) のパターンが validator の glob / 必須パスリストで網羅されていない
- 結果として「宣言は present だが file は未生成」という drift を Phase 12 CI gate (`verify-phase12-compliance`) が検知できない
- task-27 では人手チェックで気づいたが、将来の docs-only タスクで同じ落とし穴を踏むリスクがある

### 1.3 放置した場合の影響

- Phase 11 が「実体未生成のまま present」と記録された不完全な状態で Phase 12 を通過する事故が再発する
- skill-feedback-report で同種 gap が繰り返し検出され、Phase 12 / Phase 13 の信頼性が低下する
- docs-only タスクの evidence governance が形骸化し、本来要求されるテキスト証跡が無いまま PR が merge される

---

## 2. 何を達成するか（What）

### 2.1 目的

Phase 11 outputs として宣言された evidence パスが「Status = present」である場合、対応する file が物理的に存在することを機械的に突合する validator を追加し、`verify-phase12-compliance` CI gate に結線する。

### 2.2 最終ゴール

- `task-specification-creator` skill に Phase 11 evidence 実在性 validator が追加されている
- validator は docs-only / NON_VISUAL タスクで使われる代替証跡パターン (`manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md`) を網羅
- `phase12-task-spec-compliance-check.md` の Status 列 (`present` 宣言) と実体ファイル存在が一致しない場合に validator が exit 1
- `.github/workflows/verify-phase12-compliance.yml` (または既存 gate) から呼び出され、CI で fail として検知される

### 2.3 スコープ

#### 含むもの

- Phase 11 evidence 宣言パスを compliance check ファイルから抽出する parser
- 抽出された各パスの実在検証 (`fs.existsSync` ベース)
- docs-only 代替証跡パターン (manual-test-result / manual-smoke-log / link-checklist) の網羅
- 既存 `validate-phase11-canonical-evidence-paths.js` との責務整理
- CI gate (`verify-phase12-compliance`) からの呼び出し

#### 含まないもの

- evidence の内容妥当性検証 (実在チェックのみ。中身の品質は別 validator)
- Phase 11 outputs のテンプレ自動生成
- screenshot 系 (`validate-phase11-screenshot-coverage.js` が既存で担当する VISUAL タスクは対象外)

### 2.4 成果物

- `.claude/skills/task-specification-creator/scripts/validate-phase11-evidence-existence.js` (新規) または既存 validator への機能追加
- 既存 `.github/workflows/verify-phase12-compliance.yml` への呼び出し追加
- skill 内 references に「docs-only 代替証跡パターン一覧」の追記

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-specification-creator` skill が Phase 12 verification scripts を保持している
- task-27 の `phase12-task-spec-compliance-check.md` がサンプルケースとして使用できる
- CI gate `verify-phase12-compliance` が既に存在する、または本タスクで併設する

### 3.2 依存タスク

- なし (skill 自己完結)

### 3.3 必要な知識

- Node.js (`fs.existsSync`, `path.resolve`)
- markdown table parsing (compliance check の Status 列抽出)
- `task-specification-creator` skill の Phase 11 / Phase 12 SSOT 構造
- GitHub Actions workflow

### 3.4 推奨アプローチ

1. `phase12-task-spec-compliance-check.md` から evidence 表を parse し `(path, status)` ペアを抽出
2. `status === "present"` のものについて `fs.existsSync(workflowRoot + path)` を実行
3. 1件でも missing があれば exit 1 し、missing リストを stdout に出力
4. docs-only 代替証跡パターンを定数化し、Phase 11 outputs ディレクトリ内の glob と突合

---

## 4. 実行手順

### Phase構成

1. evidence 抽出 + 実在検証スクリプトの追加
2. CI gate 結線

### Phase 1: evidence 抽出 + 実在検証スクリプトの追加

#### 目的

`phase12-task-spec-compliance-check.md` 内 Phase 11 evidence 宣言の `present` を機械的に検証する。

#### 手順

1. `.claude/skills/task-specification-creator/scripts/validate-phase11-evidence-existence.js` を新規作成
2. compliance check markdown の Phase 11 evidence 表を regex / markdown parser で抽出
3. `status === "present"` のパスを `fs.existsSync` で検証
4. docs-only 代替証跡パターン (manual-test-result.md / manual-smoke-log.md / link-checklist.md) を必須パスリストとして網羅
5. task-27 outputs で動作確認 (現状 manual-test-result.md は実在 → green)
6. 意図的に 1 件 missing にして exit 1 を確認

#### 成果物

`validate-phase11-evidence-existence.js` と unit test fixture (task-27 sample)

#### 完了条件

- task-27 サンプルで green / 意図的 missing で red が再現できる

### Phase 2: CI gate 結線

#### 目的

`verify-phase12-compliance` workflow から validator を呼び出し、drift を CI で fail にする。

#### 手順

1. `.github/workflows/verify-phase12-compliance.yml` を作成または更新
2. 既存の Phase 12 validator chain に `validate-phase11-evidence-existence.js` を追加
3. dev / main の required status checks に追加候補として記録 (実 PUT はユーザー承認後)

#### 成果物

CI workflow と required status check 候補リスト

#### 完了条件

PR で意図的に Phase 11 evidence を欠落させた場合、CI gate が fail する

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `validate-phase11-evidence-existence.js` が追加されている
- [ ] docs-only 代替証跡 3 パターン (manual-test-result / manual-smoke-log / link-checklist) を網羅
- [ ] `status === "present"` 宣言のうち実体未生成のものを 1 件でも検知すると exit 1
- [ ] task-27 outputs を使った green / red 双方の動作確認が済んでいる

### 品質要件

- [ ] CI gate `verify-phase12-compliance` から呼び出されている
- [ ] 既存 `validate-phase11-canonical-evidence-paths.js` / `validate-phase11-screenshot-coverage.js` と責務が重複しない
- [ ] skill のコンテキスト負荷を増やさない (Progressive Disclosure)

### ドキュメント要件

- [ ] skill `references/` に docs-only 代替証跡パターン一覧を追記
- [ ] task-27 followup として `unassigned-task` audit が currentViolations = 0

---

## 6. 検証方法

### テストケース

- task-27 `phase12-task-spec-compliance-check.md` をそのまま流して green
- `manual-test-result.md` を一時退避して red (exit 1 + missing パス出力)
- `manual-smoke-log.md` を `present` 宣言したが未生成にして red
- `link-checklist.md` を `present` 宣言したが未生成にして red

### 検証手順

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase11-evidence-existence.js \
  --compliance-check docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-12/phase12-task-spec-compliance-check.md

# CI gate 再現
gh workflow run verify-phase12-compliance.yml --ref <feature-branch>
```

---

## 7. リスクと対策

| リスク                                                              | 影響度 | 発生確率 | 対策                                                                     |
| ------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------ |
| compliance check の markdown 表記がタスクごとに揺れて parse 失敗    | 中     | 中       | parser を寛容に書きつつ、揺れた書式は skill template 側で正規化する      |
| 既存 validator との責務重複                                         | 中     | 中       | canonical-evidence-paths は「期待 path 集合」、本 validator は「present 宣言 vs 実在」と責務分離 |
| docs-only パターンが将来増えた際に validator が追従できない         | 低     | 中       | パターン定数を skill references から読み込み、追加コスト小に              |
| CI gate 失敗で sync-merge / 既存 PR がブロックされる                | 中     | 低       | 段階導入 (warn → fail) で既存 PR を救済                                  |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-11/manual-test-result.md`
- `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js`
- `.claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js`

### 参考資料

- task-specification-creator skill SSOT (Phase 11 / Phase 12 構造)
- Phase 12 verification gate 関連 workflow

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-27 Phase 12 で実際に遭遇した困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | task-27 (docs-only / NON_VISUAL) で `phase12-task-spec-compliance-check.md` の `Status` 列を手書きで `present` と記述したが、対応する Phase 11 evidence ファイルが実体として未生成のまま compliance check が通過してしまった |
| 原因     | 既存 validator (`validate-phase11-canonical-evidence-paths.js` / `validate-phase11-screenshot-coverage.js`) は VISUAL タスクの screenshot 命名規約に最適化されており、docs-only 代替証跡 (manual-test-result.md / manual-smoke-log.md / link-checklist.md) のパターンが網羅されていない。`status === "present"` という宣言と file 実在の機械的突合がそもそも実装されていなかった |
| 対応     | task-27 内では人手レビューで気づき manual-test-result.md を実体生成して整合を取った。skill-feedback-report.md に「Phase 12 verification must fail when a Phase 11 evidence path is claimed as `present` but the file does not physically exist.」として gap を記録 |
| 再発防止 | 本タスクで `validate-phase11-evidence-existence.js` を追加し、docs-only 代替証跡パターンを網羅した上で `verify-phase12-compliance` CI gate に結線する。これにより「宣言 present だが file 未生成」という drift を機械的に検知できる状態にする |

### レビュー指摘の原文（該当する場合）

```
Phase 12 verification must fail when a Phase 11 evidence path is claimed as `present` but the file does not physically exist.
(task-27 Phase 12 skill-feedback-report.md)
```

### 補足事項

- 本タスクは `task-specification-creator` skill 自己改善であり、特定 feature のリリースには紐づかない
- 既存 `validate-phase11-canonical-evidence-paths.js` との責務分担を明確にし、重複しないよう実装する (canonical = 期待パス集合, existence = present 宣言 vs 実体)
- 段階導入 (warn → fail) で既存 PR を救済しつつ最終的に required status check 候補へ
