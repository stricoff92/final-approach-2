

#!/usr/bin/python3

import hashlib
from io import StringIO
import os
import os.path
import re


def hash_value(val: str) -> str:
    return hashlib.md5(val.encode()).hexdigest()

def add_hash(file_name: str) -> bool:
    return file_name.endswith(".js") or file_name.endswith(".css")

def clip_file_path(path: str, build_dir_name: str) -> str:
    return path[path.index(build_dir_name) + len(build_dir_name):]

def lazySplit(string, sep="\s+"):
    # warning: does not yet work if sep is a lookahead like `(?=b)`
    # https://stackoverflow.com/questions/3862010/is-there-a-generator-version-of-string-split-in-python
    if sep=='':
        return (c for c in string)
    else:
        return (_.group(1) for _ in re.finditer(f'(?:^|{sep})((?:(?!{sep}).)*)', string))

def elem_link_is_absolute(line: str) -> bool:
    return "src=\"/" in line or "href=\"/" in line

def get_linked_url(line: str) -> str:
    pass

if __name__ == "__main__":
    BUILD_DIRECTORY_NAME = "build"
    dir_path = os.path.dirname(os.path.realpath(__file__))
    project_src_dir = os.path.join(dir_path, BUILD_DIRECTORY_NAME)
    hashed_files = {}
    html_files_to_update = []

    # Find static asset files and add hash to the file's name.
    for full_path, _dirs, files in os.walk(project_src_dir):
        for file_name in files:
            if file_name.endswith(".html"):
                # Record which files will need to be updated
                html_files_to_update.append((full_path, file_name,))
                continue
            elif not add_hash(file_name):
                continue

            with open(os.path.join(full_path, file_name)) as f:
                file_contents = f.read()
            file_contents_hash = hash_value(file_contents)
            file_name_parts = file_name.split(".")
            new_file_name = f'{file_name_parts[0]}-{file_contents_hash}.{file_name_parts[-1]}'
            os.rename(
                os.path.join(full_path, file_name),
                os.path.join(full_path, new_file_name),
            )

            hashed_files[(
                clip_file_path(full_path, BUILD_DIRECTORY_NAME),
                file_name,
            )] = new_file_name

    print("****************")
    print("hashed_files")
    print(hashed_files)
    print("****************")

    # Find .html files and update links
    js_patt = re.compile(r'src=\"\/?js\/[a-z0-9_]+\.js\"')
    css_patt = re.compile(r'href=\"\/?css\/[a-z0-9_]+\.css\"')
    for full_path, file_name in html_files_to_update:
        site_path = clip_file_path(full_path, BUILD_DIRECTORY_NAME)
        with open(os.path.join(full_path, file_name)) as f:
            file_content = f.read()

        updated_file = StringIO()
        for line in lazySplit(file_content, "\n"):
            js_m = js_patt.search(line)
            css_m = css_patt.search(line)

            if js_m or css_m:
                is_absolute = elem_link_is_absolute(line)

                if is_absolute:
                    pass


                print((is_absolute, line))
