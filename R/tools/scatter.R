source("R/initialize.MARCARviz.tool.R")

parameters$ratioCutoff <- as.numeric(parameters$ratioCutoff)
species <- toupper(substr(parameters$species, 1, 1))
if (!species %in% c("H","R","M")) species <- NULL

Log(paste("Reading data..."))

studies <- sapply(parameters$treatments, "[[", "study")
treatments <- sapply(parameters$treatments, "[[", "treatment")
tagged.treatments <- tag.treatments(treatments, studies)

data <- fetch.data(
  studies = studies,
  treatments = treatments,
  con = mongo,
  fc.cutoff = parameters$ratioCutoff,
  p.cutoff = NULL,
  species = species)

colnames(data$fold.changes) <- tag.treatments(colnames(data$fold.changes), data$studies)

x <- setNames(data$fold.changes[,tagged.treatments[1]], rownames(data$fold.changes))
y <- setNames(data$fold.changes[,tagged.treatments[2]], rownames(data$fold.changes))
# Regression
reg <- lm(x~y)
sum <- summary(reg)
json <- list()
json$regression <- list(
  coefficients = setNames(reg$coefficients, c("a","b")),
  p.value = sum$coefficients[2,"Pr(>|t|)"],
  r.squared = sum$r.squared,
  adj.r.squared = sum$adj.r.squared,
  df = sum$df,
  fstatistic = sum$fstatistic)
data <- data.frame(t(cbind(x, y, name=names(x), symbol=data$anno$symbol)))
json$data <- data
json$parameters <- parameters
write(toJSON(json), out.file)
