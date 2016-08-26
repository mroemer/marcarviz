/**
 * Routes for querying data or lists from the database
 * 
 * Exports:
 * POST /api/get_studies
 * -- returns all studies in the database in JSON format
 * GET  /api/get_treatments(study)
 * -- returns (all|{study}) treatments in the database in JSON format
 * POST /api/save_gene_list(name, genes, id_type)
 * -- saves a list of genes in the database
 * GET  /api/get_gene_lists(q, onlyUser, withoutGenes)
 * -- returns all gene lists (public or owned)
 * POST /api/remove_gene_list(list)
 * -- removes a gene list from the database
 * POST /api/save_treatment_list(name, treatments)
 * -- saves a list of treatments in the database
 * GET  /api/get_treatment_lists(q)
 * -- returns all owned treatment lists
 * GET  /api/get_study_data(study)
 * -- returns study data as CSV
 */
var GeneList = require('../models/gene-list');
var EntrezGene = require('../models/entrez-gene');
var TreatmentList = require('../models/treatment-list');
var Study = require('../models/study');
var Treatment = require('../models/treatment');
var ObjectId = require('mongoose').Types.ObjectId;
var uuid = require('node-uuid');
var exec = require('child_process').exec;
var fs = require('fs');

// error handling
function handleError(err, res, status, message) {
    if (err) console.error(err);
    return res.status(status).end(message);
}

