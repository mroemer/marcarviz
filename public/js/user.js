/* GENE LIST RENDERING */

function renderGeneList() {
    $.ajax({
        type: 'POST',
        url: '/api/get_gene_lists',
        data: {
            onlyUser: true
        },
        success: function (json) {
            renderGeneListTable(json);
        },
        error: function (data, textStatus) {
            console.log(textStatus);
        }
    });
}

function renderGeneListTable(json) {
    $('#geneLists').html('<table cellpadding="0" cellspacing="0" border="0" class="display" id="geneListTable"></table>');
    var $geneListTable = $('#geneListTable');
    var table = $geneListTable.DataTable({
        data: json,
        language: {
            emptyTable: "No saved gene lists."
        },
        columns: [
            {
                class: 'details-control',
                className: 'dt-body-center',
                orderable: false,
                data: null,
                width: '10px',
                defaultContent: ''
            },
            {data: 'name', title: "Gene List"},
            {
                data: 'genes',
                title: "Genes",
                className: 'dt-body-right',
                width: '40px',
                render: function (data) {
                    return data.length;
                }
            },
            {
                data: 'creation',
                title: "Created on",
                className: 'dt-body-right',
                width: '100px',
                render: function (data) {
                    return $.format.date(data, 'yyyy-MM-dd')
                }
            },
            {
                data: '_id',
                title: "",
                orderable: false,
                className: 'dt-body-center',
                width: '10px',
                render: function () {
                    return '<i title="Delete list" class="fa fa-2x fa-remove icon-delete" style="color: red; cursor: pointer;">'
                }
            }
        ],
        order: [3, 'desc']
    });

    var formatRow = function (d) {
        return '<table id="genes_' + d._id + '" cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;" width="100%">' +
            '</table>';
    };

    $geneListTable.find('tbody').on('click', 'td.details-control', function () {
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
            renderGeneTable(row.data().genes, row.data()._id);
            tr.addClass('shown');
        }
    });

    $geneListTable.find('tbody').on('click', 'i.icon-delete', function () {
        var table = $('#geneListTable').DataTable();
        var row = table.row($(this).parents('tr'));
        removeGeneList(row.data(), function (err) {
            if (err) return displayMessage("Deleting gene list failed: " + err.statusText, 'danger');
            row.remove().draw();
        });
    });
}

function removeGeneList(list, callback) {
    bootbox.confirm("Do you want to delete the list " + list.name + "?", function(del) {
        if (del) {
            $.ajax({
                type: 'POST',
                url: '/api/remove_gene_list',
                data: {
                    list: list._id
                },
                success: function () {
                    displayMessage("List " + list.name + " deleted!", 'success');
                    callback(null);
                },
                error: function (data) {
                    callback(data);
                }
            });
        }
    })
}

function renderGeneTable(json, listID) {
    $('#genes_' + listID).DataTable({
        data: json,
        language: {
            emptyTable: "This gene list is empty."
        },
        columns: [
            {data: 'id', title: "Entrez ID", width: '70px',
                render: function(id) {
                    return '<a href=http://www.ncbi.nlm.nih.gov/gene/?term=' + id + ' target="_blank">' +
                        id + '</a>';
                }
            },
            {data: 'symbol', title: "Gene Symbol", width: '100px',
                render: function(symbol, meta, row) {
                    if (row.species == "M") {
                        return '<a href="http://www.informatics.jax.org/marker/' + row.db_id + '" target="_blank">' +
                            symbol + '</a>';
                    } else if (row.species == "H") {
                        return '<a href="http://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=' +
                            row.db_id + '" target="_blank">' + symbol + '</a>';
                    } else if (row.species == "R") {
                        return '<a href="http://rgd.mcw.edu/rgdweb/report/gene/main.html?id=' +
                            row.db_id + '" target="_blank">' + symbol + '</a>';
                    } else {
                        return symbol;
                    }
                }
            },
            {data: 'desc', title: "Gene summary"}
        ]
    });
}

$('#newList').keyup(function () {
    $(this).val($(this).val().replace(/[;, \t]/g, '\n'));
});

$('#btnSaveList').click( function () {
    var temp = $('#newList').val().split('\n');
    var genes = [];
    for (var g = 0; g < temp.length; g++) {
        if (temp[g] != "") {
            genes.push(temp[g]);
        }
    }
    var listName = $('#listName').val();
    if (listName.length < 1) {
        $('#listName').addClass("invalid");
        $('#listName').keyup(function() {$('#listName').removeClass("invalid");});
        alert("Please enter a name for the gene list!");
        $('#listName').focus();
        return;
    }
    var isValidName = !/[^0-9A-Za-z_ ]/g.test(listName);
    if (!isValidName) {
        $('#listName').addClass("invalid");
        $('#listName').keyup(function() {$('#listName').removeClass("invalid");});
        alert("Only letters, numbers, spaces and '_' are allowed in the list name!");
        $('#listName').focus();
        return;
    }
    if (genes.length < 1) {
        $('#newList').addClass("invalid");
        $('#newList').keyup(function() {$('#newList').removeClass("invalid");});
        alert("The gene list is empty!");
        $('#newList').focus();
        return;
    }
    if (listName.search(/[^1-9a-z _]/i) > -1) return;
    $.ajax({
        type: 'POST',
        url: '/api/save_gene_list',
        data: {
            name: listName,
            id_type: $('#sltIdentifier').find('option:selected').attr('id'),
            genes: genes
        },
        success: function (data) {
            renderGeneList();
            displayMessage(data, 'success');
        },
        error: function (data) {
            displayMessage(data.responseText, 'danger');
        }
    });
});

$(document).ready(function () {
    renderGeneList();
});
