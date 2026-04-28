# Phase 11: 手動 smoke（NON_VISUAL / docs-only）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-28 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（`.claude/skills/` 構造の再編成仕様のみ・コード実装なし） |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは `.claude/skills/*/SKILL.md` を 200 行未満 entrypoint と `references/<topic>.md` 群へ分割する **docs-only リファクタリング**。
  - 出力は Markdown ファイルと skill loader の解決経路のみで、画面・コンポーネント・レイアウト・インタラクションを伴わない。
  - 一次証跡は「行数検査ログ」「`rg` リンク健全性ログ」「canonical / mirror `diff -r` 結果」の 3 種で、screenshot は不要。
- 必須 outputs:
  - `outputs/phase-11/main.md`（smoke 実行サマリー / 既知制限 / 検証結果）
  - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログ）
  - `outputs/phase-11/link-checklist.md`（SKILL.md → references リンクの目視確認チェックリスト）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体不要）。

## 目的

Phase 5 の implementation-runbook に基づき分割された `.claude/skills/<skill>/SKILL.md` と `references/<topic>.md` 群について、AC-1〜AC-8 がエンドツーエンドで満たされていることを手動 smoke で確認し、一次証跡を採取する。具体的には「行数 < 200 行」「未参照 reference 0 / リンク切れ 0」「canonical = mirror（差分 0）」を検証コマンドで確定させ、`task-specification-creator/SKILL.md` を最優先対象として PASS させる。

## 依存境界

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Phase 10 GO 判定 | smoke 実施の前提条件 |
| 上流 | Phase 5 の per-skill 切り出し完了 | smoke 対象が存在すること |
| 並列 | 他 skill 改修タスク | 着手中は対象 SKILL.md を単独 PR で占有（衝突回避） |
| 下流 | Phase 12 | 既知制限・運用知見を `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す |

## 実行タスク

1. 行数検査スクリプトを実行し、全 `.claude/skills/*/SKILL.md` が 200 行未満であることを確認する（完了条件: 全件 `OK` 出力 / `FAIL:` 0 件）。
2. SKILL.md → references の参照を `rg` で列挙し、各 reference path がファイルとして実在することを目視確認する（完了条件: リンク切れ 0 件）。
3. `references/<topic>.md` 群を `find` で列挙し、各 path が SKILL.md から少なくとも 1 回参照されていることを確認する（完了条件: 未参照 reference 0 件）。
4. canonical (`.claude/skills/<skill>`) と mirror (`.agents/skills/<skill>`) の `diff -r` を全対象 skill について実行する（完了条件: 差分 0）。
5. `task-specification-creator/SKILL.md` 単体について重点 smoke を実施する（行数 / リンク表 / トリガー / Anchors の保持確認）（完了条件: 単独 PASS）。
6. `link-checklist.md` に SKILL.md 内の references リンクを 1 行 1 件で列挙し、目視確認の `[x]` を付ける（完了条件: 全行 `[x]`）。
7. 既知制限（loader doctor の不在 / mirror 同期は手動 rsync 等）を `main.md` に列挙する（完了条件: 制限 3 件以上 + 委譲先記載）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/implementation-runbook.md | smoke 対象の切り出し手順 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-07/ac-matrix.md | AC × smoke 項目の対応 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-10/go-no-go.md | GO 判定の前提確認 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 機械的手順 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | 最優先 smoke 対象 |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既に分割済みの参考例 |

## 実行手順

### ステップ 1: 行数検査

```bash
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  if [[ $lines -ge 200 ]]; then
    echo "FAIL: $f = $lines lines"
  else
    echo "OK:   $f = $lines lines"
  fi
done | tee /tmp/skill-line-check.log
```

- 期待値: 全行が `OK:` で始まる。`FAIL:` が 1 件でも出れば Phase 4 へ差し戻し。
- 採取先: `outputs/phase-11/manual-smoke-log.md §1`

### ステップ 2: SKILL.md → references リンク列挙

```bash
for skill in .claude/skills/*/; do
  echo "=== $skill ==="
  rg -n 'references/' "$skill/SKILL.md" || echo "(no references)"
