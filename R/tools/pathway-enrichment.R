source("R/initialize.MARCARviz.tool.R")

# post-process settings
parameters$fccutoff <- as.numeric(parameters$fccutoff)
parameters$pcutoff <- as.numeric(parameters$pcutoff)
parameters$gssizemin <- as.numeric(parameters$gssizemin)
parameters$gssizemax <- as.numeric(parameters$gssizemax)

# database query
Log(paste("Reading data..."))
data <- fetch.data(
  studies = parameters$study,
  treatments = parameters$treatment,
  con = mongo,
  fc.cutoff = parameters$fccutoff,
  p.cutoff = parameters$pcutoff,
  filter.type = "and",
  direction = parameters$direction,
  species = "H")
if (length(data$probes) > 0) {
  diff.symbols <- data$anno$symbol
  # identifier mapping
  all.symbols <- dbGetQueryForKeys(mongo, paste0("expr_", parameters$study), query = "{s:'H'}", keys = "{symbol:1, _id:0}", 0, 0)$symbol
  # test for enriched pathways
  Log("Calculating gene set enrichments...")
  res <- get.enrichment.table(diff.genes = diff.symbols, all.genes = all.symbols, pvalue.cutoff = 1,
                              gs.db = paste0("res/", parameters$genesets),
                              gs.size.threshold.min=parameters$gssizemin,
                              gs.size.threshold.max=parameters$gssizemax,
                              p.adjust.method=parameters$padjust, drop.empty.sets=T)
  rownames(res) <- NULL
} else {
  res <- data.frame()
}
genes <- data.frame(row.names = data$probes)
if (nrow(genes) > 0) {
  genes$fc <- data$fold.changes[,parameters$treatment]
  genes$p <- data$p.values[,parameters$treatment]
  genes <- cbind(genes, data$anno)
}
genes$probe <- rownames(genes)
rownames(genes) <- NULL
json <- list()
json$data <- apply(res, 1, as.list)
json$genes <- apply(genes, 1, as.list)
json$parameters <- parameters
write(toJSON(json), out.file)
