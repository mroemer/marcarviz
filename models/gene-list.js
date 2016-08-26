/**
 * Database model for gene lists
 * 
 * Fields:
 * - id: String; random, unique identifier
 * - owner: Account; user that created the gene list
 * - is_public: Boolean; is this gene list a public list?
 * - source: String; source database of public gene list
 * - text: String; short description for display
 * - name: String; name of the list
 * - genes: [EntrezGene]; array of all genes in the list
 * - creation: Date; time of creation
 */

var EntrezGene = require('../models/entrez-gene');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GeneList = new Schema({
    id: { type: String, index: { unique: true } },
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
    is_public: { type: Boolean, default: false},
    source: String,
    text: {type: String, index: true},
    name: String,
    genes: [{type: Schema.Types.Mixed }],
    creation: { type: Date, default: Date.now}
});

module.exports = mongoose.model('GeneList', GeneList);

