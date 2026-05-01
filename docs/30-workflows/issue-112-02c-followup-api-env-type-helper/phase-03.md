# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | pending |

## 目的

Phase 2 で確定した `Env` interface 設計、binding 対応表、`ctx()` refactor 契約に対し、PASS / MINOR / MAJOR の判定を下し、代替案 3 件と比較して採用案の妥当性を確定する。不変条件 #5 / #1 との整合とリスク・対策を明文化し、Phase 4 タスク分解への gate を通す。

## レビュー観点

| 観点 | 判定基準 |
| --- | --- |
| PASS | 設計が AC-1〜7 を全て満たし、不変条件 #5 / #1 と整合し、代替案より優位 |
| MINOR | 軽微な改善余地あり（コメント文面 / 命名）。Phase 4 以降で吸収可 |
| MAJOR | 設計上のリスクあり。Phase 2 へ差し戻し |

## 代替案 3 件比較

### 採用案: 手動 `Env` interface + wrangler.toml コメント対応

| 項目 | 内容 |
| --- | --- |
| 概要 | `apps/api/src/env.ts` に `Env` を手動 export。各 field 直前に `// wrangler.toml <section> <key>` コメント |
| 価値 | 実装コスト最小、grep 容易、CI 追加不要 |
| コスト | wrangler.toml 変更時に手動同期が必要（漏れリスクあり） |
| 不変条件整合 | #5 boundary lint で gate 化、#1 schema 構造を持ち込まない |
| AC 充足度 | AC-1〜7 全充足 |
| 採否 | **採用** |

### 代替 1: `wrangler types` 自動生成導入

| 項目 | 内容 |
| --- | --- |
| 概要 | `wrangler types` コマンドで `worker-configuration.d.ts` を生成し、`Env` を自動同期 |
| 価値 | wrangler.toml 変更時の同期漏れリスクをゼロ化できる |
| コスト | (a) `wrangler types` を CI / pre-commit に組み込む追加工数、(b) 生成物のコミット運用 / .gitignore 方針確立、(c) コメント形式 binding 対応表が型生成物では表現しづらい、(d) small スケールタスクには過剰投資 |
| 不変条件整合 | #5 整合可だが、生成物が apps/web に流出しない gate 設計が別途必要 |
| AC 充足度 | AC-1〜7 充足可だが AC-2（コメント明示）は生成物に注釈を入れにくい |
| 採否 | **見送り**（scope と CI コスト理由。将来 binding が増えた時点で再検討） |

### 代替 2: 各タスク個別定義維持（現状放置）

| 項目 | 内容 |
| --- | --- |
| 概要 | `Env` 型は各タスク（03a / 04b / ...）が独自定義。本タスクで何もしない |
| 価値 | 短期的工数ゼロ |
| コスト | 型ドリフト確実発生、binding 追加時の改修ポイント分散、`ctx()` の暗黙契約継続、boundary lint gate 不可能 |
| 不変条件整合 | #5 が boundary lint で gate できず、`apps/web` 側で env 形を再定義されるリスク |
| AC 充足度 | AC-1 / AC-2 / AC-3 / AC-5 不充足 |
| 採否 | **却下** |

## 不変条件整合

| 不変条件 | 整合確認 | 担保箇所 |
| --- | --- | --- |
| #5 (D1 直接アクセスは apps/api に閉じる) | `Env` を `apps/api/src/env.ts` に閉じ、`apps/web → apps/api/src/env` import を boundary lint で error 化 | AC-5 / Phase 9 negative test |
| #1 (実フォーム schema をコードに固定しすぎない) | `Env` は binding 名と値型のみ。Forms schema 構造を持ち込まない | Phase 2「設計方針」#5 / 多角的チェック観点 |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| wrangler.toml に新 binding を追加したのに `Env` 更新を忘れる | (a) Phase 12 implementation-guide.md に「wrangler.toml 変更 → env.ts 同時更新」運用を明記、(b) deploy 前 `pnpm typecheck` が利用箇所で型エラーを出すことで間接検知、(c) 将来 binding 数が増えたら代替 1 (`wrangler types`) へ移行検討 |
| `apps/web` から `apps/api/src/env.ts` を import しても boundary lint がすり抜ける（false negative） | Phase 9 で negative test を追加し、`apps/api/src/env` を import するダミーコードで `pnpm lint` が exit non-zero になることを毎回確認。`scripts/lint-boundaries.mjs` の禁止トークンに `apps/api/src/env` を必要に応じ明示追加 |
| `ctx()` refactor で 02c 既存 unit test が破壊される | (a) `Pick<Env, "DB">` と構造的部分型で従来 fixture を継続受理、(b) `D1Db` alias を継続 export、(c) Phase 6 テスト戦略で 02c 全 test 実行を gate 化、(d) Phase 11 で test log を evidence 化 |
| 予約欄コメントが古くなり、実際の追加担当タスクと食い違う | Phase 12 で予約欄を「ガイド扱い」と明示。05a / 05b 実装時に予約欄を更新する責務を後続タスクに委譲 |
| `D1Db` ↔ `D1Database` の alias 経由型解決で `as unknown as D1Db` キャストが debt 化 | 短期的には許容（02c 互換のため）。中期的には `D1Db` 削除 → `D1Database` 直接利用への migration 計画を 09b production-deploy 時に再評価 |

## レビュー結論

**判定: PASS**

根拠:

1. **AC 充足**: 採用案は AC-1〜7 を全て満たし、Phase 2 で具体形が確定している。
2. **代替案優位性**: 代替 1 はコスト過剰で small スケールには不適、代替 2 は AC 多数不充足で却下。
3. **不変条件整合**: #5 / #1 とも明示的 gate（boundary lint / 型スコープ制限）で担保。
4. **リスク管理**: 5 件のリスクに対し全て対策を提示し、Phase 9 / 11 / 12 への引き渡し点が明確。
5. **後方互換**: `Pick<Env, "DB">` への refactor は構造的部分型で 02c 既存 test を破壊しない。

軽微な改善点（MINOR、Phase 4 以降で吸収可）:

- `D1Db` alias 削除 → `D1Database` 直接利用への migration ロードマップは本タスク scope 外だが Phase 12 「未タスク検出」で記録推奨。
- `FORM_ID` / `GOOGLE_FORM_ID`、`SHEET_ID` / `SHEETS_SPREADSHEET_ID` の重複は本タスク scope 外（03a で再評価）。Phase 12 で言及。

MAJOR は無し。Phase 4 タスク分解へ進行可。

## 完了条件

- 採用案 / 代替 1 / 代替 2 の比較表が記載されている
- 不変条件 #5 / #1 整合が確認されている
- リスク 5 件と対策が表で記載されている
- レビュー判定 (PASS) と根拠が明示されている
- `outputs/phase-03/main.md` にレビュー結論サマリが記載されている

## 成果物

- `outputs/phase-03/main.md`
