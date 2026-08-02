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
        if (imageUrl.startsWith('data:image')) {
            return await uploadImageBuffer(imageUrl);
        }

        const imageBuffer = await fetchImageBufferWithRetry(imageUrl);
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

async function fetchImageBufferWithRetry(imageUrl, maxRetries = 3) {
    const browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.midjourney.com/'
    };

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                headers: browserHeaders,
                timeout: 15000
            });
            return Buffer.from(response.data);
        } catch (err) {
            lastError = err;
            console.warn(`⚠️ Image fetch attempt ${attempt}/${maxRetries} failed: ${err.message}`);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 2000 * attempt));
            }
        }
    }
    throw lastError;
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
    uploadImageBuffer,
    deleteImageFromAzure,
    generateSasUrl
};