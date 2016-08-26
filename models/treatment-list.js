/**
 * Database model of a list of treatments
 * 
 * Fields:
 * - name: String; name of the treatment list
 * - owner: String; user that created the treatment list
 * - treatments: [String]; list of treatment Mongo object IDs
 * - creation: Date; time of creation
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TreatmentList = new Schema({
    name: String,
    owner: String,
    treatments: [Schema.Types.Mixed],
    creation: { type: Date, default: Date.now}
});

module.exports = mongoose.model('TreatmentList', TreatmentList);

