/**
 * Database model for MARCAR studies
 * 
 * Fields:
 * - name: String; unique name of the study (i.e., internal identifier)
 * - species: String; species of animals used in study (e.g., Mus musculus)
 * - platform: String; Microarray design platform used in study
 * - GEO: String; identifier of study in GEO
 * - shortname: String; short description for display in tables
 * - fullname: String; longer name of study (e.g., GEO name)
 * - summary: String; summary of the overall study design and goals
 * - public: Boolean; is study availalble to the public?
 * - details: Mixed; object that contains arbitraty additional details
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var Study = new Schema( {
    name: { type: String, index: { unique: true } },
    species: String,
    platform: String,
    GEO: String,
    shortname: String,
    fullname: String,
    summary: String,
    public: Boolean,
    details: { type: Schema.Types.Mixed, default: {}},
    dataFileCreated: { type: [String], default: []}
} );

module.exports = mongoose.model('Study', Study);
