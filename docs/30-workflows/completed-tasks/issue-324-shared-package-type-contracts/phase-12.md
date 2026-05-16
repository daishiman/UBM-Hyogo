# Phase 12: 完了処理（issue-324-shared-package-type-contracts）

[実装区分: 実装仕様書]

> 判定根拠注記: 本タスクは新規ファイル `packages/shared/src/__tests__/type-contracts.spec.ts` を伴う実装仕様書のため、CONST_004 標準フローを適用し strict 7 outputs を生成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-324-shared-package-type-contracts` |
| Phase | 12 / 13（完了処理） |
| 推定工数 | 0.25 人日 |
| 依存 Phase | Phase 11 |
| 並列性 | 不可 |
| タスク種別 | `implementation` / `NON_VISUAL` / `implemented_local_evidence_captured` |
| 必須 outputs | 7 ファイル |

---

## 1. 目的

Phase 11 統合検証完了後、Phase 13 user approval gate に必要な 7 必須成果物を生成する。

---

## 2. 必須成果物（7 ファイル）

| # | ファイル | 役割 | 必須セクション |
|---|---------|------|--------------|
| 1 | `outputs/phase-12/main.md` | Phase 12 index / strict 7 files manifest | 判定 / 7 ファイル一覧 / same-wave sync 状態 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） | アナロジー / 型定義 / API / 使用例 / エラー処理 / 設定値 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1 結果 + Step 2 判定 | Step 1-A〜G / Step 2 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル一覧 / validator 結果 | 新規 1 / docs 更新 4 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | SF-03 4 パターン照合 | 0 件でも summary |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への観察 | 改善点 or 「なし」 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 全完了確認 | 各項目 PASS/FAIL |

---

## 3. implementation-guide.md 要件

### 3.1 Part 1（中学生レベル / アナロジー）

必須要素:

- 何のタスクか: 「`packages/shared` のなかで使う『身分証の種類』（MemberId / ResponseId / ResponseEmail など）が、間違って入れ替わってもプログラムが動いてしまわないように、コンパイル時点で『その入れ方は禁止』と弾く検査表を作る作業」
- なぜ必要か: 「会員 ID とメールアドレスはどちらも文字列だから、うっかり取り違えても普通の TypeScript は気づけない。気づかないまま会員一覧に他人のメールが混ざる事故を防ぐため、最初の 1 行で禁止できる仕組みが要る」
- 結果どうなるか: 「テスト 15 件が compile time に走り、間違った代入をした瞬間 IDE と CI が赤くなる」
- 比喩: 「鍵と鍵穴の形をテンプレートで決めておいて、形が違う鍵は差した瞬間カチッと弾かれる仕組みを作るのと同じ」

### 3.2 Part 2（技術者レベル / 5 項目チェック対応表）

| # | 項目 | 本タスクでの記述 |
|---|-----|----------------|
| C12P2-1 | 型定義 | `Brand<T, B>` (`branded/index.ts`) / `MemberId` / `ResponseId` / `ResponseEmail` / `AdminId` / view-model `z.infer` 群 |
| C12P2-2 | API | `expectTypeOf<X>().not.toMatchTypeOf<Y>()` / `toEqualTypeOf` / `@ts-expect-error` の vitest 公開 API |
| C12P2-3 | 使用例 | `packages/shared/src/__tests__/type-contracts.spec.ts` の 5 describe / 15 it ブロック |
| C12P2-4 | エラー処理 | tsc の `Unused @ts-expect-error directive` を逆活用した regression detection / Phase 06 typecheck gate |
| C12P2-5 | 設定値 | `vitest.config.ts` 既存 include glob 利用（追加設定なし）/ `tsd` / `vitest typecheck mode` 不採用根拠 |

---

## 4. system-spec-update-summary.md 要件

### 4.1 Step 1（実コマンド実行結果）

| Step | コマンド | 期待 |
|------|---------|------|
| 1-A | `test -f packages/shared/src/__tests__/type-contracts.spec.ts` | exists |
| 1-B | `wc -l packages/shared/src/__tests__/type-contracts.spec.ts` | 100..200 行 |
| 1-C | `grep -c '^describe' .../type-contracts.spec.ts` | 5 |
| 1-D | `grep -c '^\s*it(' .../type-contracts.spec.ts` | 15 |
| 1-E | `grep -c '@ts-expect-error' .../type-contracts.spec.ts` | 2 |
| 1-F | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | exit 0 |
| 1-G | `mise exec -- pnpm --filter @ubm-hyogo/shared test` | exit 0 / +15 件 |

### 4.2 Step 2（正本登録）

本タスクは spec / 仕様書として `docs/00-getting-started-manual/specs/*` への新規登録対象を持たないが、`packages/shared` の **テスト規約に新パターン（type-contracts）を導入**するため、以下を実施する:

| Step 2 操作 | 対象 |
|------------|------|
| 2-A | `CLAUDE.md` 既存の不変条件 #8 (`*.spec.{ts,tsx}` のみ) と整合済を確認（追記不要） |
| 2-B | `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md` への移動（本サイクルで実施） |
| 2-C | INDEX 系 (`docs/30-workflows/_index.md` 等) が存在する場合のみ link 追加 |

---

## 5. unassigned-task-detection.md 要件

SF-03 4 パターンで照合:

| パターン | 該当 |
|---------|------|
| 仕様乖離 | なし（AC-1..AC-5 全カバー） |
| 未着手項目 | なし |
| 並列 task 起因 task | なし（独立タスク） |
| 後続 task 派生 | 候補: `pnpm --filter '...^@ubm-hyogo/shared'` 依存逆引き CI 整備（元 UT-08A-05 リスク表 §3 の派生）。本タスクの scope 外として detection に記録。 |

---

## 6. skill-feedback-report.md 要件

`task-specification-creator` skill への観察事項:

- 観察 1: implementation 仕様書で `*.test-d.ts` 文字列が AC 内に含まれる場合の「リポジトリ convention 読み替え」手順が明文化されると良い（不変条件 #8 との整合）。
- 観察 2: `expectTypeOf` vs `tsd` の選定 ADR テンプレートが skill references に追加されると判断速度が上がる。
- 改善点: Phase 12 の「Step 2 = N/A」と「Step 2 = 軽微登録」の境界基準が曖昧で、本タスクでは §4.2 で個別判断した。テンプレート化候補。

---

## 7. phase12-task-spec-compliance-check.md 要件

| Task | 確認項目 | 結果 |
|------|---------|------|
| 12-1 | 7 必須成果物全て配置 | — |
| 12-2 | implementation-guide Part 1 / Part 2 双方記述 | — |
| 12-3 | system-spec-update-summary Step 1 全コマンド結果記録 | — |
| 12-4 | Step 2 妥当性根拠記載 | — |
| 12-5 | 計画系 wording（「予定」「次は」等）が成果物に残っていない | — |
| 12-6 | implemented_local_evidence_captured モードに整合 | — |

---

## 8. 完了条件（Phase 13 へ進む gate）

- [x] 7 必須成果物全て `outputs/phase-12/` に配置
- [x] implementation-guide が Part 1（アナロジー）+ Part 2（5 項目）揃う
- [x] system-spec-update-summary に Step 1 全結果 + Step 2 妥当性根拠
- [x] documentation-changelog で実変更を確認
- [x] unassigned-task-detection 4 パターン照合済
- [x] skill-feedback-report 観察事項記載
- [x] phase12-task-spec-compliance-check Task 12-1..6 全 PASS

---

## 9. プロトタイプ参照表

該当なし（本タスクは shared package 型契約のみで UI 影響なし）。

---

## 10. リスク / 注意

| リスク | 緩和 |
|-------|------|
| 7 ファイルのいずれか欠落 | §8 完了条件チェックリストで網羅 |
| Step 2 判定が緩すぎる | §4.2 で具体操作 2-A..2-C を列挙 |

---

## 11. 次 Phase への引き渡し

Phase 13 は本 Phase の 7 必須成果物 + `packages/shared/src/__tests__/type-contracts.spec.ts` + Phase 10 docs 更新を変更ファイルセットとし、PR title / body を準備する（user approval まで実行しない）。
