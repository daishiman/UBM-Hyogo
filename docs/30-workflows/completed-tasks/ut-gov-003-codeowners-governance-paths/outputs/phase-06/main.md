# Phase 6 成果物: 異常系検証 main

## 概要

CODEOWNERS の壊れ方 5 種（T5〜T9）を「期待挙動 / 検証手順 / 観察された結果」の 3 列表で網羅し、各 fail path に検出手段と修正経路を紐付ける。

## fail path 一覧表

### T5: 構文エラー混入時の検出

| 列 | 内容 |
| --- | --- |
| 期待挙動 | `gh api .../codeowners/errors` の `errors` 配列に `kind=invalid_user`（または該当エラー種別）と該当行番号が 1 件以上含まれる |
| 検証手順 | feature ブランチ上で `.github/CODEOWNERS` に `@nonexistent_user_xyz_test docs/30-workflows/**` を追加 → push → `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --ref <branch>` を実行 → errors に該当行が含まれることを確認 → ロールバック |
| 観察された結果 | _実装担当者が Phase 11 で記入_ |
| 検出手段 | T1（gh api）単独で検出可 |
| 修正経路 | Phase 5 Step 3 |

### T6: team handle 権限不足時の silently skip

| 列 | 内容 |
| --- | --- |
| 期待挙動 | `gh api .../codeowners/errors` は **errors=[] のまま** だが、test PR の suggested reviewer は表示されない |
| 検証手順 | feature ブランチで `docs/30-workflows/** @daishiman/no-such-team` を追加 → `gh api .../codeowners/errors` で errors=[] を確認 → test PR を起こし suggested reviewer 欄が空であることを確認 → ロールバック |
| 観察された結果 | _実装担当者が Phase 11 で記入_ |
| 検出手段 | T2（test PR UI）併用必須 / T1 単独では検出不能 |
| 修正経路 | （本タスクは個人ハンドル運用のため発生せず） |

### T7: `**` glob のディレクトリ末尾 `/` 有無による挙動差

| 列 | 内容 |
| --- | --- |
| 期待挙動 | `docs/30-workflows/**` は配下全ファイル hit / `docs/30-workflows/` は直下のみ / `docs/30-workflows`（末尾なし）はファイル名一致扱い |
| 検証手順 | test ブランチで CODEOWNERS の該当行を 3 表記でそれぞれ書き換え → `docs/30-workflows/sub/.test`（深い階層）を touch → 各表記での suggested reviewer 表示を比較 |
| 観察された結果 | _実装担当者が Phase 11 で記入_ |
| 検出手段 | T2（test PR UI）で hit 範囲を観測 |
| 修正経路 | Phase 5 Step 3 で `**` 統一 |

### T8: `doc/` と `docs/` 両方残置時の挙動

| 列 | 内容 |
| --- | --- |
| 期待挙動 | CODEOWNERS の `docs/30-workflows/**` は `docs/` のみ hit。`doc/` 配下は global fallback で hit するが領域別 ownership 表明として機能していない（silently broken） |
| 検証手順 | `doc/30-workflows/.test` を一時作成 → test PR で suggested reviewer を確認 → `docs/30-workflows/.test` を追加して挙動比較 → `gh api .../codeowners/errors` は errors=[] のまま |
| 観察された結果 | _実装担当者が Phase 11 で記入_ |
| 検出手段 | T3（rg 棚卸し）+ T2 併用 |
| 修正経路 | Phase 5 Step 2 再実施 |

### T9: global fallback と governance ルールの順序逆転

| 列 | 内容 |
| --- | --- |
| 期待挙動 | governance パスがすべて global fallback に上書きされる。owner が同一なら UI 上は同じだが、将来 team handle 切替時に governance owner 消滅 |
| 検証手順 | test ブランチで CODEOWNERS の順序を逆転 → `gh api .../codeowners/errors` で errors=[] のまま → 仮に `* @other-user` を末尾に置いて test PR を起こすと governance パスでも `@other-user` が表示されることを確認 |
| 観察された結果 | _実装担当者が Phase 11 で記入_ |
| 検出手段 | T2（owner 差異がある場合のみ UI で観測可） / T1 では検出不能 |
| 修正経路 | Phase 5 Step 3 で順序復旧（global fallback 冒頭・governance 末尾） |

## 検出手段マトリクス

| ID | T1 (gh api) | T2 (test PR UI) | T3 (rg 棚卸し) |
| --- | --- | --- | --- |
| T5 構文エラー | ◎ 主検出 | - | - |
| T6 silently skip | × 検出不能 | ◎ 必須 | - |
| T7 glob 末尾 | × 検出不能 | ◎ 必須 | - |
| T8 表記両残置 | × 検出不能 | 補助 | ◎ 主検出 |
| T9 順序逆転 | × 検出不能 | ◎（owner 差異時のみ） | - |

> 結論: **T1 単独で検出できる fail path は T5 のみ**。T2（test PR）併用が CODEOWNERS 検証の中核。これが Phase 4 で T1 / T2 を独立 ID として分けた根拠。

## 修正経路サマリ

| Phase 5 Step | 戻し対象の fail path |
| --- | --- |
| Step 2（doc/ 置換） | T8 |
| Step 3（CODEOWNERS 編集） | T5 / T7 / T9 |
| 該当外（運用方針変更時のみ） | T6（team handle 採用時） |

## 将来課題（Phase 12 申し送り）

| 項目 | トリガ条件 | 対応 |
| --- | --- | --- |
| T6 再評価 | team handle 採用が決定 | team の repo write 権限事前付与 → CODEOWNERS 切替 → T6 再走 |
| T9 再評価 | `require_code_owner_reviews=true` 切替検討 | 順序逆転による block 範囲拡大の影響評価 |
| CI gate 導入 | T4 の 3 条件のいずれか成立 | `actions/codeowners-validator` 等の導入 PR 起票 |

## 実走チェックリスト（Phase 11 / 実装 PR 用）

- [ ] T5: feature ブランチで構文エラー混入 → errors に該当行 → ロールバック
- [ ] T6: team handle を導入する場合のみ、未存在 team で silently skip 確認（本タスクは skip 可）
- [ ] T7: `**` 形式が正本であることを test PR で再確認
- [ ] T8: Step 1 棚卸し / Step 2 後 / Step 5 post-merge の 3 タイミングで rg 実行
- [ ] T9: 順序逆転を再現せず、Phase 5 Step 3 の正本順序を最終確認

## 関連

- Phase 4 happy path: `phase-04.md`
- Phase 5 ランブック: `phase-05.md`
- Phase 7 AC マトリクス: `phase-07.md`
- 原典: `docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md` §8 苦戦箇所
