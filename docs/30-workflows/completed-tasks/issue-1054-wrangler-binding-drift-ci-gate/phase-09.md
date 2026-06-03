# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-06-02 |
| 前 Phase | 8 (DRY 化・リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

実装サイクルで `scripts/verify-wrangler-binding-drift.mjs` / `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` / `.github/workflows/verify-wrangler-binding-drift.yml` / `package.json` / `deployment-cloudflare.md`（5 ファイル）が満たすべき品質ゲートを確定する。型・lint・回帰 spec・read-only 性の機械検証・CI workflow の既存規約整合を品質基準（QG-1〜QG-7）として固定する。本 Phase は spec_created のため実行は実装サイクルで行い、ここでは「合格条件・コマンド・期待出力」を正本化する。

## 品質ゲート QG-1〜QG-7

| # | ゲート | コマンド | 合格条件 |
| --- | --- | --- | --- |
| QG-1 | 型チェック | `mise exec -- pnpm typecheck` | error 0。`.mjs` は型注釈なしだが spec（`.spec.ts`）の import 型と `package.json` 追記が型崩れを起こさない |
| QG-2 | lint | `mise exec -- pnpm lint` | error 0。`.mjs` / `.spec.ts` が eslint 規約（unused import / no-restricted 系）に違反しない |
| QG-3 | 回帰 spec | `mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | TC-01〜TC-10 全 PASS（リポジトリルートから実行）。是正後 fixture で exit 0、型欠落 / 棚卸し欠落 / 棚卸し Kind 不一致 fixture で fail、applied:false を fail させない、env-prefixed 重複の 1 エントリ集約を回帰 guard |
| QG-4 | read-only grep gate（書き込み API 不使用） | `grep -nE "writeFileSync\|writeFile\|appendFile\|fetch\(\|child_process\|execSync\|spawn" scripts/verify-wrangler-binding-drift.mjs` | ヒット 0 件（AC-7 / D-7 の機械検証。ネットワーク・書き込み・サブプロセス起動の不在を確認） |
| QG-5 | gate 自走（現行 repo green） | `mise exec -- pnpm verify:wrangler-binding-drift` | AC-10 の棚卸し表 `MEMBER_PHOTOS` 追記後に exit 0。追記前は `INVENTORY_MISSING` で exit 1（gate が機能することの裏付け） |
| QG-6 | CI workflow 規約整合 | `.github/workflows/verify-wrangler-binding-drift.yml` を `verify-design-tokens.yml` と突合 | top-level `permissions: contents: read` を持つ / Node 24 セットアップ（`actions/setup-node` で `.mise.toml` または `node-version: 24`）/ トリガ path に `apps/api/wrangler.toml` `apps/api/src/env.ts` `**/deployment-cloudflare.md` を含む / pnpm 経由で `verify:wrangler-binding-drift` を実行する |
| QG-7 | 命名・配置規約 | 目視 + grep | スクリプト `scripts/verify-wrangler-binding-drift.mjs` / package script `verify:wrangler-binding-drift` / workflow `verify-wrangler-binding-drift.yml` / test `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（不変条件 #8 で `.spec.ts` のみ）/ ログ接頭辞 `[verify-wrangler-binding-drift]` が Phase 1 命名規則と一致 |

## read-only grep gate の詳細（QG-4・AC-7）

| 検出語 | 意味 | 期待 |
| --- | --- | --- |
| `writeFileSync` / `writeFile` / `appendFile` | ファイル書き込み | 0 件 |
| `fetch(` | ネットワークアクセス | 0 件 |
| `child_process` / `execSync` / `spawn` | サブプロセス起動 | 0 件 |

> gate スクリプトは `readFileSync` による解析と `console.*` / `process.exit` のみで完結する。上記いずれかが 1 件でもヒットすれば AC-7 違反として QG-4 を fail とする。

## CI workflow 規約チェック項目（QG-6・AC-9）

| 項目 | 期待値（既存 `verify-design-tokens.yml` 規約） |
| --- | --- |
| top-level permissions | `permissions: { contents: read }`（最小権限） |
| Node セットアップ | Node 24（`.mise.toml` / `node-version: 24`）+ pnpm セットアップ |
| トリガ | `pull_request`（および必要に応じ `push`）で `paths:` に 3 解析対象を指定 |
| 実行ステップ | `pnpm install` 後 `pnpm verify:wrangler-binding-drift` |
| job 名 | 既存 verify-* と整合する `verify` 系 job 名 |

## 実行タスク

1. 型チェック（QG-1）を品質ゲートに固定する。完了条件: `pnpm typecheck` の error 0 が合格条件として記述され、実装サイクルで実行する旨が明記されている。
2. lint（QG-2）を品質ゲートに固定する。完了条件: `pnpm lint` の error 0 が合格条件として記述されている。
3. 回帰 spec（QG-3）を品質ゲートに固定する。完了条件: `vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` で TC-01〜TC-10 全 PASS がリポジトリルート実行前提で記述されている。
4. read-only grep gate（QG-4）を定義する。完了条件: 書き込み / ネットワーク / サブプロセス語の grep ヒット 0 件が AC-7 の機械検証として記述されている。
5. gate 自走（QG-5）を定義する。完了条件: 棚卸し表追記後 exit 0 / 追記前 exit 1 の双方が記述されている。
6. CI workflow 規約整合（QG-6）を定義する。完了条件: permissions / Node24 / トリガ path / 実行ステップが `verify-design-tokens.yml` 規約と突合される項目として記述されている。
7. 命名・配置規約（QG-7）を確認項目化する。完了条件: 5 ファイル名・package script・ログ接頭辞が Phase 1 命名規則と一致することが記述されている。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-08.md | リファクタリング後に保持する read-only / exit code 契約 |
| 必須 | phase-07.md | AC / カバレッジマトリクス（QG が検証する AC の写像） |
| 必須 | scripts/verify-design-tokens.ts | read-only 解析の先例（QG-4 の grep 基準の参照元） |
| 必須 | .github/workflows/verify-design-tokens.yml | CI workflow 規約（QG-6 の突合対象） |
| 必須 | vitest.config.ts | test glob `scripts/**/*.spec.ts`（QG-3 の対象範囲） |
| 必須 | CLAUDE.md | mise exec 経由実行 / 不変条件 #5 #8 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質ゲート QG-1〜QG-7（コマンド / 合格条件 / read-only grep / CI 規約）の主成果物 |
| メタ | artifacts.json | Phase 9 状態（spec_created） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | RF-7（CLI ガード）後の read-only 維持を QG-4 grep gate で検証する |
| Phase 10 | QG-1〜QG-7 の合否を最終レビューの GO/NO-GO 判定材料に渡す |
| Phase 11 | QG-5（gate 自走 exit 0/1）を CLI smoke の期待値に渡す |

## 完了条件

- [ ] 型チェック（QG-1）の合格条件 error 0 が固定されている
- [ ] lint（QG-2）の合格条件 error 0 が固定されている
- [ ] 回帰 spec（QG-3）が TC-01〜TC-10 全 PASS / ルート実行前提で固定されている
- [ ] read-only grep gate（QG-4）が書き込み・ネットワーク・サブプロセス語 0 件として定義されている
- [ ] gate 自走（QG-5）が棚卸し追記後 exit 0 / 追記前 exit 1 で定義されている
- [ ] CI workflow 規約整合（QG-6）が permissions / Node24 / トリガ path / 実行ステップで定義されている
- [ ] 命名・配置規約（QG-7）が Phase 1 命名規則と一致確認項目として定義されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が品質ゲートとして `spec_created` で記述されている
- 成果物 `outputs/phase-09/main.md` が配置済み
- QG-4 が AC-7（read-only）の機械検証として定義されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QG-1〜QG-7 と各合格条件・実行コマンド
  - QG-4（read-only grep）/ QG-6（CI 規約）の合否が AC-7 / AC-9 の最終確認に直結する
  - QG-5 の exit 0/1 期待値を Phase 11 CLI smoke へ渡す
- ブロック条件:
  - QG-3 の TC が 1 件でも fail
  - QG-4 で書き込み / ネットワーク / サブプロセス語がヒット（read-only 違反）
