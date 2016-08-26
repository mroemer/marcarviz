/**
 * Created by roemer on 07.01.15.
 */

$(document).ready(function () {
    getJobResult(window.id, function(err, res) {
        window.res = res;
        $('#wait').hide();
        if (err) return console.log('An error has occured:\n' + xhr.responseText);
        if (res.error != undefined) return console.log(res.error);
        drawVenn(res, '#venn-container', function () {
            var value = "";
            if (this.listnames.length == 1) {
                value += "Elements only in ";
            } else {
                value += "Common elements in ";
            }
            value += this.listnames.join(" ");
            value += ":\n";
            if (this.list.length > 0) value += this.list.join(", ");
            $("#names").val(value);
        });
        $('#vis-container').show();
        $('#crossAnalysis').show();
        $('#btnHeatmap').click(function() {
            var parameters = {
                treatments: res.parameters.treatments,
                ratioCutoff: res.parameters.fccutoff,
                pvalueCutoff: res.parameters.pcutoff,
                colCluster: 1,
                ids: $.map(res.id2symbol, function(el) {return el})
            };
            var jobName = 'Heatmap for ' + parameters.treatments.length + ' treatments';
            submitJob('heatmaps', parameters, jobName, function(link) {
                $('#btnHeatmap').unbind();
                $('#btnHeatmap').attr('href', link).attr('target', '_blank');
            }); 
        });
    });
});
