import os

from pycocotools.coco import COCO
from app.api.api_interface import ApiInterface


class CocoApi(ApiInterface):

    # All available datasets
    AVAILABLE_DATASETS = [
        "train2014",
        "val2014",
        "train2017",
        "val2017",
    ]


    def __init__(self, dataset):
        self.load_dataset(dataset)


    def load_dataset(self, dataset):
        if dataset not in self.AVAILABLE_DATASETS:
            raise ValueError('Invalid dataset value.')      

        dir = os.path.dirname(__file__)
        instances_anns_file = 'annotations/instances/instances_{}.json'.format(dataset)
        self.coco_api = COCO(os.path.join(dir, instances_anns_file))

        captions_anns_file = 'annotations/captions/captions_{}.json'.format(dataset)
        self.coco_caps = COCO(os.path.join(dir, captions_anns_file))

        self.dataset = dataset
        self.load_all_cats()


    def load_all_cats(self):
        self.all_categories = [cat['name'] for cat in self.coco_api.loadCats(self.coco_api.getCatIds())]


    def get_images(self, img_ids):

        img_ids = [int(id) for id in img_ids]
        images = self.map_images(self.coco_api.loadImgs(img_ids))
        
        return images
        

    def get_annotations(self, img_ids):
        
        ann_dict = {}
        for id in img_ids:
            ann_ids = self.coco_api.getAnnIds(imgIds=id)
            ann_dict[id] = self.coco_api.loadAnns(ann_ids)

            for ann in ann_dict[id]:
                # add category name
                ann["category_name"] = self.cat_id_to_name(ann["category_id"])
                
                # unnest segmentation
                if isinstance(ann["segmentation"], list) and len(ann["segmentation"]) == 1:
                    ann["segmentation"] = ann["segmentation"][0]

        return ann_dict


    def get_captions(self, img_ids):

        captions = {}
        for id in img_ids:
            annIds = self.coco_caps.getAnnIds(imgIds=id)
            anns = self.coco_caps.loadAnns(annIds)

            final_caption = ''

            for i, ann in enumerate(anns):
                caption = ann['caption']
                caption = caption.strip().capitalize()
                final_caption += (str(i+1) + ". " + caption + "\n")

            captions[id] = final_caption

        return captions


    def get_image_ids_from_categories(self, cat_names):
        if cat_names == []:  # if no category is chosen, return all images
            img_ids = self.coco_api.getImgIds()
        else:
            cat_ids = self.coco_api.getCatIds(catNms=cat_names)  # map cat_names to cat_ids
            img_ids = self.coco_api.getImgIds(catIds=cat_ids)

        return img_ids


    # Maps category id to category name
    def cat_id_to_name(self, cat_id):
        return self.coco_api.loadCats(cat_id)[0]['name']


    # Reformats images dicts (now only renaming 'coco_url' to 'url')
    def map_images(self, images):

        for img in images:
            if "coco_url" in img:
                img['url'] = img.pop('coco_url')

        return images


    def get_dataset(self):
        return self.dataset

    def get_all_categories(self):
        return self.all_categories

    def get_available_datasets(self):
        return self.AVAILABLE_DATASETS
    
