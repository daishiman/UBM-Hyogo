## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | ui-prototype-design-system-foundation-followup-001-prototype-driven-spec-sync-skill |
| タスク名     | 新規スキル `prototype-driven-spec-sync` 作成（prototype/spec/実装の四者同期検証） |
| 分類         | スキル新規作成 / governance |
| 対象機能     | `claude-design-prototype` を SSOT とする UI 仕様の prototype-map / SCOPE / Phase 1-13 仕様 / 実装ファイル 四者同期 |
| 優先度       | 中 |
| 見積もり規模 | 中（SKILL.md + references 3 本 + 検証 script 1 本） |
| ステータス   | 未着手 |
| 発見元       | ui-prototype-design-system-foundation Phase 12 |
| 発見日       | 2026-05-18 |
| 制作経路     | `skill-creator` skill 経由（メタスキル制約適用） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`docs/00-getting-started-manual/claude-design-prototype/` を SSOT として `apps/web` を構築する UI prototype design system foundation ワークフローで、prototype-map / SCOPE / Phase 1-13 仕様 / 実装ファイル の四者が同期している必要があるが、現状は人手レビューに依存しており drift 検知の自動化経路が存在しない。

### 1.2 問題点・課題

- OKLch token 違反（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]`）が `apps/web/src` に混入しても CI の `verify-design-tokens` を通る抜け穴がある（Tailwind arbitrary value など）。
- prototype 未掲載画面（管理画面群・register・privacy・terms）が独自 primitive を生やしても primitive adoption tracker (issue-749) では検出できない逸脱パターンがある。
- AppShell 共用整合性（`apps/web/app/(admin)/layout.tsx` 等）と prototype 側 AppShell 定義の drift が誰にも検知されないまま PR がマージされ得る。
- `PROTOTYPE-COVERAGE.md` の覆い率テーブルと実装側の routes の対応が乖離しても気づけない。

### 1.3 放置した場合の影響

- 「prototype は正本」ポリシーが形骸化し、prototype と実装が双方向に乖離する。
- 後続の UI 統合タスク（task-02..22）で recovery 工数が膨張する。
- design tokens のガバナンスが緩み、`oklch()` 統一前の HEX 文化へ後退する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`claude-design-prototype` を SSOT とした四者同期（prototype-map / SCOPE / Phase 1-13 仕様 / 実装ファイル）を、Progressive Disclosure 原則に従う Claude Code 用 skill で検証・修復可能にする。

### 2.2 スコープ（含む）

- OKLch token 違反検出（`apps/web/src` 配下の HEX / `#[0-9a-f]{3,8}` / arbitrary color utility 直書き）
- HEX 直書き検出（`tokens.css` / `globals.css` を例外として allowlist 管理）
- prototype 未掲載画面（管理画面・register・privacy・terms）の primitive 逸脱検出
- AppShell 共用整合性（layout.tsx / header / footer の primitive 利用率と SSOT 整合）
- `PROTOTYPE-COVERAGE.md` drift 検出（routes table vs 実 routes vs prototype 側 page index）

### 2.3 スコープ外

- 新規 primitive の追加判断（skill-creator や task-specification-creator 側の責務）
- design tokens の新規追加（design-tokens.md の正本変更タスク側で扱う）
- API 仕様変更検証（CLAUDE.md の不変条件「既存 API のみ接続」に従う）

### 2.4 想定構成

```
.claude/skills/prototype-driven-spec-sync/
├── SKILL.md
├── SKILL-changelog.md
├── references/
│   ├── prototype-ssot-rules.md
│   ├── oklch-token-responsibility-split.md
│   └── prototype-coverage-checklist.md
└── scripts/
    └── verify-prototype-map-sync.sh
```

---

## 3. どのように実行するか（How）

### 3.1 推奨アプローチ

1. `skill-creator` skill を起動し、メタスキル制約（責務分離 / line budget / trigger coverage）に沿って `prototype-driven-spec-sync` を起こす。
2. `references/prototype-ssot-rules.md` に「prototype を SSOT とする 4 ルール（covered / not-covered / shared chrome / token boundary）」を記述。
3. `references/oklch-token-responsibility-split.md` に `tokens.css`（OKLch 数値の唯一の正本）と `globals.css`（rhythm / typography 等の SSOT）の責務分担を成文化。
4. `references/prototype-coverage-checklist.md` に 19 routes × prototype 掲載/未掲載の checklist を反映。
5. `scripts/verify-prototype-map-sync.sh` を実装し、`pnpm verify:prototype-map-sync` として CI 統合可能にする。
6. anchors / trigger keywords を `indexes/keywords.json` に登録（aiworkflow-requirements skill の indexes-rebuild fence と整合）。

### 3.2 検証スクリプト要件

- exit 0: 四者同期 OK
- exit 1: drift 検出（drift 種別を行ごとに `category\tfile\tline\thint` 形式で stdout 出力）
- allowlist は `prototype-coverage-checklist.md` 内のフェンス済み YAML 1 か所のみ

---

## 4. 完了条件チェックリスト

- [ ] `.claude/skills/prototype-driven-spec-sync/SKILL.md` が `skill-creator` の lint を pass
- [ ] `references/` 3 本が line budget 内で完結
- [ ] `scripts/verify-prototype-map-sync.sh` が `apps/web/src` 上で OKLch 違反 / 未掲載画面の primitive 逸脱 / coverage drift を検出
- [ ] `indexes/keywords.json` に trigger keyword 登録、`pnpm indexes:rebuild` で drift 0
- [ ] `aiworkflow-requirements` skill の `resource-map` / `topic-map` から相互リンク
- [ ] CI gate 候補として `dev` / `main` の required status check 追加可否を文書化（採用判断はユーザー承認後）

---

## 5. 参照情報

- `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/00-getting-started-manual/claude-design-prototype/`
- `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- `docs/00-getting-started-manual/specs/design-tokens.md`
- `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css`
- `.github/workflows/verify-design-tokens.yml`（task-18 CI gate）
- 関連 lessons-learned（想定参照）: L-UIPROTO-001..005（prototype SSOT 運用 / OKLch boundary / AppShell 共用 / coverage drift / primitive 逸脱）
- 関連 skill: `skill-creator`（メタ）/ `aiworkflow-requirements`（indexes 経路）/ `task-specification-creator`（Phase 12 後段連携）
