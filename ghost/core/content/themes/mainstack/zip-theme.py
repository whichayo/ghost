#!/usr/bin/env python3
"""Build a Ghost theme zip with package.json at the archive root.

Ghost names the installed theme from the zip filename. The archive must not
wrap the files in an extra parent folder.
"""

import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "dist" / "mainstack.zip"

EXCLUDED_NAMES = {
    "THEME.md",
    "Makefile",
    "zip-theme.py",
    "dist",
}
EXCLUDED_SUFFIXES = {".zip"}


def included(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if any(part.startswith(".") for part in relative.parts):
        return False
    if any(part in EXCLUDED_NAMES for part in relative.parts):
        return False
    if path.suffix in EXCLUDED_SUFFIXES:
        return False
    return path.is_file()


def main() -> int:
    files = sorted(path for path in ROOT.rglob("*") if included(path))
    if not (ROOT / "package.json").is_file():
        print("package.json is missing from the theme directory", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT.exists():
        OUTPUT.unlink()

    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())

    with zipfile.ZipFile(OUTPUT) as archive:
        names = archive.namelist()

    if "package.json" not in names:
        print("package.json is not at the zip root", file=sys.stderr)
        return 1
    if any("/" not in name and name.endswith(".zip") for name in names):
        print("zip contains another archive at the root", file=sys.stderr)
        return 1
    if any(name.split("/", 1)[0] in EXCLUDED_NAMES for name in names):
        print("zip contains a file that should have been excluded", file=sys.stderr)
        return 1

    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes, {len(names)} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
