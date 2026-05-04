[実装区分: 実装仕様書]

# Phase 7: AC マトリクス / 検証カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / 検証カバレッジ確認 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |

---

## 目的

Phase 1 で確定した Acceptance Criteria を、Phase 4 検証 3 軸 / Phase 5 ファイル変更マニフェスト / Phase 6 異常系リカバリと 1 表に集約する。
NON_VISUAL タスクのため AC は「検証コマンドの実行結果が期待値と一致するか」で 1:1 に判定する。本 Phase ではコードを書かず、AC ↔ 検証コマンド ↔ 期待値 の追従関係を表で固定する。

---

## 実行タスク

1. AC-1〜AC-5 を行に、検証コマンド / 期待値 / 主実装ファイル / 判定 を列とする AC マトリクスを作成
2. 検証手段カバレッジ表で grep / rebuild / CI gate を網羅
3. 未カバー領域（あれば Phase 8 / 9 / 12 へ持ち越し）を明示
4. Phase 6 異常系の 3 系統が AC を崩さない cross-check を実施

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | AC-1〜AC-5 の定義（本タスクで確定） |
| 必須 | phase-04.md | 検証 3 軸（grep / rebuild / CI gate）ケース表 |
| 必須 | phase-05.md | ファイル変更マニフェスト M-1 / M-2 / M-3 |
| 必須 | phase-06.md | 異常系 3 系統 |
| 参考 | `.github/workflows/verify-indexes.yml` | CI gate 正本 |

---

## AC マトリクス

| AC | 内容 | 検証コマンド | 期待値 | 主実装ファイル | 判定 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | resource-map から D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` を逆引きできる | `grep -c "scripts/d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` && `grep -c "d1-migration-verify.yml" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 両 grep の出力 `>= 1` | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 達成 |
| AC-2 | quick-reference に `bash scripts/cf.sh d1:apply-prod` が 1 行存在 | `grep -c "scripts/cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `>= 1` | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 達成 |
| AC-3 | `pnpm indexes:rebuild` が exit 0 で完了し、`topic-map.md` が再生成される | `mise exec -- pnpm indexes:rebuild; echo $?` | `0` / 直後の `git diff -- topic-map.md` に D1 関連 diff が含まれる | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 達成 |
| AC-4 | rebuild が冪等（再実行で indexes/ に追加 diff が出ない） | `mise exec -- pnpm indexes:rebuild && git status --porcelain .claude/skills/aiworkflow-requirements/indexes/` | 1 回目 rebuild 後と 2 回目 rebuild 後の `status` 出力が一致 | 同上 | 達成 |
| AC-5 | CI gate `verify-indexes-up-to-date` 相当のローカル検証が PASS | `mise exec -- pnpm indexes:rebuild && git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes/; echo $?`（commit 後実行） | `0` | `.github/workflows/verify-indexes.yml` | 達成 |

> 「達成」は実装適用後にコマンド実行で 1 回検証すれば判定可能。CI gate（AC-5）は PR 上で `verify-indexes-up-to-date` job の green を最終確認する。

---

## 検証手段カバレッジ表

| 検証手段 | 対象 AC | 実行コマンド | 期待値 |
| --- | --- | --- | --- |
| static grep | AC-1 / AC-2 | `grep -c <pattern> <file>` | 各 `>= 1` |
| rebuild 実行 | AC-3 | `mise exec -- pnpm indexes:rebuild` | exit 0 + topic-map に D1 diff |
| 冪等性 | AC-4 | rebuild 2 回 + `git status --porcelain` 比較 | 1 回目 = 2 回目 |
| CI gate 等価 | AC-5 | rebuild 後 `git diff --quiet` | exit 0 |
| typecheck / lint | 横断（連動破壊検出） | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` | 共に exit 0 |

---

## 未カバー領域 / 持ち越し

