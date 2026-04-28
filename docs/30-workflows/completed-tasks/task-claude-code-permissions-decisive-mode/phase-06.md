# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 |
| 下流 | Phase 7 (カバレッジ確認) |
| 状態 | pending |

## 目的

Phase 4 の主シナリオに加え、fail path / 回帰 guard を補強する。本タスクは設定変更タスクのため「補助手動シナリオの追加」を主眼とする。

## 追加シナリオ

### TC-F-01: 不正な `defaultMode` 値の検出

| 項目 | 内容 |
| --- | --- |
| 操作 | `~/.claude/settings.json` に `"defaultMode": "invalidValue"` を一時的に設定 |
| 期待 | claude 起動時にエラー / フォールバック挙動が確認できる |

### TC-F-02: alias 書き換えミス（typo）

| 項目 | 内容 |
| --- | --- |
| 操作 | `--dangerously-skip-permision`（typo）で起動 |
| 期待 | unknown flag エラー、alias バックアップで即時復旧可能 |

### TC-R-01: 後続タスクが alias を再書き換えた場合の検出

`~/.zshrc` の `cc` 行を grep する確認手順を Phase 12 implementation-guide にも記載する。

```bash
grep -n "alias cc=" ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null
```

## 回帰 guard

- claude session が ungracefully 終了した後でも、再起動で bypass が維持されること
- `mise install` / Node version 切替後も alias が効くこと

## 主成果物

- `outputs/phase-6/main.md`

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 追加 TC-F / TC-R が `outputs/phase-6/main.md` に明記される
- Phase 11 で再利用可能な形に整っている

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 5: `outputs/phase-5/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

