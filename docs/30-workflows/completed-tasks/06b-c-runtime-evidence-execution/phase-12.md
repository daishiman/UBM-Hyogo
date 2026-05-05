# Phase 12: implementation-guide / unassigned-task-detection 同期 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 12 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（docs sync） |
| user_approval_required | false |

## 目的

先行タスク `06b-C-profile-logged-in-visual-evidence` 側の Phase 12 strict 7 files、および本タスク自身の Phase 12 成果物を、Phase 11 の実測値で塗り替える。本タスクは「先行タスクの Phase 12 を runtime 実測で書き換える」のが正体なので、先行タスク側の実体ファイルを編集対象として明示する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 7 AC matrix、Phase 8 manual-smoke-evidence、Phase 9 secret check、Phase 11 runtime summary |
| 出力 | (1) 先行タスク `outputs/phase-12/` 配下 6 ファイルの runtime sync、(2) 本タスク `outputs/phase-12/` 配下 7 ファイルの作成 |

## 12.1 先行タスク側の更新（runtime 実測への塗り替え）

更新対象ファイル一覧（実体は `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/` 配下）:

| ファイル | 更新内容 |
| --- | --- |
| `implementation-guide.md` | 実測 command（redact 済） / 生成 evidence path 一覧 / runtime PASS or FAIL or BLOCKED 集計 / 中学生レベル概念説明（再確認） |
| `unassigned-task-detection.md` | invariant 違反検出時の follow-up タスク draft（M-09 / M-10 で counts > 0 だった場合）。違反なしなら「検出なし（runtime 実測 2026-05-04 時点）」と明記 |
| `phase12-task-spec-compliance-check.md` | Phase 11 status を `pending` → `completed` 等に更新。runtime PASS / FAIL / BLOCKED と 13 phase の DoD 充足を再判定 |
| `skill-feedback-report.md` | 本 runtime execution 経由で気付いた task-specification-creator skill への feedback（example: VISUAL_ON_EXECUTION の runtime follow-up タスクを別 workflow root として切り出す pattern が有効だった等） |
| `system-spec-update-summary.md` | 通常は「変更なし」のまま。invariant 違反検出時のみ specs/06-member-auth.md / 07-edit-delete.md への影響を記載 |
| `documentation-changelog.md` | runtime 実測記録の日付・更新したファイル一覧・本タスクの workflow root path |

更新時の注意:

- secret 値（token / cookie / session / email 実値）を絶対に転記しない
- 実 base URL の hostname 部分も `<approved-target>` でマスクして転記（host が漏れると attack surface 推測材料になる）
- evidence path は **先行タスク canonical root** (`docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/`) で記載

## 12.2 本タスク側の Phase 12 成果物（strict 7 files）

ファイル: `docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-12/`

| ファイル | 役割 |
| --- | --- |
| `main.md` | Phase 12 index（7 files 実体確認チェック） |
| `implementation-guide.md` | 本タスク（execution）の概要 / 中学生レベル説明 / 触ったファイル / 実行 command（redact 済） / evidence path / 先行タスク側更新差分 |
| `system-spec-update-summary.md` | 通常「変更なし」。invariant 違反時のみ specs 影響を記載 |
| `unassigned-task-detection.md` | M-14 / M-15 BLOCKED 時の follow-up（SMTP 設定 / OAuth client 設定）／ invariant 違反 follow-up ／ 検出なしの場合「検出なし」明記 |
| `phase12-task-spec-compliance-check.md` | 本タスク 13 phase の DoD 遵守チェック（CONST_004 / CONST_005 / CONST_007） |
| `skill-feedback-report.md` | 「テンプレ改善 / ワークフロー改善 / ドキュメント改善」3 観点。execution-only follow-up workflow を独立 root として作る pattern の妥当性 |
| `documentation-changelog.md` | 本 workflow root + 先行タスク phase-11 / phase-12 への変更点 |

### 中学生レベル概念説明（implementation-guide.md Part 1 用 draft）

> 「すでに用意されたテストの再生ボタンを押して、画面の写真と中身チェックを実環境で撮るだけのタスク」。本物のお店（staging / local）に対して、ログイン済みカード（storageState）を使い、ロボット（Playwright）が `/profile` ページを開いてスクショと中身データを保存する。スクショを保存する場所は決まった棚（先行タスクの outputs/phase-11/）。撮ったあと、ログイン情報や合言葉が写真や日記（docs）に映り込んでいないかを最後に必ずチェックする。

### 技術者レベル説明（implementation-guide.md Part 2 用骨格）

- 触ったファイル一覧（先行タスク側 6 ファイル + 本タスク `outputs/` 13 ディレクトリ）
- 実行 command（redact 済 wrapper invocation）
- exit code / file count / counts 検査結果
- redaction matrix の適用箇所
- invariant #4 / #5 / #11 の確認結果
- 先行タスク Phase 12 strict 7 files への runtime sync 差分

## 12.3 path drift の Phase 12 整合性チェック

```bash
# 先行タスク Phase 12 strict 7 files が実体存在
for f in main.md implementation-guide.md system-spec-update-summary.md unassigned-task-detection.md phase12-task-spec-compliance-check.md skill-feedback-report.md documentation-changelog.md; do
  test -f "docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/$f" \
    && echo "OK: $f" \
    || echo "MISSING: $f"
done

# 本タスク Phase 12 strict 7 files が実体存在
for f in main.md implementation-guide.md system-spec-update-summary.md unassigned-task-detection.md phase12-task-spec-compliance-check.md skill-feedback-report.md documentation-changelog.md; do
  test -f "docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-12/$f" \
    && echo "OK: $f" \
    || echo "MISSING: $f"
done
```

両方とも全 7 ファイル `OK` であること。

## 完了条件チェックリスト

- [ ] 先行タスク Phase 12 配下 6 ファイル（main.md は既存）が runtime 実測で更新
- [ ] 本タスク Phase 12 配下 strict 7 files が新規作成
- [ ] `implementation-guide.md` Part 1 / Part 2 が両方ある
- [ ] redaction 検査済（Phase 9 の検査を再走させる）
- [ ] path drift なし（legacy stub 配下に書き込んでいない）
- [ ] `outputs/phase-12/main.md` に 7 files 実体確認 chunk が記載

## 次 Phase への引き渡し

Phase 13 へ「Phase 12 同期済 / strict 7 files 揃った状態」を引き渡す。Phase 13 は user 承認待ち commit / PR の blocked placeholder のみ。
