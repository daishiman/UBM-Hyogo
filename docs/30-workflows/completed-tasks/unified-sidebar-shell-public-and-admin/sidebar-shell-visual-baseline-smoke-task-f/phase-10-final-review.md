---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 10
phase_name: 最終レビュー
created_at: 2026-05-29
---

# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

本 Task F の実装着手は親 `unified-sidebar-shell-public-and-admin` の Task A〜E
（shell primitive / user-menu / public+member layout / admin layout / mobile drawer）の
**完了 + 統合済み** が前提。本 Phase でその着手前提を確認方法付きで明示する。

---

## 1. 着手前提（必須）

| # | 前提 | 確認方法 |
|---|------|----------|
| 1 | Task A（sidebar shell primitive）完了 + 統合 | 親 workflow `docs/30-workflows/unified-sidebar-shell-public-and-admin/artifacts.json` で Task A の status を確認 |
| 2 | Task B（user menu and role handling）完了 + 統合 | 同上（Task B status） |
| 3 | Task C（public and member layout integration）完了 + 統合 | 同上（Task C status） |
| 4 | Task D（admin layout migration）完了 + 統合 | 同上（Task D status） |
| 5 | Task E（mobile drawer responsive）完了 + 統合 | 同上（Task E status） |
| 6 | shell component が `data-testid`（app-shell / shell-sidebar / shell-drawer-toggle / shell-drawer / shell-collapse-toggle / shell-user-menu）を付与済み | `git grep -n 'data-testid="shell-\|data-testid="app-shell"' apps/web/src/components/shell` |

- Task A〜E のいずれかが未完なら Task F は着手しない。
- 親 workflow は現在 `spec_created`（未実装）であり、本 Phase の前提は将来の実装実行時に確認する。
- `data-testid` が未付与の場合は、同一 wave で親 spec へ attribute 追加を申し送る（Phase 3 R7。「先送り」ではなく sibling 依存）。

---

## 2. 設計レビュー結果再掲

- **パス補正**: source task の `apps/web/tests/e2e/sidebar-shell-*` を `apps/web/playwright/tests/sidebar-shell/` へ補正（phase-1 §7 / Phase 3 R1）。auth fixture は `*StorageState` ではなく拡張 `test`（`anonymousPage`/`memberPage`/`adminPage`）を継承。
- **local visual**: staging ではなく local（`mockApi` + auth fixture）で完結（Phase 3 R4 / 不変条件 #7）。
- **7 点撮影**: role × viewport の全 9 組合せのうち task-F 指定の 7 点のみ（member は desktop のみ。Phase 3 R6）。
- **専用 project**: smoke は `sidebar-shell-smoke` 専用 project、visual は `sidebar-shell-visual-{desktop,tablet,mobile}` 3 project（Phase 3 R2 / Phase 2 §7）。既存 default project の testIgnore に visual spec を追加し誤実行を防止。

---

## 3. リスクチェック

| リスク | 対策 |
|--------|------|
| 親 Task A〜E の未完 / 統合遅延 | §1 着手前提で親 `artifacts.json` の Task A-E status を確認。未完なら着手しない |
| 親 shell の `data-testid` 未定義で selector が壊れる | §1 #6 の grep で確認。不足は親 spec へ同一 wave 申し送り（Task F 側で testid を新設しない。Phase 3 R7） |
| `mockApi` seed が shell 表示に必要な GET を network 上カバーしない | Phase 5 で既存 seed（`buildMember`/`buildStats`/`defaultAttendanceSeed`）に不足応答を追加（read-only GET のみ。mutation 不触） |
| baseline の OS 差（macOS dev で撮ると diff） | `-linux.png` 正本・macOS 撮影分は commit しない（不変条件 #1）。baseline 生成は CI Linux runner で実行 |
| bot による baseline push 後の required check 未発火 | bot push は GITHUB_TOKEN ゆえ `pull_request` 非発火。空コミット再トリガー（user-gated）を Phase 5/13 に明記 |

---

## 4. spec 完了条件

- Phase 1-13 すべて作成済み。
- AC-1〜AC-8（phase-1 §4）が Phase 4（テスト計画）/ Phase 5（実装）/ Phase 9（QA）で検証可能な形に落ちている。
  - AC-1（smoke 6 green）/ AC-2（visual 7 baseline）/ AC-3（3 viewport project × role fixture）/ AC-4（helper 集約）/ AC-5（CI smoke + visual matrix）/ AC-6（regression dry-run）/ AC-7（required check 候補列挙）/ AC-8（既存 fixture のみ）。
- DoD は Phase 13（PR）にチェックリスト化。
- 「先送りタスク」が存在しない（CONST_007 準拠。§5 参照）。

---

## 5. CONST_007 準拠（1 サイクル完結）

- 本仕様は 1 サイクル内で完結する: 仕様（Phase 1-13）は本サイクルで全 Phase 完備し、実装実行のみ Task A-E 完了後に行う。
- 実装が Task A-E 完了後である点は **sibling task への技術的依存**であり、CONST_007 の「先送り（バックログ送り）」ではない（Task E が Task A-D に依存したのと同型）。
- 親への `data-testid` 申し送り（Phase 3 R7）も「先送り」ではなく **同一 wave 前提**の attribute 整合であり、新規バックログタスクを生まない。
- required status check の実 PUT は user-gated だが、CI 構成（job / matrix 追加）の追加そのものは本サイクル内で完結する。
- バックログ送りタスクは無し。
