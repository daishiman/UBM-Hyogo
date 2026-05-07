# Phase 11 NON_VISUAL Evidence Manifest

## 概要

本ファイルは Phase 11（NON_VISUAL）の主 evidence manifest。schema alias back-fill batch を remaining-scan から cursor 方式へ拡張する判断のための staging runtime evidence を集約する。

## evidence インデックス

| # | ファイル | 種別 | 取得タイミング |
| --- | --- | --- | --- |
| 1 | `staging-evidence-remaining-scan.md` | NON_VISUAL | user gate 解除後 |
| 2 | `staging-evidence-cursor.md` | NON_VISUAL | user gate 解除後 |
| 3 | `decision-record.md` | NON_VISUAL | 上 2 件取得後 |
| 4 | `d1-schema-parity.md` | NON_VISUAL | user gate 解除後 |
| 5 | `lint-evidence.log` | local（user gate 不要） | spec 段階で取得可 |
| 6 | `migration-apply.log` / `deploy.log` | NON_VISUAL | user gate 解除後 |

## visualEvidence 区分

`NON_VISUAL`。本タスクは UI を伴わない batch / queue / DB 領域のため、画像 evidence は採用しない。代替として上記テキスト evidence を必須化する。

## 状態語彙

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持。`PASS` 単独表記禁止。
