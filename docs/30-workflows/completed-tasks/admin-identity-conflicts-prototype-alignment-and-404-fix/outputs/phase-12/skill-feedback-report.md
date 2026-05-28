# Skill feedback report

仕様書作成・実装サイクルで判明した skill (aiworkflow-requirements / task-specification-creator) への feedback 候補。

## 確認済み skill 規約 (本仕様書で適用したもの)

- Phase 1-13 の outputs ディレクトリ構造
- Phase 12 strict 7 outputs を parent root に集約 (本 workflow は単独 workflow)
- Phase 12 canonical 9 headings (`phase12-task-spec-compliance-check.md`)
- Phase 11 evidence file inventory 表 (`## 4.` 番号付き見出し、status は present / pending / n/a / user-gated の lowercase)
- 状態語彙: `spec_created` → `implemented_local_visual_evidence_captured` → `implementation_completed` (PASS 単独表記禁止)
- `*.spec.{ts,tsx}` 命名規約 (CLAUDE.md 不変条件 #8)
- CONST_004 (実装区分明記) / CONST_005 (実装仕様書 5 必須項目: 背景 / 要約 / 実装ステップ / 検証コマンド / 既知制限) / CONST_007 (1 サイクル完了スコープ + 例外条件)
- VISUAL_ON_EXECUTION 規範: local screenshot 8 枚以上 + staging visual は user-gated
- existing-route-alignment 実装モード (新規 API endpoint / schema 変更を含まない)

## 本サイクルで追加候補となる lessons-learned (L-AIDC-001..)

| ID | 内容 | 反映先候補 |
|----|------|------------|
| L-AIDC-001 | admin route の UI prototype alignment は既存 `AdminPageHeader` + primitive 流用が SSOT。Tailwind 直書きが残るのは prototype-alignment 未実施 route の signal | `.claude/skills/aiworkflow-requirements/references/workflow-*-artifact-inventory.md` の Lessons Learned 節 |
| L-AIDC-002 | staging 404 の hypothesis 切り分けは「H1 build未デプロイ / H2 env mismatch / H3 D1 migration / H4 auth 401→404化 / H5 proxy path strip」の 5 軸で staging tail + curl で順次潰すパターンが再利用可能 | task-specification-creator patterns-lessons (admin staging 404 切り分けパターン) |
| L-AIDC-003 | `safe-server-fetch.ts` で 404 のみ Sentry `captureMessage` を 1 行追加する narrow event 設計は、admin route 全体に汎化可能 (area tag で route 単位フィルタ) | task-specification-creator patterns-lessons (admin 観測性 narrow event パターン) |
| L-AIDC-004 | UI 改修 + bugfix を 1 PR で同梱する場合、AC を A 系 / B 系で明示分離 + evidence を別ファイルにすることで review parity 維持 | task-specification-creator patterns-lessons (multi-scope PR の AC 分離) |
| L-AIDC-005 | visual baseline は Linux CI bot で生成 / macOS local screenshot は evidence 用に独立 path 保存、という二重保存パターンは VISUAL_ON_EXECUTION の標準形 | aiworkflow lessons-learned (visual evidence 二重保存) |
| L-AIDC-006 | identity 系 route の PII grep gate (`@[a-z0-9.-]+\.[a-z]{2,}`) は responseEmailMasked exception を明示しないと false positive を出す。grep 後の `grep -v 'responseEmailMasked'` 除外が必要 | task-specification-creator patterns-lessons (PII grep gate false positive 回避) |
| L-AIDC-007 | system-spec-update-summary が N/A になる場合 (既存 primitive + 既存 API で完結する整合タスク) は、根拠 (どの spec を見て影響なしと判定したか) を表で明示する。N/A 単独表記は compliance check で reject されやすい | task-specification-creator references/phase-template-phase12.md (N/A 根拠表) |

## 実装サイクルで確定する項目 (本仕様書では未確定)

| 項目 | 確定タイミング | 後段で確定する場所 |
|------|----------------|---------------------|
| (B) 真因 hypothesis (H1〜H5) | 実装着手時の staging tail で確定 | Phase 4 H1-H5 表に実測ログを追記 |
| visual baseline 3 枚の SHA | CI bot regeneration 後 | Phase 11 inventory 表 |
| `admin_fetch_404` warn の logger/Sentry breadcrumb スキーマ | 確定済 (`event=admin_fetch_404`, `scope=admin`, `path`, `method`, `code`) | `apps/web/src/lib/admin/safe-server-fetch.ts` |
| Lighthouse a11y score | 実装後 local 測定 | Phase 11 evidence (任意) |

## skill 規約への小修正提案

- (なし — 既存 skill 規約のみで本仕様書を完成できた)

## 反映プロセス

実装サイクル内で、L-AIDC-002 / 003 / 004 / 006 / 007 は task-specification-creator の汎化 lessons に反映済。L-AIDC-001 / 005 は本 workflow inventory の Lessons Learned に反映する:

- `.claude/skills/aiworkflow-requirements/references/workflow-admin-identity-conflicts-prototype-alignment-and-404-fix-artifact-inventory.md` の `## Lessons Learned` 節
- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾 (汎化可能な L-AIDC-002 / 003 / 004 / 006 / 007)
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` 末尾
