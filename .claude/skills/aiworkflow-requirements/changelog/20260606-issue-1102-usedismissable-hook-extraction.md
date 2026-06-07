# issue-1102 useDismissable hook extraction — implementation sync

- 日時: 2026-06-06
- ブランチ: `docs/issue-1102-usedismissable-hook-extraction-spec`
- workflow root: `docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/`
- status: `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr`
- Issue: #1102 CLOSED 維持（mutation は user-gated）

## 事象 / 実装内容

`<details>` popover の「外側 pointerdown / Escape で閉じる」dismiss ロジックが `SidebarUserMenu`
と `DensityToggle.client.tsx` に重複していた。これを汎用 hook へ抽出し両 consumer を挙動不変で移行。

- 新規 `apps/web/src/hooks/useDismissable.ts`:
  - open state を所有しない（`<details>.open` が呼び出し側の正本・I-2）
  - close 理由を `DismissReason` union（`"pointerdown-outside" | "escape"`）で `onClose` に渡す
  - browser API は `browserDocument()` 経由のみ。SSR/Workers では `doc` null で no-op（I-5）
  - `instanceof` 判定は `doc.defaultView?.Node` で document の realm に合わせ realm 跨ぎでも堅牢
- 新規 `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`
- 移行 `apps/web/src/components/shell/SidebarUserMenu.tsx`（reason 無視・単純 close）
- 移行 `apps/web/src/components/public/DensityToggle.client.tsx`（Escape 時のみ summary フォーカス復帰）

起票時前提「再利用先 1 箇所 = rule of three 未到達」は着手時に変化し、2 箇所目（DensityToggle）の
出現でトリガー成立。両 consumer 移行を 1 サイクルで完結させ DRY 違反を根絶（先送りなし）。

## 検証

- focused vitest: `apps/web/src/hooks/__tests__/useDismissable.spec.tsx` +
  既存 consumer spec 2 本（無改修）= **3 files / 35 tests PASS**（挙動不変証跡・NON_VISUAL 判定根拠）
- typecheck / lint PASS、HEX 直書きなし
- `verify:phase12-compliance` ok: true、`gate-metadata:validate` Gate-A/B passed・ERROR 0
- apps/api / D1 / Google Form schema / design token は不変

## 反映先（same-wave）

- artifact inventory（`## Lessons Learned` L-I1102-001..005 を追記）
- resource-map / quick-reference / artifact-inventory（並行 close-out が `completed-tasks/` パスへ同期済）
- SKILL.md 変更履歴 / SKILL-changelog.md / LOGS/_legacy.md / 本 dated changelog

## 注記（並行 close-out）

本サイクル中に並行 session が workflow root を active root から `completed-tasks/` へ close-out 移動し、
`artifacts.json` の canonical パス・resource-map・quick-reference・artifact-inventory を completed-tasks
パスへ整合させ、`task-workflow-active.md` から 1102 の active エントリを除去した（内部一貫・stale 参照 0）。
ユーザー判断「残ギャップを引き継ぎ完了」に従い、本同期は移動を revert せず completed-tasks パスへ整合させた。

## User Gate

commit / push / PR / Issue mutation はユーザー承認後のみ。
