'''
If you want to add datasets:
    1. Add dataset annotation files to app/api/annotations/
    2. Add dataset name to this list

COCO datasets with compatible annotations:
     * train2014
     * val2014
     * train2017
     * val2017
'''

DATASETS = [
    "val2017",
]

INITIAL_SETTINGS = {
    "CATEGORIES" : [],
    "GRID_SLOTS" : 50,
    "COLUMNS" : 4
}

