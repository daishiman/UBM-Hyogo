**[実装区分: 実装仕様書]**

# Phase 10: ドキュメント更新計画

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| 入力 | Phase 1-9 |
| 更新範囲 | skill 2 種（task-specification-creator / aiworkflow-requirements）+ workflow root artifacts |

## 1. 反映対象 skill / docs

| 対象 | パス | 反映内容 |
|---|---|---|
| task-specification-creator | `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾 | L-I911-001..005 を追記。「DELETE-race UI 二重 mutation pattern」「`treat404AsSuccess` の component 側責任分離」を汎化 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/lessons-learned/` 配下に lesson ファイル新規 | L-I911-001..005 を runtime 適用例として登録 |
| aiworkflow-requirements indexes | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | issue-911 workflow 導線追加 |
| aiworkflow-requirements task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active runtime-pending workflow として登録 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-911-meeting-attendance-unregister-ui-treat404-wiring-artifact-inventory.md` | 新規追加 |
| LOGS.md | `docs/30-workflows/LOGS.md` | 1 行 entry 追加 |

## 2. CLAUDE.md 更新

| 不変条件追加候補 | 判定 | 理由 |
|---|---|---|
| API 改変なし | 不要 | 既存「UI prototype alignment 不変条件 1」で表現済み |
| `treat404AsSuccess` の component 強制 | 不要 | hook 側で options 公開しているのが正本。本 task は利用例追加に過ぎず、新規不変条件化しない |
| `*.spec.tsx` 強制 | 不要 | CLAUDE.md 不変条件 8 で既存表現済み |

**結論**: CLAUDE.md 更新は **不要**（新規システム不変条件の追加なし）。

## 3. lessons-learned ドラフト（L-I911-001..005）

| ID | 主題 | 一行サマリ |
|---|---|---|
| L-I911-001 | DELETE-race の race=success 化 | 既存 API が POST `attended:false` で 404 を返す場合、UI 側は 404 を `treat404AsSuccess` で info toast に落とすことで race=success を実現する |
| L-I911-002 | 第 2 mutation 分離 | register と unregister は別 mutation インスタンスで構成し、`treat404AsSuccess` は unregister 側にだけ付与する（register 側 404 は A6b で失敗扱いを維持） |
| L-I911-003 | refreshOnSuccess false | 404 fallthrough 時は再 fetch 不発火を選択し、UI 楽観反映に閉じる |
| L-I911-004 | API 改変回避 | 新 DELETE route を起こさず既存 POST endpoint surface だけで MVP scope 内に閉じる（UI prototype alignment 不変条件 1） |
| L-I911-005 | NON_VISUAL evidence | Phase 11 は vitest 実行ログのみで `NON_VISUAL` 判定可能。screenshot 取得は不要 |

## 4. 反映方針（same-wave sync）

- 上記 skill / docs 反映と本 workflow `outputs/phase-12/**` 配置は **同一 commit wave** で行う。
- 親 workflow（issue-842）への back-reference 更新は Phase 13 commit に含める。

## 5. Phase 10 完了条件

- [x] 反映対象 skill / docs を確定
- [x] CLAUDE.md 更新判定（不要）を明示
- [x] L-I911-001..005 のドラフト主題を確定
- [x] same-wave sync 方針を確定

## 6. 次 Phase への引き継ぎ

Phase 11 では NON_VISUAL 判定の根拠と vitest 実行ログ evidence path を確定する。screenshot 取得は不要。
