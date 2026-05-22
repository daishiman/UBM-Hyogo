# Phase 3 — 設計

## 3.1 ADR 構造（横断ルール + package 固有ルール の責務分離）

### 横断ルール（モノレポ共通・本タスクで強制）

- すべての test ファイルは `.spec.ts` / `.spec.tsx` を使用する
- `.test.ts` は禁止（vitest config の `{test,spec}` 二段階は followup-003 で `.spec` 単一に収斂）

### `packages/shared/ADR-test-suffix.md` 固有

- 分類軸（任意・将来導入時）: `*.unit.spec.ts` / `*.zod.spec.ts` / `*.db.spec.ts`
- 本タスクでは **prefix 種別を導入せず、単純 rename のみ実施**
- 理由: shared は薄い utility / schema 集合で、種別 prefix の判断材料が現時点で不足。将来必要に応じて別タスクで段階導入
- ADR 状態: Accepted。種別 prefix 導入は ADR の Non-goal として明記し、本タスクでは決定しない。

### `packages/integrations/ADR-test-suffix.md` 固有

- 分類軸（任意・将来導入時）: `*.contract.spec.ts` / `*.unit.spec.ts` / `*.mapper.spec.ts`
- 既に `auth.contract.test.ts` のように contract suffix 慣例が存在 → rename 後も `auth.contract.spec.ts` で保全
- 本タスクでは prefix 部分は既存慣例の温存のみ。新規 prefix 規約導入は行わない
- ADR 状態: Accepted。既存 contract 慣例の温存のみを決定し、unit/mapper prefix 導入は Non-goal として扱う。

## 3.2 rename 戦略

1. **`git mv` で 1 ファイルずつ rename**（履歴保全のため）
2. ファイル単位ではなく **`git mv old new` をシェルループで一括実行**するスクリプトを Phase 6 で生成（実行ログを Phase 11 evidence に保存）
3. 1 PR / 1 ブランチで完結。package 単位 commit に分けて 3 commit 構成:
   - commit A: `packages/shared/ADR-test-suffix.md` + shared 17 ファイル rename
   - commit B: `packages/integrations/ADR-test-suffix.md` + integrations 11 ファイル rename
   - commit C: rename-mapping.csv + Phase 11 evidence

## 3.3 commit 分割の根拠

- package owner / publish 境界の差は commit 単位の分離で表現
- 履歴上「package ごとにどう rename したか」が `git log packages/shared/` で追える
- PR は 1 本だが、revert 時は commit 単位で巻き戻し可能

## 3.4 vitest config の扱い

- 本タスクでは vitest.config.ts を変更しない
- `include: ["packages/**/src/**/*.{test,spec}.{ts,tsx}"]` は `.spec.ts` も既に拾うため rename 直後から動作
- `{test,spec}` → `spec` のみへの単一収斂は followup-003 で全 apps / packages / scripts 横断で実施

## 3.5 .gitattributes / 大文字小文字

macOS の case-insensitive FS 対策として、`git mv` 失敗時に `git mv -f` または 2 段階 rename（`x.test.ts → x.test.tmp → x.spec.ts`）にフォールバック。Phase 8 でエラーハンドリング詳細化。
