test_that("capitalize", {
  expect_equal(capitalize("example"), "Example")
  expect_equal(capitalize("another example"), "Another example")
  expect_equal(capitalize("thIrD exAMple"), "ThIrD exAMple")
  expect_equal(capitalize(c("example", "another example", "thIrD exAMple")),
               c("Example", "Another example", "ThIrD exAMple"))
})
