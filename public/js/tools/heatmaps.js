/* GENE LISTS */
// render a select for gene list
$('#sltGeneList').select2({
    placeholder: "No gene list selected",
    allowClear: true,
    ajax: {
        type: 'POST',
        url: '/api/get_gene_lists',
        quietMillis: 100,
        data: function (params) {
            return {
                q: params.term,
                withoutGenes: true
            };
        },
        processResults: function (lists) {
            var results = [];
            var sortByText = function (a, b) {
                var nameA = a.text.toLowerCase(), nameB = b.text.toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            };
            var customLists = lists.filter(function(list) {
                return !list.is_public;
            }).sort(sortByText);
            if (customLists.length > 0) {
                results.push({
                    text: "Custom gene lists",
                    children: customLists
                });
            }
            var publicLists = lists.filter(function(list) {
                return list.is_public; 
            }).sort(sortByText);
            if (publicLists.length > 0) {
                results.push({
                    text: "Public gene sets",
                    children: publicLists
                })
            }
            return {results: results};
        },
        error: function (xhr, data, error) {
            console.log(error);
        }
    },
    width: '100%'
});

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
        /* SUBMIT BUTTON */
        $('#btnHeatmap').click(function () {
            var parameters = {
                ratioCutoff: $('#ratioCutoff').val(),
                pvalueCutoff: $('#pvalueCutoff').val(),
                colCluster: 1//$('#colCluster').val()
            };
            // selected treatments
            parameters.treatments = getSelectedTreatments();
            if (parameters.treatments.length < 1) {
                displayMessage("You must select at least one treatment!", 'danger');
                return;
            }
            // gene filtering with gene lists
            var sltGeneList = $('#sltGeneList');
            parameters.list = sltGeneList.val() ? sltGeneList.val() : undefined;
            //annotation options
            parameters.species = $('#sltSpecies').val();
            // submit heatmap job
            var defaultJobName = 'Heat map for ' + parameters.treatments.length + ' treatments';
            var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
            submitJob('heatmaps', parameters, jobName);
        });
    }
);


