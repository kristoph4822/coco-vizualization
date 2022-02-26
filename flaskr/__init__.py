# This file initializes your application and brings together all of the various components.
from flask import Flask , render_template, request, jsonify
from api import cocoApi

pg_num = 0
elem_on_page = 20
n_elem = 0

app = Flask(__name__)

@app.route("/", methods=['POST', 'GET'])
def home():
    global pg_num
    global n_elem
    global newCats

    if request.method == 'POST':
        if request.form.get('next') == 'Next':
            pg_num += 1 if  pg_num < n_elem/elem_on_page - 1 else 0
        elif request.form.get('previous') == 'Previous':
            pg_num -= 1 if pg_num > 0  else 0
        else:
            newCats = request.form.getlist('skills')
            print(newCats)
            coco.load_images_by_categories(newCats)
            n_elem = len(coco.imgUrls)
    

    images = coco.get_images_page(pg_num, elem_on_page)

    return render_template('test.html', images=images, pg_num = pg_num + 1, dataset = 'val2017', all_categories=coco.categories, newCats = newCats)

@app.route("/ajax_add",methods=["POST","GET"])
def ajax_add():
    if request.method == 'POST':
        hidden_skills = request.form['hidden_skills']
        print(hidden_skills)     
        msg = 'New categories loaded'  
    return jsonify(msg)
 

if __name__ == '__main__':
    coco = cocoApi()
    coco.load_images_by_categories(['dog'])
    n_elem = len(coco.imgUrls)
    newCats = None
    app.run(port=5001)
    
'''
import os

from flask import Flask

app = Flask(__name__, instance_relative_config=True)
#app.config.from_object('config')


def create_app(test_config=None):

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # a simple page that says hello
    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    return app
'''

