var nodeStatic = require('node-static');
var http = require('http');
var url = require('url');
var fs = require('fs');
var formidable = require('formidable');
var util = require('util');
var exec = require('child_process').exec;
var AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: '',
    secretAccessKey: ''
});

var staticServer = new(nodeStatic.Server)();

var port = Number(process.env.PORT || 8002);

http.createServer(function (req, res) {
    // Testing for public folder for static hosting
    var parts = url.parse(req.url, true, true);
    var folder = parts.path.substring(0,8);
    // console.log(folder);
    if(folder === '/public/') {
        // Inside public folder for static hosting
        staticServer.serve(req, res);
    } else {
        // not inside public folder for my implementation
        switch (true) {
            case parts.path === '/':
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
            case parts.path === '/upload':
                var form = new formidable.IncomingForm();
                form.keepExtensions = true;
                form.maxFileSize = 1024 * 1024 * 1024;
                form.parse(req, function(err, fields, files) {
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

                            fs.readFile('public/uploads/' + objFileNameWithoutExtension + '.drc', function(err, data) {
                                if (err) {
                                    res.writeHead(500, {
                                        'Content-Type': 'text/plain; charset=utf-8;'
                                    });
                                    return res.end(util.inspect(err));
                                }
                                const params = {
                                    Bucket: 'draco-encoder-decoder',
                                    Key: objFileNameWithoutExtension + '.drc',
                                    Body: data
                                };
                                s3.upload(params, function(s3Err, data) {
                                    if (s3Err) {
                                        res.writeHead(500, {
                                            'Content-Type': 'text/plain; charset=utf-8;'
                                        });
                                        return res.end(util.inspect(s3Err));
                                    }
                                    console.log('File uploaded successfully at ' + data.Location);
                                    res.writeHead(302, {'Location': '/display/?file=' + data.Location});
                                    res.end();
                                });
                            });
                        });
                    });
                });
                break;
            case parts.path.split('?')[0] === '/display/':
                // Read the index file and send it to the user
                fs.readFile('display.html', function(error, data) {
                    if(error) {
                        console.log('Error reading file :\n' + error);
                    } else {
                        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                        res.end(data);
                    }
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
