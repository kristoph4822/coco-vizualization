import math


class DataManager:

    '''
    A class to store and format application data, which is later sent to frontend. 
    It uses API object implementing ApiInterface functions, for retrieving annotations data (look api/api_interface.py).


    Attributes
    -----------
    api : API object
        Object implementing ApiInterface functions

    images : dict
        Images metadata dict returned by API object (look api/api_interface.py)

    anns : dict
        Annotations (bounding boxes/segmentations) dict returned by API object (look api/api_interface.py)

    captions : dict
        Images captions dict returned by API object (look api/api_interface.py)

    filters: dict
        Selected tags and categories to filter loaded images, format:
        {
            'selected_tags' : list of str
            'selected_categories' : list of str
        }

    tags: (dict of int : str)
        Tagged images with tag label, format:
        {
            image id : tag label,
            ...
        }

    grid_params : dict
        Images grid parameters and paging data, format:
        {
            'pg_num': int,
            'grid_slots': int,
            'initial_columns': int,
            'n_pages': int
        }

    n_images : int
        Total number of images for this selection
    '''


    def __init__(self, api_object, categories, grid_slots, columns):
        self.api = api_object
        self.grid_params = {
            'pg_num': 1,
            'grid_slots': grid_slots,
            'initial_columns': columns,
            'n_pages': 0
        }
        self.filters = {
            "selected_tags": [],
            "selected_categories": categories
        }
        self.tags = {}

        # load images metadata, annotations and captions for inital categories and update grid params
        img_ids = self.api.get_image_ids_from_categories(categories)
        self.load_img_data(img_ids)
        self.update_pages()


    def load_img_data(self, img_ids):
        """
        Loads images metadata, annotations and captions from image ids using api functions.
        """

        self.images = self.api.get_images(img_ids)
        self.anns = self.api.get_annotations(img_ids)
        self.captions = self.api.get_captions(img_ids)
        self.n_images = len(self.images)


    def update_pages(self):
        """
        Used to update paging data after loading new data.
        """

        self.grid_params["n_pages"] = int(math.ceil(self.n_images / self.grid_params["grid_slots"]))
        self.grid_params["pg_num"] = 1 if self.grid_params["n_pages"] > 0 else 0


    def get_page_data(self):
        """
        Returns all the necessary data for frontend to display one page.
        """
        pg_num = self.grid_params["pg_num"]
        grid_slots = self.grid_params["grid_slots"]

        start = (pg_num - 1) * grid_slots
        end = start + grid_slots

        if end > self.n_images:
            end = self.n_images

        images_page = self.images[start: end]
        img_ids = [img["id"] for img in images_page]
        anns_page = {id: self.anns[id] for id in img_ids}
        captions_page = {id: self.captions[id] for id in img_ids}

        return self.create_data_dict_for_frontend(images_page, anns_page, captions_page)


    def create_data_dict_for_frontend(self, images, anns, captions):
        """
        Returns data dict, which is later used in HTML template and is loaded to JavaScript as JSON.
        """

        return {
            "images": images,
            "anns": anns,
            "captions": captions,
            "filters": self.filters,
            "tags": self.tags,
            "grid_params": self.grid_params,
            "n_images": self.n_images,
            "api_meta": {
                "dataset": self.api.get_dataset(),
                "all_cats": self.api.get_all_categories(),
                "all_datasets": self.api.get_available_datasets()
            }
        }

    def update_page(self, new_pg_num):
     
        if new_pg_num > 0 and new_pg_num <= self.grid_params["n_pages"]:
            self.grid_params['pg_num'] = new_pg_num


    def update_categories(self, new_cats):
        """
        Loads new data for selected categories
        """

        img_ids = self.api.get_image_ids_from_categories(new_cats)
        self.load_img_data(img_ids)
        self.update_pages()
        self.filters["selected_categories"] = new_cats
        self.filters['selected_tags'] = [] # clear tags when filtering by categories


    def update_tags_filter(self, selected_tags):
        """
        Loads new data for selected tags.
        """

        img_ids = self.get_img_ids_by_tag(selected_tags)
        self.load_img_data(img_ids)
        self.update_pages()
        self.filters['selected_tags'] = selected_tags
        self.filters['selected_categories'] = [] # clear tags when filtering by tags


    def update_grid(self, grid_slots):

        self.grid_params["grid_slots"] = grid_slots
        self.update_pages()


    def update_dataset(self, dataset):
        self.api.load_dataset(dataset)
        img_ids = self.api.get_image_ids_from_categories(self.filters["selected_categories"])
        self.load_img_data(img_ids)
        self.update_pages()
        

    # function used to change urls to point to images located in localfolder hosted on local server 
    def change_urls(self, new_address):
        for img in self.images:
            img["url"] = new_address + "/" + img["file_name"]


    def tag_images(self, tag, selected_img_ids):
        for img_id in selected_img_ids:
            # if tag is 0 (0 key pressed) then remove tag
            if tag == '0':  
                self.tags.pop(int(img_id), None)
            else:
                self.tags[int(img_id)] = tag


    def tag_all_images(self, tag):
        for img in self.images:
            self.tags[img['id']] = tag

    
    def get_img_ids_by_tag(self, tag_list):
        """
        Retrives img_ids for selected tags from tags dict.
        """
        img_ids = []
        for tag in tag_list:
            try:
                img_ids.extend([k for k, v in self.tags.items() if v == tag])
            except ValueError:
                continue
        return img_ids

    
    def create_tags_dict(self):
        """
        Reformats tags dict for file download, so it's more readable
            - before: {img_id : tag}
            - after: {tag : list of img_ids}

        Returns:
        ---------
        dict of str : list of int

        """

        tags_dict = {}
        tags_filter = self.filters["selected_tags"]

        if tags_filter == []:
            # if tags filter not set download for every tag
            tags_filter = list(set([tag for tag in self.tags.values()]))

        for tag in tags_filter:
            tags_dict[tag] = self.get_img_ids_by_tag([tag])

        return tags_dict

    
    def update_tags_from_tag_dict(self, tags_dict):
        """
        Loads tags from tags file format (reverses create_tags_dict function)

        Parameters:
        -----------
        tags_dict : dict of str : list of int 
            Tags dict read from file in {tag : list of img_ids} format
        """
        
        for tag, img_ids in tags_dict.items():
            for img_id in img_ids:
                self.tags[img_id] = str(tag)