| # | 領域 | 持ち越し先 Phase | 理由 |
| --- | --- | --- | --- |
| U-1 | resource-map / quick-reference の追記文言と D1 runbook 本体の文字列整合（path / file 名の typo 検出） | Phase 12（docs 同期） | 文字列一致確認は docs 同期の責務 |
| U-2 | act 等を用いた CI workflow ローカル走行 | Phase 9（任意） | 必須は `git diff --quiet` 等価チェックで満たすため |
| U-3 | 既存 D1 entry 拡張ルートを採った場合の merge 妥当性 | Phase 6 → Phase 12 | F-DUP-* リカバリ後の最終確認 |

---

## 異常系 cross-check

| Phase 6 異常系系統 | 想定影響 AC | cross-check 結果 |
| --- | --- | --- |
| 系統 1: rebuild 失敗（F-RB-*） | AC-3 / AC-4 / AC-5 | リカバリ後に rebuild が exit 0 / 冪等 / `git diff --quiet` 0 を満たせば AC は崩れない |
| 系統 2: CI gate fail（F-CI-*） | AC-5 | ローカル rebuild → 差分 commit → push で AC-5 を再達成 |
| 系統 3: 文言重複（F-DUP-*） | AC-1 / AC-2 | 既存 entry 拡張戦略で AC-1 / AC-2 grep を満たす（noop ルートでも grep は通る） |

> 異常系経由でも AC-1〜AC-5 全てが最終的に「達成」判定になる経路が存在することを Phase 6 で保証済み。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 未カバー U-1 / U-3 を docs 同期 / merge 検証として引き継ぐ |
| Phase 9 | AC-1〜AC-5 検証コマンドを quality gate に組み込む |
| Phase 10 | AC マトリクス全件「達成」を GO / NO-GO 判定の入力に使用 |
| Phase 12 | U-1 docs 同期チェックを引き継ぐ |

---

## 多角的チェック観点

- 不変条件 #5: AC マトリクスのいずれも apps/web から D1 へ直接触れる経路を要求していない（追記は所在案内のみ）
- CONST_005: AC ↔ 検証コマンド ↔ 期待値 の 1:1 対応が表に明示されている
- DRY: AC マトリクスは Phase 4 検証 3 軸表と ID を共有する（重複定義しない）
- YAGNI: AC-1〜AC-5 以外の AC を本 Phase で勝手に増やさない（増やすなら Phase 1 へ戻る）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス AC-1〜AC-5 完成 | 7 | completed | 検証コマンド + 期待値 + 判定 |
| 2 | 検証手段カバレッジ表完成 | 7 | completed | grep / rebuild / 冪等 / CI gate / typecheck |
| 3 | 未カバー U-1〜U-3 持ち越し | 7 | completed | Phase 8 / 9 / 12 |
| 4 | Phase 6 異常系 cross-check | 7 | completed | 3 系統と AC の対応 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC マトリクス / 検証手段カバレッジ表 / 未カバー領域 / 異常系 cross-check |
| メタ | artifacts.json | Phase 7 を completed に更新 |

---

## 完了条件

- [ ] AC マトリクスが AC-1〜AC-5 全行を網羅し、各行に検証コマンド / 期待値 / 主実装ファイル / 判定が記入されている
- [ ] 検証手段カバレッジ表に grep / rebuild / 冪等 / CI gate / typecheck-lint が含まれる
- [ ] 未カバー領域 U-1〜U-3 が Phase 8 / 9 / 12 のいずれかへ持ち越し済
- [ ] Phase 6 異常系 3 系統が AC を崩さない cross-check が完了している

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-07/main.md` が指定パスに配置済み
- 完了条件 4 件すべてにチェック
- 「未達」AC が 1 件でもあれば Phase 8 への戻り経路を明記
- artifacts.json の phase 7 を completed に更新

---

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: AC マトリクス / 未カバー U-1〜U-3 / 異常系 cross-check 結果
- ブロック条件: AC-1〜AC-5 のいずれかが「達成」以外で残る場合は Phase 8 で先行解消する
