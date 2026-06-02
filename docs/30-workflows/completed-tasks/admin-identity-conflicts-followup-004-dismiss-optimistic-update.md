# Admin Identity Conflicts FU-004 — dismiss confirm の optimistic update - タスク指示書

## メタ情報

```yaml
issue_number: 1042
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-followup-004-dismiss-optimistic-update |
| タスク名 | dismiss confirm を optimistic update 化 (FU-AIDC-006) |
| 分類 | 改善 |
| 補足分類 | UX 改善 (post-MVP) |
| 対象機能 | `/admin/identity-conflicts` の dismiss confirm |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | consumed / canonical workflow 実装完了（canonical: `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/`、Phase 1-12 completed、Phase 13 pending_user_approval） |
| GitHub Issue | #1042 |
| 発見元 | `issue-988-identity-conflicts-merge-optimistic-update` Phase 12 unassigned-task-detection 候補 1 |
| 発見日 | 2026-05-30 |
| canonical source | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

> 2026-06-01: 本単票は `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/` の Phase 1-13 canonical workflow へ昇格し、同 workflow で実装・focused Vitest・Playwright focused evidence・Phase 12 strict outputs まで完了済み。source trace として completed-tasks 配下に保持する。

### 1.1 背景

Issue #988 では merge 側だけを optimistic update 化し、dismiss（別人マーク）は「既存挙動不変」を受け入れ基準にした。これは Issue #988 のスコープを守るための判断であり、dismiss 側に同じ UX 改善を入れる余地は残っている。

### 1.2 問題点・課題

- merge は操作直後に row が消える一方、dismiss は server round-trip 完了まで row が残るため、同じ画面内で体感が非対称になる。
- dismiss 側には理由入力と confirm stage があり、merge と同じ component 内に存在するため、安易に state を共有すると rollback の責務が混ざる。

### 1.3 放置した場合の影響

- 大量 conflict を処理する管理者にとって dismiss 操作だけ反応が遅く見える。
- merge / dismiss の挙動差が仕様として明文化されないまま残り、将来のUI修正時に回帰しやすい。

---

## 2. 何を達成するか（What）

### 2.1 目的

dismiss 実行直後に該当 row を一覧から非表示にし、server error 時だけ rollback で再表示する。

### 2.2 最終ゴール

- dismiss 成功時: 操作直後に row が一覧から消える。
- dismiss 失敗時: row が復元し、既存の inline error / toast が表示される。
- merge 側の optimistic update と既存 payload / endpoint contract は不変。

### 2.3 受け入れ基準

- [ ] `IdentityConflictRow.tsx` に dismiss 専用の optimistic state が追加され、merge state と共有されていない。
- [ ] dismiss 実行直後に対象 row が DOM から消える。
- [ ] dismiss API reject 時に対象 row が復元し、dismiss 理由入力値が保持される。
- [ ] merge optimistic update の成功 / rollback テストが引き続き PASS する。
- [ ] `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` に dismiss optimistic / rollback の focused ケースがある。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | dismiss handler と row 可視性 state |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | component-level optimistic / rollback test |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | visual/runtime 操作確認 |
| `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/implementation-guide.md` | merge 側の実装済み pattern |

### 3.2 実装方針

- `optimisticMerged` とは別に dismiss 専用 boolean（例: `optimisticDismissed`）を持つ。
- `onDismiss` で `trigger()` より前に dismiss optimistic state を `true` にする。
- `.catch()` で dismiss optimistic state を `false` に戻す。
- `if (optimisticMerged || optimisticDismissed) return null;` のように row 非表示条件を統合する。ただし state 自体は分離する。

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260529-211028-wt-18/apps/web/src/components/admin/IdentityConflictRow.tsx`
- 症状: merge 側は `optimisticMerged` で row を `return null` にしているが、dismiss 側を同じ state に混ぜると、error surface が merge / dismiss のどちらに属するか分からなくなる。
- 参照: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/implementation-guide.md`
- 知見: optimistic visibility state は「操作種別ごとに独立」させ、render guard だけで合流させると rollback の責務が明確になる。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| dismiss と merge の rollback state が混線する | 中 | `optimisticMerged` と `optimisticDismissed` を分離し、test で片方の失敗が片方に影響しないことを固定する |
| dismiss 理由入力が rollback 後に消える | 中 | `.catch()` では optimistic state だけ戻し、`dismissReason` は clear しない |
| row を即時削除すると screen reader の状態変化が唐突になる | 低 | Playwright / RTL で `role="alert"` の rollback error を確認し、必要なら後続 fade task に委譲する |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

期待: dismiss optimistic success / rollback、merge 既存 optimistic success / rollback が全 PASS。

### 統合検証

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_ISSUE988_SCREENSHOT_DIR="$PWD/docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-11/screenshots" \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium --grep "dismiss|optimistic|rollback"
```

期待: dismiss 実行直後の row 消失、reject 時の row 復元、既存 merge optimistic ケースが PASS。

### 失敗時の切り分け

- row が消えない場合: `onDismiss` 内で `trigger()` より前に optimistic state が更新されているか確認する。
- rollback で理由が消える場合: `.catch()` 内で `setDismissReason("")` を呼んでいないか確認する。
- merge が回帰した場合: render guard と state 分離を確認する。

---

## スコープ

### 含む

- `IdentityConflictRow.tsx` の dismiss optimistic state 追加。
- dismiss success / reject の focused test 追加。
- Playwright で dismiss optimistic / rollback の操作証跡追加。

### 含まない

- API / D1 schema / shared schema の変更。
- merge optimistic update の設計変更。
- fade animation 追加（別タスク `admin-identity-conflicts-followup-005-row-fade-animation` に分離）。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/`
- Phase 12 実装ガイド: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/implementation-guide.md`
- 未タスク検出: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/unassigned-task-detection.md`
- 対象 component: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 起点 Issue: https://github.com/daishiman/UBM-Hyogo/issues/988
