const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

if (!connectionString || !containerName) {
    console.error('Azure Storage configuration missing in environment variables');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

/**
 * פונקציה חדשה: מעלה תמונה מפורמט Base64 או Buffer (מתאים ל-Weather)
 */
async function uploadImageBuffer(dataString, username = 'user') {
    try {
        // פירוק ה-Base64 ל-Buffer
        const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let contentType;

        if (matches) {
            contentType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // אם זה כבר Buffer
            buffer = dataString;
            contentType = 'image/png';
        }

        const fileName = `weather-${username}-${uuidv4()}.png`;
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        return await generateSasUrl(fileName);
    } catch (error) {
        console.error('Error uploading buffer to Azure:', error.message);
        throw error;
    }
}

/**
 * מוריד תמונה מ-URL ומעלה אותה ל-Azure (הפונקציה המקורית שלך)
 */
async function uploadImageFromUrl(imageUrl, originalFilename = null) {
    try {
        // בדיקה אם ה-URL הוא בעצם Base64 (קורה בנתיב ה-Weather)
        if (imageUrl.startsWith('data:image')) {
            return await uploadImageBuffer(imageUrl);
        }

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        const fileExtension = imageUrl.split('.').pop().split('?')[0] || 'png';
        const blobName = originalFilename || `${uuidv4()}.${fileExtension}`;

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(imageBuffer, {
            blobHTTPHeaders: { blobContentType: `image/${fileExtension}` }
        });

        return await generateSasUrl(blobName);
    } catch (error) {
        console.error('Error uploading image from URL:', error.message);
        throw error;
    }
}

async function generateSasUrl(blobName) {
    try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const expiresOn = new Date();
        expiresOn.setFullYear(expiresOn.getFullYear() + 10);

        const sasToken = generateBlobSASQueryParameters({
            containerName: containerName,
            blobName: blobName,
            permissions: BlobSASPermissions.parse("r"),
            expiresOn: expiresOn,
        }, blobServiceClient.credential).toString();

        return `${blockBlobClient.url}?${sasToken}`;
    } catch (error) {
        throw error;
    }
}

async function deleteImageFromAzure(blobUrl) {
    try {
        const urlParts = blobUrl.split('/');
        const blobName = urlParts[urlParts.length - 1].split('?')[0];
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
    } catch (error) {
        throw error;
    }
}

module.exports = {
    uploadImageFromUrl,
    uploadImageBuffer, // ייצוא הפונקציה החדשה
    deleteImageFromAzure,
    generateSasUrl
};