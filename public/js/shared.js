// format p-values
function formatPValue(p) {
    p = parseFloat(p);
    return p < 0.01 ? p.toExponential(2) : p.toFixed(3);
}

// Draws a barplot of the normalized data for probeID to containerID
function drawNormalizedDataBarplot(study, treatment, probeID, containerID, symbol) {
    $.ajax({
        url: '/api/get_norm_data',
        data: {
            study: study,
            treatment: treatment,
            row: probeID
        },
        type: 'GET',
        dataType: "json",
        success: function (json) {
            if (json.samples.length < 1 || json.samples[0] == null) return $(containerID).html("No normalized data available");
            var series = [];
            var i;
            for (i = 0; i < Math.max(json.samples.length, json.controls.length); i++) {
                series.push({
                    showInLegend: false,
                    data: [
                        {name: json.samples[i], y: json.data[json.samples[i]], color: '#9e1137'},
                        {name: json.controls[i], y: json.data[json.controls[i]], color: '#006ba7'}
                    ]
                })
            }

            var width = $('#content').width();//Math.min(1000, $('#scatter-container').width());
            var height = 400;//$(window).height();//'.Math.max(400, width / 1.4);
            $(containerID).highcharts({
                credits: {
                    enabled: false
                },
                chart: {
                    type: 'column',
                    width: width,
                    height: height * 3 / 4
                },
                title: {
                    text: 'Normalized log<sub>2</sub>(Intensity) for ' + symbol,
                    useHTML: true
                },
                xAxis: {
                    categories: [
                        'Treatment',
                        'Control'
                    ]
                },
                yAxis: {
                    title: {
                        text: 'log2(Intensity)'
                    }
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.point.name + '</b><br>' + this.y.toFixed(2)
                    }
                },
                series: series
            });
            //$('#vis-container').get(0).scrollIntoView();
        },
        error: function () {
            $(containerID).html("No normalized data available");
        }
    });
}

// Accepts only integer inputs (0-9)
// .keypress(acceptIntegerInputs);
function acceptIntegerInputs(e) {
    var key = e.which || e.keyCode;

    if (!(key >= 48 && key <= 57) && // Interval of values (0-9)
        (key !== 8) &&              // Backspace
        (key !== 9))		             // Horizontal tab
    {
        e.preventDefault();
        return false;
    }
}

// Accepts only number inputs (0-9.)
// .keypress(acceptNumberInputs);
function acceptNumberInputs(e) {
    var key = e.which || e.keyCode;

    if (!(key >= 48 && key <= 57) && // Interval of values (0-9)
        (key !== 8) &&              // Backspace
        (key !== 9) &&              // Horizontal tab
        (key !== 46 || $(this).val().indexOf(".") > -1))               // Dot
    {
        e.preventDefault();
        return false;
    }
}

