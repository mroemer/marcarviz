if (interactive()) {
  options(error = recover)
} else {
  options(error = NULL)
}

require(rjson, quietly = TRUE)
require(Rtea, quietly = TRUE)
require(argparser, quietly = TRUE)
require(RMongo, quietly = TRUE)

parser <- arg_parser("Arguments required for MARCARviz tools", "MARCARviz tool")
parser <- add_argument(parser, arg = "job", help = "Job ID")
parser <- add_argument(parser, arg = "host", help = "MongoDB host")
parser <- add_argument(parser, arg = "database", help = "MongoDB database")
parser <- add_argument(parser, arg = "--username", help = "MongoDB username for authentication")
parser <- add_argument(parser, arg = "--password", help = "MongoDB password for authentication")
if (interactive()) {
  argv <- parse_args(parser, strsplit(cmd, " ")[[1]])
} else {
  argv <- parse_args(parser)
}

job.dir <- paste0("data/jobs/", argv$job, "/")
out.file <- paste0(job.dir, "result.json")
Log <- function(text) {
  cat(paste(text,"\n",sep=""), file=paste0(job.dir, "log"), append = T)
}

mongo <- mongoDbConnect(argv$database, argv$host)
if (!is.na(argv$username)) {
  authenticated <- dbAuthenticate(mongo, argv$username, argv$password)
  if (!authenticated) stop("Database authentication failed!")
}
job <- dbGetQuery(mongo, "jobs", paste0("{id: '", argv$job, "'}"))

parameters <- fromJSON(job$param)
