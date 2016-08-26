source("setup.db.R")

test_that("fetch.data", {
  fc.cutoff <- 1
  p.cutoff <- 0.05
  #### TEST 1 ####
  data <- fetch.data(studies = "BI_Mouse_CD1",
                     treatments = "CFX_M_250ppm_4d",
                     con = mongo,
                     fc.cutoff = fc.cutoff,
                     p.cutoff = p.cutoff, filter.type = "and")
  expect_equal(length(data$probes), 154)
  expect_true(length(data$probes) == nrow(data$fold.changes))
  expect_equal(ncol(data$fold.changes), 1)
  expect_equal(colnames(data$fold.changes), "CFX_M_250ppm_4d")
  expect_true(length(data$probes) == nrow(data$p.values))
  expect_equal(ncol(data$p.values), 1)
  expect_equal(colnames(data$p.values), "CFX_M_250ppm_4d")
  expect_true(length(data$probes) == nrow(data$anno))
  expect_equal(head(sort(data$probes)),
               c("102022", "11671", "116939", "117167", "11761", "11801"))
  expect_true(all(abs(data$fold.changes) >= fc.cutoff))
  expect_true(all(abs(data$p.values) <= fc.cutoff))
  expect_true(nrow(data$anno) == length(data$probes))

  #### TEST 2 ####
  data2 <- fetch.data(studies = "BI_Mouse_CD1",
                      treatments = "CFX_M_250ppm_4d",
                      con = mongo,
                      fc.cutoff = fc.cutoff, with.anno = F,
                      p.cutoff = p.cutoff, filter.type = "and")
  expect_equal(length(data2$probes), 154)
  expect_true(is.null(data2$anno))

  #### TEST 3 ####
  data3 <- fetch.data(studies = "BI_Mouse_CD1",
                      treatments = "CFX_M_250ppm_4d",
                      con = mongo, with.data = F,
                      fc.cutoff = fc.cutoff, with.anno = F,
                      p.cutoff = p.cutoff, filter.type = "and")
  expect_equal(length(data3$probes), 154)
  expect_true(is.null(data3$anno))
  expect_true(is.null(data3$fold.changes))
  expect_true(is.null(data3$p.values))

  #### TEST 4 ####
  data4 <- fetch.data(studies = "NOV_Mouse_CAR",
                      treatments = "CAR/PXR KO_PB_119d",
                      con = mongo,
                      fc.cutoff = 0,
                      p.cutoff = 1, filter.type = "and")
  expect_true(length(data4$probes) == nrow(data4$fold.changes))
  expect_equal(ncol(data4$fold.changes), 1)
  expect_equal(colnames(data4$fold.changes), "CAR/PXR KO_PB_119d")
  expect_true(length(data4$probes) == nrow(data4$p.values))
  expect_equal(ncol(data4$p.values), 1)
  expect_equal(colnames(data4$p.values), "CAR/PXR KO_PB_119d")

  #### TEST 5 ####
  data5 <- fetch.data(studies = "NOV_Mouse_CAR",
                      treatments = "CAR/PXR KO_PB_91d",
                      con = mongo,
                      fc.cutoff = 1,
                      p.cutoff = 0.05, filter.type = "and")
  expect_true(length(data5$probes) == nrow(data5$fold.changes))
  expect_equal(ncol(data5$fold.changes), 1)
  expect_equal(colnames(data5$fold.changes), "CAR/PXR KO_PB_91d")
  expect_true(length(data5$probes) == nrow(data5$p.values))
  expect_equal(ncol(data5$p.values), 1)
  expect_equal(colnames(data5$p.values), "CAR/PXR KO_PB_91d")

  #### TEST 6 ####
  data6 <- fetch.data(studies = "BI_Mouse_CD1",
                      treatments = "DMN_F_2ppm_4d",
                      con = mongo,
                      ids = c(10395, 131566),
                      fc.cutoff = 0, species = NULL,
                      p.cutoff = NULL, filter.type = "or")
  expect_true(length(data6$probes) == 2)

  #### TEST 7 ####
  test7.studies <- c("NOV_Mouse_13wk_PB", "NOV_Mouse_CAR", "NOV_Mouse_CAR", "UD_Mouse_4w", "NOV_Mouse_CAR", "LUB_Mouse_3m_PB")
  data7 <- fetch.data(studies = test7.studies,
                      treatments =c("PB_28d","CAR/PXR KO_PB_28d","hCAR/hPXR_PB_28d","PB_28d","WT_PB_28d","PB_28d"),
                      con = mongo, filter.type = "or", fc.cutoff = fc.cutoff, p.cutoff = NULL)
  expect_equal(data7$studies, sort(test7.studies))
})
