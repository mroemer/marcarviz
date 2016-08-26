$(document).ready(function () {
    getJobResult(window.id, function(err, res) {
        $('#wait').hide();
        if (err) return console.log('An error has occured:\n' + xhr.responseText);
        $('#vis-container').show();
        if (res.error != undefined) return console.log(res.error);
        drawPCA(res, '#biplot-container');
    });
});
