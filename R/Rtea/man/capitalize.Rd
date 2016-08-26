\name{capitalize}
\alias{capitalize}
\title{
Capitalize strings
}
\description{
Cpaitalizes the first character in a string without changing other characters
}
\usage{
capitalize(x)
}
\arguments{
  \item{x}{
  vector of character. Strings to be capitalized
}
}
\value{
vector of character. Strings with first letter capitalized
}
\author{
Michael Roemer
}
\examples{
##---- Should be DIRECTLY executable !! ----
##-- ==>  Define data, use random,
##--	or do  help(data=index)  for the standard data sets.
# prints "Example"
capitalize("example")
# prints "Another example"
capitalize("another example")
# prints "ThIrD exAMple"
capitalize("thIrD exAMple")
}
