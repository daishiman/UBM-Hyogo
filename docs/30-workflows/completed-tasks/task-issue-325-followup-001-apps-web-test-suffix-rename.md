# apps/web test suffix rename — タスク指示書

## メタ情報

```yaml
issue_number: 621
parent_issue: 325
parent_task: docs/30-workflows/issue-325-test-suffix-rename-migration/
```

| 項目         | 内容                                                           |
| ------------ | -------------------------------------------------------------- |
| タスクID     | issue-325-followup-001-apps-web-test-suffix-rename             |
| タスク名     | apps/web の test suffix を種別別 .spec.ts へ rename             |
| 分類         | 改善 (rename-only / docs ADR 拡張)                              |
| 対象機能     | apps/web テストファイル命名規約                                  |
| 優先度       | 低                                                             |
| 見積もり規模 | 中規模（70 ファイル + ADR 拡張）                                 |
| ステータス   | transferred_to_workflow / implemented_local_evidence_captured |
| 発見元       | Issue #325 Phase 12 独立検証                                    |
| 発見日       | 2026-05-09                                                     |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #325 で `apps/api/src/**/*.test.ts` 132 ファイルを `*.{contract,authz,repository,unit}.spec.ts` の種別別 suffix に rename し、ADR `test-file-suffix-adr.md` を Accepted とした。一方で apps/web は親 issue の責務外として scope-out されたため、本タスクを `docs/30-workflows/issue-621-apps-web-test-suffix-rename/` に昇格した。実装時の live scan で対象は `apps/web/**/*.test.ts(x)` 70 ファイル、既存 `.spec.ts(x)` は Playwright/E2E 由来 17 件と確定した。

### 1.2 問題点・課題

- apps/web 側に suffix 種別 ADR が不在で、route / action / component / hook など分類軸が API と異なるテストの命名が不統一
- ファイル名から「unit / e2e adapter / route handler / RSC」など意図が判別できず、レビュー・grep による絞り込みコストが増える
- `apps/api` が種別別 suffix に統一済みの一方で `apps/web` のみ取り残されると、リポジトリ全体の規約が二重基準となる

### 1.3 放置した場合の影響

- 新規 apps/web テスト追加時に「どの suffix を付けるか」が都度議論となり、規約 drift が拡大
- 後続の vitest config を `*.spec.ts` 単一に収斂するタスク（followup-003）の前提が崩れる
- ADR 適用範囲が apps/api に限定されたままだと、prototype を含む UI 層の保守性が将来的に劣化

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/web 用の test suffix 分類軸を ADR 化し、`*.test.ts(x)` 70 ファイルを種別別 `*.spec.ts(x)` に rename する。`apps/api` の ADR は流用せず、UI 層に適した 5 分類（`component` / `route` / `page` / `runtime` / `lib-unit`）を定義する。

### 2.2 最終ゴール

- `docs/00-getting-started-manual/specs/` または既存 ADR ファミリに apps/web 用 ADR が追加されている
- `apps/web/**/*.test.ts(x)` が 0 件、`*.spec.ts(x)` のみが残る
- `vitest.config.ts` / `apps/web/package.json` / `lefthook.yml` / `.github/workflows/*.yml` の glob 参照が `*.spec.ts(x)` に整合
- typecheck / lint / `mise exec -- pnpm --filter @ubm-hyogo/web test` 全 PASS、テスト数が rename 前後で不変

### 2.3 スコープ

#### 含むもの

- apps/web 用 test suffix ADR の起草（apps/api ADR を参照しつつ UI 層分類を新規定義）
- `apps/web/**/*.test.ts(x)` 70 ファイルの `git mv` rename
- glob 参照の同期（vitest config / package.json / lefthook / workflows）
- rename-mapping.csv と Phase 11 evidence

#### 含まないもの

- テスト本体・import・assertion の変更（純 rename）
- packages 配下の rename（→ followup-002）
- `vitest.config.ts` の `*.{test,spec}` から `*.spec` 単一への収斂（→ followup-003）
- apps/api の ADR 改訂

---

## 3. どう実装するか（How）

1. apps/web 用 ADR 起草（分類軸: component / route / action / hook / unit などを候補化）
2. 既存 45 ファイルを ADR 分類に当てはめ、`rename-mapping.csv` を生成
3. `git mv` で一括 rename
4. glob 参照を全箇所同期、`pnpm --filter @ubm-hyogo/web typecheck && lint && test` で件数一致確認
5. Phase 11 evidence（test-count-before/after, rename-mapping.csv, typecheck.log, lint.log, test.log）を保存

---

## 苦戦箇所【記入必須】

- 対象: `vitest.config.ts:42-48`（root 単一 config の include glob）
- 症状: Issue #325 では `apps/api/package.json` / `lefthook.yml` / workflow yml に `*.test.ts` 直接参照がなく追加変更不要だったが、apps/web 側にも同じ前提が成立するか個別 grep が必要。Phase 11 で `glob-coverage-grep.log` を取得して直接参照ゼロを証拠化しないと、CI 段階で漏れが発覚する
- 症状2: jsdom 環境前提のテスト（React コンポーネント）と node 環境前提のテスト（route handler / server action）が混在しており、suffix 分類軸が apps/api（contract / authz / repository / unit）と非対称になる。Issue #325 ADR をそのまま流用すると意味的にずれる
- 参照: `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`、`docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-11/main.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| ADR 分類軸が apps/api と非対称になり混乱を生む | 中 | Phase 2 で apps/web 用の分類定義（component/route/action/hook/unit 等）を明文化し、apps/api ADR と対比表を ADR 内に置く |
| `*.test.tsx` ファイルの存在で rename script が `.test.ts` のみ拾うミス | 中 | rename-mapping.csv 生成時に `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print` で両方を網羅し件数一致 gate を Phase 11 で取る |
| jsdom 設定済みファイルの環境注釈 (`// @vitest-environment jsdom`) を rename で破損 | 低 | `git mv` のみを使用しファイル本文不変。Phase 11 で diff 比較 |
| Storybook / Playwright テストの拾い漏れ | 中 | スコープ外として明示。本タスクは vitest 範囲のみ |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test
```

期待: 全 PASS。テスト件数が rename 前後で同一（before/after diff = 0）

### 残存ゼロ検証

```bash
find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | wc -l
```

期待: `0`

### glob 参照の同期検証

```bash
rg "apps/web.*\.test\." -g '!**/node_modules/**' -g '!docs/**'
```

期待: 0 件（ドキュメント以外で `.test.` 直接参照なし）

## スコープ

### 含む

- apps/web 用 ADR の起草と Accepted
- apps/web/src 配下 45 ファイルの rename
- glob 参照同期と Phase 11 evidence

### 含まない

- テスト本体・import の変更
- packages の rename（→ followup-002）
- vitest.config の `*.{test,spec}` 収斂（→ followup-003）
- E2E / Playwright / Storybook の suffix 統一
