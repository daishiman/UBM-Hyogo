# documentation-changelog.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| 変更日 | 2026-04-29 |
| タスク | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| 種別 | docs-only / NON_VISUAL skill 改修 |

---

## 変更サマリー

`task-specification-creator` skill 6 ファイルへ docs-only / NON_VISUAL 縮約テンプレ関連の追記を実施。
mirror（`.agents/skills/task-specification-creator/`）も同期済（`diff -qr` 0 行）。
本ワークフロー自身（outputs/phase-01〜13）も新規追加。

---

## 1. skill 本体への追記（`.claude/skills/task-specification-creator/`）

### 1-1. `SKILL.md`

- 追記セクション: 「タスクタイプ判定フロー」
- 内容: `artifacts.json.metadata.visualEvidence` と `taskType` の AND 条件で縮約テンプレ発火を判定するフロー図
- 出処: Phase 2 設計 §3「タスクタイプ判定フローの設計」

### 1-2. `references/phase-template-phase11.md`

- 追記セクション: 「docs-only / NON_VISUAL 縮約テンプレ」
- 内容: 必須 outputs 3 点固定（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）、screenshot 不要明文化、AC-8 機械検出ルール
- 出処: Phase 2 設計 §4「Phase 11 縮約テンプレ実体」

### 1-3. `references/phase-template-phase12.md`

- 追記セクション: 「Part 2 必須 5 項目（C12P2-1〜C12P2-5）」
- 内容: TS 型定義 / API シグネチャ / 使用例 / エラー処理 / 設定値 の 5 項目チェックリスト化と「該当なし」明示宣言ルール
- 出処: Phase 2 設計 §5「Phase 12 Part 2 5 項目チェック」

### 1-4. `references/phase-12-completion-checklist.md`

- 追記セクション: C12P2-1〜5 一対一対応行 + docs-only 判定ブランチ
- 内容: docs-only タスクで C12P2-1 / C12P2-2 を「該当なし」宣言で代替できる旨の判定行
- 出処: Phase 2 設計 §5 + Phase 5 docs-only ブランチ追加

### 1-5. `references/phase-template-phase1.md`

- 追記セクション: Phase 1 必須入力（visualEvidence）
- 内容: `visualEvidence` メタ未設定時の Phase 1 fail-fast ルール
- 出処: Phase 2 設計 §6「Phase 1 必須入力ルール」

### 1-6. `references/phase-template-core.md`

- 追記セクション: 参照リンク（state ownership 分離）
- 内容: workflow root 状態（`spec_created`）と `phases[].status`（`completed`）の責務分離説明への参照リンク
- 出処: Phase 2 設計 §7「state ownership 分離ルール」

---

## 2. mirror 同期（`.agents/skills/task-specification-creator/`）

上記 6 ファイルを mirror 配置。Phase 9 / Phase 11 S-1 で `diff -qr` 0 行確定。

---

## 3. workflow 本体への新規追加

`docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/` 配下:

| パス | 種別 |
| --- | --- |
| `index.md` / `artifacts.json` | 新規 |
| `phase-01.md` 〜 `phase-13.md` | 新規 |
| `outputs/phase-01/` 〜 `outputs/phase-12/` | 新規（Phase 13 は blocked のため未生成） |

---

## 4. TECH-M-01〜04 解決ステータス

| MINOR ID | 解決状況 | 解決 Phase | 備考 |
| --- | --- | --- | --- |
| TECH-M-01（重複セクション統合） | RESOLVED | Phase 8 | DRY 化で完了 |
| TECH-M-02（mirror parity CI gate 化） | DEFERRED → U-7 | 本タスクスコープ外 | Phase 12 unassigned-task-detection.md に転記 |
| TECH-M-03（UT-GOV-001〜007 遡及適用方針） | RESOLVED | Phase 12 | 本 changelog 内で明文化（下記 §5） |
| TECH-M-04（skill-fixture-runner 縮約テンプレ検証） | DEFERRED → U-8 | 本タスクスコープ外 | Phase 12 unassigned-task-detection.md に転記 |

---

## 5. TECH-M-03 遡及適用方針（明文化）

| タスク状態 | 遡及適用 | ルール |
| --- | --- | --- |
| 新規タスク（Phase 1 未着手） | **適用する** | Phase 1 で `artifacts.json.metadata.visualEvidence=NON_VISUAL` を必ず入力する |
| 進行中タスク（Phase 1〜10 進行中） | **再判定する** | Phase 11 着手時点で再判定。未着手なら適用 / 着手済なら従来テンプレで完走させる |
| 完了済タスク | **適用しない** | 再生成しない（成果物の塗り替えは禁止） |

「ケースバイケース」という曖昧な記述は禁止。上記 3 段階で機械的に判定する。

---

## 6. workflow 自身への影響

本タスク自身が縮約テンプレ第一適用例（drink-your-own-champagne）であり、以下のとおり構成:

- `outputs/phase-11/` = 3 点固定（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）
- `outputs/phase-12/` = 6 ファイル（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- `index.md` workflow root 状態欄 = `spec_created`（書き換え禁止）

---

## 完了確認

- [x] 6 ファイル追記の出処を Phase 2 設計のセクションへ追跡可能
- [x] mirror 同期 0 行確認
- [x] TECH-M-01〜04 解決ステータス記録
- [x] TECH-M-03 遡及適用方針を 3 段階で明文化
