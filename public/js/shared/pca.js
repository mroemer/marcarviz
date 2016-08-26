function drawPCA(res, container, omitBarplot, omitLoadingTable, metadataKey) {
    var biplot = $('<div>');

    biplot.data('render3D', false);


    var metadataKeys = Object.keys(res.metadata[Object.keys(res.metadata)[0]]);
    var metadata = $.map(metadataKeys, function(el) {return {id: el, text: el}});

    var selectColor = $('<select class="form-control">');

    var toggle3D = function() {
        biplot.data('render3D', !biplot.data('render3D'));
        var data = getPCAData(res, selectColor.val());
        drawBiplot(data, biplot, res);
    };

    var selectColorDiv = $('<div>')
        .append($('<strong>').html("Color conditions by:"))
        .append(selectColor)
        .append($('<div class="helpblock">').html("Select the metadata key for the color coding"))
        .append($('<button class="btn btn-primary">').on('click', toggle3D).html("Switch 2D/3D view"));
    $(container).append(selectColorDiv);
    selectColor.select2({
        data: metadata
    });
    var initMetadata = metadataKey ? metadataKey : 'Condition';
    selectColor.val(initMetadata).trigger('change');
    selectColor.change(function() {
        var data = getPCAData(res, selectColor.val());
        drawBiplot(data, biplot, res);
    });

    $(container).append(biplot);
    var data = getPCAData(res, initMetadata);
    drawBiplot(data, biplot, res);

    if (!omitBarplot) {
        var barplot = $('<div>');
        $(container).append(barplot);
        drawVarianceBarplot(res['pev'], res['pevcum'], barplot);
    }

    if (!omitLoadingTable) {
        var loadingTable = $('<table class="display">');
        loadingTable.append($('<caption class="table-caption">').html("<text>Top loaded genes</text>"));
        $(container).append(loadingTable);
        renderLoadingTable(res['loading'], loadingTable);
    }
}

function getPCAData(res, color) {
    var colorMap = {};
    $.map(res.metadata, function(el, i) {
        if (colorMap[el[color]]) {
            colorMap[el[color]].push(i);
        } else {
            colorMap[el[color]] = [i];
        }
    });
    var colorKeys = Object.keys(colorMap);
    return $.map(colorKeys, function(key) {
        if (colorMap[key].length > 1) {
            return {
                name: key,
                data: $.map(colorMap[key], function(index) {
                    var point = res.data[index];
                    return {
                        name: point.name,
                        x: Number(point.PC1),
                        y: Number(point.PC2),
                        z: Number(point.PC3)
                    }
                })
            }
        } else {
            var point = res.data[colorMap[key]];
            return {
                name: key,
                data: [{
                    name: point.name,
                    x: Number(point.PC1),
                    y: Number(point.PC2),
                    z: Number(point.PC3)
                }]
            }
        }
    });
}

