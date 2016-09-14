MARCARviz framework for analysis of gene expression data
========================================================

About
-----

This is a Node.js server for analysis and visualization of expression data (e.g., from Microarray or RNAseq experiments).

More information will be added soon. 

Setup
-----

MARCARviz has been tested with Windows 8.1 64bit and Ubuntu 14.04 LTS.

**Windows**

1. Clone the Git repository
2. [Install Nodejs](https://nodejs.org/en/download/), Python, and R
3. Go to the project directory and install the dependencies with the Node Package Manager

        npm install
        
4. Extract the inchlib_clust-0.1.4.zip
5. [Install the MongoDB server](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/) or create a config.json and change the db_host to point to the database server
6. Once the MongoDB server is running, start the MARCARviz server

        npm start

License
-------

MARCARviz is available under the MIT License

Copyright (c) 2016 Michael Römer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The MARCARviz uses JavaScript libraries that are free for personal and non-profit use. For other purposes, please make sure that you obtain the required licenses! These include, but are not limited to:

* HighCharts.js (http://www.highcharts.com/)

Contact
-------

Michael Römer (mroemer@posteo.de)