module.exports = function (api) {
    /**
     * Returns all studies in the database in JSON format
     */
    api.post('/api/get_studies', function(req, res) {
        Study.find().lean().exec( function(err, docs) {
            if (err) {
                console.error(err);
                return res.status(500).end("Could not get studies from database");
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(docs));
        });
    });

    /**
     * Returns treatments in the database in JSON format
     * 
     * @param study String; study for which treatments should be returned, if null all treatments are returned
     */
    api.get('/api/get_treatments', function(req, res) {
        var query = req.query.study ? { study: req.query.study } : { };
        Treatment.find( query ).lean().exec(function (err, treatments) {
            if (err) {
                console.error(err);
                return res.status(500).end("Could not get treatments from database");
            }
            res.setHeader('content-type', 'application/json');
            res.status(200)
                .end(JSON.stringify(treatments));
        } );
    });

    /**
     * Saves a list of genes in the database
     * 
     * @param name String; name of the saved gene list
     * @param genes [String]; genes in the list
     * @param id_type String; ID type of the specified genes, one of entrez, hgnc, mgi, or rgd 
     */
    api.post('/api/save_gene_list', function(req, res) {
        if (req.user) {
            var ids = req.body.genes;
            if (ids == undefined || ids.length == 0) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Gene list is empty!");
                return;
            }
            var query = {};
            var pattern = ids.map(function(id) {
                return new RegExp('^' + id + '$', 'i');
            });
            switch(req.body.id_type) {
                case 'entrez':
                    ids = ids.map(Number).filter(function(n) {return !isNaN(n)});
                    query = { id: { $in: ids } };
                    break;
                case 'hgnc':
                    query = {species: "H", symbol: { $in: pattern } };
                    break;
                case 'mgi':
                    query = {species: "M", symbol: { $in: pattern } };
                    break;
                case 'rgd':
                    query = {species: "R", symbol: { $in: pattern } };
                    break;
                default:
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("Unknown ID type selected: " + req.body.id_type + "!");
                    return;
            }
            EntrezGene.find( query ).lean().exec(function(err, genes)  {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("Error when getting database IDs!" + err.toString());
                    return;
                }
                if (genes == null || genes.length == 0) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("No matching IDs were found in database!");
                    return;
                }
                var list = new GeneList( {
                    id: uuid.v4(),
                    owner: req.user,
                    name: req.body.name,
                    text: req.body.name,
                    genes: genes
                } );
                list.save(function(err) {
                    if (err) return console.error(err);
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end("List saved!");
                });
            });
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end("You must login to save gene lists!");
        }
    });

    /**
     * Returns all gene lists (public or owned)
     * 
     * @param q String; filter for matching gene lists names
     * @param onlyUser Boolean; if true, public lists are not returned
     * @param withoutGenes Boolean; if true, genes are not included in result
     */
    api.post('/api/get_gene_lists', function(req, res) {
        var pattern = '';
        if (req.body.q) {
            pattern = req.body.q;
            pattern = pattern.split(/[^a-zA-Z0-9]+/g);
            pattern = pattern.map(
                function(str) {
                    if (str.length > 0) {
                        return '(?=.*' + str.toLowerCase() + '.*)';
                    } else {
                        return null;
                    }
                });
            pattern = pattern.join('');
        }
        pattern += '.*';
        var ownerQuery;
        if (req.body.onlyUser) {
            ownerQuery = {owner: req.user};
        } else if (req.user) {
            ownerQuery = { $or: [ {owner: req.user}, {is_public: true} ] };
        } else {
            ownerQuery = {is_public: true};
        }
        var keys;
        if (req.body.withoutGenes) {
            keys = {genes: 0};
        } else {
            keys = {};
        }
        GeneList.find( { $and: [ {text: new RegExp(pattern, 'i')}, ownerQuery]}, keys).lean().exec( function(err, list) {
            if (err) return console.error(err);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(list));
        });
    });

    /**
     * Removes a gene list from the database
     * 
     * @param list String; database identifier of the gene list
     */
    api.post('/api/remove_gene_list', function(req, res) {
        if (req.user) {
            // find list in database
            GeneList.findOne( { _id: new ObjectId(req.body.list), owner: new ObjectId(req.user._id) }, function(err, list) {
                if (err) return console.error(err);
                list.remove(function(err) {
                    if(err) return console.error(err);
                    res.status(200).end("List deleted!");
                });
            });
        } else {
            res.status(401).end();
        }
    });

    /**
     * Saves a list of treatments in the database
     * 
     * @param name String; name of the treatment list
     * @param treatments [String]; database IDs of the treatments
     */
    api.post('/api/save_treatment_list', function(req, res) {
        if (req.user) {
            if (!req.body.treatments || req.body.treatments.length < 1) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Treatment list is empty!");
                return;
            }
            var list = new TreatmentList( {
                owner: req.user.username,
                name: req.body.name,
                treatments: req.body.treatments
            } );
            list.save(function(err, list) {
                if (err) return console.error(err);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(list));
            });
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end("You must login to save treatment lists!");
        }
    });

    /**
     * Returns all owned treatment lists
     * 
     * @param q String; text filter for returned treatment list names
     */
    api.post('/api/get_treatment_lists', function(req, res) {
        if (req.user) {
            var pattern = '.';
            if (req.body.q) pattern = req.body.q;
            TreatmentList.find( {name: new RegExp(pattern, 'i'), owner: req.user.username }).lean().exec( function(err, list) {
                if (err) return console.error(err);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(list));
            });
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
        }
    });

    /**
     * Returns study data as CSV
     * 
     * @param study String; internal ID of the study
     */
    api.get('/api/get_study_data', function(req, res) {
        if (req.query.study === undefined) 
            return handleError(null, res, 400, 'Missing required query parameters: study');
        var type = req.query.type ? req.query.type : "F";
        var typeDescription = {
            F: "foldChanges",
            P: "pValues",
            N: "normData"
        };
        if (Object.keys(typeDescription).indexOf(type) < 0) {
            return handleError(null, res, 400, 'Unsupported type requested: ' + type + "\nSupported types: " +
            "F: fold changes\nP: p-values\nN: normalized intensities");
        }
        
        function exportCsvFile(fields, path, filename, next) {
            var auth = '';
            if (global.db_user) {
                auth = ' -u ' + global.db_user + ' -p ' + global.db_pass;
            }
            var cmd = 'mongoexport --type csv --fields ' + fields + ' -h ' + global.db_host + ' -d ' + global.db + ' -c  expr_' + req.query.study + auth + ' --out ' + path;
            exec(cmd, function (err) {
                // callback
                if (err) return next(err);
                res.setHeader('content-type', 'text/csv');
                res.setHeader('content-disposition', 'attachment; filename=' + filename);
                res.status(200);
                return next();
            });
        }

        function writeStudyDataFile(dataFilePath, filename, study, type, next) {
            Treatment.find({study: req.query.study}, {name: 1, _id: 0}).lean().exec(function (err, treatments) {
                if (err) return handleError(err, res, 500, 'Error when exporting data!');
                var fields = ['p', 'symbol'].concat(treatments.map(function (treatment) {
                        return type + '_' + treatment.name;
                    })).join(',');
                exportCsvFile(fields, dataFilePath, filename, function (err) {
                    if (err) return handleError(err, res, 500, 'Error when exporting data!');
                    var dataFileCreatedNew = study.dataFileCreated ?  study.dataFileCreated.concat(type) : [type];
                    Study.update({name: study.name}, {dataFileCreated: dataFileCreatedNew}, function() {
                        next();
                    });
                });
            })
        }

        
        Study.findOne({name: req.query.study}).lean().exec(function(err, study) {
            if (err) return handleError(err, res, 500, 'Error when exporting data!');
            if (study === null) return handleError(err, res, 404, 'Study not found!');
            var filename = study.name + '_' + typeDescription[type] + '.csv';
            var dataFilePath = global.appRoot + '/data/files/' + filename;
            
            function sendFile() {
                return fs.createReadStream(dataFilePath).pipe(res);
            }
            
            if (study.dataFileCreated && study.dataFileCreated.indexOf(type) > -1) {
                fs.exists(dataFilePath, function(exists) {
                    if (exists) {
                        res.setHeader('content-type', 'text/csv');
                        res.setHeader('content-disposition', 'attachment; filename=' + filename);
                        res.status(200);
                        return sendFile();
                    } else {
                        writeStudyDataFile(dataFilePath, filename, study, type, sendFile);
                    } 
                });
            } else {
                writeStudyDataFile(dataFilePath, filename, study, type, sendFile);
            }
        });
    });
};