// plot PCA results in biplot
function drawBiplot(series, container, res) {
    var width = $('#content').width();
    var height = $(window).height();
    $(container).highcharts({
        credits: {
            enabled: false
        },
        chart: {
            type: 'scatter',
            width: width,
            height: height * 3 / 4,
            zoomType: container.data('render3D') ? null : 'xy',
            options3d: {
                enabled: container.data('render3D') ? true : false,
                alpha: 10,
                beta: 30,
                depth: 250,
                viewDistance: 5,

                frame: {
                    bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
                    back: { size: 1, color: 'rgba(0,0,0,0.04)' },
                    side: { size: 1, color: 'rgba(0,0,0,0.06)' }
                }
            }
        },
        plotOptions: {
            scatter: {
                width: 10,
                height: 10,
                depth: 10
            }
        },
        title: {
            text: 'Principal component analysis of ' + 'treatments'
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<table>',
            pointFormatter: res ? function() {
                var metadata = res.metadata[this.name];
                var buffer = "<th>Condition</th><th>" + metadata['Condition'] + "</th>";
                for (var key in metadata) {
                    if(!metadata.hasOwnProperty(key) || key == 'Condition') continue;
                    buffer += "<tr><td>" + key + ": </td><td>" + metadata[key] + "</td></tr>";
                }
                return buffer;
            } : null,
            footerFormat: '</table>'
        },
        xAxis: {
            title: {
                text: 'PC 1'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: 'PC 2'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        zAxis: {
            title: {
                text: 'PC 3'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        series: series
    });


    if (container.data('render3D')) {
        // Add mouse events for rotation
        var chart = $(container).highcharts();
        $(chart.container).unbind().bind('mousedown.hc touchstart.hc', function (eStart) {
            eStart = chart.pointer.normalize(eStart);

            var posX = eStart.pageX,
                posY = eStart.pageY,
                alpha = chart.options.chart.options3d.alpha,
                beta = chart.options.chart.options3d.beta,
                newAlpha,
                newBeta,
                sensitivity = 5; // lower is more sensitive

            $(document).bind({
                'mousemove.hc touchdrag.hc': function (e) {
                    // Run beta
                    newBeta = beta + (posX - e.pageX) / sensitivity;
                    chart.options.chart.options3d.beta = newBeta;

                    // Run alpha
                    newAlpha = alpha + (e.pageY - posY) / sensitivity;
                    chart.options.chart.options3d.alpha = newAlpha;

                    chart.redraw(false);
                },
                'mouseup touchend': function () {
                    $(document).unbind('.hc');
                }
            });
        });
    }
}

function drawVarianceBarplot(pev, pevCum, container) {
    pev = pev.slice(0,10);
    pevCum = pevCum.slice(0,10);
    $(container).highcharts({
        credits: {
            enabled: false
        },
        chart: {
            type: 'column'
        },
        title: {
            text: 'Explained variance per PC'
        },
        xAxis: {
            categories: $.map(new Array(pev.length), function(x,i) {return 'PC' + (i+1)})
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: 'Explained variance'
            },
            reversedStacks: false,
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                }
            }
        },
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 25,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormatter: function() {
                return this.y.toFixed(2) + '%';
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal'
            }
        },
        series: [{
            name: 'Explained by PC',
            data: pev
        }, {
            name: 'Explained cumulative',
            data: $.map(pevCum, function(x, i) {return {v: x, y: x - pev[i]}}),
            color: '#a3defb',
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormatter: function() {
                    return this['v'].toFixed(2) + '%';
                }
            }
        }]
    });
}

function renderLoadingTable(loading, container) {
    container.DataTable({
        data: loading,
        columns: [
            {data: 'id', title: "Entrez ID", width: '70px',
                render: function(id) {
                    return '<a href=http://www.ncbi.nlm.nih.gov/gene/?term=' + id + ' target="_blank">' +
                        id + '</a>';
                }
            },
            {data: 'symbol', title: "Gene Symbol", width: '100px',
                render: function(symbol, meta, row) {
                    if (row.s == "M") {
                        return '<a href="http://www.informatics.jax.org/marker/' + row.db_id + '" target="_blank">' +
                            symbol + '</a>';
                    } else if (row.s == "H") {
                        return '<a href="http://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=' +
                            row.db_id + '" target="_blank">' + symbol + '</a>';
                    } else if (row.s == "R") {
                        return '<a href="http://rgd.mcw.edu/rgdweb/report/gene/main.html?id=' +
                            row.db_id + '" target="_blank">' + symbol + '</a>';
                    } else {
                        return symbol;
                    }
                }
            },
            {data: 'desc', title: "Gene summary"},
            {data: 'PC1', title: "PC1", render: function(data) {return Number(data).toFixed(2)}},
            {data: 'PC2', title: "PC2", render: function(data) {return Number(data).toFixed(2)}},
            {data: 'PC3', title: "PC3", render: function(data) {return Number(data).toFixed(2)}}
        ],
        order: [[3, "desc"]]
    })
}
