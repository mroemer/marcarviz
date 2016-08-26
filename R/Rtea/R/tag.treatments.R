tag.treatments <- function(treatments, studies, force = F) {
  if (force || length(unique(studies)) > 1) {
    treatments <- paste0(treatments, " (", studies, ")")
  }
  return(treatments)
}
