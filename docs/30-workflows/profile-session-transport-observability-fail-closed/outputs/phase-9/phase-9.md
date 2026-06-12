# Phase 9: 品質保証

## メタ情報
正本: `outputs/phase-9/phase-9.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-6/phase-6.md`（追加ケース）/ `../phase-7/phase-7.md`（カバレッジ）/ `../phase-8/phase-8.md`（リファクタ）/ `../../_shared-context.md`（§8 実行コマンド / §9 DoD）

## 目的
実装フェーズで満たすべき品質ゲートを一括コマンド + 期待結果として固定する。type / lint / focused test に加え、本タスク固有の 3 ゲート（**localhost 焼き込み 0 / apps/api 非接触 / diagnose script 構文 health**）を機械検証として定義する。

NON_VISUAL タスクのため **design-token gate（`verify-design-tokens`）は色変更なしのため対象外**。OKLch トークン正本（`tokens.css`）に一切触れず、UI / 色 / HEX を変更しない（本タスクは fetch・transport・ログ層のみ）。

---

## 1. 品質保証コマンドと期待結果

| # | コマンド | 期待結果 | 根拠 / DoD |
|---|----------|----------|------------|
| Q1 | `mise exec -- pnpm typecheck` | exit 0（型エラー 0） | DoD: typecheck green。後方互換シグネチャの型整合 |
| Q2 | `mise exec -- pnpm lint` | exit 0（lint 違反 0） | DoD: lint green |
| Q3 | focused vitest（下記 §2 の 5 spec 一括） | 全 PASS・既存回帰ゼロ（T1-T5 + P6-1〜P6-16） | DoD: focused vitest green・回帰ゼロ（AC-8） |
| Q4 | `bash scripts/verify-no-localhost-bake.sh --src-only` | exit 0（src 本体に新規 `127.0.0.1`/`localhost`/`8787`/`8888` リテラル 0） | DoD: localhost 焼き込み 0（不変条件 #4 / 安全条件 R2） |
| Q5 | `git diff --stat -- apps/api` | **出力が空**（apps/api 差分 0 = API surface 非接触） | DoD: apps/api 非接触（不変条件 #1 / AC 既存 endpoint surface 不変） |
| Q6 | `bash -n scripts/diagnose-profile-session.sh` | exit 0（シェル構文エラー 0） | F6 の diagnose echo 追加が壊れていないこと |
| Q7（NON_VISUAL 宣言） | design-token gate（`verify-design-tokens`） | **対象外**（色変更なし・実行不要） | NON_VISUAL。tokens.css 非接触・HEX 0 |

---

## 2. focused vitest（Q3）の実行コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
```

期待: 5 ファイルすべて PASS。Phase 6 で定義した追加ケース（P6-1〜P6-16）が GREEN、Phase 6 §3 の据え置き回帰ケースが期待値不変のまま GREEN。

---

## 3. ゲート判定の見方（失敗時の切り分け）

| ゲート | 失敗時の典型原因 | 一次対応 |
|--------|------------------|----------|
| Q1 typecheck | optional メタ追加で `FetchAuthedError` 呼出元の型不整合 / 共通メタ型 alias の参照漏れ | 後方互換 optional であることを確認。第3引数 `meta?` の型を点検 |
| Q2 lint | unused import（`describeTransport` 未使用 / `ApiTransportError` 未 export 利用） | `pnpm lint --fix` → 残違反を手修正 |
| Q3 vitest | 既存ケースの期待値が変わった（回帰）/ メタキーが過剰出力 | Phase 6 §3 据え置き表と照合。条件付き spread の有無を点検 |
| Q4 localhost-bake | `describeTransport` で host を新規リテラルで組み立てた | `new URL(既存定数).host` 抽出に直す（phase-8 RF-2） |
| Q5 apps/api diff | 誤って apps/api を編集した | 当該変更を revert。本タスクは apps/web + scripts のみ |
| Q6 diagnose `bash -n` | echo 追加で引用符 / heredoc の閉じ忘れ | 追加した echo 行の構文を点検（read-only・冪等を維持） |

---

## 4. spec 検証ゲート（仕様書自体の health）

実装着手前に仕様書群（Phase 1-13）の構造健全性を確認する。

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/profile-session-transport-observability-fail-closed
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/profile-session-transport-observability-fail-closed
```

期待: 各 phase 正本が必須見出し（`# Phase N` / `## メタ情報` / `## 目的` / `## 統合テスト連携` / `## 参照資料` / `## 成果物` / `## 完了条件`）を備え、構造検証を通過する。

---

## 統合テスト連携
本 Phase の Q1〜Q6 は実装フェーズの合格ゲートであり、Phase 6 のテスト資産・Phase 7 のカバレッジ・Phase 8 のリファクタ結果をまとめて検証する。実機統合（staging `/me` の真因 410/5xx/transport 確定 = `baseHost` が localhost でないことの証明）は本 Phase のローカルゲートでは確認できないため、Phase 11 の `wrangler tail`（`bash scripts/cf.sh` 経由 / user-gated）手順に委譲する。確定後の本格修正は Phase 12 で未タスク化する（CONST_007 例外①）。

## 参照資料
- `../../_shared-context.md`（SSOT §8 実行コマンド / §9 DoD / §6 不変条件）
- `../phase-6/phase-6.md`（追加ケース）/ `../phase-7/phase-7.md`（カバレッジ）/ `../phase-8/phase-8.md`（リファクタ・rollback）
- 実スクリプト: `scripts/verify-no-localhost-bake.sh` / `scripts/diagnose-profile-session.sh`

## 成果物
- `outputs/phase-9/phase-9.md`

## 完了条件
- [x] type / lint / focused test の一括コマンドと期待結果を表で固定した。
- [x] `verify-no-localhost-bake.sh --src-only` green を品質ゲートに含めた。
- [x] `git diff --stat -- apps/api` が空（API 非接触）を品質ゲートに含めた。
- [x] `bash -n scripts/diagnose-profile-session.sh` を品質ゲートに含めた。
- [x] NON_VISUAL のため design-token gate は対象外であると明記した。
- [x] 各ゲート失敗時の切り分けと spec 検証ゲートを記述した。
