# Implementation Guide

## Part 1: 中学生レベル（概念説明）

### なぜ必要か

Claude Code や Codex CLI といった AI 開発ツールは「スキル」というファイル（SKILL.md）を一覧で読み込んで、必要なときに使う仕組みになっている。ところが SKILL.md には Codex 側の **暗黙ルール**（description は 1024 字以内、文字列、BOM なし、など）があり、これを破ると **そのスキルだけ静かに無視されて使えなくなる**。エラーも出ないので、誰も気づかないまま「動かないスキル」が増え続けてしまう。だからこそ、書き込む前にルール違反を機械的に止める仕組みが必要だった。

### 日常生活の例え

たとえば、図書館の本棚に本を並べるときを想像してほしい。背ラベル（タイトル・分類番号）が決まったフォーマットでないと、司書さん（=Codex）は「これは本ではない」と判断して棚から外してしまう。SKILL.md の description はまさにこの背ラベルにあたる。長すぎる説明文や箇条書きにした説明文は、ラベルが分厚すぎて棚に入らない本と同じで、棚（スキル一覧）から落ちてしまう。今回はその背ラベルを書き間違えていた本を整え直し、さらに「ラベルが規格外なら棚に入れる前に止める」改札口を司書室の入口に取り付けた話。

### 今回作ったもの

1. **3 つのスキルカードを書き直した**（aiworkflow / automation-30 / skill-creator）。
   - 表が壊れていた、長すぎた、を全部修正。
2. **テスト用の偽カード**（fixtures）の名前を変えて、本物と区別できるようにした。
3. **新しいカードを作る機械**（skill-creator）に、出口で 2 重チェックを付けた。
   - 入口（生成時）と出口（書き込み時）でルール違反を検知して止める。

### この機能でできること

- もう「Codex に無視されるカード」が増えない。
- ルール違反は **書き込む前** に止まるので、間違って Git に commit されない。
- 自動テスト 24 件が CI で常時監視。

### 何が嬉しい？

- もう「Codex に無視されるカード」が増えない。
- ルール違反は **書き込む前** に止まるので、間違って Git に commit されない。
- 自動テスト 24 件が CI で常時監視。

---

## Part 2: 開発者向け

### 公開インターフェース

```js
// .claude/skills/skill-creator/scripts/utils/validate-skill-md.js
import {
  validateSkillMdContent,
  extractDescription,
  MAX_DESC_LENGTH,    // 1024
  MAX_ANCHORS,        // 5
  MAX_TRIGGER_KEYWORDS, // 15
} from "./utils/validate-skill-md.js";

const result = validateSkillMdContent(skillMdContent);
// → { ok: boolean, errors: string[], description?: string, name?: string }
```

### TypeScript 型定義

実装は JS（ESM）だが、参照しやすいように同等の TypeScript 型定義を併記する。

```ts
// validate-skill-md.d.ts 相当
export type ValidationError = string;

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  description?: string;
  name?: string;
}

export type ValidateSkillMdContent = (content: string) => ValidationResult;

export interface SkillMdLimits {
  MAX_DESC_LENGTH: 1024;
  MAX_ANCHORS: 5;
  MAX_TRIGGER_KEYWORDS: 15;
}

// Codex 検証ルール ID は R-01〜R-07 のいずれか
export type CodexRuleId =
  | "R-01" | "R-02" | "R-03" | "R-04" | "R-05" | "R-06" | "R-07";
```

### Codex 検証ルール R-01〜R-07

| ID | 内容 | 違反例 |
|----|------|--------|
| R-01 | YAML frontmatter 必須 | `---` で囲まれていない |
| R-02 | description フィールド必須 | description キー欠如 |
| R-03 | description は string 型 | `description: [a, b]` (sequence) |
| R-04 | description ≤ 1024 文字 | 1025 字以上 |
| R-05 | name フィールド必須 | name キー欠如 |
| R-06 | BOM (UTF-8 先頭の `﻿`) 禁止 | ファイル先頭に BOM |
| R-07 | YAML frontmatter 全体の構文が有効 | `name: [` など壊れた YAML |

### 二段ガード

1. **生成側** (`generate_skill_md.js`):
   - `Anchors / Trigger keywords` を上限 (`MAX_ANCHORS=5`, `MAX_TRIGGER_KEYWORDS=15`) で `slice` し、超過分は `references/anchors.md` / `references/triggers.md` に退避。
   - `toDoubleQuotedScalar` で summary / trigger / anchors を YAML safe な 1 行 description に正規化。
   - 描画後に `validateSkillMdContent(content)` を呼び、Codex 違反があれば throw。
