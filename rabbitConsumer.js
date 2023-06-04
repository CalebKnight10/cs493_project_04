const { QueueName, receiveFromQueue } = require('./lib/rabbitmq')
const { uploadNewThumbnailFromPhoto } = require("./models/photo");
const { connectToDb } = require('./lib/mongo')

connectToDb(async () => {
  setInterval(async () => {
    await receiveFromQueue(QueueName.PHOTOS, async (photoId) => {
      const thumbnailId = await uploadNewThumbnailFromPhoto(photoId)
      console.log(`Thumbnail created: ${thumbnailId} for photo: ${photoId}`)
    })
  }, 7500)
})