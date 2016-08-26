fetch.data <- function(studies, treatments, con, fc.cutoff = 0, p.cutoff = 1, ids= NULL,
                       direction = "All", species = NULL, with.data = T, with.anno = T, filter.type = "or") {
  # handle requested species
  if (is.null(species)) {
    meta <- RMongo::dbGetQuery(con, "studies", paste0("{name:'", studies[1], "'}"))
    species <- toupper(substr(meta$species, 1, 1))
  } else {
    species <- toupper(substr(species, 1, 1))
  }
  if (length(unique(studies)) == 1) {
    collection <- paste0("expr_", studies[1])
    conditions <- c()
    keys <- c()
    if (!is.null(fc.cutoff)) {
      fc.fields <- paste0("F_", treatments)
      if (direction == "Up") {
        fc.filter <- paste0("'", fc.fields,"': { $gte: ", fc.cutoff," }")
      } else if (direction == "Down") {
        fc.filter <- paste0("'", fc.fields,"': { $lte: ", -fc.cutoff," }")
      } else {
        fc.filter <- paste0("$or: [{'", fc.fields,"': { $gte: ", fc.cutoff," }}, {'", fc.fields,"': { $lte: ", -fc.cutoff," }}]")
      }
      conditions <- c(conditions, fc.filter)
      keys <- c(keys, paste0("'", fc.fields, "'"))
    }
    if (!is.null(p.cutoff)) {
      p.fields <- paste0("P_", treatments)
      p.filter <- paste0("'", p.fields,"': { $lte: ", p.cutoff," }")
      conditions <- c(conditions, p.filter)
      keys <- c(keys, paste0("'", p.fields, "'"))
    }
    if (is.null(ids)) {
      filter <- paste0("$", filter.type, ": [{", paste0(conditions, collapse = "},{"), "}]")
      query <- paste0("{s:'", species, "',", filter,"}")
    } else {
      query <- paste0("{p: { $in: [",paste0(ids, collapse = ","),"] }}")
    }
    anno.keys <- ifelse(with.anno, "symbol:1,db_id:1,desc:1,s:1,", "")
    if (!with.data) keys <- c()
    key <- paste0("{p:1,", anno.keys,paste0(paste0(keys, ":1"), collapse = ","), "}")
    data <- RMongo::dbGetQueryForKeys(con, collection, query, key, 0 , 0)
    rownames(data) <- data$p
    res <- list()
    res$probes <- setNames(as.character(data$p), NULL)
    if (!is.null(fc.cutoff) && with.data) {
      if (length(res$probes) > 0) {
        res$fold.changes <- data[,grep("^F_", colnames(data)),drop=F]
        colnames(res$fold.changes) <- unique(treatments)
      } else {
        res$fold.changes <- matrix(nrow = 0, ncol = length(treatments), dimnames = list(NULL, treatments))
      }
    }
    if (!is.null(p.cutoff) && with.data) {
      if (length(res$probes) > 0) {
        res$p.values <- data[,grep("^P_", colnames(data)),drop=F]
        colnames(res$p.values) <- treatments
      } else {
        res$p.values <- matrix(nrow = 0, ncol = length(treatments), dimnames = list(NULL, treatments))
      }
    }
    if (with.anno & nrow(data) > 0) res$anno <- data[,c("symbol", "db_id", "desc", "s")]
    res$studies <- studies
  } else {
    id.list <- list()
    for (study in unique(studies)) {
      id.list[[study]] <- fetch.data(
        studies = study,
        treatments = treatments[studies == study], con = con,
        fc.cutoff = fc.cutoff, p.cutoff = p.cutoff, direction = direction, ids = ids,
        species = species, with.data = F, with.anno = F,
        filter.type = filter.type)$probes
    }
    ids <- if (filter.type == "or") unique(unlist(id.list)) else Reduce(intersect, id.list)
    data.list <- list()
    for (study in unique(studies)) {
      data.list[[study]] <- fetch.data(
        studies = study,
        treatments = treatments[studies == study],
        fc.cutoff = fc.cutoff, con = con,
        p.cutoff = p.cutoff, direction = direction, ids = ids,
        species = species, with.data = with.data, with.anno = with.anno,
        filter.type = filter.type)
    }
    common.probes <- Reduce(intersect, lapply(data.list, "[[", "probes"))
    res <- list(probes = common.probes)
    for (study in sort(unique(studies))) {
      if (!is.null(fc.cutoff) && with.data) {
        if (is.null(res$fold.changes)) res$fold.changes <- data.list[[study]]$fold.changes[res$probes,,drop=F]
        else res$fold.changes <- cbind(res$fold.changes, data.list[[study]]$fold.changes[res$probes,,drop=F])
      }
      if (!is.null(p.cutoff) && with.data) {
        if (is.null(res$p.values)) res$p.values <- data.list[[study]]$p.values[res$probes,,drop=F]
        else res$p.values <- cbind(res$p.values, data.list[[study]]$p.values[res$probes,,drop=F])
      }
      if (with.anno & length(res$probes) > 0) {
        if (is.null(res$anno)) res$anno <- data.list[[study]]$anno[res$probes,,drop=F]
      }
      if (is.null(res$studies)) res$studies <- c()
      res$studies <- c(res$studies, rep(study, sum(studies == study)))
    }
  }
  return(res)
}
