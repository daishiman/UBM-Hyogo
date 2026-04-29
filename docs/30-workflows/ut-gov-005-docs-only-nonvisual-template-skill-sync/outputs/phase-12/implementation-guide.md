# implementation-guide.md（PR 本文用）

## Summary

- `task-specification-creator` skill に **docs-only / NON_VISUAL 縮約テンプレ** を追加し、写真証跡が不要な docs-only タスクで Phase 11 outputs を 3 点固定（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）に縮約するルールを skill 6 ファイルへ反映した。
- 本ワークフロー自身が縮約テンプレの **第一適用例（drink-your-own-champagne）** であり、Phase 11 outputs が縮約テンプレを満たすことを自己 compliance check で確認した。
- workflow root の状態欄は `spec_created` を維持し、`phases[].status` のみ Phase 1〜12 を `completed` に更新する **state ownership 分離ルール** を `phase-template-core.md` に明文化した。

---

## Part 1: 利用者向け概要（中学生レベル説明）

夏休みの宿題に「読書感想文」と「観察日記」があります。観察日記は植物の写真を毎日撮って貼る必要がありますが、読書感想文は写真がいりません。
これまでの skill は、どちらの宿題でも「写真を貼る欄」を必ず作る決まりだったので、読書感想文を出すときに「写真欄を空白にする」という無意味な作業が発生していました。

今回の変更で、`artifacts.json.metadata.visualEvidence` というスイッチを見て、

- `VISUAL`（観察日記タイプ）→ 従来どおり screenshot を含むフルテンプレ
- `NON_VISUAL`（読書感想文タイプ）→ **写真欄を消した縮約テンプレ**（3 点の文書だけ）

を自動で切り替えるようになりました。

これによって docs-only / skill 改修系のタスクでは Phase 11 outputs が 3 点に固定され、無駄な空白 artefact がリポジトリに残らなくなります。

---

## Part 2: 開発者向け詳細（必須 5 項目）

### C12P2-1 型定義

**該当なし**（docs-only / コード変更ゼロ）。

理由: 本タスクは `.claude/skills/task-specification-creator/` 配下の markdown 6 ファイルへの追記のみで、TypeScript / runtime コードへの影響はない。`apps/web` `apps/api` `packages/*` のいずれも変更していない。

参考: `artifacts.json.metadata` のフィールド規約（既存 schema、本タスクで形は変えていない）

```jsonc
{
  "metadata": {
    "taskType": "docs-only",         // 既存: タスク種別
    "visualEvidence": "NON_VISUAL",  // 既存: 縮約テンプレ発火スイッチ
    "scope": "skill_governance",     // 既存
    "workflow_state": "spec_created" // 既存: workflow root 状態
  }
}
```

### C12P2-2 API シグネチャ

**該当なし**（docs-only / API 追加・変更なし）。

理由: 本タスクは Hono ルート / D1 schema / Auth.js / Cloudflare binding に一切触れていない。`apps/api` の HTTP インターフェース、`apps/web` の Server Action / Route Handler とも無関係。

参照経路（skill 内部の文書 reference 経路のみ）:

```
SKILL.md
  └─ タスクタイプ判定フロー（NON_VISUAL → 縮約発火）
       └─ references/phase-template-phase11.md（縮約テンプレ実体）
            └─ references/phase-11-non-visual-alternative-evidence.md（代替 evidence プレイブック）
       └─ references/phase-template-phase12.md（Part 2 5 項目チェック）
            └─ references/phase-12-completion-checklist.md（C12P2-1〜5 正本 + docs-only ブランチ）
```

### C12P2-3 使用例

本タスクの `artifacts.json.metadata` を入力にした縮約テンプレ発火フロー（step-by-step）:

```jsonc
// Step 1: artifacts.json で発火条件を宣言
{
  "metadata": {
    "taskType": "docs-only",
    "visualEvidence": "NON_VISUAL"
  }
}
```

```
// Step 2: SKILL.md タスクタイプ判定フローが両条件を AND 評価
visualEvidence == "NON_VISUAL" && taskType == "docs-only"
  → 縮約テンプレ発火

// Step 3: phase-template-phase11.md が要求する 3 点固定 outputs を生成
outputs/phase-11/main.md              // NON_VISUAL 宣言 / 自己適用宣言 / AC 確定マーク
outputs/phase-11/manual-smoke-log.md  // S-1〜S-7 PASS-FAIL テーブル
outputs/phase-11/link-checklist.md    // cross-reference 双方向 checklist

// Step 4: screenshot / manual-test-result.md は作らない（AC-8 で機械検出）
```

実適用例: 本タスクの [`outputs/phase-11/`](../phase-11/) 配下が縮約テンプレ第一適用例。`ls outputs/phase-11/` で 3 ファイルのみが確認できる。

