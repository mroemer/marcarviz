$(document).ready(function () {
    $('.integer').keypress(acceptIntegerInputs);
    $('.float').keypress(acceptNumberInputs);
    $('.setting').change(function () {
        $(this).removeClass('invalid')
    });

    initializeTreatmentSelection($('#sltStudy'), $('#sltTreatment'), updatebtnExecute);


    fillGeneSetSelection('#optGeneSets');
    var $optGeneSets = $('#optGeneSets');
    
    $optGeneSets.on('changed.jstree', function() {
        $optGeneSets.removeClass('invalid');
    });

    $('#btnExecute').click(function () {
        function isValidNumber(setting) {
            var value = parseFloat($(setting).val());
            if (isNaN(value)) {
                $(setting).addClass('invalid');
                alert("Invalid value entered for " + $('label[for='+$(setting).attr('id')+']').text());
                $(setting).show().focus();
            }
        }
        $.map($('.setting.float'), isValidNumber);
        $.map($('.setting.integer'), isValidNumber);
        
        var genesets = $.grep($optGeneSets.jstree(true).get_selected(), function (str) {
            return str.endsWith(".gmt")
        });
        if (genesets.length < 1) {
            $optGeneSets.addClass('invalid');
        }

        var valid = $('.setting.invalid').length < 1;
        if (!valid) {
            $('#frmOptions').show().get(0).scrollIntoView();
            return;
        }
        
        // Parse settings from form
        var parameters = {
            study: $('#sltStudy').val(),
            treatment: $('#sltTreatment').val()
        };
        $.map($('.setting'), function(setting) {
            var $setting = $(setting);
            var value = sanitizeString($setting.val());
            if ($setting.hasClass('float')) value = parseFloat(value);
            if ($setting.hasClass('integer')) value = parseInt(value);
            parameters[$setting.attr('name')] = value; 
        });
        parameters.genesets = genesets;
        var defaultJobName = 'Enriched gene sets for ' + parameters.treatment + ' (' + parameters.study + ')';
        var jobName = prompt("(Optional:) Enter a short description for this analysis:", defaultJobName);
        submitJob('pathway-enrichment', parameters, jobName);
    });
});
