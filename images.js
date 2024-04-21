const { Storage } = require('@google-cloud/storage');

// create methods for any other js file to use\

// create a new storage instance

const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// upload a file to the bucket

function uploadFile(file, destination, callback) {
    bucket.upload(file, {
        destination: destination
    },

    function(err, file) {


        

        if(!err){
            file.makePublic().then(() => {
                console.log(`gs://${bucket.name}/${file.name} is now public.`);

                // get the public url
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-17-2025'
                }).then(signedUrls => {
                    callback(err, signedUrls[0]);
                });
            });
        }
    }
    );
}

function retrieveFiles(amount, callback){
    // retrieve the files, but return the public url
    bucket.getFiles().then(results => {
        const files = results[0];
        let fileUrls = [];
        let counter = 0;

        files.forEach(file => {
            file.getSignedUrl({
                action: 'read',
                expires: '03-17-2025'
            }).then(signedUrls => {

                // strip query string from url
                signedUrls[0] = signedUrls[0].split("?")[0];

                fileUrls.push(signedUrls[0]);
                counter++;

                if(counter == files.length){
                    callback(fileUrls);
                }
            });
        });
    });
}

module.exports = {
    uploadFile, retrieveFiles
}