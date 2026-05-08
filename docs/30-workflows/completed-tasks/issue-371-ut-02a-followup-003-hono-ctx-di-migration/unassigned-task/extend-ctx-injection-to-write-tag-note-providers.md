# write/tag/note provider への ctx 注入パターン展開（評価・必要時実施） - タスク指示書

## メタ情報

```yaml
issue_number: 532
```

## メタ情報

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | extend-ctx-injection-to-write-tag-note-providers                                           |
| タスク名     | write/tag/note provider への ctx 注入パターン展開（評価・必要時実施）                      |
| 分類         | アーキテクチャ改善（評価フェーズ含む条件付き実施）                                         |
| 対象機能     | repository provider 注入経路の横展開判断                                                   |
| 優先度       | low（実需要発生時のみ着手）                                                                |
| 見積もり規模 | 小〜中（評価のみで close する可能性あり）                                                  |
| ステータス   | consumed（Issue #532 workflow で implemented-local 化済み）                                |
| 発見元       | issue-371-ut-02a-followup-003-hono-ctx-di-migration Phase 12 unassigned-task-detection     |
| 発見日       | 2026-05-06                                                                                 |
| 親タスク     | docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration                      |
| タスク種別   | implementation / NON_VISUAL（着手判断時に再確定）                                          |

---

## Consumed Status

この未タスクは Issue #532 workflow
`docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/`
で実装・Phase 12 同期済み。Issue #532 は CLOSED 維持で、後続 PR 文脈では `Refs #532` を使う。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` は、`AttendanceProvider` のみを対象に
「Hono context 経由 DI（`c.var.attendanceProvider` resolve + `attendanceProviderMiddleware` 結線）」のパターンを確立した。
ADR `outputs/phase-03/adr-di-strategy.md` および `outputs/phase-12/unassigned-task-detection.md` で明示しているとおり、
write/tag/note 系 provider への横展開は「実需要が発生した時に評価する」方針として scope out している。
親タスクの index.md `scope out` にも以下が明記されている。

> write/tag/note provider 等の新規 repository 抽象追加（本タスクは AttendanceProvider 1 件のみ移行し、パターン確立に集中）

### 1.2 問題点・課題

- 現状の write 系 / tag 系 / note 系 repository（`apps/api/src/repository/memberTags.ts` /
  `apps/api/src/repository/tagDefinitions.ts` / `apps/api/src/repository/tagQueue.ts` /
  `apps/api/src/repository/adminNotes.ts` 等）は **provider 抽象を持たず**、
  ルート層から直接関数を呼ぶ既存スタイルのまま運用されている
- 同パターンを機械的に展開すると、テスト容易性向上の利益が出ないまま
  middleware / 型定義 / ctx 鍵 / mock 経路が肥大化するリスクがある
- 一方、provider 数が 3-4 を超えた段階では Hono ctx の単一バッグに provider を載せ続ける運用が
  「軽量 DI container 移行検討」の閾値に達するため、**ここで再評価ゲートを通す必要がある**

### 1.3 放置した場合の影響

- write/tag/note 系で「optional `deps?` の再導入」「ad-hoc な mock 戦略の乱立」が起きると、
  親タスクで撤去した silent fallback / signature drift の問題が別経路で再発する
- DI container 移行判断が遅れると、provider 数が増えた後の一括移行コストが増大する
- 未タスクの放置自体が `outputs/phase-12/unassigned-task-detection.md` の
  「実需要発生時に評価」契約と乖離する

---

## 2. 何を達成するか（What）

### 2.1 目的

write/tag/note 系 repository に対して **ctx 注入パターンの適用要否を評価**し、
必要と判断した provider のみを `apps/api/src/middleware/repository-providers.ts` に追加する。
不要と判断した場合は「評価結果と却下根拠」を ADR 的に残し、本未タスクを close する。

### 2.2 最終ゴール

以下のいずれかが達成されていること。

- パターン A（移行不要）: 評価レポートを `outputs/phase-03/` 等に残し、判断根拠とともに本タスクを close
- パターン B（部分移行）: 必要と判断した provider のみ ctx 経路へ移行し、AttendanceProvider と同じ
  middleware / 型 / mock 戦略に揃える
