# task-specification-creator SKILL.md line limit split - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | TASK-SKILL-TASKSPEC-CREATOR-LINE-LIMIT-001 |
| タスク名 | task-specification-creator SKILL.md line limit split |
| 分類 | 改善 |
| 対象機能 | `.claude/skills/task-specification-creator/SKILL.md` |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `skill-md-codex-validation-fix` Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

`task-specification-creator/SKILL.md` が 500 行制限を超過しており、`quick_validate.test.js` の既存失敗原因になっている。Phase 12 close-out のたびに同じ既知失敗が残り、skill validation の信頼性が下がる。

## 2. 何を達成するか（What）

- `SKILL.md` を 500 行以内に収める
- 詳細ルールを `references/` に分割し、`SKILL.md` は入口とナビゲーションに限定する
- `quick_validate.test.js` の該当失敗を解消する

## 3. どのように実行するか（How）

1. `SKILL.md` の長大セクションを棚卸しする
2. Phase 詳細・運用知見・長い表を `references/` へ移す
3. `SKILL.md` から移動先へリンクする
4. `node .claude/skills/skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator` を実行する
5. 関連 LOGS と Phase 12 成果物へ反映する

## 4. 完了条件

- `SKILL.md` が 500 行以内
- quick_validate の line-limit エラーが 0
- 移動した知識へのリンク切れがない

## 5. 苦戦箇所・知見（Lessons）

- **行数制限を SKILL.md 単体で達成しようとするとリンク切れが多発する**: `task-specification-creator` は Phase 1-13 と運用知見を 1 ファイルに詰め込んでおり、機械的に分割すると Phase 間の参照（例: Phase 12 → Phase 11 evidence template）が壊れる。`references/` 移送時は「節の移動先」と「アンカー再リンク」を pair で記録する必要がある。
- **既存 quick_validate 失敗が複合要因**: 本タスクの line-limit 失敗単独で考えがちだが、reference link / warning severity 系失敗（別タスク 2 件）と症状が交錯する。先に line-limit を解いても他 2 件未着手なら test 全体は GREEN にならないことを Phase 11 で経験した。タスク並走時は「testID と原因タスクの mapping」を成果物に残すと再発防止になる。
- **skill-creator 側ガードとの相互作用**: `skill-md-codex-validation-fix` で導入した二段ガード（生成時 + 書込時）は description / anchors 件数しか見ない。500 行制限ガードは未実装のため、本タスク完了後に skill-creator のテンプレ側へも 500 行 assertion を付けることを推奨（再発防止）。

## 6. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 機械的に分割すると Phase 1-13 の節間相互参照（特に Phase 12 → Phase 11 evidence）が壊れる | 高 | 移送対象の節ごとに「移動元 anchor → 移動先 path#anchor」のマッピング表を Phase 1 アウトプットに残し、`grep -rn '\\[.*\\](.*SKILL\\.md#'` で旧 anchor 参照 0 を確認してから commit |
| 500 行を超えた SKILL.md が CI 以外（手動編集）で再増殖する | 中 | 本タスク内で skill-creator テンプレ側 (`scripts/utils/validate-skill-md.js`) に `MAX_SKILL_MD_LINES = 500` の assertion 追加を提案 PR として併走 |
| `references/` 配下にファイルが増え過ぎ、Progressive Disclosure の起点が見えなくなる | 中 | `references/resource-map.md` を新設（または更新）し、SKILL.md からは resource-map 経由でのみ詳細へ遷移する規約を明記 |
| 他の未タスク（warning severity / fixture link）と quick_validate の失敗が交絡し、単独完了でも GREEN にならない | 中 | Phase 1 で 3 タスクの testID マッピングを表で残し、本タスク単独完了時の期待は「line-limit 系テストのみ GREEN」と明示 |

## 7. 検証方法

### 単体検証

```bash
mise exec -- node .claude/skills/skill-creator/scripts/quick_validate.js \
  .claude/skills/task-specification-creator
wc -l .claude/skills/task-specification-creator/SKILL.md
```

期待: quick_validate の line-limit エラー 0 件。`wc -l` の結果が 500 以下。

### 統合検証

```bash
mise exec -- node --test .claude/skills/skill-creator/scripts/__tests__/
grep -rn "](SKILL.md#" .claude/skills/task-specification-creator/ | wc -l
```

期待: テスト全件 PASS。`SKILL.md#anchor` 形式の旧リンクが 0 件（全て `references/*` に移送済）。

## 8. スコープ

### 含む

- `.claude/skills/task-specification-creator/SKILL.md` の 500 行以内化
- 詳細 Phase 説明・運用知見・長大表の `.claude/skills/task-specification-creator/references/` 配下への移送
- 移送先への anchor 再リンク
- quick_validate の line-limit 系失敗ケースの GREEN 化

### 含まない

- skill-creator 本体への `MAX_SKILL_MD_LINES` ガード実装（→ 別タスクとして提案 PR 化）
- 他スキル（`automation-30` / `aiworkflow-requirements` 等）の SKILL.md 行数調整（→ それぞれ個別タスク化）
- Phase 1-13 のロジック変更（純粋な分割であり仕様変更は伴わない）

