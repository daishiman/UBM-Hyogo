# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 名称 | 設計 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

Lane A / B / C の実装内容と、ガード・エスケープ・上限の具体仕様を確定する。

## Lane A: 既存 SKILL.md 是正

### A-1. aiworkflow-requirements

| 項目 | 設計 |
| --- | --- |
| canonical | `.claude/skills/aiworkflow-requirements/SKILL.md` |
| mirror | `~/.agents/skills/aiworkflow-requirements/SKILL.md` |
| 改修内容 | description を 3-5 行の要約に圧縮（用途・主要対象・トリガー要点） |
| 退避先 | 既存 keywords は `references/keywords.json` に維持（既存の通り）。description 内の長尺キーワード列は削除し、SKILL.md 末尾の「Anchors」セクション or `references/keywords.md` への参照リンクに置換 |
| description 文字数目標 | ≤ 800 字（余白確保） |

### A-2. automation-30

| 項目 | 設計 |
| --- | --- |
| 改修内容 | description にユーザー要求文書を流し込んだ既存実装を全廃。description は「30 種の思考法で多角的検証・改善を行うメタスキル」の 1 段落要約に置換 |
| 本文退避先 | `references/elegant-review-prompt.md`（新規作成） |
| SKILL.md body | 概要 + references/ への導線のみ |

### A-3. skill-creator

| 項目 | 設計 |
| --- | --- |
| 改修内容 | description の Anchors 7 行を削除し、4-5 行の要約 + Trigger 主要 5-8 語のみ残す |
| 退避先 | `references/anchors.md`（新規作成、7 anchors を保持） |

## Lane B: テストフィクスチャ拡張子変更

### B-1. リネーム対象（28 件）

```
.claude/skills/skill-creator/scripts/__tests__/fixtures/empty-name-desc/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/name-valid-desc-empty/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/long-description/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/desc-whitespace-only/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/empty-skill-md/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/invalid-yaml/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/no-frontmatter/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/bom-utf8/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/boundary-1024-desc/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/long-desc/SKILL.md
.claude/skills/skill-creator/scripts/__tests__/fixtures/<その他全件>/SKILL.md
```

実際のリネーム対象は `find .claude/skills/skill-creator/scripts/__tests__/fixtures -name SKILL.md` の結果と一致させる（Phase 5 直前に再走査）。

### B-2. テストコード読み替え

`scripts/__tests__/quick_validate.test.js` 等で `SKILL.md` を読んでいるテストヘルパー（推定 `runValidate` 関数）は、フィクスチャ読込時に以下のいずれかで対応する。

**採用方針**: テスト実行時のみフィクスチャ側を `SKILL.md.fixture` として配置し、テストランナーが読込前に一時 `SKILL.md` へコピー、検証後にクリーンアップする。Phase 5 着手直前に `find .claude/skills/skill-creator/scripts/__tests__/fixtures -name SKILL.md | sort` を再実行し、28 件から増減した場合は inventory と期待件数を同時更新する。

```js
// テストヘルパー擬似コード
function loadFixture(name) {
  const dir = path.join(FIXTURES_DIR, name);
  const src = path.join(dir, "SKILL.md.fixture");
  const dst = path.join(dir, "SKILL.md");
  fs.copyFileSync(src, dst);
  return { dir, cleanup: () => fs.unlinkSync(dst) };
}
```

> ※ 既存テストの実装詳細は Phase 5 で読取確認の上、最小差分で対応。`tmp/` ディレクトリにコピーする方式も可（CI で `.fixture` のみ commit、`SKILL.md` は git ignore）。

### B-3. .gitignore 追加

```
.claude/skills/skill-creator/scripts/__tests__/fixtures/*/SKILL.md
```

`.fixture` のみ commit、テスト時生成された `SKILL.md` は ignore。

## Lane C: skill-creator 改修

### C-1. description 事前ゲート（generate_skill_md.js）

```js
// 擬似コード
function buildDescription({ summary, anchors, trigger }) {
  const desc = composeDescription(summary, anchors, trigger);
  if (desc.length > 1024) {
    throw new Error(
      `[skill-creator] description が 1024 文字を超えています (${desc.length}字)。` +
      `Anchors を references/anchors.md へ、長尺 keywords を references/keywords.md へ退避してください。`
    );
  }
  return desc;
}
```