- パターン C（DI container 再評価）: provider 数が 3-4 を超える兆候がある場合、別タスクとして
  「軽量 DI container 移行判断」を切り出す

### 2.3 スコープ

#### 含む

- 現在の write 系 / tag 系 / note 系 repository 実装の棚卸し
  - 対象候補: `apps/api/src/repository/memberTags.ts` / `tagDefinitions.ts` / `tagQueue.ts` /
    `adminNotes.ts` / `notificationOutbox.ts` / `auditLog.ts` 等
- 各 provider 候補について以下の判断材料を収集
  - テストでの mock 化頻度（`apps/api/src/repository/__tests__/` の grep）
  - ルート層からの呼び出し点数
  - silent fallback の有無
  - write 系特有の transaction 境界要件
- 評価結果の ADR 化（`docs/30-workflows/<this-task>/outputs/phase-03/adr-provider-extension.md` 想定）
- 必要と判断した provider のみ ctx 注入移行（既存 `attendanceProviderMiddleware` パターンを再利用）

#### 含まない

- AttendanceProvider 関連の再変更（親タスクで完了済み・契約保護）
- DI container（tsyringe / inversify 等）の本格導入（必要なら別タスクで切り出し）
- D1 schema 変更
- public profile builder への適用（親タスクで scope out 済み）
- production deploy（09a / 09b 責務）

---

## 3. どう実現するか（How）

### 3.1 評価フェーズ（着手時に必ず先行）

1. `apps/api/src/repository/` 配下の write/tag/note 系モジュールを列挙
2. 各モジュールについて以下を集計
   - 利用ルート数（`grep -r` で `apps/api/src/routes/` 配下の import を数える）
   - テスト内での mock 注入頻度
   - 既存の DI 痕跡（optional 引数 / factory 関数の有無）
3. 集計結果を ADR にまとめ、provider 化要否を provider ごとに判定
4. 判定結果に応じて パターン A / B / C のいずれかへ分岐

### 3.2 判断基準（必須チェック）

| 観点 | 移行を検討する閾値 |
| --- | --- |
| テスト内 mock 化頻度 | 3 ファイル以上で同じ repo を mock している |
| ルート層 call site | 5 箇所以上から呼ばれており、テストで部分置換要件がある |
| silent fallback | 暗黙の `[]` / `null` フォールバックが現存している |
| write transaction | 複数 repo を transaction でまとめる要件が見えており、boundary 注入が必要 |

上記いずれにも該当しない provider は **移行対象外**として ADR に却下根拠を残す。

### 3.3 移行フェーズ（パターン B のみ）

- 親タスクの `apps/api/src/middleware/repository-providers.ts` に provider を追加
- `RepositoryProviderVariables` 型を拡張
- 該当ルートの `app.use(...)` に middleware を結線
- mock 経路は親タスクと同じ「ctx 直接 set / fixture middleware」に統一

---

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md`
- 症状: 親タスクの ADR で DI container は「single-provider migration には過剰」として却下されたが、
  この却下根拠は **provider 数 1 件時点の判断**であり、provider 数が 3-4 を超える段階では再評価が必要。
  本タスクで「機械的にパターン展開する」と DI container 移行の閾値判断を素通りしてしまう罠がある。
- 参照: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/unassigned-task-detection.md`

- 対象: `apps/api/src/repository/memberTags.ts` / `tagDefinitions.ts` / `tagQueue.ts` / `adminNotes.ts`
- 症状: 同一パターン（ctx 注入）の機械的展開ではなく、各 provider の **実需要（テスト容易性・mock 化頻度・
  silent fallback の有無）** を判断材料にする必要がある。「parent task と同じ形にすればよい」と決めてかかると、
  AttendanceProvider 固有の理由（read 経路の deps? 引数撤去）を持たない provider まで巻き込んでしまう。
