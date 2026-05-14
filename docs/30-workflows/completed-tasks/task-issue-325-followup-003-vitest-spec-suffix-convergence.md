# vitest config の test/spec 二段階対応を spec 単一に収斂 — タスク指示書

## メタ情報

```yaml
issue_number: 623
parent_issue: 325
parent_task: docs/30-workflows/issue-325-test-suffix-rename-migration/
depends_on:
  - issue-325-followup-001-apps-web-test-suffix-rename
  - issue-325-followup-002-packages-test-suffix-rename
```

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | issue-325-followup-003-vitest-spec-suffix-convergence               |
| タスク名     | vitest.config / coverage exclude を `*.spec` 単一に収斂              |
| 分類         | 改善 (config cleanup)                                                |
| 対象機能     | テスト discovery / coverage exclude glob                             |
| 優先度       | 中                                                                  |
| 見積もり規模 | 小規模（vitest.config + 関連 CI gate）                               |
| ステータス   | consumed / implemented_local_runtime_pending                         |
| 発見元       | Issue #325 Phase 12 独立検証                                         |
| 発見日       | 2026-05-09                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #325 の rename 完了に伴い、ルート `vitest.config.ts` の `test.include` および `coverage.exclude` は移行期措置として `*.{test,spec}.{ts,tsx}` の二段階対応となっている。apps/api は `*.spec.ts` 単一に収斂済みだが、apps/web（45 件）と packages（26 件）は未だ `*.test.ts(x)` のみで動作しており、二段階対応がそれら未 rename 領域の救済として残っている。

### 1.2 問題点・課題

- 二段階対応は「いつまでにどちらかへ収斂するか」が明文化されておらず、`v2026.05.09-issue325-rename-evidence-state-sync` の skill changelog 上も期限が無い
- 二段階対応が恒久化すると、新規テスト追加時に suffix が再び混在し、Issue #325 の ADR 効果が希釈される
- `coverage.exclude` の `**/*.test.{ts,tsx}` / `**/*.spec.{ts,tsx}` 両方記述も、将来 `*.test.*` だけ実体ゼロになった時点で dead 行となる

### 1.3 放置した場合の影響

- Issue #325 で確立した「ファイル名から種別が分かる」運用が apps/api 限定で凍結される
- 後続 ADR（apps/web / packages 用 followup-001 / 002）の動機が弱まる
- vitest.config が「過去経緯を知らないと変更できない config」化し、将来の include/exclude 変更時の事故リスクが増える

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web` / `packages` の rename（followup-001 / 002）が完了した時点で、`vitest.config.ts` の include / coverage exclude を `*.spec.{ts,tsx}` 単一に収斂し、`*.test.*` 直接参照を全廃する。同時に「新規 test ファイルは `*.spec.{ts,tsx}` のみ」という CI gate を追加し、後戻りを構造的に防ぐ。

### 2.2 最終ゴール

- `vitest.config.ts` の `test.include` が `*.spec.{ts,tsx}` のみ
- `vitest.config.ts` の `coverage.exclude` から `**/*.test.{ts,tsx}` 行が削除
- `find . -name '*.test.ts*' -not -path '*/node_modules/*'` が 0 件
- 新規 `*.test.ts(x)` 追加を block する CI gate（lefthook pre-commit または `.github/workflows/verify-test-suffix.yml`）が稼働
- typecheck / lint / 全テスト PASS、件数不変

### 2.3 スコープ

#### 含むもの

- vitest.config.ts の include / coverage.exclude 整理
- `*.test.*` 残存検出 CI gate の追加
- skill changelog / ADR への「二段階対応終了」記録
- Phase 11 evidence（before/after include glob, find 件数）

#### 含まないもの

- 実テストファイルの rename（→ followup-001 / 002 で完了済みを前提）
- apps/api のテスト追加・修正
- vitest version up や reporter 変更

---

## 3. どう実装するか（How）

1. followup-001 / 002 が close 済みであることを確認
2. `find . -name '*.test.ts*' -not -path '*/node_modules/*'` で残存ゼロを Phase 1 evidence に保存
3. vitest.config.ts の include / coverage.exclude を `.spec.{ts,tsx}` 単一に編集
4. 全テスト実行で件数不変を確認
5. CI gate を追加（lefthook pre-commit に `*.test.ts(x)` 追加検出、または verify-test-suffix workflow）
6. ADR / skill changelog に「二段階対応終了」を記録、CONST_005 に整合

---

## 苦戦箇所【記入必須】

- 対象: `vitest.config.ts:42-48` `test.include`, `vitest.config.ts:57-77` `coverage.exclude`
- 症状: 二段階対応中に include を `*.spec.*` に絞ると、未 rename ファイルが discovery されず silent に skip されるリスク。`pnpm test` が exit 0 のまま件数だけ減少するため、CI gate を追加しないと検出できない
- 症状2: `coverage.exclude` の `**/*.test.{ts,tsx}` を削除した瞬間に、もし残存 `*.test.*` があると coverage に test 自体が混入し coverage 数値が歪む
- 症状3: lefthook の pre-commit gate を追加する際、既存の `staged-task-dir-guard` / `coverage-guard` との競合を避けるため `lefthook.yml` の commands ブロックに新規 step として独立追加する必要がある
- 参照: `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`、`docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/skill-feedback-report.md`、`vitest.config.ts`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 未 rename ファイル残存時に include を絞ると silent skip でテスト数減少 | 高 | Phase 1 evidence で `*.test.*` 残存 0 件を gate。followup-001 / 002 の完了を depends_on で強制 |
| coverage exclude 削除で coverage 数値が歪む | 中 | rename 全件完了後にのみ coverage exclude を編集。Phase 11 で coverage delta = 0 を確認 |
| lefthook 追加 gate が既存 hook と競合 | 中 | 既存 `lefthook.yml` を読み、独立 command として追加。`scripts/hooks/` に新規 script を分離配置 |
| 開発者が古い AI memory で `*.test.ts` を作成し続ける | 中 | CONST_005 に「test 新規ファイルは `*.spec.{ts,tsx}` のみ」を追加。CLAUDE.md にも 1 行追記 |

## 検証方法

### 残存ゼロ検証

```bash
find . -name '*.test.ts' -o -name '*.test.tsx' -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*' | wc -l
```

期待: `0`

### vitest discovery 件数不変

```bash
mise exec -- pnpm test --run --reporter=json | jq '.numTotalTests'
```

期待: followup-001 / 002 close 直後の件数と同一

### CI gate 動作確認

```bash
git checkout -b test/verify-suffix-gate
echo "test('x', () => {})" > apps/api/src/__tests__/dummy.test.ts
git add apps/api/src/__tests__/dummy.test.ts
git commit -m "test gate"
```

期待: pre-commit hook で reject される（exit code != 0）

## スコープ

### 含む

- vitest.config.ts の include / coverage.exclude 整理
- `*.test.*` 残存検出 CI gate 追加
- skill changelog / ADR の追記

### 含まない

- 実テストファイルの rename（前提タスク完了を要求）
- vitest 自体の version / reporter 変更
- 別 runner（Playwright / Storybook）の suffix 規約
