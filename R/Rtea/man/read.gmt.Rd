\name{read.gmt}
\alias{read.gmt}
\title{
Read GMT file
}
\description{
Reads a GMT gene set definition file from MSigDB into a list of gene sets.
}
\usage{
read.gmt(gs.db, gene.labels = NULL, gs.size.threshold.min = 5,
  gs.size.threshold.max = 500, verbose = FALSE)
}
\arguments{
  \item{gs.db}{
  character. Path to the GMT file
}
  \item{gene.labels}{
  vector of character. Background list of genes used to filter genes
}
  \item{gs.size.threshold.min}{
  numeric. Minimum size of gene sets for inclusion
}
  \item{gs.size.threshold.max}{
  numeric. Maximum size of gene sets for inclusion
}
  \item{verbose}{
  logical. Print gene set statistics after reading
}
}
\details{
GMT files: The GMT file format is a tab delimited file format that describes gene sets. In the GMT format, each row represents a gene set; in the GMX format, each column represents a gene set.
}
\value{
A list of gene sets, where each gene set is one item in the list. Each item is a vector of genes (as character). The name of the list item is the gene set name. In addition, the attribute \code{link} contains additional information.
}
\references{
GMT file format: http://www.broadinstitute.org/cancer/software/gsea/wiki/index.php/Data_formats#GMT:_Gene_Matrix_Transposed_file_format_.28.2A.gmt.29
}
\author{
Michael Roemer
}
