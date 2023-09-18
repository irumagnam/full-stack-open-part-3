require('dotenv').config()
const mongoose = require('mongoose')

const url = process.env.MONGODB_URI_NOTE_APP

console.log('connecting to', url)

mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const noteSchema = new mongoose.Schema({
  content: String,
  important: Boolean,
})

noteSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Note = mongoose.model('Note', noteSchema)

if (process.argv.length === 3) {
  Note.find({}).then(result => {
    console.log('notes:')
    result.forEach(n => console.log(n))
    mongoose.connection.close()
  })
}

if (process.argv.length > 3) {
  const newNote = new Note({
    content: process.argv[3],
    important: process.argv[4] || false,
  })

  newNote.save().then(result => {
    console.log('note saved')
    mongoose.connection.close()
  })
}
