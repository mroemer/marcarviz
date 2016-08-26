test_that("get.enrichment.table", {
  diff.genes <- readLines("test-data/test_diffSymbols")
  all.genes <- readLines("test-data/test_allSymbols")
  gs.db <- "test-data/c2.cp.kegg.v5.0.symbols.gmt"
  p.cutoff <- 0.1
  gs.min.size <- 5
  gs.max.size <- 500
  pe <- get.enrichment.table(diff.genes, all.genes, gs.db, pvalue.cutoff = p.cutoff, drop.empty.sets = F,
                            gs.size.threshold.min = gs.min.size, gs.size.threshold.max = gs.max.size)
  expect_equal(pe$db[1], "KEGG")
  expect_equal(pe$pw[1], "Tyrosine metabolism")
  expect_equal(pe$p[1], 0.002877757, tolerance=1e-3)
  expect_equal(pe$q[1], 0.04866025, tolerance=1e-3)
  expect_equal(pe$nDiff[1], 4)
  expect_equal(pe$nGenes[1], 39)
  expect_equal(pe$nDiffTotal[1], 449)
  expect_equal(pe$nGenesTotal[1], 29444)
  expect_equal(pe$diffGenes[[1]], c("AOX1", "DCT", "DDC", "GOT1"))
  expect_equal(pe$link[1], "http://www.broadinstitute.org/gsea/msigdb/cards/KEGG_TYROSINE_METABOLISM")
  expect_true(all(pe$q < p.cutoff))
  expect_true(all(pe$p <= pe$q))
  expect_true(all(pe$nGenes > gs.min.size))
  expect_true(all(pe$nGenes < gs.max.size))
  expect_equal(length(unique(pe$nDiffTotal)), 1)
  expect_equal(length(unique(pe$nGenesTotal)), 1)
  expect_false(any(is.na(pe)))
  empty.pe <- get.enrichment.table(diff.genes, all.genes, gs.db, pvalue.cutoff = p.cutoff,
                            gs.size.threshold.min = gs.max.size + 1, gs.size.threshold.max = gs.max.size)
  expect_equal(nrow(empty.pe), 0)
  pe <- get.enrichment.table(diff.genes, all.genes, gs.db, pvalue.cutoff = p.cutoff, drop.empty.sets = T,
                             gs.size.threshold.min = gs.min.size, gs.size.threshold.max = gs.max.size)
  expect_true(all(pe$nDiff > 0))
  expect_false(any(is.na(pe)))
})
