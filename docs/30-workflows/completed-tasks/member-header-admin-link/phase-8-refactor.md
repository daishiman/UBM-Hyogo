# Phase 8 — Refactor

## 1. 過剰設計の排除

| 検討項目 | 採用 | 理由 |
|---------|------|------|
| `adminHref` を `authView.adminHref` から取る | NO | リテラル `/admin` で十分。間接化は型のみで合意済 |
| `isAdmin` を helper 関数に切り出す | NO | 1 箇所判定。inline `authView?.kind === "admin"` で可読性十分 |
| `MemberHeader` を Server / Client に分割 | NO | 既存通り Client island は `SignOutButton` のみ。Header 自体は server-renderable のまま維持 |
| `data-auth-state` の type union を export | NO | DOM 属性。テストでも文字列リテラルで比較 |
| `aria-label` を i18n key に分離 | NO | 既存 brand `aria-label="UBM 兵庫"` と同様、直書き継続（i18n 導入は別タスク） |

## 2. 重複削減

- `MemberHeader.tsx` の `<a href="/profile">`, `<a href="/members">` は既存通り維持（共通化しない）。3 リンクをループ化しても可読性低下するのみで利得なし

## 3. 削除候補

- なし（既存実装からの変更は追加のみ）

## 4. Refactor 後の差分サイズ目安

| ファイル | 追加行数目安 | 削除行数目安 |
|---------|-------------|-------------|
| `MemberHeader.tsx` | +12 | -1（関数シグネチャ変更） |
| `(member)/layout.tsx` | +2 | -1（async 化 + getAuthView 呼出） |
| `MemberHeader.spec.tsx` | +60 | 0（新規）or 既存差し替え |

## 5. 判定

過剰抽象化なし、削除不要、追加コードは仕様書 §1 の DoD に直結。Phase 9 へ進行可。
