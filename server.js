var nodeStatic = require('node-static');
var http = require('http');
var url = require('url');
var fs = require('fs');
var formidable = require('formidable');
var util = require('util');
// var request = require('request');
// var mongo = require('mongodb');
var exec = require('child_process').exec;

var staticServer = new(nodeStatic.Server)();

var port = Number(process.env.PORT || 8000);
// MongoHQ Server Url 'mongodb://ishanatmuz:m7382in@kahana.mongohq.com:10045/youthVibe2014';
// var mongoUri = process.env.MONGOHQ_URL || 'mongodb://127.0.0.1:27017/youthVibe2014';
// var registrationKeys = [];
// var message = 'Default Message', title = 'Default Title', senderId = 'Default ID';

http.createServer(function (req, res) {
    // Testing for public folder for static hosting
    // console.log(req.url+'\n');
    var parts = url.parse(req.url, true, true);
    // console.log(parts);
    // console.log(parts.path);
    var folder = parts.path.substring(0,8);
    // console.log(folder);
    if(folder === '/public/') {
        // console.log('Inside public folder for static hosting.');
        staticServer.serve(req, res);
    } else {
        // res.end('not inside public folder for my implementation');
        // console.log(parts.path);

        switch (parts.path) {
            case '/':
                // Read the index file and send it to the user
                fs.readFile('index.html', function(error, data) {
                    if(error) {
                        console.log('Error reading file :\n' + error);
                    } else {
                        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                        res.end(data);
                    }
                });
                break;
            case '/upload':
                var form = new formidable.IncomingForm();
                form.keepExtensions = true;
                form.maxFileSize = 1024 * 1024 * 1024;
                form.parse(req, function(err, fields, files) {
                    // res.writeHead(200, {'content-type': 'text/plain'});
                    // if(fields.RegistrationID === undefined) {
                    //     res.end('Oops Something went wrong. There was no registration ID detected for your device.\nPlease contact the administrators.');
                    // } else {
                    //     // MongoDB server connection to store IDs
                    //     mongo.Db.connect(mongoUri, function (err, db) {
                    //         db.collection('userIds', function(err, collection) {
                    //             collection.insert({'id': fields.RegistrationID, 'facebookId': fields.FacebookID, 'name': fields.Name, 'email': fields.Email}, {safe: true}, function(err, rs) {
                    //                 if(err) {
                    //                     res.end("\nUser Registration Failed.\n" + err);
                    //                 } else if(rs) {
                    //                     res.end("\nUser Registered successfully :\nRegistration ID : " + fields.RegistrationID + "\n\nResult : \n" + rs);
                    //                 }
                    //             });
                    //         });
                    //     });
                    // }

                    var objFile = files['obj_file'];
                    fs.createReadStream(objFile.path).pipe(
                        fs.createWriteStream('public/uploads/' + objFile.name)
                    ).on('error', function(error) {
                        res.writeHead(500, {
                            'Content-Type': 'text/plain; charset=utf-8;'
                        });
                        return res.end(util.inspect(error));
                    }).on('finish', function() {
                        var objFileNameWithoutExtension = objFile.name.split('.')[0];
                        // exec(command, function(error, stdout, stderr){ callback(stdout); });
                        console.log('./draco_build/draco_encoder -i public/uploads/' + objFile.name + ' -o ' + objFileNameWithoutExtension + '.drc');
                        exec('./draco_build/draco_encoder -i public/uploads/' + objFile.name + ' -o public/uploads/' + objFileNameWithoutExtension + '.drc', function(error, stdout, stderr) {
                            if (error) {
                                res.writeHead(400, {
                                    'Content-Type': 'text/plain; charset=utf-8;'
                                });
                                return res.end(util.inspect(stdout));
                            }

                            res.writeHead(302, {'Location': '/display/?file=' + objFileNameWithoutExtension});
                            res.end();
                        });
                    });
                });
                break;
            default:
                console.log("Sorry, we are out of " + parts.path + ".");
                res.writeHead(404, {'content-type': 'text/plain'});
                res.end("Sorry, we are out of " + parts.path + ".");
        }
    }
}).listen(port);

console.log("Started the server on port " + port);