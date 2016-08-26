source("R/initialize.MARCARviz.tool.R")

parameters$ratioCutoff <- as.numeric(parameters$ratioCutoff)
parameters$pvalueCutoff <- as.numeric(parameters$pvalueCutoff)

# database query
Log(paste("Reading data..."))
data <- fetch.data(
  studies = parameters$study,
  treatments = parameters$treatment,
  con = mongo,
  fc.cutoff = 0,
  p.cutoff = 1,
  filter.type = "and")
x <- setNames(data$fold.changes[,parameters$treatment], data$probes)
y <- setNames(data$p.values[,parameters$treatment], data$probes)

all.probes <- names(x)
if (length(y) > 0) {
  Log(paste("Matching values..."))
  diff.probes <- names(x[abs(x) > parameters$ratioCutoff & y < parameters$pvalueCutoff])
  rel.probes <- setdiff(names(head(sort(abs(x)*-log10(y), decreasing = T), 2000)), diff.probes)
  json <- list()
  json$bg <- data.frame(t(cbind(x=x[rel.probes], y=-log10(y[rel.probes]), p=y[rel.probes], name=rel.probes, symbol = data$anno[rel.probes,"symbol"])))
  json$diff <- data.frame(t(cbind(x=x[diff.probes], y=-log10(y[diff.probes]), p=y[diff.probes], name=diff.probes, symbol = data$anno[diff.probes,"symbol"])))
  #json$all <- data.frame(t(cbind(x=x, p=y)), check.names = F)
  json$parameters <- parameters

  res <- data.frame(row.names = diff.probes)
  if (nrow(res) > 0) {
    res$fc <- data$fold.changes[diff.probes,parameters$treatment]
    res$p <- data$p.values[diff.probes,parameters$treatment]
    res <- cbind(res, data$anno[diff.probes,])
  }
  res$probe <- rownames(res)
  rownames(res) <- NULL
  json$genes <- apply(res, 1, as.list)

  write(toJSON(json), out.file)
} else {
  json <- list()
  json$parameters <- parameters
  json$all <- data.frame(t(cbind(x=round(x,2))))
  json$error <- "No p-Values available for this treatment!"
  write(toJSON(json), out.file)
}
