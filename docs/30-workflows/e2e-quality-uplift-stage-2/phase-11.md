# Phase 11: 手動テスト（3 層評価）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-09 |
| 対象 admin routes | `/admin/requests` / `/admin/identity-conflicts` / `/admin/members` / `/admin/audit` |
| 評価層 | Functional / Semantic / Visual |

> admin 4 routes は **critical**。Semantic + Visual 評価を必須とする。

---

## 1. 3 層評価マトリクス

| route | Functional | Semantic | Visual | Screenshot canonical |
|-------|-----------|---------|--------|---------------------|
| `/admin/requests` | 一覧表示 + approve/reject + race + 認可 | role / aria-label / heading 階層 | OKLch palette / tokens.css 整合 | `admin-requests-mutation.png` |
| `/admin/identity-conflicts` | merge / dismiss / DB 整合 / 認可 | confirm dialog の `role='alertdialog'` | dialog overlay tokens | `admin-identity-conflicts-merge.png` |
| `/admin/members` | 二段確認 / delete / audit / 認可 | 二段 confirm の focus trap | destructive button tokens | `admin-member-delete.png` |
| `/admin/audit` | 削除 entry が新着で表示 | table の `scope` / `aria-sort` | table tokens | `admin-audit-after-delete.png` |

---

## 2. screenshot canonical 名の 4 か所一致管理

| 配置 | 役割 |
|------|------|
| 1. `outputs/phase-11/screenshots/<canonical>.png`（このワークフロー） | 手動テスト記録 |
| 2. spec 内 `await page.screenshot({ path: ... })`（任意・record モード） | 自動撮影 |
| 3. PR 本文（phase-13）の Screenshot セクション | レビュー対象 |
| 4. `docs/00-getting-started-manual/manual-test-evidence/`（既存運用との整合） | 履歴保管 |

> 4 か所すべてで **完全一致するファイル名** を使用する。記号は `kebab-case`、`.png` 固定。

---

## 3. 手動テストシナリオ（Functional）

### 3.1 `/admin/requests`

| step | 操作 | 期待 |
|------|------|------|
| 1 | admin login → `/admin/requests` 訪問 | pending list 表示 |
| 2 | approve ボタン押下 | toast 成功 / 該当行消失 |
| 3 | reject ボタン → modal で reason 入力 → submit | toast 成功 |
| 4 | 同 noteId に再 approve（curl で API 直叩き） | 409 を UI で観測 |
| 5 | member 認証で `/admin/requests` | 403 page or `/profile` redirect |
| 6 | 未ログインで `/admin/requests` | `/login` redirect |

### 3.2 `/admin/identity-conflicts`

| step | 操作 | 期待 |
|------|------|------|
| 1 | admin で訪問 | 衝突 list 表示 |
| 2 | merge → reason 入力 → confirm | success toast / 一覧から消失 |
| 3 | merge 直後に同 conflict id 再操作 | 409 ALREADY_MERGED |
| 4 | dismiss → reason 入力 → confirm | dismissed 表示 |
| 5 | member / anonymous | 認可境界 |

### 3.3 `/admin/members` (delete)

| step | 操作 | 期待 |
|------|------|------|
| 1 | admin で member 詳細 → Delete | 1 段目確認 |
| 2 | 進む → reason 入力 → 2 段目確認 | submit 可能化 |
| 3 | submit | success toast / `is_deleted` 表示 |
| 4 | 同 member 再 delete | 409 `member_already_deleted` |
| 5 | reason 空で submit | 422 inline error |
| 6 | `/admin/audit` 訪問 | 削除 entry が新着で表示 |
| 7 | member / anonymous | 認可境界 |

---

## 4. Semantic 評価チェック（admin 4 routes 共通）

| 観点 | チェック |
|------|---------|
| heading 階層 | `h1` → `h2` の順序 |
| role | table / alertdialog / button が適切 |
| aria-label | 操作系 button にラベル |
| focus trap | confirm dialog 内で tab 循環 |
| keyboard nav | Esc で dialog 閉、Enter で submit |

---

## 5. Visual 評価チェック

| 観点 | チェック |
|------|---------|
| OKLch tokens | `tokens.css` 経由 / HEX 直書きなし |
| destructive | delete / dismiss は destructive token 適用 |
| spacing | rhythm 4/8/12/16 系統 |
| hover/focus | focus ring 可視 |

---

## 6. 評価記録テンプレ（outputs/phase-11/report.md 想定）

```text
[stage-2 manual evidence @ 2026-05-09]
- /admin/requests: Functional <pass|fail>, Semantic <pass|fail>, Visual <pass|fail>
- /admin/identity-conflicts: ...
- /admin/members: ...
- /admin/audit: ...
screenshots:
- admin-requests-mutation.png
- admin-identity-conflicts-merge.png
- admin-member-delete.png
- admin-audit-after-delete.png
```

---

## 7. Phase 11 完了定義

- [x] 3 層評価マトリクス
- [x] screenshot canonical 4 か所一致ルール
- [x] Functional シナリオ（3 routes × N step）
- [x] Semantic / Visual チェック項目
- [x] 評価記録テンプレ

> Phase 12 へ進める。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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

