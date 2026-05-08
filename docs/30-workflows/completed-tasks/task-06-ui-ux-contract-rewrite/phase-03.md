# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 3 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 2 (設計) |
| 下流 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 2 の章立て設計と §2 / §3 列構成を simpler alternative と比較し、PASS / MINOR / MAJOR を判定する。「もっと統合 / 分解できないか」「漏れはないか」を 3 案以上で検証し、契約書き換え GO 判定の根拠を残す。§4.5 prototype 由来契約 19 行の取り込みが漏れなく行われることを checklist で保証する。

## 実行タスク

1. alternative 案 3 つ以上を列挙
   - 案 A: 旧章立て維持（§7 内に契約サブセクションを増設）
   - 案 B: 完全書き換え（採用案・元仕様書 §4.2 の新章立て §1〜§10）
   - 案 C: 部分書き換え（§3 / §6 のみ追加、§3〜§6 の旧視覚詳細は残す）
2. それぞれを 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価
3. PASS / MINOR / MAJOR を判定
4. 採用案を確定（案 B）し、漏れチェック表を埋める
5. §2 trace check（phase-3.md §2 と新 §2 の API 列の routes × endpoint × method 3 タプル完全一致）の手順を Phase 3 で確定
6. §4.5 prototype 由来契約 19 行 checklist を作成
7. outputs/phase-03/main.md を生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象 |
| 必須 | outputs/phase-02/chapter-skeleton.md | 章スケルトン |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md | 元仕様書 §4 / §6.4 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | API 接続表 §2（trace check 比較対象） |
| 必須 | CLAUDE.md | 不変条件 |

## Alternative 案の評価

### 案 A: 旧章立て維持（§7 内に契約サブセクション増設）

| 観点 | 評価 |
| --- | --- |
| 価値性 | NG: 旧 §3〜§6 に視覚詳細が残ったまま contract が増えるため、grep が一意にならず後続 task が混乱 |
| 実現性 | OK |
| 整合性 | NG: 09b との二重正本リスクが残る。§6.2 grep gate を pass できない |
| 運用性 | NG: 後続 task-07 / 08 / 19..22 が link 先を確定できず並列性が壊れる |
| 判定 | **MAJOR**（reject） |

### 案 B: 完全書き換え（採用案）

| 観点 | 評価 |
| --- | --- |
| 価値性 | OK: §2 で 19 routes 契約が grep 可能、§3 で primitives + feature components が grep 可能 |
| 実現性 | OK: 1.0 人日想定、書き換え 1 ファイルのみ |
| 整合性 | OK: 不変条件 #2 / #3 / #5 / #6 を §2 / §4.6 で物理的に表現、09b との責務境界が明確 |
| 運用性 | OK: 09a..09h への link 経路で task-07 / 08 / 19..22 が並列着手可能、git revert で完全 rollback |
| 判定 | **PASS**（採用） |

### 案 C: 部分書き換え（§3 / §6 のみ追加、§3〜§6 の旧視覚詳細を残す）

| 観点 | 評価 |
| --- | --- |
| 価値性 | MINOR: contract が増えるが視覚詳細が残るため §6.2 grep gate を pass できない |
| 実現性 | OK |
| 整合性 | NG: 視覚詳細が 09-ui-ux.md と 09b に二重存在 |
| 運用性 | MINOR: token 値変更時に同期事故が起きる |
| 判定 | **MINOR**（reject 理由: §6.2 grep gate を pass する根本対策にならない。AC-8 が満たせない） |

