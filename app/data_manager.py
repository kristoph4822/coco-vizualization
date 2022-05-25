import math


class DataManager():

    '''
    img_data = {
                "images": images,
                "anns": anns,
                "captions": captions,
                "n_images": len(images),
                "categories": cat_names
            }
    '''

    def __init__(self, api_object, categories, grid_slots, columns):
        self.api = api_object  # api_object must implement ApiInterface functions
        self.img_data = {
            "images": [],
            "anns": {},
            "captions": {},
            "n_images": 0,
            "categories": []
        }
        self.grid_params = {
            'pg_num': 1,
            'grid_slots': grid_slots,
            'initial_columns': columns,
            'n_pages': 0
        }
        self.tags = {}

        img_ids = self.api.get_image_ids_from_categories(categories)
        self.load_img_data(img_ids)
        self.update_pages()


    def get_full_page_data(self):
        return {
            'img_page': self.get_images_page(self.grid_params["pg_num"], self.grid_params["grid_slots"]),
            'grid_params': self.grid_params,
            'tags': self.tags,
            'api_meta': {
                'dataset': self.api.dataset,
                'all_cats': self.api.all_categories,
                'all_datasets': self.api.DATASETS
            },
            # later added: 'local_dir': localImageServer.directory
        }

    # return subset of all image data - only for images on current page
    def get_images_page(self, pg_num, grid_slots):

        start = (pg_num - 1) * grid_slots
        end = start + grid_slots

        if end > self.img_data['n_images']:
            end = self.img_data['n_images']

        images_page = self.img_data['images'][start: end]

        img_ids = [img["id"] for img in images_page]
        anns_page = {id: self.img_data['anns'][id] for id in img_ids}
        captions_page = {id: self.img_data['captions'][id] for id in img_ids}

        res = {
            "images": images_page,
            "anns": anns_page,
            "captions": captions_page,
            "categories": self.img_data['categories'],
            "n_images": self.img_data['n_images'],
            "tags_filter": self.img_data.get("tags_filter", [])
        }
        return res

    def update_page(self, new_pg_num):
        if new_pg_num > 0 and new_pg_num <= self.grid_params["n_pages"]:
            self.grid_params['pg_num'] = new_pg_num

    def update_categories(self, new_cats):
        img_ids = self.api.get_image_ids_from_categories(new_cats)
        self.load_img_data(img_ids)
        self.update_pages()
        self.img_data["categories"] = new_cats
        self.img_data["tags_filter"] = []

    def update_grid(self, grid_slots):
        self.grid_params["grid_slots"] = grid_slots
        self.update_pages()

    def update_dataset(self, dataset):
        self.api.load_dataset(dataset)
        img_ids = self.api.get_image_ids_from_categories(self.img_data['categories'])
        self.load_img_data(img_ids)
        self.update_pages()

    def change_urls(self, new_address):
        for img in self.img_data["images"]:
            img["url"] = new_address + "/" + img["file_name"]

    def tag_images(self, tag, selected_img_ids):
        for img_id in selected_img_ids:
            if tag == '0':  # if pressed 0 then remove tag
                self.tags.pop(int(img_id), None)
            else:
                self.tags[int(img_id)] = tag

    def tag_all(self, tag):
        for img in self.img_data['images']:
            self.tags[img['id']] = tag

    def filter_by_tags(self, selected_tags):
        img_ids = self.get_img_ids_by_tag(selected_tags)
        self.load_img_data(img_ids)
        self.update_pages()
        self.img_data['tags_filter'] = selected_tags

    # get img_ids for selected tags from tags dict
    def get_img_ids_by_tag(self, tag_list):
        img_ids = []
        for tag in tag_list:
            try:
                img_ids.extend([k for k, v in self.tags.items() if v == tag])
            except ValueError:
                continue
        return img_ids

    # format tags for file download
    # FROM: {img_id: tag}
    # TO: {tag: [img_ids]}
    def create_tags_dict(self):
        tags_dict = {}
        tags_filter = self.img_data.get("tags_filter", [])

        if tags_filter == []:
            # if tags filter not set download for every tag
            tags_filter = list(set([tag for tag in self.tags.values()]))

        for tag in tags_filter:
            tags_dict[tag] = self.get_img_ids_by_tag([tag])

        return tags_dict

    # read tags from download format
    def update_tags_from_tag_dict(self, tags_dict):
        for tag, img_ids in tags_dict.items():
            for img_id in img_ids:
                self.tags[img_id] = str(tag)

    def load_img_data(self, img_ids):
        self.img_data["images"] = self.api.get_images(img_ids)
        self.img_data["anns"] = self.api.get_annotations(img_ids)
        self.img_data["captions"] = self.api.get_captions(img_ids)
        self.img_data["n_images"] = len(self.img_data["images"])
        self.img_data["categories"] = []

    # update page number and number of pages
    def update_pages(self):
        self.grid_params["n_pages"] = int(
            math.ceil(self.img_data["n_images"] / self.grid_params["grid_slots"]))
        self.grid_params["pg_num"] = 1 if self.grid_params["n_pages"] > 0 else 0
