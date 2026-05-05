# Phase 11: 実測結果を Phase 11 outputs に保存 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 11 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution / evidence finalization） |
| user_approval_required | **true**（実環境アクセス + 認証情報利用結果の最終承認） |

## 目的

Phase 5–10 で取得 / 検査 / 修復した evidence を、先行タスク `outputs/phase-11/` の正本配置として最終確定し、`outputs/phase-11/main.md`（先行タスク側）に runtime summary を書く。本タスク側にも `outputs/phase-11/main.md` の runtime summary index を残す。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 5 evidence、Phase 6 検査結果、Phase 7 AC matrix、Phase 8 manual-smoke-evidence、Phase 9 secret check、Phase 10 retry log |
| 出力 | (1) 先行タスク `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/main.md` を runtime 実測サマリで更新、(2) 本タスク `outputs/phase-11/main.md` に summary index を作成 |

## user approval gate

実 evidence ファイル一覧（path のみ）と AC 判定サマリを user に提示し、以下 3 項目の承認を取る:

1. 取得済 evidence の最終配置（先行タスク outputs/phase-11/ 配下）を承認
2. AC 判定サマリ（OK / FAIL / BLOCKED の件数）を承認
3. これ以降の Phase 12 docs sync に進んでよいか承認

承認が得られるまで Phase 12 に進まない。

## 11.1 先行タスク `outputs/phase-11/main.md` の更新

ファイル: `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/main.md`

更新内容（runtime summary 章を追加 or 既存セクションを書き換え）:

```md
## Runtime Evidence Summary（2026-05-04 実測）

| Marker | 判定 | evidence path | 備考 |
| --- | --- | --- | --- |
| M-08 | captured / fail / blocked | screenshots/M-08-{desktop,mobile}-{date}.png | … |
| M-09 | captured / fail / blocked | dom/M-09-no-form-{desktop,mobile}.json (counts={form,input,textarea,submit,editLink}) | … |
| M-10 | captured / fail / blocked | dom/M-10-edit-query-ignored-{desktop,mobile}.json + screenshots/M-10-{desktop,mobile}-{date}.png | … |
| M-14 | captured / blocked | screenshots/M-14-flow-{date}.png | … |
| M-15 | captured / blocked | screenshots/M-15-flow-{date}.png | … |
| M-16 | captured / fail / blocked | screenshots/M-16-redirect-{date}.png | … |

### 実行 command（redact 済）
```bash
mise exec -- bash scripts/capture-profile-evidence.sh \
  --base-url <approved-target> \
  --storage-state apps/web/playwright/.auth/state.json \
  --out-dir docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11 \
  --markers M-08,M-09,M-10,M-16
```

### 実行結果
- exit code: 0
- screenshot 件数: N
- DOM dump 件数: N
- redaction PASS / FAIL: PASS
- secret grep PASS / FAIL: PASS

### invariant 違反
- なし / または検出（→ Phase 12 unassigned-task-detection 参照）
```

## 11.2 本タスク `outputs/phase-11/main.md` の作成

ファイル: `docs/30-workflows/06b-c-runtime-evidence-execution/outputs/phase-11/main.md`

内容: 実 evidence 自体は先行タスクに置くため、本タスク側は **summary index** とする。

```md
# Phase 11 — runtime evidence summary index

## evidence 正本（先行タスク配下）
- screenshots: docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/
- DOM dumps: docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/
- smoke 一覧: docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/manual-smoke-evidence.md

## AC 集計
- OK: N
- FAIL: N
- BLOCKED: N

## user approval log
- approved by: <user>
- approved at: <ISO8601>
- target base URL: <approved-target>
```

## 11.3 path drift の最終検査

```bash
# 禁止 path に書き込んでいないこと
test ! -d docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/ && echo "OK: legacy stub absent" || echo "WARN: legacy stub exists"
test ! -d docs/30-workflows/02-application-implementation/06b-C-profile-logged-in-visual-evidence/ && echo "OK: legacy 02-app stub absent"

# 正本に実体があること
ls docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/ | wc -l
ls docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/dom/ | wc -l
```

## 完了条件チェックリスト

- [ ] 先行タスク `outputs/phase-11/main.md` に runtime summary が記載
- [ ] 本タスク `outputs/phase-11/main.md` に summary index が記載
- [ ] 正本 path 配下に evidence が物理的に存在（screenshot ≥ 5 / DOM dump ≥ 4）
- [ ] 禁止 path への書き込みなし
- [ ] user approval log（target / timestamp / approver）が記録

## 次 Phase への引き渡し

Phase 12 へ「実測値で確定済の Phase 11 outputs」を引き渡す。Phase 12 は `implementation-guide.md` などを runtime 実測値に同期する。
