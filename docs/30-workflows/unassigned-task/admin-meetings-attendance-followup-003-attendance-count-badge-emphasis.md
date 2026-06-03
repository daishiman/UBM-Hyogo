# admin 出席人数バッジの色強調（視覚演出） - タスク指示書

## メタ情報

```yaml
issue_number: 1112
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-meetings-attendance-followup-003-attendance-count-badge-emphasis |
| タスク名 | admin 開催日タイムラインの出席人数バッジに多数出席時の色強調を追加 |
| 分類 | 改善 |
| 補足分類 | UX 改善 (post-MVP) |
| 対象機能 | `/admin/meetings` 開催日タイムラインの出席人数バッジ表示 |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| GitHub Issue | 未起票（後続） |
| 発見元 | `admin-meetings-attendance-404-fix-and-ux` Phase 10 §10.6 MINOR 指摘 |
| 発見日 | 2026-06-03 |
| canonical source | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-10/phase-10.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`admin-meetings-attendance-404-fix-and-ux` workflow で、開催日タイムラインの各カード見出しに出席人数バッジ（「N 名出席」/ 0 名時「出席 未登録」）を表示する機能要件（AC-B2）を充足した。実装は `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` の `attendanceLabel`（35 行）と `ui-badge`（57 行）で完結している。

Phase 10 §10.6 では「出席人数バッジの色強調（多数出席時のハイライト等）視覚演出」を MINOR / enhancement として未タスク候補に分類した。理由は「機能要件は人数表示で充足。視覚演出は token 追加を伴うため別関心」であり、当該 workflow のスコープ外として Phase 12 へ送られた。

### 1.2 問題点・課題

- 現状のバッジは出席人数の多寡に関わらず単一スタイル（`ui-badge`）で描画され、人数による視覚的な強弱が一切ない。
- 運用者が複数の開催日を一覧で見る際、出席が多い回／少ない回を色や強調で素早く判別できない。
- 「未登録」と「少数出席」と「多数出席」が同じ見た目のため、一覧スキャン時の情報密度が低い。

### 1.3 放置した場合の影響

- 機能上の問題は一切ない。人数は正しく表示されており、データ正確性・操作可否に影響しない。
- 影響は一覧時の視認性のみに限定されるため、優先度は**低**。MVP 完了後の磨き込みとして扱う。
- 放置しても回帰やデータ不整合は発生しない。

---

## 2. 何を達成するか（What）

### 2.1 目的

出席人数バッジに、出席人数に応じた色強調（多数出席時のハイライト等）の視覚演出を加え、一覧スキャン時の判別性を高める。

### 2.2 最終ゴール

- バッジが、出席人数の閾値に応じて強調表示（色のトーン差等）に切り替わる。
- 強調色はすべて OKLch トークン（`apps/web/src/styles/tokens.css`）経由で定義され、HEX 直書きや `bg-[#xxx]` / `text-[#xxx]` が一切ない。
- 既存 `ui-badge` primitive を基盤とし、新規 primitive を増やさない。
- 既存テストおよび新規閾値テストが green。

### 2.3 受け入れ基準

- [ ] 出席人数の閾値に応じてバッジの見た目（色強調）が変化する。閾値の定義（後述）が仕様として明記されている。
- [ ] バッジで使用する色はすべて `tokens.css` の OKLch トークン経由であり、`docs/00-getting-started-manual/specs/design-tokens.md` にトークン追加が反映されている（新規トークンを追加する場合）。
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がなく、CI gate `verify-design-tokens` が PASS。
- [ ] 新規 primitive を増やさず、既存 `ui-badge` の variant（modifier class / data 属性）で構成する。
- [ ] 既存 `MeetingTimeline.spec.tsx` が green（人数表示・0 名表示の既存挙動が drift しない）。
- [ ] 本タスクは色のみの静的強調であり animation を含まないため、`prefers-reduced-motion` 対応は不要（不要である旨を実装メモに明記）。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | バッジ描画（35 行 `attendanceLabel` / 57 行 `ui-badge`）に閾値判定と強調 class / data 属性を付与 |
| `apps/web/src/styles/tokens.css` | 強調用 OKLch トークンの追加（既存トークンで足りる場合は追加せず流用） |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | 閾値別の class / data 属性付与を検証する assertion 追加 |
| `docs/00-getting-started-manual/specs/design-tokens.md` | トークンを新規追加する場合の正本反映 |

### 3.2 実装方針

- `attendanceCount`（34 行で算出済み）を入力に、強調レベルを決める閾値判定を追加する。まず「未登録（0 名）」「通常」「多数出席（強調）」の最小 3 段階で検討する。
- バッジ要素に強調を示す modifier（例: `ui-badge--emphasis` 等の既存命名規則に沿った class）または `data-attendance-level` 属性を付与し、CSS 側で OKLch トークンに紐づけた強調スタイルを当てる。
- 強調色は既存の `--ubm-color-accent*` / `--ubm-color-ok*` 等のトークンで賄えるか先に確認し、賄えない場合のみ新規トークンを `tokens.css` に追加して `design-tokens.md` に反映する。
- 出席数の集計ロジック（`getAttendanceCount` / `m.attendance`）には一切手を入れず、表示層のみで完結させる。

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260602-192059-wt-15/docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-10/phase-10.md`
- 症状: 「多数出席」の閾値が未定義。会員規模は小さく開催 12 回程度であり、固定閾値（例: N 名以上）と開催規模に対する相対閾値のどちらが妥当か判断材料が乏しい。閾値を恣意的に決めると強調が常時点灯／常時消灯になり演出として機能しない恐れがある。先に直近開催の実出席分布を確認して閾値を決める必要がある。
- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260602-192059-wt-15/apps/web/src/styles/tokens.css`
- 症状: 強調色を新規 OKLch トークンとして足す場合、`tokens.css` への追加だけでは不十分で、`docs/00-getting-started-manual/specs/design-tokens.md`（トークン正本仕様）と CI gate `verify-design-tokens` の**両方**を整合させる必要がある。片方だけ更新すると gate が fail する。既存の `--ubm-color-accent*` / `--ubm-color-ok*` 等で賄えるなら新規トークン追加自体を回避できるため、流用可否の見極めが先決。
- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260602-192059-wt-15/apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`
- 症状: 57 行の `ui-badge` は admin 横断で使われる共有 primitive のため、`ui-badge` 本体のスタイルを直接変えると他箇所のバッジに波及するリスクがある。プロトタイプ正本順位（新規 primitive を増やさない）に従いつつ、強調は modifier class / data 属性に閉じるか、`ui-badge` を拡張するかの判断が必要。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| HEX 直書き / `bg-[#xxx]` 混入で `verify-design-tokens` gate に抵触する | 中 | 強調色は `tokens.css` の OKLch トークン経由のみとし、実装後に HEX grep と `verify-design-tokens` をローカル実行して PASS を確認する |
| 「多数出席」閾値が小規模な実出席分布に合わず、強調が常時点灯／常時消灯になる | 中 | 直近開催の実出席数分布を確認した上で閾値を決め、最小 3 段階（未登録 / 通常 / 多数）から開始する。固定 or 相対の選択理由を仕様に残す |
| `ui-badge` 本体変更による他バッジへの波及 | 低 | 強調は `ui-badge` の modifier class / data 属性に閉じ込め、共有 primitive 本体の既定スタイルは変更しない |
| 色以外の演出（animation / icon 追加等）にスコープが広がる | 低 | 本タスクは色強調のみに限定し、animation・他バッジ波及は別件として扱う（スコープ参照） |

---

## 検証方法

### 単体検証

apps/web に `vitest.config.ts` が無いためリポジトリルートから実行する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx
```

期待: 既存の人数表示・0 名表示の assertion が green を維持し、閾値別の強調 class / data 属性付与の新規 assertion が PASS。

### 統合検証（VISUAL）

- staging での出席人数バッジ強調の screenshot 取得は user-gated。ユーザー承認後に staging で多数出席／少数出席／未登録の見た目差分を確認する。

### 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx
```

加えて CI gate `verify-design-tokens` を実行し、トークン正本（`design-tokens.md`）と `tokens.css` の整合 / HEX 直書き不在を確認する。

期待: typecheck / lint が 0 error、HEX・`bg-[#xxx]`・`text-[#xxx]` の grep ヒットが 0 件、`verify-design-tokens` が PASS。

---

## スコープ

### 含む

- 出席人数バッジの色強調（多数出席時のハイライト等）視覚演出。
- 強調に必要な OKLch トークンの定義（新規追加時は `tokens.css` + `design-tokens.md` の両正本反映）。
- 閾値判定ロジックの表示層追加と、`MeetingTimeline.spec.tsx` の閾値別 assertion 追加。

### 含まない

- 出席数の集計・算出ロジック（`getAttendanceCount` / `m.attendance`）の変更。
- `/admin/meetings` 以外の他バッジ・他画面への強調波及。
- animation / transition による演出（色以外の動的演出は別件・本タスクは静的色強調のみ）。
- API / D1 schema / Google Form 仕様の変更。
- production / staging deploy、commit、push、PR、Issue 起票・close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`
- canonical source（MINOR 指摘）: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/outputs/phase-10/phase-10.md` §10.6
- 対象 component: `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`
- 既存テスト: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx`
- トークン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
