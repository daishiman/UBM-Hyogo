# Manual Smoke Log

## TC-MAN-03: skill-creator codex_validation 全件実行

```bash
$ cd .claude/skills/skill-creator
$ mise exec -- npx vitest run scripts/__tests__/codex_validation.test.js --reporter=basic
 RUN  v2.1.9 /.../.claude/skills/skill-creator
 ✓ scripts/__tests__/codex_validation.test.js (28 tests) 1235ms
 Test Files  1 passed (1)
      Tests  28 passed (28)
```

→ ✅ 28/28 PASS

## TC-MAN-04: 実 SKILL.md を validateSkillMdContent に通す

```bash
$ node -e "
import('./.claude/skills/skill-creator/scripts/utils/validate-skill-md.js').then(({validateSkillMdContent}) => {
  const fs = require('fs');
  for (const s of ['aiworkflow-requirements','automation-30','skill-creator']) {
    const c = fs.readFileSync('.claude/skills/' + s + '/SKILL.md','utf-8');
    const r = validateSkillMdContent(c);
    console.log(s + ': ok=' + r.ok + ' descLen=' + r.description.length + ' errs=' + r.errors.length);
  }
});"
aiworkflow-requirements: ok=true descLen=638 errs=0
automation-30: ok=true descLen=130 errs=0
skill-creator: ok=true descLen=696 errs=0
```

→ ✅ 3/3 ok=true、全て R-04 (≤1024) 準拠

## TC-MAN-01 / TC-MAN-02 (環境依存・ユーザ手動確認)

| ID | 確認手順 | 期待 |
|----|---------|------|
| TC-MAN-01 | `codex --help` を実行し "Skipped loading" 文字列が無いこと | warning 0 |
| TC-MAN-02 | 新規 Claude Code セッションを開始し最初の system reminder を目視 | warning 無し |

これらはユーザ環境での Codex CLI / Claude Code 起動を伴うため、本タスクの自動 smoke では実行せず、ユーザ確認時に追記する欄として残す。

## TC-MAN-05: init_skill.js Anchors 退避（設計検証）

`scripts/generate_skill_md.js` 内の `writeOverflowReferences(skillDir, anchorsOverflow, triggerKeywordsOverflow)` 関数を読み解き、Anchors > 5 / Trigger keywords > 15 のとき superflous 分が `references/anchors.md` / `references/triggers.md` に書き出される動作をコード上で確認した。dry-run 経路の追加は本タスクのスコープ外。

## ソースレベル PASS と環境ブロッカー

| 区分 | 内容 | 状態 |
|------|------|------|
| source-level | TC-MAN-03 / TC-MAN-04 / TC-MAN-05 | ✅ PASS |
| 環境依存 | TC-MAN-01 / TC-MAN-02 | ユーザ手動確認待ち（記録欄保留） |
| 環境ブロッカー | なし | - |
