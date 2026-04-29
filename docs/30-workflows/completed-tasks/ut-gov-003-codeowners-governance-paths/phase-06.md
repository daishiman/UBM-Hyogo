# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（fail path / 回帰 guard） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |

## 目的

Phase 4 の T1〜T4（happy path）に加えて、CODEOWNERS 特有の **fail path / 回帰 guard** を T5〜T9 として固定する。CODEOWNERS の壊れ方は (a) 構文エラー、(b) silently skip、(c) glob の解釈差、(d) 表記揺れの取りこぼし、(e) 順序逆転による意図しない上書き、の 5 種に大別され、それぞれに対応する。

## 依存タスク順序

- Phase 5 Step 0 ゲート（solo 運用 / owner 個人ハンドル / CI gate 不採用）が確定済みであること。
- Phase 4 の T1〜T4 仕様が固定済みであること。

## 実行タスク

- タスク1: T5〜T9 の fail path シナリオを「期待挙動 / 検証手順 / 観察された結果」表で網羅する。
- タスク2: 各 fail path に対する **検出手段** と **修正経路（Phase 5 のどの Step に戻すか）** を明記する。
- タスク3: 実走を Phase 5 Step 4（test PR）と main 反映後 hotfix に紐付ける。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-04.md | T1〜T4 happy path |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-05.md | 5 ステップ実装手順 / rollback |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | §8 苦戦箇所（落とし穴 1〜6） |
| 参考 | GitHub Docs "About code owners" §Syntax | glob 仕様の差異 |

## 異常系テスト一覧（T5〜T9）

> 表凡例: 「期待挙動」= 異常を仕掛けたときに観測されるべき結果 / 「検証手順」= 異常を再現する手順 / 「観察された結果」= 実走時に記入する欄（Phase 11 で実装担当者が記録）

### T5: 構文エラー混入時の `gh api /codeowners/errors` 検出

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 観点 | 構文エラーの自動検出（落とし穴 §8-4） |
| シナリオ | `.github/CODEOWNERS` にわざと不正記述（例: 行頭タブ＋無効トークン `\t* ?invalid`、または存在しない user `@nonexistent_user_xyz_test`）を混入 |
| 期待挙動 | `gh api .../codeowners/errors` の `errors` 配列に `kind=invalid_user`（または該当エラー種別）と `line=<該当行>` が 1 件以上含まれる |
| 検証手順 | (1) feature ブランチ上で `.github/CODEOWNERS` に `@nonexistent_user_xyz_test docs/30-workflows/**` 行を一時追加 → (2) push → (3) `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --ref <branch>` を実行 → (4) errors に該当行が含まれることを確認 → (5) 検証後ロールバック |
| 観察された結果 | _Phase 11 で実走時に記入_ |
| 修正経路 | Phase 5 Step 3 へ戻し、構文を修正して push し直す |
| 注意 | main に混入させない。必ず feature ブランチで `--ref` 指定で確認すること |

### T6: team handle 権限不足時の silently skip

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | silently skip 検出限界の明確化（落とし穴 §8-3） |
| シナリオ | 仮に `@some-org/some-team` のような team handle を使うが当該 team が repo に write 権限を持たない、または team が存在しない |
| 期待挙動 | `gh api .../codeowners/errors` は **errors=[] のまま**（silently skip）。一方 GitHub UI 上は suggested reviewer が表示されない |
| 検証手順 | (1) `.github/CODEOWNERS` に `docs/30-workflows/** @daishiman/no-such-team` のような未存在 team を一時追加 → (2) `gh api .../codeowners/errors` で errors=[] を確認 → (3) test PR で suggested reviewer が出ないことを確認 → (4) ロールバック |
| 観察された結果 | _Phase 11 で実走時に記入_ |
| 修正経路 | 本タスクは個人ハンドルで運用するため発生しない想定。将来 team 採用時の警告として記録 |
| 結論 | **T1（gh api）だけでは検出不能、T2（test PR）併用必須** という設計根拠を確証 |

