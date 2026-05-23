# Phase 3: 設計レビュー

[実装区分: ドキュメントのみ]

**判定根拠**: Phase 2 設計の整合確認のみで、ファイル編集 / runtime code 変更を伴わない。

---

## メタ情報

| 項目 | 値 |
|------|----|
| Workflow | issue-291-forms-d1-legacy-followup-cleanup |
| 実装区分 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #291 (CLOSED, Refs only) |

## 目的

Phase 2 の `classification-policy.md` が以下の正本群と矛盾しないことを確認し、Phase 4 へ進めるか go/no-go 判定する。

- `task-sync-forms-d1-legacy-umbrella-001` の close-out 成果物
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- 不変条件 #1 / #5 / #7

---

## 2. スコープ

### 対象

- 分類アルゴリズムの矛盾チェック
- references 更新方針 vs umbrella close-out current facts
- backlog supersede 理由 vs umbrella close-out scope
- 逆リンク戦略 vs 完了済みタスク履歴保全
- indexes 再生成タイミング vs CI gate `verify-indexes-up-to-date`

### 対象外

- 編集作業の実施
- 新規分類カテゴリの追加（Phase 2 で固定済み）

---

## 3. 前提条件

- Phase 2 `classification-policy.md` が完成済み
- umbrella close-out 成果物 6 種（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が読める

---

## 実行タスク

### 4.1 umbrella close-out との整合確認

| 確認項目 | 検証方法 | 期待 |
|---------|---------|------|
| current Forms API 経路（`/admin/sync/schema` / `/admin/sync/responses`） | umbrella `implementation-guide.md` の API 表と Phase 2 更新方針を突合 | 完全一致 |
| current D1 table（`sync_jobs`） | umbrella `system-spec-update-summary.md` の table 表と Phase 2 supersede 理由を突合 | `sync_jobs` 一本化が明記されている |
| 関連 5 タスク（03a / 03b / 04c / 09b / 02c） | umbrella `artifacts.json` の `specs_referenced` と Phase 2 逆リンク対象を突合 | 5/5 一致 |

### 4.2 specs との整合確認

| spec | 確認項目 | 期待 |
|------|---------|------|
| `08-free-database.md` | D1 sync table 仕様 | Phase 2 で `sync_jobs` を current にする方針と一致 |
| `13-mvp-auth.md` | admin authentication | `SYNC_ADMIN_TOKEN` の射程記述が両者で一致 |

### 4.3 不変条件チェック

- 不変条件 #1（schema 過剰固定回避）: references 編集で「正本」を強めすぎていないか
- 不変条件 #5（`apps/web` → D1 直接アクセス禁止）: 編集で違反する記述追加がないか
- 不変条件 #7（Form 再回答が本人更新の正式経路）: Forms API current 方針と矛盾しないか

### 4.4 CI gate との整合

- `verify-indexes-up-to-date`: Phase 5 で indexes 再生成タイミングを最終編集後に置く設計と整合
- `verify-test-suffix`: 本タスクは test ファイル追加なしのため非該当
- `verify-design-tokens`: 同上、非該当

### 4.5 go/no-go 判定

すべての確認項目が PASS であれば Phase 4 へ。1 件でも矛盾があれば Phase 2 へ差し戻し、`classification-policy.md` を修正後に再レビュー。

---

## 統合テスト連携

- docs-only / NON_VISUAL のため runtime 統合テストは非該当。代替として rg scan、path existence、artifacts parity、Phase 12 readiness を各 phase の gate として扱う。

## 成果物

| ファイル | 内容 |
|---------|------|
| `outputs/phase-03/main.md` | レビュー結果サマリ・go/no-go 判定・矛盾検出有無 |

---

## 完了条件

- [ ] umbrella close-out 6 成果物との整合確認済み
- [ ] specs 08 / 13 との整合確認済み
- [ ] 不変条件 #1 / #5 / #7 違反なし
- [ ] CI gate との整合確認済み
- [ ] go 判定 OR Phase 2 差し戻し決定
- [ ] `artifacts.json` phase 3 status → `completed`

---

## 7. リスクと対策

| リスク | 対策 |
|--------|------|
| umbrella close-out 成果物自体に drift がある | drift を見つけた場合は本 phase を継続し、umbrella close-out の修正は別 follow-up として `unassigned-task-detection.md` に起票 |
| specs との矛盾を見落とす | `08-free-database.md` の D1 table 表記と Phase 2 更新方針を 1:1 突合する |

---

## 参照資料

- Phase 2 `outputs/phase-02/classification-policy.md`
- `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/outputs/phase-12/`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`

---

## 9. 次フェーズへの引き継ぎ

Phase 4 で regression scan / conflict marker scan / index drift scan のテスト戦略を確定する。本 phase で go 判定済みの分類方針を入力とする。
