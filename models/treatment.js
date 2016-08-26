/**
 * Database model for treatments, i.e., a group of samples sharing the same variable conditions
 * 
 * Fields:
 * - name: String; internal identifier of the treatment
 * - conditions: [Condition]; list of conditions for this treatment
 * -- Condition model fields:
 * --- name: String; descriptive name of the condition (e.g., Compound)
 * --- value: String; value of the condition (e.g., Phenobarbital)
 * - study: String; internal identifier of the study in which the treatment was generated
 * - samples: [String]; internal identifiers of the individual samples belonging to this treatment
 * - control: [String]; internal identifiers of the individual control samples belonging to this treatment
 * 
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Condition = new Schema({
    name: String,
    value: Schema.Types.Mixed
});

var Treatment = new Schema({
    name: String,
    description: String,
    conditions: [Condition],
    study: String,
    samples: [String],
    controls: [String]
});

module.exports = mongoose.model('Treatment', Treatment);
