# packages test suffix rename — タスク指示書

## メタ情報

```yaml
issue_number: 622
parent_issue: 325
parent_task: docs/30-workflows/issue-325-test-suffix-rename-migration/
```

| 項目         | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| タスクID     | issue-325-followup-002-packages-test-suffix-rename                |
| タスク名     | packages/* の test suffix を package 単位で .spec.ts へ rename     |
| 分類         | 改善 (rename-only / package 単位 ADR 拡張)                        |
| 対象機能     | packages/shared, packages/integrations のテスト命名規約             |
| 優先度       | 低                                                                |
| 見積もり規模 | 中規模（26 ファイル + package 単位 ADR 整理）                      |
| ステータス   | 未実施                                                            |
| 発見元       | Issue #325 Phase 12 独立検証                                       |
| 発見日       | 2026-05-09                                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #325 は `apps/api` 限定で test suffix を種別別 `*.spec.ts` に統一した。`packages/**` は「package ごとに owner / lifecycle / publish 境界が異なり、API test suffix ADR をそのまま適用できない」として scope-out された。現状 `packages/shared`（15 件）と `packages/integrations`（11 件）の合計 26 ファイルが `*.test.ts` のままであり、ルート `vitest.config.ts` の `*.{test,spec}` 二段階対応に依存して動作している。

### 1.2 問題点・課題

- packages は public-ish API（`@ubm-hyogo/shared`, `@ubm-hyogo/integrations`）として外部から参照されるため、test suffix の不統一は consumer 側のリポジトリ規約とも干渉しやすい
- `packages/shared` と `packages/integrations` で要求される分類軸が異なる（前者は zod schema / utils / db、後者は Google Forms / Sheets API contract）
- apps/api 種別別 suffix ADR が package には適用できないが、各 package 単位で ADR を立てないと将来の suffix 規約決定が遅延する

### 1.3 放置した場合の影響

- ルート vitest.config の `*.{test,spec}` 二段階対応が恒久化し、followup-003（spec 単一収斂）の前提が崩れる
- 新規 package 追加時に「どの suffix を採用するか」の判断材料がなく規約 drift が拡大
- shared / integrations を分割 publish したくなった場合に test 命名規約整理が後手に回る

---

## 2. 何を達成するか（What）

### 2.1 目的

`packages/shared` と `packages/integrations` それぞれで package 単位の test suffix ADR を起草し、26 ファイルを `*.spec.ts` に rename する。両 package で完全に同じ分類軸を強制せず、package の責務に応じて contract / unit / integration などの軸を決める。

### 2.2 最終ゴール

- `packages/shared/` 配下に suffix ADR（または既存仕様書への追記）が存在
- `packages/integrations/` 配下に同様の ADR が存在
- `packages/**/*.test.ts` が 0 件、`*.spec.ts` のみ残存
- ルート vitest.config / package.json / workflow yml の glob 参照が整合
- typecheck / lint / 各 package の test 実行が PASS、件数不変

### 2.3 スコープ

#### 含むもの

- packages/shared 用 suffix ADR 起草と 15 ファイル rename
- packages/integrations 用 suffix ADR 起草と 11 ファイル rename
- glob 参照同期、Phase 11 evidence

#### 含まないもの

- テスト本体・import の変更（純 rename）
- apps/web の rename（→ followup-001）
- vitest.config の `*.{test,spec}` 収斂（→ followup-003）
- package の publish 設定変更

---

## 3. どう実装するか（How）

1. package ごとに分類軸を決定（shared: zod / utils / db / unit、integrations: contract / mapper / unit など）
2. package ごとに rename-mapping.csv を生成
3. `git mv` で各 package 内一括 rename（package 単位で commit を分けるか単一 PR とするかは Phase 1 で判断）
4. ルート glob 参照同期
5. typecheck / lint / `mise exec -- pnpm -r test` の PASS と件数一致を Phase 11 evidence に保存

---

## 苦戦箇所【記入必須】

- 対象: `packages/shared/src/` および `packages/integrations/src/`
- 症状: 2 package を 1 タスクで扱うと ADR の責務が混線しやすい。Issue #325 と同じく「package owner / lifecycle / publish 境界が異なる」ため、ADR は package ごとに独立させる必要があるが、suffix 規約だけは横断統一しないと vitest config の `*.spec.ts` 収斂が package 単位の進捗待ちになる
- 症状2: `packages/integrations/google` のように nested 構造の test ファイルがあり、find ベースの rename script で path collision を見逃しやすい
- 参照: `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/unassigned-task-detection.md`（scope-out 棚卸し）、`docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/skill-feedback-report.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| package 単位 ADR の責務分離が曖昧で、横断規約と矛盾 | 中 | Phase 2 で「横断: spec.ts 強制」「package 固有: 種別 prefix」に責務を分離した ADR テンプレを作る |
| nested test ファイル（google/forms 配下など）の rename 漏れ | 中 | `find packages -name '*.test.ts'` を Phase 11 で実行し、before / after の path 完全一致を gate |
| consumer 側 import path が `*.test.ts` を直接参照 | 低 | grep で 0 件確認後 rename。万一参照があれば import 修正を含めて対応 |
| pnpm workspace の filter 解決ミスで test が片方だけ走る | 中 | `mise exec -- pnpm -r --filter './packages/**' test` で全 package 横断実行を CI で確認 |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter '@ubm-hyogo/shared' test
mise exec -- pnpm --filter '@ubm-hyogo/integrations' test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 全 PASS。テスト件数が rename 前後で同一

### 残存ゼロ検証

```bash
find packages -name '*.test.ts' -o -name '*.test.tsx' | wc -l
```

期待: `0`

### glob 参照同期検証

```bash
rg "packages.*\.test\." -g '!**/node_modules/**' -g '!docs/**'
```

期待: 0 件

## スコープ

### 含む

- packages/shared および packages/integrations の suffix ADR 起草
- 26 ファイル全件 rename
- glob 参照同期、Phase 11 evidence

### 含まない

- テスト本体の変更
- apps/web の rename（→ followup-001）
- vitest.config の spec 単一収斂（→ followup-003）
- package の publish / version bump