// render a select for study selection to container
function populateStudySelection(container, next) {
    $.ajax({
        type: 'POST',
        url: '/api/get_studies',
        success: function (json) {
            window.studies = json;
            studies.sort(function (a, b) {
                var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            if (studies.length > 5) $(container).attr('data-live-search', 'true');
            $.map(studies, function(el) {
                $(container).append($('<option>').val(el.name).html(el.name).data('content', formatStudy(el))).selectpicker('refresh');
            });
            container.change();
            if (next) next();
        },
        error: function (xhr, data, error) {
            if (next) next(error);
        }
    });
}

// initialize treatment selection
function initializeTreatmentSelection(studySelect, treatmentSelect, onchange, next) {
    treatmentSelect.attr('data-live-search', 'true');
    studySelect.change(function () {
        updateTreatmentSelect(studySelect, treatmentSelect, onchange);
    });
    if (onchange) {
        treatmentSelect.change(onchange);
    }
    populateStudySelection(studySelect, function() {
        if (next) next();
    });
}

// format function for studies in select2
function formatStudy(study) {
    var markup = '<span style="display: inline-block; width: 100px">' + (study.GEO ? study.GEO : '') + '</span>';
    markup += '<span style="display: inline-block; width: 500px">' + study.shortname + '</span>';
    markup += '<span style="display: inline-block; width: 150px">' + study.species + '</span>';
    return markup;
}

// load treatments for selected study
function updateTreatmentSelect(studySelect, treatmentSelect, next) {
    $('#btnExecute').attr("disabled", "disabled");
    if (studySelect.val() != "") {
        $.ajax({
            url: '/api/get_treatments',
            type: 'GET',
            data: {
                study: studySelect.val()
            },
            dataType: "json",
            success: function (json) {
                treatmentSelect.find('option').remove().selectpicker('refresh');
                treatmentSelect.removeAttr('disabled');
                json.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
                $.map(json, function (el) {
                    var desc = el.description ? el.description : el.name;
                    treatmentSelect.append($('<option>').val(el.name).html(desc)).selectpicker('refresh');
                });
                if (next) next();
            },
            error: function (xhr, data, error) {
                if (next) next(error);
            }
        });
    }
}

// update execute button state (enabled only if treatment is selected)
function updatebtnExecute() {
    if ($("#sltTreatment").val() == "" || $("#sltTreatment").val() == null) {
        $('#btnExecute').attr("disabled", "disabled")
    } else {
        $('#btnExecute').removeAttr("disabled");
    }
}

/*
String sanitizing
Source: http://stackoverflow.com/questions/23187013/is-there-a-better-way-to-sanitize-input-with-javascript
 */
function sanitizeString(str){
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str.trim();
}

/*
Submits a job to the cluster for execution and redirects to the job processing page
 */
function submitJob(tool, parameters, jobName, next) {
    if (jobName == null) return;
    $.ajax({
        url: '/api/submit_job',
        type: 'POST',
        data: {
            tool: tool,
            jobName: jobName,
            parameters: parameters
        },
        dataType: "json",
        success: function (json) {
            var resultLink = '/job?id='+json.jobID;
            var $linkDiv = $( "#resultLink" );
            if ($linkDiv.length > 0) {
                $linkDiv.html('The analysis has been started!<br>If no new window has been opened, <a href="' +
                    resultLink + '" target="_blank">click here</a> or use this link:<br>' +
                    '<a href="' + resultLink + ' "" target="_blank">' + window.location.origin + resultLink + '</a>');
            }
            window.open(resultLink);
            if (next !== undefined) next(resultLink);
        },
        error: function (xhr, data, error) {
            if (next) {
                return next(error, xhr);
            }
            console.log(error);
            bootbox.alert('Error while creating job: ' + error);
        }
    });
}

/*
Displays a message to the user
type: success|info|danger
 */
function displayMessage(text, type, keep) {
    var tempId = Math.floor((Math.random() * 1000000) + 1);
    $('#message').append($('<div>').attr('id', tempId).text(text)
        .addClass('alert alert-' + type)).show()[0].scrollIntoView();
    if (!keep) setTimeout(function() {$('#message').find('[id='+tempId+']').fadeOut()}, 3000);
}

function saveGeneList(genes, id_type) {
    if (!id_type) id_type = 'entrez';
    bootbox.prompt("Enter a name for the list! (Only letters, numbers, spaces and '_' are allowed)", function(name) {
        if (name == null) return;
        if (/[^a-zA-Z0-9 _]/g.test(name)) return displayMessage("Invalid list name! Only letters, numbers, spaces and '_' are allowed.", 'danger');
        if (name) {
            $.ajax({
                type: 'POST',
                url: '/api/save_gene_list',
                data: {
                    name: name,
                    id_type: id_type,
                    genes: genes
                },
                success: function () {
                    displayMessage("Gene list " + name + " saved!", 'success');
                },
                error: function (data) {
                    displayMessage(data.statusText, 'danger');
                }
            });
        }
    });
}

function renderDiffTable(json, target) {
    var tableData = json.genes;
    $(target).html('<table cellpadding="0" cellspacing="0" border="0" class="display diff-table" id="difftable"></table>');
    var difftable = $(target).find('.diff-table');
    var exportedColumns = [ 1, 2, 3, 4, 5 ];
    var exportedFileTitle = "DEGs_" + json.parameters.treatment;
    var table = difftable.DataTable({
        data: tableData,
        language: {
            emptyTable: "No differentially expressed genes found"
        },
        columns: [
            {
                class: 'details-control',
                orderable: false,
                data: null,
                defaultContent: '',
                width: '20px'
            },
            {data: 'probe', title: "Entrez ID", width: '70px',
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
            {data: 'fc', title: "log2(FC)", width: '50px', className: 'dt-body-right',
                render: function(data) { return parseFloat(data).toFixed(2); }
            },
            {data: 'p', title: "p-Value", width: '60px', className: 'dt-body-right', render: formatPValue}
        ],
        order: [[5, "asc"]],
        dom: 'Bfrtlip',
        buttons: [
            {extend:'copy', exportOptions: { columns: exportedColumns }, preferHtml: true},
            {extend:'csv', exportOptions: { columns: exportedColumns}, title: exportedFileTitle},
            {extend:'excel', exportOptions: { columns: exportedColumns}, title: exportedFileTitle},
            {extend:'pdf', exportOptions: { columns: exportedColumns}, title: exportedFileTitle},
            {extend:'print', exportOptions: { columns: exportedColumns }},
            {
                text:"Save as Gene List",
                action: function(e, dt) {
                    var genes = $.map(dt.column(1, {search:'applied'}).data(), function(x) {return x});
                    saveGeneList(genes);
                }
            }
        ]

    });

    var formatRow = function (d) {
        return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;" width="100%">' +
            '<div id="barplot_' + d['probe'] + '"></div>' +
            '</table>';
    };

    difftable.find('tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row(tr);

        if (row.child.isShown()) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child(formatRow(row.data())).show();
            drawNormalizedDataBarplot(json.parameters.study, json.parameters.treatment,
                row.data()['probe'], "#barplot_" + row.data()['probe'], row.data().symbol);
            tr.addClass('shown');
        }
    });
}

function renderPathwayTable(json, target) {
    var tableData = json.data;
    var param = json.parameters;
    $(target).html('<table cellpadding="0" cellspacing="0" border="0" class="display pathway-table"></table>');
    var exportedFileName = "Enriched_pathways_" + param.treatment;
    $(target).find('.pathway-table').dataTable({
        data: tableData,
        language: {
            emptyTable: "No enriched pathways found"
        },
        columns: [
            {title: "DB", data: "db", width: '40px'},
            {
                title: "Pathway", data: "pw",
                render: function (data, type, row) {
                    return '<a href="' + row.link + '" target="_blank">' + data + '</a>';
                }
            },
            {title: "p-Value", data: "p", render: formatPValue, width: '60px', className: 'dt-body-right'},
            {title: "q-Value (" + param.padjust + ")", data: "q",
                render: formatPValue, width: '60px', className: 'dt-body-right',
                visible: param.padjust != "none"
            },
            {title: "#DEGs (set)", data: "nDiff", width: '65px', sortable: false, className: 'dt-body-right',
                render: function(data, type, row) {
                    return data + " / " + row.nGenes;
                }
            },
            {title: "#DEGs (total)", data: "nDiffTotal", width: '60px', sortable: false, className: 'dt-body-right',
                render: function(data, type, row) {
                    return data + " / " + row.nGenesTotal;
                }
            },
            {title: "DEGs", data: "diffGenes", sortable: false,
                render: function(data) {
                    return $.isArray(data) ? data.sort().join(", ") : data;
                }
            }
        ],
        order: [[3, "asc"]],
        dom: 'Bfrtlip',
        buttons: [
            {extend:'copy', preferHtml: true},
            {extend: 'csv', title: exportedFileName},
            {extend: 'excel', title: exportedFileName},
            {extend: 'pdf', title: exportedFileName},
            'print'
        ]
    });
}

function getJobResult(jobId, next) {
    $.ajax({
        url: '/api/get_job_result',
        cache: true,
        data: {jobID: jobId},
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            next(null, res);
        },
        error: function (xhr) {
            next(xhr)
        }
    });
}

