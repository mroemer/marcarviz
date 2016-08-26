$(document).ready(function () {
    /*
    Get data and render tables for differentially expressed genes (DEGs) after...
     */
    // 1 day of treatment with phenobarbital in wild type mice
    getJobResult('PB_DEGs_WT_1d', function(err, res) {
        if (err) return console.warn('Could not load DEG table for WT_PB_1d: ' + err.responseText);
        renderDiffTable(res, '#diff-table-1d');
    });
    // 7 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_DEGs_WT_7d', function(err, res) {
        if (err) return console.warn('Could not load DEG table for WT_PB_7d: ' + err.responseText);
        renderDiffTable(res, '#diff-table-7d');
    });
    // 14 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_DEGs_WT_14d', function(err, res) {
        if (err) return console.warn('Could not load DEG table for WT_PB_14d: ' + err.responseText);
        renderDiffTable(res, '#diff-table-14d');
    });
    // 28 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_DEGs_WT_28d', function(err, res) {
        if (err) return console.warn('Could not load DEG table for WT_PB_28d: ' + err.responseText);
        renderDiffTable(res, '#diff-table-28d');
    });
    // 91 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_DEGs_WT_91d', function(err, res) {
        if (err) return console.warn('Could not load DEG table for WT_PB_91d: ' + err.responseText);
        renderDiffTable(res, '#diff-table-91d');
    });
    /*
     Get data and render tables for significantly enriched pathways after...
     */
    // 1 day of treatment with phenobarbital in wild type mice
    getJobResult('PB_Pathways_WT_1d', function(err, res) {
        if (err) return console.warn('Could not load pathway table for WT_PB_1d: ' + err.responseText);
        renderPathwayTable(res, '#enrich-table-1d');
    });
    // 7 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_Pathways_WT_7d', function(err, res) {
        if (err) return console.warn('Could not load pathway table for WT_PB_7d: ' + err.responseText);
        renderPathwayTable(res, '#enrich-table-7d');
    });
    // 14 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_Pathways_WT_14d', function(err, res) {
        if (err) return console.warn('Could not load pathway table for WT_PB_14d: ' + err.responseText);
        renderPathwayTable(res, '#enrich-table-14d');
    });
    // 28 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_Pathways_WT_28d', function(err, res) {
        if (err) return console.warn('Could not load pathway table for WT_PB_28d: ' + err.responseText);
        renderPathwayTable(res, '#enrich-table-28d');
    });
    // 91 days of treatment with phenobarbital in wild type mice
    getJobResult('PB_Pathways_WT_91d', function(err, res) {
        if (err) return console.warn('Could not load pathway table for WT_PB_91d: ' + err.responseText);
        renderPathwayTable(res, '#enrich-table-91d');
    });
    /*
     Get data and render Venn diagrams for differentially expressed genes (DEGs) after different exposure times...
     */
    var vennCallback = function () {
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
    };
    // in wild type mice (visible by default)
    getJobResult('PB_Venn_WT', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        drawVenn(res, '#venn', vennCallback);
    });
    // when user selects another tab, the corresponding Venn data is loaded and the diagram rendered
    // FIXME: this is neccessary because venn.js only supports one Venn diagram per page!
    $('#venn-tab-container').find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $("#names").val("");
        var target = $(e.target).attr('aria-controls');
        switch (target) {
            case 'venn-wt':
                // render wild type Venn
                getJobResult('PB_Venn_WT', function(err, res) {
                    if (err) return console.log('An error has occured:\n' + err.responseText);
                    drawVenn(res, '#venn', vennCallback);
                });
                break;
            case 'venn-human':
                // render humanised mice Venn
                getJobResult('PB_Venn_Human', function(err, res) {
                    if (err) return console.log('An error has occured:\n' + err.responseText);
                    drawVenn(res, '#venn', vennCallback);
                });
                break;
            case 'venn-ko':
                // render knock out Venn
                getJobResult('PB_Venn_KO', function(err, res) {
                    if (err) return console.log('An error has occured:\n' + err.responseText);
                    drawVenn(res, '#venn', vennCallback);
                });
                break;
        }
    });
    /*
     Get data and render heat map for differentially expressed genes (DEGs) after different exposure times in strains
     */
    getJobResult('PB_heat_map', function(err, res) {
        if (err) return console.log('An error has occured:\n' + err.responseText);
        var settings = {
            max_col: 3,
            min_col: -3
        };
        drawHeatmap(res, settings, 'heatmap');
    });
});
