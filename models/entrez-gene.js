/**
 * Database model for Entrez Gene identifier
 * 
 * Fields:
 * - id: Number; the identifier assigned to the gene in Entrez Gene Database
 * - symbol: String; official gene symbol
 * - db_id: String; source database for the official symbol )(i.e., HGNC, MGI, RGD)
 * - species: String; the species that the gene is found in
 * - desc: String; description or short summary of the gene
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EntrezGene = new Schema({
    id: { type: Number, index: { unique: true } },
    symbol: String,
    db_id: String,
    species: String,
    desc: String
}, { collection: 'entrez_genes' });

module.exports = mongoose.model('EntrezGene', EntrezGene);

