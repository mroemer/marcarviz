#!/bin/sh
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
apt-get update
apt-get install gcc make npm nodejs-legacy build-essential python-dev python-setuptools python-numpy python-scipy libatlas-dev libatlas3gf-base libxml2-dev libcurl4-openssl-dev python-pip default-jdk mongodb-org-shell mongodb-org-tools
pip install -U scikit-learn
easy_install --upgrade fastcluster
unzip python/inchlib_clust-0.1.4.zip -d python
Rscript -e "install.packages(c('rjson', 'uuid', 'RMongo', 'argparser'), repos= 'http://cran.us.r-project.org')"
R CMD INSTALL R/Rtea/
npm install
