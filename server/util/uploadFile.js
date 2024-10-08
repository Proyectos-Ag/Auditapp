const { ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage');
const { storage } = require('../config/firebase');
const sharp = require('sharp');

module.exports = async function uploadFile(file) {
    let fileBuffer = await sharp(file.buffer)
        .resize({fit: 'cover' })
        .toBuffer();

    const fileRef = ref(storage, `files/${file.originalname} ${Date.now()}`);

    const fileMetadata = {
        contentType: file.mimetype
    };

    const fileUploadPromise = uploadBytesResumable(
        fileRef,
        fileBuffer,
        fileMetadata
    );

    await fileUploadPromise;

    const fileDownloadURL = await getDownloadURL(fileRef);

    return { ref: fileRef, downloadURL: fileDownloadURL };
};