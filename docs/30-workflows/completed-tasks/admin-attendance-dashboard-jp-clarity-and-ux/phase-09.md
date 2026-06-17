# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 8（リファクタリング） |
| 下流 | Phase 10（最終レビュー / GO・NO-GO） |
| 状態 | spec_created |

## 目的

実装・リファクタ完了状態に対し、**型 / lint / build・focused vitest・line budget / link / mirror parity を一括判定**し、さらに本タスク固有の品質ゲートとして **(1) AC-5（OKLch トークン）/ AC-6（新規 primitive ゼロ）/ AC-7（apps/api・packages/shared diff ゼロ）の機械検証**、および **(2) 英語表記・エンジニア専門語の残存ゼロ（AC-1/AC-2/AC-3）を grep で 0 件確認する手順** を、具体コマンド付きで曖昧さなく定義する。文言日本語化タスクの品質は「画面表示に Before 文字列が残っていないこと」が中核ゲートのため、本 Phase で grep 検証手順を正本化する。

## 実行タスク

1. **型 / lint / build の一括判定方針**: `typecheck` / `lint` / `next build --webpack`（OpenNext 互換）のコマンドと PASS 条件を `outputs/phase-09/main.md` に定義する。
2. **focused vitest（attendance 配下限定）**: attendance feature テスト配下に限定した vitest 実行コマンドを定義する（メモリ既知の `--root=. --config=vitest.config.ts` フルパス指定）。
3. **line budget / link / mirror parity 判定**: docs / CSS の line budget・リンク健全性・mirror parity の判定方針を記す。
4. **AC-5 token-audit**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がゼロであることの grep コマンドと期待結果（0 件=PASS）、CI gate `verify-design-tokens`（`pnpm verify:tokens`）対応を `outputs/phase-09/token-audit.md` に定義する。新規 token 追加ゼロも確認する。
5. **AC-6 新規 primitive ゼロ確認**: `apps/web/src/components/` に新規ファイル追加が無いことの確認コマンドを定義する。
6. **AC-7 diff ゼロ確認**: `git diff --name-only` に `apps/api` / `packages/shared` が含まれないことの確認コマンドを定義する。
7. **AC-1/AC-2/AC-3 英語・専門語残存ゼロ grep**: 画面表示テキスト・aria-label から `PRIMARY` / `TREND` / `DETAIL` / `TOP10` / `ADMIN / DASHBOARD` / `3M` / `6M` / `1Y` / `CSV` / `セッション` / `ユニーク` / `トレンド` / `区画` / `帯` / `pt` が 0 件であることの grep コマンドと期待結果を `outputs/phase-09/token-audit.md` に定義する。

## 実行手順

### ステップ 1: 型 / lint / focused vitest / build の一括実行

```bash
# 1) 型チェック
mise exec -- pnpm typecheck
# 2) lint（boundary / deps / no-inline-style 等）
mise exec -- pnpm lint
# 3) focused vitest（attendance feature 配下に限定・フルパス指定が必須）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
# 4) production build（OpenNext 互換 = webpack 正本）
mise exec -- pnpm build
```

- PASS 条件: 1〜4 すべて exit 0。型エラー / lint 違反 / テスト FAIL / build エラーが 0 件。

### ステップ 2: AC-5 token-audit + 新規 token ゼロ

- `outputs/phase-09/token-audit.md` の grep コマンドを実行し、HEX / `bg-[#` / `text-[#` が attendance 配下で 0 件であることを確認する。
- CI gate `verify-design-tokens`（`pnpm verify:tokens`）をローカル実行し PASS（exit 0）を確認する。
- `tokens.css` への新規 `--ubm-*` トークン追加が 0 件であることを `git diff` で確認する（本タスクは文言変更主体で新規 token を要しない）。

### ステップ 3: AC-6 / AC-7 機械確認

- `apps/web/src/components/` に新規ファイル追加が無いこと（AC-6）、`git diff --name-only` に `apps/api` / `packages/shared` が含まれないこと（AC-7）を確認する。

### ステップ 4: AC-1/AC-2/AC-3 英語・専門語残存ゼロ grep（本タスク中核ゲート）

```bash
# 画面表示・aria-label に Before 系の英語/専門語が残っていないこと（0 件=PASS）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSVエクスポート|セッション|ユニーク|トレンド|区画|出席回数帯" \
  apps/web/src/features/admin/attendance \
  apps/web/app/\(admin\)/admin/dashboard/attendance \
  && echo "FAIL(残存あり)" || echo "PASS"
```

- ヒット時は「画面表示/aria-label（=要修正）」か「定数キー/型名（=不変で正・許容）」かを分類し、画面表示・aria-label のヒットが 0 件であることを確定する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC-5/6/7 の GATE 担保区分 |
| 必須 | outputs/phase-08/before-after.md | 単一化後の対象ファイル（grep / token-audit 対象） |
| 必須 | _shared-context.md §8 | ローカル検証コマンド正本 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | 品質ゲート判定パターン |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（AC-7 裏取り） |

