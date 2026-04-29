# Phase 2: 設計 — 成果物サマリ

`phase-2.md` に Lane A/B/C の詳細設計を記載済み。本ファイルは要点のみ抽出。

## Lane A: 既存 SKILL.md 是正

| ID | 対象 | 改修内容 | 退避先 |
| --- | --- | --- | --- |
| A-1 | aiworkflow-requirements | mirror parity のみ確認（既に valid） | - |
| A-2 | automation-30 | description を 1 段落要約に再構成 | `references/elegant-review-prompt.md` |
| A-3 | skill-creator | description ≤ 1024 字に圧縮、Anchors 削減 | `references/anchors.md` |

## Lane B: フィクスチャ拡張子変更

- 28 件の `*/SKILL.md` を `*/SKILL.md.fixture` に rename
- テストヘルパー `helpers/load-fixture.js` を新規作成
- `quick_validate.test.js` を helper 経由に書き換え
- `.gitignore` に `*/SKILL.md` を追加（生成された一時ファイルを除外）

## Lane C: skill-creator 改修

- 新規 `scripts/utils/validate-skill-md.js`: R-01〜R-07 共通バリデータ
- 新規 `scripts/utils/yaml-escape.js`: double-quoted scalar 出力 + 危険文字 escape
- `scripts/generate_skill_md.js`: description 事前ゲート、Anchors > 5 件・Trigger > 15 件で自動退避
- `scripts/init_skill.js`: writeFile 直前に validateSkillMdContent を呼び throw

## 件数上限

| 対象 | 上限 | 超過時 |
| --- | --- | --- |
| description | 1024 字 | throw（退避先パスをメッセージに記載） |
| Anchors | 5 件 | 全件を `references/anchors.md` へ退避、description は要約のみ |
| Trigger keywords | 15 件 | 全件を `references/triggers.md` へ退避、主要 8 語のみ description |

## ガード位置（二段構え）

1. `generate_skill_md.js` 内の戻り値検証
2. `init_skill.js` の writeFile 直前

これにより generate 経路をバイパスする呼び出しからも保護される。
