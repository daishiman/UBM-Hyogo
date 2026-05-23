# Phase 12: コンプライアンスチェック（必須 7 outputs）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 種別 | compliance / documentation |
| 入力 | Phase 11 evidence |
| 出力 | `outputs/phase-12/` 配下 7 ファイル |

## 必須 7 outputs

| # | ファイル | 用途 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | entry point。検証結果サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（開発者向け） |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 22 項目チェックリスト + 7 outputs path existence pre-check |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | parent spec / CLAUDE.md 追補要否 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | `lib/useAdminMutation` deprecation 等の未タスク検出 |
| 7 | `outputs/phase-12/documentation-changelog.md` | 全 Step 完了結果 |

## 7 outputs path existence pre-check（必須）

```bash
WF_DIR="docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker"
REQUIRED_7=(
  "outputs/phase-12/main.md"
  "outputs/phase-12/implementation-guide.md"
  "outputs/phase-12/phase12-task-spec-compliance-check.md"
  "outputs/phase-12/system-spec-update-summary.md"
  "outputs/phase-12/skill-feedback-report.md"
  "outputs/phase-12/unassigned-task-detection.md"
  "outputs/phase-12/documentation-changelog.md"
)
MISSING=0
for f in "${REQUIRED_7[@]}"; do
  [ -f "$WF_DIR/$f" ] && echo "OK: $f" || { echo "NG: $f"; MISSING=$((MISSING+1)); }
done
[ "$MISSING" -gt 0 ] && exit 1
```

exit 0 が確認されるまで `spec_verified` 昇格不可。

## 完了条件

- [ ] 7 outputs 全て物理存在
- [ ] `implementation-guide.md` に `## Part 1` / `## Part 2` 両方存在
- [ ] Part 1 に「なぜ」「例え」キーワード
- [ ] Part 2 に `interface`/`type`、API シグネチャ、エラー/エッジケース/設定
- [ ] 22 項目チェックリスト総合判定 PASS
- [ ] `artifacts.json` の phase-12 status が completed

## 次Phase

→ Phase 13（PR 作成 — ユーザー承認後）
