# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト（4 worktree 並列マージ検証） |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 (統合レビュー) |
| 下流 | Phase 12 (仕様反映) |
| 状態 | pending |

## 目的

Phase 4 で設計したテストケースを **実際に 4 worktree を立てて手動実行**し、
ledger 由来のマージコンフリクトが 0 件になることを観測する。

> 本タスクは仕様書のみだが、Phase 11 は「仕様書通りに別タスクの実装が完了した後」に
> 実行するゲートを定義する役割を持つ。本仕様書段階では **手順 / チェックリストの確定**までを行う。

## NON_VISUAL 区分の取り扱い

- `manual-smoke-log.md` を必ず作成
- `link-checklist.md` を必ず作成
- `screenshot-plan.json` は生成しない
- primary evidence は `git status` / `git merge` 出力 / render script の stdout
- `manual-smoke-log.md` には `TC-ID ↔ evidence` 対応、NON_VISUAL 理由、代替 evidence を明記
- placeholder-only の証跡は PASS 扱いにしない

## 検証ケース (Phase 4 から継承)

| TC-ID | ケース | 期待値 |
| --- | --- | --- |
| TC-1 | C-1: 同一 fragment 名衝突 | 命名規約違反として検知 |
| TC-2 | C-2: 異なる fragment 並列生成 | 衝突 0 件 |
| TC-3 | C-3: gitignore 対象の並列再生成 | git tree に出ず衝突 0 件 |
| TC-4 | C-4: merge=union 適用ファイルへの並列追記 | 両方の追記が保存 |
| TC-5 | C-5: SKILL.md 別箇所への並列編集 | 通常 merge で成功 |
| TC-6 | C-6: render script の時系列出力 | timestamp 降順 |
| TC-7 | C-7: 異常 front matter | 仕様通りエラー or スキップ |

## 実行タスク

### タスク 1: manual-smoke-log.md 作成

**実行手順**:
1. TC-1 〜 TC-7 をチェックリスト化
2. 各 TC で必要な setup（4 worktree の作成、commit 内容）と
   観測コマンド（`git diff --name-only --diff-filter=U` 等）を併記
3. `outputs/phase-11/manual-smoke-log.md` に固定

### タスク 2: manual-smoke-log.md 内の issue 記録欄作成

**実行手順**:
1. 検証中に発見した issue を記録するためのテンプレートを `manual-smoke-log.md` 内に作成
2. issue ごとに「TC-ID / 現象 / 期待 / 影響 / 対応 Phase」列を持つ表
3. 発見 issue は `outputs/phase-11/main.md` の「未タスク候補」へ集約

### タスク 3: link-checklist.md 作成

**実行手順**:
1. TC-ID ↔ evidence 対応表の雛形作成
2. NON_VISUAL 理由を記載するセクションを設置
3. 代替 evidence（`git merge` 出力ログ等）の保存先を指定
4. `outputs/phase-11/link-checklist.md` に固定

### タスク 4: main.md 作成

**実行手順**:
1. 検証戦略サマリー
2. AC-6 とのトレース
3. 完了基準（衝突 0 件）

## 4 worktree 検証手順（要約）

```
# 1. main から 4 worktree 作成
bash scripts/new-worktree.sh feat/skill-test-1
bash scripts/new-worktree.sh feat/skill-test-2
bash scripts/new-worktree.sh feat/skill-test-3
bash scripts/new-worktree.sh feat/skill-test-4

# 2. 各 worktree で fragment / SKILL.md / changelog を編集
#    （TC-1 〜 TC-7 のシナリオに沿う）

# 3. 各 worktree から PR → 順次 main へ merge
# 4. 各 merge 時に conflict 0 件を観測
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-2/file-layout.md | 検証対象ファイルの正本 |
| 必須 | outputs/phase-2/fragment-schema.md | TC-1 / TC-2 の fragment 規約 |
| 必須 | outputs/phase-5/gitignore-runbook.md | TC-3 の gitignore 再生成手順 |
| 必須 | outputs/phase-6/fragment-runbook.md | TC-1 / TC-2 / TC-6 / TC-7 の実行手順 |
| 必須 | outputs/phase-7/skill-split-runbook.md | TC-5 の SKILL.md 分割手順 |
| 必須 | outputs/phase-7/gitattributes-runbook.md | TC-4 の merge=union 手順 |
| 必須 | outputs/phase-8/before-after.md | 用語・参照整合の確認元 |
| 必須 | outputs/phase-9/quality-checklist.md | 品質ゲート通過条件 |
| 必須 | outputs/phase-4/parallel-commit-sim.md | 検証手順の元 |
| 必須 | outputs/phase-4/merge-conflict-cases.md | TC ケース集 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | 手動テストサマリー |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | TC-1 〜 TC-7 チェックリストと evidence 対応 |
| ドキュメント | outputs/phase-11/link-checklist.md | 参照リンクチェック |

## 完了条件

- [ ] main.md / manual-smoke-log.md / link-checklist.md の 3 ファイル作成
- [ ] AC-6（4 worktree 並列マージで衝突 0 件）が判定可能な手順になっている
- [ ] artifacts.json の Phase 11 を completed に更新

## タスク 100% 実行確認【必須】

- [ ] 全タスクを 100% 完了
- [ ] manual-smoke-log.md / link-checklist.md が必ず存在
- [ ] placeholder-only の証跡は PASS 扱いにしない方針が明記

## 次 Phase

- 次: Phase 12 (仕様反映)
- 引き継ぎ事項: 4 ファイルの雛形と検証戦略

## Skill準拠補遺

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。
