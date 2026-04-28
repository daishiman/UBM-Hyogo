# Skill Ledger Progressive Disclosure — A-3 SKILL.md 200 行ガード

> 最終更新日: 2026-04-28
> 対象: A-3 / `task-skill-ledger-a3-progressive-disclosure`
> 出典: `outputs/phase-7/main.md` / `outputs/phase-7/skill-split-runbook.md` / `outputs/phase-12/implementation-guide.md`
> 親ルール: `spec-splitting-guidelines.md`（classification-first）
> 前提: A-1 / A-2 完了

## 1. 目的

200 行を超える `.claude/skills/*/SKILL.md` を、200 行未満の **entrypoint** と `references/<topic>.md` ファミリへ Progressive Disclosure 方式で分割し、worktree 並列編集時の merge conflict を構造的に防ぐ。

## 2. 行数ガード

| 対象 | 上限 | 措置 |
| --- | --- | --- |
| `SKILL.md` | 200 行未満 | 超過時は分割必須 |
| 各 `references/<topic>.md` | 500 行以内 | 超過時は同一トピックでさらに分割 |

行数検査:

```bash
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  if [[ $lines -ge 200 ]]; then
    echo "FAIL: $f = $lines lines"
  else
    echo "OK:   $f = $lines lines"
  fi
done
```

## 3. SKILL.md（entry）に残す要素

loader が必要とする最小要素のみ。詳細は references へ。

| 要素 | 役割 |
| --- | --- |
| front matter | name / description / allowed-tools / trigger |
| 概要 5〜10 行 | skill の目的サマリ |
| trigger 条件 | いつ起動するか |
| Anchors | 参照する外部規約・原則 |
| クイックスタート | 最小 workflow の流れ |
| モード一覧 | 利用モード（collaborative / orchestrate 等） |
| agent 導線 | サブエージェント呼び出し関係 |
| references リンク表 | `\| topic \| path \|` 形式 |
| 最小 workflow | 起動 → 完了までの最短経路 |

## 4. references への抽出ルール

- 単一責務原則で命名（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`）
- references 同士で循環参照を作らない
- references から SKILL.md への戻り参照は作らない（片方向）
- 機械的な cut & paste のみ。意味的な書き換えは別タスク

## 5. classification-first との関係

`spec-splitting-guidelines.md` の classification-first ルールに従い、行数を基準にするのではなく **責務（topic）** を基準に分割する。同一 family の rename は `legacy-ordinal-family-register.md` に記録する。

200 行ガードはあくまで「責務集中の臭い」を検知する threshold。超過したら分類軸を再考する。

## 6. mirror 同期

| ロケーション | 役割 |
| --- | --- |
| canonical | `.claude/skills/<skill>/` |
| mirror | `.agents/skills/<skill>/` |

両者の差分は 0 でなければならない。

```bash
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  diff -r ".claude/skills/$name" ".agents/skills/$name" || true
done
```

## 7. リンク健全性検証

```bash
# SKILL.md からの references 参照
for skill in .claude/skills/*/; do
  rg -n 'references/' "$skill/SKILL.md" || true
done

# 未参照 reference の検出
find .claude/skills/<skill>/references -type f -name '*.md' \
  | while read f; do
    base=$(basename "$f")
    grep -rq "references/$base" .claude/skills/<skill>/SKILL.md || echo "UNREFERENCED: $f"
  done
```

完了条件: リンク切れ 0 / 未参照 reference 0 / canonical = mirror。

## 8. 完了条件

- 全対象 SKILL.md が 200 行未満
- references が単一責務で命名・配置
- entry に loader 必須要素（trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線）が保持
- SKILL.md → references の参照は片方向
- canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分 0
- evidence: `outputs/phase-11/evidence/<run-id>/a3/`

## 9. 苦戦箇所

| 項目 | 内容 |
| --- | --- |
| 症状 1 | 既存ドキュメント・他 skill から SKILL.md 内部アンカーへの大量リンクで、分割により参照切れ |
| 対応 1 | 分割後 SKILL.md 末尾に references リンク表を必ず置き、外部リンクが references へ自然に誘導される構造にする |
| 症状 2 | entry 残置 / references 移送の境界判断が skill ごとに揺れる |
| 対応 2 | §3 の固定リストで揃える。skill-creator 側に 200 行未満テンプレを組み込み肥大化を未然防止 |
| 症状 3 | 並列で同一 SKILL.md を編集する他タスクと衝突 |
| 対応 3 | 1 PR = 1 skill 分割を厳守。タスク開始時に skill 単位で announce |

## 10. 関連 references

- `skill-ledger-overview.md`
- `spec-splitting-guidelines.md`（classification-first 親ルール）
- `skill-ledger-fragment-spec.md`（A-2 前提）
- `skill-ledger-gitignore-policy.md`（A-1 前提）
- `lessons-learned-skill-ledger-redesign-2026-04.md`
- `legacy-ordinal-family-register.md`（rename 履歴の置き場所）
