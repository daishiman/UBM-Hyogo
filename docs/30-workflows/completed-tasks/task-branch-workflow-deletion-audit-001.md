# task-branch-workflow-deletion-audit-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | unassigned |
| Priority | High |
| Source | phase12-final-doc-update review |
| Type | branch-safety-audit |
| Created | 2026-05-01 |

## なぜこのタスクが必要か（Why）

本ブランチには UT-02A の実装差分とは別に、`docs/30-workflows/09a-*`、`09b-*`、`ut-06b-*` など複数 workflow 配下の大量削除が存在する。UT-02A 自体が正しくても、これらが意図しない削除であれば merge 時に正本仕様と成果物台帳を破壊する。

## 何を達成するか（What）

- 削除済み workflow ディレクトリが意図した移動・統合・legacy 化なのか、誤削除なのかを分類する。
- 意図した削除なら、legacy register / resource-map / quick-reference / task-workflow-active へ同一 wave で反映する。
- 誤削除なら、対象ファイルを復元する。
- UT-02A PR に混ぜるべきでない削除は別 PR / 別 task に分離する。

## どのように実行するか（How）

1. `git status --short` と `git diff --name-status` で削除ファイル一覧を確定する。
2. 各 workflow について current canonical location を `resource-map.md` と `legacy-ordinal-family-register.md` で確認する。
3. `intended move` / `legacy close-out` / `accidental deletion` / `out-of-scope` に分類する。
4. 分類ごとに復元・正本同期・別タスク分離を実行する。

## 完了条件チェックリスト

- [ ] 削除ファイル一覧が evidence として保存されている。
- [ ] 各 workflow の分類理由がある。
- [ ] 誤削除が 0 件、または復元済みである。
- [ ] 意図した移動は legacy register と indexes に反映済みである。
- [ ] UT-02A の変更範囲と branch-level cleanup の変更範囲が分離されている。

## 検証方法

```bash
git status --short
git diff --name-status -- docs/30-workflows
rg -n "09a-parallel-staging|09b-parallel-cron|ut-06b-profile" .claude/skills/aiworkflow-requirements docs/30-workflows
```

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 意図しない削除を UT-02A と一緒に merge する | branch-level blocker として PR 前に分類する |
| legacy 移動なのに register 未同期になる | legacy register / resource-map / quick-reference を同一 wave で更新する |
| 復元時にユーザー変更を上書きする | `git show HEAD:<path>` などで内容確認後、対象を限定して復元する |

## 参照情報

- `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 苦戦箇所【記入必須】

UT-02A のレビュー中に見つかったが、対象 workflow の意図までは UT-02A の仕様から判断できない。誤って復元するとユーザーの意図した移動を壊す可能性があるため、branch-level audit として独立管理する。

## スコープ（含む/含まない）

含む: docs/30-workflows 配下の大量削除分類、必要な復元、legacy/index 同期。

含まない: UT-02A resolver 実装、commit、push、PR 作成。
