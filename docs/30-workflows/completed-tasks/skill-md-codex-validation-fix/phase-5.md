# Phase 5: 実装（GREEN）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 名称 | 実装（GREEN） |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

Lane A / B / C を並列実行し、Phase 4 の RED テストを Green にする。

## 並列レーン構造

```
[ Lane A: 既存 SKILL.md 是正 ]    [ Lane B: フィクスチャ rename ]
       (A-1 / A-2 / A-3 並列)              ↓
                                    [ Lane C: skill-creator 改修 ]
                                       (C は B 完了後に整合確認)
```

| Lane | 並列性 | 担当 |
| --- | --- | --- |
| A-1 | 並列 | aiworkflow-requirements |
| A-2 | 並列 | automation-30 |
| A-3 | 並列 | skill-creator SKILL.md |
| B | A と完全並列 | フィクスチャ |
| C | B 完了後に最終整合 | skill-creator scripts |

## 着手前チェック（R3-01 対応）

```bash
# description テキスト依存箇所の grep
grep -rn "Anchors:" .claude/skills/aiworkflow-requirements/SKILL.md \
  | wc -l   # Anchors 行を参照するロジックが他にないか確認

grep -rn "fixtures/.*/SKILL\.md" .claude .agents 2>/dev/null
# ヒット箇所はすべて Lane B 影響先として記録
```

## 新規作成ファイル

