# テストカバレッジ情報

> skill-fixture-runner および skill-creator 検証スクリプトのテストカバレッジ詳細。
> 本リポジトリは Cloudflare Workers monorepo（`apps/web` / `apps/api`）構成のため、
> テスト本体は `.claude/skills/skill-creator/scripts/__tests__/` 配下に集約する。

---

## テストファイル正本

| ファイル                                                                     | 役割                                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `.claude/skills/skill-creator/scripts/__tests__/codex_validation.test.js`   | Codex CLI / SKILL.md 検証ルールの網羅テスト                |
| `.claude/skills/skill-creator/scripts/__tests__/quick_validate.test.js`     | `quick_validate.js` の挙動・エラー/警告分類テスト          |
| `.claude/skills/skill-creator/scripts/__tests__/helpers/load-fixture.js`    | `SKILL.md.fixture` を一時 `SKILL.md` へ展開するヘルパー    |

---

## フィクスチャ運用規約

- フィクスチャは `SKILL.md` ではなく **`SKILL.md.fixture`** 拡張子で配置する（Codex CLI の SKILL.md 検証から除外するため）。
- テスト実行時は `helpers/load-fixture.js` の `loadFixture(name)` 経由で一時 `SKILL.md` を生成し、終了時に `cleanup()` で削除する。
- skill-fixture-runner の `validate-skill-structure.js` / `run-all-validations.js` は `SKILL.md` 不在時に `SKILL.md.fixture` を検証ターゲットとして自動採用する。

---

## フィクスチャ一覧（`.claude/skills/skill-creator/scripts/__tests__/fixtures/`）

| 区分           | フィクスチャ                                                                                         | 主目的                              |
| -------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 正常系         | `valid-skill/`, `name-empty-desc-valid/`, `name-valid-desc-empty/`                                   | 標準・空フィールド許容パターン      |
| 境界値         | `boundary-64-name/`, `boundary-500-lines/`, `boundary-1024-desc/`                                    | name/行数/description 上限          |
| エラー         | `invalid-name/`, `invalid-yaml/`, `forbidden-files/`, `name-mismatch/`, `over-limit/`                | バリデーション失敗パターン          |
| description系  | `empty-name-desc/`, `desc-whitespace-only/`, `name-whitespace-only/`, `long-desc/`, `long-description/`, `angle-bracket-desc/` | description フィールド検証          |
| 構造           | `no-frontmatter/`, `no-skill-md/`, `empty-skill-md/`, `empty-dir/`, `no-references/`, `refs-with-subdir/`, `unlinked-refs/` | ディレクトリ/フロントマター構造     |
| メタ           | `no-anchors/`, `no-trigger/`, `no-agent-frontmatter/`, `error-and-warning/`                          | Anchors/Trigger/エラー警告分類      |
| エンコーディング | `bom-utf8/`, `special-chars-スキル/`                                                                  | 文字エンコーディング・命名          |

---

## 検証スクリプト対応

| スクリプト                          | 対象                            | 出力                                     |
| ----------------------------------- | ------------------------------- | ---------------------------------------- |
| `validate-skill-structure.js`       | スキルディレクトリ              | `{ valid, errors, structure }`           |
| `validate-skill-md.js`              | SKILL.md（または .fixture）     | `{ valid, errors, frontmatter, body }`   |
| `validate-agents.js`                | `agents/`                       | `{ valid, errors, agents }`              |
| `validate-schemas.js`               | `schemas/`                      | `{ valid, errors, schemas }`             |
| `run-all-validations.js`            | 統合実行                        | `{ overall, results }`                   |

---

## 関連ドキュメント

| ドキュメント                                                | 内容                                       |
| ----------------------------------------------------------- | ------------------------------------------ |
| `.claude/skills/skill-creator/SKILL.md`                     | スキル仕様の正本（検証ルールの源泉）       |
| `.claude/skills/skill-fixture-runner/SKILL.md`              | フィクスチャ検証スキルの本体仕様           |
