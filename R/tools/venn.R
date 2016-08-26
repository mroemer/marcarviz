source("R/initialize.MARCARviz.tool.R")

json <- list()
json$data <- list()

# fold change cutoff
cutoff <- as.numeric(parameters$fccutoff)
# p-value cutoff
p.cutoff <- as.numeric(parameters$pcutoff)
# fold change cutoff mode
mode <- pmatch(tolower(parameters$direction), c("all", "down", "up"))
if (is.na(mode) || mode < 1 || mode > 3)
  stop("Unsupported direction specified: ",direction, " Use one of 'All', 'Down', or 'Up'")

species <- toupper(substr(parameters$species, 1, 1))
if (!species %in% c("H","R","M")) species <- NULL

id2symbol <- c()
for (i in 1:length(parameters$treatments)) {
  treatment <- parameters$treatments[[i]]$treatment
  study <- parameters$treatments[[i]]$study
  Log(paste("Reading data for treatment ", treatment, "...", sep=""))
  # fetch fold changes from database
  data <- fetch.data(
    studies = study,
    treatments = treatment,
    con = mongo,
    fc.cutoff = cutoff,
    p.cutoff = p.cutoff,
    direction = parameters$direction,
    filter.type = "and",
    species = species)
  diff.genes <- c()
  if (!is.null(data$anno)) {
    diff.genes <- sort(data$anno$symbol)
    id2symbol <- c(id2symbol, setNames(rownames(data$anno), data$anno$symbol))
  }

  json$data[[length(json$data) + 1]] <- list(name=treatment, data=diff.genes)
}
json$parameters <- parameters
json$id2symbol <- id2symbol
write(toJSON(json), out.file)
