
$(document).ready(function () {
    getJobResult(window.id, function(err, res) {
        $('#wait').hide();
        if (err) return alert('An error has occured:\n' + xhr.responseText);
        if (res.error != undefined) return console.log(res.error);
        $('#vis-title').text('Gene set enrichment for ' + res.parameters.treatment);
        renderPathwayTable(res, '#pathways');
        renderDiffTable(res, '#diff-table');
        $('#vis-container').show();
    });
});
