# Phase 6: 異常系・回帰テスト拡充（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・回帰テスト拡充（fail path / 回帰 guard） |
| 作成日 | 2026-05-31 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC / カバレッジマトリクス) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #229（CLOSED のまま参照のみ） |

## 目的

Phase 4 の happy/Red TC-01〜TC-07 に加えて、**書き込み経路の fail path**（tmp 書き込み失敗 / rename 失敗 / EACCES / 部分失敗）を TC-F1〜TC-F4 として固定し、加えて **byte-identical 回帰 guard** を TC-F5 として組み込む。本 Phase は「atomic write の不変条件（部分書き込みを残さない・失敗時 tmp を掃除する）」が異常系で崩れないことを検証する仕様の正本化を行う。本 Phase も仕様化のみで、実テスト作成・実走は今回の実装サイクルに委ねる。

## 前提

Phase 5 Step 2（atomic helper）/ Step 3（decisive log）/ Step 4（silent catch 分離）が実装されていることを前提に fail path を扱う。fail path は全て `vi.spyOn(fs/promises)` の reject 注入で再現し、本物の `indexes/` には触れない（`os.tmpdir()` + `mkdtempSync` 隔離）。

## 実行タスク

1. TC-F1〜TC-F5 を tmp 書き込み失敗 / rename 失敗 / EACCES / 部分失敗 / byte-identical 回帰の 5 軸で定義する（完了条件: 5 件すべてが本 Phase に表化）。
2. 各 fail path に「失敗注入方法」「期待される不変条件（本ファイル不変 + tmp 0 + 非ゼロ exit）」を明記する（完了条件: 各 TC に不変条件が記述）。
3. byte-identical 回帰 guard を回帰確認の正本として組み込む（完了条件: TC-F5 が AC-4 と整合）。
4. 実走を今回の実装サイクルに委譲する境界を明記する（完了条件: 委譲記述あり）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | TC-01〜TC-07 happy/Red |
| 必須 | phase-05.md | atomic helper / decisive log / コミット粒度 |
| 必須 | phase-02.md | `writeAllIndexesAtomic` の finally tmp 掃除設計（D-1） |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例 |
| 必須 | vitest.config.ts | test glob |

## 異常系テスト一覧

> 凡例: **期待される不変条件** = atomic 境界が守られる条件 / **失敗注入** = spy reject による再現方法 / **対応 AC**

### TC-F1: tmp 書き込み失敗（writeFile reject）

| 項目 | 内容 |
| --- | --- |
| ID | TC-F1 |
| 対象 AC | AC-2 / AC-1 |
| 観点 | tmp フェーズで `writeFile` が失敗したとき本ファイルが汚れないか |
| シナリオ | `writeAllIndexesAtomic` の 1 件目 tmp 書き込みで `writeFile` が reject |
| 失敗注入 | `vi.spyOn(fsp, "writeFile").mockRejectedValueOnce(new Error("EIO"))` |
| 期待される不変条件 | 本ファイル群（topic-map.md / keywords.json）が変更前のまま / `.tmp` が残らない（`finally` unlink）/ throw が伝播し非ゼロ exit |
| Red 状態（仕掛け） | tmp 掃除（`finally` unlink）を一時的に外して再走 → `.tmp` が残れば regression |
| 対応 | Phase 5 Step 2 の `finally` unlink を必須化 |

### TC-F2: rename 失敗（commit フェーズで rename reject）

| 項目 | 内容 |
| --- | --- |
| ID | TC-F2 |
| 対象 AC | AC-2 / AC-1 |
| 観点 | 全 tmp 成功後の commit（rename）が途中失敗したときの中間状態 |
| シナリオ | 2 entry のうち 2 件目の `rename` が reject（1 件目は本ファイルへ commit 済み） |
| 失敗注入 | `vi.spyOn(fsp, "rename")` を 2 回目で reject |
| 期待される不変条件 | throw が伝播し非ゼロ exit / 残存 `.tmp`（未 rename 分）は `finally` で unlink / decisive log に失敗 entry の index-file / step が出る |
| Red 状態（仕掛け） | decisive log を外すと、どの index で rename 失敗したか不明 → regression |
| 対応 | rename も all-or-nothing の commit フェーズに含め、失敗時 tmp 掃除 + decisive log。※commit フェーズ途中失敗は構造上「先行 rename 済み」が残りうる点を Phase 8 で境界明記する申し送り候補 |

### TC-F3: EACCES（権限エラーで extractHeadings throw）

| 項目 | 内容 |
| --- | --- |
| ID | TC-F3 |
| 対象 AC | AC-5 / AC-1 |
| 観点 | ENOENT 以外の I/O エラーが silent に握り潰されず throw されるか |
| シナリオ | `extractHeadings` が読む reference file で EACCES が発生 |
| 失敗注入 | `vi.spyOn(fsp, "readFile").mockRejectedValueOnce({ code: "EACCES" })` |
| 期待される不変条件 | `[generate-index] heading 抽出失敗 (<file>): <message>` を throw / index 生成が中断し非ゼロ exit / 本ファイル不変 |
| Red 状態（仕掛け） | silent catch（`catch { return []; }`）に戻すと空継続で exit 0 → regression |
| 対応 | Phase 5 Step 4 の ENOENT/その他分離を必須化（TC-05 の異常系拡張） |

