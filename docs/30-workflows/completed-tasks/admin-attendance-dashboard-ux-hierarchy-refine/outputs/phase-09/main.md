# Phase 9 品質保証 — main

> 上流: Phase 8（リファクタ済み）。line budget / link / mirror parity / 型 / lint / build を一括判定する。AC-5/6/7 の機械検証は `token-audit.md` に分離。

## 1. ローカル検証コマンド一覧（一括判定）

| # | 検証 | コマンド | PASS 条件 |
| --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0。型エラー 0 件 |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0。boundary / deps / no-inline-style 違反 0 件 |
| 3 | vitest（対象限定） | `mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .` | 全 TC PASS。FAIL 0 件 |
| 4 | production build | `mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack` | build 成功（OpenNext 互換 = webpack 正本） |
| 5 | design token gate | `mise exec -- pnpm verify:tokens` | exit 0（`token-audit.md` 参照） |

> vitest は repo ルートが root のためフルパス + `--root .` 必須（_shared-context §8 既知の罠）。

## 2. line budget 判定

| 対象 | budget 観点 | 判定方針 |
| --- | --- | --- |
| 新規 `AttendanceDetailTabs.tsx` | 単一責務（タブ host のみ） | 過度に肥大化しない。3 表の埋め込みと `useState` 切替に責務を限定 |
| `AttendanceAnalyticsPage.tsx` | 3 層統括 | ゾーンごとに section 分割し、1 ゾーン = 1 描画責務に保つ |
| `globals.css` attendance ブロック | 未使用クラス削減後 | Phase 8 のクラス整理で行数が増加しない（重複/未使用削減で正味削減を目標） |

- line budget は「新規追加で既存より過度に肥大化していないか」を確認する定性判定。閾値超過の機械 gate がある場合は該当 gate に従う。

## 3. link 健全性判定

- 本タスクの docs（phase-NN.md / outputs/*）内の相対リンク・参照パスが解決することを確認する。
- 参照する実コードパス（`apps/web/src/features/admin/attendance/**`）が存在することを `ls` で裏取りする。

```bash
ls apps/web/src/features/admin/attendance/components/ apps/web/src/features/admin/attendance/lib/
```

## 4. mirror parity 判定

- 本タスクは skill mirror（`.claude/skills/*/references` の symlink mirror）に新規ファイルを追加しないため、mirror parity は「変更なし = parity 維持」を確認する。
- mirror parity gate が存在する場合は該当 gate（`pnpm` の対応 script）に従い、attendance 実装が mirror に影響しないことを確認する。

## 5. 一括判定サマリ（GO 条件）

| 判定軸 | PASS 基準 | NO-GO（差し戻し）先 |
| --- | --- | --- |
| typecheck | exit 0 | Phase 5 |
| lint | exit 0 | Phase 5 |
| vitest（対象限定） | 全 TC PASS | Phase 4/5 |
| next build --webpack | build 成功 | Phase 5 |
| token gate（AC-5） | HEX 0 件 / `verify:tokens` PASS | Phase 5/8 |
| 新規 primitive ゼロ（AC-6） | `components/` 新規 0 件 | Phase 5 |
| diff ゼロ（AC-7） | apps/api・packages/shared 0 件 | Phase 5 |

- 全軸 PASS で Phase 10（GO/NO-GO 判定）へ進む。1 軸でも FAIL すれば対応 Phase に差し戻す。
