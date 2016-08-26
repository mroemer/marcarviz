/**
 * * Initialises the treatment selection in the target div
 * @param target String. The container for the treatment selection
 * @param changeCallback Function(int). Called when the selection is changed, argument is number of selected treatments
 * @param next Function(function). Called when treatment selection is initialised, argument is function to get selected treatments 
 */
function initTreatmentSelection(target, changeCallback, next) {
    var selectedIds = [];
    $(target).html(
        '<div class="row">' +
            '<div class="col-md-4">' +
                '<button id="btnTreatSelection" class="btn btn-default" disabled style="width: 95%; white-space: normal;">' +
                    '<h4>Select treatments</h4>' +
                    '<div class="help-block">Click here to select treatments or change the current selection</div>' +
                '</button>' +
            '</div>' +
            '<div class="col-md-4">' +
                '<button id="btnLoadTreatments" class="btn btn-default" disabled style="width: 95%; white-space: normal;">' +
                    '<h4>Load selection</h4>' +
                    '<div class="help-block">Click here to load a saved selection of treatments</div>' +
                '</button>' +
            '</div>' +
            '<div class="col-md-4">' +
                '<button id="btnSaveTreatments" class="btn btn-default" disabled style="width: 95%; white-space: normal;">' +
                    '<h4>Save selection</h4>' +
                    '<div class="help-block">Click here to save the current selection</div>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<h4><span id="counter">0</span><span> treatments selected</span></h4>'
    );
    $.ajax({
        type: 'GET',
        url: '/api/get_treatments',
        success: function (treatments) {
            // find all metadata attribute (e.g., "Class", "Time [d]", ...) 
            var metaColsMap = {};
            for (var t = 0; t < treatments.length; t++) {
                if (treatments[t].conditions) {
                    var conditions = treatments[t].conditions;
                    treatments[t].conditionMap = {};
                    for (var c = 0; c < conditions.length; c++) {
                        metaColsMap[[conditions[c].name]] = 1;
                        treatments[t].conditionMap[[conditions[c].name]] = conditions[c].value;
                    }
                }
            }
            var metaCols = Object.keys(metaColsMap).sort();
            // define columns for DataTable
            var columns = [];
            // default columns: study and treatment names
            columns.push({
                defaultContent: '',
                title: "Selected",
                name: 'selected',
                visible: false,
                width: '10px'
            });
            columns.push({data: "study", title: "Study"});
            columns.push({data: "name", title: "Treatment"});
            // add one (hidden) column for each metadata attribute
            for (var m = 0; m < metaCols.length; m++) {
                columns.push({
                    title: metaCols[m],
                    name: metaCols[m],
                    visible: false,
                    render: (function() {
                        var metaColumn = metaCols[m];
                        return function(data, type, row) {
                            var text = row.conditionMap[[metaColumn]];
                            return text ? text : "n/a";
                        }
                    })()
                });
            }

            /**
             * Initialises a select box for metadata column selection
             * @param target Target select
             * @param table The table for which metadata columns are selected
             */
            function initMetaColumnFilter(target, table) {
                // initialise select for metadata column hiding/showing
                $.map(metaCols, function(col) {
                    $(target).append($('<option>').val(col).html(col).data('content', col)).selectpicker('refresh');
                });
                // when the selection is changed, update the table to show selected metadata columns
                $(target).change(function() {
                    var columns = $(target).val();
                    for (var c = 0; c < metaCols.length; c++) {
                        var showColumn = columns !== null && columns.indexOf(metaCols[c]) >= 0;
                        table.columns(metaCols[c] + ':name').visible(showColumn);
                    }
                });
                // show default metdata columns
                var defaultSelectedColumns = ['Array', 'Species', 'Strain'];
                $(target).val(defaultSelectedColumns).selectpicker('refresh').change();
            }
            
            /**
             * Renders a DataTables for selection of treatments
             * @param container Target table ID
             * @param selected Selected treatments
             */
            function renderTreatments(container, selected) {
                // initialise DataTable
                var table = container.DataTable({
                    data: treatments,
                    language: {
                        emptyTable: "No treatments available."
                    },
                    columns: columns,
                    order: [[1, "asc"]],
                    createdRow: function(row, data, index) {
                        if (selected.indexOf(data._id) >= 0) {
                            $(row).addClass('selected');
                            this.api().cell(index,0).data('<i class="fa fa-check"></i>');
                        } else {
                            this.api().cell(index,0).data('');
                        }
                    }
                });
                table.columns('selected:name').visible(true);
                // enable selection of treatments by clicking on rows
                container.find('tbody').on( 'click', 'tr', function () {
                    var cell = table.cell(table.row($(this)), 0);
                    if ($(this).hasClass('selected')) {
                        selected.splice(selected.indexOf(table.row($(this)).data()._id), 1);
                        $(this).removeClass('selected');
                        cell.data('').draw(false);
                    } else {
                        selected.push(table.row($(this)).data()._id);
                        $(this).addClass('selected');
                        cell.data('<i class="fa fa-check"></i>').draw(false);
                    }
                    $('#treatCounter').html(selected.length);
                } );
                initMetaColumnFilter('#sltMetaCols', table);
                // button for selecting all treatments that match the current filter
                $('#btnAddAll').click(function () {
                    // get rows that match current filter
                    var rows = table.$('tr', {filter: 'applied'});
                    // select all treatments (only if not already selected)
                    var cell;
                    for (var r = 0; r < rows.length; r++) {
                        var data = table.row(rows[r]).data();
                        if (selected.indexOf(data._id) == -1) {
                            selected.push(data._id);
                            cell = table.cell(table.row(rows[r]), 0);
                            cell.data('<i class="fa fa-check"></i>');
                        }
                    }
                    // add visible markup to DataTable
                    rows.addClass('selected');
                    $('#treatCounter').html(selected.length);
                    table.draw(false);
                });
                // button for resetting the selection
                $('#btnRemoveAll').click(function () {
                    // remove all treatments from selection
                    selected.length = 0;
                    // remove markup to DataTable
                    table.$('tr').removeClass('selected');
                    var rows = table.$('tr');
                    var cell;
                    for (var r = 0; r < rows.length; r++) {
                        cell = table.cell(table.row(rows[r]), 0);
                        cell.data('');
                    }
                    $('#treatCounter').html(selected.length);
                });
                // filtering by study
                $('#sltStudy').change(function () {
                    $.fn.dataTable.ext.search.pop();
                    $.fn.dataTable.ext.search.push(
                        function(settings, data, dataIndex) {
                            return $('#sltStudy').val() == null || 
                                $('#sltStudy').val().indexOf(table.row(dataIndex).data()[['study']]) > -1;
                        }
                    );
                    table.draw();
                });
                populateStudySelection($('#sltStudy'));
            }

            $('#btnTreatSelection').click(function() {
                var tempSelectedIds = selectedIds.slice();
                bootbox.dialog({
                    title: '<h3>Select treatments for heat map (' + '<span id="treatCounter">' + tempSelectedIds.length + '</span>' +
                    ' selected)</h3>',
                    message:
                    '<strong>Filters:</strong>' +
                    '<div class="row">' +
                        '<div class="col-md-3">' +
                            '<h5>Filter by study:</h5>' +
                            '<select id="sltStudy" multiple class="form-control" data-selected-text-format="count"></select>' +
                            '<div class="help-block">Select studies to filter treatments</div>' +
                        '</div>' +
                        '<div class="col-md-3">' +
                            '<h5>Metadata columns</h5>' +
                            '<select id="sltMetaCols" multiple class="form-control" data-selected-text-format="count > 3"></select>' +
                            '<div class="help-block">Select the metadata columns that are shown in the treatment table</div>' +
                        '</div>' +
                    '</div>' +
                    '<h4>Available treatments:</h4>' +
                    '<p><strong>Click on a row of the table to select a condition for the heat map. Click again to deselect the condition.</strong></p>' +
                    '<p>' +
                        '<button id="btnAddAll" class="btn btn-default">Select all treatments</button>' +
                        '<button id="btnRemoveAll" class="btn btn-default">Reset selection</button>' +
                    '</p>' +
                    '<table id="tblTreatments" cellpadding="0" cellspacing="0" border="0" class="display pathway-table"></table>',
                    className: 'large-table',
                    buttons: {
                        success: {
                            label: "Confirm selection",
                            className: 'btn-success',
                            callback: function () {
                                selectedIds = tempSelectedIds.slice();
                                $('#btnSaveTreatments').prop('disabled', selectedIds.length < 1);
                                if (changeCallback) changeCallback(selectedIds.length);
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: 'btn-danger',
                            callback: function () {
                            }
                        }
                    }
                }).init(function() {
                    renderTreatments($('#tblTreatments'), tempSelectedIds);
                })
            });

            function initializeTreatmentListLoading($target, selected) {
                var treatmentLists;
                var $sltTreatmentList = $target.select2({
                    placeholder: "Select a list to load it",
                    allowClear: true,
                    ajax: {
                        type: 'POST',
                        url: '/api/get_treatment_lists',
                        quietMillis: 100,
                        data: function (params) {
                            return {
                                q: params.term
                            };
                        },
                        processResults: function (data) {
                            treatmentLists = data;
                            return {
                                results: $.map(data, function (el) {
                                    return {text: el.name, id: el.name}
                                })
                            };
                        }
                    },
                    width: '100%'
                });

                // initialise DataTable
                var table = $('#tblLoadedTreatments').DataTable({
                    data: treatments,
                    language: {
                        zeroRecords: "No treatment selection loaded.",
                        // do not show total number of treatments
                        infoFiltered: ""
                    },
                    columns: columns,
                    order: [[0, "asc"]]
                });
                initMetaColumnFilter('#sltMetaCols', table);
                $.fn.dataTable.ext.search.pop();
                $.fn.dataTable.ext.search.push(
                    function(settings, data, dataIndex) {
                        return selected.indexOf(table.row(dataIndex).data()._id) > -1;
                    }
                );
                table.draw();
                
                $sltTreatmentList.change(function () {
                    var treatmentList = treatmentLists[$.map(treatmentLists, function (el) {
                        return el.name
                    }).indexOf($sltTreatmentList.val())];
                    selected.length = 0;
                    for (var t = 0; t < treatmentList.treatments.length; t++) {
                        selected.push(treatmentList.treatments[t]);
                    }
                    table.draw();
                });
            }

            $('#btnLoadTreatments').click(function() {
                var tempSelectedIds = [];
                bootbox.dialog({
                    title: '<h3>Load a previously saved selection</h3>',
                    message:
                    '<h4>Saved treatment lists</h4>' +
                    '<select id="sltTreatmentList" class="form-control"></select>' +
                    '<div class="help-block">Select the list you want to load</div>' +
                    '<h5>Metadata columns</h5>' +
                    '<select id="sltMetaCols" multiple class="form-control"></select>' +
                    '<div class="help-block">Select the metadata columns that are shown in the treatment table</div>' +
                    '<h4>Treatments in list:</h4>' +
                    '<table id="tblLoadedTreatments" cellpadding="0" cellspacing="0" border="0" class="display pathway-table"></table>',
                    className: 'large-table',
                    buttons: {
                        success: {
                            label: "Confirm selection",
                            className: 'btn-success',
                            callback: function () {
                                selectedIds = tempSelectedIds.slice();
                                $('#btnSaveTreatments').prop('disabled', selectedIds.length < 1);
                                if (changeCallback) changeCallback(selectedIds.length);
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: 'btn-danger',
                            callback: function () {
                            }
                        }
                    }
                }).init(function() {
                    initializeTreatmentListLoading($('#sltTreatmentList'), tempSelectedIds);
                })
            });
            // button for saving the selected treatments
            $('#btnSaveTreatments').click(function() {
                if (selectedIds.length > 0) {
                    var name = bootbox.prompt("Enter a name for the list!", function(name) {
                        if (name == null) return;
                        if (name.length < 1) {
                            bootbox.alert('<strong><i style="vertical-align: middle;" class="fa fa-exclamation-circle fa-2x text-danger"></i> Error: You must enter a name for the selection!</strong>');
                            return;
                        }
                        $.ajax({
                            type: 'POST',
                            url: '/api/save_treatment_list',
                            data: {
                                name: name,
                                treatments: selectedIds
                            },
                            success: function (data) {
                                displayMessage('Treatments saved in list ' + data.name + '!', 'success')
                            },
                            error: function (data) {
                                console.error(data.responseText, 'danger');
                                displayMessage(data.responseText, 'danger');
                            }
                        });
                    });
                }
            });
            $('#btnTreatSelection').removeAttr("disabled");
            $('#btnLoadTreatments').removeAttr("disabled");
            if (next) next(function() {
                var selectedTreatments = [];
                for (var t = 0; t < treatments.length; t++) {
                    if (selectedIds.indexOf(treatments[t]._id) >= 0) {
                        selectedTreatments.push({
                            study: treatments[t].study,
                            treatment: treatments[t].name
                        })
                    }
                }
                return selectedTreatments;
            });
        },
        error: function (xhr, textStatus) {
            console.error("Could not load treatments: " + textStatus);
            if (next)  {
                next(xhr);
            } else {
                displayMessage("Could not load treatments: " + textStatus, 'danger');
            }
        }
    });
}
