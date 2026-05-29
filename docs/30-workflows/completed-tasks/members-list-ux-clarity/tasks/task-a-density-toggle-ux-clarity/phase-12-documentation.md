<!-- workflow: members-list-ux-clarity / task: A / phase: 12 -->

# Phase 12 — ドキュメント同期 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

> parent + sub-workflow 構造のため、Phase 12 strict 7 は親root `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/` に集約する。本sub task配下にstrict 7を複製しない。

## 1. Phase 12 出力物 (parent root 集約)

| 成果物 | 配置先 | 内容 |
| ------ | ------ | ---- |
| strict 7 | 親root `../../outputs/phase-12/` | 親rootに集約 |

## 2. `implementation-guide.md` 構成方針

### Part 1 — 中学生レベル概念説明

例え話:
- 「お店の棚の並べ方を選ぶリモコン」と例える
- ゆったり = 商品 1 つ 1 つを大きく並べる / 密 = 棚に多く並べる / リスト = 名前だけ縦に並べる
- なぜ必要か (各人の探し方が違うから) → 何をするか (3 つから選ぶリモコンに「説明文」と「？マーク」をつけた)

### Part 2 — 技術者レベル

- `DensityOption` 型・OPTIONS const の責務
- `Segmented` 型拡張 (`sublabel?`, `ariaDescribedBy?`)
- `HelpHint` props と `<details>` ベースの理由
- `aria-describedby` + visually-hidden span 配置パターン
- URL query SSOT 維持 (`density` 操作のみ)
- 視覚証跡: Phase 11 screenshot 6 枚を参照
- エッジケース: items 空配列 / triggerLabel 空文字
- 設定可能な定数: OPTIONS 配列の `iconHint` (将来拡張余地)

## 3. `system-spec-update-summary.md` 判定

| Step | 判定 | 内容 |
| ---- | ---- | ---- |
| Step 1-A | 必須 | 完了タスク記録 (`tasks/task-a-density-toggle-ux-clarity/` 完了) + LOGS.md x2 + topic-map |
| Step 1-B | 必須 | 親 workflow `index.md` のタスク表で Task A status を `completed` に更新 |
| Step 1-C | 必須 | 親 `artifacts.json` の gates / phases で Task A 完了を反映 |
| Step 2 | 条件 | 新規インターフェース (`SegmentedOption.sublabel?` / `HelpHint`) を追加したため **必要**。`apps/web` の primitives 仕様書 (該当があれば) または design-tokens.md の補足に記録 |

## 4. `documentation-changelog.md` ブロック構成

```
## workflow-local 同期
- tasks/task-a-density-toggle-ux-clarity/ 内 phase-1〜13 + outputs/phase-11, phase-12 配置完了
- 親 workflow index.md / artifacts.json 更新

## global skill sync
- .claude/skills/task-specification-creator/LOGS.md 追記
- .claude/skills/aiworkflow-requirements/LOGS.md 追記
- topic-map / quick-ref / resource-map 更新
```

## 5. `unassigned-task-detection.md` 候補

| 候補 | 判定 |
| ---- | ---- |
| 複数 DensityToggle 並走時の id 重複対策 (RA-4) | 現状未発生 → backlog 候補として記録、本サイクルでは未起票 |
| HelpHint click-outside 自動 close | スコープ外、要望未発生 |
| `?` icon SVG 化 | スコープ外 |

→ 起票要否は Phase 12 実行時に user-gated で最終判定。0 件のときも本ファイルは出力する。

## 6. `skill-feedback-report.md` 観点

- Phase 4 で既存 spec 互換維持 (AC-A5/A6) を明示する重要性
- Segmented option 型の optional 拡張パターンの再利用性
- `<details>` ベース popover を新 primitive 化せず feature レベルに留める判断基準

## 7. `phase12-task-spec-compliance-check.md`

- canonical 9 headings の存在確認
- `outputs/phase-11/screenshots/` 6 枚 + metadata 整合
- artifacts.json の gate enum / phase status / canonical_workflow path 整合
- HEX 直書き 0 件・新 primitive 0 件の grep 証跡

## 8. 実行手順 (Phase 12 着手時)

1. `outputs/phase-11/` を確定 (screenshots 6 枚 + metadata + result.md)
2. 親root `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` へ内容を集約
3. 親 `index.md` / `artifacts.json` の Task A status を `completed` / `phase12_completed` に更新
4. `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行 (indexes 再生成)
5. `node scripts/validate-phase-output.js docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-a-density-toggle-ux-clarity` で gate-metadata 検証
6. `verify:phase12-compliance` (root script) で hasCompletedTasksAncestor / canonical 9 headings 整合確認

## DoD

- [ ] strict 7 成果物全てを親root `../../outputs/phase-12/` に配置
- [ ] Step 1-A〜1-C + Step 2 判定完了
- [ ] LOGS.md x2 同 wave 更新
- [ ] indexes 再生成完了 (idempotent 確認)
- [ ] gate-metadata 0 ERROR
- [ ] verify:phase12-compliance PASS
