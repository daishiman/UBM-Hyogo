# Implementation Guide — issue-1198 admin-audit 旧テーブル系 dead CSS 削除

- 区分: 実装完了（NON_VISUAL / implementation_mode: new / **implemented_local_evidence_captured**）
- workflow: `docs/30-workflows/completed-tasks/issue-1198-admin-audit-dead-table-css-cleanup/`
- issue: #1198（CLOSED・2026-06-12T05:59:53Z）/ 本仕様書は CLOSED のまま現行コードへ再スコープ（reopen しない・`Refs #1198` のみ）
- 対象ファイル: `apps/web/src/styles/globals.css`（3 ブロック削除のみ）
- 状態: spec backbone（Phase 1-3）+ Phase 4-13 specs 完成。**local実装は完了済み**（commit / PR も user-gated）

---

## Part 1（やさしい説明 / 中学生レベル）

### 背景（なぜ必要か）

このタスクが必要な理由は、**もう誰も使っていない「古い飾りつけのルール」がプログラムの中に置きっぱなしになっている**からです。

たとえば、教室の壁に去年の時間割が貼られたまま、今年の新しい時間割も別の場所に貼られている状況を想像してください。今年の時間割さえ見れば授業はちゃんと受けられます。でも古い時間割が残っていると、初めて教室に来た人は「どっちが本物なの？」「これも見ないといけないの？」と迷ってしまいます。実際にはもう使われていない、ただの紙きれなのに、残っているだけで混乱の元になります。

今回のプログラムでも同じことが起きています。管理画面の「監査ログ（だれが・いつ・なにをしたかの記録）」のページは、以前は **表（テーブル）の形**で記録を並べていました。その後、見やすくするために **カードの形**に作り直しました。ところが、表の形のときに使っていた「飾りつけのルール（CSS）」が 3 つ、消されずに残ってしまいました。「CSS」とは、画面の色や並び方や大きさを決める「飾りつけの設計図」のことです。

この 3 つの古いルールは、もうどの画面からも呼ばれていません。専門用語では、こういう「置いてあるけど誰も使っていないコード」を **dead code（デッドコード＝死んだコード）** と呼びます。

### 何をするか（要約）

やることはシンプルです。**もう使っていない古い飾りつけのルール 3 つを消すだけ**です。新しく何かを足すことは一切ありません。

- 消すのは 3 つだけ: `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`。
- 今のカード画面で使っている飾りつけ（`.admin-audit-guide` / `.admin-audit-card` / `.admin-audit-timeline` / `.admin-audit-applied-filters`）は **そのまま残します**。
- `.tbl` は現行コードで 0 件の stale 前提だったため、追加・復活させません。

これによって、次にこのコードを読む人が「この表の飾りつけは今も使われているのかな？」と調べる手間がなくなります。「使っているものだけを置いておく」というのは、机の上を片づけて必要な道具だけ残すのと同じ考え方です。

### 実装ステップ（やさしい順番）

1. まず「消そうとしている 3 つのルールが、本当にどこからも呼ばれていないか」を検索（grep）で確認します。0 件なら安心して消せます。
2. 確認できたら、その 3 つのルールだけを `globals.css` というファイルから消します。すぐ後ろにある今のカード用のルール（`.admin-audit-guide`）は**絶対に消しません**。
3. 型チェック・lint（書き方チェック）・トークン検証・テストを動かして、何も壊れていないことを確かめます。
4. 最後に「本当に 3 つだけが消えて、他は残っているか」をもう一度検索で確かめます。

### 既知の注意点

- これは画面（見た目）を一切変えない作業です。消すルールはもう誰も使っていない（=画面に適用されていない）ので、消しても見た目は 1px も変わりません。だからスクリーンショットは不要です。
- 行番号（何行目にあるか）は、他の人がファイルを編集するたびにズレます。だから「何行目」ではなく「ルールの名前（セレクタ名）」を目印にして消します。元の issue には「1602〜1618 行目」と書いてありますが、今は 2023〜2039 行目に移動しているので、行番号は当てにしません。
- すぐ後ろの `.admin-audit-guide` から先は今のカード画面で使っているので、ここを巻き込んで消すと画面が崩れます。範囲を厳密に区切ることが一番大事です。

---

## Part 2（開発者向け詳細）

### 背景

`/admin/audit` 監査ログ画面は #1202（コミット `ec29ee732`）でテーブル型からカード型タイムラインへ移行した。この移行で旧テーブル系の CSS 3 ブロック（`.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`）が **参照ゼロ**になったが削除されず、`apps/web/src/styles/globals.css` に dead code として残置している。本タスクはこの 3 ブロックを削除し、`/admin/audit` の CSS を現行カード UI に必要な定義のみへ縮約する。コード変更は本サイクルで完了した。後続確認者が同じ検証を再実行できる粒度で手順を残す。

発見経路は親 workflow `admin-audit-log-ux-clarity-and-reduce-error-fix` の Phase 8 OOS-4。当時の grep が CSS 定義ファイル（`globals.css`）自身のヒットを「参照あり」と誤カウントし「残置（参照あり）」へ誤分類したため削除が見送られた。`.tsx`/`.ts` 限定の再 grep で参照 0 件が独立検証で確定したため、削除可へ確定した。

### 要約

