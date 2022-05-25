import os

from pycocotools.coco import COCO
from app.api.api_interface import ApiInterface


class CocoApi(ApiInterface):

    # All available datasets
    DATASETS = [
        "train2014",
        "val2014",
        "train2017",
        "val2017",
    ]


    def __init__(self, dataset):
        self.load_dataset(dataset)


    def load_dataset(self, dataset):
        if dataset not in self.DATASETS:
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
        """
        Gets specific images by ids (used for tags filtering)

        Args:
            img_ids (_type_): _description_

        Returns:
            _type_: _description_
        """

        img_ids = [int(id) for id in img_ids]
        images = self.map_images(self.coco_api.loadImgs(img_ids))

        '''
        anns = self.get_annotations(img_ids)
        captions = self.get_captions(img_ids)

        return {
            "images": images,
            "anns": anns,
            "captions": captions,
            "n_images": len(images),
            "categories": []
        }
        '''
        return images
        


    def get_annotations(self, img_ids):
        """
        Gets annotations for specific img_ids

        Args:
            ids (_type_): _description_

        Returns:
            _type_: _description_
        """
        
        ann_dict = {}
        for id in img_ids:
            ann_ids = self.coco_api.getAnnIds(imgIds=id)
            ann_dict[id] = self.coco_api.loadAnns(ann_ids)

            for ann in ann_dict[id]:  # map cat id to cat name
                ann["category_name"] = self.cat_id_to_name(ann["category_id"])

        return ann_dict


    # Get captions for specific img ids
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

        '''
            images = self.coco_api.loadImgs(img_ids)
            images = self.map_images(images)
            anns = self.get_annotations(img_ids)
            captions = self.get_captions(img_ids)

            return {
                "images": images,
                "anns": anns,
                "captions": captions,
                "n_images": len(images),
                "categories": cat_names
            }
        '''

        return img_ids


    # Map cat_id to cat_name
    def cat_id_to_name(self, cat_id):
        return self.coco_api.loadCats(cat_id)[0]['name']


    # Convert images dicts (this case only renaming 'coco_url' to 'url')
    def map_images(self, images):
        for img in images:
            if "coco_url" in img:
                img['url'] = img.pop('coco_url')

        return images