### TC-F4: 部分失敗（複数 index のうち一部だけ成功）

| 項目 | 内容 |
| --- | --- |
| ID | TC-F4 |
| 対象 AC | AC-2 / AC-1 |
| 観点 | 「topic-map は成功 / keywords は失敗」のときに片方だけ更新されないか |
| シナリオ | topic-map.md の tmp+rename は成功するが keywords.json の tmp 書き込みで失敗 |
| 失敗注入 | entries を 2 件にし、keywords 側の `writeFile` を reject |
| 期待される不変条件 | **all-or-nothing**: keywords 失敗時は topic-map も本ファイルへ commit しない（全 tmp 成功後にのみ rename する設計のため、tmp フェーズで失敗すれば rename フェーズに入らない）/ 本ファイル両方とも変更前のまま / tmp 0 / 非ゼロ exit |
| Red 状態（仕掛け） | 逐次 writeFile（現状実装）に戻すと topic-map だけ更新される不整合が残る → regression |
| 対応 | Phase 5 Step 2 の「全 tmp 成功後にのみ rename」境界を必須化 |

### TC-F5: byte-identical 回帰 guard（drift 0）

| 項目 | 内容 |
| --- | --- |
| ID | TC-F5 |
| 対象 AC | AC-4 |
| 観点 | hardening 後も生成出力が現状と完全一致するか（回帰 guard） |
| シナリオ | 現状の `references/*.md` に対し `pnpm indexes:rebuild` を実行 |
| 失敗注入 | なし（回帰 guard） |
| 期待される不変条件 | `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` が exit 0（drift 0）/ pre-push `indexes-drift-guard.sh` / CI `verify-indexes.yml` / `verify-pr-ready.sh` がグリーン |
| Red 状態（仕掛け） | 改行 / `JSON.stringify(..., null, 2)` のシリアライズを変えると drift 発生 → CI fail |
| 対応 | 出力文字列の組み立てを一切変更しない（Phase 5 で書き込み経路のみ変更）。Phase 11 で CLI 実走 + `git diff` を最終証跡化 |

## fail path × 対応 AC / Phase 早見表

| ID | 観点 | 対応 AC | 対応 Phase |
| --- | --- | --- | --- |
| TC-F1 | tmp 書き込み失敗 | AC-2 / AC-1 | Phase 5 Step 2（finally unlink） |
| TC-F2 | rename 失敗 | AC-2 / AC-1 | Phase 5 Step 2-3 / Phase 8 境界申し送り |
| TC-F3 | EACCES throw | AC-5 / AC-1 | Phase 5 Step 4 |
| TC-F4 | 部分失敗 all-or-nothing | AC-2 / AC-1 | Phase 5 Step 2 |
| TC-F5 | byte-identical 回帰 | AC-4 | Phase 5 Step 5 / Phase 11 smoke |

## 回帰 guard としての byte-identical 確認

異常系テストは全て **本物の `indexes/` を触らない**（spy reject + `os.tmpdir()` 隔離）。一方で byte-identical（TC-F5）だけは CLI 経路全体の回帰なので、Phase 11 で実 `pnpm indexes:rebuild` を 1 回走らせ `git diff --quiet` で drift 0 を確認する。spec 内では `generateTopicMap()` / `generateKeywordIndex()` の出力文字列が hardening 前後で不変であることを固定し、書き込み経路の変更が出力に波及しないことを担保する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | TC-F1〜TC-F5 一覧 / 失敗注入 / 不変条件 / 回帰 guard |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] TC-F1〜TC-F5 が本 Phase と `outputs/phase-06/main.md` に表化されている
- [ ] 各 TC にシナリオ / 失敗注入 / 期待される不変条件 / Red 状態 / 対応が記述されている
- [ ] tmp 書き込み失敗（F1）/ rename 失敗（F2）/ EACCES（F3）/ 部分失敗（F4）/ byte-identical（F5）の 5 観点がカバーされている
- [ ] all-or-nothing（部分書き込みを残さない）の不変条件が異常系で検証されている
- [ ] byte-identical 回帰 guard が組み込まれている
- [ ] 実テスト作成・実走を今回の実装サイクルに委ねる旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `completed`
- 成果物 `outputs/phase-06/main.md` が配置済み
- TC-F1〜TC-F5 が AC-1 / AC-2 / AC-4 / AC-5 に紐づく
- artifacts.json の `phases[5].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 7 (AC / カバレッジマトリクス)
- 引き継ぎ事項:
  - TC-01〜TC-07（happy/Red）+ TC-F1〜TC-F5（fail path）の合計 12 件が Phase 7 AC マトリクスの入力
  - TC-F2 の rename commit フェーズ途中失敗の境界を Phase 8 DRY 化で明記する申し送り
- ブロック条件:
  - tmp 失敗 / rename 失敗 / EACCES / 部分失敗 / byte-identical のいずれかが未カバー
  - all-or-nothing の不変条件 assert が欠落
