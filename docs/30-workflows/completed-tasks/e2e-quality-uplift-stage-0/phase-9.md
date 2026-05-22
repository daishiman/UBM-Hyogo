# Phase 9: 品質保証（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## 1. line budget 検証

| ファイル | 上限 | 想定行数 | 判定 |
| --- | --- | --- | --- |
| `phase-1.md` | 350 | 既存 ~140 | OK |
| `phase-2.md` | 350 | 既存 ~150 | OK |
| `phase-3.md` | 350 | 既存 ~70 | OK |
| `phase-4.md` | 350 | 本 PR 生成 ~110 | OK |
| `phase-5.md` | 350 | 本 PR 生成 ~120 | OK |
| `phase-6.md` | 350 | 本 PR 生成 ~85 | OK |
| `phase-7.md` | 350 | 本 PR 生成 ~50 | OK |
| `phase-8.md` | 350 | 本 PR 生成 ~95 | OK |
| `phase-9.md` | 350 | 本ファイル ~110 | OK |
| `phase-10.md` | 350 | 本 PR 生成 ~80 | OK |
| `phase-11.md` | 350 | 本 PR 生成 ~75 | OK |
| `phase-12.md` | 350 | 本 PR 生成 ~140 | OK |
| `phase-13.md` | 350 | 本 PR 生成 ~85 | OK |
| `index.md` | 制約なし | ~80 | OK |

---

## 2. リンク整合性

| 参照元 → 参照先 | 種別 | 検証 |
| --- | --- | --- |
| 全 phase → `.claude/skills/task-specification-creator/references/quality-gates.md` | skill spec 参照 | 既存 path、本サイクルで file は同一 wave で更新済みのため link 健全 |
| phase-2 §3 → `apps/web/playwright/README.md` | current file | 本サイクルで作成済み |
| phase-1 / 2 → `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` | path | 既存 file 存在確認は `test -f` 経由 |
| phase-1 / 2 → `apps/web/playwright/tests/profile-{visibility,delete}-request.spec.ts:2` | path:line | 既存 file、:2 stale comment 存在 |
| phase-1 / 2 → `apps/web/playwright.config.ts:26-47` | path:line | 既存 |
| index.md → phase-1〜13 | 相対 link | 全 phase 生成済（本 PR で完成） |

---

## 3. mirror parity

| mirror 対象 | 本 PR の touch | parity 状態 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/references/quality-gates.md` | 本サイクルで touch 済み（§7 / §7.5 は worktree pre-modified、Stage 0 spec とは独立） | parity 維持 |
| `.claude/skills/aiworkflow-requirements/indexes/` | touch なし | drift なし → CI `verify-indexes-up-to-date` pass 想定 |
| `docs/00-getting-started-manual/` | touch なし | parity 維持 |
| `docs/30-workflows/e2e-quality-uplift-stage-0/` | 本 PR で 11 file 追加・1 file 編集 | self-contained |

---

## 4. CONST 整合最終確認

| CONST | 評価 |
| --- | --- |
| CONST_007（単一サイクルスコープ） | OK — 本 PR は仕様書 10 + index update の 11 ファイルのみ。実コード edit あり |
| `apps/web` D1 直接アクセス禁止 | OK — 影響なし |
| ブランチ戦略（PR base = dev） | OK — Phase 13 で `dev` を明示 |
| OKLch token 正本化 | OK — 影響なし（color に触らない） |
| プロトタイプ正本順位 | OK — UI primitives に触らない |

---

## 5. 仕様書品質チェック

| 観点 | 結果 |
| --- | --- |
| 全 phase 日本語出力 | OK |
| 表形式中心の構成 | OK（各 phase で 3-7 表） |
| `path:line` 表記の使用 | OK（phase-1 / 2 / 5 / 8 で多用） |
| Phase 2 §3-§4 の文面と他 phase の整合 | OK（duplication 排除ルールで参照のみ） |
| AC（Acceptance Criteria）と grep gate (RG-*) / fail path (FP-*) の対応 | OK（AC-0b-1〜6、AC-0c-1〜5 が phase-4 RG / phase-6 FP に紐付く） |

---

## 6. リスク残存確認

| Phase 2 R# | 緩和状況 |
| --- | --- |
| R1（spec 同居） | Phase 4 §0 で 案 A 確定済 |
| R2（README ↔ skill spec ドリフト） | phase-2 §3 で「§7.5 は link のみ、tier table 1 行のみ再掲」確定 |
| R3（例外拡大解釈） | phase-2 §4 で「`profile-readonly-logged-in.spec.ts` のみ対象」と明記 |
| R4（Phase 11 evidence 薄さ） | phase-11 で L1 docs-grep + L2 lint-boundary 構成（後続 phase 参照） |

---

## 7. Phase 9 完了条件

- 全 phase の line budget OK ✓
- link 整合 OK ✓
- mirror parity 維持 ✓
- CONST 整合 ✓
- リスク R1-R4 緩和済 ✓

→ Phase 10 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 9
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
