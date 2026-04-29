# 違反 inventory（Phase 1）

## 実測 description 長（js-yaml で検証）

| ファイル | description 長 | 違反ルール | 改修方針 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 639 字 | なし（既に valid） | mirror sync のみ確認 |
| `~/.agents/skills/aiworkflow-requirements/SKILL.md` | 572 字 | なし | canonical と整合（diff 確認） |
| `.claude/skills/automation-30/SKILL.md` | YAML parse エラー（10:1） | R-05 | description 再構成 + 本文を `references/elegant-review-prompt.md` へ退避 |
| `.claude/skills/skill-creator/SKILL.md` | 1070 字 | R-04（1024 超） | description 圧縮 + Anchors を `references/anchors.md` へ退避 |
| `.claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md` (28 件) | 意図的不正 | R-01〜R-06（テスト用） | 拡張子を `.fixture` に変更し検証対象外化 |

## 注釈

- Phase 1 spec の inventory（aiworkflow-requirements 26KB / mirror 超過の可能性）は古い前提。実測では canonical / mirror とも既に R-04 を満たしている。
- ただし mirror 同期確認は Phase 9 Q-04 で実施し、parity 0 diff を保証する。
- skill-creator は 1070 → 800 字程度に圧縮、Anchors の正本を `references/anchors.md` へ退避する。
- automation-30 は description が複数行リテラルブロックで Markdown 本文を流し込んでおり、YAML 解釈で破綻（line 10 = `## Layer 1: 基本定義層` を YAML キーと誤認）。description は 1 段落要約に再構成する。

## 修正対象数

| Lane | 件数 |
| --- | --- |
| Lane A | 2 件（automation-30 / skill-creator）+ mirror sync 1 件 |
| Lane B | 28 件（rename） |
| Lane C | 新規 2 ファイル + 改修 4-5 ファイル + 新規テスト 1 ファイル |
