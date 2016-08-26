/**
 * Created by roemer on 07.01.15.
 */

$(document).ready(function () {
    getJobResult(window.id, function(err, res) {
        $('#wait').hide();
        if (err) return console.log('An error has occured:\n' + xhr.responseText);
        $('#vis-container').show();
        if (res.error != undefined) return console.log(res.error);
        drawScatter(res, res['regression'], '#scatter');
        $('#crossAnalysis').show();
        $('#btnVenn').click(function() {
            var parameters = {
                fccutoff: res.parameters.ratioCutoff,
                pcutoff: 1,
                direction: "All",
                treatments: res.parameters.treatments,
                species: res.parameters.species
            };
            var jobName = 'Venn Diagram for ' + parameters.treatments.length + ' treatments';
            submitJob('venn', parameters, jobName, function(link) {
                $('#btnVenn').unbind();
                $('#btnVenn').attr('href', link).attr('target', '_blank');
            });
        });
    });
});