### C12P2-4 エラー処理

| ケース | 検出 Phase | 動作 |
| --- | --- | --- |
| `visualEvidence` メタ未設定 | Phase 1 | fail-fast。`phase-template-phase1.md` が visualEvidence を必須入力化したため、Phase 1 完了条件で blocking |
| Phase 11 で screenshot を作成 | Phase 11 / AC-8 | `ls outputs/phase-11/` の件数 > 3 で機械検出 → AC-8 FAIL |
| `taskType=docs-only` だが VISUAL 宣言 | Phase 1 | 縮約テンプレ発火条件不成立 → 従来テンプレ適用（NO-GO ではない / 警告のみ） |
| Phase 12 Part 2 5 項目「該当なし」を空欄化 | Phase 12 compliance-check | C12P2-1〜5 行存在チェックで FAIL。「該当なし」と理由 1 行が必須 |
| mirror parity 崩れ（`.claude` ⇄ `.agents` 差分発生） | Phase 9 / 11（再確認） | `diff -qr` 1 行以上 → NO-GO（AC-5 FAIL） |

NO-GO 時の差戻しルール: Phase 11 → Phase 5 へ戻す（skill 本体修正が必要）。Phase 12 → Phase 11 へ戻す（evidence 不足）。

### C12P2-5 設定値（必須フィールド一覧）

`artifacts.json.metadata` で縮約テンプレ発火に関わる必須フィールド:

| フィールド | 型 | 値域 | 役割 |
| --- | --- | --- | --- |
| `taskType` | string | `docs-only` / `feature` / `bugfix` / `refactor` / `governance` 等 | 縮約テンプレ発火判定の片側 |
| `visualEvidence` | string | `VISUAL` / `NON_VISUAL` | 縮約テンプレ発火判定のもう片側（最重要） |
| `scope` | string | `skill_governance` / `app_runtime` / `infra` 等 | スコープ識別（CI gate / 影響範囲判断用） |
| `workflow_state` | string | `spec_created` / `in_progress` / `completed` 等 | workflow root の状態（Phase 12 で書き換え禁止） |

縮約テンプレ canonical 3 点（`phase-template-phase11.md` で固定）:

```
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
```

---

## 状態分離ルール（state ownership）

| 対象 | 値 | Phase 12 close-out 時の扱い |
| --- | --- | --- |
| workflow root の `index.md` 状態欄 | `spec_created` | **書き換えない**（仕様書段階の状態を維持） |
| `artifacts.json.metadata.workflow_state` | `spec_created` | **書き換えない** |
| `artifacts.json.phases[].status`（Phase 1〜12） | `completed` | このタスクで `pending` → `completed` 更新 |
| `artifacts.json.phases[].status`（Phase 13） | `blocked` | PR 作成時まで `blocked` 維持 |

> 原典 §8 苦戦箇所 3 で頻発する誤書換え事故。Phase 12 着手時に workflow root を `completed` に書き換えると Phase 13 ゲートが破綻する。

---

## mirror 同期検証

```bash
diff -qr .claude/skills/task-specification-creator/ .agents/skills/task-specification-creator/
# 期待出力: 0 行（差分なし）
```

Phase 9 / Phase 11 S-1 で確定済。Phase 12 では skill 本体を再修正していないため、再実行しても 0 行のまま。

---

## Test plan（PR 本文用 checklist）

- [ ] `.claude/skills/task-specification-creator/` の 6 ファイル追記が SKILL.md タスクタイプ判定フローから辿れる
- [ ] `diff -qr .claude/skills/task-specification-creator/ .agents/skills/task-specification-creator/` が 0 行
- [ ] `outputs/phase-11/` が 3 ファイル固定（screenshot / manual-test-result.md なし）
- [ ] Phase 12 Part 2 必須 5 項目（C12P2-1〜5）が本ファイルで一対一充足
- [ ] `index.md` workflow root 状態欄が `spec_created` のまま
- [ ] `artifacts.json.phases[].status` が Phase 1〜12=completed / Phase 13=blocked
- [ ] `pnpm typecheck` / `pnpm lint` PASS（副作用ゼロ）
- [ ] 計画系 wording（「実行対象」「保留として記録」）が outputs/phase-12/ に残存しない

---

## 参照リンク

- 縮約テンプレ実体: [`.claude/skills/task-specification-creator/references/phase-template-phase11.md`](../../../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md)
- 第一適用例 evidence: [`outputs/phase-11/main.md`](../phase-11/main.md) / [`manual-smoke-log.md`](../phase-11/manual-smoke-log.md) / [`link-checklist.md`](../phase-11/link-checklist.md)
- C12P2-1〜5 正本: [`.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`](../../../../../.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md)
