get.treatment.metadata <- function(studies, treatments, con) {
  metadata <- data.frame(row.names = tag.treatments(treatments, studies))
  force.tagging <- length(unique(studies)) > 1
  for (study in unique(studies)) {
    md.query <- RMongo::dbGetQuery(con, "treatments", paste0("{'study': '", study, "', 'name': { $in: ['", paste0(treatments[study == studies],collapse = "','") , "']}}"))
    md <- md.query$conditions
    if (!is.null(md)) {
      names(md) <- md.query$name
      # parse metadata from JSON
      md <- plyr::ldply(md, function(conditions.json) {
        conditions <- rjson::fromJSON(conditions.json)
        return(setNames(sapply(conditions, "[[", "value"), sapply(conditions, "[[", "name")))
      })
      rownames(md) <- tag.treatments(treatments[study == studies],study, force.tagging)
      md$.id <- NULL
      metadata[,colnames(md)[!colnames(md) %in% colnames(metadata)]] <- NA
      metadata[rownames(md),colnames(md)] <- md
    }
  }
  if (nrow(metadata) > 1) {
    # remove metadata keys that are the same in all treatments
    metadata <- metadata[,apply(metadata, 2, function(col) length(unique(col)) > 1), drop=F]
  }
  return(metadata)
}
