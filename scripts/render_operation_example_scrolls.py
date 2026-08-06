#!/usr/bin/env python3
"""Match displayed example slices to source CTs and render real axial scrolls."""

from __future__ import annotations

from pathlib import Path
import sys

import numpy as np
from PIL import Image

from render_trajectory_slices import read_nifti_volume


ROOT = Path("/Volumes/CX000018_DS2/yanglab/hagu_scratch/CancerVerse/CancerVerse")
SITE = Path(__file__).resolve().parents[1]
EXAMPLES = SITE / "public" / "images" / "examples"
COMPARE = SITE / "public" / "images" / "compare"

# output, case, reference image, half, window
SPECS = {
    "assess_anatomy_liver_yes_scroll": ("CV_00008325", EXAMPLES / "assess_anatomy_liver_yes.png", None, (-160, 240)),
    "assess_phase_arterial_scroll": ("CV_00013701", EXAMPLES / "assess_phase_arterial.png", None, (-160, 240)),
    "read_nodule_rll_18mm_scroll": ("CV_00013810", EXAMPLES / "read_nodule_rll_18mm.png", None, (-1000, 400)),
    "read_nodule_lul_23mm_scroll": ("CV_00003065", EXAMPLES / "read_nodule_lul_23mm.png", None, (-1000, 400)),
    "predict_action_left_nephrectomy_scroll": ("CV_00019769", EXAMPLES / "predict_action_left_nephrectomy.png", None, (-160, 240)),
    "predict_noaction_prior_scroll": ("CV_00012045", EXAMPLES / "predict_noaction_ascites.png", "left", (-160, 240)),
    "predict_noaction_current_scroll": ("CV_00019807", EXAMPLES / "predict_noaction_ascites.png", "right", (-160, 240)),
    "predict_action_systemic_chemotherapy_scroll": ("CV_00003757", None, None, (-160, 240)),
    "predict_action_local_tace_scroll": ("CV_00023096", None, None, (-160, 240)),
    "conclude_decompensated_cirrhosis_supported_scroll": ("CV_00007943", EXAMPLES / "conclude_decompensated_cirrhosis_supported.png", None, (-160, 240)),
    "conclude_decompensated_cirrhosis_not_supported_scroll": ("CV_00013141", EXAMPLES / "conclude_decompensated_cirrhosis_not_supported.png", None, (-160, 240)),
    "advise_pancreatic_cyst_mri_followup_scroll": ("CV_00008216", EXAMPLES / "advise_pancreatic_cyst_mri_followup.png", None, (-160, 240)),
    "advise_nodule_known_cancer_scroll": ("CV_00007262", EXAMPLES / "advise_nodule_known_cancer.png", None, (-1000, 400)),
    "compare_ascites_prior_scroll": ("CV_00007009", COMPARE / "ascites-increased.png", "left", (-160, 240)),
    "compare_ascites_current_scroll": ("CV_00001682", COMPARE / "ascites-increased.png", "right", (-160, 240)),
    "compare_nodule_prior_scroll": ("CV_00005817", COMPARE / "nodule-new.png", "left", (-1000, 400)),
    "compare_nodule_current_scroll": ("CV_00007120", COMPARE / "nodule-new.png", "right", (-1000, 400)),
}


def render_slice(array: np.ndarray, window: tuple[int, int], size: int = 384) -> Image.Image:
    lo, hi = window
    pixels = np.clip((array - lo) / (hi - lo), 0, 1)
    pixels = (pixels * 255).round().astype(np.uint8)
    image = Image.fromarray(np.rot90(pixels, 1), mode="L")
    return image.resize((size, size), Image.Resampling.LANCZOS)


def reference_crop(path: Path, half: str | None) -> Image.Image:
    image = Image.open(path).convert("L")
    if half == "left":
        image = image.crop((0, 0, 512, 512))
    elif half == "right":
        image = image.crop((image.width - 512, 0, image.width, 512))
    return image.resize((64, 64), Image.Resampling.BILINEAR)


def best_slice(volume: np.ndarray, target: Image.Image, window: tuple[int, int]) -> int:
    target_array = np.asarray(target, dtype=np.float32)
    scores = []
    for index in range(volume.shape[2]):
        candidate = np.asarray(render_slice(volume[:, :, index], window, 64), dtype=np.float32)
        scores.append(float(np.mean((candidate - target_array) ** 2)))
    return int(np.argmin(scores))


def save_scroll(output: Path, volume: np.ndarray, center: int, window: tuple[int, int]) -> None:
    indices = list(range(max(0, center - 30), min(volume.shape[2], center + 31), 3))
    frames = [render_slice(volume[:, :, index], window) for index in indices]
    frames += frames[-2:0:-1]
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=120,
        loop=0,
        quality=80,
        method=3,
    )


def main() -> None:
    selected = {sys.argv[1]: SPECS[sys.argv[1]]} if len(sys.argv) > 1 else SPECS
    for output_name, (case_id, reference, half, window) in selected.items():
        volume = read_nifti_volume(ROOT / case_id / "ct.nii.gz")
        # New action-conditioned examples do not have a hand-selected paper crop.
        # Use the central third of the exact source examination so the scroll
        # remains reproducible without introducing a substitute image.
        center = best_slice(volume, reference_crop(reference, half), window) if reference else volume.shape[2] // 2
        output_dir = COMPARE if output_name.startswith("compare_") else EXAMPLES
        output = output_dir / f"{output_name}.webp"
        save_scroll(output, volume, center, window)
        print(f"{output.name}: {case_id} slice {center}")


if __name__ == "__main__":
    main()
