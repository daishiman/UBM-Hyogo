# Stats SectionCard の aria-labelledby 復元（region アクセシブル名の回帰修正） - タスク指示書

## メタ情報

```yaml
issue_number: 1212
task_id: public-member-common-ui-card-unification-followup-001-stats-section-aria-labelledby
task_name: Stats SectionCard の aria-labelledby 復元
category: バグ修正
target_feature: 公開トップ /（Home）統計セクションのランドマーク・アクセシブル名
priority: 低
scale: 小規模
status: 未実施
source_phase: public-member-common-ui-card-unification の close-out 2回検証（CONST_002）で検出
created_date: 2026-06-11
dependencies: [public-member-common-ui-card-unification]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | public-member-common-ui-card-unification-followup-001-stats-section-aria-labelledby |
| タスク名 | Stats SectionCard の aria-labelledby 復元 |
| 分類 | バグ修正（AC-7 アクセシビリティ回帰） |
| 対象機能 | 公開トップ `/`（Home）統計セクション |
| 優先度 | 低 |
| 見積もり規模 | 小規模（1〜2行 + 回帰テスト1本） |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/`（close-out 独立2回検証） |
| 関連 Issue | #1212 |
| 関連 | 親ワークフロー `public-member-common-ui-card-unification` AC-7 |

---

## 1. なぜこのタスクが必要か

親ワークフロー `public-member-common-ui-card-unification` は、公開8画面を共通レイアウトプリミティブ層へ統一する過程で、`apps/web/src/components/public/Stats.tsx` の素の `<section>` を新プリミティブ `SectionCard` でラップした。

その移行で、移行前に存在していた region のアクセシブル名付与（`aria-labelledby="stats-heading"`）が脱落した。

- 移行前: `<section data-component="stats" aria-labelledby="stats-heading">` … `<h2 id="stats-heading" class="sr-only">` を参照し、section が**名前付き region ランドマーク**として公開されていた。
- 移行後: `<SectionCard as="section" data-component="stats">` … `aria-labelledby` が渡されておらず、`<h2 id="stats-heading" class="sr-only">` は残存するものの **section へのラベル関連付けが切れている**（名前なし section = region ランドマークでなくなる）。

これは親タスクの受入条件 **AC-7「既存 `data-testid` / `aria-label` / `role` が全て保持される」** に対する回帰である。`SectionCard` は props interface で `"aria-labelledby"?: string` を明示宣言し `...rest` で DOM へ透過する設計（`apps/web/src/components/ui/layout/SectionCard.tsx`）であり、プリミティブ側は対応済み・呼び出し側の渡し忘れが真因。`Stats.tsx` のコメントは「I-7 aria-labelledby 互換」と称しているが、実際には属性が欠落しており**コメントと実装が乖離**している。

既存 component spec に当該関連付けを検証するアサーションが無いため、テストでも捕捉されていない（AC-7 の「既存 spec が GREEN」が空虚に PASS している）。

## 2. 何を達成するか

`/`（Home）統計セクションを、移行前と同等の**名前付き region ランドマーク**へ復元する。

### 受け入れ基準

- AC-F1: `Stats.tsx` の `SectionCard as="section"` に `aria-labelledby="stats-heading"` が渡され、`<h2 id="stats-heading">` と関連付けられている。
- AC-F2: レンダリング後の DOM で、`data-component="stats"` の section が `aria-labelledby="stats-heading"` 属性を持つ。
- AC-F3: 上記関連付けを検証する component spec（`*.spec.tsx`）が追加され GREEN。回帰の再発を機械検知できる。
- AC-F4: `Stats.tsx` のコメントが実装と一致する（属性付与の事実を反映）。
- AC-F5: `apps/api/src` 非接触・HEX 直書き 0・inline style 0（親タスク不変条件を継続）。

## 3. 実行方針

1. `apps/web/src/components/public/Stats.tsx` の `<SectionCard as="section" data-component="stats">` に `aria-labelledby="stats-heading"` を追加する（`SectionCard` は既に当該 prop を透過する設計のため、プリミティブ改修は不要）。
2. 他の SectionCard ラップ画面（`AttendanceList` 等、移行で `aria-label`/`aria-labelledby` を SectionCard prop 経由へ移譲した箇所）も同種の脱落がないか横断 grep し、ついでに検証する。
3. `Stats` の component spec に、section が `aria-labelledby="stats-heading"` を持つことのアサーションを追加する。
4. `mise exec -- pnpm --filter @ubm/web test` / `typecheck` / `lint` / `verify:tokens` で GREEN を確認する。

> 親タスクの実装はまだ未コミット（Phase 13 PR は user-gated）であるため、本修正は親ブランチの PR 作成時に同梱して畳み込むのが望ましい。独立 PR にする必要はない。

## 4. 変更対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/src/components/public/Stats.tsx` | `SectionCard` に `aria-labelledby="stats-heading"` 追加 + コメント整合 |
| `apps/web/src/components/public/__tests__/Stats.spec.tsx`（新規 or 既存追補） | aria-labelledby 関連付けの回帰アサーション追加 |

## 苦戦箇所【記入必須】

- **プリミティブ移行で a11y 属性が「サイレントに脱落」する典型パターン**: 素の `<section aria-labelledby=...>` をラッパーコンポーネントへ置換する際、ラッパーが当該属性を透過する設計でも、**呼び出し側で prop を渡し忘れると無言で欠落する**。`data-testid` の脱落は既存テストが落ちて気付けるが、`aria-labelledby` のような関連付けはアサーションが無いと CI を素通りする。
- **コメントが実装の証拠にならない**: `Stats.tsx` は「I-7 aria-labelledby 互換」とコメントしていたが属性は無かった。コメントの主張と DOM 実体は別物として、**移行前後の `git show HEAD:<file>` 差分で属性レベルの比較**を行うのが確実な検出法だった（実際この差分照合で検出できた）。
- **AC「既存 a11y 保持」検証の盲点**: AC-7 のような「既存属性を全保持」系受入条件は、**保持を主張するだけの spec（属性アサーション無し）では空虚に PASS する**。保持対象の属性を1つずつ明示アサートしないと回帰を捕捉できない。今回の close-out では、AC-7 を「テスト GREEN」だけで COMPLETED 判定した先行検出（unassigned-task-detection.md）を、独立2回検証（CONST_002）の DOM 属性レベル照合が上書きして検出した。プリミティブ大量移行タスクでは a11y 属性の before/after grep を検証手順に組み込むべき。
