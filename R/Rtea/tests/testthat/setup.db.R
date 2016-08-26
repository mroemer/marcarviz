mongo <- RMongo::mongoDbConnect(host = "10.158.1.40", db = "rTests")
RMongo::dbAuthenticate(mongo, "rTester", "rTestPass")
