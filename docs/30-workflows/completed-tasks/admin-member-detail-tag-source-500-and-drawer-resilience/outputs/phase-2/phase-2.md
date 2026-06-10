# Phase 2: 設計

## 1. 真の論点（要件レビュー思考法）

1. **真の論点**: 「DB のタグ source は CHECK 制約なしの任意文字列なのに、view 層 zod が 3 値固定で、しかも一覧は fail-soft・詳細は strict という非対称」が主問題。現象（500）ではなく値ドメイン契約の非対称が主問題。
2. **依存・責務境界**: source の値ドメインの権威は「DB（任意文字列）」だが、view（公開 surface）は「3 値分類」を期待する。両者の橋渡し（正規化）が**どの層にも無い**のが境界欠落。正規化は shared（view 構築の手前）に置くのが正しい所有権。
3. **価値とコストの不均衡**: 500 で管理画面の会員詳細が全く開けない（高コスト障害）に対し、修正は純関数 1 つ + zod 1 行 + キャスト 2 箇所置換 + UI retry（低コスト）。価値 >> コスト。
4. **改善優先順位**: (1) 500 解消（Lane A・必須・ブロッカー）→ (2) UI 回復導線（Lane B・堅牢性）。両方今回サイクル。
5. **4 条件評価**: 価値性=管理者の会員管理復旧 / 実現性=最小差分 / 整合性=union 非拡張で既存表示分岐に無影響 / 運用性=未知 source 全般に将来も強い。

### 因果ループ
- 強化ループ（不具合）: seed/未知 source → safeParse 失敗 → 500 → ドロワー error → retry 不能 → 会員詳細運用停止。
- バランスループ（修正）: normalizeTagSource で source を既知値へ収束 → safeParse 成功 → 200 → 詳細表示。zod `.catch` が最終防壁で収束を二重化。

## 2. スコープ境界・タスク分解

`index.md §タスク分解` の Lane A / Lane B を正本とする。両 Lane は関心分離（値ドメイン正規化 vs UI エラー回復）で独立並列。

| Lane | 責務 | 状態所有権 |
|------|------|-----------|
| A | タグ source の値ドメイン正規化（shared 純関数 + zod 防壁）と builder 適用 | `normalizeTagSource` は shared が所有。view object は builder が組み立て |
| B | `MemberDrawer` の fetch ライフサイクルとエラー回復 state | `reloadKey` / `error` / `data` は `MemberDrawer` が所有（子へ漏らさない） |

## 3. 修正方針（確定）

`_shared-context.md §2` を正本とする。要点の設計判断:

### 判断 D-1: 正規化を shared 純関数で行う（builder ローカル関数にしない）
- 理由: source の view 値ドメインは shared（`TagSource` / `TagSourceZ`）が所有。正規化も同層に置くことで一覧・詳細・将来の consumer 全てが再利用でき、`builder.ts` 357/429 の重複を 1 関数に集約できる。
- 代替（builder 内 inline 三項）は重複（357/429）が残り DRY 違反。不採用。

### 判断 D-2: `TagSource` union を 3 値のまま拡張しない
- 理由: `'seed'` を union に加えると `TagSource` を使う全箇所（型・表示分岐）にブラスト半径が広がる。seed は内部メタで UI 未表示（`TagPill` は label/category のみ使用）。`'manual'` へ丸めても実害なし。ブラスト半径最小を優先。
- WEEKGRD-02 準拠: 純粋関数ガードは例外を投げず無効値を安全値（`'manual'`）へ返す。

### 判断 D-3: zod は `.catch("manual")`（`.default` ではない）
- 理由: `.catch` は parse 失敗時にフォールバック、`.default` は undefined 時のみ。source は必ず値が来るため `.catch` が適切。層 1（正規化）で既に正規値になるため `.catch` は到達しない最終防壁。

### 判断 D-4: Lane B は `reloadKey` インクリメント方式
- 理由: 同一 `memberId` で再 fetch するには依存配列に変化を与える必要がある。`reloadKey` state を依存に加える方式は React 標準で副作用が局所。error boundary 再throw 方式（無限ループ誘発リスク）は不採用。

## 4. 状態所有権（Facade/Store/UI 境界）

| 状態 | 所有者 | 備考 |
|------|--------|------|
| `member_tags.source` 値ドメイン正規化 | `packages/shared`（`normalizeTagSource` / `TagSourceZ`） | view 構築の前段 |
| `AdminMemberDetailView` object 組み立て | `apps/api`（`builder.ts`） | normalizeTagSource を呼ぶ consumer |
| ドロワーの fetch lifecycle（`data`/`error`/`reloadKey`） | `apps/web`（`MemberDrawer`） | 子（`MemberDrawerBody`/`MemberTagsEditor`）へ非伝播 |

混在なし（shared=値正規化、api=view 構築、web=UI 回復で責務分離）。

## 5. API 契約（不変の確認）

- `GET /api/admin/members/:id` のレスポンス shape（`AdminMemberDetailView`）は不変。`tags[].source` は引き続き `"rule"|"ai"|"manual"` のいずれか（正規化後）。これは**契約強化**であり破壊ではない（従来 strict で 500 だったケースが 200 に回復）。
- endpoint surface・HTTP method・path・一覧 API は不変（不変条件 #1）。

## 6. 既存コンポーネント再利用（FB-SDK-07-1）

- Lane B の「再試行」ボタンは既存 `Button`（`apps/web/src/components/ui/Button`・`MemberDrawer.tsx:23` で既に import 済み）を `variant="danger"` `size="sm"` で再利用。新規 UI primitive ゼロ。
- error 表示は既存 `role="alert"` + `--ubm-color-danger` トークンを踏襲。

## 7. リスクと緩和

| リスク | 緩和 |
|--------|------|
| `.catch("manual")` が他の `TagSourceZ` 利用（`identity.ts:68`）の意味を変える | 出力 union 不変・失敗時のみフォールバック。`identity` の正常データは既知値のみ＝挙動不変。Phase 6 で identity 系回帰を確認 |
| `normalizeTagSource` 導入で builder の型推論崩れ | 戻り値 `TagSource` で `MemberProfile.tags[].source` 型に一致。typecheck で担保 |
| Lane B の `reloadKey` 追加で既存 drawer テスト（tags/inlineCreate）に影響 | 依存配列追加のみで初回挙動不変。既存 spec を回帰実行で確認 |

## 8. 参照仕様（更新有無）

`_shared-context.md §7` を正本。API schema は契約不変のため更新なし（Phase 12 で source 値ドメイン注記の要否のみ判定）。