function drawVolcano(json, target) {
    var bg = $.map(json.bg, function (el) {
        return {x: parseFloat(el.x), y: parseFloat(el.y), name: el.name, p: el.p, symbol: el.symbol}
    });
    var diff = $.map(json.diff, function (el) {
        return {x: parseFloat(el.x), y: parseFloat(el.y), name: el.name, p: el.p, symbol: el.symbol}
    });
    var getXMax = function (obj) {
        return $.map(obj, function (el) {
            return el.x
        }).reduce(function (a, b) {
            return math.max(a, math.abs(b))
        }, 0)
    };
    var getYMax = function (obj) {
        return $.map(obj, function (el) {
            return el.y
        }).reduce(function (a, b) {
            return math.max(a, math.abs(b))
        }, 0)
    };
    var xMax = math.ceil(math.max(getXMax(bg), getXMax(diff)));
    var yMax = math.ceil(math.max(getYMax(bg), getYMax(diff)));
    var pCutoff = Number(json.parameters.pvalueCutoff);
    var fcCutoff= Number(json.parameters.ratioCutoff);
    var width = $('#content').width();//math.min(1000, $('#scatter-container').width());
    var height = $(window).height();//'.math.max(400, width / 1.4);
    var cloneToolTip = null;
    var cloneToolTip2 = null;
    var curPoint = null;
    var volcano = $(target).highcharts({
        credits: {
            enabled: false
        },
        chart: {
            width: width,
            height: height * 3 / 4,
            zoomType: 'xy'
        },
        exporting: {
            sourceWidth: 800,
            sourceHeight: 600
        },
        title: {
            text: 'Volcano Plot for ' + json.parameters.treatment
        },
        xAxis: {

            title: {
                enabled: true,
                text: 'log2(Fold Change)'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            max: xMax,
            min: -xMax
        },
        yAxis: {
            min: 0,
            max: yMax,
            title: {
                text: '-log10(p-Value)'
            }
        },
        plotOptions: {
            series: {
                point: {
                    events: {
                        click: function () {
                            if (cloneToolTip) {
                                volcano.highcharts().container.firstChild.removeChild(cloneToolTip);
                            }
                            if (cloneToolTip2) {
                                cloneToolTip2.remove();
                            }
                            if (curPoint != this.name) {
                                cloneToolTip = this.series.chart.tooltip.label.element.cloneNode(true);
                                volcano.highcharts().container.firstChild.appendChild(cloneToolTip);

                                cloneToolTip2 = $('.highcharts-tooltip').clone();
                                $(volcano.highcharts().container).append(cloneToolTip2);
                                curPoint = this.name;
                                drawNormalizedDataBarplot(json.parameters.study, json.parameters.treatment, curPoint, '#barplot', this.symbol);
                            } else {
                                curPoint = null;
                                cloneToolTip = null;
                                cloneToolTip2 = null;
                                $('#barplot').html("");
                            }
                        }
                    }
                }
            },
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '',
                    pointFormatter: function() {
                        return '<b>' + this.symbol + '</b><br>Fold change: ' + this.x.toFixed(2) +
                            '<br>p-Value: ' + formatPValue(this.p);
                    }
                }
            }
        },
        series: [{
            showInLegend: false,
            type: 'line',
            color: "#53aacc",
            data: [[math.min(-xMax, -fcCutoff), -math.log10(pCutoff)], [-fcCutoff, -math.log10(pCutoff)], [-fcCutoff, yMax]],
            marker: {
                enabled: false
            },
            states: {
                hover: {
                    lineWidth: 0
                }
            },
            enableMouseTracking: false
        }, {
            showInLegend: false,
            type: 'line',
            color: "#53aacc",
            data: [[fcCutoff, yMax], [fcCutoff, -math.log10(pCutoff)], [math.max(xMax, fcCutoff), -math.log10(pCutoff)]],
            marker: {
                enabled: false
            },
            states: {
                hover: {
                    lineWidth: 0
                }
            },
            enableMouseTracking: false
        }, {
            type: 'scatter',
            name: "Background",
            marker: {
                symbol: 'circle'
            },
            color: "#85949c",
            turboThreshold: 0,
            data: bg
        },
            {
                type: 'scatter',
                name: "Significant",
                marker: {
                    symbol: 'diamond'
                },
                color: "#9e1137",
                turboThreshold: 0,
                data: diff
            }]
    });

}

