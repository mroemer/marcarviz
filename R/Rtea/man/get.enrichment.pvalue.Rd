\name{get.enrichment.pvalue}
\alias{get.enrichment.pvalue}
\title{
Calculate gene set enrichment with hypergeometric test
}
\description{
This function uses a hypergeometric test to perform gene set enrichment analysis. Each gene set is tested for enrichment separately.
}
\usage{
get.enrichment.pvalue(diff.genes, all.genes, gs)
}
\arguments{
  \item{diff.genes}{
  vector of character. The list of differentially regulated genes
}
  \item{all.genes}{
  vector of character. The background list of genes
}
  \item{gs}{
  list of gene sets. Each gene set is a vector of character of genes in the gene set
}
}
\details{
This uses a hypergeometric test to calculate the p-value for the gene set enrichment. The hypergeometric test is performed with \code{\link{phyper}}: phyper(n-m,N-M,M,n), where n is the number of differentially regulated genes, m is the number of differential genes present in gene set, N is the number of all genes and M is the size of the gene set
}
\value{
named vector of numeric. Each entry is the p-value of one gene set identified by the names of the vector.
}
\author{
Michael Roemer
}
\seealso{
\code{\link{phyper}}
}
