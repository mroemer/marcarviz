source("R/initialize.MARCARviz.tool.R")

fc.cutoff <- parameters$fccutoff
parameters$fccutoff <- as.numeric(ifelse(is.null(parameters$fccutoff),0,parameters$fccutoff))
if (is.na(parameters$fccutoff)) {
  Log("Invalid value for fold change cutoff: ", fc.cutoff)
  quit("no", 1)
}
p.cutoff <- parameters$pvalue
parameters$pvalue <- as.numeric(ifelse(is.null(parameters$pvalue),1,parameters$pvalue))
if (is.na(parameters$pvalue)) {
  Log("Invalid value for fold change cutoff: ", p.cutoff)
  quit("no", 1)
}

Log("Reading data...")
data <- fetch.data(
  studies = parameters$study,
  treatments = parameters$treatment,
  con = mongo,
  fc.cutoff = parameters$fccutoff,
  p.cutoff = parameters$pvalue, filter.type = "and")

res <- data.frame(row.names = data$probes)
if (nrow(res) > 0) {
  res$fc <- data$fold.changes[,parameters$treatment]
  res$p <- data$p.values[,parameters$treatment]
  res <- cbind(res, data$anno)
}
res$probe <- rownames(res)
rownames(res) <- NULL
Log(paste("Sending data..."))
json <- list(genes = apply(res, 1, as.list),
             parameters = parameters)
write(toJSON(json), out.file)
