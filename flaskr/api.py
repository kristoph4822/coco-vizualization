from pycocotools.coco import COCO
import numpy as np

class cocoApi:

    INITIAL_CATEGORIES = ['dog']

    '''
    img_meta <- list of dicts with selected images metadata, example:
        {
            'license': 3, 
            'file_name': '000000532481.jpg', 
            'coco_url': 'http://images.cocodataset.org/val2017/000000532481.jpg', 
            'height': 426, 
            'width': 640, 
            'date_captured': '2013-11-20 16:28:24', 
            'flickr_url': 'http://farm7.staticflickr.com/6048/5915494136_da3cfa7c5a_z.jpg', 
            'id': 532481
        }

    local_image_foler <- optional local folder with images to load from
    '''

    def __init__(self, data_dir = '/mnt/c/PROJEKTY/coco-vizualization/coco-vizualization/flaskr', data_type = 'val2017'):
        annFile = '{}/static/annotations/instances_{}.json'.format(data_dir, data_type)
        self.coco = COCO(annFile)
        self.categories = self.load_cats()
        self.img_urls = self.load_img_data_by_cats(self.INITIAL_CATEGORIES)

    def load_img_data_by_cats(self, cat_names):
        cat_ids = self.coco.getCatIds(catNms=cat_names)
        img_ids = self.coco.getImgIds(catIds=cat_ids)
        self.img_meta = self.coco.loadImgs(img_ids)
        #self.img_urls = [ im['coco_url'] for im in img_meta ]
    
    def get_images_page(self, pg_num, n_elem_on_page):
        start = pg_num * n_elem_on_page
        end = start + n_elem_on_page
        n_images = len(self.img_meta)

        if end >= n_images:
            end = n_images

        img_page_meta = self.img_meta[start : end]
        img_page_ids = [ im['id'] for im in img_page_meta ]
        img_page_anns = self.generate_ann_dict(img_page_ids)

        return img_page_meta, img_page_anns

    def load_cats(self):
        cats = self.coco.loadCats(self.coco.getCatIds())
        return [cat['name'] for cat in cats]

    def generate_ann_dict(self, ids):
    # create dict {img_id: ann_array}
        ann_dict = {}
        for id in ids:
            ann_ids = self.coco.getAnnIds(imgIds=id)
            ann_dict[id] = self.coco.loadAnns(ann_ids)

        self.img_anns = ann_dict

    # EXAMPLE
    # {
    #   'segmentation': [[253.85, 187.23, ...]], 
    #   'area': 2188.0864999999994, 
    #   'iscrowd': 0, 
    #   'image_id': 532481, 
    #   'bbox': [250.82, 168.26, 70.11, 64.88], 
    #   'category_id': 1, 
    #   'id': 508910
    # }

