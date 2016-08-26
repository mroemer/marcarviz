source("setup.db.R")

test_that("get.treatment.metadata", {
  metadata <- get.treatment.metadata(studies = "BI_Mouse_CD1",
                                 treatments = "CFX_M_250ppm_4d",
                                 con = mongo)
  expect_true(nrow(metadata) == 1)
  expect_true(ncol(metadata) == 9)
  metadata <- get.treatment.metadata(studies = c("BI_Mouse_CD1","BI_Mouse_CD1"),
                                     treatments = c("CFX_M_250ppm_4d", "CFX_M_250ppm_15d"),
                                     con = mongo)
  expect_true(nrow(metadata) == 2)
  expect_true(ncol(metadata) == 1)
  expect_true(colnames(metadata) == "Time [d]")
})