function drawScatter(res, regression, target) {
    var oData = res.data;
    var data = $.map(oData, function (el) {
        return {x: parseFloat(el.x), y: parseFloat(el.y), name: el.name, symbol: el.symbol}
    });
    var xMax = $.map(data, function (el) {
        return el.x
    }).reduce(function (a, b) {
        return Math.max(a, Math.abs(b))
    }, 0);
    var yMax = $.map(data, function (el) {
        return el.y
    }).reduce(function (a, b) {
        return Math.max(a, Math.abs(b))
    }, 0);
    var cloneToolTip = null;
    var cloneToolTip2 = null;
    var curPoint = null;
    var width = $(target).data('width') ? Number($(target).data('width')) : $('#content').width();
    var height = $(target).data('height') ? Number($(target).data('height')) : $(window).height();
    var drawRegression = res.parameters.treatments[0].value == res.parameters.treatments[1].value;
    var scatter = $(target).highcharts({
        credits: {
            enabled: false
        },
        chart: {
            width: width,
            height: height,
            zoomType: 'xy'
        },
        exporting: {
            sourceWidth: 800,
            sourceHeight: 500
        },
        title: {
            text: 'Scatter Plot for ' + res.parameters.treatments[0].treatment + ' and ' + res.parameters.treatments[1].treatment
        },
        xAxis: {

            title: {
                enabled: true,
                text: res.parameters.treatments[0].treatment
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            max: res.parameters.treatments[0].value == "P" ? xMax : res.parameters.treatments[1].value == "P" ? xMax : Math.max(xMax, yMax),
            min: res.parameters.treatments[0].value == "P" ? 0 : res.parameters.treatments[1].value == "P" ? -xMax : -Math.max(xMax, yMax)
        },
        yAxis: {
            title: {
                text: res.parameters.treatments[1].treatment
            },

            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            max: res.parameters.treatments[1].value == "P" ? yMax : res.parameters.treatments[0].value == "P" ? yMax : Math.max(xMax, yMax),
            min: res.parameters.treatments[1].value == "P" ? 0 : res.parameters.treatments[0].value == "P" ? -yMax : -Math.max(xMax, yMax)
        },
        plotOptions: {
            series: {
                point: {
                    events: {
                        click: function () {
                            if (cloneToolTip) {
                                scatter.highcharts().container.firstChild.removeChild(cloneToolTip);
                            }
                            if (cloneToolTip2) {
                                cloneToolTip2.remove();
                            }
                            if (curPoint != this.name) {
                                cloneToolTip = this.series.chart.tooltip.label.element.cloneNode(true);
                                scatter.highcharts().container.firstChild.appendChild(cloneToolTip);
                                cloneToolTip2 = $('.highcharts-tooltip').clone();
                                $(scatter.highcharts().container).append(cloneToolTip2);
                                curPoint = this.name;
                            } else {
                                curPoint = null;
                                cloneToolTip = null;
                                cloneToolTip2 = null;
                                $('#barplot').html("");
                            }
                        }
                    }
                }
            },
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '',
                    pointFormatter: function () {
                        return '<b>' + this.symbol + '</b><br>' +
                            res.parameters.treatments[0].treatment + ': ' + this.x.toFixed(2) + '<br>' +
                            res.parameters.treatments[1].treatment + ': ' + this.y.toFixed(2)
                    }
                }
            },
            line: {}
        },
        series: drawRegression ? [
            {
                type: 'scatter',
                name: "Data",
                marker: {
                    symbol: 'circle'
                },
                turboThreshold: 0,
                data: data
            }, {
                type: 'line',
                name: "Regession Line",
                marker: {
                    enabled: false
                },
                states: {
                    hover: {
                        lineWidth: 0
                    }
                },
                tooltip: {
                    headerFormat: '',
                    pointFormat: '<b>Linear Regression:</b> ' +
                    regression['coefficients'].a.toFixed(2) + '+' +
                    regression['coefficients'].b.toFixed(2) + '*x<br>' +
                    'Adjusted R-squared: ' + regression['adj.r.squared'].toFixed(4) + '<br>' +
                    'F-statistic: ' + regression['fstatistic'].value.toFixed(0) + ' on ' +
                    regression['fstatistic']['numdf'].toFixed(0) + ' and ' +
                    regression['fstatistic']['dendf'].toFixed(0) + ' DF, p-value: ' + regression["p.value"].toFixed(3)
                },
                data: [[-xMax, regression['coefficients'].a + -xMax * regression['coefficients'].b],
                    [xMax, regression['coefficients'].a + xMax * regression['coefficients'].b]]
            }] :
            [{
                type: 'scatter',
                name: "Data",
                marker: {
                    symbol: 'circle'
                },
                turboThreshold: 0,
                data: data
            }]

    });
}

