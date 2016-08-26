/**
 * Routes and functions for handling job submission, execution, and delivery of job results
 * 
 * Exports:
 * - GET    /job(id)
 * -- renders HTML page that shows job processing status or error message
 * -- automatically redirects to tool result page if job is finished succesfully
 * - GET    /api/get_jobs
 * -- returns a JSON array with all jobs belonging to the current user
 * - GET    /api/get_job_state(id)
 * -- returns the status of the job corresponding to the submitted {id}
 * - GET    /api/get_job_result(id)
 * -- returns the result of the job corresponding to the submitted {id} as JSON object
 * - POST   /api/submit_job(tool, parameters)
 * -- submits a new job that uses the {tool} with the {parameters}
 */
// dependencies
var fs = require('fs');
var exec = require('child_process').exec;
var uuid = require('node-uuid');
// mongoose models
var Job = require('../../models/job');
var ObjectId = require('mongoose').Types.ObjectId;

// error handling
function handleError(err, res, status, message) {
    if (err) console.error(err);
    return res.status(status).end(message);
}

/**
 * Executes an R script
 * @param tool String; name of the R script, a file R/tools/{tool}.r must exist!
 * @param jobId String; job identifier in database
 * @param next Function(String err); callback function called after script has been run 
 */
var executeScript = function(tool, jobId, next) {
    // directory for job
    var jobDirectory = 'data/jobs/' + jobId + '/';
    fs.mkdir(jobDirectory, function(err) {
        if (err) return next(err);
        // command for executing the R script
        var auth = '';
        if (global.db_user) {
            auth = ' -u ' + global.db_user + ' -p ' + global.db_pass;
        }
        var cmd = 'Rscript R/tools/' + tool + '.R' + ' ' + jobId + ' ' + global.db_host + ' ' + global.db + auth;
        // debug output
        if (global.debug) console.info(cmd);
        // execute command
        exec(cmd, next);
    });
};

module.exports = function (app) {
    /**
     * Renders HTML page that shows job processing status or error message, automatically redirects to tool result page
     * if job has finished succesfully
     * @param id String; database identifier of the job 
     */
    app.get('/job', function(req, res) {
        Job.findOne( { id: req.query.id }, function(err, job) {
            if (err || job == null) return res.render('job', {user: req.user});
            if (job.state == 0) {
                try {
                    return res.render('tools/' + job.tool + '_result', {user: req.user, id: job.id});
                } catch (e) {
                    return res.status(404).end();
                }
            } else if (job.state == -1) {
                return res.render('job', {user: req.user, id: job.id, response: "Internal server error"});
            } else if (job.state == 1) {
                return res.render('job', {user: req.user, id: job.id, response: "Job waiting for execution...", refresh: 1});
            } else {
                fs.readFile('data/jobs/' + job.id + '/log', 'utf8', function(err, data) {
                    if (err) {
                        return res.render('job', {user: req.user, id: job.id, response: "Job running...", refresh: 1});
                    }
                    var lines = data.trim().split('\n');
                    var lastLine = lines.slice(-1)[0];
                    return res.render('job', {user: req.user, id: job.id, response: lastLine, refresh: 1});
                });
            }
        });
    });

    /**
     * Submits a new job and saves it in the database
     * 
     * @param tool String; the tool for the job
     * @param parameters Object; parameters for the tool
     */
    app.post('/api/submit_job', function (req, res) {
        if (req.body.tool === undefined) {
            return handleError("In API submit_job parameter tool missing!", res, 400, "Required parameter missing: tool!");
        }
        var tool = req.body.tool;
        var owner = null;
        if (req.user) owner = req.user._id;
        var jobId = uuid.v4();
        var job = new Job({
            id: jobId,
            name: req.body.jobName,
            owner: owner,
            tool: tool,
            param: req.body.parameters,
            state: 2
        });
        job.save(function (err, job) {
            if (err) {
                console.log(err);
                return res.status(500).end();
            }
            res.setHeader('content-type', 'application/json');
            res.status(200).end(JSON.stringify({jobID: job.id}));
            executeScript(tool, jobId, function (err) {
                if (err) {
                    console.error(err);
                    job.state = -1;
                }
                else job.state = 0;
                Job.findOneAndUpdate({id: job.id}, {$set: {state: job.state}}, function (err) {
                    if (err) return console.error(err);
                });
            });
        });
    });

    /**
     * Returns the status of the job corresponding to the submitted {id}
     *
     * @param jobID String; identifier of the job
     */
    app.get('/api/get_job_state', function(req, res) {
        Job.findOne( { id: req.query.jobID }, function(err, job) {
            if (err) return res.status(500).end(err);
            if (job == null) return res.status(404).end("Job not found!");
            res.setHeader('content-type', 'application/json');
            res.status(200);
            var response;
            if (job.state == 0) {
                response = "Job finished!";
            } else if (job.state == -1) {
                response = "Error!";
            } else if (job.state == 1) {
                response = "Job waiting for execution...";
            } else {
                return fs.readFile('data/jobs/' + job.id + '/log', 'utf8', function(err, data) {
                    if (err) {
                        return res.end(JSON.stringify({state: job.state, response: "Starting job..."}))
                    }
                    var lines = data.trim().split('\n');
                    var lastLine = lines.slice(-1)[0];
                    res.end(JSON.stringify({state: job.state, response: lastLine}))
                });
            }
            res.end(JSON.stringify({state: job.state, response: response}));
        });
    });

    /**
     * Returns the result of the job corresponding to the submitted {id} as JSON object
     * 
     * @param id String; identifier of the job
     */
    app.get('/api/get_job_result', function(req, res) {
        Job.findOne( { id: req.query.jobID }, function(err, job) {
            if (err) return res.status(500).end(err.toString());
            if (job == null || job.state == 0) {
                res.setHeader('content-type', 'application/json');
                res.status(200);
                var resultFile = 'data/jobs/' + req.query.jobID + '/result.json';
                fs.exists(resultFile, function(exists) {
                    if (!exists) {
                        if (job == null) {
                            return res.status(404).end("Job not found!");
                        }
                        return res.status(404).end("Job result file not found!");
                    }
                    fs.createReadStream(resultFile).pipe(res);
                })
            } else if (job.state == -1) {
                return res.status(500).end("An error has occurred during job execution!");
            } else {
                return res.status(400).end("Job is not finished! Use get_job_status to check the job status!");
            }
        });
    });

    /**
     * Returns a JSON array with all jobs belonging to the current user
     */
    app.get('/api/get_jobs', function(req, res) {
        if (req.user) {
            Job.find( { owner: new ObjectId(req.user._id) }, 'id tool name param created state').lean().exec(function(err, list) {
                if (err) return console.error(err);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(list));
            });
        } else {
            return res.status(401).end("You must login to use this function!"); 
        }
    });
};
