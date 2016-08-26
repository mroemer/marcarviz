# read gene2pathway mapping from .gmt file
read.gmt <- function(gs.db, gene.labels = NULL, gs.size.threshold.min = 5, gs.size.threshold.max = 500, verbose = FALSE) {
  # read lines from gmt file
  lines <- readLines(gs.db)
  # collect gene sets
  gs <- sapply(1:length(lines), function(i) {
    # genes in gene set
    gene.set.labels <- unlist(strsplit(lines[i], "\t"))[-(1:2)]
    # genes in gene set and in gene labels
    if (!is.null(gene.labels)) gene.set.labels <- gene.set.labels[gene.set.labels %in% gene.labels]
    return(gene.set.labels)
  })
  # set gene set names
  names(gs) <- unlist(lapply(strsplit(lines,"\t"), function(x) x[1]))
  # filter by gene set sizes
  use.gene.set <-  ((sapply(gs, length) >= gs.size.threshold.min) & (sapply(gs, length) <= gs.size.threshold.max))
  # filter gene set list
  gs <- gs[use.gene.set]
  # collect gene set links
  gs.link <- sapply(1:length(lines), function(i) {
    noquote(unlist(strsplit(lines[i], "\t")))[2]
  })
  attr(gs, "link") <- gs.link[use.gene.set]
  # print gene set information
  if (verbose) {
    cat("Number of Gene Sets: ", length(gs),
    "\nOriginal number of Gene Sets: ", length(lines),
    "\nMaximum gene set size: ", max(sapply(gs, length)), "\n")
  }
  return(gs)
}