done | tee /tmp/skill-links.log
```

- 期待値: 各 skill で `references/<topic>.md` リンクが 1 件以上抽出される（分割対象 skill のみ）。
- 採取先: `outputs/phase-11/manual-smoke-log.md §2`

### ステップ 3: 未参照 reference の検出

```bash
for skill in .claude/skills/*/; do
  if [[ -d "$skill/references" ]]; then
    for ref in $(find "$skill/references" -type f -name '*.md'); do
      base=$(basename "$ref")
      rg -q "references/$base" "$skill/SKILL.md" \
        && echo "OK:   $ref" \
        || echo "ORPHAN: $ref"
    done
  fi
done | tee /tmp/skill-orphan-check.log
```

- 期待値: `ORPHAN:` 0 件。
- 採取先: `outputs/phase-11/manual-smoke-log.md §3`

### ステップ 4: canonical / mirror 差分検証

```bash
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  echo "=== $name ==="
  diff -r ".claude/skills/$name" ".agents/skills/$name" \
    && echo "DIFF: 0" \
    || echo "DIFF: NON_ZERO"
done | tee /tmp/skill-mirror-diff.log
```

- 期待値: 全 skill で `DIFF: 0`。
- 採取先: `outputs/phase-11/manual-smoke-log.md §4`

### ステップ 5: `task-specification-creator` 重点 smoke

```bash
# 行数（最優先 AC-9）
wc -l .claude/skills/task-specification-creator/SKILL.md

# Anchors / trigger / allowed-tools の残置確認
rg -n '^Anchors:|^trigger:|^allowed-tools:' .claude/skills/task-specification-creator/SKILL.md

# references リンク表の存在確認
rg -n 'references/' .claude/skills/task-specification-creator/SKILL.md
```

- 期待値: 行数 < 200 / Anchors・trigger・allowed-tools 残存 / references 表が複数行ヒット。
- 採取先: `outputs/phase-11/manual-smoke-log.md §5`

### ステップ 6: link-checklist.md の作成

`outputs/phase-11/link-checklist.md` に以下フォーマットで記録する。

```markdown
| skill | references path | 実在 | SKILL.md からの参照 |
| --- | --- | --- | --- |
| task-specification-creator | references/phase-templates.md | [x] | [x] |
| task-specification-creator | references/asset-conventions.md | [x] | [x] |
| ...（全対象 skill × references 分） | | | |
```

## 多角的チェック観点

- 価値性: 200 行未満 entrypoint で worktree 並列衝突が構造的に減るか。
- 実現性: 行数 / リンク / mirror diff の 3 検証コマンドが期待通り PASS するか。
- 整合性: AC-1〜AC-8 の証跡パスが Phase 7 の AC matrix と整合しているか。
- 運用性: canonical / mirror の同期がコマンド 1 発で再現可能か。
- 不変条件: 「機械的 cut & paste のみ」が守られているか（意味的書き換えが混入していないか sample diff で確認）。
- ドッグフーディング: `task-specification-creator/SKILL.md` 自身が 200 行未満を満たすか。

## manual evidence（採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| 行数検査 | `for f in .claude/skills/*/SKILL.md; do ... done` | outputs/phase-11/manual-smoke-log.md §1 | TBD |
| SKILL→references リンク列挙 | `rg -n 'references/' .claude/skills/<skill>/SKILL.md` | outputs/phase-11/manual-smoke-log.md §2 | TBD |
| 未参照 reference 検出 | `find ... && rg -q ...` | outputs/phase-11/manual-smoke-log.md §3 | TBD |
| canonical / mirror diff | `diff -r .claude/skills/<skill> .agents/skills/<skill>` | outputs/phase-11/manual-smoke-log.md §4 | TBD |
| task-specification-creator 重点 smoke | `wc -l` + `rg` | outputs/phase-11/manual-smoke-log.md §5 | TBD |
| link-checklist 目視確認 | 表形式で `[x]` 記入 | outputs/phase-11/link-checklist.md | TBD |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録する。実値の機密情報は本タスクには存在しない（docs-only）。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | skill loader doctor スクリプトが未提供（提供時のみ自動 smoke 可） | loader 自体の動作確認は手動目視のみ | skill-creator 側へ doctor 追加 issue を後続 wave で起票 |
| 2 | mirror 同期は手動 rsync / cp -r で実施（自動同期 hook なし） | canonical 修正時の人為ミス | B-1（gitattributes）以降で `merge=ours` の追加保護を検討 |
| 3 | 既存外部リンクが旧アンカー名を指している場合に検出できない | 他 workflow からの深いリンクは別途追跡が必要 | references 表で誘導を構造化（Phase 5 完了条件） |
| 4 | 200 行は機械的閾値であり、entry の意味的最小性は別途レビュー | 過剰削減 / 不足のリスク | Phase 2 分割設計表で残置項目を固定 |

## 統合テスト連携

docs-only / NON_VISUAL のため UI screenshot やアプリ統合テストは実行しない。Phase 11 では行数・リンク・未参照 reference・canonical / mirror diff を手動 smoke として採取する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 実行サマリー / 4 検証結果 / 既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | 5 セクション分の実行ログ |
| チェックリスト | outputs/phase-11/link-checklist.md | references リンク × skill のクロス表 |
| メタ | artifacts.json | Phase 11 状態の更新 |

> `outputs/phase-11/screenshots/` ディレクトリと `.gitkeep` は **作成しない**（NON_VISUAL）。

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブルの 6 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 行数検査で全 SKILL.md が `OK`（AC-1 / AC-6 / AC-9）
- [ ] `rg` リンク健全性検査でリンク切れ 0 件（AC-7）
- [ ] 未参照 reference 0 件（AC-8）
- [ ] canonical / mirror の `diff -r` が 0（AC-5）
- [ ] `task-specification-creator/SKILL.md` 単体が 200 行未満を満たしている（AC-9）
- [ ] 既知制限が 3 件以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1 / AC-5 / AC-6 / AC-7 / AC-8 / AC-9 の証跡採取コマンドが定義済み
- AC-2 / AC-3 / AC-4 / AC-10（Anchor 追記）は Phase 4 / Phase 5 / Phase 12 で担保されることが明記
- `outputs/phase-11/screenshots/` を作成しない旨が完了条件に明記
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - smoke 実行で得られた運用知見（mirror 同期の手動性 / loader doctor 不在等）を Phase 12 の `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - `task-specification-creator/SKILL.md` 単独 PR での 200 行未満化結果を Phase 13 の最優先 PR-1 に渡す
  - 既知制限 #1（loader doctor）/ #2（mirror 自動同期）を後続 wave へ register
- ブロック条件:
  - manual evidence の 6 項目に未採取 / 未 N/A 化が残っている
  - 行数検査で `FAIL:` が観測された（→ Phase 4 へ差し戻し）
  - canonical / mirror の `diff -r` が非 0（→ Phase 5 へ差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