### T7: `**` glob のディレクトリ末尾 `/` 有無による挙動差

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | glob 仕様の差異（落とし穴 §8-5） |
| シナリオ | `docs/30-workflows/**` と `docs/30-workflows/` と `docs/30-workflows` の 3 表記で suggested reviewer のマッチ範囲が変わる |
| 期待挙動 | `docs/30-workflows/**` は **配下の全ファイル** を hit。`docs/30-workflows/` は当該ディレクトリ直下のみ。`docs/30-workflows`（末尾なし）はファイル名一致扱い |
| 検証手順 | (1) test PR の test ブランチで CODEOWNERS の該当行を 3 表記でそれぞれ書き換え → (2) `docs/30-workflows/sub/.test`（深い階層）に touch → (3) suggested reviewer の表示を比較 → (4) 本タスクの正本は `**` 形式（多段配下マッチ）であることを再確認 |
| 観察された結果 | _Phase 11 で実走時に記入_ |
| 修正経路 | Phase 5 Step 3 の glob 表記を `**` に統一する |
| 結論 | 本タスクの CODEOWNERS は **すべて `**` 形式** に揃える（`docs/30-workflows/**` / `apps/api/**` 等） |

### T8: `doc/` と `docs/` 両方残置時の挙動

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | 表記揺れ取りこぼしの影響（AC-5 関連） |
| シナリオ | Phase 5 Step 2 の置換漏れにより、リポジトリ内に `doc/30-workflows/foo.md` と `docs/30-workflows/foo.md` の両方が残存する |
| 期待挙動 | CODEOWNERS の `docs/30-workflows/**` は **`docs/` のみ hit**（`doc/` には hit しない）。`doc/` 配下のファイルは global fallback `* @daishiman` で hit はするが、領域別 ownership 表明として正しく機能していない |
| 検証手順 | (1) `doc/30-workflows/.test` を一時作成 → (2) test PR を起こし suggested reviewer 表示を確認 → (3) `docs/30-workflows/.test` も追加して挙動を比較 → (4) `gh api .../codeowners/errors` は errors=[] のまま（silently broken）であることを確認 |
| 観察された結果 | _Phase 11 で実走時に記入_ |
| 修正経路 | Phase 5 Step 2 へ戻し、置換漏れを潰す。Step 1 棚卸し結果を再走 |
| 結論 | T3（`rg "(^\|[^a-zA-Z])doc/"`）の棚卸しを Step 1 / Step 2 後 / Step 5 post-merge の 3 タイミングで実行することの根拠 |

### T9: global fallback と governance ルールの順序逆転

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | 最終マッチ勝ち仕様の落とし穴（落とし穴 §8-2） |
| シナリオ | `.github/CODEOWNERS` で `* @daishiman` を **末尾に** 書き、governance ルールを冒頭に書く（Phase 5 Step 3 の正本順序を逆転） |
| 期待挙動 | governance パスがすべて global fallback に上書きされ、UI 上は global fallback の owner（`@daishiman`）が表示される。本タスクでは owner が同一（`@daishiman`）のため UI 上は同じに見えるが、**将来 team handle に切り替えた瞬間に governance owner が消滅** する潜在事故 |
| 検証手順 | (1) test ブランチで CODEOWNERS の順序を逆転 → (2) `gh api .../codeowners/errors` は errors=[] のまま → (3) 仮に `* @other-user` を末尾に置いて test PR を起こすと governance パスでも `@other-user` が suggested reviewer になることを確認 → (4) ロールバック |
| 観察された結果 | _Phase 11 で実走時に記入_ |
| 修正経路 | Phase 5 Step 3 の順序設計（global fallback 冒頭・governance 末尾）に戻す |
| 結論 | **owner が同一でも順序設計は妥協しない**（将来の team 切替時に表面化するため） |

