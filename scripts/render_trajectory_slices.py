#!/usr/bin/env python3
"""Render the de-identified FF000009 trajectory used on the dataset page.

The NIfTI reader is deliberately small so this asset can be regenerated without
project-specific imaging packages. Slices use the benchmark soft-tissue window
and radiological axial orientation.
"""

from __future__ import annotations

import gzip
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path("/Volumes/CX000018_DS2/yanglab/hagu_scratch/CancerVerse/CancerVerse")
OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "trajectory"

# Exact cases and sampling indices from the frozen no-action Predict manifest.
CASES = {
    "prior": ("CV_00012045", 339),
    "current": ("CV_00019807", 204),
    "hidden": ("CV_00017094", 394),
}


def read_nifti_volume(path: Path) -> np.ndarray:
    with gzip.open(path, "rb") as handle:
        header = handle.read(352)
        endian = "<" if struct.unpack("<i", header[:4])[0] == 348 else ">"
        dims = struct.unpack(endian + "8h", header[40:56])
        shape = tuple(int(v) for v in dims[1:4])
        datatype = struct.unpack(endian + "h", header[70:72])[0]
        offset = int(struct.unpack(endian + "f", header[108:112])[0])
        slope = struct.unpack(endian + "f", header[112:116])[0] or 1.0
        intercept = struct.unpack(endian + "f", header[116:120])[0]
        dtype_map = {2: "u1", 4: "i2", 8: "i4", 16: "f4", 64: "f8", 512: "u2"}
        dtype = np.dtype(endian + dtype_map[datatype])
        handle.seek(offset)
        volume = np.frombuffer(handle.read(), dtype=dtype).reshape(shape, order="F")
    return volume.astype(np.float32) * slope + intercept


def render(array: np.ndarray) -> Image.Image:
    lo, hi = -160.0, 240.0
    pixels = np.clip((array - lo) / (hi - lo), 0, 1)
    pixels = (pixels * 255).round().astype(np.uint8)
    # Matches the benchmark's radiological_axial_ccw90_v1 rendering.
    return Image.fromarray(np.rot90(pixels, 1), mode="L")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    selected = {sys.argv[1]: CASES[sys.argv[1]]} if len(sys.argv) > 1 else CASES
    for label, (case_id, index) in selected.items():
        source = ROOT / case_id / "ct.nii.gz"
        if not source.exists():
            raise FileNotFoundError(source)
        volume = read_nifti_volume(source)
        render(volume[:, :, index]).save(OUT / f"{label}.png", optimize=True)
        indices = list(range(max(0, index - 32), min(volume.shape[2], index + 33), 4))
        frames = [render(volume[:, :, k]).resize((384, 384), Image.Resampling.LANCZOS) for k in indices]
        frames = frames + frames[-2:0:-1]
        frames[0].save(
            OUT / f"{label}_scroll.webp",
            save_all=True,
            append_images=frames[1:],
            duration=125,
            loop=0,
            quality=82,
            method=6,
        )


if __name__ == "__main__":
    main()
