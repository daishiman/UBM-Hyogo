# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

Phase 5 で実装した metadata.ts / builder.ts / 関連 unit test から、(a) row → canonical 変換、(b) field kind 判定、(c) locale 解決の 3 つを resolver helper として抽出し、`apps/api/src/repository/responseFields.ts` / `responseSections.ts` の既存ロジックと共通化境界を確定する。同時に YAGNI 原則に従い、現時点で 1 箇所しか使われない抽象化は明示的に「DRY 化対象外」として記録する。DRY 化後も builder.ts の呼び出し側コード（public / member / admin repository chain）が変更最小化（理想は 0 行）で済むことを保証する。

## 前 Phase からの引き継ぎ

- Phase 7 ac-matrix.md から抽出された共通化候補
  - resolver の `resolveSectionKey` / `resolveFieldKind` / `resolveLabel` を builder.ts 内で個別に呼ぶパターンが N 箇所
  - row（`response_fields` / `response_sections`）→ canonical 変換が `responseFields.ts` / `responseSections.ts` / `builder.ts` で部分的に重複
- Phase 6 の F-2（alias 衝突）優先順位ロジックが resolver と builder の両方に分散しないこと

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 5 実装ランブック | 初期実装の構造 | helper 抽出の出発点 |
| 上流 | Phase 7 マトリクス | 共通化候補リスト | 抽出スコープ |
| 並列 | `responseFields.ts` / `responseSections.ts` | 既存 row shape 変換 | 共通化後の境界 |
| 下流 | Phase 9 | 抽出後のテスト対象 | coverage 算定行数 |

## DRY 化対象（IN）

### 1. row → canonical 変換 helper

| 項目 | 内容 |
| --- | --- |
| 抽出先 | `apps/api/src/repository/_shared/metadata.ts` 内 `toCanonicalField(row): CanonicalField` / `toCanonicalSection(row): CanonicalSection` |
| 既存重複箇所 | `responseFields.ts`（row → ResponseField 型）/ `responseSections.ts`（row → ResponseSection 型）/ `builder.ts`（fallback 時の inline 変換） |
| 共通化粒度 | row の column 名 → canonical field 名のマッピングのみ（zod schema は持たず関数として薄く保つ） |
| 後方互換 | `responseFields.ts` / `responseSections.ts` の export signature は維持し、内部実装だけ helper を呼ぶ。呼び出し側コード（public / member / admin repository chain）は無変更 |

### 2. field kind 判定 helper

| 項目 | 内容 |
| --- | --- |
| 抽出先 | `apps/api/src/repository/_shared/metadata.ts` 内 `decideFieldKind(stableKey, sources): FieldKind` |
| 既存重複箇所 | builder.ts の旧 heuristic（削除対象）と resolver 実装で kind 判定ロジックが二重化する懸念 |
| 共通化粒度 | (a) consent allowlist 照合、(b) source priority order（D1 column > static manifest > alias queue）、(c) unknown fallback の 3 段だけ |
| 後方互換 | resolver は `decideFieldKind` を内部で呼び、外部公開 IF（`resolveFieldKind`）は変更しない |

### 3. locale 解決 helper

| 項目 | 内容 |
| --- | --- |
| 抽出先 | `apps/api/src/repository/_shared/metadata.ts` 内 `resolveLocaleLabel(labels, locale): string` |
| 既存重複箇所 | 現状なし（新規）。ただし将来 04a / 04b で多言語化が入った際の単一着地点とする |
| 共通化粒度 | locale 配列から優先順位（`ja-JP` > `ja` > `en` > 先頭）で 1 つ取る関数のみ |
| 後方互換 | 04a / 04b は `resolveLabel(stableKey, locale)` 経由のみで使用。直接呼出禁止 |

## DRY 化対象外（YAGNI、OUT）

| 項目 | 理由 |
| --- | --- |
| `MetadataResolver` の interface 自体の継承 hierarchy | 現時点で実装は static manifest 既定 1 種のみ。継承は OCP 違反になる前に YAGNI で見送り |
| Workers binding `DB` の wrapper 抽象化 | 既存 `apps/api/src/db/*` の慣行に合わせる。本タスク独自の wrapper を増やさない |
| structured log の logger ラッパー | apps/api 既存 logger を使う（独自 facade を作らない） |
| `ResolveError` の階層型化 | code enum で十分。class 階層は YAGNI |
| `responseFields.ts` の zod schema を resolver と共有 | 04b の view contract と表現が異なるため共有しない（過剰結合の予防） |

## API 互換性（呼び出し側変更最小化）

- builder.ts の関数シグネチャ（`buildSections(rows, ...)` / `buildFields(rows, ...)`）は **resolver を必須引数として 1 つ追加するのみ**、戻り値型は無変更
- public / member / admin repository chain は呼び出し時に `MetadataResolver` のインスタンスを 1 度生成して渡す。呼び出し箇所の変更行数は **各 view layer 1 行の引数追加のみ**
- 既存テストファイル（`builder.test.ts`）は `createMockResolver()` を使ってシグネチャ追加分だけ修正（テスト本体ロジック変更なし）

