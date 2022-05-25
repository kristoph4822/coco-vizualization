from abc import ABC, abstractmethod


class ApiInterface(ABC):
    """
    This interface is dedicated for modules processing image dataset annotations.
    Every annotation reader object, which implements these functions, should work properly within the app.
    Object implementing this interface should be passed to DataManager object as init parameter (same way it is done now with CocoApi)
    """

    @abstractmethod
    def load_dataset(self, dataset):
        """
        Function for changing dataset, which means switching input annotations file/files. 

        Parameters
        ------------
            dataset : str
                New dataset name
        """
    
    @abstractmethod
    def get_image_ids_from_categories(self, cats_list):
        """
        Get images ids that contains objects of all given categories

        Parameters
        ------------
            cat_list : list of str
                List of object categories

        Returns
        ----------
            list of int
                List of image ids containing objects of given categories
    
        """

    @abstractmethod
    def get_images(self, img_ids):
        """
        Gets images metadata for given images


        Parameters
        ------------
            img_ids : list of int)
                List of image ids


        Returns
        ----------
            list of dicts
                List of images metadata dicts (see below) for given image ids 


        IMAGES METADATA DICTS
        ----------------------
        Image metadata dict contain data regarding image itself.
        
            REQUIRED PARAMETERS:
                {
                    'file_name': str, 
                    'url': str, 
                    'height': int, 
                    'width': int, 
                    'id': int
                }

            EXAMPLE:
                {
                    'file_name': '000000532481.jpg', 
                    'coco_url': 'http://images.cocodataset.org/val2017/000000532481.jpg', 
                    'height': 426, 
                    'width': 640, 
                    'id': 532481
                }
        """


    @abstractmethod
    def get_annotations(self, img_ids):
        """
        Gets image annotations (objects data) for given images 


        Parameters
        ------------
            img_ids : list of int 
                List of image ids


        Returns
        ----------
            dict of int : list of dicts
                Dict, where:
                - key : image id
                - value : list of ANNOTATION DICTS (see below) 


        ANNOTATION DICTS
        -----------------
        Annotation dict contains data regarding one object on specific image.

        REQUIRED PARAMETERS:
            {
            'segmentation': list of float
            'image_id': int
            'bbox': list of float (len=4)
            'category_id': int, 
            'category_name': str,
            'id': int
            }

        EXAMPLE:
            {
            'segmentation': [253.85, 187.23, ...], 
            'image_id': 532481, 
            'bbox': [250.82, 168.26, 70.11, 64.88], 
            'category_id': 1, 
            'category_name: 'person'
            'id': 508910
            }

        """


    @abstractmethod
    def get_captions(self, img_ids):
        """
        Gets image captions for given images 


        Parameters
        ------------
            img_ids : list of int 
                List of image ids


        Returns
        ----------
            dict of int : str
                Dict, where:
                - key : image id
                - value : image caption

        """


    @abstractmethod
    def get_dataset(self):
        """
        Get current dataset name

        Returns:
            str

        """
        
    @abstractmethod
    def get_available_datasets(self):
        """
        Get list of all available datasets

        Returns:
            list of str

        """

        
    @abstractmethod
    def get_all_categories(self):
        """
        Get list of all available categories

        Returns:
            list of str

        """
    
        

    