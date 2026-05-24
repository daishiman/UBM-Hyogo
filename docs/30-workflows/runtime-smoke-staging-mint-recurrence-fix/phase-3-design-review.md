# Phase 3: 設計レビュー（ゲート）

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 3 / 13 |
| 入力 | phase-1-requirements.md / phase-2-design.md |
| 役割 | Phase 4 へ進めるかを判定するゲート |

## 目的

Phase 1-2 の設計が AC-1〜AC-7 を満たし、根本原因（index.md §2）を構造的に解消し、CONST_007（1 サイクル完了）に収まることを判定する。

## 実行タスク

1. Phase 2 設計を 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、各判定の根拠を固定する。
2. 根本原因 R-1〜R-5 が C-1〜C-6 で構造的に解消されることを対応表で確認する。
3. レビュー指摘（RV-1〜RV-3）を重大度付きで列挙し、設計内解消 / 対応不要の判断を記録する。
4. GATE PASS / FAIL を明記し、Phase 4 へ進める可否を確定する。

## 4 条件評価

| 条件 | 判定 | 根拠 |
|---|---|---|
| 価値性 | PASS | 24h 周期の 401 再発を「smoke 実行前の loud fail」に置換し、失効（再発行）/ 鍵 drift（再同期）/ binding 欠落（投入）/ identity（修正）を区別する。誰の（運用者の）どのコスト（再発対応・誤診断の往復）をどれだけ（往復 0 へ）下げるかが定義済み。 |
| 実現性 | PASS | 新規 1 module（`bearer-freshness-gate.mts`）+ 既存 3 ファイルの局所差分 + doc 2 件。`signSessionJwt` / `verifySessionJwt` は既存 export を再利用。1 実装サイクルに収まる。 |
| 整合性 | PASS | 検証側 API（`require-admin.ts` / `AUTH_SECRET` binding）・required check 名・mint 基盤・D1 / Form / endpoint を変更しない。責務境界テーブルで状態所有権の混在が無い。 |
| 運用性 | PASS | 静的 fallback を維持（AC-6）し運用退行リスクを増やさない。loud fail メッセージが SSOT のディシジョンツリーへ誘導し、次アクションが一意に決まる。 |

## 根本原因 → 設計の対応表（解消の確認）

| 根本原因 | 解消する設計 | 残存リスク |
|---|---|---|
| R-1 mint dead code 化 | C-2 `runtime-smoke auth path: minted/static-fallback` 可視化で「mint 未有効」を毎回明示 | secret 投入の**実行**は user-gated（スコープ外）だが、R-4 解消により失効前に必ず気づく |
| R-2 失効静的 bearer へサイレント退行 | C-1 鮮度ゲートが失効 6h 前に smoke 前 loud fail | threshold 値は env 上書き可（既定 6h で運用十分） |
| R-3 失効と鍵 drift の混同 | C-3 reason を `auth-token-expired` / `auth-secret-drift` に分割 | decode 不能時は auth-secret-drift に分類 |
| R-4 smoke 前検知ゲート不在 | C-1 + C-2 が smoke 実行前に割り込む | なし |
| R-5 SSOT 不在 | C-5 / C-6 で lifecycle と同期不変条件を単一正本化 | なし |

## レビュー指摘と対応

| ID | 重大度 | 指摘 | 対応 |
|---|---|---|---|
| RV-1 | MINOR | `setup-project` を常時実行に変えると静的 fallback 時も pnpm install が走り CI 時間が増える | smoke job は `timeout-minutes: 10`。tsx 実行に必要で、増分は許容範囲。Phase 9 で実時間を証跡化 |
| RV-2 | MINOR | bash から `pnpm exec tsx` 呼び出しが失敗する環境では reason 分岐が効かない | C-3 で decode 不能を `auth-secret-drift` に分類。回帰しない |
| RV-3 | INFO | 鮮度ゲートは署名検証しないため改ざん token の exp を信用してしまう | 鮮度ゲートは「失効の事前警告」が責務。署名検証は API 側と mint 自己検証（C-4）が担う。責務分離で正しい |

> MINOR 指摘（RV-1, RV-2）は設計内で解消済みのため Phase 12 未タスク化は不要。INFO（RV-3）は責務分離の説明であり対応不要。

## 判定

**GATE PASS** — Phase 4（テスト計画）へ進む。

## 統合テスト連携

| 連携先 | 連携内容 | Phase |
|---|---|---|
| Phase 4（テスト計画） | GATE PASS を受けてテスト計画を起こす。RV-2（`pnpm exec tsx` 不可環境）のauth-secret-drift分類 はテストケースとして引き継ぐ | phase-4-test-plan.md |
| Phase 2（設計） | 4 条件評価と根本原因対応表の入力として C-1〜C-6 を参照する | phase-2-design.md |
| Phase 9（QA） | RV-1（CI 実時間増分）の証跡化を引き継ぐ | phase-9-qa.md |

## 参照資料

| 参照資料 | パス | 内容 |
|---|---|---|
| 要件 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-1-requirements.md` | AC・inventory |
| 設計 | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/phase-2-design.md` | C-1〜C-6 |
| レビュー基準 | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` | ゲート判定基準 |

## 成果物

- 本ファイル（`phase-3-design-review.md`）: 4 条件評価・根本原因対応表・ゲート判定。

## 完了条件

- [x] 4 条件すべて PASS。
- [x] 根本原因 R-1〜R-5 が設計で解消されることを表で確認した。
- [x] MINOR / INFO 指摘の対応方針が記述されている。
- [x] GATE PASS を明記した。
