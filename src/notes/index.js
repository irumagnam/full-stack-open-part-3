require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Note = require('./models/note')
const app = express()

// allow CORS (Corss-Origin-Resource-Sharing)
app.use(cors())

// register assets folder
app.use(express.static('dist/notes'))

// register json parser
app.use(express.json())

// register request logger
morgan.token('req-body', function getRequestBody (req) {
  return (req.method === 'POST' || req.method === 'PUT')
    ? JSON.stringify(req.body)
    : ' '
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'))

app.get('/api/notes', (request, response, next) => {
  Note.find({})
    .then(notes => {
      console.log('found', notes.length, 'notes')
      response.json(notes)
    })
    .catch(error => next(error))
})

app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        console.log('found', note)
        response.json(note)
      } else {
        console.log('not found')
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.post('/api/notes', (request, response, next) => {
  // gather request data
  const reqData = request.body

  // run validations
  if (!reqData.content) {
    const respData = {
      error: 'content missing'
    }
    console.log('validation failed', respData)
    response.status(400).json(respData)
    return
  }

  // construct new note
  const note = new Note({
    content: reqData.content,
    important: reqData.important || false,
  })

  // add new note to database
  note.save()
    .then(savedNote => {
      console.log('note saved to database')
      response.json(savedNote)
    })
    .catch(error => next(error))
})

app.put('/api/notes/:id', (request, response, next) => {
  // gather request data
  const noteId = request.params.id
  const note = {
    content: request.body.content,
    important: request.body.important,
  }

  // update note in the backend
  Note.findByIdAndUpdate(noteId, note, { new: true, runValidators: true, context: 'query' })
    .then(updatedNote => {
      console.log('note updated in database')
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// handler of requests with unknown endpoint
app.use((request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
})

// handler of requests with result to errors
// this has to be the last loaded middleware.
app.use((error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({
      error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({
      error: error.message })
  }

  next(error)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})