capitalize <- function(x) {
  return(gsub("(^)([[:alpha:]])", "\\1\\U\\2", x, perl=T))
}
