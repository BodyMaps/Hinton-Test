# Hinton-Test benchmark website

Interactive companion to Hinton-Test, a benchmark of the world model of the patient. The site exposes the verified manuscript results as searchable model, finding, organ-system, and task views.

**Public website:** [mrgiovanni.github.io/Hinton-Test](https://mrgiovanni.github.io/Hinton-Test/)

Pushes to `main` automatically rebuild and publish the GitHub Pages site.

## Rebuild the data

```bash
python3 scripts/build_site_data.py
```

The builder reads the canonical artifacts under `docs/results/` and writes `public/data/benchmark.json`. It does not recompute scientific metrics.

### Read cohort policy

The public Read leaderboard defaults to the original frozen cohort: 14,832
finding–examination cases for full-cohort endpoints, while GPT-5.5 and Claude
Opus 4.8 retain their original 2,606-case audit. The later 16,532-case
minimum-support expansion is preserved for future opt-in analyses in
[`TMI-2026-Med-Reasoning/docs/results/read_breadth_min20_repair`](https://github.com/MrGiovanni/TMI-2026-Med-Reasoning/tree/main/docs/results/read_breadth_min20_repair).

## Visual and image provenance

- The paper plotting implementations under `world_model_benchmark/figures/` are the authority for model families, model colors, metric direction, and finding order. `fig_read_results/` is the reference for the assembled Read figure.
- The Read task includes a native web translation of `figures/fig_read_findings`: selectable per-finding score distributions, the sensitivity--specificity plane, and finding support versus performance. These panels read from `benchmark.json`; they do not scrape pixels from the paper figure.
- The dataset page uses the real de-identified three-examination trajectory `FF000009` from the frozen no-action Predict cohort. Regenerate its slices with `scripts/render_trajectory_slices.py`; the follow-up examination is displayed only after an explicit reveal action.

## Run locally

```bash
pnpm install
pnpm run dev
```

## Pages

- `/` — benchmark story and headline findings
- `/dataset` — cohort and longitudinal structure
- `/models` — sortable task-specific leaderboard with clickable cross-task model profiles
- `/tasks` — interactive Assess, Read, Compare, Predict, Conclude, Advise, and integrated views
- `/explorer` — 179-finding search, body-system profile, and cross-model drill-down
- `/submit` — structured community model-submission workflow
- `/about` — methods and reproducibility resources
