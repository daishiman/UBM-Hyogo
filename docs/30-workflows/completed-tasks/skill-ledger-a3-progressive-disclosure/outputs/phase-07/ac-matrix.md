# Phase 7 — AC マトリクス / トレーサビリティ

AC-1〜AC-11 を、検証カテゴリ V1〜V6 (Phase 4) × 対象 skill × failure case (Phase 6)
× evidence 保存先 × 対応 Phase に縦串で結ぶトレーサビリティマトリクス。

対象 skill 一覧 (Phase 1 inventory より、200 行検査の対象):

| skill 名 | wc -l (before) | 200 行超? | 本タスクの分割対象? |
| --- | --- | --- | --- |
| aiworkflow-requirements | 190 | no (既分割) | 対象外 (参考) |
| automation-30 | 432 | yes | 対象 |
| claude-agent-sdk | 324 | yes | 対象 |
| github-issue-manager | 363 | yes | 対象 |
| int-test-skill | 121 | no | 対象外 (既に薄い) |
| skill-creator | 402 | yes | 対象 |
| skill-fixture-runner | 99 | no | 対象外 |
| task-specification-creator | 517 | yes | **対象 (最優先・単独 PR / AC-9, AC-10)** |

---

## AC × 検証手段 × evidence × 対応 Phase

| AC# | AC 内容 | 検証手段 (V) | コマンド | PASS 判定基準 | evidence 保存先 | 対応 Phase | 関連 failure case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 全対象 SKILL.md が 200 行未満 | V1 | `bash outputs/phase-04/scripts/line-count.sh` | 全行 `OK:` / exit 0 | outputs/phase-11/manual-smoke-log.md (line-count セクション) | Phase 4 / 5 / 11 | F-4 |
| AC-2 | references が単一責務命名 | V3 + V6 | `bash outputs/phase-04/scripts/orphan-references.sh` + Phase 2 設計表突合 | 命名揺れ 0 / orphan 0 | outputs/phase-04/test-strategy.md + outputs/phase-11/manual-smoke-log.md | Phase 2 / 4 / 11 | F-5 |
| AC-3 | entry に固定 10 要素保持 | V5 + V6 | `outputs/phase-04/checklists/entry-checklist-template.md` 記入 | 10 要素すべて OK | outputs/phase-11/link-checklist.md | Phase 4 / 11 | F-2, F-5 |
| AC-4 | SKILL.md → references 片方向 / 循環なし | V2 (拡張) | `bash outputs/phase-04/scripts/link-integrity.sh` で reverse-link 0 件確認 + 依存グラフ目視 | 戻り参照 0 / 循環 0 | outputs/phase-11/link-checklist.md | Phase 2 / 4 / 8 / 11 | F-1, F-6 |
| AC-5 | canonical / mirror 差分 0 | V4 | `bash outputs/phase-04/scripts/mirror-diff.sh` | exit 0 / 全 OK | outputs/phase-11/manual-smoke-log.md (mirror-diff セクション) | Phase 5 / 9 / 11 | F-3 |
| AC-6 | 行数検査全件 OK | V1 | AC-1 と同コマンド | 全 OK | outputs/phase-11/manual-smoke-log.md | Phase 4 / 11 | F-4 |
| AC-7 | リンク切れ 0 件 | V2 | `bash outputs/phase-04/scripts/link-integrity.sh` | exit 0 | outputs/phase-11/link-checklist.md | Phase 4 / 11 | F-1 |
| AC-8 | 未参照 reference 0 件 | V3 | `bash outputs/phase-04/scripts/orphan-references.sh` | exit 0 | outputs/phase-11/link-checklist.md | Phase 4 / 11 | (F-1 系) |
| AC-9 | task-specification-creator が単独 PR で 200 行未満 | V1 + git log | `wc -l .claude/skills/task-specification-creator/SKILL.md` + `git log --oneline -- .claude/skills/task-specification-creator/SKILL.md` | < 200 / 単一 PR で完結 | outputs/phase-11/manual-smoke-log.md | Phase 5 / 9 / 11 | F-2, F-4 |
| AC-10 | 「fragment で書け」「200 行を超えたら分割」Anchor 追記 | V5 | `rg -n 'fragment で書け\|200 行を超えたら分割' .claude/skills/task-specification-creator/` | 2 フレーズが Anchor として存在 | outputs/phase-11/manual-smoke-log.md | Phase 5 (小 PR) / 11 | (F-5 経由) |
| AC-11 | 4条件最終判定 PASS | 全 V 横断 | Phase 10 go-no-go.md の判定 | 4 条件すべて PASS | outputs/phase-10/go-no-go.md | Phase 10 | F-5 |

