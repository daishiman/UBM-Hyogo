# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 名称 | 要件定義 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

検証エラーの全量と性質を確定し、是正範囲・再発防止範囲を分離する。Phase 2 着手前に「真の論点」を 1 文で固定する。

## 真の論点（1 文）

> Codex CLI の SKILL.md 検証は外部仕様であり、skill-creator の生成ロジックがその仕様を**事前に強制していない**ため、生成時点では valid でも検証時点で fail する SKILL.md が量産されている。

## 入力

- 前会話の Codex 起動時警告ログ（11〜12 件 / 起動）
- `~/.agents/skills/aiworkflow-requirements/SKILL.md`（26KB）
- `.claude/skills/automation-30/SKILL.md`（YAML 崩壊）
- `.claude/skills/skill-creator/SKILL.md`（1024 字超）
- `.claude/skills/skill-creator/scripts/__tests__/fixtures/`（現時点 28 件）

## タスク

### T1-1. 検証ルールの確定

Codex の出力を根拠にルールを確定する。

| ルール ID | 内容 | 根拠 |
| --- | --- | --- |
| R-01 | YAML frontmatter（`---` 区切り）必須 | `missing YAML frontmatter delimited by ---` |
| R-02 | `description` フィールド必須 | `missing field 'description'` |
| R-03 | `description` は string 型のみ（sequence/list 不可） | `invalid type: sequence, expected a string` |
| R-04 | `description` ≤ 1024 文字 | `exceeds maximum length of 1024 characters` |
| R-05 | YAML 構文として有効 | `invalid YAML: did not find expected key` |
| R-06 | BOM 付き UTF-8 は frontmatter 認識不可 | `bom-utf8` フィクスチャの失敗 |

### T1-2. 違反 inventory の確定

```
| ファイル | 違反ルール | 改修方針 |
| --- | --- | --- |
| ~/.agents/skills/aiworkflow-requirements/SKILL.md | R-04 | description 圧縮 + references 退避 |
| .claude/skills/aiworkflow-requirements/SKILL.md | R-04（mirror 元も超過の可能性） | canonical を圧縮 → mirror 同期 |
| .claude/skills/automation-30/SKILL.md | R-05 | description 再構成 + 本文 references 化 |
| .claude/skills/skill-creator/SKILL.md | R-04 | description 圧縮 + Anchors 外出し |
| .claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md (28件) | R-01〜R-07（意図的） | 拡張子変更で対象外化 |
```

### T1-3. 既存命名規則の確認

- スクリプト: kebab-case（`generate_skill_md.js` のみ既に snake_case で混在）→ 既存に従い snake_case 維持
- references/ 内 Markdown: kebab-case（`elegant-review-prompt.md`, `anchors.md`, `keywords.md`）

### T1-4. carry-over 確認

直前のコミット `a6cc537 feat/main-branch-guard` は本タスクと無関係。新規作業として進める。

### T1-5. アクター責務の固定

| アクター | 責務 |
| --- | --- |
| skill-creator | 新規 SKILL.md 生成時に R-01〜R-07 を**事前**保証 |
| skill 著者（人 / LLM） | description を肥大化させない判断 |
| Codex / Claude Code | 起動時にルール R-01〜R-07 を検証（外部仕様、変更不可） |

### T1-6. テスト実行戦略

- `pnpm --filter skill-creator test` 相当の vitest を `scripts/__tests__` に対し実行
- フルテスト走行のリスク（メモリ・時間）はないと判断（小規模パッケージ）

## 受入条件（Phase 1 完了条件）

- [ ] R-01〜R-07 の 6 ルールが文書化されている
- [ ] 違反 inventory が完全（漏れがあれば mirror 側を含めて再走査）
- [ ] Lane A / B / C の責務境界が明示されている

## 成果物

- `outputs/phase-1/requirements.md`（本ファイルから抽出した要件サマリ）
- `outputs/phase-1/violation-inventory.md`（全違反 SKILL.md と性質）

## ゲート

Phase 2 へ進む前に「真の論点」「Lane 構造」「ルール R-01〜R-07」「inventory」を確定すること。

## 実行タスク

- Codex / Claude Code の SKILL.md 検証エラーを R-01〜R-07 に分解する。
- 是正対象、再発防止対象、対象外を inventory として固定する。
- Phase 2 へ渡す受入条件とスコープ境界を確定する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| task-specification-creator | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 骨格 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/SKILL.md` | 正本仕様・mirror sync 方針 |

## 統合テスト連携

Phase 1 では実行対象を確定し、Phase 4 以降の RED / Green / smoke test が同じ inventory を参照できるようにする。

## 完了条件

- [ ] R-01〜R-07 の検証ルールが定義されている
- [ ] 対象ファイル inventory が mirror を含めて列挙されている
- [ ] Phase 2 に渡すスコープと AC が矛盾なく確定している

## タスク100%実行確認【必須】

- [ ] Phase 1 の成果物と artifacts.json の登録が一致している