- 参照: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md` Alternatives 表

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| パターンの機械的展開で middleware / 型 / mock 経路が肥大化する | 中 | §3.2 判断基準のいずれかに該当する provider のみ移行対象に含める。ADR で却下根拠を残す |
| provider 数が増えた後に DI container 再評価が漏れる | 高 | 評価フェーズで provider 数が 3-4 を超える兆候がある場合、パターン C（別タスク切り出し）を選択する |
| AttendanceProvider 関連の再変更を巻き込んでしまう | 高 | scope out に明示。親タスクの `attendanceProviderMiddleware` / builder シグネチャに触らないことを Phase 1 完了条件にする |
| write transaction 境界の見落とし | 中 | 評価フェーズで write 系 repo は transaction 要件の有無を必ず確認する |
| 評価のみで close した場合に「やり残し」と誤認される | 低 | パターン A（移行不要）採用時は ADR を `outputs/phase-03/` に残し、close 理由を明示する |

---

## 検証方法

### 評価フェーズ完了の検証

```bash
# write/tag/note 系モジュールの棚卸し
ls apps/api/src/repository/ | grep -Ei "tag|note|outbox|audit|members|magicTokens|identity|adminUsers"

# 各モジュールの mock 化頻度を集計
mise exec -- grep -rln "vi.mock.*repository/(memberTags|tagDefinitions|tagQueue|adminNotes)" apps/api/src

# ADR が出力されているか
test -f docs/30-workflows/<this-task>/outputs/phase-03/adr-provider-extension.md
```

期待: ADR が存在し、provider ごとに「移行 / 据え置き」の判定根拠が記載されている

### 移行フェーズ完了の検証（パターン B 採用時のみ）

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test
```

期待:
- typecheck / lint 全 PASS
- 移行対象 provider について、`apps/api/src/repository/__tests__/` の mock が ctx 注入経路に統一されている
- silent fallback（暗黙 `[]` / `null`）が新たに導入されていない（`grep -r "?? \[\]" apps/api/src/repository/_shared/`）

### close 時の検証（パターン A 採用時）

- ADR で「移行不要」と判定された全 provider について、却下根拠が §3.2 判断基準のどの項目に該当するか明示されている
- 本未タスクファイルが `docs/30-workflows/completed-tasks/` 配下へ移動 or close 注記が追記されている

---

## スコープ

### 含む

- 現在の write/tag/note provider 候補実装の調査・棚卸し
- ctx 注入パターン適用の必要性評価（§3.2 判断基準による）
- 必要と判断した provider のみの移行（既存 `attendanceProviderMiddleware` パターン再利用）
- 評価結果 ADR の作成

### 含まない

- AttendanceProvider 関連の再変更（→ 親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` で完了済み・契約保護）
- DI container（tsyringe / inversify 等）の本格導入（→ provider 数が 3-4 を超える場合は別タスクで切り出し）
- public profile builder（`buildPublicMemberProfile`）への適用（→ 親タスク scope out 継承）
- D1 schema 変更
- production deploy（09a / 09b 責務）

---

## 4. 関連リンク

| 種別 | パス | 用途 |
| --- | --- | --- |
| 親タスク index | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md` | scope out / 横展開保留の正本 |
| 親タスク ADR | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md` | DI container 却下根拠（再評価の起点） |
| 親タスク未タスク検出 | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/unassigned-task-detection.md` | 「実需要発生時に評価」契約 |
| 実装基盤 | `apps/api/src/middleware/repository-providers.ts` | 既存 middleware（拡張時の参照） |
| 実装基盤 | `apps/api/src/repository/_shared/builder.ts` | ctx 解決経路の既存実装 |
| 実装基盤 | `apps/api/src/repository/_shared/provider-context.ts` | RepositoryProviderCtx 型 |
| 候補 | `apps/api/src/repository/memberTags.ts` | tag 系 provider 候補 |
| 候補 | `apps/api/src/repository/tagDefinitions.ts` | tag 系 provider 候補 |
| 候補 | `apps/api/src/repository/tagQueue.ts` | tag 系 provider 候補 |
| 候補 | `apps/api/src/repository/adminNotes.ts` | note 系 provider 候補 |
| 候補 | `apps/api/src/repository/notificationOutbox.ts` | write/notify 系 provider 候補 |
