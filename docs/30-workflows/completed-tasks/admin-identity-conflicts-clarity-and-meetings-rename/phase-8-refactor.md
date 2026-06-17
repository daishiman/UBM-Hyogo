# Phase 8 — リファクタリング（重複 / ドリフト削減）

## 目的

文言・ラベルのハードコード重複を排し、用語・ロール名を glossary / 定数へ集約することでドリフト（page と Row で表現が食い違う等）を防ぐ。seed の helper はあえてローカル分離する意図を記録し、共有 module 汚染を回避する。実装は Phase 4-5 で行うため、本 Phase は**リファクタ方針の確定**のみ（`対象 / Before / After / 理由` テーブル形式・FB-RT-03）。

## 成果物

- リファクタ対象表（対象 / Before / After / 理由）。
- 意図的に分離する箇所（seed helper）の記録。

## リファクタ表

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `matchedFields` 日本語化 | Row 内で `name`→`氏名` を if/inline マッピング | `matchedFieldLabel(field)`（glossary 経由）を Row から呼ぶ | 表示の最終段に変換を一元化。未登録 fallback も glossary に集約（[§5.5](./shared-context.md)） |
| source/target ロールラベル | Row 内に `新しい登録` / `まとめ先（以前の登録）` をハードコード | glossary `RECORD_ROLE_LABELS.source` / `.target` を参照 | 同一文言の二重定義を避け、page/Row 間ドリフトを防止（[§5.3 / phase-2](./phase-2-design.md)） |
| Guide の 3 点説明 | page.tsx 内に直書きの説明テキスト | `IdentityConflictGuide.tsx`（[§5.4](./shared-context.md)）に集約・page は配置のみ | 説明文の単一責務化。文言変更時の差し替え点を 1 箇所に |
| アナウンス文言 | Row/page 内に散在する成功文言 | `identityConflictAnnouncements.ts`（[§5.6](./shared-context.md)）に集約（既存ファイルの文言更新） | aria-live 文言の SSOT 維持。Row の toast とアナウンスの意味整合 |
| 内部 conflictId 表示 | `conflict: {conflictId}` を一覧に直書き | 一覧からは除去し、`照合キー: {conflictId}` を `title`/aria 補助へ退避 | 非エンジニアに無意味な内部 ID を主表示から排除（[§5.3 / 真因](./phase-1-requirements.md)） |
| サイドバー label | `shell-config.ts` に英語混じり label 直書き | label のみ日本語へ（id/href/icon 不変） | nav 表示名と機能の整合。安定キーは不変でテスト互換維持（[§5.1](./shared-context.md)） |

## 意図的に分離する箇所（共有 module 汚染回避）

| 箇所 | 方針 | 理由 |
| --- | --- | --- |
| seed の `sqlString` / `sqlJson` / `buildInsert` 等の helper | `apps/api/src/testing/identity-conflicts/build-seed-sql.ts` に**ローカル定義**（test-accounts の同名 helper を import しない） | test-accounts の seed helper と概念は重複するが、共有 module へ昇格すると両 seed の独立改修が結合してしまう。[shared-context §6.1 注記](./shared-context.md)（既存 test-accounts を変更しない分離方針）を尊重し、意図的に再実装する。将来 3 件目の seed が現れたら共通化を別タスクで検討 |
| catalog データ | identity-conflicts 専用 catalog を新設（test-accounts catalog を拡張しない） | ユーザー確定事項「専用 staging シードを新規作成」（[§2](./shared-context.md)）。共有 catalog 拡張は明示的に不採用 |

> 上記分離は「DRY より境界の独立性を優先する」意図的判断。リファクタで共通化してはならない箇所として記録する（後続レビューでの誤った共通化提案を防止）。

## やらないこと（スコープ防衛）

- state machine（idle/merge-confirm/merge-final/dismiss）の再設計は行わない（文言変更のみ・[phase-2 state ownership](./phase-2-design.md)）。
- API/repository/detector への抽出・移動は行わない（不変・AC-8）。
- 既存 test-accounts seed の helper 共通化は行わない（上表の通り意図的分離）。

## 完了条件

- [ ] 文言・ロールラベルを glossary / 定数へ集約する方針を表で確定した。
- [ ] seed helper をローカル分離する意図と理由を記録した。
- [ ] 共通化してはならない箇所（境界独立性優先）を明示した。
