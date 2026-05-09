# Phase 11: 手動テスト（3 層評価: Semantic / Visual / AI UX）

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. 3 層評価マトリクス

| サブタスク | Semantic | Visual | AI UX | 主軸 |
|-----------|---------|--------|-------|------|
| 1a public-flow | △（DOM 文字列確認のみ） | ○ | △ | Visual |
| 1b profile pending | ○（state 一貫性） | △（pending banner 表示） | ○（再訪問 UX） | Semantic + AI UX |

## 2. screenshot canonical 命名（4 か所一致）

| 所在 | 命名 |
|------|------|
| ローカル保存先 | `outputs/phase-11/<canonical>.png` |
| PR 本文参照 | 同 path 相対参照 |
| spec 内 `screenshot()` 引数 | `<canonical>` |
| `phase-11.md` 表（本 §3） | `<canonical>` |

> canonical 名は kebab-case、英数字とハイフンのみ。

## 3. screenshot 対象一覧

| canonical | 取得画面 | 評価層 | 取得手順 |
|----------|---------|--------|---------|
| `s1-public-landing-no-leak` | `/` for anonymousPage | Visual | leak guard 通過状態の landing 全画面 |
| `s1-public-members-list-no-leak` | `/members` | Visual | members list 全画面 |
| `s1-public-member-detail-no-leak` | `/members/m-1` | Visual | detail 全画面 |
| `s1-profile-pending-visibility-after-roundtrip` | `/profile`（round-trip 後） | Semantic + AI UX | 1b-A 実行直後 |
| `s1-profile-pending-delete-after-roundtrip` | `/profile`（round-trip 後） | Semantic + AI UX | 1b-B 実行直後 |

## 4. Semantic 層評価（1b 主軸）

| 観点 | チェック |
|------|---------|
| state 一貫性 | round-trip 後も同じ pending banner が同じ position に visible |
| selector 安定性 | `[data-pending-type=...]` が変化していない |
| message 整合 | banner の文言が submit 直後と round-trip 後で同一 |

## 5. Visual 層評価（1a 主軸）

| 観点 | チェック |
|------|---------|
| DOM textContent | sentinel email が含まれない（自動 + 目視） |
| email 表記の偶発露出 | footer / contact / 利用規約リンク等で email 文字列が見えていないか |
| public route の identity | landing / members / detail がプロトタイプと整合 |

## 6. AI UX 層評価（1b 主軸）

| 観点 | チェック |
|------|---------|
| ユーザ予測可能性 | 「申請を出した → ホームに戻った → プロフィールに戻った」で pending 状態が消えていないこと |
| 認知負荷 | pending 状態の継続が banner の主張で読み取れること |
| 操作 confidence | round-trip しても自分の操作結果が server に保存されたと信じられる |

## 7. 評価ログ template

```
canonical: <name>
評価層: Semantic / Visual / AI UX
判定: pass / fail / observation-only
所見: <freeform>
```

## 8. Phase 12 入口条件

- [ ] §3 screenshot 5 件取得 / または取得不要判定
- [ ] §4 §5 §6 評価ログを `outputs/phase-11/` に保存
- [ ] canonical 名が PR 本文と一致

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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

