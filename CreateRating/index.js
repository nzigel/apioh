var request = require('request');
var rp = require('request-promise-native');
var documentClient = require('documentdb').DocumentClient;

if (process.env.DBENDPOINT==null) {
    require('env') // we are running locally load the environment variables
}

var config = {}
config.endpoint = process.env.DBENDPOINT;
config.primaryKey = process.env.DBKEY;

config.database = {
    "id": process.env.DBID
};

config.collection = {
    "id": process.env.DBCOL
};

var databaseUrl = `dbs/${config.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;
var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

var docObj = {
    "userId": "",
    "productId": "",
    "timestamp": new Date().toJSON().toString(),
    "locationName": "",
    "rating": 5,
    "userNotes": ""
}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.body && req.body.userId && req.body.productId && req.body.locationName && req.body.rating && req.body.userNotes) {

        var usrOptions = {
            uri: 'https://serverlessohlondonuser.azurewebsites.net/api/GetUser',
            qs: {
                userId: req.body.userId // -> uri + '?key=value'
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };
        
        var productOptions = {
            uri: 'https://serverlessohlondonproduct.azurewebsites.net/api/GetProduct',
            qs: {
                productId: req.body.productId // -> uri + '?key=value'
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };

        docObj.userId = req.body.userId;
        docObj.productId = req.body.productId;
        docObj.locationName = req.body.locationName;
        docObj.rating = req.body.rating;
        docObj.userNotes = req.body.userNotes;

        rp(usrOptions)
            .then(function (user) {
                if (docObj.userId==user.userId) {
                    // we have matched the user Id
                    console.log('User name', user.userName);
                    rp(productOptions)
                        .then(function (product) {
                            if (docObj.productId==product.productId) {
                                // we have matched the product Id
                                console.log('productName', product.productName);
                                console.log('productDescription', product.productDescription);
                                try {
                                    client.createDocument(collectionUrl, docObj, (err, created) => {
                                        if (err) { 
                                            context.res = {
                                                status: 400,
                                                body: "Error writing the review"
                                            };
                                            context.done();
                                        }
                                        else {
                                            context.res = {
                                                // status: 200, /* Defaults to 200 */
                                                body: JSON.stringify(docObj)
                                            };
                                            context.done();
                                        }
                                    });
                                }
                                catch(error) {
                                    context.res = {
                                        status: 400,
                                        body: "Error writing the review"
                                    };
                                    context.done();
                                }
                            }
                            else {
                                context.res = {
                                    status: 400,
                                    body: "productId "+docObj.productId+" not found"
                                };
                                context.done();
                            }
                        })
                        .catch(function (err) {
                            context.res = {
                                status: 400,
                                body: "productId "+docObj.productId+" not found"
                            };
                            context.done();
                        });

                }
                else {
                    context.res = {
                        status: 400,
                        body: "userId "+docObj.userId+" not found"
                    };
                    context.done();
                }
            })
            .catch(function (err) {
                context.res = {
                    status: 400,
                    body: "userId "+docObj.userId+" not found"
                };
                context.done();
            });
    }
    else {
        context.res = {
            status: 400,
            body: "Please post a userId, productId, locationName, rating and userNotes in the request body"
        };
        context.done();
    }
};