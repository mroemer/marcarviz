$(document).ready(function () {
    initializeTreatmentSelection($('#sltStudy'), $('#sltTreatment'), updatebtnExecute);

    $('#btnExecute').click(function () {
        var parameters = {
            study: $('#sltStudy').val(),
            treatment: $('#sltTreatment').val(),
            ratioCutoff: $('#optFCCutoff').val(),
            pvalueCutoff: $('#optPValue').val()
        };
        var defaultJobName = 'Volcano plot for ' + parameters.treatment + ' (' + parameters.study + ')';
        var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
        submitJob('volcano', parameters, jobName);
    });
});