function drawVenn(oData, target, clickCallback) {
    var series = $.map(oData.data, function(el) {
        if (el.data === null) el.data = [];
        return(el);
    });
    $(target).jvenn({
        series: series,
        displayStat: true,
        fnClickCallback: clickCallback
    });
}

function fillGeneSetSelection(target) {
    $(target).jstree({
        "plugins": ["wholerow", "checkbox"],
        'core': {
            'data': [
                {
                    "text": "All Gene Sets",
                    "children": [
                        {
                            "text": "Curated databases",
                            "children": [
                                {
                                    "id": "c2.cp.kegg.v5.0.symbols.gmt",
                                    "text": "KEGG",
                                    "icon": "/public/css/images/kegg24px.gif",
                                    "state": {"selected": true}
                                },
                                {
                                    "id": "c2.cp.biocarta.v5.0.symbols.gmt",
                                    "text": "BioCarta",
                                    "icon": "/public/css/images/biocarta24px.jpg"
                                },
                                {
                                    "id": "c2.cp.reactome.v5.0.symbols.gmt",
                                    "text": "Reactome",
                                    "icon": "/public/css/images/reactome24px.png"
                                }
                            ]
                        },
                        {
                            "text": "Gene Ontology",
                            "icon": "/public/css/images/go24px.png",
                            "children": [
                                {
                                    "id": "c5.bp.v5.0.symbols.gmt",
                                    "text": "Biological Process Ontology ",
                                    "icon": "/public/css/images/go24px.png"
                                },
                                {
                                    "id": "c5.cc.v5.0.symbols.gmt",
                                    "text": "Cellular Component Ontology ",
                                    "icon": "/public/css/images/go24px.png"
                                },
                                {
                                    "id": "c5.mf.v5.0.symbols.gmt",
                                    "text": "Molecular Function Ontology ",
                                    "icon": "/public/css/images/go24px.png"
                                }
                            ]
                        }

                    ]
                }
            ]
        }
    });
}

Array.prototype.unique = function() {
    var o = {}, i, l = this.length, r = [];
    for(i=0; i<l;i+=1) o[this[i]] = this[i];
    for(i in o) r.push(o[i]);
    return r;
};

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}