## 4 条件評価（採用案 B）

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 後続 22 並列タスクをブロック解除できるか | PASS | §2 / §3 の grep 可能 contract 表で 1 行 → 1 ファイル決定論対応 |
| 実現性 | 1 サイクル / 1.0 人日で完了するか | PASS | 書き換え 1 ファイルのみ・新規作成削除なし |
| 整合性 | 不変条件 #2 / #3 / #5 / #6 と矛盾しないか | PASS | §2 で API 列を `apps/api` 経由に統一、§4.6 で gas-prototype 不採用、§2.1.4 / §2.2.2 で consent キー統一 |
| 運用性 | rollback / handoff / same-wave sync が成立するか | PASS | git revert で完全 rollback、task-07 / 08 と path のみで疎結合、Phase 12 で implementation-guide |

## 漏れチェック（4 軸）

### A. 19 routes + global fallback 網羅

| 層 | route | §2 配置 | 状態 |
|----|-------|---------|------|
| 公開 | `/` | §2.1.1 | OK |
| 公開 | `/(public)/members` | §2.1.2 | OK |
| 公開 | `/(public)/members/[id]` | §2.1.3 | OK |
| 公開 | `/(public)/register` | §2.1.4 | OK |
| 公開 | `/privacy` | §2.1.5 | OK |
| 公開 | `/terms` | §2.1.6 | OK |
| 会員 | `/login` | §2.2.1 | OK |
| 会員 | `/profile` | §2.2.2 | OK |
| 管理 | `/(admin)/admin` | §2.3.1 | OK |
| 管理 | `/(admin)/admin/members` | §2.3.2 | OK |
| 管理 | `/(admin)/admin/tags` | §2.3.3 | OK |
| 管理 | `/(admin)/admin/meetings` | §2.3.4 | OK |
| 管理 | `/(admin)/admin/schema` | §2.3.5 | OK |
| 管理 | `/(admin)/admin/requests` | §2.3.6 | OK |
| 管理 | `/(admin)/admin/identity-conflicts` | §2.3.7 | OK |
| 管理 | `/(admin)/admin/audit` | §2.3.8 | OK |
| 共通 | `app/error.tsx` | §2.4.1 | OK |
| 共通 | `app/global-error.tsx` | §2.4.2 | OK |
| 共通 | `app/not-found.tsx` | §2.4.3 | OK |
| 共通 | `app/loading.tsx` | §2.4.4 | OK |

### B. primitives 13 + feature components 網羅

| 種別 | 期待件数 | §3 配置 | 状態 |
|------|---------|---------|------|
| primitives | 13 | §3.1.1 〜 §3.1.13 | OK |
| feature components | 29（Hero / Stats / ZoneGuide / Timeline / MemberCard / MemberList / FilterBar / DensityToggle / MemberDetail / VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel / KpiGrid / ZoneChart / StatusChart / RecentActions / MembersTable / MemberDrawer / TagsQueue / MeetingsCalendar / MeetingForm / RequestsQueue / RequestDetail / SchemaDiff / ConflictPair / AuditTimeline / AuditFilterBar / LegalProse） | §3.2.x | OK |

### C. §4.5 prototype 由来契約 19 行 checklist

- [ ] L01 `primitives.jsx` Chip → §3.1 Badge
- [ ] L02 `primitives.jsx` Button → §3.1 Button
- [ ] L03 `primitives.jsx` Switch → §3.1 Switch
- [ ] L04 `primitives.jsx` Segmented → §3.1 Segmented
- [ ] L05 `primitives.jsx` Field → §3.1 Field
- [ ] L06 `primitives.jsx` Drawer → §3.1 Drawer + §5.2
- [ ] L07 `primitives.jsx` Modal → §3.1 Modal + §5.2
- [ ] L08 `primitives.jsx` Toast → §3.1 Toast + §5.4
- [ ] L09 `primitives.jsx` KVList → §3.1 KVList
- [ ] L10 `primitives.jsx` LinkPills → §3.2 LinkPills
- [ ] L11 `primitives.jsx` zoneTone/statusTone → §6.3 token mapping
- [ ] L12 `pages-public.jsx` LandingPage → §2.1.1 `/`
- [ ] L13 `pages-public.jsx` MemberListPage → §2.1.2 `/(public)/members`
- [ ] L14 `pages-public.jsx` MemberDetailPage → §2.1.3 `/(public)/members/[id]`
- [ ] L15 `pages-member.jsx` LoginPage → §4.2 login 5 状態
- [ ] L16 `pages-member.jsx` MyProfilePage → §2.2.2 `/profile`
- [ ] L17 `pages-admin.jsx` AdminDashboardPage → §2.3.1 `/(admin)/admin`
- [ ] L18 `pages-admin.jsx` AdminMembersPage → §2.3.2 `/(admin)/admin/members`
- [ ] L19 `pages-admin.jsx` AdminTagsPage / SchemaDiffPage → §2.3.3 / §2.3.5

