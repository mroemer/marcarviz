/**
 * Created by roemer on 07.01.15.
 */

$(document).ready(function () {
    initializeTreatmentSelection($('#sltStudy'), $('#sltTreatment'), updatebtnExecuteScatter);
    initializeTreatmentSelection($('#sltStudy2'), $('#sltTreatment2'), updatebtnExecuteScatter);

    // update execute button state (enabled only if treatment is selected)
    function updatebtnExecuteScatter() {
        if ($("#sltTreatment").val() == "" || $("#sltTreatment2").val() == "") {
            $('#btnExecute').attr("disabled", "disabled")
        } else {
            $('#btnExecute').removeAttr("disabled");
        }
    }

    $('#btnExecute').click(function () {
        var treat1 = {study: $('#sltStudy').val(), treatment: $("#sltTreatment").val(), value: $('#sltValue').val()};
        var treat2 = {study: $('#sltStudy2').val(), treatment: $("#sltTreatment2").val(), value: $('#sltValue2').val()};
        var parameters = {
            treatments: [treat1, treat2],
            species: $('#sltSpecies').val(),
            ratioCutoff: $('#optFCCutoff').val()
        };
        var defaultJobName = 'Scatter plot for ' + treat1.treatment + 
            ' (' + treat1.study + ') and ' +
            treat2.treatment + 
            ' (' + treat2.study + ')';
        var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
        submitJob('scatter', parameters, jobName)
    });
});
