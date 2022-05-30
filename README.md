# Images Datasets Explorer
Flask application for exploring and managing image datasets. Currently handles only COCO-format annotation files.


### Installation
1. Install **Visual C++ 2015 build tools** from [here](https://go.microsoft.com/fwlink/?LinkId=691126).
2. Clone this repository locally:
```
git clone https://github.com/kristoph4822/image-datasets-explorer.git
```
3. Install required packages (preferably into a virtualenv):
```
cd image-datasets-explorer
pip install -r requirements.txt
```
4. Now you can run application:
```
python run.py
```

### Adding datasets manually
You can easily add COCO datasets (2014 & 2017 train/val) to this application:
  1. Download datasets annotations from COCO website: https://cocodataset.org/#download
  2. Put instances and captions JSON files in appropriate folders in `/app/api/annotations/...`
  3. Add datasets names to `DATASETS` list variable in `config.py` file


### Preview
![image](https://user-images.githubusercontent.com/46055596/170584237-aa4af76f-3571-4c76-ad63-a5518569e52e.png)
