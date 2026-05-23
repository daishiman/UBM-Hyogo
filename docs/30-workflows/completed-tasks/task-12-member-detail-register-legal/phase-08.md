# Phase 8: DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 |
| task | task-12-member-detail-register-legal |
| state | spec-fixed / implementation pending / runtime evidence pending_user_approval |

## 目的

task-12 で新設・改修するコンポーネント群（ProfileHero / MemberDetailSections / MemberTags / MemberLinks / MemberActivity / RegisterCallout / FormPreviewSections / LegalProse + 4 page.tsx）に対して、重複の検出と抽象化判断（YAGNI 適用）を固定する。**コード重複 < 3 箇所** を達成する。

## 実行タスク

- [ ] 重複検出 5 観点それぞれに対する判断を記録する
- [ ] 過剰抽象化を行わない（CONST_003 タスク特性最適化）

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（一次原典 §3 各 component シグネチャ）
- task-10（ui-primitives）: `apps/web/src/components/ui/` 配下の `Card`/`Badge`/`Avatar`/`EmptyState`
- task-08（design-tokens-doc）: `docs/00-getting-started-manual/specs/design-tokens.md`
- task-09（tailwind-v4-setup）: `apps/web/src/styles/tokens.css`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-08/main.md`

## 統合テスト連携

DRY 化の判断は本 task 内のコンポーネントに閉じる。**新規 primitive を生やさない**（一次原典 §0.5 / SCOPE.md 不変条件 #3）方針に従う。

## 重複検出と対策

| 観点 | 検出 | 対応 | 判断根拠 |
| --- | --- | --- | --- |
| `KVList` 構造（`<dl><div data-stable-key><dt><dd>`） | `MemberDetailSections` でしか使わない（v1） | **抽出しない**。MemberLinks / MemberActivity は `<ul>` / `<ol>` で list 表現が異なるため統合不可。コード重複 1 箇所のため YAGNI 適用 | CONST_003 / 単一責務 |
| `Chip / Badge` の tone 切替 | ProfileHero（`zone-{a..e}` / `info` / `neutral outline`）と MemberTags（`neutral outline`） | task-10 `Badge` primitive を **そのまま使う**（VariantProps が tone を受ける）。新 wrapper を生やさない | 一次原典 §0.6.1 |
| prose typography の集約 | `/privacy` / `/terms` の 2 ページで `<article className="prose">` を直書きする可能性 | `LegalProse` primitive を新設（Phase 5 §Step 3）して 1 箇所に集約。**他の管理画面・公開画面では使わない**（typography 集約の責務は legal 限定） | 一次原典 §3.3.1 |
| `target="_blank" rel="noopener noreferrer"` の繰り返し | `MemberLinks` / `RegisterCallout` / 法務ページの「トップに戻る」(`/`) 以外の外部リンクで重複 | **抽出しない**。3 箇所未満 + a11y/security 上の意味付けが component ごとに異なる（CTA / pill / inline）。token は属性値なので CSS 抽出も不要 | コード重複 < 3 |
| 配列 join / null fallback の `renderValue` | `MemberDetailSections` 内 helper として 1 箇所に置く。MemberActivity でも Array.isArray 判定が必要 | `MemberDetailSections.tsx` 内の private function に集約。**export しない**（component スコープに閉じる） | 単一責務 |
| `data-page` / `data-component` 属性 | 4 page と各 component で繰り返し | **そのまま直書きする**。type-safe な enum 化はオーバーエンジニアリング | YAGNI |
| token 直書き（`var(--ubm-color-*)`） | 7 component + 4 page で散在 | task-09 が CSS 変数として一元管理しているため、TS / TSX 側で **値を再 export しない**。grep gate（AC-08 / task-18）で HEX 直書きのみを禁止 | CONST_003 |
| FALLBACK_RESPONDER_URL | `apps/web/app/(public)/register/page.tsx` 1 箇所のみ | const 1 箇所で十分。共通モジュール化は task-18 / 後続で必要になれば検討 | YAGNI |
| consent キー名 (`publicConsent` / `rulesConsent`) | RegisterCallout 内 1 箇所 | `@ubm-hyogo/shared` の zod schema に既に定義（不変条件 #2）。UI 側では文言として直書き | 一次原典 §0.5 #2 |
| 戻るリンク（`<a href="/">トップに戻る</a>`） | `/privacy` / `/terms` で同一文言 | **共通化しない**。法務 2 画面以外で使う想定がなく、文言改定時の影響範囲が限定的 | YAGNI / 単一責務 |

## 抽象化判断（YAGNI 適用）

- `KVList` を独立 primitive にしない（v1 では 1 利用箇所のみ）
- `LinkPill` を独立 primitive にしない（`MemberLinks` 内の `<a className="link-pill">` で十分）
- `ChipRow` を独立 primitive にしない（ProfileHero 内 1 箇所）
- `BackLink` を独立 primitive にしない（詳細ページと法務 2 画面で挙動差異あり：詳細は `/members`、法務は `/`）
- `ConsentList` を独立 primitive にしない（RegisterCallout 内 1 箇所、UI 形式が固有）
- `FormSectionRow` を独立 primitive にしない（FormPreviewSections 内 1 箇所）

## 抽象化を **行う** 判断

- `LegalProse` primitive は新設する（一次原典 §3.3.1 / 2 利用箇所 + typography token を集約する責務）

## コード重複 < 3 箇所の確認方法

実装後 `jscpd` または `tsc --noEmit` 後の手動 grep で次を確認:

```bash
# data-stable-key の付与パターン
rg -n 'data-stable-key=' apps/web/src/components/public apps/web/src/components/legal

# target=_blank の繰り返し（許容: MemberLinks / RegisterCallout / 法務 2 ページの計 4 箇所まで）
rg -n 'target="_blank"' apps/web/src/components/public apps/web/app/(public)/register apps/web/app/privacy apps/web/app/terms
```

3 箇所以上の同一パターンが検出された場合のみ primitive 化を検討する。

## 完了条件

- [ ] 重複検出 11 観点に対する判断が記録されている
- [ ] 過剰抽象化を行っていない（CONST_003 タスク特性最適化）
- [ ] `LegalProse` 以外の新 primitive を生やしていない（一次原典 §0.5 / SCOPE.md 不変条件 #3）
- [ ] task-10 既存 primitive（`Card` / `Badge` / `Avatar` / `EmptyState`）を新 wrapper なしで再利用している
