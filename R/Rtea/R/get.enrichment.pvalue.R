# compute gene set over-representation p-values
get.enrichment.pvalue <- function(diff.genes, all.genes, gs) {
  # compute p-value for each gene set
  p.values <- sapply(gs, function(gene.set) {
    # number of all genes
    N <- length(all.genes)
    # number of genes present in gene set
    M <- sum(!is.na(match(gene.set, all.genes)))
    # number of differential genes
    n <- length(diff.genes)
    # number of differential genes present in gene set
    m <- sum(!is.na(match(gene.set, diff.genes)))
    # compute the probability P(X >= m) for a hypergeometric distribution
    phyper(n-m,N-M,M,n)
  })
  return(p.values)
}
