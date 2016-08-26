test_that("read.gmt", {
  min.gs.size <- 5
  max.gs.size <- 100
  gs <- read.gmt("test-data/c2.cp.kegg.v5.0.symbols.gmt",
                 gs.size.threshold.min = min.gs.size,
                 gs.size.threshold.max = max.gs.size)
  expect_true(all(sapply(gs, length) > min.gs.size))
  expect_true(all(sapply(gs, length) < max.gs.size))
  expect_equal(length(gs$KEGG_CITRATE_CYCLE_TCA_CYCLE), 32)
  expect_equal(gs$KEGG_TAURINE_AND_HYPOTAURINE_METABOLISM,
               c("GGT7", "CSAD", "GGT5", "GGT1", "GAD1", "BAAT", "GAD2", "GGT6", "CDO1", "ADO"))
})