2. **書き込み側** (`init_skill.js`):
   - `writeFileSync` 直前に必ず `validateSkillMdContent` を通し、違反時は throw して書き込み中止。
3. **検証側** (`quick_validate.js`):
   - frontmatter / name / description の Codex 互換判定を `validateSkillMdContent` に接続し、生成・書き込み・quick validation の入口を統一。

### YAML エスケープ

```js
import { toDoubleQuotedScalar } from "./utils/yaml-escape.js";
toDoubleQuotedScalar('a "b"\nc');
// → '"a \\"b\\" c"'  // 改行→空白、" / \\ をエスケープし double-quoted scalar 化
```

### エッジケース

- **literal block (`description: |`)** は改行込みで保存され、`extractDescription` が `\n` を含む string として復元する。
- **double-quoted (`description: "..."`)** は `JSON.parse` でエスケープ復元。
- **連続空白 / Tab / 改行** は `normalizeWhitespace` で半角空白 1 個に正規化。

### 使用例

CLI からの呼び出し例（生成 → 書き込み → 検証の最小フロー）。

```bash
# 1. SKILL.md を生成（生成側で validateSkillMdContent が走る）
node .claude/skills/skill-creator/scripts/generate_skill_md.js \
  --name my-skill --summary "短い要約" --out /tmp/my-skill

# 2. 既存スキルを quick validation
node .claude/skills/skill-creator/scripts/quick_validate.js \
  .claude/skills/skill-creator
# → exit code 0 で PASS、非 0 で違反内容を stderr に出力
```

```ts
import { validateSkillMdContent } from "./utils/validate-skill-md.js";

const result: ValidationResult = validateSkillMdContent(readFileSync(path, "utf8"));
if (!result.ok) {
  throw new Error(`Codex 違反: ${result.errors.join(", ")}`);
}
```

### エラーハンドリング

| 発生箇所 | 検知方法 | 動作 |
|----------|---------|------|
| 生成時（generate_skill_md.js） | `validateSkillMdContent(content).ok === false` | `throw new Error("...")` で生成中止、tmp ファイル不残置 |
| 書き込み時（init_skill.js） | `writeFileSync` 直前ガード | throw で書き込み中止し、既存 SKILL.md は無傷 |
| quick validation（quick_validate.js） | exit code 非 0 + stderr に R-XX 違反列挙 | CI ジョブで fail → PR ブロック |
| frontmatter parse 失敗（R-07） | `js-yaml` parse 例外を catch し errors に集約 | `result.ok = false` で正常 return（throw しない） |

### 設定項目と定数一覧

`utils/validate-skill-md.js` で公開される定数。

| 定数 | 値 | 意味 | 上書き可否 |
|------|----|------|-----------|
| `MAX_DESC_LENGTH` | 1024 | description 最大文字数（Codex 互換） | 不可（ハード仕様） |
| `MAX_ANCHORS` | 5 | Anchors セクションの最大行数 | 不可 |
| `MAX_TRIGGER_KEYWORDS` | 15 | Trigger keywords の最大個数 | 不可 |
| `BOM_CHAR` | `"﻿"` | 検出対象 BOM | 不可 |
| `RULE_IDS` | `["R-01"..."R-07"]` | Codex 検証ルール ID 全集合 | 追加のみ可（既存変更不可） |

### テスト構成

| 層 | 場所 | フレームワーク | 件数 |
|----|------|---------------|------|
| ユニット | `.claude/skills/skill-creator/scripts/__tests__/validate-skill-md.test.js` | node:test | 14 |
| フィクスチャ統合 | `.claude/skills/skill-creator/scripts/__tests__/fixtures/*` | node:test + ファイル比較 | 8 |
| quick_validate E2E | `scripts/__tests__/quick-validate.test.js` | node:test | 2 |

実行コマンド:

```bash
# 単体
node --test .claude/skills/skill-creator/scripts/__tests__/

# フィクスチャ全件
mise exec -- pnpm --filter @repo/shared test -- skill-creator
```

期待: 24 件 全 PASS、Codex 違反フィクスチャは `result.ok === false` を assert。

### Visual Evidence

UI 変更ゼロのため Phase 11 スクリーンショット不要。代替証跡:

- `outputs/phase-10/final-review-result.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
