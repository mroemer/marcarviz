test_that("tag.treatments", {
  expect_equal(tag.treatments("treat", "study"), "treat")
  expect_equal(tag.treatments("treat", "study", force = F), "treat")
  expect_equal(tag.treatments("treat", "study", force = T), "treat (study)")
  expect_equal(tag.treatments(c("treat1","treat2","treat3"), "study"), c("treat1","treat2","treat3"))
  expect_equal(tag.treatments(c("treat1","treat2","treat3"), "study", force = T), c("treat1 (study)","treat2 (study)","treat3 (study)"))
  expect_equal(tag.treatments(c("treat1","treat2","treat3"), c("study1","study2","study3")), c("treat1 (study1)","treat2 (study2)","treat3 (study3)"))
  expect_equal(tag.treatments(c("treat1","treat2","treat3"), c("study1","study2","study3"), force = F), c("treat1 (study1)","treat2 (study2)","treat3 (study3)"))
})
