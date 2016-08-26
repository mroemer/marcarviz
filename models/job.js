/**
 * Database model for jobs, i.e., analysis requested by users
 * 
 * Fields:
 * - id: String; random, unique identifier
 * - owner: Account; user that created the job
 * - tool: String; name of the requested tool (e.g., "heatmap")
 * - name: String; name of the job (defined by user)
 * - param: Object; settings and parameters for job execution
 * - state; Number; current state of the job, one of:
 *   --  0: finished without error
 *   --  1: job running
 *   -- -1: job failed
 * - created: time of job creation
 */
    
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Job = new Schema( {
    id: { type: String, index: { unique: true } },
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
    tool: { type: String },
    name: { type: String },
    param: Schema.Types.Mixed,
    state: { type: Number, default: 1 },
    created: {type: Date, default: Date.now }
} );

module.exports = mongoose.model('Job', Job);
