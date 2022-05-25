from abc import ABC, abstractmethod


class ApiInterface(ABC):

    @abstractmethod
    def load_dataset(self, dataset):
        """_summary_

        Args:
            dataset (_type_): _description_

        Returns:
            _type_: _description_
        """
    
    @abstractmethod
    def get_image_ids_from_categories(self, cats_list):
        """
        Get images and annotations for specific categories

        Args:
            cat_names (_type_): _description_

        Returns:
            _type_: _description_
        
        return {
            "images": images,
            "anns": anns,
            "captions": captions,
            "n_images": len(images),
            "categories": cat_names
        }
        """

    @abstractmethod
    def get_images(self, img_ids):
        """
        Gets specific images by ids (used for tags filtering)

        Args:
            img_ids (_type_): _description_

        Returns:
            _type_: _description_
        
        return {
            "images": images,
            "anns": anns,
            "captions": captions,
            "n_images": len(images),
            "categories": []
        }
        """

    @abstractmethod
    def get_captions(self, img_ids):
        """_summary_

        Args:
            img_ids (_type_): _description_
        """

    @abstractmethod
    def get_annotations(self, img_ids):
        """_summary_

        Args:
            img_ids (_type_): _description_
        """