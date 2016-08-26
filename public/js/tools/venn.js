/**
 * Created by roemer on 07.01.15.
 */

var numTreatments = 1;

$(document).ready(function () {
    var sltStudy = $('#sltStudy1');

    // update execute button state (enabled only if treatment is selected)
    function updatebtnExecuteVenn() {
        var disabled = false;
        for (var i = 0; i < numTreatments; i++) {
            disabled = disabled || ($('#sltTreatment' + (i + 1)).val() == "");
        }
        if (disabled) {
            $('#btnExecute').attr("disabled", "disabled");
        } else {
            $('#btnExecute').removeAttr("disabled");
        }
    }
    

    initializeTreatmentSelection($('#sltStudy1'), $('#sltTreatment1'), updatebtnExecuteVenn);

    $('#btnExecute').click(function () {
        var parameters = {
            fccutoff: $('#optFCCutoff').val(),
            pcutoff: $('#optPValue').val(),
            direction: $('#optFCDirection').val()
        };
        parameters.treatments = [];
        for (var i = 0; i < numTreatments; i++) {
            parameters.treatments.push({
                study: $('#sltStudy' + (i + 1)).val(),
                treatment: $('#sltTreatment' + (i + 1)).val()
            });
        }
        parameters.species = $('#sltSpecies').val();
        var defaultJobName = 'Venn Diagram for ' + parameters.treatments.length + ' treatments';
        var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
        submitJob('venn', parameters, jobName);
    });

    $('#btnAddTreat').click(function () {
        if (numTreatments >= 6) return;
        numTreatments++;
        var curNumber = numTreatments;
        if (curNumber >= 6) $('#btnAddTreat').attr("disabled", "disabled");
        var containerId = 'treat' + curNumber;
        var studyId = 'sltStudy' + curNumber;
        var treatId = 'sltTreatment' + curNumber;
        var iconId = 'iRemove' + curNumber;
        var newTreatDiv = $('<div>').attr('id', containerId)
            .append('<h4>Condition ' + curNumber + ' <i id="' + iconId + '" class="fa fa-remove icon-remove" style="color: red; cursor: pointer;"></i></h4>');
        var studyDiv = $('<div>').addClass('form-group')
            .append($('<label>').html("Study").attr('for', studyId))
            .append(($('<select>')).addClass('form-control').attr('id', studyId));
        var treatDiv = $('<div>').addClass('form-group')
            .append($('<label>').html("Condition").attr('for', treatId))
            .append(($('<select>')).addClass('form-control').attr('id', treatId));
        newTreatDiv.append(studyDiv).append(treatDiv);
        $('#treatmentSelection').append(newTreatDiv);
        $('#' + containerId).find('.icon-remove').click(function () {
            removeTreatmentDiv($(this));
        });
        initializeTreatmentSelection($('#' + studyId), $('#' + treatId), updatebtnExecuteVenn);
        updatebtnExecuteVenn();
    });

    function removeTreatmentDiv(target) {
        var n = parseInt(target.attr("id").replace("iRemove", ""));
        $('#treat' + n).remove();
        for (var i = 1; i <= numTreatments; i++) {
            if (i > n) {
                var curNumber = i - 1;
                $('#treat' + i).attr("id", 'treat' + curNumber);
                var newContainer = $('#treat' + curNumber);
                var iconId = 'iRemove' + curNumber;
                newContainer.find('h4').html('<h4>Condition ' + curNumber +
                ' <i id="' + iconId + '" class="fa fa-remove icon-remove" style="color: red; cursor: pointer;"></i></h4>');
                newContainer.find('.icon-remove').click(function () {
                    removeTreatmentDiv($(this));
                });
                $('#sltStudy' + i).attr("id", 'sltStudy' + curNumber);
                $('#sltTreatment' + i).attr("id", 'sltTreatment' + (curNumber));
            }
        }
        numTreatments--;
        if (numTreatments < 6) $('#btnAddTreat').removeAttr("disabled");
        updatebtnExecuteVenn();
    }
});
