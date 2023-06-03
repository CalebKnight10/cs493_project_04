const { Router } = require('express')
const { downloadPhotoById} = require("../models/photo");
const { containsPhoto } = require("../models/photo");
const router = Router()


/*
* Download jpg
*/
router.get('/photos/:id.jpg', async (req, res, next) => {
  try {
    if (!await containsPhoto(req.params.id)) {
      res.status(404).send({
        error: "Photo not found."
      })
      return
    }
    await downloadPhotoById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo."
    })
  }
})

/*
* Download jpeg
*/
router.get('/photos/:id.jpeg', async (req, res, next) => {
  try {
    if (!await containsPhoto(req.params.id)) {
      res.status(404).send({
        error: "Photo not found."
      })
      return
    }
    await downloadPhotoById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo."
    })
  }
})
  
/*
* Donwnload png
*/  
router.get('/photos/:id.png', async (req, res, next) => {
  try {
    if (!await containsPhoto(req.params.id)) {
      res.status(404).send({
        error: "Photo not found."
      })
      return
    }
    await downloadPhotoById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo."
    })
  }
})