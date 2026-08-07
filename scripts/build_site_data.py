#!/usr/bin/env python3
"""Build the public RADWORLD website payload from verified repository artifacts."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


HERE = Path(__file__).resolve().parent
SITE = HERE.parent
ROOT = SITE.parent / "radworld_repo"
RESULTS = ROOT / "docs/results"
OUT = SITE / "public/data/benchmark.json"
FULL_FINDING_INVENTORY = ROOT / "world_model_benchmark/harm_tier_proposal.csv"


MODELS = [
    ("GPT-5.5", "General-purpose VLM", "OpenAI"),
    ("Claude Opus 4.8", "General-purpose VLM", "Anthropic"),
    ("Qwen3.5-27B", "General-purpose VLM", "Alibaba Group"),
    ("Qwen3.5-9B", "General-purpose VLM", "Alibaba Group"),
    ("Qwen3-VL-8B", "General-purpose VLM", "Alibaba Group"),
    ("InternVL3.5-8B", "General-purpose VLM", "Shanghai AI Lab"),
    ("Hulu-Med-32B", "Medical slice / video VLM", "Zhejiang University"),
    ("Lingshu-I-8B", "Medical slice / video VLM", "Alibaba Group"),
    ("HealthGPT-Pro-8B", "Medical slice / video VLM", "Zhejiang University"),
    ("GMAI-VL", "Medical slice / video VLM", "Shanghai AI Lab"),
    ("HuatuoGPT-Vision-7B", "Medical slice / video VLM", "CUHK-Shenzhen"),
    ("MedGemma-27B", "Medical slice / video VLM", "Google"),
    ("MedGemma-1.5-4B", "Medical slice / video VLM", "Google"),
    ("Med-Flamingo-9B", "Medical slice / video VLM", "Stanford / Harvard"),
    ("MedVision-V0-7B", "Medical slice / video VLM", "University of Edinburgh"),
    ("OmniCT-7B native", "Native-volume CT VLM", "Alibaba Group"),
    ("M3D-RAD", "Native-volume CT VLM", "Zhejiang University"),
    ("RadFM", "Native-volume CT VLM", "Shanghai Jiao Tong University"),
    ("CTInstruct-8B", "Native-volume CT VLM", "Shanghai AI Lab / SJTU / USTC"),
    ("Merlin", "Frozen CT encoder", "Stanford University"),
    ("Pillar-0", "Frozen CT encoder", "UC Berkeley"),
    ("MedSigLIP-448", "Frozen image encoder", "Google"),
]


ALIASES = {
    "qwen3vl": "Qwen3-VL-8B",
    "internvl35": "InternVL3.5-8B",
    "lingshu7b": "Lingshu-I-8B",
    "huatuoqwen": "HuatuoGPT-Vision-7B",
    "medgemma15": "MedGemma-1.5-4B",
    "medgemma27": "MedGemma-27B",
    "qwen35_9b": "Qwen3.5-9B",
    "qwen35_27b": "Qwen3.5-27B",
    "gmaivl": "GMAI-VL",
    "hulumed": "Hulu-Med-32B",
    "healthgpt": "HealthGPT-Pro-8B",
    "qwen": "Qwen3.5-27B",
    "gpt55": "GPT-5.5",
    "claude_opus48": "Claude Opus 4.8",
    "GPT-5.5": "GPT-5.5",
    "Opus 4.8": "Claude Opus 4.8",
    "Claude Opus 4.8": "Claude Opus 4.8",
    "Qwen-27B": "Qwen3.5-27B",
    "Qwen3.5-27B": "Qwen3.5-27B",
    "Qwen3.5-9B": "Qwen3.5-9B",
    "Lingshu": "Lingshu-I-8B",
    "Lingshu-I-8B": "Lingshu-I-8B",
    "HealthGPT": "HealthGPT-Pro-8B",
    "HealthGPT-Pro-8B": "HealthGPT-Pro-8B",
    "Hulu-Med": "Hulu-Med-32B",
    "Hulu-Med-32B": "Hulu-Med-32B",
    "OmniCT-native": "OmniCT-7B native",
    "OmniCT-7B-native": "OmniCT-7B native",
    "OmniCT-7B native": "OmniCT-7B native",
    "OmniCT-7B": "OmniCT-7B native",
    "Merlin · OOF": "Merlin",
    "Pillar-0 · OOF": "Pillar-0",
    "Merlin with probe": "Merlin",
    "Pillar-0 with probe": "Pillar-0",
    "MedSigLIP with probe": "MedSigLIP-448",
}


def rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def number(value: str | None) -> float | int | None:
    if value is None or value == "":
        return None
    try:
        parsed = float(value)
    except ValueError:
        return None
    return int(parsed) if parsed.is_integer() else parsed


def selected(source: dict[str, str], fields: tuple[str, ...]) -> dict:
    return {field: number(source.get(field)) for field in fields}


def model_name(name: str) -> str:
    return ALIASES.get(name, name)


def _weighted_rate(items: list[dict], metric: str, weight: str) -> float | None:
    usable = [item for item in items if item.get(metric) is not None and item.get(weight)]
    if not usable:
        return None
    denominator = sum(float(item[weight]) for item in usable)
    return sum(float(item[metric]) * float(item[weight]) for item in usable) / denominator


def main() -> None:
    model_payload = [
        {"name": name, "family": family, "organization": organization}
        for name, family, organization in MODELS
    ]

    phase_class_rows = {
        model_name(row["model"]): row
        for row in rows(
            RESULTS
            / "standalone_operation_outputs_v1/assess/phase_per_class_one_vs_rest_ba_all18.csv"
        )
    }
    phase_bundle = json.loads(
        (RESULTS / "standalone_operation_outputs_v1/assess/contrast_phase_balanced300_predictions_all18.json").read_text()
    )
    phase = []
    for name, payload in phase_bundle["models"].items():
        metric = payload["derived_metrics"]
        recall = metric.get("recall_by_class") or {
            label: values["recall"] for label, values in metric["per_class"].items()
        }
        phase.append(
            {
                "model": model_name(name),
                "family": payload["model_family"],
                "input": payload["evaluation_condition"],
                "accuracy": metric["accuracy"],
                "macroRecall": metric["macro_recall"],
                "macroBA": number(phase_class_rows.get(model_name(name), {}).get("macro_one_vs_rest_ba")),
                "recall": recall,
                "oneVsRestBA": {
                    "non_contrast": number(phase_class_rows.get(model_name(name), {}).get("ba_non_contrast")),
                    "arterial": number(phase_class_rows.get(model_name(name), {}).get("ba_arterial")),
                    "portal_venous": number(phase_class_rows.get(model_name(name), {}).get("ba_portal_venous")),
                },
                "unparseable": metric.get("unparseable", 0),
            }
        )
    phase.sort(key=lambda item: item["macroRecall"], reverse=True)

    organ_visibility = []
    for row in rows(
        RESULTS
        / "standalone_operation_outputs_v1/assess/t1_observe_common_cohort_scores_finished12_2026-07-27.csv"
    ):
        if row["level"] != "macro":
            continue
        organ_visibility.append(
            {
                "model": model_name(row["model"]),
                "family": "prompted_generative",
                "macroBA": number(row["balanced_accuracy"]),
                "sensitivity": number(row["sensitivity"]),
                "specificity": number(row["specificity"]),
                "n": number(row["n"]),
            }
        )
    for row in rows(
        RESULTS
        / "standalone_operation_outputs_v1/assess/volume_tracks/t1_assess_volume_fov_encoder_summary_2026-07-31.csv"
    ):
        organ_visibility.append(
            {
                "model": row["model"],
                "family": "frozen_encoder_probe",
                "macroBA": number(row["macro_balanced_accuracy"]),
                "sensitivity": number(row["macro_sensitivity"]),
                "specificity": number(row["macro_specificity"]),
                "n": number(row["n_decisions"]),
            }
        )

    # Native-volume organ-FOV results are added only after the complete
    # 1,526-volume run and scorer artifact are verified. Never expose partial
    # shards for models whose runs are still active or failed.
    m3d_fov_rows = rows(
        RESULTS
        / "standalone_operation_outputs_v1/assess/volume_tracks/t1_assess_native3d_m3drad_2026-07-29.csv"
    )
    m3d_ba_rows = [row for row in m3d_fov_rows if number(row["balanced_accuracy"]) is not None]
    organ_visibility.append(
        {
            "model": "M3D-RAD",
            "family": "native_volume_generative",
            "macroBA": sum(float(row["balanced_accuracy"]) for row in m3d_ba_rows) / len(m3d_ba_rows),
            "sensitivity": sum(float(row["sensitivity"]) for row in m3d_ba_rows) / len(m3d_ba_rows),
            "specificity": sum(float(row["specificity"]) for row in m3d_ba_rows) / len(m3d_ba_rows),
            "n": sum(int(row["n"]) for row in m3d_fov_rows),
            "eligibleOrgans": len(m3d_ba_rows),
            "input": "architecture-native full volume",
        }
    )

    native_score_dirs = [
        RESULTS
        / "standalone_operation_outputs_v1/assess/volume_tracks/ctinstruct",
    ]
    native_fov_rows: dict[str, list[dict[str, str]]] = {}
    for result_dir in native_score_dirs:
        score = json.loads((result_dir / "score.json").read_text())
        per_organ = rows(result_dir / "per_organ.csv")
        estimable = [row for row in per_organ if number(row["balanced_accuracy"]) is not None]
        name = model_name(score["model"])
        native_fov_rows[name] = per_organ
        organ_visibility.append(
            {
                "model": name,
                "family": "native_volume_generative",
                "macroBA": score["macro_balanced_accuracy_estimable_organs"],
                "sensitivity": sum(float(row["sensitivity"]) for row in estimable) / len(estimable),
                "specificity": sum(float(row["specificity"]) for row in estimable) / len(estimable),
                "n": score["n_items"],
                "eligibleOrgans": score["n_estimable_organs"],
                "input": "architecture-native full volume",
            }
        )
    organ_visibility.sort(key=lambda item: item["macroBA"] or 0, reverse=True)

    organ_per_model = []
    for row in rows(RESULTS / "t1_observe_common_cohort_per_organ_2026-07-27.csv"):
        organ_per_model.append(
            {
                "model": model_name(row["model"]),
                "organ": row["organ"],
                "n": number(row["n_items"]),
                "sensitivity": number(row["sensitivity"]),
                "specificity": number(row["specificity"]),
                "ba": number(row["balanced_accuracy"]),
            }
        )
    for row in m3d_fov_rows:
        organ_per_model.append(
            {
                "model": "M3D-RAD",
                "organ": row["organ"],
                "n": number(row["n"]),
                "sensitivity": number(row["sensitivity"]),
                "specificity": number(row["specificity"]),
                "ba": number(row["balanced_accuracy"]),
            }
        )
    for name, per_organ in native_fov_rows.items():
        for row in per_organ:
            organ_per_model.append(
                {
                    "model": name,
                    "organ": row["organ"],
                    "n": number(row["n"]),
                    "sensitivity": number(row["sensitivity"]),
                    "specificity": number(row["specificity"]),
                    "ba": number(row["balanced_accuracy"]),
                }
            )

    full_finding_counts = {
        row["label"]: int(row["n_positive_scans"])
        for row in rows(FULL_FINDING_INVENTORY)
    }
    breadth = []
    for path, family in (
        (RESULTS / "fig4_read_breadth_per_model_per_finding.csv", "generative"),
        (
            RESULTS / "encoder_ground_breadth/fig5_encoder_per_model_per_finding.csv",
            "encoder_probe",
        ),
    ):
        for row in rows(path):
            ba = number(row.get("balanced_accuracy"))
            if ba is None:
                continue
            breadth.append(
                {
                    "model": model_name(row["model"]),
                    "family": family,
                    "cohort": row.get("evaluation_condition") or family,
                    "findingId": row["finding_id"],
                    "finding": row["finding_label"],
                    "organId": row["organ_group"],
                    "organ": row["organ_label"],
                    "n": number(row["n_items"]),
                    "positive": number(row.get("n_positive")),
                    "negative": number(row.get("n_negative")),
                    "datasetPositive": full_finding_counts[row["finding_id"]],
                    "ba": ba,
                    "sensitivity": number(row.get("sensitivity")),
                    "specificity": number(row.get("specificity")),
                }
            )
    breadth_by_model: dict[str, list[float]] = defaultdict(list)
    breadth_rows_by_model: dict[str, list[dict]] = defaultdict(list)
    for row in breadth:
        breadth_by_model[row["model"]].append(row["ba"])
        breadth_rows_by_model[row["model"]].append(row)
    common_read = {
        model_name(row["model"]): row
        for row in rows(RESULTS / "radworld_t2_179_common_results_2026-07-24.csv")
    }

    def overall_rate(name: str, metric: str, weight: str) -> float | None:
        reported = number(common_read.get(name, {}).get(metric))
        if reported is not None:
            return reported
        return _weighted_rate(breadth_rows_by_model[name], metric, weight)

    breadth_overall = [
        {
            "model": name,
            "macroBA": sum(values) / len(values),
            "findings": len(values),
            "items": sum(int(item["n"]) for item in breadth_rows_by_model[name]),
            "cohort": sorted({str(item["cohort"]) for item in breadth_rows_by_model[name]}),
            "sensitivity": overall_rate(name, "sensitivity", "positive"),
            "specificity": overall_rate(name, "specificity", "negative"),
            "atChance": sum(abs(value - 0.5) < 1e-12 for value in values),
        }
        for name, values in breadth_by_model.items()
    ]
    breadth_overall.sort(key=lambda item: item["macroBA"], reverse=True)

    read_domain = []
    for path, family in (
        (ROOT / "paper/figures/results/read_breadth_domain_radar_source.csv", "generative"),
        (ROOT / "world_model_benchmark/figures/fig_read_domain/read_breadth_domain_encoders.csv", "encoder"),
    ):
        for row in rows(path):
            read_domain.append(
                {
                    "model": model_name(row["model"]),
                    "family": family,
                    "domain": row["domain"],
                    "group": row["group"],
                    "nFindings": number(row["n_findings"]),
                    "macroBA": number(row["macro_balanced_accuracy"]),
                    "supervised": row.get("supervised", "").lower() == "true",
                }
            )

    consistency = []
    for row in rows(
        RESULTS
        / "standalone_operation_outputs_v1/read/read_consistency_three_prompt_source.csv"
    ):
        consistency.append(
            {
                "model": model_name(row["model"]),
                "family": row["family"],
                "target": row["target"],
                "n": number(row["n_cells"]),
                "binaryBA": number(row["binary_presence_ba"]),
                "directedBA": number(row["directed_query_ba"]),
                "agree": number(row["three_prompt_agree_rate"]),
                "conflict": number(row["three_prompt_conflict_rate"]),
                "incomplete": number(row["incomplete_triple_rate"]),
            }
        )

    depth = []
    for row in rows(
        RESULTS
        / "standalone_operation_outputs_v1/read/t2_ground_depth_reporting_panel_2026-07-31.csv"
    ):
        depth.append(
            {
                "model": model_name(row["model"]),
                "input": row["input_mode"],
                "n": number(row["n_common"]),
                "detection": number(row["detection_sensitivity"]),
                "conditionalLocation": number(row["conditional_location"]),
                "joint": number(row["end_to_end_location"]),
            }
        )

    compare = []
    for row in rows(RESULTS / "compare_expanded1231_overall.csv"):
        compare.append(
            {
                "model": model_name(row["model"]),
                "family": row["family"],
                "macroBA": number(row["macro_balanced_accuracy"]),
                "low": number(row["ci_lo"]),
                "high": number(row["ci_hi"]),
                "baseline": number(row["previous_state_rule"]),
                "delta": number(row["delta_vs_previous_state_rule"]),
            }
        )
    compare_findings = []
    for row in rows(RESULTS / "compare_expanded1231_per_finding.csv"):
        compare_findings.append(
            {
                "model": model_name(row["model"]),
                "family": row["family"],
                "finding": row["finding"],
                "n": number(row["n"]),
                "macroBA": number(row["macro_balanced_accuracy"]),
            }
        )

    predict = []
    for row in rows(
        RESULTS / "predict_current_state_expanded1231_summary_2026-08-01.csv"
    ):
        predict.append(
            {
                "model": model_name(row["model"]),
                "n": number(row["n"]),
                "patients": number(row["patients"]),
                "brier": number(row["multiclass_brier_unscaled"]),
                "low": number(row["brier_ci_lo"]),
                "high": number(row["brier_ci_hi"]),
                "baseline": number(row["population_prior_brier"]),
                "stableRecall": number(row["stable_recall"]),
                "newRecall": number(row["new_recall"]),
            }
        )
    predict.sort(key=lambda item: item["brier"])

    # Keep current-state rows for the leaderboard and expose every paper
    # Predict protocol as a separate website panel.
    predict_panels = [{
        "id": "current", "group": "No recorded action", "title": "Current CT only",
        "input": "Current CT + forecast interval → hidden successor",
        "cohort": "1,231 transitions · 826 patients · 16 findings",
        "baseline": predict[0]["baseline"], "rows": predict,
    }]

    no_action_specs = [
        ("GPT-5.5", "gpt55_union169_score_v3.json"),
        ("Claude Opus 4.8", "opus48_union169_score_v3.json"),
        ("Lingshu-I-8B", "lingshu_union169_score_v3.json"),
        ("Qwen3.5-27B", "qwen_union169_score_v3.json"),
        ("HealthGPT-Pro-8B", "healthgpt_union169_score_v3.json"),
        ("Hulu-Med-32B", "hulumed_union169_score_v3.json"),
    ]
    no_action_scores = [
        (display, json.loads((RESULTS / "no_action_predict_expanded169" / filename).read_text()))
        for display, filename in no_action_specs
    ]
    no_action_prior = no_action_scores[0][1]["baselines"][
        "descriptive_same_cohort_population_prior"
    ]["multiclass_brier_unscaled"]
    for arm, title, input_text in (
        ("image_derived", "Prior + current CT", "Prior CT + current CT → hidden successor"),
        ("provided", "CTs + observed change", "Prior CT + current CT + report-derived change → hidden successor"),
    ):
        arm_rows = []
        for display, score in no_action_scores:
            low, high = score["patient_clustered_bootstrap"]["intervals_95"][f"{arm}_brier"]
            arm_rows.append({
                "model": display, "n": score["cohort"]["trajectories"],
                "patients": score["cohort"]["patients"],
                "brier": score["arm_scores"][arm]["multiclass_brier_unscaled"],
                "low": low, "high": high, "baseline": no_action_prior,
            })
        arm_rows.sort(key=lambda item: item["brier"])
        predict_panels.append({
            "id": arm, "group": "No recorded action", "title": title,
            "input": input_text,
            "cohort": "169 trajectories · 121 patients · 11 findings",
            "baseline": no_action_prior, "rows": arm_rows,
        })

    action_specs = {
        "surgery": ("Major surgery", "Current CT + recorded surgery → hidden postoperative state", "256 events · 214 patients", "ct_plus_surgery", [
            "gpt55_surgery_v2_score_v1.json", "opus48_surgery_v2_score_v1.json",
            "qwen_surgery_v2_score_v1.json", "healthgpt_surgery_v2_score_v1.json",
            "hulumed_surgery_v2_score_v1.json", "lingshu_surgery_v2_score_v1.json",
        ]),
        "systemic": ("Systemic therapy", "Current CT + recorded systemic therapy → hidden response", "201 events · 184 patients", "ct_plus_action", [
            "gpt55_systemic_score_v1.json", "opus48_systemic_score_v1.json",
            "qwen_systemic_score_v1.json", "healthgpt_systemic_score_v1.json",
            "hulumed_systemic_score_v1.json", "lingshu_systemic_score_v1.json",
        ]),
        "local": ("Local therapy", "Current CT + recorded local therapy → hidden response", "35 events · 33 patients", "ct_plus_action", [
            "gpt55_locoregional_score_v1.json", "qwen_locoregional_score_v1.json",
            "healthgpt_locoregional_score_v1.json", "hulumed_locoregional_score_v1.json",
            "lingshu_locoregional_score_v1.json",
        ]),
    }
    for panel_id, (title, input_text, cohort, arm, filenames) in action_specs.items():
        action_rows, target_distribution = [], None
        for filename in filenames:
            score = json.loads((RESULTS / "action_conditioned_predict" / filename).read_text())
            arm_score = score["by_arm"][arm]
            if target_distribution is None or arm_score["valid"] > sum(target_distribution.values()):
                target_distribution = arm_score["target_distribution"]
            action_rows.append({"model": model_name(score["model"]), "n": arm_score["valid"], "brier": arm_score["brier"]})
        action_rows.sort(key=lambda item: item["brier"])
        total = sum(target_distribution.values())
        prevalence = target_distribution["yes"] / total
        baseline = 2 * prevalence * (1 - prevalence)
        for item in action_rows:
            item["baseline"] = baseline
        predict_panels.append({
            "id": panel_id, "group": "Recorded action", "title": title,
            "input": input_text, "cohort": cohort, "baseline": baseline, "rows": action_rows,
        })

    conclude = []
    for row in rows(
        RESULTS / "conclude_balanced20_seven_model_summary_2026-07-31.csv"
    ):
        conclude.append(
            {
                "model": model_name(row["model"]),
                "examinations": number(row["examinations"]),
                "images": number(row["image_only_accuracy"]),
                "observations": number(row["observations_accuracy"]),
                "delta": number(row["delta_accuracy"]),
            }
        )

    advise_bundle = json.loads(
        (RESULTS / "advise/advise_multifamily_behavior_summary_v2.json").read_text()
    )
    advise = []
    for key, row in advise_bundle["models"].items():
        groups = row["action_groups"]
        per_family = {}
        for family, family_row in row.get("per_family", {}).items():
            family_groups = family_row.get("action_groups", {})
            expected = family_row.get("expected", 0)
            follow_up = family_groups.get("follow_up_imaging", 0)
            no_imaging = family_groups.get("no_additional_imaging", 0)
            per_family[family] = {
                "followUp": follow_up,
                "noImaging": no_imaging,
                "other": max(0, expected - follow_up - no_imaging),
                "n": expected,
            }
        advise.append(
            {
                "model": model_name(row["display"]),
                "n": advise_bundle["cohort"]["cases"],
                "followUp": groups.get("follow_up_imaging", 0),
                "noImaging": groups.get("no_additional_imaging", 0),
                "notApplicable": groups.get("guideline_not_applicable", 0),
                "insufficient": groups.get("insufficient_context", 0),
                "unparseable": row.get("ambiguous_or_incomplete_responses", 0),
                "perFamily": per_family,
            }
        )

    integrated = []
    for row in rows(
        RESULTS
        / "standalone_operation_outputs_v1/integrated/integrated_model_condition_summary_v2.csv"
    ):
        integrated.append(
            {
                "model": model_name(row["model"]),
                "condition": row["condition"],
                "coherent": number(row["coherent_chain_rate"]),
                "strict": number(row["strict_correct_through_predict_and_coherent_rate"]),
                "brier": number(row["predict_brier"]),
                "n": number(row["n_episodes"]),
            }
        )

    payload = {
        "generatedFrom": "verified repository artifacts",
        "dataset": {
            "ctReportPairs": 22866,
            "patients": 13862,
            "findings": 179,
            "organSystems": 19,
            "patientsTwoPlus": 3374,
            "patientsThreePlus": 1773,
            "recistScans": 5335,
            "countries": ["Switzerland", "Turkey"],
        },
        "models": model_payload,
        "assess": {"organVisibility": organ_visibility, "organPerModel": organ_per_model, "phase": phase},
        "read": {
            "breadth": breadth,
            "breadthOverall": breadth_overall,
            "domain": read_domain,
            "consistency": consistency,
            "depth": depth,
        },
        "compare": {"overall": compare, "perFinding": compare_findings},
        "predict": predict,
        "predictPanels": predict_panels,
        "conclude": conclude,
        "advise": advise,
        "integrated": integrated,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
