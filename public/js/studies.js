var PLATFORMID2DISPLAYNAME = {
    "affy_mouse430_2": "Affymetrix Mouse Genome 430 2.0",
    "affy_rae230a": "Affymetrix Rat Expression Array 230A",
    "affy_mouse430a_2": "Affymetrix Mouse Expression 430A",
    "affy_rat230_2": "Affymetrix Rat Genome 230 2.0",
    "ensembl_transcript_id": "Affymetrix HT HG-U133+ PM",
    "efg_agilent_sureprint_g3_ge_8x60k": "Agilent Rat Gene Expression 8x60K G4853A",
    "affy_ragene_2_1_st_v1": "Affymetrix Rat Gene ST 2.0"
};

$(document).ready(function () {
    $.ajax({
        type: 'POST',
        url: '/api/get_studies',
        success: function (json) {
            console.log(json);
            fillStudyTable(json);
        },
        error: function (data, textStatus) {
            console.log(textStatus);
        }
    });

    function fillStudyTable(json) {
        var $studyTable = $('#study-table');
        var table = $studyTable.DataTable({
            data: json,
            paging: false,
            language: {
                emptyTable: "No studies found."
            },
            columns: [
                {
                    data: "shortname",
                    title: "Study",
                    render: function (data) {
                        return data ? data : "";
                    }
                },
                {data: "species", title: "Species"},
                {
                    data: "platform",
                    title: "Platform",
                    render: function (data) {
                        var displayName = PLATFORMID2DISPLAYNAME[data];
                        return displayName ? displayName : data;
                    }
                },
                {
                    data: "name",
                    title: "Details",
                    sortable: false,
                    class: "dt-center",
                    render: function (data) {
                        return '<a href="/study?id=' + data + '" target="_blank">Link</a>';
                    }
                },
                {
                    data: "name",
                    title: "Download",
                    sortable: false,
                    class: "dt-center",
                    render: function (data) {
                        return '<a title="Download normalized data" href="/api/get_study_data?type=N&study=' + data + '">N</a> ' +
                            '<a title="Download fold changes" href="/api/get_study_data?type=F&study=' + data + '">F</a> ' +
                            '<a title="Download p-values" href="/api/get_study_data?type=P&study=' + data + '">P</a>';
                    }
                },
                {
                    data: "GEO",
                    title: "GEO",
                    render: function (data) {
                        return data ?
                        '<a href="http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + data + '" target="_blank">' + data + '</a>' :
                            "";
                    },
                    width: '80px'
                }
            ],
            "order": [5, "desc"]
        });
    }
});
