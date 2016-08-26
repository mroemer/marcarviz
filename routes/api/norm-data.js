/**
 * Route for retrieving normalized, individual sample data for a treatment group
 * 
 * Exports:
 * GET  /api/get_norm_data(study, treatment, row)
 * -- returns the normalized data for gene {row} in {treatment} of {study}
 */
var MongoClient = require('mongodb').MongoClient;

module.exports = function(app) {
    /**
     * Returns the normalized data for gene {row} in {treatment} of {study}
     * 
     * @param study String; internal ID of the study
     * @param treatment String; internal ID of the treatment
     * @param row String; gene for which normalized data is requested
     */
    app.get('/api/get_norm_data', function(req, res) {
        MongoClient.connect(global.mongoDB, function(err, db) {
            db.collection('treatments').findOne({name: req.query.treatment, study: req.query.study}, function(err, treatment) {
                if (err) return console.error(err);
                var keys = {p: 1};
                var i;
                var samples = Array.isArray(treatment.samples)?treatment.samples:[treatment.samples];
                for (i = 0; i < samples.length; i++) {
                    keys['N_' + samples[i]] = 1;
                }
                var controls = Array.isArray(treatment.controls)?treatment.controls:[treatment.controls];
                for (i = 0; i < controls.length; i++) {
                    keys['N_' + controls[i]] = 1;
                }
                var collection = 'expr_' + req.query.study;
                db.collection(collection).findOne({p: parseInt(req.query.row)}, keys, function(err, data) {
                    for (var key in keys) {
                        data[key.slice(2)] = data[key];
                        delete data[key];
                    }
                    if (err) return console.error(err);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({data: data, samples: samples, controls: controls, treatment: treatment}));
                    db.close();
                });

            });
        });
    })
};
