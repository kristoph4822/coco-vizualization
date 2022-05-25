import os
import json

EXPORT_FILE_PATH = "files/tags.txt"

def download_tags_to_file(tags_dict):
    dir = os.path.dirname(__file__) 
    file_path = EXPORT_FILE_PATH
    full_path = os.path.join(dir, file_path)

    with open(full_path, 'w') as file:
        file.write(json.dumps(tags_dict))

    return full_path