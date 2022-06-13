
#!/usr/bin/python3


import datetime as dt
from io import StringIO
import hashlib
import re

def hash_value(val: str) -> str:
    return hashlib.md5(val.encode()).hexdigest()

def add_param(html_param: str, v: str) -> str:
    return html_param[0: len(html_param) - 1] + f"?v={v}" + "\""

if __name__ == "__main__":

    cb_value = hash_value(dt.datetime.now().isoformat())
    js_patt = re.compile(r'src=\"\/?js\/[a-z_]+\.js\"')
    css_patt = re.compile(r'href=\"\/?css\/[a-z_]+\.css\"')

    index_files = [
        "build/final-approach-2/index.html",
    ]

    for index_file in index_files:
        with open(index_file) as rh:
            html = rh.read()

        outText = StringIO()

        for line in html.split("\n"):
            js_m = js_patt.search(line)
            css_m = css_patt.search(line)
            if js_m:
                html_param = js_m.group()
                new_line = line.replace(html_param, add_param(html_param, cb_value))
                outText.write(new_line + "\n")
                print("adding version param to line " + line.replace(' ', ''))
            elif css_m:
                html_param = css_m.group()
                new_line = line.replace(html_param, add_param(html_param, cb_value))
                outText.write(new_line + "\n")
                print("adding version param to line " + line.replace(' ', ''))
            else:
                outText.write(line + "\n")

        with open(index_file, "w") as wh:
            wh.write(outText.getvalue())
