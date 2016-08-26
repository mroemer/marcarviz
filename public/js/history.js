/**
 * Created by roemer on 13.07.15.
 */

var TOOLID2DISPLAYNAME = {
    "diff-expr": "Differential expression",
    "heatmaps": "Heat map",
    "pathway-enrichment": "Gene set enrichment",
    "scatter": "Scatter plot",
    "venn": "Venn diagram",
    "volcano": "Volcano plot",
    "pathway-heatmaps": "Gene set heat map"
};

var doRefresh = false;
function activateRefresh() {
    if (!doRefresh) {
        setTimeout(function () {
            location.reload();
        }, 10000);
        doRefresh = true;
    }
}

$(document).ready(function () {
    $.ajax({
        type: 'GET',
        url: '/api/get_jobs',
        success: function (json) {
            fillHistory(json);
        },
        error: function (data, textStatus, err) {
            console.error(err);
        }
    });

    function fillHistory(json) {
        var $history = $('#history');
        var table = $history.DataTable({
            "data": json,
            "oLanguage": {
                "sEmptyTable": "No analysis found."
            },
            "rowCallback": function ( row, data ) {
                $('td', row).css('color', '#000');
                $('td', row).css('border-top-color', '#888');
                if ( data.state == "0" ){ $('td', row).css('background-color', 'rgb(175, 241, 175)');}
                else if ( data.state == "-1" ){ $('td', row).css('background-color', 'rgb(249, 199, 197)');}
                else { $('td', row).css('background-color', 'rgb(255, 255, 204)');}
            },
            "columns": [
                {
                    "data": "state",
                    "width": '5px',
                    "orderable": false,
                    "render": function (data) {
                        switch (data) {
                            case 0:
                                return '<i class="fa fa-check"></i>';
                            case -1:
                                return '<i class="fa fa-bug"></i>';
                            default:
                                activateRefresh();
                                return '<i class="fa fa-spinner fa-spin"></i>';
                        }
                    }
                },
                {
                    "data": "tool", 
                    "title": "Tool",
                    "width": '80px',
                    "render": function (data) {
                        var displayName = TOOLID2DISPLAYNAME[data];
                        return displayName ? displayName : data;
                    }
                },
                {
                    "title": "Name",
                    "render": function (data, type, row) {
                        var jobName = row.name;
                        return jobName ? jobName : "";
                    }
                },
                {
                    "data": "id",
                    "width": '60px',
                    "orderable": false,
                    "render": function (data) {
                        return '<a href="/job?id=' + data + '" target="_blank"><i class="fa fa-eye" style="color: black"> Result</i></a> ';
                    }
                },
                {
                    "class": 'details-show',
                    "width": '60px',
                    "orderable": false,
                    "render": function () {
                        return '<i id="icon" class="fa fa-plus-circle" style="cursor: pointer"> Details</i>';
                    }
                },
                {
                    "data": "created",
                    "width": '150px',
                    "title": "Created on",
                    "render": function (data) {
                        return $.format.date(data, "yyyy-MM-dd HH:mm:ss")
                    }
                }
            ],
            "order": [5, "desc"]
        });

        var formatRow = function (d) {
            return '<table id="job_' + d.id + '" cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;" width="100%">' +
                '</table>';
        };

        function renderParameterTable(parameters, id) {
            var data = [];
            $.each(parameters, function (name, value) {
                var parameter = {
                    name: name,
                    value: value
                };
                data.push({parameter: parameter});
            });
            $('#job_' + id).DataTable({
                "data": data,
                "paging":   false,
                "ordering": false,
                "searching": false,
                "info":     false,
                "oLanguage": {
                    "sEmptyTable": "This job has no parameters."
                },
                "columns": [
                    {
                        "data": "parameter", 
                        "title": "Paramter",
                        render: function(data) {
                            return data.name;
                        }
                    },
                    {
                        "data": "parameter", 
                        "title": "Value",
                        render: function(data) {
                            if (data.value.constructor === Array) {
                                return JSON.stringify(data.value);
                            } else {
                                return data.value;
                            }
                        }
                    }
                ]
            });
        }

        $history.find('tbody').on('click', 'td.details-show', function () {
            var tr = $(this).closest('tr');
            var row = table.row(tr);

            if (row.child.isShown()) {
                tr.find('#icon').removeClass("fa-minus-circle");
                tr.find('#icon').addClass("fa-plus-circle");
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
            } else {
                tr.find('#icon').removeClass("fa-plus-circle");
                tr.find('#icon').addClass("fa-minus-circle");
                doRefresh = false;
                // Open this row
                row.child(formatRow(row.data())).show();
                renderParameterTable(row.data().param, row.data().id);
                tr.addClass('shown');
            }
        });
    }
});