### D. 不変条件マッピング

| 不変条件 | 確認項目 | 状態 |
|---------|---------|------|
| #2 consent キー | §2.1.4 register / §2.2.2 profile に `publicConsent` / `rulesConsent` 明示 | 設計済 |
| #3 responseEmail | §2.2.2 profile / §2.3.2 admin members に system field 注記 | 設計済 |
| #5 D1 直接アクセス禁止 | §2 全 routes API 列が `apps/api` 経由 | 設計済 |
| #6 GAS prototype 非昇格 | §4.6 / §8 で gas-prototype 由来挙動を不採用明示 | 設計済 |

## §2 trace check 手順（元仕様書 §6.4 由来）

1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` の §2 API 接続表を読み込む
2. 新 09-ui-ux.md §2 の各 routes 表「API」列を抽出（19 routes 分）
3. routes × endpoint × method の 3 タプルが行レベルで完全一致することを目視確認
4. 一致しない行が 1 件でもあれば PASS にしない
5. 確認結果を outputs/phase-03/main.md に記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用設計（案 B）に対するテスト計画の入力 |
| Phase 7 | AC マトリクスのトレース元 |
| Phase 10 | GO/NO-GO の根拠 |

## 多角的チェック観点（不変条件参照）

- **#2**: 案 B が §2.1.4 / §2.2.2 で consent キー統一を物理表現
- **#3**: 案 B が §2.2.2 / §2.3.2 で responseEmail を system field 注記
- **#5**: 案 A / C は D1 直接アクセスを許す表現が残るリスク → 案 B で物理排除
- **#6**: §4.6 / §8 で gas-prototype 不採用明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 案 3 件列挙 | 3 | completed | A / B / C |
| 2 | 4 条件評価表 | 3 | completed | 各案 |
| 3 | PASS / MINOR / MAJOR 判定 | 3 | completed | 採用案 B |
| 4 | 漏れチェック A〜D | 3 | completed | 19 routes / primitives / 19 行 / 不変条件 |
| 5 | §2 trace check 手順確定 | 3 | completed | phase-3.md §2 vs 新 §2 |
| 6 | outputs 作成 | 3 | completed | outputs/phase-03/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果（alternative + 判定 + 漏れチェック + trace check 手順） |
| メタ | artifacts.json | Phase 3 を completed |

## 完了条件

- [ ] alternative 案 3 件以上が 4 条件評価済み
- [ ] 採用案 B が明示され、reject 案 A / C の reject 理由が記録
- [ ] 漏れチェック A（19 routes）/ B（primitives 13 + feature components）/ C（19 行）/ D（不変条件）が網羅
- [ ] §2 trace check 手順が記述済み
- [ ] 判定が PASS（または MINOR で blocker なし）

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] outputs/phase-03/main.md 配置済み
- [ ] 採用案 B 決定
- [ ] artifacts.json 更新

## 最終判定

**GO**（PASS）。採用案 B（完全書き換え）で Phase 4 に進む。

## 次 Phase

- 次: Phase 4（テスト戦略）
- 引き継ぎ事項: 採用案 B → verify suite（grep gate / markdown lint / trace check）の対象
- ブロック条件: PASS 判定が出ていない
