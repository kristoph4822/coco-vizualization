# This file initializes your application and brings together all of the various components.
import json
from flask import render_template, request, url_for, redirect, send_file
from app import app
from app.api.coco_api import CocoApi
from app.local_server import LocalServer
from app.data_manager import DataManager
from app.export.file_handler import download_tags_to_file


# data manager for handling all application data
data_manager = DataManager(
    CocoApi(app.config["INITIAL_DATASET"]),
    app.config["INITIAL_CATEGORIES"],
    app.config["INITIAL_GRID_SLOTS"],
    app.config["INITIAL_COLUMNS"]
)

# local server for hosting local folder to load images from
local_images_server = LocalServer()


@app.route("/", methods=['GET'])
def home():

    data = data_manager.get_page_data()
    data['local_dir'] = local_images_server.directory

    return render_template('index.html', data=data)


@app.route("/change_page", methods=['POST'])
def change_page():

    new_pg = data_manager.grid_params["pg_num"]

    if 'goto_page_button' in request.form:
        input = request.form['goto_text_input']
        if input.isdigit():
            new_pg = int(request.form['goto_text_input'])

    elif 'previous_page_button' in request.form:
        new_pg -= 1

    elif 'next_page_button' in request.form:
        new_pg += 1

    data_manager.update_page(new_pg)

    return redirect(url_for('home'))


@app.route("/change_categories", methods=['POST'])
def change_categories():

    new_cats = request.form.getlist('categories')
    data_manager.update_categories(new_cats)

    return redirect(url_for('home'))


@app.route("/change_grid", methods=['POST'])
def change_grid():

    grid_slots = int(request.form['grid_slots_button'])
    data_manager.update_grid(grid_slots)

    return redirect(url_for('home'))


@app.route("/change_dataset", methods=['POST'])
def change_dataset():

    dataset = request.form["dataset_selection"]
    data_manager.update_dataset(dataset)

    if request.form.get("data_source_radio") == "local":
        directory = request.form["local_folder_input"]
        local_images_server.set_directory(directory=directory)
        data_manager.change_urls(f"http://localhost:{local_images_server.port}")

    else:
        local_images_server.directory = None

    return redirect(url_for('home'))


# called with AJAX from JavaScript 
@app.route('/update_tags', methods=['POST'])
def update_tags():

    data = json.loads(request.form['images_to_tag'])
    tag = data['tag']

    if data['select_all_flag']:
        data_manager.tag_all_images(tag)

    else:
        selected_img_ids = data['selected_img_ids']
        data_manager.tag_images(tag, selected_img_ids)

    return redirect(url_for('home'))


@app.route("/filter_images_by_tags", methods=['POST'])
def filter_images_by_tags():

    selected_tags = request.form.getlist('tags_filter')
    data_manager.update_tags_filter(selected_tags)

    return redirect(url_for('home'))


@app.route('/download_tags')
def download_tags():

    tags_dict = data_manager.create_tags_dict()
    file_path = download_tags_to_file(tags_dict)

    return send_file(file_path, as_attachment=True)


@app.route('/read_tags_from_file', methods=['POST'])
def read_tags_from_file():

    uploaded_tags_json = json.loads(request.form['images_to_tag'], object_hook=lambda d: {int(k): v for k, v in d.items()})
    data_manager.update_tags_from_tag_dict(uploaded_tags_json)

    return redirect(url_for('home'))
