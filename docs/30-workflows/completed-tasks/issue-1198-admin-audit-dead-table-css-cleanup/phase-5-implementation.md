# Phase 5: 実装 — issue-1198 admin-audit dead table CSS cleanup

> 本サイクルで実装済み。後続確認者が再実行できる粒度で削除手順と検証結果を記述する。

## 1. ファイルパス一覧 [Feedback RT-03]

| 区分 | パス | 内容 |
| --- | --- | --- |
| **修正** | `apps/web/src/styles/globals.css` | 旧 audit テーブル系 dead CSS 3 ブロックの削除（行削除のみ） |
| **新規作成** | なし | — |
| **削除（ファイル）** | なし | CSS ブロック削除であってファイル削除ではない |

唯一の変更ファイルは `apps/web/src/styles/globals.css`。他ファイル（`apps/api` / D1 / Google Form / `.tsx` / `.ts` / 他 CSS）は一切触れない。

## 2. 削除対象（逐語スナップショット・shared-context §1 と同値）

下記 3 ブロックを削除する。先頭 `.admin-audit-filter {` から `.admin-audit-table` の閉じ `}` まで（間の 2 空行を含む）。

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

- 現行位置（2026-06-13 実測・**stale 前提**）: 行 2023-2039。`.admin-audit-filter` 2023 / `.admin-audit-table-scroll` 2031 / `.admin-audit-table` 2035 / 終端 `}` 2039。
- ⚠️ 行番号はアンカーにしない。実装時は必ず `grep -n` で現在位置を取り直し、**セレクタ名**で範囲を確定する。

## 3. 保持する境界（無変更）

| 位置 | ブロック | 扱い |
| --- | --- | --- |
| **直前** | `.schema-field-card.diff-removed { ... }` | 無変更（保持） |
| **直後** | `.admin-audit-guide { ... }` 以降（現行カード UI 使用中） | 無変更（保持） |

削除後は `.schema-field-card.diff-removed` ブロックと `.admin-audit-guide` ブロックが**空行 1 行で隣接**する整形を保つ（多重空行を残さない）。

## 4. 削除手順（実行済み・再検証用）

### Step 1: 削除前ゼロ参照証跡の取得（AC-1）

```bash
grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app \
  --include="*.tsx" --include="*.ts"
```

- 期待: **0 行**。0 行であることを証跡化してから次に進む。
- 0 行でない場合は削除を**中止**し参照箇所を再調査（dead 判定が崩れる）。

### Step 2: 現在位置の再取得（行ズレ対策）

```bash
grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" \
  apps/web/src/styles/globals.css
```

- ここで返る行番号で削除対象 3 ブロックの現在位置を確認する。

### Step 3: 削除（Edit ツール厳密一致を推奨）

- Edit ツールの `old_string` に §2 の逐語スナップショット（先頭 `.admin-audit-filter {` から `.admin-audit-table` の `}` まで、間の空行込み）をそのまま使い、`new_string` を空または不要な多重空行が出ない形にして 1 回の Edit で 3 ブロックを削除する。
- 行範囲指定の `sed` は行ズレで隣接ブロック（`.schema-field-card.diff-removed` / `.admin-audit-guide`）を巻き込む誤削除リスクがあるため**避ける**。
- 削除後、`.schema-field-card.diff-removed` の直後に `.admin-audit-guide` が空行 1 行で続く整形に整える。

### Step 4: 削除後 grep 検証（AC-2 / AC-3）

```bash
# AC-2: 旧 3 セレクタが globals.css から消えたこと（0 件期待）
grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" \
  apps/web/src/styles/globals.css

# AC-3: 新規カード系 CSS が保持されていること（ヒット維持期待）
grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" \
  apps/web/src/styles/globals.css

# AC-3: .tbl は現行コードに存在しない stale 前提だったため、0 件維持を確認
rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"
```

## 5. 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `apps/web/src/styles/globals.css`（変更前） |
| 出力 | 同ファイル（旧 3 ブロックを純減した変更後） |
| 副作用 | **なし**。削除対象は未参照＝未適用 CSS のため、レンダリングツリーに 1px も影響しない（描画不変）。型・API・データフロー不変 |

## 6. ローカル実行・検証コマンド（shared-context §4）

```bash
# AC-4: 静的検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens

# AC-5: 監査ログ focused Vitest 回帰確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx

# AC-6: 差分が globals.css の純減のみであること
git diff --stat apps/web/src/styles/globals.css
```

- 期待: typecheck / lint / verify:tokens 全 PASS（HEX 0 違反）、focused Vitest 全 PASS、`git diff --stat` が `globals.css` の削除行のみ・追加 0。

## 完了条件

- [ ] 新規/修正/削除ファイルパス一覧を記載した（修正: globals.css のみ）[RT-03]
- [ ] 削除 3 ブロックの逐語スナップショットを記載した
- [ ] 保持する直前（`.schema-field-card.diff-removed`）・直後（`.admin-audit-guide`）境界を明記した
- [ ] grep → 位置取得 → Edit 削除 → grep 検証の手順を再検証可能な粒度で記述した
- [ ] 入力・出力・副作用（副作用なし）を定義した
- [ ] ローカル実行・検証コマンド（shared-context §4）を記載した
