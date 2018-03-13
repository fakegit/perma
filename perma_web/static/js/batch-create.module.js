var APIModule = require('./helpers/api.module.js');
var FolderTreeModule = require('./folder-tree.module.js');
var FolderSelectorHelper = require('./helpers/folder-selector.helper.js');
var BatchViewModule = require('./batch-view.module.js');

var $create_modal, $view_modal;
var $input_area, $start_button, $batch_target_path;
var $link_list;
var target_folder;

var start_batch = function() {
    // XXX clear screen
    APIModule.request('POST', '/batches/', {
        "saved_folder": target_folder
    }).then(function(batch_object) {
        var batch_id = batch_object.id;
        var urls = $input_area.val()
            .split("\n")
            .map(function(s) {
                return s.trim();
            });
        var guid_map = {};
        urls.forEach(function(url) {
            return APIModule.request('POST', '/archives/', {
                folder: target_folder,
                batch_id: batch_id,
                url: url
            }).then(function(response) {
                var guid = response.guid;
                // this should be the same as the URL we submitted,
                // but just in case we start normalizing them somehow
                // on the backend
                var url = response.url;
                guid_map[guid] = {
                    "url": url
                };
            }).fail(function(err) {
                console.log("fail :(");
                console.error(err);
                // deal with fail
            });
        });
        var interval = setInterval(function() {
            if (Object.keys(guid_map).length === urls.length) {
                clearInterval(interval);
                BatchViewModule.show_batch(batch_id, target_folder);
                $create_modal.modal("hide");
                $view_modal.modal("show");
            }
        }, 500);
    });
};

var refresh_target_path_dropdown = function() {
    FolderSelectorHelper.makeFolderSelector($batch_target_path, target_folder);
};

var set_folder_from_trigger = function(evt, data) {
    if (typeof data !== 'object') {
        data = JSON.parse(data);
    }
    target_folder = data.folderId;
    $batch_target_path.find("option").each(function(ndx) {
        if ($(this).val() == target_folder) {
            $(this).prop("selected", true);
        }
    });
};

var set_folder_from_dropdown = function(new_folder_id) {
    target_folder = new_folder_id;
};

var setup_handlers = function() {
    $create_modal.on('shown.bs.modal', function() {
        refresh_target_path_dropdown();
    });
    $(window)
        .on('FolderTreeModule.selectionChange', set_folder_from_trigger)
        .on('dropdown.selectionChange', set_folder_from_trigger);
    $batch_target_path.change(function() {
        var new_folder_id = $(this).val();
        set_folder_from_dropdown(new_folder_id);
    });
    $start_button.click(function() {
        //show_link_list();
        start_batch();
    });
 };

export function init() {
    $(function() {
        $create_modal = $('#batch-create-modal');
        $view_modal = $('#batch-view-modal');
        $input_area = $('#batch-create-input textarea');
        $start_button = $('#start-batch');
        $batch_target_path = $('#batch-target-path');

        setup_handlers();
    });
}
