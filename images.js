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


        callback(err, file);

        if(!err){
            file.makePublic().then(() => {
                console.log(`gs://${bucket.name}/${file.name} is now public.`);
            });
        }
    }
    );
}

module.exports = {
    uploadFile
}