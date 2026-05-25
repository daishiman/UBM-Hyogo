# [#92] [UT-31] monorepo 新規 package 追加時セットアップチェックリスト整備

## 概要

monorepo に新規 package を追加する際に、`test` script・`exports` フィールド・ESLint boundary の3点が未定義のまま後続 Wave まで放置されることで Phase 11 スモークテスト段階で手戻りが発生するパターンを根絶する。

## 目的

`task-specification-creator` スキルの Phase 2（設計）フェーズに「新規 package 追加チェックリスト」を公式に組み込み、設計段階で3点の不備を早期検出できるようにする。

## スコープ

### 含む

- `task-specification-creator` の Phase 2 設計テンプレートへの「新規 package 追加チェックリスト」セクションの追記
  - `"test"` script（`"test": "vitest run"` または `"test": "vitest"`）の明示
  - `package.json` の `exports` フィールドへの subpath 列挙
  - ESLint boundary ルールへの登録確認（`scripts/lint-boundaries.mjs` への新 package 追加）
- 上記3点を Phase 2 完了条件のチェックリストに追加
- 新規 package 追加時の手順サンプルを参照資料として整備（既存 `@ubm-hyogo/shared` / `@ubm-hyogo/integrations-google` の設定を規約の具体例として記録）

### 含まない

- 既存 package の `exports` フィールド・test script の一括改修（別タスク化）
- vitest / ESLint 自体のバージョンアップや設定変更
- CI パイプラインへの lint-boundaries 自動実行追加（別タスク化）

## 苦戦箇所・知見

**`test` script 未定義**: Phase 11 スモークテスト実行時、`pnpm --filter @ubm-hyogo/shared test` が「script not found」で失敗。

**subpath export の不完全さ**: `@ubm-hyogo/shared` の `exports` フィールドに subpath が未定義の状態で後続 Wave に引き渡されたため、import パスが非自明になった。

**ESLint boundary 未登録**: 新規 package を追加した際に `scripts/lint-boundaries.mjs` への登録を省略したため、境界違反が lint を通過してしまった。

## 完了条件

- [ ] `phase-template-core.md` の Phase 2 セクションに「新規 package 追加チェックリスト」が追記されており、以下の3項目がチェックリスト形式で明示されている
  - [ ] `"test"` script の存在確認（`"test": "vitest run"` または `"test": "vitest"`）
  - [ ] `package.json` の `exports` フィールドに全 subpath が列挙されていること
  - [ ] `scripts/lint-boundaries.mjs` への新 package 登録が完了していること
- [ ] `@ubm-hyogo/shared` / `@ubm-hyogo/integrations-google` の現在の package.json 設定が規約の具体例として参照資料に記録されている
- [ ] 変更後に `skill-fixture-runner` でスキル整合性チェックが通過している
- [ ] 次に新規 package を追加するタスクが本チェックリストを参照できる状態になっている

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-31 (monorepo-checklist) |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 組み込み先 | `.claude/skills/task-specification-creator/references/phase-template-core.md` |

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-core.md`
- `packages/shared/package.json`
- `packages/integrations/google/package.json`
- `scripts/lint-boundaries.mjs`
