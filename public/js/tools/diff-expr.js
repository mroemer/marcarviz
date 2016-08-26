$(document).ready(function () {
    initializeTreatmentSelection($('#sltStudy'), $('#sltTreatment'), updatebtnExecute);

    $('#btnExecute').click(function () {
        // check that FC cutoff is valid
        var fcCutoff = parseFloat($('#optFCCutoff').val());
        if (isNaN(fcCutoff)) {
            $('#optFCCutoff').addClass('invalid');
            $('#optFCCutoff').change(function() {
                $('#optFCCutoff').removeClass('invalid');
                $('#optFCCutoff').unbind();
            });
            alert("Invalid value entered for log2(Fold Change) Threshold!");
            $('#optFCCutoff').focus();
            return;
        } else {
            $('#optFCCutoff').val(fcCutoff);
        }
        // check that p-value cutoff is valid
        var pCutoff = parseFloat($('#optPValue').val());
        if (isNaN(pCutoff)) {
            $('#optPValue').addClass('invalid');
            $('#optPValue').change(function() {
                $('#optPValue').removeClass('invalid');
                $('#optPValue').unbind();
            });
            alert("Invalid value entered for p-Value Threshold!");
            $('#optPValue').focus();
            return;
        } else {
            $('#optPValue').val(pCutoff);
        }
        var parameters = {
            study: $('#sltStudy').val(),
            treatment: $('#sltTreatment').val(),
            fccutoff: fcCutoff,
            pvalue: pCutoff
        };
        var defaultJobName = 'DEGs for ' + parameters.treatment + ' (' + parameters.study +
            (parameters.fccutoff > 0 ? ', |log2(FC)|>=' + parameters.fccutoff : '') +
            (parameters.pvalue < 1 ? ', p<=' + parameters.pvalue : '') +
            ')';
        var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
        submitJob('diff-expr', parameters, jobName);
    });
});
