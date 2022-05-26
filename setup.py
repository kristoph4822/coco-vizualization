from setuptools import setup, find_packages

setup(
    name='image-datasets-explorer',
    version='1.0',
    ### Dependencies
    install_requires=[
        'Flask',
        'cython',
        'pycocotools',
        'Flask-Cors'
    ],
    ### Contents
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False
)


#python setup.py install