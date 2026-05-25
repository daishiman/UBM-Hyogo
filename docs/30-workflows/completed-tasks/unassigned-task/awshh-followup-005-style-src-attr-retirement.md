# style-src-attr 'unsafe-inline' 撤去（inline style 属性の className 移行） - タスク指示書

## メタ情報

```yaml
issue_number: 924
parent_issue_number: 871
```

| 項目         | 内容                                                   |
| ------------ | ------------------------------------------------------ |
| タスクID     | awshh-followup-005-style-src-attr-retirement           |
| タスク名     | style-src-attr 'unsafe-inline' 撤去                    |
| 分類         | セキュリティ強化（CSP 過渡境界の解消）                 |
| 対象機能     | apps/web Content-Security-Policy / inline style 属性   |
| 優先度       | 中                                                     |
| 見積もり規模 | 大規模（apps/web 全体 UI リファクタを伴う）            |
| ステータス   | 未実施                                                 |
| 発見元       | issue-871-csp-nonce-migration Phase 12 30種思考法レビュー |
| 発見日       | 2026-05-24                                             |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-871-csp-nonce-migration で `script-src` / `style-src` / `style-src-elem` から `'unsafe-inline'` を削除し nonce 化したが、apps/web には `style={{...}}` 属性が広範に残っているため、UI 互換を保つ目的で `style-src-attr 'unsafe-inline'` を「明示的過渡境界」として残置した。

### 1.2 問題点・課題

- `style-src-attr 'unsafe-inline'` が残っている限り、CSS injection 経路の defense-in-depth が完成しない。
- issue #871 の本来目的「`'unsafe-inline'` 全廃」が完了していない。
- 「過渡境界」が追跡されないと恒久化するリスク。

### 1.3 放置した場合の影響

- inline style 経由の CSS exfiltration / UI redress 攻撃面が残る。
- 第三者セキュリティ監査での指摘事項として恒久的に残る。
- CSP nonce 化のセキュリティ価値が「半完成」状態で評価される。

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/web 配下の全 `style={{...}}` 属性を className / Tailwind utility / CSS Module へ移行し、`style-src-attr 'unsafe-inline'` directive を CSP から削除する。

### 2.2 最終ゴール

- `apps/web/src` 配下に `style={{...}}` JSX 属性が存在しない（動的計算が必要なケースは CSS variables 経由）。
- `apps/web/src/lib/security-headers.ts` の `buildCspDirective` から `style-src-attr 'unsafe-inline'` 行を削除。
- focused vitest / playwright smoke が `style-src-attr 'unsafe-inline'` 不在を assert。
- 19 routes でレイアウト退行ゼロ（visual baseline 維持）。

### 2.3 スコープ

#### 含むもの
- `apps/web/src` / `apps/web/app` 配下の `style={{...}}` 全置換。
- 動的 style が必要な箇所の CSS variable 化（`<div style={{ "--x": value } as React.CSSProperties}>` パターンは `style-src-attr 'unsafe-inline'` が必要なため別途検討、または nonce 化で対応）。
- `security-headers.ts` から `style-src-attr` 行削除。
- focused test の期待値更新（`style-src-attr` 不在 / 全 inline 不在）。
- visual baseline 再生成（必要なら）。

#### 含まないもの
- `apps/api` 側の変更。
- D1 schema / Google Form 変更。
- CSP enforce 切替（U-AWSHH-001 のスコープ）。

### 2.4 成果物

- `apps/web` UI 差分（style 属性 → className 移行）。
- `security-headers.ts` の directive 削除差分。
- focused test / Playwright smoke 期待値更新差分。
- visual baseline 更新（必要時）。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-871-csp-nonce-migration が main にマージ済み（nonce 化完了）。
- CSP report-only のまま実行可能（enforce 切替は U-AWSHH-001 と独立）。

### 3.2 依存タスク

- issue-871-csp-nonce-migration（完了済み・本タスクの直接の前提）。

### 3.3 推奨アプローチ

1. `rg "style=\\{\\{" apps/web/src apps/web/app` で全列挙。
2. 静的 style → Tailwind utility / CSS Module 置換。
3. 動的 style（progress bar 幅・色など）→ CSS variable + CSS Module で表現。
4. 一括置換ではなく feature 単位で PR 分割（visual baseline 影響を分散）。
5. 最後の PR で `security-headers.ts` の `style-src-attr` 削除と grep gate 範囲拡大（`style-src-attr` も 0 hit 確認）。

---

## 4. 完了条件チェックリスト

### 機能要件
- [ ] `rg "style=\\{\\{" apps/web/src apps/web/app` 0 hit（または CSS variable パターンのみに限定）
- [ ] `security-headers.ts` から `style-src-attr` 行削除
- [ ] focused test が `style-src-attr 'unsafe-inline'` 不在を assert

### 品質要件
- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` 成功
- [ ] Playwright HTTP smoke / visual baseline 退行ゼロ

### ドキュメント要件
- [ ] `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` から「`style-src-attr` 過渡境界」記述を撤去
- [ ] CLAUDE.md / 不変条件として「`style={{...}}` JSX 属性禁止」を追記

---

## 5. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| visual baseline 大量更新で他PRと衝突 | 中 | 高 | feature 単位 PR 分割、baseline 更新を 1PR ずつ確認 |
| 動的 style の CSS variable 化が困難な箇所がある | 中 | 中 | 個別箇所で nonce inline style 化に逃がす設計余地を残す |
| 第三者 component（react-day-picker 等）が inline style を吐く | 中 | 中 | 棚卸し時に第三者 origin を分類し、別途 nonce 化または許容判定 |

---

## 6. 参照情報

- 親 workflow: `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/`
- spec 整合: `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` U-AWSHH-002 セクション
- 関連: U-AWSHH-001（CSP enforce 切替）/ AWSHH-FU-003（Reporting-Endpoints）

---

## 7. 備考

issue-871-csp-nonce-migration Phase 12 では `style-src-attr 'unsafe-inline'` を「過渡境界の明文化」として一時許容した（広範な UI リファクタを nonce 化と同時に抱え込まない設計判断）。本タスクはその過渡境界の有限性を担保し、CSP の inline 全廃を真に完了させる。
