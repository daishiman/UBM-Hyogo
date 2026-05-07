# Phase 12: ドキュメント更新

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-12/main.md` |

## 目的
Phase 12 必須 6 タスク（実装ガイド / システム仕様書更新 / 更新履歴 / 未タスク検出 / skill feedback / コンプライアンスチェック）と cursor runbook を作成する。

## 成果物（必須 7 ファイル + runbook）
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術者レベル。技術者レベルには「変更ファイル一覧」「主要シグネチャ」「検証結果」「スコープ外確認」を必ず含める）
- `outputs/phase-12/system-spec-update-summary.md`（`docs/00-getting-started-manual/specs/01-api-schema.md` への canonical absolute path での反映行を記載）
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須。`findByMemberIds` 一括ページング化は新規未タスクではなく、bulk API の明示スコープ外として記録）
- `outputs/phase-12/skill-feedback-report.md`（テンプレ改善 / ワークフロー改善 / ドキュメント改善 の 3 観点固定。改善点 0 件でも出力必須）
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/cursor-runbook.md`（cursor base64url JSON 仕様 / encode サンプル / クライアント実装ガイド / 不正値時のエラー仕様）

## システム仕様書同時更新
| ファイル | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `MemberProfile.attendanceMeta` 追加。`/me/attendance`, `/admin/members/:memberId/attendance` の request/response。 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | cursor インデックス使用と `(member_id, held_on, session_id)` の検索効率に関する一文（必要時）。 |

## 参照資料
- `outputs/phase-12/phase-12.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`

## 完了条件
- 必須 7 ファイル + cursor-runbook が実体ファイルで存在。
- system spec への canonical absolute path 反映行が `system-spec-update-summary.md` に記録。
- `phase12-task-spec-compliance-check.md` で全項 PASS。ただし runtime implementation が未実行の場合は `PASS_SPEC_READY_RUNTIME_PENDING` を使い、実装完了と混同しない。

## 実行タスク
- [ ] 必須 7 ファイル + runbook を作成する。
- [ ] system spec への反映を同 wave で commit に含める。

## 統合テスト連携
- Phase 12 は docs / evidence gate。`validate-phase-output` 系スクリプトと Phase 9 / 11 evidence を参照する。
