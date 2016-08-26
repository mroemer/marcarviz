\name{tag.treatments}
\alias{tag.treatments}
\title{
Tag treatments with the corresponding study name
}
\description{
Tags treatments by attaching the study name to distinguish treatments from different studies that share the same ID.
}
\usage{
tag.treatments(treatments, studies, force = F)
}
\arguments{
  \item{treatments}{
  character or vector of character. Treatment names
}
  \item{studies}{
  character or vector of character. Study IDs for the treatments
}
  \item{force}{
  logical. If TRUE, study name will always be attached, if FALSE only if multiple studies are present. Default: FALSE
}
}
\value{
vector of character. Tagged treatment names
}
\author{
Michael Roemer
}
