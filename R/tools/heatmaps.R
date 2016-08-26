source("R/initialize.MARCARviz.tool.R")

parameters$ratioCutoff <- as.numeric(parameters$ratioCutoff)
parameters$pvalueCutoff <- as.numeric(parameters$pvalueCutoff)
parameters$colCluster <- as.numeric(parameters$colCluster)

species <- NULL
gene.ids <- NULL
if (!is.null(parameters$list)) {
  gene.list <- dbGetQuery(mongo, "genelists", paste0("{id: '", parameters$list,"'}"))
  if (nrow(gene.list) < 1) {
    Log("Requested gene list not found in database!")
    quit(status = 2)
  }
  gene.ids <- as.character(sapply(fromJSON(gene.list$genes), "[[", "id"))
} else if (!is.null(parameters$ids)) {
  gene.ids <- parameters$ids
} else {
  species <- toupper(substr(parameters$species, 1, 1))
  if (!species %in% c("H","R","M")) species <- NULL
}

# remove duplicates (same treatment and study)
parameters$treatments <- parameters$treatments[!duplicated(t(sapply(parameters$treatments, function(x) return(c(x$study, x$treatment)))))]

studies <- sapply(parameters$treatments, "[[", "study")
treatments <- sapply(parameters$treatments, "[[", "treatment")
tagged.treatments <- setNames(paste(treatments, " (", studies, ")", sep=""), treatments)

names(treatments) <- tagged.treatments
if (parameters$pvalueCutoff >= 1) parameters$pvalueCutoff <- NULL

Log("Reading data...")
data <- fetch.data(studies = studies, treatments = treatments, filter.type = "or", ids = gene.ids,
                   con = mongo, fc.cutoff = parameters$ratioCutoff,
                   p.cutoff = NULL, species = species)

all.fold.changes <- data$fold.changes
if (length(unique(studies)) > 1) {
  colnames(all.fold.changes) <- paste(colnames(all.fold.changes), " (", data$studies, ")", sep="")
}

if (!is.null(parameters$pvalueCutoff)) {
  p.data <- fetch.data(studies = studies, treatments = treatments, fc.cutoff = NULL, with.anno = F,
                       con = mongo, ids = data$probes, species = species)
  all.p.values <- p.data$p.values
  if (length(unique(studies)) > 1) {
    colnames(all.p.values) <- paste(colnames(all.p.values), " (", p.data$studies, ")", sep="")
  }
}

# reorder
if (length(unique(studies)) > 1) {
  all.fold.changes <- all.fold.changes[,tagged.treatments,drop=F]
  if (!is.null(parameters$pvalueCutoff)) all.p.values <- all.p.values[,tagged.treatments,drop=F]
}

# metadata handling
colmeta.args <- ""
metadata <- get.treatment.metadata(
  studies = studies, treatments = treatments, con = mongo)
rownames(metadata) <- colnames(all.fold.changes)
if (nrow(metadata) > 0) {
  colmeta.file <- tempfile()
  write.table(t(metadata), colmeta.file, col.names=F, sep=",", na = "")
  colmeta.args <- paste("-cm", colmeta.file, "-cmh", sep=" ")
}

Log("Filtering data...")
# filter with ratio cutoff
if (!is.null(parameters$pvalueCutoff)) {
  belowPCutoff <- rownames(all.p.values)[apply(all.p.values, 1, function(row) any(row <= parameters$pvalueCutoff))]
  sign.genes <- na.omit(match(belowPCutoff, rownames(all.fold.changes)))
  all.fold.changes <- all.fold.changes[sign.genes,,drop=F]
}


# filter relevant probes
rel.probes <- tail(names(sort(apply(all.fold.changes, 1, function(x) mean(abs(x))))), 5000)
rel.idx <- na.omit(match(rel.probes, rownames(all.fold.changes)))
if (length(rel.idx) > 0) {
  data.file <- tempfile()
  all.fold.changes <- all.fold.changes[rel.idx,,drop=F]
  if (nrow(all.fold.changes) == 1) all.fold.changes <- rbind(all.fold.changes, all.fold.changes)
  write.csv(round(all.fold.changes, 2), file=data.file)
  if (ncol(all.fold.changes) > 200) {
    write(toJSON(list(error="Too many (>200) treatments selected!")), out.file)
  } else {
    Log("Clustering genes...")
    cluster.type <- ifelse(ncol(all.fold.changes) > 2 && parameters$colCluster, "both", "row")
    system(paste("python python/inchlib_clust-0.1.4/inchlib_clust.py",data.file,"-dh -o", out.file ,"-a", cluster.type, colmeta.args, sep=" "))
    test <- paste(readLines(out.file), collapse="")
    id2symbol <- setNames(data$anno[rownames(all.fold.changes),"symbol"],rownames(all.fold.changes))
    json <- parameters
    final <- paste('{"parameters":', toJSON(json), ', "data": ', test, ', "id2symbol": ', toJSON(id2symbol), '}')
    write(final, out.file)
  }
} else {
  write(toJSON(list(error="No matching probes found!")), out.file)
}
