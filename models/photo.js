/*
 * Photo schema and data accessor methods.
 */

const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const fs = require("fs");

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
  const collection = db.collection('photos')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray()
    return results[0]
  }
}
exports.getPhotoById = getPhotoById


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