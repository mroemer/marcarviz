$(document).ready(function () {
    getJobResult(window.id, function(err, res) {
        $('#wait').hide();
        if (err) return alert('An error has occured:\n' + xhr.responseText);
        if (res.error != undefined) return console.log(res.error);
        $('#vis-title').text('Differential expression for ' + res.parameters.treatment);
        renderDiffTable(res, '#diff');
        if (res.genes && res.genes.length > 0) {
            $('#crossAnalysis').show();
            $('#btnGeneSetAnalysis').click(function() {
                var parameters = {
                    study: res.parameters.study,
                    treatment: res.parameters.treatment,
                    fccutoff: res.parameters.fccutoff,
                    pcutoff: res.parameters.pvalue,
                    direction: "All",
                    gssizemin: 1,
                    gssizemax: 500,
                    padjust: "BH",
                    genesets: [
                        "c2.cp.kegg.v5.0.symbols.gmt",
                        "c2.cp.biocarta.v5.0.symbols.gmt",
                        "c2.cp.reactome.v5.0.symbols.gmt",
                        "c5.bp.v5.0.symbols.gmt",
                        "c5.cc.v5.0.symbols.gmt",
                        "c5.mf.v5.0.symbols.gmt"
                    ]
                };
                var jobName = 'Enriched gene sets for ' + parameters.treatment + ' (' + parameters.study + ')';
                submitJob('pathway-enrichment', parameters, jobName, function(link) {
                    $('#btnGeneSetAnalysis').unbind();
                    $('#btnGeneSetAnalysis').attr('href', link).attr('target', '_blank');
                });
            });
            $('#btnVolcano').click(function() {
                var parameters = {
                    study: res.parameters.study,
                    treatment: res.parameters.treatment,
                    ratioCutoff: res.parameters.fccutoff,
                    pvalueCutoff: res.parameters.pvalue
                };
                var jobName = 'Volcano plot for ' + parameters.treatment + ' (' + parameters.study + ')';
                submitJob('volcano', parameters, jobName, function(link) {
                    $('#btnVolcano').unbind();
                    $('#btnVolcano').attr('href', link).attr('target', '_blank');
                });
            });
            $('#btnVolcano').prop('disabled', false);
        }
        $('#vis-container').show().get(0).scrollIntoView();
    })
});