## 実行タスク

- [ ] 1. row → canonical 変換 helper を `metadata.ts` に抽出
- [ ] 2. field kind 判定 helper を `metadata.ts` に抽出（priority order の単一着地点）
- [ ] 3. locale 解決 helper を `metadata.ts` に抽出
- [ ] 4. `responseFields.ts` / `responseSections.ts` の内部実装を helper 呼出に置換（公開 signature は無変更）
- [ ] 5. builder.ts の呼出 chain を確認し、resolver 引数追加以外の変更が無いことを diff で証明
- [ ] 6. DRY 化対象外（YAGNI）リストを `outputs/phase-08/main.md` に明記
- [ ] 7. helper 抽出後の循環依存（`metadata.ts` ↔ `responseFields.ts`）が無いことを `pnpm typecheck` で確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/repository/_shared/builder.ts | 改修対象 |
| 必須 | apps/api/src/repository/responseFields.ts | 既存 row 変換 |
| 必須 | apps/api/src/repository/responseSections.ts | 既存 row 変換 |
| 必須 | phase-05.md / phase-06.md | 実装方針と failure mitigation |
| 参考 | docs/30-workflows/completed-tasks/UT-02A-SECTION-FIELD-MAPPING-METADATA.md section 4 Phase D | fallback 削除と契約確定の趣旨 |

## 実行手順

### ステップ 1: 共通化候補の最終洗出
- Phase 7 ac-matrix.md から共通化候補の関数シグネチャと使用箇所行数を集計
- 1 箇所しか使われない抽象は YAGNI として OUT に分類

### ステップ 2: helper 抽出
- `metadata.ts` 末尾に helper セクションを追加（`MetadataResolver` の implementation 詳細として private に近い扱い）
- export は最小限（unit test 用に関数単位で named export）

### ステップ 3: 既存ファイルの内部置換
- `responseFields.ts` / `responseSections.ts` の row → 型変換ロジックを helper 呼出に置換
- 公開 signature 無変更を `git diff --stat` と `pnpm typecheck` で確認

### ステップ 4: builder.ts 呼出 chain 確認
- public / member / admin repository chain の呼出箇所を `grep` で抽出し、変更行数が「resolver 引数 1 行追加のみ」であることを確認
- 変更行数が 2 行以上なら抽象化境界を見直す

### ステップ 5: YAGNI ドキュメント
- 上記「DRY 化対象外」表を `outputs/phase-08/main.md` に転記
- 将来 04a / 04b で多言語化が入った際の locale helper 拡張ポイントだけは「将来拡張可能」と注記

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | helper 単位の coverage 測定（変更行 ≥ 90%） |
| Phase 11 | helper 経由の 3 view 同一導出 evidence |

## 多角的チェック観点

- 不変条件 **#1**: helper 抽出によって canonical resolver への一本化を強化（fallback の二重実装が物理的に不可能になる）
- 不変条件 **#2**: consent allowlist 照合が `decideFieldKind` の 1 箇所に集約
- 不変条件 **#5**: helper も `apps/api` 内に閉じる。`packages/shared` への漏出禁止（型のみ shared 経由）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | row → canonical 変換 helper 抽出 | 8 | pending | metadata.ts |
| 2 | field kind 判定 helper 抽出 | 8 | pending | priority order 単一着地点 |
| 3 | locale 解決 helper 抽出 | 8 | pending | 将来拡張ポイント |
| 4 | responseFields/Sections.ts 内部置換 | 8 | pending | 公開 signature 無変更 |
| 5 | builder.ts 呼出 chain 変更最小化確認 | 8 | pending | 1 行追加のみ |
| 6 | YAGNI 対象外リスト記録 | 8 | pending | 過剰抽象化予防 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化サマリ / IN / OUT 表 / 呼出側変更行数 / YAGNI 判断記録 |
| メタ | artifacts.json | phase 8 status を completed に更新 |

## 完了条件

- [ ] helper 3 つ（row 変換 / kind 判定 / locale）が `metadata.ts` に抽出済み
- [ ] `responseFields.ts` / `responseSections.ts` の公開 signature が無変更
- [ ] builder.ts 呼出側の変更行数が「resolver 引数 1 行追加のみ」
- [ ] YAGNI 対象外リストが記録されている
- [ ] `pnpm typecheck` pass、循環依存なし

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（循環依存 / 公開 signature 変化 / 過剰抽象化）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ: helper 単位の coverage 算定対象行、circular import チェック完了状態
- ブロック条件: 公開 signature 変化があれば Phase 9 不可（呼出側影響を要再評価）
