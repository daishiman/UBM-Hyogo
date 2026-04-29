# valid-skill fixture reference link repair - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | TASK-SKILL-VALID-FIXTURE-EXAMPLE-LINK-001 |
| タスク名 | valid-skill fixture reference link repair |
| 分類 | 改善 |
| 対象機能 | `.claude/skills/skill-creator/scripts/__tests__/fixtures/valid-skill/` |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `skill-md-codex-validation-fix` Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

`valid-skill` fixture の `references/example.md` が `SKILL.md.fixture` からリンクされておらず、既存 `quick_validate.test.js` の reference link 系テストが失敗している。fixture が「valid」を名乗る一方でリンク検証に失敗するため、テストの意図が読みにくい。

## 2. 何を達成するか（What）

- `valid-skill/SKILL.md.fixture` に `references/example.md` へのリンクを追加する
- 該当する quick_validate reference warning/error 系テストを GREEN にする
- fixture 命名と実体の意味を一致させる

## 3. どのように実行するか（How）

1. `valid-skill` fixture の期待仕様を確認する
2. `SKILL.md.fixture` の resources / references セクションにリンクを追加する
3. `quick_validate.test.js` の該当ケースを実行する
4. 他 fixture の意図的不正ケースに影響していないことを確認する

## 4. 完了条件

- `valid-skill` fixture が reference link 検証を通る
- 意図的不正 fixture の失敗期待が変わっていない

## 5. 苦戦箇所・知見（Lessons）

- **`SKILL.md` → `SKILL.md.fixture` 改名で test 期待値も連動する**: 本タスク親（`skill-md-codex-validation-fix`）で fixture 28 件の拡張子を `.fixture` に切り替えたが、`valid-skill` だけは「正常系」を名乗りつつ `references/example.md` がリンクされていない既存の歪みが顕在化した。命名と内容の意味が一致しないと、テストは GREEN でも将来の改修者が誤読する。
- **「意図的不正」と「意図しない不正」の区別が暗黙だった**: `quick_validate.test.js` には不正 fixture を意図的に置いて失敗を確認するケース（`name-mismatch` 等）と、本来 valid であるべき fixture が実は壊れているケース（本件）が混在。Phase 11 で初めて両者を切り分けたため、修正前にメタコメント（`// expects: valid` / `// expects: error TC-X`）を fixture 側に置くと将来の TC 拡張で混乱しない。
- **reference link 検証の判定基準が曖昧**: `references/` 配下のファイルを置くだけで OK か、SKILL.md 本文からリンクが必要かが skill-creator 仕様で明示されていない。本タスク内で skill-creator 側ドキュメントの該当節も確認・補強すること。

## 6. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| `valid-skill/SKILL.md.fixture` の修正で「意図的不正 fixture」（name-mismatch 等）が誤って GREEN 化する | 高 | 修正前後で `node --test` の PASS/FAIL 件数を比較し、不正 fixture の RED 期待がそのまま残ることを確認。fixture 側に `// expects: valid` / `// expects: error TC-X` のメタコメントを併記 |
| `references/example.md` の参照記法が skill-creator 仕様（resources セクション or 本文インラインリンク）とドリフトする | 中 | skill-creator 側 `references/skill-md-format.md` の link 規約を先に確認し、規約に沿った形式（例: `## References` セクションに `- [example](references/example.md)` 形式）で追記 |
| 拡張子 `.fixture` 化と組み合わせて Vitest の fixture 解決パスが壊れる | 中 | 本タスク完了後に `pnpm vitest run` のフルラン結果を成果物に添付し、`.fixture` 解決ロジック（`fs.readFileSync(... + ".fixture")`）が valid-skill にも適用されていることを確認 |

## 7. 検証方法

### 単体検証

```bash
mise exec -- node --test \
  .claude/skills/skill-creator/scripts/__tests__/quick_validate.test.js
```

期待: `valid-skill` を対象とする reference link 系テスト（TC-VS-*）が PASS。意図的不正 fixture (`name-mismatch`, `bom-utf8` 等) は引き続き期待通り FAIL/RED を維持。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/shared vitest run \
  --dir .claude/skills/skill-creator/scripts/__tests__
# または直接
mise exec -- npx vitest run .claude/skills/skill-creator/scripts/__tests__
```

期待: fixture 28 件のうち valid-skill が PASS 側に分類され、意図的不正 fixture の FAIL 件数が修正前と一致（差分 = +1 PASS / ±0 RED）。

## 8. スコープ

### 含む

- `.claude/skills/skill-creator/scripts/__tests__/fixtures/valid-skill/SKILL.md.fixture` への `references/example.md` リンク追加
- `valid-skill/references/example.md` の最小実体（無ければ作成、リンク先 404 防止）
- fixture 内メタコメント（`// expects: valid`）の付与
- skill-creator 側 reference link 判定基準の明文化（`references/skill-md-format.md` への一文追加）

### 含まない

- 他 fixture（`name-mismatch` 等の意図的不正）への変更（→ 期待 RED を維持するため触らない）
- `quick_validate.js` のリンク検証ロジック変更（→ 別タスクが必要なら個別切り出し）
- 拡張子 `.fixture` 化そのもの（→ 親タスク `skill-md-codex-validation-fix` で完了済）

