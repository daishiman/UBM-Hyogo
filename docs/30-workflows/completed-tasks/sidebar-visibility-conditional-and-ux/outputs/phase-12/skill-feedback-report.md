# Skill Feedback Report — サイドバー表示条件の正本化

> 改善点なしでも出力必須。テンプレ改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。
> 各 item に promotion target / no-op reason / evidence path を付す。

## 観点 1: テンプレ改善（task-specification-creator）

| Item | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-SVC-T-001 | `implementation / VISUAL` で実コード・direct focused tests・typecheck・lint が完了した場合は `spec_created` に据え置かず、local deterministic evidence と pixel screenshot user-gate を分離して `implemented_local_evidence_captured` へ昇格する境界記法を patterns-lessons に明文化する | promoted: `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` / `SKILL-changelog.md` | `outputs/phase-11/manual-test-result.md` evidence 境界 / `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 観点 2: ワークフロー改善（aiworkflow-requirements）

| Item | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-SVC-W-001 | 正本仕様が既に正しい振る舞いを規定済み（09h §1.6「login=shell外」）なのに実装が逸脱している **spec drift bug** は、新仕様の創作ではなく「正本へ実装を一致させる drift 解消」として Phase 1 真の論点に固定する手順を lessons-learned 化する | promoted: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-sidebar-visibility-conditional-and-ux-2026-06.md` | `phase-1-requirements.md` 真の論点 1 / `phase-3-design-review.md` 正本仕様整合 PASS |
| FB-SVC-W-002 | 「どの route が shell を被るか」という表示条件の所有を layout の条件分岐ロジックでなく **route group（ディレクトリ構造）** に単一化する設計判断（宣言的所有者）を、責務境界パターンとして昇格する | promoted: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-sidebar-visibility-conditional-and-ux-2026-06.md` | `phase-2-design.md` §1.2 設計判断 / §1.4 マトリクス |

## 観点 3: ドキュメント改善

| Item | 内容 | promotion target | evidence path |
| --- | --- | --- | --- |
| FB-SVC-D-001 | system spec マトリクス（09h §1.6）へ route group 名を明示する更新を、実コード変更と同一ターン（Step 1-A）で行う旨を documentation-changelog に Block 分離で記録する運用は有効。no-op（既に本サイクルで適用済み） | no-op（適用済み） | `outputs/phase-12/documentation-changelog.md` Block 2 / `system-spec-update-summary.md` Step 2 |
| FB-SVC-D-002 | role→nav の item 数・route・外部リンク契約は UI 実装差分以外でも drift しやすい。正本仕様 09h §1.2 と `shell-config.ts` の同期を static invariant test に含める運用を本サイクルで適用した | no-op（適用済み） | `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts` / `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` |

## no-op item（改善不要だが記録）

| Item | no-op reason |
| --- | --- |
| compliance-check canonical 9 見出し | 既存テンプレ（`phase12-compliance-check-template.md`）で十分。改修不要 |
| strict 7 構成 | 親系譜 `task-c-public-member-sidebar-shell-integration` の書式を踏襲済み。乖離なし |
| 新規 primitive ゼロ方針 | 既存 shell primitive（`SidebarUserMenu` / `SidebarUserAvatar` / `SidebarNavItem`）の分岐強化で AC 充足。UI alignment #3 に整合 |

## 今回の主要知見（summary）

1. **spec drift bug の固定** — 09h §1.6 は既に「login=shell外 bare」を規定済みであり、本件は新仕様の創作ではなく
   「実装を正本へ一致させる drift 解消」。Phase 1 で真の論点として固定し、設計レビューでも正本仕様整合 PASS とした。
2. **表示条件 = route group 単一所有** — 「shell を被るか」の決定権を layout の条件分岐から route group（`(auth)` 新設）へ移し、
   表示条件をディレクトリ構造で宣言的に表現した。責務境界が明確化し invariant test で回帰を機械担保できる。
3. **VISUAL の two-tier 境界** — 実コード・local deterministic evidence は本サイクルで完了し、認証不要の local screenshot 4 PNG を取得。
   admin/staging screenshot は staging 認証の user-gated へ後段化。`screenshots/` は実体 PNG がある場合のみ置く運用とした。
4. **正本 nav 契約の item 数 drift 防止** — admin nav は `Form回答` 外部リンクを含む 14 item が実装正本。09h §1.2 の item 数・route 表記を
   static invariant で固定し、仕様とコードの drift を focused Vitest で検出可能にした。
