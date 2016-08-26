$.ajax({
    url: '/api/get_job_result',
    data: {jobID: window.id},
    type: 'GET',
    dataType: 'json',
    success: function (res) {
        $('#wait').hide();
        if (res.error != undefined) return console.log(res.error);
        $('#vis-container').show();
        window.res = res;
        var settings = {
            heatmap_colors: "Blues",
            min_col: 0,
            middle_col: 2,
            max_col: 4,
            max_rows: 400,
            legend: true,
            data_type: "p-value",
            format_values: function(val) {
              return formatPValue(Math.pow(10, -Number(val)));  
            },
            selection_callback: display_object_ids
        };
        window.heatmap = drawHeatmap(res, settings, 'heatmap');
    },
    error: function (xhr) {
        $('#wait').hide();
        alert('An error has occured:\n' + xhr.responseText);
    }
});

function display_object_ids(object_ids) {
    if (object_ids.length < 1) {
        $('#row_ids_callback').hide();
    } else {
        var text;
        if (object_ids.length < 10) {
            text = object_ids;
        } else {
            text = object_ids.slice(0, 10) + ",... (" + object_ids.length + " total)";
        }
        $('#txtSelectedRows').text(text);
        $('#row_ids_callback').show();
    }
}

$('#btnExportCSV').click(function () {
    var blob = new Blob([nodes2CSV(_this.data, "Gene set")], {type: 'text/csv;charset=utf-8;'});
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

$('#btnHideLegend').click(function() {
    heatmap.settings.legend = !heatmap.settings.legend;
    heatmap.redraw(true);
    if (heatmap.settings.legend) {
        $('#btnHideLegend').text("Hide legend")
    } else {
        $('#btnHideLegend').text("Show legend")
    }
});
