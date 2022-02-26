from api import cocoApi
x = cocoApi()
x.load_images_by_categories(['dog'])
print(x.imgUrls)