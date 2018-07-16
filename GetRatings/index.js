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

function stripInternalProperties(res) {

    // strip off the internal documentDB properties
    if(res.hasOwnProperty('_rid')){
        delete res['_rid'];
    }
    if(res.hasOwnProperty('_self')){
        delete res['_self'];
    }
    if(res.hasOwnProperty('_etag')){
        delete res['_etag'];
    }
    if(res.hasOwnProperty('_attachments')){
        delete res['_attachments'];
    }
    if(res.hasOwnProperty('_ts')){
        delete res['_ts'];
    }
    return res;
}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.userId) {
        client.queryDocuments(
            collectionUrl,
            'SELECT * FROM c where c.userId = "'+req.query.userId+'"'
            ).toArray((err, results) => {
                if (results.length>0){
                    // we found one or more matching reviews for the user

                    for (var i = 0, len = results.length; i < len; i++) {
                        results[i] = stripInternalProperties(results[i]);
                    }
                  
                    context.res = {
                        // status: 200, /* Defaults to 200 */
                        body: JSON.stringify(results)
                    };
                    context.done();

                }
                else {
                    context.res = {
                        status: 404,
                        body: "No reviews are found with userId "+req.query.userId
                    };
                    context.done();
                }
            });
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a userId on the query string"
        };
        context.done();
    }
    
};