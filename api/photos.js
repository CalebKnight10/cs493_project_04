/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')

const { validateAgainstSchema } = require('../lib/validation')
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById
} = require('../models/photo')

const router = Router()

/*
 * POST /photos - Route to create a new photo.
 */
// router.post('/', async (req, res) => {
//   if (validateAgainstSchema(req.body, PhotoSchema)) {
//     try {
//       const id = await insertNewPhoto(req.body)
//       res.status(201).send({
//         id: id,
//         links: {
//           photo: `/photos/${id}`,
//           business: `/businesses/${req.body.businessId}`
//         }
//       })
//     } catch (err) {
//       console.error(err)
//       res.status(500).send({
//         error: "Error inserting photo into DB.  Please try again later."
//       })
//     }
//   } else {
//     res.status(400).send({
//       error: "Request body is not a valid photo object"
//     })
//   }
// })

/*
* Post /photos using upload function
*/
router.post('/', upload.single('file'), async (req, res) => {
  req.body = { ...req.body, file: req.file }
  if (validateAgainstSchema(req.body, PhotoSchema)) {
    try {
      req.body.businessId = Number(req.body.businessId)
      await insertNewPhoto(req.body).then( id => {
        // get path for photo
        const extension = mime.extension(req.file.mimetype)
        const photoUrl = `/media/photos/${id}.${extension}`

        // get path for thumbnail
        const thumbUrl = `/media/thumbs/${id}.jpg`

        const businessId = req.body.businessId
        const businessUrl = `/businesses/${businessId}`

        res.status(201).send({
          id: id,
          links: {
            photo: photoUrl,
            business: businessUrl,
            thumbnail: thumbUrl
          }
        })
      })
    } catch (err) {
      console.error(err)
      res.status(500).send({
        error: "Error inserting photo into database.  Try again."
      })
    }
  } else {
    res.status(400).send({
      error: "Request body isn't a valid photo object"
    })
  }
})


/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
// router.get('/:id', async (req, res, next) => {
//   try {
//     const photo = await getPhotoById(req.params.id)
//     if (photo) {
//       res.status(200).send(photo)
//     } else {
//       next()
//     }
//   } catch (err) {
//     console.error(err)
//     res.status(500).send({
//       error: "Unable to fetch photo.  Please try again later."
//     })
//   }
// })

/*
* New route to fetch info on specific photo
*/

router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id)
    if (!photo) {
      return next()
    }
    const metadata = photo.metadata
    // Generate URLs for photo
    const extension = metadata.contentType.split('/').pop()
    const photoUrl = `/media/photos/${req.params.id}.${extension}`
    const thumbUrl = `/media/thumbs/${req.params.id}.jpg`
    console.log(photo)
    res.status(200).send({
      ...photo,
      links: {
        photo: photoUrl,
        thumbnail: thumbUrl
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again."
    })
  }
})

module.exports = router
