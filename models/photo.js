/*
 * Photo schema and data accessor methods.
 */

const { ObjectId } = require('mongodb')
const { GridFSBucket } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { sendToQueue } = require('../lib/rabbitmq')
const { QueueName } = require('../lib/rabbitmq')
const fs = require("fs");
const Jimp = require('jimp');


/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
// async function insertNewPhoto(photo) {
//   photo = extractValidFields(photo, PhotoSchema)
//   photo.businessId = ObjectId(photo.businessId)
//   const db = getDbReference()
//   const collection = db.collection('photos')
//   const result = await collection.insertOne(photo)
//   return result.insertedId
// }
// exports.insertNewPhoto = insertNewPhoto


/*
* New insertPhoto function using example from exploration
*/

async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema)
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const metadata = {
    contentType: photo.file.mimetype,
    businessId: photo.businessId,
    caption: photo.caption
  }
  return new Promise(resolve => {
    fs.createReadStream(photo.file.path).pipe(bucket.openUploadStream(photo.file.originalname, {
          chunkSizeBytes: 512,
          metadata: metadata
        })
    ).on('finish', async function (result) {
      console.log(result)
      await sendToQueue(QueueName.PHOTOS, result._id.toString())
      resolve(result._id)
    })
  })
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */

async function getPhotoById(id) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const cursor = bucket.find({ _id: new ObjectId(id) })
  const results = await cursor.toArray()
  return results[0]
}

exports.getPhotoById = getPhotoById


async function containsPhoto(id) {
  if (!ObjectId.isValid(id)) {
    return false
  }
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const cursor = bucket.find({ _id: new ObjectId(id) })
  const results = await cursor.toArray()
  return results.length > 0
}

exports.containsPhoto = containsPhoto


async function containsThumbnail(id) {
  if (!ObjectId.isValid(id)) {
    return false
  }
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const cursor = bucket.find({ _id: new ObjectId(id) })
  const results = await cursor.toArray()
  return results.length > 0
}

exports.containsThumbnail = containsThumbnail


async function downloadPhotoById(id, outputFile) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const downStream = bucket.openDownloadStream(new ObjectId(id))
  downStream.pipe(outputFile)
}

exports.downloadPhotoById = downloadPhotoById


async function getThumbnailById(id) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const cursor = bucket.find({ _id: new ObjectId(id) })
  const results = await cursor.toArray()
  return results[0]
}

exports.getThumbnailById = getThumbnailById


async function downloadThumbnailById(id, outputFile) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const downStream = bucket.openDownloadStream(new ObjectId(id))
  downStream.pipe(outputFile)
}

exports.downloadThumbnailById = downloadThumbnailById


/*
* Download photo by id
*/
async function getDownloadedPhotoFileById(id, fileLocation) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const downloadStream = bucket.openDownloadStream(new ObjectId(id))

  return new Promise(resolve => {
    downloadStream.on('data', (chunk) => {
      fs.appendFileSync(fileLocation, chunk);
    })
    downloadStream.on('end', () => {
      resolve(fileLocation)
    })
  })
}

exports.getDownloadedPhotoFileById = getDownloadedPhotoFileById

/*
* Transform a photo to pixels to use as thumbnail
*/
async function transformPhotoToPixels(photoFilePath, width, height) {
  const image = await Jimp.read(photoFilePath)
  const newPhotoFilePath = `/tmp/${photoFilePath}`
  return new Promise(resolve => {
    image.resize(width, height).write(newPhotoFilePath, () => {
      resolve(newPhotoFilePath)
    })
  })
}

exports.transformPhotoToPixels = transformPhotoToPixels


/*
* Upload thumbnail
*/
async function uploadNewThumbnailFromPhoto(photoId) {
  // Retrieve photo and scale it down to 100x100px
  const photo = await getDownloadedPhotoFileById(photoId, `/tmp/${photoId}.jpg`)
  const transformedFilePath = await transformPhotoToPixels(photo, 100, 100)
  const photoMetadata = await getPhotoById(photoId)

  // Get a reference to the database and to the bucket
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const metadata = {
    contentType: 'image/jpeg',
  }

  // Upload the scaled thumbnail to the database
  return new Promise(resolve => {
    // openUploadStream parameter filename might be better not to be a photoId
    fs.createReadStream(transformedFilePath).pipe(bucket.openUploadStreamWithId(new ObjectId(photoId), photoMetadata.filename, {
          chunkSizeBytes: 512,
          metadata: metadata
        })
    ).on('finish', function (result) {
      console.log(result)
      resolve(result._id)
    })
  })
}

exports.uploadNewThumbnailFromPhoto = uploadNewThumbnailFromPhoto
