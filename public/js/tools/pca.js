/* GENE LISTS */
/* TREATMENT SELECTION */
initTreatmentSelection(
    '#treatmentSelection', 
    function (nSelected) {
        if (nSelected > 0) {
            $('#btnPCA').removeAttr("disabled");
        } else {
            $('#btnPCA').attr("disabled", "disabled");
        }
        $('#counter').html(nSelected);
    },
    function(getSelectedTreatments) {
        /* SUBMIT BUTTON */
        $('#btnPCA').click(function () {
            var parameters = {
                //ratioCutoff: $('#ratioCutoff').val(),
                //pvalueCutoff: $('#pvalueCutoff').val(),
                //colCluster: 1//$('#colCluster').val()
            };
            // selected treatments
            parameters.treatments = getSelectedTreatments();
            if (parameters.treatments.length < 1) {
                displayMessage("You must select at least one treatment!", 'danger');
                return;
            }
            // gene filtering with gene lists
            //var sltGeneList = $('#sltGeneList');
            //parameters.list = sltGeneList.val() ? sltGeneList.val() : undefined;
            //annotation options
            parameters.species = $('#sltSpecies').val();
            // submit PCA job
            var defaultJobName = 'PCA for ' + parameters.treatments.length + ' treatments';
            var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
            submitJob('pca', parameters, jobName);
        });
    }
);


