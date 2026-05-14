# タスク仕様書: Issue #622 — packages/* test suffix を `.spec.ts` へ rename

[実装区分: 実装仕様書]

判定根拠: 本タスクは `packages/shared`（17 ファイル）と `packages/integrations`（11 ファイル）合計 **28 件**の `*.test.ts` を `*.spec.ts` に rename する純粋なファイル名変更であり、コード変更（`git mv` による rename・glob 参照同期）を必ず伴う。ドキュメントのみで完結する内容ではないため、CONST_004 デフォルトに従い実装仕様書として作成する。Issue #622 は OPEN 状態（unassigned-task 起票元: `task-issue-325-followup-002-packages-test-suffix-rename.md`）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-622-packages-test-suffix-rename |
| 親 Issue | #622（OPEN, packages rename 実装対象） |
| 上流 Issue | #325（CLOSED, `apps/api` rename 完了） / #621（`apps/web` rename 完了） |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/task-issue-325-followup-002-packages-test-suffix-rename.md` |
| 関連 followup | #623 / `docs/30-workflows/unassigned-task/task-issue-325-followup-003-vitest-spec-suffix-convergence.md`（本タスク完了後に unblock） |
| 配置先 | `docs/30-workflows/issue-622-packages-test-suffix-rename/` |
| 作成日 | 2026-05-11 |
| 状態 | implemented-local |
| taskType | implementation |
| implementation_mode | rename-only |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low`） |
| 規模 | medium（28 ファイル + package 単位 ADR 2 件） |
| 想定 PR 数 | 1（packages 全体を 1 PR で扱う。package owner / publish 境界の差は ADR で吸収） |

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #325 は `apps/api` 限定で test suffix を種別別 `*.spec.ts` に統一した。`packages/**` は「package owner / lifecycle / publish 境界が異なる」として scope-out された。Issue #621 で `apps/web` 側は `*.spec.ts` 化完了。本タスク開始時点では `packages/**/*.test.ts` 28 件が残存していたが、2026-05-12 のローカル実装サイクルで 28 件すべてを `*.spec.ts` へ rename 済み。ルート `vitest.config.ts` の `include: ["packages/**/src/**/*.{test,spec}.{ts,tsx}"]` 二段階対応は #623 / followup-003 まで維持する。

### 1.2 課題

- packages は public-ish API（`@ubm-hyogo/shared`, `@ubm-hyogo/integrations`）で外部参照されるため命名規約 drift が consumer 規約と干渉しやすい
- 二段階 glob (`{test,spec}`) が恒久化すると followup-003（spec 単一収斂）の前提が崩れる
- shared と integrations では分類軸が異なる（shared: zod / utils / db / unit、integrations: contract / mapper / unit）

### 1.3 放置時の影響

vitest config の `{test,spec}` 並走恒久化、新規 package 追加時の規約 drift、followup-003 のブロック。

## 2. 何を達成するか（What）

### 2.1 目的

`packages/shared` と `packages/integrations` で package 単位の test suffix ADR を起草し、28 ファイル全件を `*.spec.ts` に rename する。

### 2.2 最終ゴール

- `packages/shared/ADR-test-suffix.md` および `packages/integrations/ADR-test-suffix.md` が Accepted 状態で存在
- `find packages -name '*.test.ts'` が 0 件
- `find packages -name '*.spec.ts'` が 28 件（rename 前後で件数完全一致）
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / focused package tests 全 PASS、test 件数 rename 前後で同一
- ルート `vitest.config.ts` の glob は変更不要（`{test,spec}` 二段階のまま、followup-003 が単一収斂を担当）

### 2.3 スコープ

#### 含むもの

- packages/shared 用 suffix ADR 起草と 17 ファイル rename
- packages/integrations 用 suffix ADR 起草と 11 ファイル rename
- `git mv` ベースの rename（履歴保全のため `mv` 直書きしない）
- rename-mapping.csv 生成と Phase 11 evidence 保存
- glob 参照同期確認（vitest config / package.json scripts / .github/workflows / docs）

#### 含まないもの（rename-only 境界 — followup として別タスク化済み）

- テスト本体・import の変更（純 rename only）
- apps/web の rename（→ #621 完了済み）
- ルート vitest.config の `{test,spec}` 単一収斂（→ #623 / followup-003 で実施。理由: 全 apps + packages + scripts 横断で別 PR スコープ）
- package の publish / version bump

## 3. 不変条件・正本仕様との整合

- 不変条件 #5 (D1 直接アクセス禁止) — 本タスクは test 命名のみで API 経路に影響なし
- Cloudflare CLI / シークレット — 該当なし
- 既存テストの実行挙動・件数は rename 前後で完全一致を保つ

## 4. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| nested test ファイル（`packages/integrations/google/src/forms/` 配下）の rename 漏れ | 中 | Phase 5 で 28 件の rename-mapping.csv を作成、Phase 11 で `find packages -name '*.test.ts' \| wc -l = 0` を gate |
| `git mv` を使わず `mv` で履歴が分断 | 中 | Phase 6 で `git mv` を必須化、Phase 11 で `git log --follow` で履歴連続性を 1 件抜き打ち確認 |
| ADR の責務分離が曖昧 | 低 | Phase 3 で「横断ルール: `.spec.ts` 強制」「package 固有: 種別 prefix（contract/mapper 等）」に責務分離 |
| pnpm workspace filter で片方の test しか走らない | 中 | `mise exec -- pnpm -r --filter './packages/**' test` で全 package 横断実行を CI で確認 |
| consumer の import 経路が `*.test` を参照 | 低 | `rg "packages/.*\\.test"` で 0 件を Phase 11 で gate |

## 5. 検証方法

### 5.1 単体検証

```bash
mise exec -- pnpm --filter '@ubm-hyogo/shared' test
mise exec -- pnpm --filter '@ubm-hyogo/integrations' test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 全 PASS、テスト件数が rename 前後で同一。

