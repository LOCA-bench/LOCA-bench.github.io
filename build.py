#!/usr/bin/env python3
import json
import pathlib
import shutil
from jinja2 import Environment, FileSystemLoader, select_autoescape


ROOT = pathlib.Path(__file__).parent
TEMPLATES = ROOT / "templates"
DIST = ROOT / "docs"

def get_pages():
    pages = {}
    pages_dir = TEMPLATES / "pages"
    for file in pages_dir.glob("*.html"):
        template_path = f"pages/{file.name}"
        output_file = file.name
        pages[template_path] = output_file
    return pages

PAGES = get_pages()


def main() -> None:
    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=select_autoescape(["html"])
    )

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    # copy static assets
    for d in ["css", "img", "js"]:
        src = ROOT / d
        if src.exists():
            shutil.copytree(src, DIST / d)

    if (ROOT / "CNAME").exists():
        shutil.copy(ROOT / "CNAME", DIST / "CNAME")


    # load data
    with open(ROOT / "data/leaderboards.json", "r") as f:
        data = json.load(f)

    # render all pages
    for tpl_name, out_name in PAGES.items():
        tpl = env.get_template(tpl_name)
        html = tpl.render(
            title="LOCA-bench",
            base_path="",
            leaderboards=data["leaderboards"],
            meta=data["meta"],
        )
        (DIST / out_name).write_text(html)
        print(f"built {out_name}")

    print("All pages generated successfully!")


if __name__ == "__main__":
    main()
