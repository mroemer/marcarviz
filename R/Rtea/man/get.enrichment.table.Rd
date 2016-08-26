\name{get.enrichment.table}
\alias{get.enrichment.table}
\title{
Create pathway enrichment table
}
\description{
Creates a table that describes a pathway enrichment, with p-values, q-values, and additional information
}
\usage{
get.enrichment.table(diff.genes, all.genes, gs.db, gs.size.threshold.min = 1,
  gs.size.threshold.max = 500, pvalue.cutoff = 0.05, p.adjust.method = "BH",
  drop.empty.sets = TRUE)
}
\arguments{
  \item{diff.genes}{
  vector of character. The list of differentially regulated genes
}
  \item{all.genes}{
  vector of character. The background list of genes
}
  \item{gs.db}{
  character or vector of character. The paths to the .gmt-files that define the gene sets for enrichment
}
  \item{gs.size.threshold.min}{
  numeric. Minimum size of gene sets for inclusion in analysis
}
  \item{gs.size.threshold.max}{
  numeric. Maximum size of gene sets for inclusion in analysis
}
  \item{pvalue.cutoff}{
  numeric. Cutoff for returned enriched gene sets, only gene sets with corrected p-value below this threshold are in the result table
}
  \item{p.adjust.method}{
  character. Method for p-value adjustment (see \code{\link{p.adjust}} for options)
}
  \item{drop.empty.sets}{
  logical. Should empty gene sets be dropped before analysis? This improves the power of the enrichment analyis. default: TRUE
}
}
\details{
Pathway enrichment is performed by a hypergeometric test (defined in \code{\link{get.enrichment.pvalue}}) for each gene set individually. Gene sets should be in GMT format as specified by MSigDB.
}
\value{
A data.frame with the following columns:
\item{db}{character. The source database of the pathway, e.g., KEGG}
\item{pw}{character. The name of the pathway, e.g., Tyrosine metabolism}
\item{p}{numeric. The enrichment p-value}
\item{q}{numeric. The enrichment p-value corrected for multiple testing}
\item{nDiff}{numeric. The number of differentially regulated genes in the gene set}
\item{nGenes}{numeric. The size of the gene set}
\item{nDiffTotal}{numeric. The total number of differentially regulated genes}
\item{nGenesTotal}{numeric. The total number of genes}
\item{link}{character. A link with additional information about the gene set}
}
\references{
MSigDB: http://software.broadinstitute.org/gsea/msigdb/index.jsp
}
\author{
Michael Roemer
}
\seealso{
\code{\link{get.enrichment.pvalue}}
}
