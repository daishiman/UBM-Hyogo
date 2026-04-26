# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 6 (異常系検証) |
| 下流 | Phase 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 の AC × Phase 4 の verify suite × Phase 5 の実装 step × Phase 6 の異常系を 1 枚の matrix で対応付け、漏れと重複を排除する。AC-1〜AC-11 全件について「test ID / 実装 step / failure case ID / 検証コマンド」を 4 軸でトレースする。

## AC matrix

| AC | 内容 | Phase 4 verify | Phase 5 実装 step | Phase 6 failure case | 検証コマンド |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 5 repo の unit test pass | unit test 5 ファイル | Step 3〜6（5 repo 実装） | F-1, F-2, F-6 | `pnpm --filter apps/api test repository` |
| AC-2 | adminNotes が public/member view に混ざらない | type test + boundary test | Step 3 adminNotes.ts + 02a builder | A-4, A-7 | `tsc --noEmit __tests__/adminNotes.test.ts` |
| AC-3 | apps/web → repository ESLint error | ESLint test | Step 9 ESLint config | A-1 | `pnpm --filter apps/web lint` |
| AC-4 | apps/web → D1Database ESLint error | ESLint test | Step 9 ESLint config | A-2 | `pnpm --filter apps/web lint` |
| AC-5 | dep-cruiser 0 violation（02a/02b/02c 境界） | dep-cruiser CI | Step 8 dep-cruiser config | A-1, A-3 | `pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web` |
| AC-6 | auditLog.append が append-only | invariant test | Step 4 auditLog.ts | AP-1, AP-2 | `tsc --noEmit __tests__/auditLog.test.ts` |
| AC-7 | magicTokens.consume が single-use | invariant test | Step 6 magicTokens.ts | AP-3, AP-4, AP-5 | `pnpm test repository magicTokens.single-use` |
| AC-8 | syncJobs status 一方向遷移 | invariant test | Step 5 syncJobs.ts | AP-6, AP-7, AP-8 | `pnpm test repository syncJobs.transition` |
| AC-9 | in-memory D1 fixture loader 共通利用 | _setup.test.ts | Step 7 __tests__/_setup.ts | E-3 | `pnpm test repository _setup` |
| AC-10 | prototype 昇格防止 | seed scope test | Step 1 `__fixtures__/` を vitest 専用 | E-3 | `pnpm --filter apps/api build && grep -L 'data.jsx' apps/api/dist/*` |
| AC-11 | 02a/02b と相互 import ゼロ | dep-cruiser CI | Step 8 dep-cruiser config | A-3 | `pnpm depcruise apps/api` |

## 不変条件 × AC マトリクス

| 不変条件 | 関連 AC | このタスクでの守り方 |
| --- | --- | --- |
| #5 D1 boundary | AC-3, AC-4, AC-5, AC-11 | dep-cruiser + ESLint 二重防御 |
| #6 GAS prototype 昇格防止 | AC-10 | `__fixtures__/` を vitest 専用、build 除外 |
| #11 admin 本文編集禁止 | AC-2, AC-6 | adminNotes は別テーブル、auditLog は append-only |
| #12 adminNotes 分離 | AC-2 | 02a builder 戻り値型 + 引数受取（04c のみが渡す） |

## トレース完全性チェック

| Phase | 件数 | AC matrix トレース完了率 |
| --- | --- | --- |
| Phase 1 AC | 11 | 11/11 = 100% |
| Phase 4 verify suite | 6 unit + 6 boundary + 6 invariant + 3 type = 21 test target | 21/21 → 上記 11 AC に集約 |
| Phase 5 実装 step | 10 | 10/10 |
| Phase 6 failure case | 26 (F-6 + A-7 + AP-8 + E-5) | 26/26 |

漏れ確認:
- AC が verify suite を持たない: なし
- verify suite が AC を持たない: なし
- 実装 step が AC に紐付かない: なし
- failure case が verify suite で検証されない: なし

## boundary tooling のトレース

| 検証対象 | 検証手段 | 該当 AC | failure case |
| --- | --- | --- | --- |
| `apps/web` → `apps/api/src/repository/**` import | dep-cruiser `no-web-to-d1-repository` rule | AC-3, AC-5 | A-1 |
| `apps/web` → `D1Database` import | ESLint `no-restricted-imports` paths | AC-4 | A-2 |
| `02a/*.ts` → `02c/*.ts` import | dep-cruiser `repo-no-cross-domain-2a-to-2c` rule | AC-11 | A-3 |
| `02b/*.ts` → `02c/*.ts` import | dep-cruiser `repo-no-cross-domain-2b-to-2c` rule | AC-11 | A-3 |
| `02c/*.ts` → `02a/*.ts` / `02b/*.ts` import | dep-cruiser `repo-no-cross-domain-2c-to-2a/2b` rule | AC-11 | A-3 |

## 実行タスク

1. AC matrix 表を `outputs/phase-07/ac-matrix.md` に作成
2. 不変条件 × AC マトリクスを `outputs/phase-07/main.md` に作成
3. boundary tooling トレース表を main.md に作成
4. トレース完全性チェック表を main.md に作成
5. 漏れ件数を 0 にする（漏れがあれば Phase 1〜6 に戻る）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1 outputs/phase-01/main.md | AC 一覧 |
| 必須 | Phase 4 outputs/phase-04/verify-suite.md | verify 一覧 |
| 必須 | Phase 5 outputs/phase-05/runbook.md | 実装 step |
| 必須 | Phase 6 outputs/phase-06/failure-cases.md | failure case |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix から DRY 化候補（重複 verify）を抽出 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| 08a | repository contract test の入力 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| AC 漏れ | — | 11 AC が verify suite と 1:1 対応 |
| 不変条件 | #5 #6 #11 #12 | 4 件全てが少なくとも 1 AC を持つ |
| トレース | — | 漏れ件数 0 |
| boundary | #5 | dep-cruiser + ESLint 双方が AC に対応 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 表 | 7 | pending | 11 AC × 4 軸 |
| 2 | 不変条件 × AC | 7 | pending | 4 不変条件 |
| 3 | boundary tooling トレース | 7 | pending | 5 検証対象 |
| 4 | トレース完全性 | 7 | pending | 漏れ 0 |
| 5 | 漏れ修正 | 7 | pending | 条件を満たす場合は Phase 1〜6 戻し |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | 不変条件×AC + boundary トレース + トレース完全性 |
| ドキュメント | outputs/phase-07/ac-matrix.md | 11 AC × 4 軸の matrix |

## 完了条件

- [ ] AC matrix が 11 AC × 4 軸で完成
- [ ] 不変条件 4 件全てが AC にマップ
- [ ] boundary tooling トレースが 5 検証対象で完成
- [ ] トレース完全性が 100%

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-07/{main,ac-matrix}.md が配置済み
- [ ] 漏れ件数 0
- [ ] artifacts.json の Phase 7 を completed に更新

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ事項: AC matrix + boundary tooling トレース
- ブロック条件: 漏れ件数 > 0 なら Phase 1 / 4 / 5 / 6 に戻る