---

## 対象 skill 個別 AC ステータス (spec_created 段階)

| skill 名 | 行数(before) | AC-1 | AC-2 | AC-3 | AC-4 | AC-5 | AC-6 | AC-7 | AC-8 | AC-9 | AC-10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| task-specification-creator (最優先) | 517 | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created |
| automation-30 | 432 | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | N/A | N/A |
| skill-creator | 402 | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | N/A | N/A |
| github-issue-manager | 363 | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | N/A | N/A |
| claude-agent-sdk | 324 | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | N/A | N/A |
| aiworkflow-requirements (既分割) | 190 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| int-test-skill | 121 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| skill-fixture-runner | 99 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

> AC-9 / AC-10 はドッグフーディング由来のため `task-specification-creator` のみ対象。それ以外は `N/A`。
> `aiworkflow-requirements` は既に references 分割済みのため A-3 スコープ外 (参考のみ)。
> `int-test-skill` / `skill-fixture-runner` は 200 行未満で分割不要。

---

## 検証コマンド一覧 (skill 名展開済み)

```bash
# AC-1 / AC-6: 行数検査 (全 skill)
bash outputs/phase-04/scripts/line-count.sh \
  | tee outputs/phase-11/evidence/line-count.log

# AC-7: リンク健全性 (全 skill)
bash outputs/phase-04/scripts/link-integrity.sh \
  | tee outputs/phase-11/evidence/link-integrity.log

# AC-8: 未参照 reference (全 skill)
bash outputs/phase-04/scripts/orphan-references.sh \
  | tee outputs/phase-11/evidence/orphan-references.log

# AC-5: canonical / mirror 差分 (全 skill)
bash outputs/phase-04/scripts/mirror-diff.sh \
  | tee outputs/phase-11/evidence/mirror-diff.log

# AC-9: 単独 PR 確認
git log --oneline -- .claude/skills/task-specification-creator/SKILL.md

# AC-10: Anchor 追記確認
rg -n 'fragment で書け|200 行を超えたら分割' \
  .claude/skills/task-specification-creator/

# AC-4: 戻り参照 0 件 (V2 内蔵 + 補助確認)
rg -n '\.\./SKILL\.md|\.\./\.\./SKILL\.md' .claude/skills/*/references/ \
  || echo "OK: 戻り参照 0"
```

---

## evidence 保存先の一意割当

| AC | evidence | 区分 |
| --- | --- | --- |
| AC-1, AC-5, AC-6, AC-9, AC-10 | outputs/phase-11/manual-smoke-log.md | 実測ログ (Phase 11) |
| AC-3, AC-4, AC-7, AC-8 | outputs/phase-11/link-checklist.md | 実測ログ (Phase 11) |
| AC-2 | outputs/phase-04/test-strategy.md + outputs/phase-11/manual-smoke-log.md | 命名規約 + 実測 |
| AC-11 | outputs/phase-10/go-no-go.md | 判定ドキュメント (Phase 10) |

---

## Phase 9 / 10 / 11 への引き継ぎ事項

- Phase 9 (品質保証): mirror 同期 (AC-5) と 1 PR = 1 skill (AC-9) を品質ゲートに昇格。
- Phase 10 (最終レビュー): 本マトリクスを GO/NO-GO 判定の根拠として転記。AC-9 / AC-10 を必須 GO 条件とする。
- Phase 11 (手動 smoke): 本マトリクスの「検証コマンド一覧」をそのまま実行し、`outputs/phase-11/evidence/` に証跡を残す。
- Phase 12 (compliance check): AC マトリクス全件が PASS でクローズされていることを `phase12-task-spec-compliance-check.md` で確認。

## トレーサビリティ完備の自己点検

- [x] AC-1〜AC-11 全件に検証手段 V が割当済み
- [x] AC-9 / AC-10 が `task-specification-creator` のみ対象であることが明示
- [x] `aiworkflow-requirements` / `int-test-skill` / `skill-fixture-runner` が `N/A` で除外
- [x] evidence 保存先が `outputs/phase-04/` または `outputs/phase-10/` または `outputs/phase-11/` のいずれかに一意割当
- [x] 関連 failure case (F-1〜F-6) が全 AC でいずれかにリンク
- [x] AC-11 が Phase 10 の最終判定に依存することが明記
