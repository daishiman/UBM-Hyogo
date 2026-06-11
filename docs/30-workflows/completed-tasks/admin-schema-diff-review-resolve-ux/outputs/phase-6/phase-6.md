# Phase 6: テスト拡充 — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]` / `[状態: implemented_local_evidence_captured]`

本 Phase は **fail path / 回帰 guard / 補助ケース**の設計のみを記述する。RED/GREEN の本 waveで実行済み で行う。SSOT は `shared-context.md`、設計から逸脱しない。

---

## 1. 目的

Phase 4（happy path のテスト設計）に対し、本 Phase は次の 3 系統を補う:

1. **fail path / 防御**: 未登録 technical 名・`questionId` 無し diff など、例外を投げず安全に縮退する経路。
2. **回帰 guard**: 本タスクで**変更しない**動作（HTTP 202 retryable continuation・bulk limit warning）が、表示/配置変更の副作用で壊れていないことを固定。
3. **補助ケース**: 用語併記の形式（`（技術名:` を含む）崩れ検知など、表現層リグレッションを機械検知する。

> 不変条件: 本タスクは表現テキスト・配置・補助 `<p>` の追加のみ。`data-testid` / `aria-label` の id・role・API contract は不変（SSOT §2 C-4 / AC-6）。回帰 guard はこの不変性を固定する役割を持つ。

---

## 2. 対象テストファイル（拡充先）

| ファイル | 区分 | 本 Phase での追加内容 |
|---------|------|----------------------|
| `apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts` | 新規（Phase 4 で骨格） | 未登録キー防御ケース・用語併記形式ケースを追加 |
| `apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx` | 新規（Phase 4 で骨格） | 用語併記形式の崩れ検知を追加 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 既存に追加 | `questionId` 無し alert のインライン位置・202 回帰・bulk limit 回帰 |

---

## 3. テストケース設計（ID / 前提 / 期待値）

### 3.1 未登録 technical 名の防御（`schemaReviewTerms.ts`）

| ID | 対象 | 前提 | 操作 | 期待値 |
|----|------|------|------|--------|
| T6-DEF-01 | `termDescription` | `SCHEMA_REVIEW_TERMS` に存在しないキー `"__unknown_xyz__"` を渡す | `termDescription("__unknown_xyz__")` を呼ぶ | 戻り値が**空文字 `""`**。例外を投げない（`expect(() => ...).not.toThrow()`） |
| T6-DEF-02 | `plainLabel` | 未登録キー `"__unknown_xyz__"` | `plainLabel("__unknown_xyz__")` を呼ぶ | 戻り値が**原文 `"__unknown_xyz__"` をそのまま返す**（情報欠落させない）。例外を投げない |
| T6-DEF-03 | `termDescription` | 空文字 `""` を渡す（境界値） | `termDescription("")` を呼ぶ | `""` を返し、例外を投げない |
| T6-DEF-04 | `plainLabel` | 空文字 `""` を渡す（境界値） | `plainLabel("")` を呼ぶ | `""` を返し、例外を投げない |

> 設計意図: 純粋関数ガード（SSOT §2 A・WEEKGRD-02）。lookup は登録キーのみ。未登録は `plainLabel` が原文保持・`termDescription` が空文字で「説明が出ないだけ」に縮退し、UI クラッシュを起こさない。

### 3.2 用語併記の形式崩れ検知

| ID | 対象 | 前提 | 操作 | 期待値 |
|----|------|------|------|--------|
| T6-FMT-01 | `plainLabel` | 登録キー `"stableKey"` | `plainLabel("stableKey")` を呼ぶ | 戻り文字列が **`（技術名:` を部分一致で含む**（`expect(label).toContain("（技術名:")`）かつ `stableKey` を含む。やさしい日本語主・技術名併記の形式（AC-3）を固定 |
| T6-FMT-02 | `plainLabel` | 登録 12 語すべて | 各キーに `plainLabel` を適用 | すべての戻り値が `（技術名: <technical>）` を含み、対応する `technical` 名を含む（`it.each` で 12 語ループ） |
| T6-FMT-03 | `SchemaReviewGuide` 描画 | guide の用語ミニ集（`data-component="schema-review-glossary"`）が描画される | render 後に glossary 内テキストを取得 | 表示される各用語ラベルが `（技術名:` を含む（テキストノードに併記形式が現れる）。形式崩れ（やさしい語のみ/技術名のみ）を検知 |

> 設計意図: 「やさしい日本語（技術名: xxx）」形式は AC-3 の核。`plainLabel` の実装変更や文言編集で併記が落ちる回帰を `（技術名:` の部分一致で機械検知する。

### 3.3 `questionId` 無し diff の alert インライン位置（回帰 + 配置）

