source("R/initialize.MARCARviz.tool.R")

parameters$ratioCutoff <- as.numeric(parameters$ratioCutoff)
parameters$pValCutoff <- as.numeric(parameters$pValCutoff)
parameters$colCluster <- as.numeric(parameters$colCluster)

parameters$gssizemin <- 1
parameters$gssizemax <- 500
parameters$padjust <- "BH"

studies <- sapply(parameters$treatments, "[[", "study")
treatments <- sapply(parameters$treatments, "[[", "treatment")
names(treatments) <- treatments

Log("Calculating enrichments...")
p.values <- list()
for (i in 1:length(treatments)) {
  study <- studies[i]
  treatment <- treatments[i]
  data <- fetch.data(studies = study, treatments = treatment,
                     con = mongo, filter.type = "and",
                     fc.cutoff = parameters$ratioCutoff, p.cutoff = parameters$pValCutoff,
                     with.data = F, with.anno = T, species = "H")
  diff.genes <- c()
  if (!is.null(data$anno)) diff.genes <- data$anno$symbol
  all.genes <- dbGetQueryForKeys(mongo, paste0("expr_", study), query = "{s:'H'}", keys = "{symbol:1, _id:0}", 0, 0)$symbol
  res <- get.enrichment.table(diff.genes = diff.genes, all.genes = all.genes, pvalue.cutoff = 1,
                              gs.db = paste0("res/", parameters$genesets),
                              gs.size.threshold.min=parameters$gssizemin,
                              gs.size.threshold.max=parameters$gssizemax,
                              p.adjust.method=parameters$padjust, drop.empty.sets=T)
  p.values[[i]] <- setNames(res$p, paste(res$db, res$pw, sep=":"))
}
pws <- unique(unlist(lapply(p.values, names)))
res <- matrix(1, nrow = length(pws), ncol = length(treatments), dimnames = list(pws, treatments))
for (i in 1:length(p.values)) {
  if (length(p.values[[i]]) > 0) {
    res[names(p.values[[i]]),i] <- p.values[[i]]
  }
}

# tag treatments with study name
if (length(unique(studies)) > 1) {
  treatments <- setNames(paste(treatments, " (", studies, ")", sep=""), treatments)
  colnames(res) <- treatments
}
res <- -log(res, 10)

# metadata handling
colmeta.args <- ""
metadata <- get.treatment.metadata(
  studies = studies, treatments = sapply(parameters$treatments, "[[", "treatment"), con = mongo)
rownames(metadata) <- treatments
if (nrow(metadata) > 0) {
  colmeta.file <- tempfile()
  write.table(t(metadata), colmeta.file, col.names=F, sep=",", na = "")
  colmeta.args <- paste("-cm", colmeta.file, "-cmh", sep=" ")
}

if (nrow(res) > 0) {
  Log(paste("Clustering data..."))
  data.file <- tempfile()
  write.csv(res, file=data.file)
  if (ncol(res) > 200) {
    write(toJSON(list(error="Too many (>200) treatments selected!")), out.file)
  } else {
    Log("Clustering genes...")
    cluster.type <- ifelse(ncol(res) > 2 && parameters$colCluster, "both", "row")
    system(paste0("python python/inchlib_clust-0.1.4/inchlib_clust.py ",data.file, " -dh -o ", out.file ," -a ", cluster.type, " ", colmeta.args))
    test <- paste(readLines(out.file), collapse="")
    json <- parameters
    final <- paste('{"parameters":', toJSON(json), ', "data": ', test, '}')
    write(final, out.file)
  }
} else {
  write(toJSON(list(error="No pathways found!")), out.file)
}
