# calculate pathway enrichment table
get.enrichment.table <- function(
  diff.genes, all.genes, gs.db, gs.size.threshold.min=1,
  gs.size.threshold.max=500, pvalue.cutoff=0.05,
  p.adjust.method="BH", drop.empty.sets=TRUE)
{
  # read gene2pathway mapping from gmt file
  gs <- list()
  for (gmt in gs.db) {
    cur.gs <- read.gmt(gmt, all.genes, gs.size.threshold.min, gs.size.threshold.max)
    if (substr(basename(gmt), 1, 2) == "c5") names(cur.gs) <- paste0("GO_", names(cur.gs))
    new.attr <- c(attr(gs, "link"), attr(cur.gs, "link"))
    gs <- c(gs, cur.gs)
    attr(gs, "link") <- new.attr
  }
  # compute over-representation p-values
  if (drop.empty.sets) {
    # select gene sets with at least one matching gene
    rel.idx <- sapply(gs, function(x) sum(diff.genes %in% x)) > 0
  } else {
    rel.idx <- seq_along(gs)
  }
  links <- attr(gs, "link")
  gs <- gs[rel.idx]
  attr(gs, "link") <- links[rel.idx]
  # calculate enrichment p-values
  p.values <- get.enrichment.pvalue(diff.genes, all.genes, gs)
  database <- sub("_.*", "", names(gs))
  pathway <- sapply(names(gs), function(pw.name) {
    pw.name <- capitalize(tolower(paste0(strsplit(pw.name, "_")[[1]][-1], collapse = " ")))
  })
  pe <- data.frame(row.names = names(gs))
  pe$db <- database
  pe$pw <- pathway
  pe$p <- p.values
  pe$q <- p.adjust(p.values, method = p.adjust.method)
  pe$nDiff <- sapply(gs, function(set) length(intersect(set, diff.genes)))
  pe$nGenes <- sapply(gs, function(set) length(intersect(set, all.genes)))
  pe$nDiffTotal <- rep(length(diff.genes), nrow(pe))
  pe$nGenesTotal <- rep(length(all.genes), nrow(pe))
  pe$diffGenes <- lapply(gs, function(set) sort(intersect(set, diff.genes)))
  pe$link <- attr(gs, "link")
  pe <- pe[pe$q <= pvalue.cutoff,]
  return(pe)
}
