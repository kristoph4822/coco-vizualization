from pycocotools.coco import COCO
import numpy as np

dataDir = '/mnt/c/REPOSITORIES/coco-vizualization/flaskr'
dataType = 'val2017'
annFile = '{}/static/annotations/instances_{}.json'.format(
    dataDir, dataType)

coco = COCO(annFile)
#cats = coco.loadCats(coco.getCatIds())
#nms = [cat['name'] for cat in cats]
#nms = set([cat['supercategory'] for cat in cats])

catIds = coco.getCatIds(catNms=['person','dog','skateboard'])
imgIds = coco.getImgIds(catIds=catIds)
imgIds = coco.getImgIds(imgIds = [324158])
img = coco.loadImgs(imgIds[np.random.randint(0,len(imgIds))])[0]

print(img['coco_url'])