### C-2. YAML safe escape

| 入力 | 処理 |
| --- | --- |
| 改行（`\n`）含む summary | スペースに正規化し、description は常に double-quoted scalar として出力 |
| `: `（コロン+スペース） | `: ` を `:` + 全角スペース、または quote escape |
| 先頭が `#` `&` `*` `?` `:` `-` `<` `>` `=` `!` `%` `@` ``` の文字列 | 二重引用符でクォート |
| インデント検証 | literal block は使わない。description は double-quoted scalar に統一し、改行・連続空白・危険文字を正規化する |
| 既知の崩壊パターン | `## Layer 1:` のように先頭がコロン区切り見出しの場合は description 採用不可（自動拒否） |

### C-3. 件数上限と自動退避

| 対象 | 上限 | 超過時の挙動 |
| --- | --- | --- |
| Anchors | 5 件 | 全件を `references/anchors.md` に書き出し、SKILL.md 内 description には「主要 3 件 + 詳細は references/anchors.md」と要約 |
| Trigger keywords | 15 件 | 全件を `references/triggers.md` に書き出し、description には主要 8 語のみ |

### C-4. 書き込み前ゲート（init_skill.js）

`writeFile` 直前に `validateSkillMdContent` を呼び出し、R-01〜R-07 を満たさない場合は throw。これにより generate 経路をバイパスする呼び出しからも保護される。

### C-5. 共通バリデータの抽出

`quick_validate.js` の検証ロジックを `scripts/utils/validate-skill-md.js`（新規）に抽出し、generate / init / quick_validate / validate_structure から再利用。

### C-6. フィクスチャ生成パス（Lane B 整合）

`generate_skill_md.js` 内のフィクスチャ生成（あれば）出力先を `SKILL.md` → `SKILL.md.fixture` に変更。Lane B のリネーム結果と一致させる。

## システム観点チェック

| 観点 | 結論 |
| --- | --- |
| セキュリティ | 影響なし（ローカル CLI 改修のみ） |
| API/IPC | 影響なし |
| データ整合性 | mirror parity を Phase 9 で確認 |
| エラーハンドリング | throw メッセージに退避先を明示し、対処を自明化 |

## 設計上の判断ログ

| 判断 | 採用 | 却下案 |
| --- | --- | --- |
| フィクスチャ除外方式 | 拡張子 `.fixture` | `.skillignore` 配置（Codex 仕様未確認のためリスク） |
| description 退避先形式 | 既存形式に合わせ Markdown / JSON | YAML 別ファイル（読み込み側追加実装が必要） |
| ガード位置 | generate + writeFile 直前の二段 | 単一箇所（バイパスリスク） |

## 受入条件（Phase 2 完了条件）

- [ ] Lane A / B / C の改修内容が具体ファイル名・関数名まで確定
- [ ] R-01〜R-07 を保証するガード位置が明示
- [ ] 退避先ファイルパスが固定
- [ ] テストフィクスチャ読み替え方式が選択済み

## 成果物

- `outputs/phase-2/design.md`（本ファイルの要約）
- `outputs/phase-2/escape-rules.md`（YAML escape 詳細）
- `outputs/phase-2/lane-dependency-graph.md`（Lane 間依存）

## 実行タスク

- Lane A/B/C の責務境界と直列依存を定義する。
- description 事前ゲート、YAML escape、Anchors/Trigger 退避ルールを決める。
- Phase 4 以降で検証可能な validation matrix を確定する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | `phase-1.md` | inventory と AC |
| task-specification-creator | `.claude/skills/task-specification-creator/SKILL.md` | Lane / validation path 設計 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/SKILL.md` | 正本・mirror 方針 |

## 統合テスト連携

Phase 2 で定義した validation matrix を Phase 4 の RED テストと Phase 9 の QA コマンドへそのまま引き渡す。

## 完了条件

- [ ] Lane A/B/C の依存関係が B → C のみとして定義されている
- [ ] 生成・書き込み・検証経路のガードが重複なく設計されている
- [ ] Phase 4 の RED テストへ落とせる粒度になっている

## タスク100%実行確認【必須】

- [ ] Phase 2 の成果物と artifacts.json の登録が一致している
