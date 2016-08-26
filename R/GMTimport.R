options(error = NULL)
require(argparser, quietly = TRUE)
require(Rtea, quietly = TRUE)
require(uuid, quietly = TRUE)
require(RMongo, quietly = TRUE)
require(rjson, quietly = TRUE)
parser <- arg_parser("Import gene sets from MSigDB GMT file to MongoDB", "GMTimport")
parser <- add_argument(parser, arg = "gmt", help = "Path to the MSigDB GMT file (or folder with multiple GMT files)")
parser <- add_argument(parser, arg = "host", help = "MongoDB host")
parser <- add_argument(parser, arg = "database", help = "MongoDB database")
parser <- add_argument(parser, arg = "--username", help = "MongoDB username for authentication")
parser <- add_argument(parser, arg = "--password", help = "MongoDB password for authentication")
argv <- parse_args(parser)
if (file.info(argv$gmt)$isdir) {
  gmts <- list.files(argv$gmt, pattern = "\\.gmt$", full.names = T)
} else {
  gmts <- argv$gmt
}
con <- mongoDbConnect(host = argv$host, db = argv$database)
if (!is.na(argv$username)) {
  authenticated <- dbAuthenticate(con, username = argv$username, password = argv$password)
  if (!authenticated) {
    stop("Authentication at MongoDB failed!")
  }
}
entrez.genes <- dbGetQuery(con, "entrez_genes", query = "{species: 'H'}", 0, 0)
for (gmt in gmts) {
  sets <- read.gmt(gmt, gs.size.threshold.min = 0, gs.size.threshold.max = Inf, verbose = T)
  if (substr(basename(gmt), start = 1, 2) != "c5") {
    source <- sub("_.*", "", names(sets)[1])
  } else {
    source <- paste0("GO_", toupper(substr(basename(gmt), start = 4, 5)))
  }
  dbRemoveQuery(con, "genelists", paste0("{source:'",source,"'}"))
  for (i in 1:length(sets)) {
    gene.list <- list()
    gene.list$id <- UUIDgenerate()
    gene.list$is_public <- TRUE
    gene.list$source <- source
    gene.list$name <- gsub("_", " ", capitalize(tolower(sub(paste0(gene.list$source, "_"), "", names(sets)[i]))))
    gene.list$text <- paste0(gene.list$source, ": ", gene.list$name)
    gene.list$genes <- entrez.genes[match(sets[[i]], entrez.genes$symbol),grep("X_id", colnames(entrez.genes), invert = T)]
    gene.list$genes <- setNames(apply(gene.list$genes, 1, as.list), NULL)
    dbInsertDocument(con, "genelists", toJSON(gene.list))
  }
}
