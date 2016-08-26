\name{get.treatment.metadata}
\alias{get.treatment.metadata}
\title{
Fetch treatment metadata from MongoDB
}
\description{
This function retrieves metadata for a number of treatments from the database
}
\usage{
get.treatment.metadata(studies, treatments, con)
}
\arguments{
  \item{studies}{
  character or vector of character. Study IDs for which metadata should be fetched
}
  \item{treatments}{
  character or vector of character. Treatment names for which metadata should be fetched
}
  \item{con}{
  RMongo. MongoDB connection to the database
}
}
\details{
NOTE: This function automatically filters metadata values that are uniform across all selected treatments!
}
\value{
A dataframe where each column is a metadata entry
}
\author{
Michael Roemer
}
