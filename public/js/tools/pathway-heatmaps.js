/* GENE SET SELECTION */
fillGeneSetSelection('#geneSets');

/* TREATMENT SELECTION */
initTreatmentSelection(
    '#treatmentSelection',
    function (nSelected) {
        if (nSelected > 0) {
            $('#btnHeatmap').removeAttr("disabled");
        } else {
            $('#btnHeatmap').attr("disabled", "disabled");
        }
        $('#counter').html(nSelected);
    },
    function(getSelectedTreatments) {
        $('#btnHeatmap').click(function () {
            var parameters = {
                ratioCutoff: $('#ratioCutoff').val(),
                pValCutoff: $('#pValCutoff').val(),
                colCluster: 1//$('#colCluster').val()
            };
        
            var genesets = $.grep($('#geneSets').jstree(true).get_selected(), function (str) {
                return str.endsWith(".gmt")
            });
            if (genesets.length < 1) {
                $('#geneSets').addClass('invalid');
                $('#geneSets').on('changed.jstree', function() {
                    $('#geneSets').removeClass('invalid');
                });
                return displayMessage("You must select at least one gene set database!", 'danger');
            }
            parameters.genesets = genesets;

            parameters.treatments = getSelectedTreatments();
            if (parameters.treatments.length < 1) {
                displayMessage("You must select at least one treatment!", 'danger');
                return;
            }
            
            var defaultJobName = 'Gene set heat map for ' + parameters.treatments.length + ' treatments';
            var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
            submitJob('pathway-heatmaps', parameters, jobName);
        });
    }
);
