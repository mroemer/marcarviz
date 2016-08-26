\name{fetch.data}
\alias{fetch.data}
\title{
Fetch data from MongoDB
}
\description{
This function retrieves data from a MongoDB
}
\usage{
fetch.data(studies, treatments, con, fc.cutoff = 0, p.cutoff = 1, ids= NULL,
  direction = "All", species = NULL, with.data = T, with.anno = T, filter.type = "or")
}
\arguments{
  \item{studies}{
  character or vector of character. Study IDs for which data should be fetched
}
  \item{treatments}{
  character or vector of character. Treatment names for which data should be fetched
}
  \item{con}{
  RMongo. MongoDB connection to the database
}
  \item{ids}{
  vector of character. List of identifiers to include
}
  \item{fc.cutoff}{
  numeric. Value used for filtering probes based on log2-fold change
}
  \item{p.cutoff}{
  numeric. Value used for filtering probes based on limma p-value
}
  \item{direction}{
  character [All|Up|Down]. Direction of regulation (i.e., sign of log2-fold change)
}
  \item{species}{
  character [R|H|M]. Species for which data should be fetched
}
  \item{with.data}{
  logical. Should data be included?
}
  \item{with.anno}{
  logical. Should annotation data be included?
}
  \item{filter.type}{
  character [and|or]. Should probes meet any threshold or all?
}
}
\details{
Set p.cutoff or fc.cutoff to \code{NULL} to ignore and not retrieve data. Species will be inferred from first study if not specified.
}
\value{
\code{list} of
  \item{id}{vector of character. Entrez IDs of genes in matrices }
  \item{fold.changes}{log2-fold changes}
  \item{p.values}{limma p-value}
  \item{anno}{Annotation (symbol, db_id, desc)}
}
\author{
Michael Roemer
}
