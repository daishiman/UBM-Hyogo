# Phase 8: セキュリティ / 安全性

## 目的

CI gate 追加によるセキュリティリスク（誤 fail で merge 阻害 / secret 漏洩 / 副作用）を評価し、対策を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## リスク評価

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| 既存歴史的 root を block | Low | Medium | PR diff 限定 + `completed-tasks/` 配下も diff 含み時のみ評価 |
| script の正規表現で誤検知 | Low | Low | heading 文字列は完全一致（前後空白除去）。subsection 内容は検査しない |
| skill reference の改変が gate を素通り | Medium | Medium | reference を SSOT として参照、Required Sections 数（9）固定で drift 時 exit 2 |
| secret 露出 | None | None | script は read-only。token / secret に触れない |
| force merge 必要事態 | Low | Low | workflow を一時 disable / `continue-on-error: true` 切替で復旧 |

## 副作用ゼロの確認

- script は `node:fs` 読み取り + `git diff --name-only` のみ
- network access なし
- write 操作なし

## 完了条件

- [ ] リスク表完成
- [ ] forward-safe rollback 手順を `outputs/phase-08/main.md` に明記

## Next Phase

- [Phase 9](phase-09.md): テスト戦略