### 実コード anchor / gate（参照のみ）

| 種別 | パス | 用途 |
| --- | --- | --- |
| gate 本体 | `scripts/verify-design-tokens.ts`（`forbidden-color-literal` / `hexRe`） | HEX literal 検査ロジック |
| gate workflow | `.github/workflows/verify-design-tokens.yml`（job `verify-design-tokens`） | CI 実行（`pnpm verify:tokens`） |
| npm script | `package.json` `verify:tokens` | ローカル gate 実行 |
| token 正本 | `apps/web/src/styles/tokens.css` | `var(--ubm-*)` 参照先・新規 token ゼロ確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | カバレッジ済み TC を focused vitest 一括判定で再実行 |
| Phase 8 | 単一化後の `globals.css` を token-audit 対象にする |
| Phase 10 | 品質保証 全 PASS（型/lint/build/token/diff/英語残存ゼロ）を GO/NO-GO の必須入力にする |
| Phase 11 | build PASS を screenshot 取得（user-gated）の前提にする |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | AC-5/6/7 の GATE 担保区分を機械検証へ接続 |
| Phase 8 | `outputs/phase-08/before-after.md` | 単一化後の globals.css / 残骸除去結果を token-audit・grep 対象にする |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 型整合 | — | `typecheck` exit 0。`formatDelta` の戻り型（string）が `pt`→`ポイント` 変更で不変 |
| lint 整合 | #9 / no-inline-style | `lint` exit 0。inline style / boundary 違反なし |
| build 整合 | apps/web env 不変条件 | `pnpm build`（OpenNext 互換 = webpack 正本）で build 成功 |
| OKLch トークン | AC-5 | HEX / `bg-[#` / `text-[#` が 0 件・`verify-design-tokens` PASS・新規 token ゼロ |
| 新規 primitive ゼロ | AC-6 | `apps/web/src/components/` 新規ファイル 0 件 |
| diff ゼロ | AC-7 | `apps/api` / `packages/shared` の diff 0 件 |
| 英語・専門語残存ゼロ | AC-1/AC-2/AC-3 | 画面表示・aria-label に Before 系英語/専門語が 0 件（定数キーは許容） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 型/lint/focused vitest/build 一括判定方針 | 9 | spec_created | main.md コマンド一覧 |
| 2 | line budget / link / mirror parity 判定 | 9 | spec_created | main.md |
| 3 | AC-5 token-audit（grep + gate + 新規 token ゼロ） | 9 | spec_created | token-audit.md |
| 4 | AC-6 新規 primitive ゼロ確認 | 9 | spec_created | token-audit.md |
| 5 | AC-7 diff ゼロ確認 | 9 | spec_created | token-audit.md |
| 6 | AC-1/AC-2/AC-3 英語・専門語残存ゼロ grep | 9 | spec_created | token-audit.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | line budget / link / mirror parity / 型 / lint / focused vitest / build 一括判定方針 + コマンド一覧 |
| ドキュメント | outputs/phase-09/token-audit.md | AC-5 token 監査（grep + gate + 新規 token ゼロ）/ AC-6 / AC-7 / AC-1〜3 英語残存ゼロ の機械検証手順 |
| メタ | artifacts.json | Phase 9 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-09/main.md` に typecheck / lint / focused vitest（対象限定）/ build のコマンドと PASS 条件が書かれている
- [ ] line budget / link / mirror parity の判定方針が記されている
- [ ] `outputs/phase-09/token-audit.md` に AC-5 の grep コマンド（HEX / `bg-[#` / `text-[#`）と期待結果（0 件=PASS）がある
- [ ] CI gate `verify-design-tokens`（`pnpm verify:tokens`）との対応と新規 token ゼロ確認が記されている
- [ ] 新規 CSS が `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` 経由であることのチェックリストがある
- [ ] AC-6（新規 primitive ゼロ）の確認コマンドがある
- [ ] AC-7（apps/api・packages/shared diff ゼロ）の確認コマンドがある
- [ ] AC-1/AC-2/AC-3（英語・専門語残存ゼロ）の grep コマンドと期待結果（0 件=PASS）がある

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-09/{main,token-audit}.md` が配置済み
- [ ] AC-5/6/7 と AC-1/2/3 が具体コマンド付きの機械検証手順として定義されている
- [ ] token-audit / 残存 grep の対象が `apps/web/src/features/admin/attendance` と route の `page.tsx` を含む
- [ ] artifacts.json の Phase 9 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 10（最終レビュー / GO・NO-GO）
- 引き継ぎ事項: 品質保証 全 PASS（型/lint/build/token/diff/英語残存ゼロ）/ token-audit 0 件 / 残存 grep 0 件
- ブロック条件: typecheck / lint / build / token-audit / 英語残存 grep のいずれかが FAIL の場合は Phase 5/8 に戻る