## fail path × 検出手段 × 修正経路の早見表

| ID | 検出手段 | 修正経路 | 主たる落とし穴 |
| --- | --- | --- | --- |
| T5 | T1（gh api）が直接検出 | Phase 5 Step 3 修正 | §8-4 構文エラーの sneaky 失敗 |
| T6 | T2（test PR UI）併用必須 / T1 では検出不可 | （本タスクは個人ハンドルのため発生せず） | §8-3 team 権限要件 |
| T7 | T2（test PR UI）で hit 範囲確認 | Phase 5 Step 3 で `**` 統一 | §8-5 glob 仕様のクセ |
| T8 | T3（rg 棚卸し）+ T2 併用 | Phase 5 Step 2 再実施 | doc/ docs/ 表記揺れ |
| T9 | T2（owner 差異がある場合のみ UI で観測） / T1 では検出不可 | Phase 5 Step 3 順序復旧 | §8-2 最終マッチ勝ち |

> 重要: T6 / T9 は **`gh api` だけでは検出できない**。T2（test PR）併用が必須であり、これが Phase 4 で T1 と T2 を独立 ID として分けた根拠。

## 統合テスト連携

- T5〜T9 は実装担当者が test PR フェーズ（Phase 5 Step 4）で、該当リスクを変更した場合に再現確認。
- 通常運用では T5（構文）と T8（表記揺れ）の 2 つを定期的にチェックすれば十分（T4 判定で CI gate 不採用の補完として手動確認）。
- T6 / T9 は将来 team handle 採用時 / `require_code_owner_reviews=true` 切替時に再走するチェックリスト項目として Phase 12 申し送り。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T5〜T9 の fail path 表 / 検出手段 / 修正経路 |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 完了条件

- [ ] T5〜T9 が `outputs/phase-06/main.md` に「期待挙動 / 検証手順 / 観察された結果」表として記述されている
- [ ] 5 種の fail path（構文 / silently skip / glob 末尾 `/` / 表記揺れ両残置 / 順序逆転）が網羅されている
- [ ] 各 fail path に検出手段（T1 単独 / T2 併用 / T3 併用）と修正経路（Phase 5 Step N）が紐付いている
- [ ] T6 / T9 が `gh api` だけでは検出不可能である旨が明記されている
- [ ] 実走（観察された結果欄）は Phase 11 / 実装担当者に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-06/main.md
rg -c "^### T[5-9]:" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-06/main.md
# => 5
rg -q "silently skip" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-06/main.md && echo OK
rg -q "最終マッチ勝ち\|順序逆転" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-06/main.md && echo OK
```

## 苦戦防止メモ

1. **T5 を main で再現しない**: 構文エラー混入は必ず feature ブランチ + `--ref <branch>` で確認。main に混入すると CODEOWNERS 全体が無効化される事故。
2. **T6 / T9 は UI 目視のみ**: gh api では検出できないため、test PR でしか確認できない。CI gate 化を将来検討する場合の課題（Phase 12 申し送り）。
3. **T8 の置換漏れ**: 棚卸し ripgrep を Step 1 / Step 2 後 / Step 5 post-merge の 3 タイミングで走らせる運用を Phase 5 で確定済み。
4. **owner 同一でも順序設計を妥協しない**: T9 は本タスク時点では UI 上見えにくいが、将来 team handle 採用時に潜在化。
5. **本 Phase は実走しない**: 仕様化のみ。観察された結果欄は Phase 11 / 実装 PR で記入。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T4（happy path）+ T5〜T9（fail path）の合計 9 件が Phase 7 の AC × 検証マトリクス入力
  - T6 / T9 を将来の team 採用時 / 必須レビュー化時の再走項目として Phase 12 申し送り候補に
- ブロック条件:
  - 5 種の fail path のいずれかが未カバー
  - 検出手段（T1 単独 / T2 併用）の境界が曖昧