- delete（dead CSS 3 ブロック）: `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`。
- keep（現行カード UI・無変更）: `.admin-audit-guide` / `.admin-audit-glossary` / `.admin-audit-applied-filters` / `.admin-audit-timeline` / `.admin-audit-card`。
- stale baseline: `.tbl` は現行コードに存在しないため、復活させず 0 件を維持する。
- diff は `globals.css` の 3 ブロック削除（純減 ≒ 17 行）のみ。追加 0 行・テスト無変更・apps/api / D1 / Google Form 無変更。

### 削除対象 CSS（逐語）

shared-context.md §1 の逐語スナップショットと同一。この 3 ブロック（先頭 `.admin-audit-filter {` から `.admin-audit-table` の `}` まで）**のみ**を削除する。

```css
  .admin-audit-filter {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    align-items: end;
    gap: var(--ubm-space-3);
    margin-bottom: 20px;
  }

  .admin-audit-table-scroll {
    overflow-x: auto;
  }

  .admin-audit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
```

- 現行位置（2026-06-13 実測）: `.admin-audit-filter` = 行 2023 / `.admin-audit-table-scroll` = 行 2031 / `.admin-audit-table` = 行 2035・終端 `}` = 行 2039。
- 直前の `.schema-field-card.diff-removed { ... }` と直後の `.admin-audit-guide { ... }` は **無変更**。

### 削除手順

1. **削除前 grep（AC-1）**: `grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"` を実行し 0 件を証跡化する（唯一の既知ヒット `admin-audit-filtered.png` は Playwright スクショ名で CSS 参照ではない）。
2. **位置の再取得**: `grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css` で現在の行を確認する（行番号は stale 前提で都度取得）。
3. **削除**: Edit ツールの厳密一致で、上記「削除対象 CSS（逐語）」を `old_string` に使い、3 ブロック（`.admin-audit-filter {` の行から `.admin-audit-table` ブロックの閉じ `}` まで）を削除する。`.schema-field-card.diff-removed` ブロックと `.admin-audit-guide` ブロックが空行 1 行で隣接する整形を保つ。行範囲指定の `sed` 等は行ズレで誤削除リスクがあるため避ける。
4. **削除後 grep（AC-2/AC-3）**: 旧 3 セレクタ 0 件 / 新規カード系ヒット維持 / `.tbl` 0 件維持を確認する。

### 検証コマンド

shared-context.md §4 と同一（正本）。

```bash
# AC-1: 削除前ゼロ参照証跡
grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"

# AC-2/AC-3: 削除後の定義消失 + 保持確認
grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css     # 0 件期待
grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" apps/web/src/styles/globals.css  # ヒット維持期待
rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"          # 0 件期待（現行ベースライン）

# AC-4: 静的検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens

# AC-5: 監査ログ focused Vitest 回帰確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx

# AC-6: 差分純減確認
git diff --stat apps/web/src/styles/globals.css
```

### エラーハンドリング / エッジケース

- **隣接ブロック巻き込み**: 削除範囲を `.admin-audit-table` の閉じ `}`（行 2039）までに厳密限定する。直後の `.admin-audit-guide` 以降を 1 行でも巻き込むと現行カード UI が崩れる。削除後 grep（AC-2/AC-3）で `.admin-audit-guide` のヒット維持を必ず確認する。
- **`.tbl` stale 前提の再導入**: `.tbl` は現行コードに存在しない。対象外として触らず、削除後 rg 0 件維持を確認する。
- **行番号アンカー誤削除**: issue 記載の「1602-1618」は stale。セレクタ名で `grep -n` 再取得してから削除する。
- **Playwright スクショ名の誤認**: `admin-audit-filtered.png`（`apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts`）はスクリーンショット出力ファイル名であり CSS クラスセレクタ参照ではない。`--include="*.tsx" --include="*.ts"` で `.png` 文字列を含む `.spec.ts` がヒットしても CSS 参照ではないと判別する。
- **OKLch トークン逸脱**: 本タスクは削除のみで CSS 追加なし＝HEX 直書き混入リスク 0。`verify:tokens` で 0 違反を確認する。

### 既知制限

- 監査ログ total 件数表示（baseline OOS-1）は API が cursor pagination で total を返さないため apps/api 変更が必要であり、本タスクのスコープ外（別 Issue）。
- 監査ログ CSV/JSON エクスポート（baseline OOS-2）は新規 endpoint または client 大規模機能が必要であり、本タスクのスコープ外（別 Issue）。
- 監査ログ focused Vitest（`AuditLogPanel.component` / `AuditLogCard`）は dead CSS 非依存のため **テスト変更不要**・回帰確認のみ。
- 本仕様書は **implemented_local_evidence_captured**。local実装・検証は実行済み。commit / push / PR は user 明示承認後にのみ実行する。

---

## 視覚証跡

UI/UX 変更なし（dead CSS は未適用で描画不変）のため Phase 11 スクリーンショット不要。代替証跡は `phase-10-final-review.md` と `outputs/phase-11/manual-test-result.md`。

- `outputs/phase-11/manual-test-result.md`: grep gate（AC-1/AC-2/AC-3）+ 監査ログ focused Vitest 2 本（AC-5）+ typecheck / lint / verify:tokens（AC-4）の実測証跡。
- `phase-10-final-review.md`: 最終レビュー・削除範囲とアンカー方式の確定。