| パス | 内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/keywords.md` | description から退避した keywords（既存 keywords.json と並列） |
| `.claude/skills/automation-30/references/elegant-review-prompt.md` | プロンプト本文の正本 |
| `.claude/skills/skill-creator/references/anchors.md` | 7 anchors の正本 |
| `.claude/skills/skill-creator/scripts/utils/validate-skill-md.js` | 共通バリデータ |
| `.claude/skills/skill-creator/scripts/utils/yaml-escape.js` | YAML safe escape ヘルパー |
| `.claude/skills/skill-creator/scripts/__tests__/codex_validation.test.js` | 新規テスト |

## 修正ファイル

| パス | 変更概要 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | description 圧縮、references 追記 |
| `~/.agents/skills/aiworkflow-requirements/SKILL.md` | canonical と同一に同期 |
| `.claude/skills/automation-30/SKILL.md` | description 再構成、本文 references 化 |
| `.claude/skills/skill-creator/SKILL.md` | description 短縮、Anchors 外出し |
| `.claude/skills/skill-creator/scripts/generate_skill_md.js` | 事前ゲート / escape / 上限 / 退避 / フィクスチャパス変更 |
| `.claude/skills/skill-creator/scripts/init_skill.js` | writeFile 直前ゲート |
| `.claude/skills/skill-creator/scripts/quick_validate.js` | utils/validate-skill-md.js を import |
| `.claude/skills/skill-creator/scripts/validate_structure.js` | 同上 |
| `.claude/skills/skill-creator/scripts/__tests__/quick_validate.test.js` | フィクスチャ読み替え対応 |
| `.gitignore` | `fixtures/*/SKILL.md` 追加 |
| `.claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md` | 全件 → `SKILL.md.fixture` にリネーム |

## Lane A 詳細タスク

### T5-A1: aiworkflow-requirements

1. canonical (`.claude/skills/aiworkflow-requirements/SKILL.md`) を編集
   - description を 5-7 行に圧縮（≤ 800 字）
   - frontmatter は string 値（description は double-quoted scalar に統一）
2. `references/keywords.md` を新規作成し、退避した長尺 keywords を保持
3. mirror (`~/.agents/skills/aiworkflow-requirements/SKILL.md`) を canonical からコピーして同期
4. `validate-skill-md.js` で双方を検証

### T5-A2: automation-30

1. SKILL.md を編集
   - description を 1 段落に置換
   - body は概要 + references 導線
2. `references/elegant-review-prompt.md` を新規作成し、現在の description / body 内のプロンプト本文を退避

### T5-A3: skill-creator SKILL.md

1. description の Anchors を削除し、要約 4-5 行に
2. `references/anchors.md` を新規作成し、7 anchors の正本を保持
3. SKILL.md 内に `Anchors の詳細は [references/anchors.md] を参照` の 1 行追加

## Lane B 詳細タスク

### T5-B1: 影響箇所走査

```bash
grep -rn "fixtures.*SKILL\.md" .claude .agents
```

ヒット箇所はテスト / ドキュメント問わず全件記録。

### T5-B2: リネーム

```bash
find .claude/skills/skill-creator/scripts/__tests__/fixtures \
  -name "SKILL.md" \
  -exec sh -c 'git mv "$0" "${0}.fixture"' {} \;
```

### T5-B3: テストヘルパー追加

`scripts/__tests__/helpers/load-fixture.js`（新規）に `loadFixture(name)` を実装。`.fixture` を読み込み一時 `SKILL.md` に書き出す方式 / もしくは tmp ディレクトリにコピー方式。

### T5-B4: 既存テストの読み替え

`quick_validate.test.js` 内の `runValidate(fixtureName)` ヘルパーを `loadFixture` 経由にする。

### T5-B5: .gitignore 追加

```
.claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md
```

## Lane C 詳細タスク

### T5-C1: 共通バリデータ抽出

`scripts/utils/validate-skill-md.js` に R-01〜R-07 検証関数 `validateSkillMdContent(content): { ok, errors, description, name }` を実装。

### T5-C2: YAML escape ヘルパー

`scripts/utils/yaml-escape.js` に以下を実装:
- `escapeForLiteralBlock(str)`: 改行除去・先頭インデント補正
- `escapeForScalar(str)`: 危険文字をクォート

### T5-C3: generate_skill_md.js 改修

- description 組み立て後に length / parse / escape を検証 → 違反時 throw
- Anchors > 5: 切り出して `references/anchors.md` を生成、description は要約のみ
- Trigger > 15: 切り出して `references/triggers.md` を生成、description は主要のみ
- `triggerLine.split(", ")` の長さで判定

### T5-C4: init_skill.js 改修

`writeFile` 直前で `validateSkillMdContent` を呼び出し、違反 throw。

### T5-C5: quick_validate / validate_structure の共通化

`scripts/utils/validate-skill-md.js` を import に切替。

### T5-C6: フィクスチャ生成パス（Lane B 整合）

`generate_skill_md.js` 内の test fixture 出力経路（あれば）を `SKILL.md.fixture` に変更。なければスキップ（Lane B のみで完結）。

## ゲート（Phase 5 完了条件）

- [ ] Phase 4 の TC-CDX-A01〜A04, B01〜B05, C01〜C08 が全件 Green
- [ ] TC-CDX-REG-01 が Green 維持
- [ ] B → C 整合確認: `find .../fixtures -name "SKILL.md"` が 0 件、`find -name "SKILL.md.fixture"` が 28 件以上
- [ ] mirror parity: `diff -qr .claude/skills/aiworkflow-requirements ~/.agents/skills/aiworkflow-requirements` が 0 件差分（generated index 除く）。skill-creator / automation-30 は mirror ディレクトリが存在する場合のみ確認

## 成果物

- `outputs/phase-5/lane-a-result.md`
- `outputs/phase-5/lane-b-result.md`
- `outputs/phase-5/lane-c-result.md`
- `outputs/phase-5/diff-summary.md`

## 実行タスク

- Lane A で既存 SKILL.md を Codex 検証準拠へ是正する。
- Lane B で 28 件以上のテストフィクスチャを `SKILL.md.fixture` へ移行する。
- Lane C で skill-creator の生成・書き込み前ガードを実装する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 4 | `phase-4.md` | RED テスト |
| Phase 2 | `phase-2.md` | Lane 設計 |

## 統合テスト連携

Lane A/B/C の実装後、Phase 4 の RED テストを Green 化し、Phase 6 のエッジケース追加へ接続する。

## 完了条件

- [ ] Phase 4 の RED テストが Green になっている
- [ ] `.claude` 正本と実在 `.agents` mirror の同期方針が守られている
- [ ] Lane B → C のフィクスチャ出力経路整合が確認されている

## タスク100%実行確認【必須】

- [ ] Phase 5 の成果物と artifacts.json の登録が一致している