| ID | 対象 | 前提 | 操作 | 期待値 |
|----|------|------|------|--------|
| T6-ALERT-01 | `SchemaDiffPanel` | `initial` に `questionId` を持たない diff（例 `removed` で questionId 欠落）を 1 件含める | 当該カードのラベルボタンをクリック（`onSelect`） | `role="alert"` の要素「この diff には questionId がないため alias 割当はできません。」が、**当該 `schema-field-card` の子孫**として描画される（`within(card).getByRole("alert")` で取得可能）。パネル最下部ではない |
| T6-ALERT-02 | `SchemaDiffPanel` | 同上 | クリック後 | 割当フォーム（`data-component="schema-assign-inline-form"`）は描画**されない**（questionId 無しでは alias 割当不可。`active && !active.questionId` 分岐） |
| T6-ALERT-03 | `SchemaDiffPanel` | `questionId` を持つ diff | ラベルクリック | alert は出ず、インラインフォームが当該カード直下に出る（T6-ALERT-01 の対称・正常系の確認） |

> 設計意図: SSOT §2 C-1。インライン化後も「questionId 無し → alert」の分岐がカード直下で維持されることを固定。最下部固定だった旧配置への退行を防ぐ。

### 3.4 HTTP 202 retryable continuation のフィードバック表示（回帰・不変）

| ID | 対象 | 前提 | 操作 | 期待値 |
|----|------|------|------|--------|
| T6-202-01 | `SchemaDiffPanel` | `useAdminMutation`/`postSchemaAlias` をモックし、割当送信のレスポンスを **HTTP 202**（retryable continuation）に固定 | questionId 有り diff を選択 → 永続的な名前を入力 → 「名前を割り当てる」を送信 | 202 retryable の**フィードバック表示（継続中/再試行案内）が現行と同一に表示される**（`feedback` state の表示文言・role が変わらない）。配置インライン化の副作用で 202 分岐表示が消えない |
| T6-202-02 | `SchemaDiffPanel` | 同上 | 送信後 | API contract（送信 body・endpoint `"/api/admin/schema/aliases"`・method POST）が不変であることをモック呼び出し引数で検証（`expect(mockMutate).toHaveBeenCalledWith(...)`） |

> 設計意図: AC-6。202 retryable は SSOT で「変更禁止」。表示テキスト変更（ボタン文言・help 追加）が 202 分岐ロジックに影響しないことを回帰固定する。

### 3.5 bulk limit（BULK_LIMIT=50）超過 warning（回帰・不変）

| ID | 対象 | 前提 | 操作 | 期待値 |
|----|------|------|------|--------|
| T6-BULK-01 | `SchemaDiffPanel` / `SchemaDiffBulkResolveModal` | bulk resolve 対象を **51 件以上**選択した状態を構成 | bulk resolve トグル → 上限超過状態にする | `BULK_LIMIT=50` 超過 warning が現行どおり表示される（warning の文言・表示条件が不変） |
| T6-BULK-02 | `SchemaDiffPanel` | bulk トグル付近の補助 `<p>`「複数の設問にまとめて名前を割り当てられます」を追加（SSOT §2 C-2） | bulk トグルを開く | 補助文が表示されつつ、**bulk の動作ロジック（選択数カウント・limit 判定・submit）は不変**。補助文追加が limit warning を隠さない・壊さない |

> 設計意図: AC-6。bulk の動作は不変対象。補助 `<p>` 追加（表現層）が limit warning（既存ロジック）に干渉しないことを固定する。

---

## 4. 回帰 guard 一覧（変更しないことの保証）

| 不変対象 | guard ケース | 失敗時の意味 |
|---------|-------------|-------------|
| HTTP 202 retryable 表示 | T6-202-01/02 | 配置/文言変更が 202 分岐を壊した |
| bulk limit warning | T6-BULK-01/02 | 補助文追加が bulk ロジックに干渉した |
| `questionId` 無し alert | T6-ALERT-01/02 | インライン化で alert 分岐が欠落/誤配置した |
| API contract（endpoint/method/body） | T6-202-02 | 表現変更が mutation 配線に波及した |
| 機械可読属性（`data-testid`/`aria-label`） | Phase 4 既存ケースで担保（rename 禁止）。本 Phase は変更しない前提を破らない | id rename 混入 |

---

## 5. テスト実行コマンド（本 wave で実行・本 wave で実行済み）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

- 新規テストは `*.spec.{ts,tsx}` のみ（不変条件 #8）。
- `within()` / `getByRole("alert")` / `toContain("（技術名:")` / モック呼び出し引数検証を用い、DOM 位置・防御・併記形式・回帰を機械検証する。

---

## 完了条件

- 上記 §3 の全ケース（T6-DEF-01..04 / T6-FMT-01..03 / T6-ALERT-01..03 / T6-202-01..02 / T6-BULK-01..02）が **ID・前提・操作・期待値つきで設計記述済み** である。
- fail path（未登録 technical 名で例外を投げず空文字/原文に縮退）と回帰 guard（202 retryable・bulk limit warning・alert 配置）が網羅されている。
- 用語併記の形式崩れ検知（`（技術名:` 部分一致）が含まれる。
- 本 Phase 対象のコード/テスト実行結果を Phase 11 に集約（`implemented_local_evidence_captured`）。RED/GREEN は本 wave。
