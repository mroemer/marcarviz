$(document).ready(function () {
    $.ajax({
        type: 'POST',
        url: '/api/get_studies',
        success: function (json) {
            window.studyData = json;
            createPieChart();
            $('#chart-select').select2({
                width: 200,
                minimumResultsForSearch: Infinity
            });

            $('#chart-select').change(createPieChart);
        },
        error: function (xhr, data, error) {
            console.log(error);
        }
    });

    getJobResult('example_difftable', function(err, res) {
        if (err) return console.warn('Problem with example for diff-table: ' + err.responseText);
        renderDiffTable(res, '#diff-table');
    });
    getJobResult('example_pwtable', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        renderPathwayTable(res, '#pathways');
    });
    getJobResult('example_heatmap', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        var settings = {
            max_col: 4,
            min_col: -4
        };
        drawHeatmap(res, settings, 'heatmap');
    });
    getJobResult('example_volcano', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        drawVolcano(res, '#volcano');
    });

    getJobResult('example_scatter', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        drawScatter(res, res['regression'], '#scatter');
    });
    getJobResult('example_venn', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        drawVenn(res, '#venn', null);
    });
    getJobResult('example_pca', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        $('#pca-img').hide();
        drawPCA(res, '#pca', false, true, 'Class');
    });

    
    //getJobResult('example_pwheatmap', function(err, res) {
    //    if (err) return console.log('An error has occured:\n' + err.responseText);
    //    var settings = {
    //        heatmap_colors: "Blues",
    //        min_col: 0,
    //        middle_col: 2,
    //        max_col: 4,
    //        max_rows: 400
    //    };
    //    drawHeatmap(res, settings, 'pathway-heatmap');
    //});
    
});

function labelFormatter(label, series) {
    return "<div style='font-size:10pt; text-align:center; padding:2px; color:black;'>" + label + "<br/>" + series.data[0][1] + "</div>";
}



function createPieChart() {
    // process species data
    var chartType = $('#chart-select').val() !== undefined ? $('#chart-select').val() : 'species';
    var speciess = $.map(window.studyData, function (el) {
        return el[[chartType]];
    });
    var speciesCount = {};
    $.map(speciess, function (species) {
        if (speciesCount[[species]] == undefined) {
            speciesCount[[species]] = 1;
        } else {
            speciesCount[[species]]++;
        }
    });
    var speciesData = [];
    var keys = Object.keys(speciesCount);
    for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        speciesData.push({
            label: key,
            data: speciesCount[key]
        })
    }
    // create pie chart of species
    $.plot('#study-chart', speciesData, {
        series: {
            pie: {
                show: true,
                label: {
                    show: true,
                    radius: 2/4,
                    formatter: labelFormatter,
                    background: {
                        opacity: 0
                    }
                }
            }
        },
        //grid: {
        //    hoverable: true,
        //    clickable: true
        //},
        legend: {
            show: false
        }
    });
    // add hover events
    //$("#study-chart").bind("plothover", function (event, pos, item) {
    //    if (item) {
    //        var x = 0,
    //            y = 0;
    //
    //        $("#tooltip").html(item.series.label + ": " + item.series.data[0][1])
    //            .css({top: $("#study-chart").position().top, left: $("#study-chart").position().left})
    //            .fadeIn(200);
    //    } else {
    //        $("#tooltip").hide();
    //    }
    //});
}
