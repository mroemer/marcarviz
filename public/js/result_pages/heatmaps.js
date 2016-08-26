var current_objects;

getJobResult(window.id, function(err, res) {
    $('#wait').hide();
    if (err) return console.log(('An error has occured:\n' + xhr.responseText));
    if (res.error != undefined) return displayMessage(res.error, 'danger', true);
    $('#vis-container').show();
    var settings = {
        selection_callback: display_object_ids
    };
    window.heatmap = drawHeatmap(res, settings, 'heatmap');
    if (!heatmap._count_column) $('#btnHideCount').hide();
    if (!heatmap.column_metadata) $('#btnHideLegend').hide();
    var genes = $.map(heatmap._get_object_ids(), function (id) {
        return {id: id, text: formatRowIds(id)};
    });
    genes.sort(function (a, b) {
        var nameA = a.text.toLowerCase(), nameB = b.text.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    window.sltGenes = $('#sltGenes').select2({
        data: genes,
        width: '500px',
        placeholder: "Select genes for highlighting",
        allowClear: true,
        multiple: true,
        minimumInputLength: 1,
        closeOnSelect: false
    })
});

function display_object_ids(object_ids, heatmap) {
    if (object_ids.length > 0) {
        var text = (object_ids.length < 10) ? formatRowIds(object_ids) : formatRowIds(object_ids.slice(0, 10)) + ",... (" + object_ids.length + " total)";
        $('#txtSelectedRows').text(text);
        $('#row_ids_callback').show();
        current_objects = object_ids;
        if (heatmap.column_metadata != undefined) draw_boxplot(object_ids, heatmap);
    } else {
        $('#row_ids_callback').hide();
    }
}

$('#btnExportCSV').click(function () {
    var blob = new Blob([nodes2CSV(_this.data), "Gene"], {type: 'text/csv;charset=utf-8;'});
    var filename = "heatmap_data.csv";
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        link.setAttribute("href", window.URL.createObjectURL(blob));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

$('#btnHighlight').unbind().click(function () {
    var genes = sltGenes.val();
    heatmap.events.row_onclick(genes);
});

$('#btnZoom').unbind().click(function () {
    heatmap.show_ids(sltGenes.val());
});

$('#btnSaveList').unbind().click(function () {
    saveGeneList(current_objects);
});

$('#btnHideCount').click(function() {
    heatmap.settings.count_column = !heatmap.settings.count_column;
    heatmap.redraw(true);
    if (heatmap.settings.count_column) {
        $('#btnHideCount').text("Hide count column")
    } else {
        $('#btnHideCount').text("Show count column")
    }
});

$('#btnHideLegend').click(function() {
    heatmap.settings.legend = !heatmap.settings.legend;
    heatmap.redraw(true);
    if (heatmap.settings.legend) {
        $('#btnHideLegend').text("Hide legend")
    } else {
        $('#btnHideLegend').text("Show legend")
    }
});
