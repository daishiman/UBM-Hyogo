# UI Sanity Visual Review

Status: `implemented_local_evidence_captured / PASS`

## 観点

- `AdminPageHeader` が h1 と breadcrumbs / refresh action を表示する。
- `attendance-overview` は `KpiCard` 3 枚で表示する。
- by-session / ranking は `AdminTable` の caption と sort button を持つ。
- `AdminSectionErrorClient` は該当区画だけを置換し、他区画を壊さない。

## 判定

PASS。`attendance-all-ok.png` / `attendance-overview-error.png` / `attendance-by-session-empty.png` で、primitive 採用、fail-soft、empty state の 3 状態を確認した。Task E の staging visual baseline とは分離し、本タスクでは localhost evidence を完了証跡とする。
