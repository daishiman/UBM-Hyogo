# 着手前 announce テンプレート

A-3（SKILL.md の Progressive Disclosure 分割）は対象 SKILL.md を単独 PR で大きく書き換えるため、並列で同 SKILL.md を編集する他タスクとの衝突が確実に発生する。着手前に skill 単位で必ず announce すること。

---

## announce の場所

- GitHub Issue #131（A-3 親 Issue）にコメント
- もしくは社内チャット（用途に応じて）

## announce 雛形

```markdown
### A-3 着手 announce

- **対象 skill**: `<skill-name>`
- **対象 ファイル**: `.claude/skills/<skill-name>/SKILL.md` および `.agents/skills/<skill-name>/SKILL.md`
- **ブランチ**: `skill-ledger/a3-<skill-name>`
- **想定期間**: <着手予定日> 〜 <PR 作成予定日>
- **作業内容**:
  - SKILL.md からの topic 切り出し（cut & paste のみ）
  - references/<topic>.md 新規作成
  - canonical / mirror 同期
- **影響範囲**:
  - `.claude/skills/<skill-name>/**`
  - `.agents/skills/<skill-name>/**`
  - 他 skill には触らない
- **依頼**: 上記期間中は当該 SKILL.md への変更を控えてください。割り込みが必要な場合はこのスレッドで調整します。
```

---

## announce 後のチェックリスト

- [ ] 対象 SKILL.md に対する未マージ PR がないことを確認（`gh pr list --search "in:title <skill-name>"`）
- [ ] 対象 SKILL.md に対する WIP ブランチが他 worktree に存在しないことを確認
- [ ] A-1（gitignore）/ A-2（fragment）が完了済であることを確認
- [ ] Phase 2 分割設計表 `outputs/phase-02/split-design.md` で行数見積もり < 200 を確認

すべてチェックが入ってから Step 0〜5 に着手する。

---

## 衝突回避ルール

- **1 PR = 1 skill 分割**を厳守。複数 skill を 1 PR にまとめない。
- **Anchor 追記は別 PR**。本体 PR には含めない。
- 期間中に他タスクから当該 SKILL.md への変更要望が来た場合は、A-3 PR マージ後に rebase して取り込む方針を案内する。
