source("R/initialize.MARCARviz.tool.R")

studies <- sapply(parameters$treatments, "[[", "study")
treatments <- sapply(parameters$treatments, "[[", "treatment")

species <- toupper(substr(parameters$species, 1, 1))
if (!species %in% c("H","R","M")) species <- NULL

Log("Reading data...")
data <- fetch.data(studies = studies, treatments = treatments,
                   con = mongo, species = species)
colnames(data$fold.changes) <- tag.treatments(colnames(data$fold.changes), data$studies)
data$fold.changes <- data$fold.changes[,tag.treatments(treatments, studies)]

pca <- prcomp(t(data$fold.changes), center = T)

points <- data.frame(row.names = rownames(pca$x))
points$name <- rownames(pca$x)
points <- cbind(points, pca$x[,1:3])

metadata <- get.treatment.metadata(studies, treatments, mongo)
metadata$Condition <- rownames(metadata)

# top 100 loaded genes for up to first three PCs
rel.genes <- unique(unlist(lapply(1:3, function(n) {
  head(names(sort(abs(pca$rotation[,n]), decreasing = T)),100)
})))
loading <- data.frame(row.names = rel.genes)
loading <- cbind(loading, pca$rotation[rel.genes,1:3])

gene.anno <- dbGetQuery(mongo, "entrez_genes", paste0("{id: {$in: [",paste(rel.genes, collapse = ","),"]}}"), skip = 0, limit = 0)
rownames(gene.anno) <- gene.anno$id
common.genes <- intersect(rownames(loading), rownames(gene.anno))
loading <- cbind(loading[common.genes,,drop=F], gene.anno[common.genes,,drop=F])
rownames(loading) <- NULL

Log(paste("Sending data..."))
json <- list(data = apply(points, 1, as.list),
             pev = 100*round(pca$sdev^2 / sum(pca$sdev^2),3),
             pevcum = 100*round(cumsum(pca$sdev^2) / sum(pca$sdev^2),3),
             metadata = apply(metadata, 1, as.list),
             loading = apply(loading, 1, as.list),
             parameters = parameters)
write(toJSON(json), out.file)
