options(error=NULL)
require(argparser, quietly = TRUE)
require(rjson, quietly = TRUE)
require(RMongo, quietly = TRUE)

parser <- arg_parser("Import data from prepared workspace", "MARCARviz DataImport")
parser <- add_argument(parser, arg = "host", help = "MongoDB host")
parser <- add_argument(parser, arg = "database", help = "MongoDB database")
parser <- add_argument(parser, arg = "workspace", help = "Path to the workspace (or folder with multiple GMT files)")
parser <- add_argument(parser, arg = "--username", help = "MongoDB username for authentication")
parser <- add_argument(parser, arg = "--password", help = "MongoDB password for authentication")
parser <- add_argument(parser, flag = TRUE, arg = "--force", help = "Forced insertion deletes data if it is already present")
parser <- add_argument(parser, flag = TRUE, arg = "--metadata", help = "Only updates metadata without touching the expression data")
argv <- parse_args(parser)

workspaces <- argv$workspace
if (file.info(workspaces)$isdir) {
  workspaces <- list.files(workspaces, full.names = T, pattern = "\\.rda$")
}
con <- mongoDbConnect(host = argv$host, dbName = argv$database)
if (!is.null(argv$username) && !is.na(argv$username)) {
  authenticated <- dbAuthenticate(con, username = argv$username, password = argv$password)
  if (!authenticated) {
    stop("Authentication at MongoDB failed!")
  }
  auth <- paste0(' -u ', argv$username, ' -p ', argv$password, ' ')
} else {
  auth <- ""
}
out.dir <- tempdir()
for (w in workspaces) {
  cat(paste("Loading workspace ", basename(w), "...\t", sep=""))
  load(w)
  cat("Done!\n")
  
  study.query <- paste("{name: '", metadata$study$id, "'}", sep="")
  exists <- dbGetQuery(con, "studies", query = study.query)
  collection <- paste0("expr_", metadata$study$id)
  if (nrow(exists) > 0) {
    if (argv$force) {
      # remove duplicate study
      cat(paste("Dropping old study data for study", metadata$study$id, "\t"))
      removedStudy <- dbRemoveQuery(con, "studies", query=paste("{name: '", metadata$study$id, "'}", sep=""))
      if (removedStudy != "ok") stop(paste("Removing study", metadata$study$id, "failed!"))
      removedTreatments <- dbRemoveQuery(con, "treatments", query=paste("{study: '", metadata$study$id, "'}", sep=""))
      if (removedTreatments != "ok")  stop(paste("Removing treatments for study", metadata$study$id, "failed!"))
      if (!argv$metadata) {
        drop.command <- paste0('mongo ', argv$host, '/', argv$database, auth, ' --eval "printjson(db.', collection, '.drop())"')
        dropData <- system(drop.command, intern = T)
        if (!is.null(attr(dropData, "status")) || tail(dropData, 1) == "false") stop(paste("Error while dropping expression data table for study", metadata$study$id))
      }
      cat("Done!\n")
    } else {
      # abort with error
      stop(paste("Duplicate study name: ", metadata$study$id, "! Importing aborted! Use -f to replace study.", sep=""))
    }
  }
  
  # STUDY
  cat("Collecting study data...\t")
  study <- list()
  study$name <- metadata$study$id
  study$species <- setNames(c("mouse"="Mus musculus", "rat"="Rattus norvegicus", "human"="Homo sapiens")[metadata$study$species], NULL)
  study$public <- !is.null(metadata$study$public)
  study$platform <- metadata$study$platform
  study$GEO <- metadata$study$GEO
  study$shortname <- metadata$study$shortname
  study$fullname <- metadata$study$fullname
  study.required.fields <- c("id", "species", "public", "platform", "GEO", "shortname", "fullname")
  study$details <- metadata$study[setdiff(names(metadata$study), study.required.fields)]
  # remove invalid characters (.)
  names(study$details) <- sub("\\.", "_", names(study$details))
  
  cat("Done!\n")
  
  cat("Importing study...\t")
  insertStudy <- dbInsertDocument(con, "studies", toJSON(study))
  if (insertStudy != "ok") stop(paste("Inserting study", study$name, "failed!"))
  cat("Study imported!\n")
  
  # TREATMENTS
  cat("Importing treatments...\t")
  for (treat in metadata$treatments$Treatment) {
    treatment <- list()
    treatment$name <- treat
    treatment$study <- study$name
    treatment$description <- metadata$treatments$description[match(treat, metadata$treatments$Treatment)]
    cur.metadata <- metadata$treatments[match(treat, metadata$treatments$Treatment),setdiff(colnames(metadata$treatments), "description")]
    treatment$conditions <- lapply(colnames(cur.metadata[-1]), function(condition) {
      list(name = condition, value = cur.metadata[[condition]])
    })
    if (length(treatment$conditions) == 0) treatment$conditions <- NULL
    treatment$samples <- rownames(metadata$samples)[which(metadata$samples$group == treat)]
    treatment$controls <- rownames(metadata$samples)[which(metadata$samples$group %in% unique(metadata$samples[treatment$samples,]$control))]
    dbInsertDocument(con, "treatments", toJSON(treatment))
  }
  cat(paste0(nrow(metadata$treatments), " treatments imported!\n"))
  
  if (argv$metadata) next()
  entrez.genes <- dbGetQuery(con, "entrez_genes", "{}", 0, 0)
  
  diff.table <- data.frame()
  for (species in names(fold.changes)) {
    fcs <- fold.changes[[species]]
    colnames(fcs) <- paste0("F_", colnames(fcs))
    p <- p.values[[species]]
    colnames(p) <- paste0("P_", colnames(p))
    data <- cbind(fcs, p)
    if (exists("norm.data")) {
      norm <- norm.data[[species]]
      colnames(norm) <- paste0("N_", colnames(norm))
      data <- cbind(data, norm)
    }
    data <- as.data.frame(data)
    data$s <- substr(toupper(species),1,1)
    diff.table <- rbind(diff.table, data)
  }
  
  diff.table$symbol <- entrez.genes$symbol[match(rownames(diff.table), entrez.genes$id)]
  diff.table$symbol[is.na(diff.table$symbol)] <- ""
  diff.table$db_id <- entrez.genes$db_id[match(rownames(diff.table), entrez.genes$id)]
  diff.table$db_id[is.na(diff.table$db_id)] <- ""
  diff.table$desc <- entrez.genes$desc[match(rownames(diff.table), entrez.genes$id)]
  diff.table$desc[is.na(diff.table$desc)] <- ""
  diff.table$p <- rownames(diff.table)
  rownames(diff.table) <- NULL
  csv.file <- tempfile()
  cat(paste0("Writing CSV file: ", csv.file, "\t"))
  write.csv(diff.table, csv.file)
  cat("Done!\n")
  cat(paste("Importing expression data...\n", sep=""))
  
  import.command <- paste("mongoimport --host", argv$host, "--db", argv$database, auth, "--collection", collection, "--type csv --headerline --file", csv.file)
  importStatus <- system(import.command, ignore.stdout = T)
  if (importStatus != 0) stop(paste("Importing expression data failed for study", study$name))
  cat("Creating index...\t")
  index.command <- paste0('mongo ', argv$host, '/', argv$database, auth, ' --eval "printjson(db.', collection, '.ensureIndex({s:1, p:1}))"')
  indexStatus <- system(index.command, ignore.stdout = T)
  if (indexStatus != 0) stop(paste("Importing expression data failed for study", study$name))
  cat("Done!\n")
}