### 5.2 残存ゼロ検証

```bash
find packages -name '*.test.ts' -o -name '*.test.tsx' | wc -l   # 期待: 0
find packages -name '*.spec.ts' -o -name '*.spec.tsx' | wc -l   # 期待: 28
```

### 5.3 glob 参照同期検証

```bash
rg "packages.*\.test\." -g '!**/node_modules/**' -g '!docs/**' -g '!**/outputs/**'
```

期待: 0 件（または rename-mapping 内 historical 言及のみ）。

## 6. 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #325 (`apps/api` rename, CLOSED) | 横断 suffix 規約の正本 |
| 上流 | Issue #621 (`apps/web` rename, MERGED) | 同一規約適用済みの隣接事例 |
| 下流 | followup-003 (vitest spec 単一収斂) | 本タスク完了が前提 |

## 7. 実装ファイル一覧（抜粋・Phase 5 で確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `packages/shared/ADR-test-suffix.md` | 新規 | shared の suffix ADR（zod / utils / db / unit 軸） |
| `packages/integrations/ADR-test-suffix.md` | 新規 | integrations の suffix ADR（contract / mapper / unit 軸） |
| `packages/shared/src/**/*.test.ts` (17 件) | rename | `*.test.ts` → `*.spec.ts` |
| `packages/integrations/**/src/**/*.test.ts` (11 件) | rename | `*.test.ts` → `*.spec.ts` |
| `outputs/phase-05/rename-mapping.csv` | 新規 | 28 行の before/after path mapping |
| `outputs/phase-11/evidence/*` | 新規 | typecheck / lint / pnpm -r test / find / rg gate ログ |

## 8. AC（Acceptance Criteria）

- AC-1: `packages/shared/ADR-test-suffix.md` が Accepted で存在し、shared 固有の分類軸（zod / utils / db / unit など）を定義
- AC-2: `packages/integrations/ADR-test-suffix.md` が Accepted で存在し、integrations 固有の分類軸（contract / mapper / unit）を定義
- AC-3: `find packages -name '*.test.ts' -o -name '*.test.tsx' | wc -l` = 0
- AC-4: `find packages -name '*.spec.ts' -o -name '*.spec.tsx' | wc -l` = 28
- AC-5: `mise exec -- pnpm typecheck` PASS（新規エラー 0）
- AC-6: `mise exec -- pnpm lint` PASS（新規エラー 0）
- AC-7: `mise exec -- pnpm -r test` PASS、test 件数 rename 前後で同一
- AC-8: `git log --follow` で抜き打ち 1 ファイルの履歴連続性が確認できる（`git mv` 使用 evidence）
- AC-9: `rg "packages.*\\.test\\." -g '!**/node_modules/**' -g '!docs/**' -g '!**/outputs/**'` = 0 件
- AC-10: PR 本文に `Closes #622` と `Refs #325, #621, #623` を含む（CLOSED の #325 / #621 は `Refs` のみ）
- AC-11: rename-mapping.csv が `outputs/phase-05/` に存在し 28 行 + header

## 9. Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / 真の論点 | phase-01.md |
| 2 | 既存実装調査（#325 / #621 成果, vitest config, 28 ファイル分類） | phase-02.md |
| 3 | 設計（ADR 構造 / rename 戦略 / commit 分割方針） | phase-03.md |
| 4 | 環境準備 / 前提条件確認 | phase-04.md |
| 5 | データモデル / rename-mapping.csv schema | phase-05.md |
| 6 | 実装サイクル handoff（git mv 手順 / ADR draft） | phase-06.md |
| 7 | 整合性検証（vitest config / package.json / workflow） | phase-07.md |
| 8 | エラーハンドリング / rename collision / 履歴分断防止 | phase-08.md |
| 9 | テスト計画（typecheck / lint / pnpm -r test 件数一致） | phase-09.md |
| 10 | デプロイ / マージ手順（rename-only なので runtime 影響なし） | phase-10.md |
| 11 | 実行 evidence（NON_VISUAL） | phase-11.md / outputs/phase-11/main.md |
| 12 | 実装ガイド・system spec 同期・未タスク検出・skill feedback | phase-12.md |
| 13 | PR 作成（`Closes #622`） | phase-13.md |

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md) ・ [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（全 Phase 共通）

- [ ] AC-1〜AC-11 すべての evidence が `outputs/phase-11/` 配下に保存されている
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` 新規エラー 0 件
- [ ] `mise exec -- pnpm -r test` PASS、test 件数 rename 前後で同一
- [ ] `find packages -name '*.test.ts' | wc -l` = 0
- [ ] `git log --follow` で履歴連続性確認 evidence 取得済み
- [ ] PR 本文に `Closes #622` を含む
- [ ] followup-003（#623 / vitest spec 単一収斂）の既存未タスクが `outputs/phase-12/unassigned-task-detection.md` に明記されている
